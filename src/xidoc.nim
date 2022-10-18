from std/htmlgen as htg import nil
import std/options
import std/sequtils
import std/sets
import std/strformat
import std/strutils
import std/tables
import xidocpkg/commands/default
import xidocpkg/commands/utils
import xidocpkg/error
import xidocpkg/expand
import xidocpkg/translations
import xidocpkg/types

export XidocError

const extensions = [
  tHtml: "html",
  tLatex: "tex",
  tGemtext: "gmi",
]

proc renderXidoc*(body: string, path = "", target = tHtml, snippet = false, safeMode = false, verbose = false, colorfulError = false): string =
  let doc = Document(
    body: body,
    target: target,
    snippet: snippet,
    safeMode: safeMode,
    verbose: verbose,
    stack: @[Frame(
      cmdName: "[top]",
      path: some(path),
    )]
  )
  doc.stack[0].commands = defaultCommands(doc)
  let rendered =
    try: doc.renderStr(doc.body)
    except XidocError:
      xidocError getCurrentException().XidocError.format(doc, termColors = colorfulError)
  if snippet:
    # TODO: some way to get doc.addToHead
    return rendered
  else:
    if doc.target == tHtml and doc.addToStyle.len != 0:
      doc.addToHead.incl htg.style(doc.addToStyle.toSeq.join)
    let head = doc.addToHead.toSeq.join
    case doc.target
    of tHtml:
      let lang = translate(pHtmlLanguageCode, doc.lookup(lang))
      &"""<!DOCTYPE html><html lang="{lang}"><head><meta charset="utf-8"><meta name="generator" content="xidoc"><meta name="viewport" content="width=device-width,initial-scale=1">{head}</head><body>{rendered}</body></html>"""
    of tLatex:
      let lang = translate(pLatexLanguageName, doc.lookup(lang))
      "documentclass"{doc.settings.getOrDefault("document-class", "article")} &
      "usepackage"["utf8"]{"inputenc"} &
      "usepackage"[lang]{"babel"} &
      "usepackage"{"geometry"} &
      head &
      "begin"{"document"} &
      rendered &
      "end"{"document"}
    of tGemtext:
      &"{head}{rendered}"

when isMainModule and not defined(js):
  import cligen
  import std/os
  import std/terminal

  proc xidoc(target = tHtml, snippet = false, safe = false, verbose = false, paths: seq[string]) =

    var error = false

    proc renderFile(path: string, input, output: File) =
      try:
        output.writeLine renderXidoc(
          input.readAll,
          path = path,
          target = target,
          snippet = snippet,
          safeMode = safe,
          verbose = verbose,
          colorfulError = stderr.isATty,
        )
        if path != "":
          stderr.writeLine "Rendered file $1" % path
      except XidocError:
        stderr.writeLine getCurrentException().msg
        error = true

    if paths.len == 0:
      renderFile("", stdin, stdout)
    else:
      for path in paths:
        let outputPath = path.changeFileExt(extensions[target])
        try:
          let input = open(path, fmRead)
          try:
            let output = open(outputPath, fmWrite)
            try:
              renderFile(path, input, output)
            finally:
              output.close
          except IOError:
            stderr.writeLine "Cannot open file $1 for writing" % outputPath
            error = true
          finally:
            input.close
        except IOError:
          stderr.writeLine "Cannot open file $1" % path
          error = true

    if error:
      quit(QuitFailure)

  dispatch xidoc,
    help = {
      "target": "what language to transpile to; one of \"html\", \"latex\", \"gemtext\"",
      "snippet": "generate just a code snippet instead of a whole document; useful for embedding",
      "safe": "only allow commands that are known to not be vulnerable to injection attacks",
      "verbose": "show more detailed errors",
    },
    short = {
      "target": 't',
      "snippet": 's',
      "safe": 'S',
      "verbose": 'v',
    }

elif defined(js): # JavaScript library

  import std/jsffi

  type
    XidocResult {.exportc.} = object
      case success*: bool
      of true:
        markup*: cstring
      of false:
        err*: cstring

  proc renderXidocJs(body: cstring, config: JsObject): XidocResult {.exportc: "renderXidoc".} =
    let config =
      if config == jsUndefined: newJsObject()
      else: config
    try:
      let rendered = renderXidoc(
        $body,
        snippet = config.snippet.to(bool),
        safeMode = config.safeMode.to(bool),
        verbose = config.verbose.to(bool),
      )
      return XidocResult(success: true, markup: rendered.cstring)
    except XidocError:
      return XidocResult(success: false, err: getCurrentException().msg)

  {.emit: "export {renderXidoc};".}

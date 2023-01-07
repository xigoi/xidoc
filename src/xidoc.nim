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

export FormattedXidocError

const extensions = [
  tHtml: "html",
  tLatex: "tex",
  tGemtext: "gmi",
]

proc renderXidoc*(body: string, path = "", target = tHtml, snippet = false, safeMode = false, verbose = false, colorfulError = false): string =
  let bodyRef = new string
  bodyRef[] = body
  let doc = Document(
    body: bodyRef,
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
    try: doc.renderStr
    except XidocError:
      raise getCurrentException().XidocError.format(doc, termColors = colorfulError)
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

    proc renderFile(path, input: string): string =
      result = renderXidoc(
        input,
        path = path,
        target = target,
        snippet = snippet,
        safeMode = safe,
        verbose = verbose,
        colorfulError = stderr.isATty,
      )
      if path != "":
        stderr.writeLine "Rendered file $1" % path

    var error = false
    if paths.len == 0:
      try:
        stdout.writeLine(renderFile("", stdin.readAll))
      except FormattedXidocError:
        stderr.writeLine getCurrentException().msg
        error = true
    else:
      for path in paths:
        let outputPath = path.changeFileExt(extensions[target])
        try:
          let rendered = renderFile(path, readFile(path))
          writeFile(outputPath, rendered)
        except IOError, FormattedXidocError:
          stderr.writeLine getCurrentException().msg
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

  proc renderXidocJs(body: cstring, config: JsObject): cstring {.exportc: "renderXidoc".} =
    try:
      let config =
        if config == jsUndefined: newJsObject()
        else: config
      let rendered = renderXidoc(
        $body,
        snippet = config.snippet.to(bool),
        safeMode = config.safeMode.to(bool),
        verbose = config.verbose.to(bool),
        colorfulError = false,
      )
      return rendered.cstring
    except FormattedXidocError:
      {.emit: ["throw ", getCurrentExceptionMsg().cstring].}

  {.emit: "export {renderXidoc};".}

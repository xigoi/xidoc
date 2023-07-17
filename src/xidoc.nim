from std/htmlgen as htg import nil
import std/htmlparser
import std/options
import std/sequtils
import std/sets
import std/strformat
import std/strutils
import std/xmltree
import xidocpkg/commands/default
import xidocpkg/commands/utils
import xidocpkg/error
import xidocpkg/expand
import xidocpkg/string_view
import xidocpkg/translations
import xidocpkg/types

export FormattedXidocError

type
  TargetEx = enum
    teHtml = "html"
    teLatex = "latex"
    teGemtext = "gemtext"
    teSvg = "svg"

const extensions = [
  teHtml: "html",
  teLatex: "tex",
  teGemtext: "gmi",
  teSvg: "svg",
]

const targetMapping = [
  teHtml: tHtml,
  teLatex: tLatex,
  teGemtext: tGemtext,
  teSvg: tHtml,
]

proc renderXidoc*(body: string, path = "", target = teHtml, snippet = false, safeMode = false, verbose = false, colorfulError = false): string =
  let bodyRef = new string
  bodyRef[] = body
  let doc = Document(
    body: bodyRef,
    target: targetMapping[target],
    snippet: snippet,
    safeMode: safeMode,
    verbose: verbose,
    stack: @[Frame(
      cmdName: "[top]".toStringView,
      path: some(path),
    )]
  )
  doc.stack[0].commands = defaultCommands(doc)
  let rendered =
    try: doc.renderBody
    except XidocError:
      raise getCurrentException().XidocError.format(doc, termColors = colorfulError)
  if snippet:
    # TODO: some way to get doc.addToHead
    return rendered
  else:
    if target == teHtml and doc.addToStyle.len != 0:
      doc.addToHead.incl htg.style(doc.addToStyle.toSeq.join)
    let head = doc.addToHead.toSeq.join
    case target
    of teHtml:
      let lang = translate(pHtmlLanguageCode, doc.lookup(lang))
      &"""<!DOCTYPE html><html lang="{lang}"><head><meta charset="utf-8"><meta name="generator" content="xidoc"><meta name="viewport" content="width=device-width,initial-scale=1">{head}</head><body>{rendered}</body></html>"""
    of teLatex:
      let lang = translate(pLatexLanguageName, doc.lookup(lang))
      let documentClass =
        if doc.settings.documentClass == "": "article"
        else: doc.settings.documentClass
      let documentClassLine =
        if doc.settings.documentClassOptions == "":
          "documentclass"{documentClass}
        else:
          "documentclass"[doc.settings.documentClassOptions]{documentClass}
      documentClassLine &
      "usepackage"["utf8"]{"inputenc"} &
      "usepackage"[lang]{"babel"} &
      "usepackage"{"geometry"} &
      head &
      "begin"{"document"} &
      rendered &
      "end"{"document"}
    of teGemtext:
      &"{head}{rendered}"
    of teSvg:
      let svgs = htg.`div`(rendered).parseHtml.findAll("svg")
      if svgs.len != 1:
        raise XidocError(msg: &"When compiling to SVG, exactly one <svg> element must be produced, found {svgs.len}").format(doc, termColors = colorfulError)
      $svgs[0]

when isMainModule and not defined(js):
  import cligen
  import std/os
  import std/terminal

  proc xidoc(target = teHtml,
             snippet = false,
             safe = false,
             dryRun = false,
             noColor = false,
             forceStdin = false,
             paths: seq[string]) =

    proc renderFile(path, input: string): string =
      result = renderXidoc(
        input,
        path = path,
        target = target,
        snippet = snippet,
        safeMode = safe,
        colorfulError = (not noColor) and
                        stderr.isATty and
                        getEnv("NO_COLOR") == "",
      )
      if path != "":
        stderr.writeLine "Rendered file $1" % path

    var error = false
    if forceStdin or paths.len == 0:
      try:
        let path =
          if paths.len == 0: ""
          else: paths[0]
        let rendered = renderFile(path, stdin.readAll)
        if not dryRun:
          stdout.writeLine(rendered)
      except FormattedXidocError:
        stderr.writeLine getCurrentException().msg
        error = true
    else:
      for path in paths:
        let outputPath = path.changeFileExt(extensions[target])
        try:
          let rendered = renderFile(path, readFile(path))
          if not dryRun:
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
      "dry-run": "do not write anything, just check for errors",
      "no-color": "disable colorful error messages (also disabled when STDERR is not a TTY or when the NO_COLOR environment variable is present)",
      "force-stdin": "read from STDIN even if a filename is specified; in that case, it will be used as the path for the document"
    },
    short = {
      "target": 't',
      "snippet": 's',
      "safe": 'S',
      "dry-run": 'd',
      "no-color": 'C',
      "force-stdin": '\0',
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

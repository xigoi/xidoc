from std/htmlgen as htg import nil
import std/options
import std/os
import std/sequtils
import std/sets
import std/strutils
import xidocpkg/commands/default
import xidocpkg/error
import xidocpkg/expand
import xidocpkg/translations
import xidocpkg/types

const extensions = [
  tHtml: "html",
  tLatex: "tex",
  tGemtext: "gmi",
]
const templates = [
  tHtml: """<!DOCTYPE html><html lang="$3"><head><meta charset="utf-8"><meta name="generator" content="xidoc"><meta name="viewport" content="width=device-width,initial-scale=1">$1</head><body>$2</body></html>""",
  tLatex: """\documentclass{article}\usepackage[utf8]{inputenc}\usepackage[$3]{babel}\usepackage{geometry}$1\begin{document}$2\end{document}""",
  tGemtext: "$1$2",
]

when isMainModule and not defined(js):
  import cligen
  import std/terminal

  proc xidoc(target = tHtml, snippet = false, verbose = false, paths: seq[string]) =

    proc renderFile(path: string, input, output: File) =
      let doc = Document(
        body: input.readAll,
        target: target,
        snippet: snippet,
        verbose: verbose,
        stack: @[Frame(
          cmdName: "[top]",
          path: some(path),
        )]
      )
      doc.stack[0].commands = defaultCommands(doc)
      try:
        let rendered = doc.renderStr(doc.body)
        if snippet:
          # TODO: some way to get doc.addToHead
          output.writeLine rendered
        else:
          if doc.target == tHtml and doc.addToStyle.len != 0:
            doc.addToHead.incl htg.style(doc.addToStyle.toSeq.join)
          let languageString =
            case target
            of tHtml:
              translate(pHtmlLanguageCode, doc.lookup(lang))
            of tLatex:
              translate(pLatexLanguageName, doc.lookup(lang))
            else:
              ""
          output.writeLine templates[target] % [doc.addToHead.toSeq.join, rendered, languageString]
        if path != "":
          stderr.writeLine "Rendered file $1" % path
      except XidocError:
        stderr.writeLine getCurrentException().XidocError.format(doc, termColors = stderr.isATty)

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
          finally:
            input.close
        except IOError:
          stderr.writeLine "Cannot open file $1" % path

  dispatch xidoc, help = {
    "target": "what language to transpile to; one of \"html\", \"latex\", \"gemtext\"",
    "snippet": "generate just a code snippet instead of a whole document; useful for embedding",
    "verbose": "show more detailed errors",
  }

else: # when library

  proc newDocument(body: cstring, target = tHtml, snippet = false, verbose = false): Document {.exportc.} =
    result = Document(
      body: $body,
      target: target,
      snippet: snippet,
      verbose: verbose,
      stack: @[Frame(
        cmdName: "[top]",
        path: some(""),
      )]
    )
    result.stack[0].commands = defaultCommands(result)

  proc render(doc: Document): cstring {.exportc.} =
    let rendered = doc.renderStr(doc.body)
    let resultStr = if doc.snippet:
      rendered
    else:
      templates[doc.target] % [doc.addToHead.toSeq.join, rendered]
    resultStr.cstring

  type
    XidocResult {.exportc.} = object
      case success*: bool
      of true:
        markup*: cstring
      of false:
        err*: cstring

  proc renderXidoc(body: cstring, target = tHtml, snippet = false, verbose = false): XidocResult {.exportc.} =
    let doc = newDocument(body, target, snippet, verbose)
    try:
      let rendered = doc.render
      XidocResult(success: true, markup: rendered)
    except XidocError:
      XidocResult(success: false, err: getCurrentException().XidocError.format(doc, termColors = false))

  when defined(js):
    {.emit: "export {newDocument, render, renderXidoc};".}

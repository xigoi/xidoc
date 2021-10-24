import cligen
import std/os
import std/sequtils
import std/sets
import std/strformat
import std/strutils
import std/tables
import xidocpkg/commands
import xidocpkg/error
import xidocpkg/expand
import xidocpkg/parser
import xidocpkg/types

const extensions = toTable {
  tHtml: "html",
  tLatex: "tex",
}
const templates = toTable {
  tHtml: """<!DOCTYPE html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1">$1</head><body>$2</body></html>""",
  tLatex: """\documentclass{article}\usepackage[utf8]{inputenc}\usepackage{geometry}$1\begin{document}$2\end{document}""",
}

proc xidoc(target = tHtml, snippet = false, verbose = false, paths: seq[string]) =

  proc renderFile(path: string, input, output: File) =
    let doc = Document(
      path: path,
      body: input.readAll,
      target: target,
      snippet: snippet,
      verbose: verbose,
      stack: @[Frame(
        cmdName: "[top]",
      )]
    )
    doc.stack[0].commands = defaultCommands(doc)
    try:
      let rendered = doc.renderStr(doc.body)
      if snippet:
        # TODO: some way to get doc.addToHead
        output.writeLine rendered
      else:
        output.writeLine templates[target] % [doc.addToHead.toSeq.join, rendered]
      if path != "":
        stderr.writeLine "Rendered file $1" % path
    except XidocError:
      printXidocError(getCurrentException().XidocError, doc)

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

when isMainModule:
  dispatch xidoc, help = {
    "target": "what language to transpile to; one of \"html\", \"latex\"",
    "snippet": "generate just a code snippet instead of a whole document; useful for embedding",
    "verbose": "show more detailed errors",
  }

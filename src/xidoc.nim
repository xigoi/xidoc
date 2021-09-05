import cligen
import npeg
import std/os
import std/tables
import xidoc/commands
import xidoc/parser
import xidoc/types

const targets = toTable {
  "html": tHtml,
  "latex": tLatex,
}
const extensions = toTable {
  tHtml: "html",
  tLatex: "tex",
}

proc xidoc(target = "html", snippet = false, paths: seq[string]) =

  let target = targets[target]

  proc renderFile(path: string, input, output: File) =
    let doc = Document(
      path: path,
      body: input.readAll,
      target: target,
      snippet: snippet,
    )
    doc.defineDefaultCommands
    output.writeLine doc.renderStr(doc.body)

  if paths.len == 0:
    try:
      renderFile("", stdin, stdout)
    except XidocError:
      stderr.writeLine "Error while rendering input:\n$1" % getCurrentException().msg
  else:
    for path in paths:
      let input = open(path, fmRead)
      try:
        let output = open(path.changeFileExt(extensions[target]), fmWrite)
        try:
          renderFile(path, input, output)
          stderr.writeLine "Rendered file $1" % path
        except XidocError:
          stderr.writeLine "Error while rendering file $1:\n$2" % [path, getCurrentException().msg]
        finally:
          output.close
      finally:
        input.close

dispatch xidoc, help = {
  "target": "what language to transpile to; one of \"html\", \"latex\"",
  "snippet": "generate just a code snippet instead of a whole document; useful for embedding"
}

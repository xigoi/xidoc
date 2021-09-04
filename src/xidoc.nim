import cligen
import npeg
import std/tables
import xidoc/commands
import xidoc/parser
import xidoc/types

const targets = toTable {
  "html": tHtml,
  "latex": tLatex,
}

proc render(target = "html", snippet = false) =
  let doc = Document(
    body: stdin.readAll,
    target: targets[target],
    snippet: snippet,
  )
  doc.defineDefaultCommands
  stdout.writeLine doc.renderStr(doc.body)

dispatch render

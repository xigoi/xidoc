import cligen
import npeg
import std/tables
import xidoc/commands
import xidoc/document
import xidoc/parser

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
  let nodes = parseXidoc(doc.body)
  for node in nodes:
    stdout.write case node.kind
      of xnkString: node.str
      of xnkWhitespace: " "
      of xnkCommand: doc.commands[node.name](node.arg)
  stdout.writeLine ""

dispatch render

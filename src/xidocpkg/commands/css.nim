import ../error
import ../expand
import ../parser
import ../types
import ./utils
import std/options
import std/strutils
import std/tables

commands cssCommands:

  command ":", (prop: expand, val: expand), unrendered:
    "$1:$2;" % [prop, val]

  command ":!", (prop: expand, val: expand), unrendered:
    "$1:$2 !important;" % [prop, val]

  command "h*", void, unrendered:
    "h1,h2,h3,h4,h5,h6"

  command "rule", (selector: expand, decls: expand), unrendered:
    # TODO: rule nesting
    "$1{$2}" % [selector, decls]

  command "var", (name: expand, val: ?expand), unrendered:
    if val.isSome:
      if doc.stack[^2].cmdName == "style":
        ":root{--$1:$2}" % [name, val.get]
      else:
        "--$1:$2" % [name, val.get]
    else:
      "var(--$1)" % name

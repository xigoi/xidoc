import ../types
import ./utils
import std/options
import std/strutils
import std/tables

commands cssCommands:

  proc declCmd(prop: !String, val: !String): String {.command: ":".} =
    "$1:$2;" % [prop, val]

  proc declImportantCmd(prop: !String, val: !String): String {.command: ":!".} =
    "$1:$2 !important;" % [prop, val]

  proc hStarCmd(): String {.command: "h*".} =
    "h1,h2,h3,h4,h5,h6"

  proc ruleCmd(selector: !String, decls: !String): String {.command: "rule".} =
    # TODO: rule nesting
    "$1{$2}" % [selector, decls]

  proc varCmd(name: !String, val: ?String): String {.command: "var".} =
    if val.isSome:
      if doc.stack[^2].cmdName == "style":
        ":root{--$1:$2}" % [name, val.get]
      else:
        "--$1:$2;" % [name, val.get]
    else:
      "var(--$1)" % name

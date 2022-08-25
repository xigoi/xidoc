from std/htmlgen as htg import nil
import ../error
import ../types
import ./utils
import std/tables

commands checkboxCommands:

  proc dashCmd(arg: !Markup): Markup {.command: "-".} =
    case doc.target
    of tHtml:
      htg.li(class = "xd-checkbox-unchecked", arg)
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"
    of tGemtext:
      xidocError "Checkboxes are currently not supported for the Gemtext target"

  proc vCmd(arg: !Markup): Markup {.command: "v".} =
    case doc.target
    of tHtml:
      htg.li(class = "xd-checkbox-checked", arg)
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"
    of tGemtext:
      xidocError "Checkboxes are currently not supported for the Gemtext target"

  proc xCmd(arg: !Markup): Markup {.command: "x".} =
    case doc.target
    of tHtml:
      htg.li(class = "xd-checkbox-crossed", arg)
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"
    of tGemtext:
      xidocError "Checkboxes are currently not supported for the Gemtext target"

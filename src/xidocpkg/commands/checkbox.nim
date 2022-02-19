from std/htmlgen as htg import nil
import ../error
import ../expand
import ../types
import ./utils
import std/strutils
import std/tables

commands checkboxCommands:

  command "-", Markup, Markup:
    case doc.target
    of tHtml:
      htg.li(class = "xd-checkbox-unchecked", arg)
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"
    of tGemtext:
      xidocError "Checkboxes are currently not supported for the Gemtext target"

  command "v", Markup, Markup:
    case doc.target
    of tHtml:
      htg.li(class = "xd-checkbox-checked", arg)
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"
    of tGemtext:
      xidocError "Checkboxes are currently not supported for the Gemtext target"

  command "x", Markup, Markup:
    case doc.target
    of tHtml:
      htg.li(class = "xd-checkbox-crossed", arg)
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"
    of tGemtext:
      xidocError "Checkboxes are currently not supported for the Gemtext target"

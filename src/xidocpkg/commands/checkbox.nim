import ../error
import ../expand
import ../types
import ./utils
import std/strformat
import std/strutils
import std/tables

commands checkboxCommands:

  command "-", render, rendered:
    case doc.target
    of tHtml:
      &"<li class=\"xd-checkbox-unchecked\">{arg}</li>"
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"

  command "v", render, rendered:
    case doc.target
    of tHtml:
      &"<li class=\"xd-checkbox-checked\">{arg}</li>"
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"

  command "x", render, rendered:
    case doc.target
    of tHtml:
      &"<li class=\"xd-checkbox-crossed\">{arg}</li>"
    of tLatex:
      xidocError "Checkboxes are currently not supported for the LaTeX target"

import ../error
import ../expand
import ../parser
import ../types
import ./utils
import std/options
from std/pegs import peg, replacef
import std/strformat
import std/strutils
import std/tables

commands mathCommands:

  command "_", expand, expanded:
    &"[{arg}]"

  command "/", (a: ?expand, b: expand), expanded:
    if a.isSome:
      "\\frac{$1}{$2}" % [a.get, b]
    else:
      "\\frac{1}{$1}" % [b]

  # Enclosing stuff
  command ".", expand, expanded:
    "{\\left($1\\right)}" % arg
  command "()", expand, expanded:
    "{\\left[$1\\right]}" % arg
  command "{}", expand, expanded:
    "{\\left\\{$1\\right\\}}" % arg
  command "<>", expand, expanded:
    "{\\left\\langle $1\\right\\rangle}" % arg
  command "|", expand, expanded:
    "{\\left\\lvert $1\\right\\rvert}" % arg
  command "||", expand, expanded:
    "{\\left\\lVert $1\\right\\rVert}" % arg
  command "v.", expand, expanded:
    "{\\overgroup{\\undergroup{$1}}}" % arg

  # Analysis/Calculus
  command "int", (lb: ?expand, ub: ?expand, expr: expand, varname: expand), expanded:
    if lb.isSome:
      if ub.isSome:
        "\\int_{$1}^{$2}$3\\,\\mathrm d$4" % [lb.get, ub.get, expr, varname]
      else:
        "\\int_{$1}$2\\,\\mathrm d$3" % [lb.get, expr, varname]
    else:
      "\\int $1\\,\\mathrm d$2" % [expr, varname]
  command "lim", (varname: ?expand, point: ?expand), expanded:
    "\\lim_{$1\\to $2}" % [varname.get("n"), point.get("\\infty")]

  # Inspired by the physics package
  command "dd", (x: expand), expanded:
    "{\\mathrm d$1}" % [x]
  command "dd^", (n: expand, x: expand), expanded:
    "{\\mathrm d^{$1}$2}" % [n, x]
  command "dv", (f: ?expand, x: expand), expanded:
    if f.isSome:
      "\\frac{\\mathrm d$1}{\\mathrm d$2}" % [f.get, x]
    else:
      "\\frac{\\mathrm d}{\\mathrm d$1}" % [x]
  command "dv^", (n: expand, f: ?expand, x: expand), expanded:
    if f.isSome:
      "\\frac{\\mathrm d^{$1}$2}{\\mathrm d$3^{$1}}" % [n, f.get, x]
    else:
      "\\frac{\\mathrm d^{$1}}{\\mathrm d$2^{$1}}" % [n, x]
  command "pdv", (f: ?expand, x: expand), expanded:
    if f.isSome:
      "\\frac{\\partial $1}{\\partial $2}" % [f.get, x]
    else:
      "\\frac{\\partial}{\\partial $1}" % [x]
  command "pdv^", (n: expand, f: ?expand, x: expand), expanded:
    if f.isSome:
      "\\frac{\\partial^{$1}$2}{\\partial $3^{$1}}" % [n, f.get, x]
    else:
      "\\frac{\\partial^{$1}}{\\partial $2^{$1}}" % [n, x]

  # Matrices
  command "mat", expand, expand:
    "\\begin{matrix}$1\\end{matrix}" % [arg]
  command ".mat", expand, expand:
    "\\begin{pmatrix}$1\\end{pmatrix}" % [arg]
  command "(mat)", expand, expand:
    "\\begin{bmatrix}$1\\end{bmatrix}" % [arg]
  command "|mat|", expand, expand:
    "\\begin{vmatrix}$1\\end{vmatrix}" % [arg]
  command "||mat||", expand, expand:
    "\\begin{Vmatrix}$1\\end{Vmatrix}" % [arg]

  # Units
  command "unit", (number: ?render, unit: render), rendered:
    let unitRendered = unit.replacef(peg"^{\letter+}", "\\mathrm{$1}").replacef(peg"{!\letter[^\\]}{\letter+}", "$1\\mathrm{$2}")
    if number.isSome:
      number.get & "\\," & unitRendered
    else:
      unitRendered

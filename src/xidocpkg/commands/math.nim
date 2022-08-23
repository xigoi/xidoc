from std/htmlgen as htg import nil
from std/pegs import peg, replacef
import ../error
import ../expand
import ../jsinterpret
import ../parser
import ../types
import ./utils
import matext
import std/options
import std/sets
import std/strformat
import std/strutils
import std/tables

commands mathCommands:

  command "_", String, String:
    &"[{arg}]"

  command "/", (a: ?String, b: String), String:
    if a.isSome:
      "\\frac{$1}{$2}" % [a.get, b]
    else:
      "\\frac{1}{$1}" % [b]

  # Enclosing stuff
  command ".", String, String:
    "{\\left($1\\right)}" % arg
  command "()", String, String:
    "{\\left[$1\\right]}" % arg
  command "{}", String, String:
    "{\\left\\{$1\\right\\}}" % arg
  command "<>", String, String:
    "{\\left\\langle $1\\right\\rangle}" % arg
  command "|", String, String:
    "{\\left\\lvert $1\\right\\rvert}" % arg
  command "||", String, String:
    "{\\left\\lVert $1\\right\\rVert}" % arg
  command "v.", String, String:
    "{\\overgroup{\\undergroup{$1}}}" % arg
  command "floor", String, String:
    "{\\left\\lfloor $1\\right\\rfloor}" % arg
  command "ceil", String, String:
    "{\\left\\lceil $1\\right\\rceil}" % arg

  # Analysis/Calculus
  command "int", (lb: ?String, ub: ?String, expr: String, varname: String), String:
    if lb.isSome:
      if ub.isSome:
        "\\int_{$1}^{$2}$3\\,\\mathrm d$4" % [lb.get, ub.get, expr, varname]
      else:
        "\\int_{$1}$2\\,\\mathrm d$3" % [lb.get, expr, varname]
    else:
      "\\int $1\\,\\mathrm d$2" % [expr, varname]
  command "lim", (varname: ?String, point: ?String), String:
    "\\lim_{$1\\to $2}" % [varname.get("n"), point.get("\\infty")]
  command "liminf", (varname: ?String, point: ?String), String:
    "\\liminf_{$1\\to $2}" % [varname.get("n"), point.get("\\infty")]
  command "limsup", (varname: ?String, point: ?String), String:
    "\\limsup_{$1\\to $2}" % [varname.get("n"), point.get("\\infty")]

  # Inspired by the physics package
  command "dd", (x: String), String:
    "{\\mathrm d$1}" % [x]
  command "dd^", (n: String, x: String), String:
    "{\\mathrm d^{$1}$2}" % [n, x]
  command "dv", (f: ?String, x: String), String:
    if f.isSome:
      "\\frac{\\mathrm d$1}{\\mathrm d$2}" % [f.get, x]
    else:
      "\\frac{\\mathrm d}{\\mathrm d$1}" % [x]
  command "dv^", (n: String, f: ?String, x: String), String:
    if f.isSome:
      "\\frac{\\mathrm d^{$1}$2}{\\mathrm d$3^{$1}}" % [n, f.get, x]
    else:
      "\\frac{\\mathrm d^{$1}}{\\mathrm d$2^{$1}}" % [n, x]
  command "pdv", (f: ?String, x: String), String:
    if f.isSome:
      "\\frac{\\partial $1}{\\partial $2}" % [f.get, x]
    else:
      "\\frac{\\partial}{\\partial $1}" % [x]
  command "pdv^", (n: String, f: ?String, x: String), String:
    if f.isSome:
      "\\frac{\\partial^{$1}$2}{\\partial $3^{$1}}" % [n, f.get, x]
    else:
      "\\frac{\\partial^{$1}}{\\partial $2^{$1}}" % [n, x]

  # Matrices
  command "mat", String, String:
    "\\begin{matrix}$1\\end{matrix}" % [arg]
  command ".mat", String, String:
    "\\begin{pmatrix}$1\\end{pmatrix}" % [arg]
  command "(mat)", String, String:
    "\\begin{bmatrix}$1\\end{bmatrix}" % [arg]
  command "|mat|", String, String:
    "\\begin{vmatrix}$1\\end{vmatrix}" % [arg]
  command "||mat||", String, String:
    "\\begin{Vmatrix}$1\\end{Vmatrix}" % [arg]

  # Units
  command "unit", (number: ?String, unit: Markup), String:
    let unitRendered = unit.replacef(peg"^{\letter+}", "\\mathrm{$1}").replacef(peg"{!\letter[^\\]}{\letter+}", "$1\\mathrm{$2}")
    if number.isSome:
      number.get & "\\," & unitRendered
    else:
      unitRendered

  # Why is this necessary???
  {.warning[UnreachableCode]: off.}

  # Prevent accidental nested math
  command "$", literal, Markup:
    xidocError "Math can't be nested inside math"
    ""

  command "$$", literal, Markup:
    xidocError "Math can't be nested inside math"
    ""

  command "$$&", literal, Markup:
    xidocError "Math can't be nested inside math"
    ""

  {.warning[UnreachableCode]: on.}

proc renderMath*(doc: Document, latex: string, displayMode: bool, addDelimiters = true): string =
  case doc.target
  of tHtml:
    doc.addToHead.incl """<link rel="stylesheet" href="$1" integrity="sha384-zTROYFVGOfTw7JV7KUu8udsvW2fx4lWOsCEDqhBreBwlHI4ioVRtmIvEThzJHGET" crossorigin="anonymous">""" % doc.settings.getOrDefault("katex-stylesheet-path", "https://cdn.jsdelivr.net/npm/katex@0.13.18/dist/katex.min.css")
    if displayMode:
      doc.addToStyle.incl """xd-block-math{display:block}"""
    let format = if displayMode: "<xd-block-math>$1</xd-block-math>" else: "<xd-inline-math>$1</xd-inline-math>"
    format % renderMathKatex(latex, displayMode)
  of tLatex:
    doc.addToHead.incl "\\usepackage{amsmath}"
    doc.addToHead.incl "\\usepackage{amssymb}"
    let format = if displayMode: "\\[$1\\]" else: "\\($1\\)"
    if addDelimiters:
      format % latex
    else:
      latex
  of tGemtext:
    let math = try:
      latex.matext
    except ValueError:
      xidocError "Error when parsing math: $1" % latex
    &"\n```\n{math}\n```\n"

commands proofCommands:

  command ".<", Markup, Markup:
    htg.div(class = "xd-subproof", doc.renderMath("(\\Leftarrow)", displayMode = false) & " " & arg)

  command ".>", Markup, Markup:
    htg.div(class = "xd-subproof", doc.renderMath("(\\Rightarrow)", displayMode = false) & " " & arg)

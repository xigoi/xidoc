from std/htmlgen as htg import nil
from std/pegs import peg, replacef
import ../error
import ../jsinterpret
import ../types
import ./utils
import aspartame
import matext
import std/options
import std/sets
import std/strformat
import std/strutils
import std/tables

commands mathCommands:
  proc underCmd(arg: !String): String {.command: "_".} =
    &"[{arg}]"

  proc fracCmd(a: ?String, b: !String): String {.command: "/".} =
    if a.isSome:
      "\\frac{$1}{$2}" % [a.get, b]
    else:
      "\\frac{1}{$1}" % [b]

  # Enclosing stuff
  proc dotCmd(arg: !String): String {.command: ".".} =
    "{\\left($1\\right)}" % arg

  proc bracketsCmd(arg: !String): String {.command: "()".} =
    "{\\left[$1\\right]}" % arg

  proc bracesCmd(x: !String, y: ?String): String {.command: "{}".} =
    "{\\left\\{$1\\right\\}}" % (x & ifSome(y, "\\,\\middle|\\," & y, ""))

  proc anglesCmd(arg: !String): String {.command: "<>".} =
    "{\\left\\langle $1\\right\\rangle}" % arg

  proc pipeCmd(arg: !String): String {.command: "|".} =
    "{\\left\\lvert $1\\right\\rvert}" % arg

  proc pipePipeCmd(arg: !String): String {.command: "||".} =
    "{\\left\\lVert $1\\right\\rVert}" % arg

  proc vDotCmd(arg: !String): String {.command: "v.".} =
    "{\\overgroup{\\undergroup{$1}}}" % arg

  proc floorCmd(arg: !String): String {.command: "floor".} =
    "{\\left\\lfloor $1\\right\\rfloor}" % arg

  proc ceilCmd(arg: !String): String {.command: "ceil".} =
    "{\\left\\lceil $1\\right\\rceil}" % arg

  # Analysis/Calculus
  proc intCmd(
      lb: ?String, ub: ?String, expr: !String, varname: !String
  ): String {.command: "int".} =
    if lb.isSome:
      if ub.isSome:
        "\\int_{$1}^{$2}$3\\,\\mathrm d$4" % [lb.get, ub.get, expr, varname]
      else:
        "\\int_{$1}$2\\,\\mathrm d$3" % [lb.get, expr, varname]
    else:
      "\\int $1\\,\\mathrm d$2" % [expr, varname]

  proc intdCmd(
      varname: !String, lb: ?String, ub: ?String, expr: !String
  ): String {.command: "intd".} =
    intCmd(lb, ub, expr, varname)

  proc dintCmd(
      varname: !String, lb: ?String, ub: ?String, expr: !String
  ): String {.command: "dint".} =
    if lb.isSome:
      if ub.isSome:
        "\\int_{$1}^{$2}\\mathrm d$4\\,$3" % [lb.get, ub.get, expr, varname]
      else:
        "\\int_{$1}\\mathrm d$3\\,$2" % [lb.get, expr, varname]
    else:
      "\\int\\mathrm d$2\\,$1" % [expr, varname]

  proc limCmd(varname: ?String, point: ?String, set: ?String): String {.command: "lim".} =
    ifSome set:
      "\\lim_{\\substack{$1\\to $2\\\\$1\\in $3}}" %
        [varname.get("n"), point.get("\\infty"), set]
    do:
      "\\lim_{$1\\to $2}" % [varname.get("n"), point.get("\\infty")]

  proc liminfCmd(varname: ?String, point: ?String): String {.command: "liminf".} =
    "\\liminf_{$1\\to $2}" % [varname.get("n"), point.get("\\infty")]

  proc limsupCmd(varname: ?String, point: ?String): String {.command: "limsup".} =
    "\\limsup_{$1\\to $2}" % [varname.get("n"), point.get("\\infty")]

  proc sumCmd(
      varname: ?String, lowerBound: ?String, upperBound: ?String
  ): String {.command: "sum".} =
    "\\sum_{$1=$2}^{$3}" %
      [varname.get("n"), lowerBound.get("1"), upperBound.get("\\infty")]

  # Inspired by the physics package
  proc ddCmd(x: !String): String {.command: "dd".} =
    "{\\mathrm d$1}" % [x]

  proc ddExpCmd(n: !String, x: !String): String {.command: "dd^".} =
    "{\\mathrm d^{$1}$2}" % [n, x]

  proc dvCmd(f: ?String, x: !String): String {.command: "dv".} =
    if f.isSome:
      "\\frac{\\mathrm d$1}{\\mathrm d$2}" % [f.get, x]
    else:
      "\\frac{\\mathrm d}{\\mathrm d$1}" % [x]

  proc dvExpCmd(n: !String, f: ?String, x: !String): String {.command: "dv^".} =
    if f.isSome:
      "\\frac{\\mathrm d^{$1}$2}{\\mathrm d$3^{$1}}" % [n, f.get, x]
    else:
      "\\frac{\\mathrm d^{$1}}{\\mathrm d$2^{$1}}" % [n, x]

  proc pdvCmd(f: ?String, x: !String): String {.command: "pdv".} =
    if f.isSome:
      "\\frac{\\partial $1}{\\partial $2}" % [f.get, x]
    else:
      "\\frac{\\partial}{\\partial $1}" % [x]

  proc pdvExpCmd(n: !String, f: ?String, x: !String): String {.command: "pdv^".} =
    if f.isSome:
      "\\frac{\\partial^{$1}$2}{\\partial $3^{$1}}" % [n, f.get, x]
    else:
      "\\frac{\\partial^{$1}}{\\partial $2^{$1}}" % [n, x]

  # Matrices
  proc matCmd(arg: !String): String {.command: "mat".} =
    "\\begin{matrix}$1\\end{matrix}" % [arg]

  proc dotMatCmd(arg: !String): String {.command: ".mat".} =
    "\\begin{pmatrix}$1\\end{pmatrix}" % [arg]

  proc bracketsMatCmd(arg: !String): String {.command: "(mat)".} =
    "\\begin{bmatrix}$1\\end{bmatrix}" % [arg]

  proc pipesMatCmd(arg: !String): String {.command: "|mat|".} =
    "\\begin{vmatrix}$1\\end{vmatrix}" % [arg]

  proc pipePipesMatCmd(arg: !String): String {.command: "||mat||".} =
    "\\begin{Vmatrix}$1\\end{Vmatrix}" % [arg]

  # Units
  proc unitCmd(number: ?String, unit: !Markup): String {.command: "unit".} =
    let unitRendered =
      unit.replacef(peg"^{\letter+}", "\\mathrm{$1}").replacef(
        peg"{!\letter[^\\]}{\letter+}", "$1\\mathrm{$2}"
      )
    if number.isSome:
      number.get & "\\," & unitRendered
    else:
      unitRendered

  # Prevent accidental nested math
  proc inlineMathCmd(arg: Literal) {.command: "$".} =
    xidocError "Math can't be nested inside math"

  proc blockMathCmd(arg: Literal) {.command: "$$".} =
    xidocError "Math can't be nested inside math"

  proc alignedMathCmd(arg: Literal) {.command: "$$&".} =
    xidocError "Math can't be nested inside math"

proc renderMath*(
    doc: Document, latex: string, displayMode: bool, addDelimiters = true
): string =
  case doc.target
  of tHtml:
    case doc.settings.mathRenderer
    of mrKatexHtml:
      let path =
        if doc.settings.katexStylesheetPath == "":
          "https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/katex.min.css"
        else:
          doc.settings.katexStylesheetPath
      doc.addToHead.incl htg.link(
        rel = "stylesheet", href = path, crossorigin = "anonymous"
      )
    of mrKatexMathml:
      discard
    of mrTemml:
      let path =
        if doc.settings.temmlStylesheetPath == "":
          "https://cdn.jsdelivr.net/npm/temml@0.10.10/dist/Temml-Local.css"
        else:
          doc.settings.temmlStylesheetPath
      doc.addToHead.incl htg.link(
        rel = "stylesheet", href = path, crossorigin = "anonymous"
      )
    if displayMode:
      doc.addToStyle.incl """xd-block-math{display:block}"""
    let format =
      if displayMode:
        "<xd-block-math>$1</xd-block-math>"
      else:
        "<xd-inline-math>$1</xd-inline-math>"
    format %
      renderMathKatex(
        latex,
        displayMode = displayMode,
        trust = not doc.safeMode,
        renderer = doc.settings.mathRenderer,
      )
  of tLatex:
    doc.addToHead.incl "\\usepackage{amsmath}"
    doc.addToHead.incl "\\usepackage{amssymb}"
    doc.addToHead.incl "\\usepackage{mathtools}"
    let format = if displayMode: "\\[$1\\]" else: "\\($1\\)"
    if addDelimiters:
      format % latex
    else:
      latex
  of tGemtext:
    let math =
      try:
        latex.matext
      except ValueError:
        xidocError "Error when parsing math: $1" % latex
    &"\n```\n{math}\n```\n"

commands proofCommands:
  proc dotLeftCmd(arg: !Markup): Markup {.command: ".<".} =
    case doc.target
    of tHtml:
      htg.div(
        class = "xd-subproof",
        doc.renderMath("(\\Leftarrow)", displayMode = false) & " " & arg,
      )
    of tLatex:
      "\\par\\((\\Leftarrow)\\) " & arg
    else:
      ""

  proc dotRightCmd(arg: !Markup): Markup {.command: ".>".} =
    case doc.target
    of tHtml:
      htg.div(
        class = "xd-subproof",
        doc.renderMath("(\\Rightarrow)", displayMode = false) & " " & arg,
      )
    of tLatex:
      "\\par\\((\\Rightarrow)\\) " & arg
    else:
      ""

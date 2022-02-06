import ../error
import ../expand
import ../parser
import ../types
import ./utils
import std/options
import std/strformat
import std/strutils
import std/tables

commands drawCommands:

  type XY = tuple[x, y: float]

  proc parseFloat(x: string): float =
    try:
      strutils.parseFloat(x)
    except ValueError:
      xidocError &"Invalid number: {x}"

  proc parseXY(xy: string): XY =
    try:
      let xy = xy.split(',')
      result.x = xy[0].parseFloat
      result.y = xy[1].parseFloat
    except ValueError, IndexDefect:
      xidocError &"Invalid coordinates: {xy}"

  template drawParseArgs {.dirty.} =
    when declared(a):
      let a = a.parseXY
    when declared(b):
      let b = b.parseXY
    when declared(c):
      let c = c.parseXY
    when declared(r):
      let r = r.parseFloat
    when declared(u):
      let u = u.parseXY
    func nonEmpty(s: string): bool =
      s != ""
    when declared(width):
      let width = width.filter(nonEmpty).get(
        when declared(fill):
          if fill.map(nonEmpty) == some(true):
            "0"
          else:
            "3"
        else:
          "3"
      )
    when declared(color):
      let color = color.filter(nonEmpty).get("currentColor")
    when declared(fill):
      let fill = fill.filter(nonEmpty).get("transparent")

  command "Car", (a: expand, r: expand, width: ?expand, color: ?expand, fill: ?expand), rendered:
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<circle cx={a.x+r} cy={a.y+r} r={r} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  command "Ccr", (c: expand, r: expand, width: ?expand, color: ?expand, fill: ?expand), rendered:
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<circle cx={c.x} cy={c.y} r={r} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  command "Lab", (a: expand, b: expand, width: ?expand, color: ?expand), rendered:
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke-width="{width}" stroke="{color}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  command "Lau", (a: expand, u: expand, width: ?expand, color: ?expand), rendered:
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<line x1={a.x} y1={a.y} x2={a.x+u.x} y2={a.y+u.y} stroke-width="{width}" stroke="{color}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  command "Lcu", (c: expand, u: expand, width: ?expand, color: ?expand), rendered:
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<line x1={c.x-u.x} y1={c.y-u.y} x2={c.x+u.x} y2={c.y+u.y} stroke-width="{width}" stroke="{color}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  command "Rab", (a: expand, b: expand, width: ?expand, color: ?expand, fill: ?expand), rendered:
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<rect x={a.x} y={a.y} width={b.x-a.x} height={b.y-a.y} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  command "Rau", (a: expand, u: expand, width: ?expand, color: ?expand, fill: ?expand), rendered:
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<rect x={a.x} y={a.y} width={u.x} height={u.y} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  command "Rcu", (c: expand, u: expand, width: ?expand, color: ?expand, fill: ?expand), rendered:
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<rect x={c.x-u.x} y={c.y-u.y} width={2*u.x} height={2*u.y} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

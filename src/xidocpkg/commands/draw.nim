import ../error
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

  proc CarCmd(a: !String, r: !String, width: ?String, color: ?String, fill: ?String): Markup {.command: "Car".} =
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<circle cx={a.x+r} cy={a.y+r} r={r} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  proc CcrCmd(c: !String, r: !String, width: ?String, color: ?String, fill: ?String): Markup {.command: "Ccr".} =
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<circle cx={c.x} cy={c.y} r={r} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  proc LabCmd(a: !String, b: !String, width: ?String, color: ?String): Markup {.command: "Lab".} =
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke-width="{width}" stroke="{color}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  proc LauCmd(a: !String, u: !String, width: ?String, color: ?String): Markup {.command: "Lau".} =
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<line x1={a.x} y1={a.y} x2={a.x+u.x} y2={a.y+u.y} stroke-width="{width}" stroke="{color}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  proc LcuCmd(c: !String, u: !String, width: ?String, color: ?String): Markup {.command: "Lcu".} =
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<line x1={c.x-u.x} y1={c.y-u.y} x2={c.x+u.x} y2={c.y+u.y} stroke-width="{width}" stroke="{color}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  proc RabCmd(a: !String, b: !String, width: ?String, color: ?String, fill: ?String): Markup {.command: "Rab".} =
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<rect x={a.x} y={a.y} width={b.x-a.x} height={b.y-a.y} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  proc RauCmd(a: !String, u: !String, width: ?String, color: ?String, fill: ?String): Markup {.command: "Rau".} =
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<rect x={a.x} y={a.y} width={u.x} height={u.y} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  proc RcuCmd(c: !String, u: !String, width: ?String, color: ?String, fill: ?String): Markup {.command: "Rcu".} =
    drawParseArgs
    case doc.target
    of tHtml:
      &"""<rect x={c.x-u.x} y={c.y-u.y} width={2*u.x} height={2*u.y} stroke-width="{width}" stroke="{color}" fill="{fill}" />"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

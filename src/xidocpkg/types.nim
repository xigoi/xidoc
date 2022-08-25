import ./translations
import std/options
import std/sets
import std/tables

type
  Target* = enum
    tHtml = "html"
    tLatex = "latex"
    tGemtext = "gemtext"
  MathRenderer* = enum
    mrKatex
    mrKatexJsdelivr
  XidocType* = enum
    String
    Markup
    List
    Optional
  XidocValue* = object
    case typ*: XidocType
    of String, Markup:
      str*: string
    of List:
      list*: seq[XidocValue]
    of Optional:
      opt*: Option[ref XidocValue]
  ParamTypeKind* = enum
    ptkOne
    ptkOptional
    ptkMultiple
    ptkRaw
    ptkLiteral
  ParamType* = object
    kind*: ParamTypeKind
    base*: XidocType
  Command* = proc(arg: string): XidocValue
  Frame* = object
    args*: Table[string, string]
    cmdArg*: string
    cmdName*: string
    commands*: Table[string, Command]
    lang*: Option[Language]
    path*: Option[string]
  Document* = ref object
    addToHead*: OrderedSet[string]
    body*: string
    settings*: Table[string, string]
    snippet*: bool
    stack*: seq[Frame]
    templateArgs*: Table[string, string]
    verbose*: bool
    case target*: Target
    of tHtml:
      addToStyle*: OrderedSet[string]
    else: discard

proc isWhitespaceSensitive*(target: Target): bool =
  target == tGemtext

template lookup*(doc: Document, field: untyped): auto =
  bind isSome
  (proc(): auto =
    for i in countdown(doc.stack.len - 1, 0):
      let frame = doc.stack[i]
      if isSome(frame.field):
        return frame.field.get
  )()

template lookup*(doc: Document, field: untyped, key: typed): auto =
  (proc(): auto =
    for i in countdown(doc.stack.len - 1, 0):
      let frame = doc.stack[i]
      if frame.field.hasKey(key):
        return frame.field[key]
  )()

proc `!`*(typ: XidocType): ParamType =
  result.kind = ptkOne
  result.base = typ

proc `?`*(typ: XidocType): ParamType =
  result.kind = ptkOptional
  result.base = typ

proc `*`*(typ: XidocType): ParamType =
  result.kind = ptkMultiple
  result.base = typ

const Raw* = ParamType(kind: ptkRaw)
const Literal* = ParamType(kind: ptkLiteral)

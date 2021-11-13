import ./translations
import std/options
import std/sets
import std/tables

type
  Target* = enum
    tHtml = "html"
    tLatex = "latex"
  MathRenderer* = enum
    mrKatexJsdelivr
    mrKatex
  XidocString* = object
    rendered*: bool
    str*: string
  Command* = proc(arg: string): XidocString
  Frame* = object
    args*: Table[string, string]
    cmdArg*: string
    cmdName*: string
    commands*: Table[string, Command]
    lang*: Option[Language]
  Document* = ref object
    addToHead*: OrderedSet[string]
    body*: string
    mathRenderer*: MathRenderer
    path*: string
    snippet*: bool
    stack*: seq[Frame]
    target*: Target
    templateArgs*: Table[string, string]
    verbose*: bool

template lookup*(doc: Document, field: untyped): auto =
  (proc(): auto =
    for i in countdown(doc.stack.len - 1, 0):
      let frame = doc.stack[i]
      if frame.field.isSome:
        return frame.field.get
  )()

template lookup*(doc: Document, field: untyped, key: typed): auto =
  (proc(): auto =
    for i in countdown(doc.stack.len - 1, 0):
      let frame = doc.stack[i]
      if frame.field.hasKey(key):
        return frame.field[key]
  )()

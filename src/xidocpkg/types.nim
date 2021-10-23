import ./translations
import std/options
import std/sets
import std/tables

type
  XidocError* = ref object of CatchableError
  Target* = enum
    tHtml = "html"
    tLatex = "latex"
  MathRenderer* = enum
    mrKatexJsdelivr
    mrKatexDuktape
  XidocString* = object
    rendered*: bool
    str*: string
  Command* = proc(arg: string): XidocString
  Frame* = object
    commands*: Table[string, Command]
    cmdName*: string
    args*: Table[string, string]
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

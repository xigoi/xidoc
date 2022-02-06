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
  XidocString* = object
    rendered*: bool
    str*: string
  SyntaxHighlightingTheme* = enum
    shtDefault = "default"
    shtDark = "dark"
    shtFunky = "funky"
    shtOkaidia = "okaidia"
    shtTwilight = "twilight"
    shtCoy = "coy"
    shtSolarizedLight = "solarized-light"
    shtTomorrowNight = "tomorrow-night"
  Command* = proc(arg: string): XidocString
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
    snippet*: bool
    stack*: seq[Frame]
    templateArgs*: Table[string, string]
    verbose*: bool
    case target*: Target
    of tHtml:
      syntaxHighlightingTheme*: SyntaxHighlightingTheme
      addToStyle*: OrderedSet[string]
    else: discard

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

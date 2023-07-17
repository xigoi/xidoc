import ./string_view
import ./translations
import std/options
import std/sets
import std/tables

type
  Target* = enum
    tHtml = "html"
    tLatex = "latex"
    tGemtext = "gemtext"
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
  Command* = proc(arg: StringView): XidocValue
  Commands* = proc(doc: Document): Table[string, Command]
  TableOfContentsEntry* = ref object
    text*: string
    children*: seq[TableOfContentsEntry]
  TableOfContents* = seq[TableOfContentsEntry]
  MathRenderer* = enum
    mrKatexHtml
    mrKatexMathml
    mrTemml
  SyntaxHighlightingTheme* = enum
    shtDefault
    shtDark
    shtFunky
    shtFunkyX
    shtOkaidia
    shtTwilight
    shtCoy
    shtSolarizedLight
    shtTomorrowNight
  Settings* = object
    darkMode*: bool
    documentClass*: string
    documentClassOptions*: string
    katexStylesheetPath*: string
    mathRenderer*: MathRenderer
    syntaxHighlightingTheme*: SyntaxHighlightingTheme
    temmlStylesheetPath*: string
  Arguments* = object
    vals*: Table[string, StringView]
    stack*: seq[Frame]
  Frame* = ref object
    args*: Arguments
    cmd*: StringView
    cmdArg*: StringView
    cmdName*: StringView
    commands*: Table[string, Command]
    lang*: Option[Language]
    path*: Option[string]
    tableOfContentsEntry*: Option[TableOfContentsEntry]
  Document* = ref object
    addToHead*: OrderedSet[string]
    body*: ref string
    safeMode*: bool
    settings*: Settings
    snippet*: bool
    stack*: seq[Frame]
    stage*: Natural
    tableOfContents*: TableOfContents
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
  bind some, none
  (proc(): auto =
    for i in countdown(doc.stack.len - 1, 0):
      let frame = doc.stack[i]
      if frame.field.hasKey(key):
        return some(frame.field[key])
    none(typeof(doc.stack[0].field[key]))
  )()

proc lookupArg*(doc: Document, name: string): Option[tuple[val: StringView, stack: seq[Frame]]] =
  for i in countdown(doc.stack.len - 1, 0):
    let frame = doc.stack[i]
    if frame.args.vals.hasKey(name):
      return some((val: frame.args.vals[name], stack: frame.args.stack))

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

import ./translations
import std/options
import std/sets
import std/tables

type
  XidocError* = ref object of CatchableError
  Target* = enum
    tHtml
    tLatex
  XidocString* = object
    rendered*: bool
    str*: string
  Context* = object
    commandStack*: seq[string]
    lang*: Option[Language]
  Command* = proc(arg: string, ctx: Context): XidocString
  Document* = ref object
    addToHead*: OrderedSet[string]
    body*: string
    commands*: Table[string, Command]
    lang*: Language
    path*: string
    snippet*: bool
    stackFrames*: seq[Table[string, string]]
    target*: Target
    templateArgs*: Table[string, string]
    verbose*: bool

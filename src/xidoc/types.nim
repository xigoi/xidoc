import ./translations
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
    lang*: Language
  Command* = proc(arg: string, ctx: Context): XidocString
  Document* = ref object
    path*: string
    body*: string
    target*: Target
    snippet*: bool
    commands*: Table[string, Command]
    templateArgs*: Table[string, string]
    verbose*: bool
    addToHead*: OrderedSet[string]

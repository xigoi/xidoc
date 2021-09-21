import std/tables

type
  XidocError* = ref object of CatchableError
  Target* = enum
    tHtml
    tLatex
  XidocString* = object
    rendered*: bool
    str*: string
  Command* = proc(arg: string): XidocString
  Document* = ref object
    path*: string
    body*: string
    target*: Target
    snippet*: bool
    commands*: Table[string, Command]
    templateArgs*: Table[string, string]
    verbose*: bool

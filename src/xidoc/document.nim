import std/tables

type
  Target* = enum
    tHtml
    tLatex
  Document* = ref object
    body*: string
    target*: Target
    snippet*: bool
    commands*: Table[string, proc(arg: string): string]

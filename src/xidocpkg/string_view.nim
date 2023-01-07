import std/strutils

type
  StringView* = object
    body*: ref string
    slice*: Slice[int]

func view*(body: ref string, slice: Slice[int]): StringView =
  StringView(body: body, slice: slice)

func toStringView*(body: ref string): StringView =
  body.view(body[].low..body[].high)

func toStringView*(body: string): StringView =
  new result.body
  result.body[] = body
  result.slice = body.low..body.high

converter `$`*(view: StringView): string =
  view.body[][view.slice]

func strip*(view: StringView): StringView =
  result = view
  while result.slice.a <= result.slice.b and result.body[result.slice.a] in Whitespace:
    result.slice.a.inc
  while result.slice.a <= result.slice.b and result.body[result.slice.b] in Whitespace:
    result.slice.b.dec

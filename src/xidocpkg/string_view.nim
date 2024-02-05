import std/strformat
import std/strutils

type StringView* = object
  body*: ref string
  slice*: Slice[int]

func view*(body: ref string, slice: Slice[int]): StringView =
  StringView(body: body, slice: slice)

func toStringView*(body: ref string): StringView =
  body.view(body[].low .. body[].high)

func toStringView*(body: string): StringView =
  new result.body
  result.body[] = body
  result.slice = body.low .. body.high

converter `$`*(view: StringView): string =
  view.body[][view.slice]

func isEmpty*(view: StringView): bool =
  view.slice.a > view.slice.b

func lineContext*(view: StringView): tuple[lnNumA, colNumA, lnNumB, colNumB: int] =
  let lns = view.body[].splitLines
  var lnIndex = 0
  var lenSum = 0
  let a = view.slice.a
  while a >= lenSum + lns[lnIndex].len:
    lenSum += lns[lnIndex].len + 1
    lnIndex.inc
  result.lnNumA = lnIndex + 1
  result.colNumA = a - lenSum + 1
  let b = view.slice.b
  while b >= lenSum + lns[lnIndex].len:
    lenSum += lns[lnIndex].len + 1
    lnIndex.inc
  result.lnNumB = lnIndex + 1
  result.colNumB = b - lenSum + 1

func lineContext*(body: ref string, i: int): tuple[lnNum, colNum: int, msg: string] =
  let lns = body[].splitLines
  var lnIndex = 0
  var lenSum = 0
  while i >= lenSum + lns[lnIndex].len:
    lenSum += lns[lnIndex].len + 1
    lnIndex.inc
  let colIndex = i - lenSum
  result.lnNum = lnIndex + 1
  result.colNum = colIndex + 1
  let caret = &"{' '.repeat(($result.lnNum).len)} │ {' '.repeat(colIndex)}^"
  result.msg = &"{result.lnNum} │ {lns[lnIndex]}\n{caret}"

func strip*(view: StringView): StringView =
  result = view
  while result.slice.a <= result.slice.b and result.body[result.slice.a] in Whitespace:
    result.slice.a.inc
  while result.slice.a <= result.slice.b and result.body[result.slice.b] in Whitespace:
    result.slice.b.dec

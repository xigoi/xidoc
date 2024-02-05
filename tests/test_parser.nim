import std/sequtils
import std/unittest
import xidocpkg/error
import xidocpkg/parser
import xidocpkg/string_view

converter toView(str: string): StringView =
  str.toStringView

func `==`(a, b: XidocNode): bool =
  if a.kind != b.kind:
    return false
  case a.kind
  of xnkString:
    $a.str == $b.str
  of xnkWhitespace:
    a.newline == b.newline
  of xnkCommand:
    $a.name == $b.name and $a.arg == $b.arg

func `==`(a: seq[StringView], b: seq[string]): bool =
  a.mapIt($it) == b

suite "basic syntax":
  test "string":
    check parseXidoc("abc") == @[XidocNode(kind: xnkString, str: "abc")]
    check parseXidoc("áβç/\\;}┐") ==
      @[XidocNode(kind: xnkString, str: "áβç/\\;}┐")]

  test "whitespace without newline":
    check parseXidoc(" ") == @[XidocNode(kind: xnkWhitespace, newline: false)]
    check parseXidoc("\t") == @[XidocNode(kind: xnkWhitespace, newline: false)]
    check parseXidoc("  \t \t\t") == @[XidocNode(kind: xnkWhitespace, newline: false)]

  test "whitespace with newline":
    check parseXidoc("\n") == @[XidocNode(kind: xnkWhitespace, newline: true)]
    check parseXidoc("  \n\t \t\n\t") == @[
      XidocNode(kind: xnkWhitespace, newline: true)
    ]

  test "command":
    check parseXidoc("[foo]") == @[XidocNode(kind: xnkCommand, name: "foo", arg: "")]
    check parseXidoc("[bar baz]") ==
      @[XidocNode(kind: xnkCommand, name: "bar", arg: " baz")]

  test "combined":
    check parseXidoc("q [uu]x") ==
      @[
        XidocNode(kind: xnkString, str: "q"),
        XidocNode(kind: xnkWhitespace, newline: false),
        XidocNode(kind: xnkCommand, name: "uu", arg: ""),
        XidocNode(kind: xnkString, str: "x")
      ]

suite "basic syntax errors":
  test "too many left brackets":
    expect XidocError:
      discard parseXidoc("[a")
    expect XidocError:
      discard parseXidoc("[this [is [very] nested]")

  test "too many right brackets":
    expect XidocError:
      discard parseXidoc("a]")
    expect XidocError:
      discard parseXidoc("this [is [very] nested]]")

  test "invalid command name":
    expect XidocError:
      discard parseXidoc("[[a]]")
    expect XidocError:
      discard parseXidoc("[i-love[] you]")

suite "argument syntax":
  test "zero arguments":
    check parseXidocArguments("") == newSeq[string]()

  test "one argument":
    check parseXidocArguments("abc") == @["abc"]

  test "one argument with whitespace":
    check parseXidocArguments("  def ghi\t\n") == @["def ghi"]

  test "one argument with nesting":
    check parseXidocArguments("jkl [mno; pqr] stu") == @["jkl [mno; pqr] stu"]

  test "multiple arguments":
    check parseXidocArguments("a; b") == @["a", "b"]
    check parseXidocArguments("c;d  ;  e") == @["c", "d", "e"]
    check parseXidocArguments("  \tf; g h;\n\r\t    i;j") == @["f", "g h", "i", "j"]

  test "multiple arguments with nesting":
    check parseXidocArguments("k; [l m; n]; o") == @["k", "[l m; n]", "o"]

  test "multiple arguments with empty":
    check parseXidocArguments("p;") == @["p", ""]
    check parseXidocArguments("q; \t") == @["q", ""]
    check parseXidocArguments("r; s;\n;t; \n\t") == @["r", "s", "", "t", ""]
    check parseXidocArguments(";u;;v; ;\t;w") == @["", "u", "", "v", "", "", "w"]
    check parseXidocArguments("\n\v  \r\t;;  ;x;\r;  ") == @["", "", "", "x", "", ""]

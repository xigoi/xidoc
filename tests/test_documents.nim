import std/strutils
import std/unittest
import xidoc

proc shouldRenderAs(input: string, output: string) =
  check input.renderXidoc(snippet = true) == output

suite "plain text":

  test "normal text":
    "hello world".shouldRenderAs("hello world")

  test "escaping special characters":
    "std::vector<std::string&>".shouldRenderAs("std::vector&lt;std::string&amp;>")

suite "\"Basic constructs\" commands":

  test "[#]":
    "I [# don't] like xidoc.".shouldRenderAs("I like xidoc.")

  test "[(]":
    "I'm a sad robot :[(]".shouldRenderAs("I'm a sad robot :[")

  test "[)]":
    "I'm a happy robot :[)]".shouldRenderAs("I'm a happy robot :]")

  test "[()]":
    "[() this-is-not-a-command]".shouldRenderAs("[this-is-not-a-command]")

  test "[;]":
    "[list This[;] is[;] only[;] one[;] item]".shouldRenderAs("<ul><li>This; is; only; one; item</li></ul>")

  test "[space]":
    "[space]".shouldRenderAs(" ")
    "[bf [space]x[space]]".shouldRenderAs("<b> x </b>")

  test "[raw]":
    "[raw [I can use [as many brackets [as I want]], but [they] still have to [[be balanced]]].]".shouldRenderAs("[I can use [as many brackets [as I want]], but [they] still have to [[be balanced]]].")

  test "[raw<]":
    """[raw<
      for word in ["This", "correctly", "removes", "indentation"]:
        echo word]"""
    .shouldRenderAs("for word in [&quot;This&quot;, &quot;correctly&quot;, &quot;removes&quot;, &quot;indentation&quot;]:\n  echo word")

  test "[pass]":
    "[pass <em>Haha!</em> I'm in! <code>'[;] DROP TABLE xidoc[;]</code> Oh no, this is a static site…]".shouldRenderAs("<em>Haha!</em> I'm in! <code>'; DROP TABLE xidoc;</code> Oh no, this is a static site…")

  test "[pass-raw]":
    "[pass-raw <em>Haha!</em> I'm in! <code>'[;] DROP TABLE xidoc;</code> Oh no, this is a static site…]".shouldRenderAs("<em>Haha!</em> I'm in! <code>'[;] DROP TABLE xidoc;</code> Oh no, this is a static site…")

  test "[hide]":
    "[hide [def-global x; 0] PWNED][x]".shouldRenderAs("0")

  test "[render]":
    "[render [raw [it This will be italic despite being inside [ms raw].]]]".shouldRenderAs("<i>This will be italic despite being inside <code>raw</code>.</i>")

  test "[add-to-head]":
    check "[add-to-head BOOM]".renderXidoc.contains("BOOM</head>")

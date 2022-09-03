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
    "[raw [I can use [as many brackets [as I want]], but [they] still have to [[be balanced]]].]"
    .shouldRenderAs("[I can use [as many brackets [as I want]], but [they] still have to [[be balanced]]].")

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

suite "\"Inline formatting\" commands":

  test "[bf]":
    "xidoc is [bf awesome]!".shouldRenderAs("xidoc is <b>awesome</b>!")

  test "[code]":
    "[code [raw print(f\"The answer to the universe and stuff is {6 * 7}.\")]]"
    .shouldRenderAs("<code>print(f&quot;The answer to the universe and stuff is {6 * 7}.&quot;)</code>")
    "[code python; [raw print(f\"The answer to the universe and stuff is {6 * 7}.\")]]"
    .shouldRenderAs("<code class=\"language-python\"><span class=\"token keyword\">print</span><span class=\"token punctuation\">(</span><span class=\"token string-interpolation\"><span class=\"token string\">f\"The answer to the universe and stuff is </span><span class=\"token interpolation\"><span class=\"token punctuation\">{</span><span class=\"token number\">6</span> <span class=\"token operator\">*</span> <span class=\"token number\">7</span><span class=\"token punctuation\">}</span></span><span class=\"token string\">.\"</span></span><span class=\"token punctuation\">)</span></code>")

  test "[color]":
    "You can use [color red; names] or [color #00f; codes]!".shouldRenderAs("You can use <span style=\"color:red\">names</span> or <span style=\"color:#00f\">codes</span>!")

  test "[it]":
    "xidoc is [it fantastic]!".shouldRenderAs("xidoc is <i>fantastic</i>!")

  test "[lang]":
    "[\" Hello!] [lang czech; [\" Ahoj!]]".shouldRenderAs("“Hello!” „Ahoj!“")

  test "[link]":
    "[link xidoc; http://xidoc.nim.town/] is made in [link Nim; https://nim-lang.org/]."
    .shouldRenderAs("<a href=\"http://xidoc.nim.town/\">xidoc</a> is made in <a href=\"https://nim-lang.org/\">Nim</a>.")

  test "[ms]":
    "In HTML, this will produce [ms <code>]. In LaTeX, this will produce [ms \\texttt]."
    .shouldRenderAs("In HTML, this will produce <code>&lt;code></code>. In LaTeX, this will produce <code>\\texttt</code>.")

  test "[term]":
    "A [term group] is a monoid where every element has an inverse."
    .shouldRenderAs("A <dfn>group</dfn> is a monoid where every element has an inverse.")

  test "[unit]":
    "The radius of the Earth is [unit 6378; km].".shouldRenderAs("The radius of the Earth is 6378 km.")

import std/strutils
import std/unittest
import xidoc

template shouldRenderAs(input: string, output: string) =
  check input.renderXidoc(snippet = true) == output

template shouldError(input: string) =
  expect XidocError:
    discard input.renderXidoc(snippet = true)

suite "syntax":

  test "too many opening brackets":
    "Hi [it everyone [bf !]".shouldError

  test "too many closing brackets":
    "Hi [it everyone !]]".shouldError

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

suite "\"Block formatting\" commands":

  test "[block-quote]":
    "[p The first rule in the Zen of Nim is:] [block-quote Copying bad design is not good design.]"
    .shouldRenderAs("<p>The first rule in the Zen of Nim is:</p> <blockquote>Copying bad design is not good design.</blockquote>")

  test "[checkboxes]":
    "[checkboxes [v Kill the friend] [- Bury the body] [x Get caught by the police]]"
    .shouldRenderAs("<ul class=\"xd-checkboxes\"><li class=\"xd-checkbox-checked\">Kill the friend</li> <li class=\"xd-checkbox-unchecked\">Bury the body</li> <li class=\"xd-checkbox-crossed\">Get caught by the police</li></ul>")

  test "[code-block]":
    """[code-block [raw<
      const factorial = (n) => {
        let result = 1n;
        for (let i = 1; i <= n; i++) {
          result *= BigInt(i);
        }
        return result;
      }
    ]]"""
    .shouldRenderAs("""<pre><code>const factorial = (n) => {
  let result = 1n;
  for (let i = 1; i &lt;= n; i++) {
    result *= BigInt(i);
  }
  return result;
}
</code></pre>""")

  test "[figure]":
    "[figure IMAGE]".shouldRenderAs("<figure>IMAGE</figure>")
    "[figure IMAGE; CAPTION]".shouldRenderAs("<figure>IMAGE<figcaption>CAPTION</figcaption></figure>")

  test "[link-image]":
    "[link-image xidoc logo; logo.svg]".shouldRenderAs("<img src=\"logo.svg\" alt=\"xidoc logo\" />")
    "[link-image xidoc logo; logo.svg; https://xidoc.nim.town/]".shouldRenderAs("<a href=\"https://xidoc.nim.town/\"><img src=\"logo.svg\" alt=\"xidoc logo\" /></a>")

  test "[list]":
    "Supported targets: [list HTML; LaTeX; Gemtext]"
    .shouldRenderAs("Supported targets: <ul><li>HTML</li><li>LaTeX</li><li>Gemtext</li></ul>")

  test "[ordered-list]":
    "TOP 5 LIST OF SMALLEST POSITIVE INTEGERS: [ordered-list 1; 2; 3; 4; 5]"
    .shouldRenderAs("TOP 5 LIST OF SMALLEST POSITIVE INTEGERS: <ol><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ol>")

  test "[description-list]":
    "[description-list Dog; Cute and loyal; Cat; Cute and entitled]"
    .shouldRenderAs("<dl><dt>Dog</dt><dd>Cute and loyal</dd><dt>Cat</dt><dd>Cute and entitled</dd></dl>")

  test "[p]":
    "[p PARAGRAPH]".shouldRenderAs("<p>PARAGRAPH</p>")

  test "[section]":
    "[section Are we going too deep?]".shouldRenderAs("<section>Are we going too deep?</section>")
    "[section Inception; Are we going too deep?]".shouldRenderAs("<section><h2 class=\"xd-section-heading\">Inception</h2>Are we going too deep?</section>")
    "[section [section Inception; Are we going too deep?]]".shouldRenderAs("<section><section><h3 class=\"xd-section-heading\">Inception</h3>Are we going too deep?</section></section>")

  test "[spoiler]":
    "[spoiler In the series The Simpsons, the surname of the main characters is; Simpson]"
    .shouldRenderAs("<details class=\"xd-spoiler\"><summary>In the series The Simpsons, the surname of the main characters is</summary>Simpson</details>")

  test "[table], [row], [header-row]":
    "[table [header-row a; b; c][row d; e; f]]"
    .shouldRenderAs("<table><tr><th>a</th><th>b</th><th>c</th></tr><tr><td>d</td><td>e</td><td>f</td></tr></table>")

  test "[title]":
    "[title TITLE]".shouldRenderAs("<h1>TITLE</h1>")
    check renderXidoc("[title TITLE]").contains("<title>TITLE</title>")

suite "\"Unicode characters\" commands":

  test "[\"]":
    "[\" Hello!]".shouldRenderAs("“Hello!”")
    "[lang czech; [\" Ahoj!]]".shouldRenderAs("„Ahoj!“")

  test "[--]":
    "[--]".shouldRenderAs("–")

  test "[---]":
    "[---]".shouldRenderAs("—")

  test "[...]":
    "[...]".shouldRenderAs("…")

suite "\"Logos\" commands":

  test "[LaTeX]":
    "[LaTeX]".shouldRenderAs("<span class=\"xd-latex\">L<sup>a</sup>T<sub>e</sub>X</span>")

  test "[xidoc]":
    "[xidoc]".shouldRenderAs("<span class=\"xd-logo\">ξ</span>")

suite "Custom commands":

  test "no parameters":
    "[def foo; bar][foo]".shouldRenderAs("bar")

  test "parameters":
    "[def greet; name; Hello, [arg name]!][greet reader]".shouldRenderAs("Hello, reader!")
    "[def greet; person; Hello, [arg name]!][greet reader]".shouldError

  test "lexical scoping":
    "[() [def a; x][() [def a; y][() [def a; z][a]][a]][a]]".shouldRenderAs("[[[z]y]x]")
    "[() [def a; x]][a]".shouldError
    "[() [def-global a; x]][a]".shouldRenderAs("[]x")

suite "\"Target detection\" commands":

  test "[if-html]":
    "[if-html You can see this only if you're in HTML]"
    .shouldRenderAs("You can see this only if you're in HTML")

  test "[if-latex]":
    "[if-latex You can see this only if you're in LaTeX]".shouldRenderAs("")

  test "[if-gemtext]":
    "[if-gemtext You can see this only if you're in Gemtext]".shouldRenderAs("")

suite "\"List manipulation\" commands":

  test "[for-each], [join]":
    "[join [space]; [for-each lang; HTML LaTeX Gemtext; xidoc compiles to [lang].]]"
    .shouldRenderAs("xidoc compiles to HTML. xidoc compiles to LaTeX. xidoc compiles to Gemtext.")

suite "\"Programming\" commands":

  test "[janet-call]":
    "[janet-call [raw (fn [radius] (describe (* 2 math/pi (scan-number radius))))]; 6]"
    .shouldRenderAs("37.6991")

  test "[janet-eval]":
    "[janet-eval [raw (do (defn gcd [a b] (if (= b 0) a (gcd b (% a b)))) (describe (gcd (scan-number a) (scan-number b)))) ]; a;128 ; b;168]"
    .shouldRenderAs("8")

  test "[js-call]":
    "[js-call [raw (radius) => Math.PI * radius * radius]; 6]".shouldRenderAs("113.09733552923255")

  test "[js-eval]":
    "[js-eval [raw { let discriminant = b*b - 4*a*c; let root1 = (-b + Math.sqrt(discriminant)) / (2 * a); let root2 = (-b - Math.sqrt(discriminant)) / (2 * a); root1 + \", \" + root2 }]; a;3 ; b;-18 ; c;24]"
    .shouldRenderAs("4, 2")

from std/pegs import match, peg
import ./error
import ./expand
import ./jsinterpret
import ./parser
import ./translations
import ./types
import std/macros
import std/options
import std/os
import std/sequtils
import std/sets
import std/strformat
import std/strutils
import std/sugar
import std/tables

const
  htmlTags = "!-- !DOCTYPE a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd label legend li link main map mark meta meter nav noframes noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr".splitWhitespace
  htmlUnpairedTags = "br img input link meta".splitWhitespace.toHashSet # Why is there no list of unpaired tags anywhere?

macro command(name: string, sig: untyped, rendered: untyped, body: untyped): untyped =
  let sigLen = sig.len
  let arg = genSym(nskParam, "arg")
  let logic =
    if sig == ident"void":
      quote:
        if `arg` != "":
          xidocError "Command $1 must be called without an argument" % [`name`]
        `body`
    elif sig == ident"literal":
      quote:
        let arg {.inject.} = `arg`
        `body`
    elif sig == ident"raw":
      quote:
        let arg {.inject.} = `arg`.strip
        `body`
    elif sig == ident"expand":
      quote:
        let arg {.inject.} = doc.expandStr(`arg`.strip)
        `body`
    elif sig == ident"render":
      quote:
        let arg {.inject.} = doc.renderStr(`arg`.strip)
        `body`
    else:
      var starPos = none int
      var questionPos = 0..<0
      for index, pair in sig:
        pair.expectKind nnkExprColonExpr
        if pair[1].kind == nnkPrefix and pair[1][0] == ident"*":
          starPos = some index
          break
        if pair[1].kind == nnkPrefix and pair[1][0] == ident"?":
          if questionPos == 0..<0:
            questionPos = index..index
          else:
            questionPos.b = index
      let args = genSym(nskLet, "args")
      let lenCheck =
        if starPos.isSome:
          let minLen = sigLen - 1
          quote:
            if `args`.len < `minLen`:
              xidocError "Command $1 needs at least $2 arguments, $3 given" % [`name`, $`minLen`, $`args`.len]
        else:
          let minLen = sigLen - questionPos.len
          let maxLen = sigLen
          quote:
            if `args`.len < `minLen` or `args`.len > `maxLen`:
              xidocError "Command $1 needs at least $2 and at most $3 arguments, $4 given" % [`name`, $`minLen`, $`maxLen`, $`args`.len]
      let unpacks = nnkStmtList.newTree
      template process(kind: NimNode): (proc(doc: Document, str: string): string {.nimcall.}) =
        if kind == ident"render":
          renderStr
        elif kind == ident"expand":
          expandStr
        elif kind == ident"raw":
          (proc(doc: Document, str: string): string = str)
        else:
          error "invalid kind"
          (proc(doc: Document, str: string): string = str)
      if starPos.isSome:
        block beforeStar:
          for index, pair in sig[0..<starPos.get(sigLen)]:
            let name = pair[0]
            let process = process(pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `process`(doc, `args`[`index`])
        block star:
          let start = starPos.get
          let ende = sigLen - start
          let pair = sig[start]
          let name = pair[0]
          let process = process(pair[1][1])
          unpacks.add quote do:
            let `name` {.inject.} = `args`[`start`..^`ende`].mapIt(`process`(doc, it))
        block afterStar:
          for index, pair in sig[starPos.get + 1 .. ^1]:
            let index = sigLen - index - starPos.get - 1
            let name = pair[0]
            let process = process(pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `process`(doc, `args`[^`index`])
      else: # starPos.isNone
        block beforeQuestion:
          for index, pair in sig[0..<questionPos.a]:
            let name = pair[0]
            let process = process(pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `process`(doc, `args`[`index`])
        block question:
          let minLen = sigLen - questionPos.len
          let start = questionPos.a
          for index, pair in sig[questionPos]:
            let name = pair[0]
            let process = process(pair[1][1])
            unpacks.add quote do:
              let `name` {.inject.} =
                if `args`.len - `minLen` > `index`:
                  some `process`(doc, `args`[`start` + `index`])
                else:
                  none string
        block afterQuestion:
          for index, pair in sig[questionPos.b + 1 .. ^1]:
            let index = sigLen - index - questionPos.b - 1
            let name = pair[0]
            let process = process(pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `process`(doc, `args`[^`index`])
      quote:
        let `args` = parseXidocArguments(`arg`)
        `lenCheck`
        `unpacks`
        `body`
  let rendered = newLit(rendered == ident"rendered")
  quote:
    commands[`name`] = proc(`arg`: string): XidocString = XidocString(rendered: `rendered`, str: `logic`)

template commands(name, defs: untyped) =
  proc name*(doc {.inject.}: Document): Table[string, Command] =
    var commands {.inject.}: Table[string, Command]
    defs
    commands

commands cssCommands:

  command ":", (prop: expand, val: expand), unrendered:
    "$1:$2;" % [prop, val]

  command "h*", void, unrendered:
    "h1,h2,h3,h4,h5,h6"

  command "rule", (selector: expand, decls: expand), unrendered:
    # TODO: rule nesting
    "$1{$2}" % [selector, decls]

  command "var", (name: expand, val: ?expand), unrendered:
    if val.isSome:
      if doc.stack[^2].cmdName == "style":
        ":root{--$1:$2}" % [name, val.get]
      else:
        "--$1:$2" % [name, val.get]
    else:
      "var(--$1)" % name

commands mathCommands:

  command "_", expand, expanded:
    &"[{arg}]"

  command "/", (a: ?expand, b: expand), expanded:
    if a.isSome:
      "\\frac{$1}{$2}" % [a.get, b]
    else:
      "\\frac{1}{$1}" % [b]

  # Enclosing stuff
  command ".", expand, expanded:
    "{\\left($1\\right)}" % arg
  command "()", expand, expanded:
    "{\\left[$1\\right]}" % arg
  command "{}", expand, expanded:
    "{\\left\\{$1\\right\\}}" % arg
  command "<>", expand, expanded:
    "{\\left\\langle $1\\right\\rangle}" % arg
  command "|", expand, expanded:
    "{\\left\\lvert $1\\right\\rvert}" % arg
  command "||", expand, expanded:
    "{\\left\\lVert $1\\right\\rVert}" % arg

  # Analysis/Calculus
  command "int", (lb: ?expand, ub: ?expand, expr: expand, varname: expand), expanded:
    if lb.isSome:
      if ub.isSome:
        "\\int_{$1}^{$2}$3\\,\\mathrm d$4" % [lb.get, ub.get, expr, varname]
      else:
        "\\int_{$1}$2\\,\\mathrm d$3" % [lb.get, expr, varname]
    else:
      "\\int $1\\,\\mathrm d$2" % [expr, varname]
  command "lim", (varname: ?expand, point: ?expand), expanded:
    "\\lim_{$1\\to $2}" % [varname.get("n"), point.get("\\infty")]

  # Inspired by the physics package
  command "dd", (x: expand), expanded:
    "{\\mathrm d$1}" % [x]
  command "dd^", (n: expand, x: expand), expanded:
    "{\\mathrm d^{$1}$2}" % [n, x]
  command "dv", (f: ?expand, x: expand), expanded:
    if f.isSome:
      "\\frac{\\mathrm d$1}{\\mathrm d$2}" % [f.get, x]
    else:
      "\\frac{\\mathrm d}{\\mathrm d$1}" % [x]
  command "dv^", (n: expand, f: ?expand, x: expand), expanded:
    if f.isSome:
      "\\frac{\\mathrm d^{$1}$2}{\\mathrm d$3^{$1}}" % [n, f.get, x]
    else:
      "\\frac{\\mathrm d^{$1}}{\\mathrm d$2^{$1}}" % [n, x]
  command "pdv", (f: ?expand, x: expand), expanded:
    if f.isSome:
      "\\frac{\\partial $1}{\\partial $2}" % [f.get, x]
    else:
      "\\frac{\\partial}{\\partial $1}" % [x]
  command "pdv^", (n: expand, f: ?expand, x: expand), expanded:
    if f.isSome:
      "\\frac{\\partial^{$1}$2}{\\partial $3^{$1}}" % [n, f.get, x]
    else:
      "\\frac{\\partial^{$1}}{\\partial $2^{$1}}" % [n, x]

  # Matrices
  command "mat", expand, expand:
    "\\begin{matrix}$1\\end{matrix}" % [arg]
  command ".mat", expand, expand:
    "\\begin{pmatrix}$1\\end{pmatrix}" % [arg]
  command "(mat)", expand, expand:
    "\\begin{bmatrix}$1\\end{bmatrix}" % [arg]
  command "|mat|", expand, expand:
    "\\begin{vmatrix}$1\\end{vmatrix}" % [arg]
  command "||mat||", expand, expand:
    "\\begin{Vmatrix}$1\\end{Vmatrix}" % [arg]

commands defaultCommands:

  proc initKatexJsdelivrCss() =
    doc.addToHead.incl """<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.13.18/dist/katex.min.css" integrity="sha384-zTROYFVGOfTw7JV7KUu8udsvW2fx4lWOsCEDqhBreBwlHI4ioVRtmIvEThzJHGET" crossorigin="anonymous">"""

  proc initKatexJsdelivr() =
    initKatexJsdelivrCss()
    doc.addToHead.incl """<script defer src="https://cdn.jsdelivr.net/npm/katex@0.13.18/dist/katex.min.js" integrity="sha384-GxNFqL3r9uRJQhR+47eDxuPoNE7yLftQM8LcxzgS4HT73tp970WS/wV5p8UzCOmb" crossorigin="anonymous"></script><script type="module">for(let e of document.getElementsByTagName`xd-inline-math`)katex.render(e.innerText,e,{throwOnError:false});for(let e of document.getElementsByTagName`xd-block-math`)katex.render(e.innerText,e,{throwOnError:false,displayMode:true})</script>"""

  template theoremLikeCommand(cmdName: static string, phrase: static Phrase, htmlTmpl, latexTmpl: static string) =
    command cmdName, (thName: ?render, content: render), rendered:
      let word = phrase.translate(doc.lookup(lang))
      case doc.target
      of tHtml:
        doc.addToHead.incl "<style>.xd-theorem-like{margin:1em 0}.xd-theorem-like>p{margin:0.5em 0}</style>"
        if thName.isSome:
          "<div class=\"xd-theorem-like xd-$1\"><strong>$2 ($3).</strong> $4</div>" % [cmdName, word, thName.get, htmlTmpl % content]
        else:
          "<div class=\"xd-theorem-like xd-$1\"><strong>$2.</strong> $3</div>" % [cmdName, word, htmlTmpl % content]
      of tLatex:
        doc.addToHead.incl "\\usepackage{amsthm}"
        doc.addToHead.incl "\\newtheorem{$1}{$2}[section]" % [cmdName, word]
        "\\begin{$1}$2\end{$1}" % [cmdName, latexTmpl % content]


  command "#", literal, unrendered:
    ""

  command "", literal, unrendered:
    arg

  command ";", void, unrendered:
    ";"

  command "()", render, rendered:
    "[" & arg & "]"

  command "(", void, unrendered:
    "["

  command ")", void, unrendered:
    "]"

  command "--", void, unrendered:
    "–"

  command "---", void, unrendered:
    "—"

  command "$", raw, rendered:
    doc.stack[^1].commands = mathCommands(doc)
    case doc.target
    of tHtml:
      case doc.mathRenderer
      of mrKatexJsdelivr:
        initKatexJsdelivr()
        "<xd-inline-math>$1</xd-inline-math>" % doc.renderStr(arg)
      of mrKatex:
        initKatexJsdelivrCss()
        "<xd-inline-math>$1</xd-inline-math>" % renderMathKatex(doc.expandStr(arg), false)
    of tLatex:
      "\\($1\\)" % doc.expandStr(arg)

  command "$$", raw, rendered:
    doc.stack[^1].commands = mathCommands(doc)
    case doc.target
    of tHtml:
      doc.addToHead.incl """<style>xd-block-math{display:block}</style>"""
      case doc.mathRenderer
      of mrKatexJsdelivr:
        initKatexJsdelivr()
        "<xd-block-math>$1</xd-block-math>" % doc.renderStr(arg)
      of mrKatex:
        initKatexJsdelivrCss()
        "<xd-block-math>$1</xd-block-math>" % renderMathKatex(doc.expandStr(arg), true)
    of tLatex:
      "\\[$1\\]" % doc.expandStr(arg)

  command "$$&", raw, rendered:
    doc.stack[^1].commands = mathCommands(doc)
    case doc.target
    of tHtml:
      doc.addToHead.incl """<style>xd-block-math{display:block}</style>"""
      case doc.mathRenderer
      of mrKatexJsdelivr:
        initKatexJsdelivr()
        "<xd-block-math>\\begin{align*}$1\\end{align*}</xd-block-math>" % doc.renderStr(arg)
      of mrKatex:
        initKatexJsdelivrCss()
        "<xd-block-math>$1</xd-block-math>" % renderMathKatex("\\begin{align*}$1\\end{align*}" % doc.expandStr(arg), true)
    of tLatex:
      "\\begin{align*}$1\\end{align*}" % doc.expandStr(arg)

  command "LaTeX", void, rendered:
    case doc.target
    of tHtml:
      case doc.mathRenderer
      of mrKatexJsdelivr:
        initKatexJsdelivr()
        "<xd-inline-math>\\text{\\LaTeX}</xd-inline-math>"
      of mrKatex:
        initKatexJsdelivrCss()
        "<xd-inline-math>$1</xd-inline-math>" % renderMathKatex("\\text{\\LaTeX}", false)
    of tLatex:
      "\\LaTeX{}"

  command "add-to-head", render, rendered:
    doc.addToHead.incl arg
    ""

  command "arg", expand, rendered:
    doc.renderStr(doc.lookup(args, arg))

  command "arg-expand", expand, expanded:
    doc.expandStr(doc.lookup(args, arg))

  command "arg-raw", expand, expanded:
    doc.lookup(args, arg)

  command "arg-raw-escape", expand, rendered:
    escapeText(doc.lookup(args, arg), doc.target)

  command "bf", render, rendered:
    case doc.target
    of tHtml:
      "<b>$1</b>" % arg
    of tLatex:
      "\\textbf{$1}" % arg

  command "color", (color: expand, text: render), rendered:
    case doc.target
    of tHtml:
      "<span style=\"color:$1\">$2</span>" % [color, text]
    of tLatex:
      doc.addToHead.incl "\\usepackage[svgnames]{xcolor}"
      "\\textcolor{$1}{$2}" % [color, text]

  command "def", (name: expand, paramList: ?expand, body: raw), rendered:
    let params = paramList.map(it => it.splitWhitespace).get(@[])
    doc.stack[0].commands[name] = proc(arg: string): XidocString =
      let argsList = if arg == "": @[] else: parseXidocArguments(arg)
      if argsList.len != params.len:
        xidocError "Command $1 needs exactly $2 arguments, $3 given" % [name, $params.len, $argsList.len]
      # Merging the following two lines into one causes the thing to break. WTF?
      let argsTable = zip(params, argsList).toTable
      doc.stack[^1].args = argsTable
      result = XidocString(rendered: true, str: doc.renderStr(body))
    ""

  theoremLikeCommand("dfn", pDefinition, "$1", "$1")

  theoremLikeCommand("example", pExample, "$1", "$1")

  theoremLikeCommand("exercise", pExercise, "$1", "$1")

  command "expand", expand, expanded:
    doc.expandStr(arg)

  command "hide", expand, rendered:
    ""

  command "html-add-attrs", (args: expand, tag: render), rendered:
    case doc.target
    of tHtml:
      var matches: array[2, string]
      if not tag.match(peg"{'<' [a-zA-Z-]+} {.*}", matches):
        xidocError "Can't add HTML attribute to something that isn't an HTML tag"
      var attrs = newSeq[string]()
      var classes = newSeq[string]()
      for arg in args.splitWhitespace:
        if arg.startsWith "#":
          attrs.add "id=\"$1\"" % arg[1..^1]
        elif arg.startsWith ".":
          classes.add arg[1..^1]
        else:
          attrs.add arg
      if classes.len != 0:
        attrs.add "class=\"$1\"" % classes.join(" ")
      matches.join(" " & attrs.join(" "))
    else:
      tag

  command "if-html", raw, rendered:
    if doc.target == tHtml:
      doc.renderStr(arg)
    else:
      ""

  command "if-latex", raw, rendered:
    if doc.target == tLatex:
      doc.renderStr(arg)
    else:
      ""

  command "include", (filename: expand, args: *render), rendered:
    if args.len mod 2 != 0:
      xidocError "Additional arguments to include must come in pairs"
    let path = doc.path.splitPath.head / filename
    try:
      let subdoc = Document(
        path: path,
        body: readFile(path),
        target: doc.target,
        snippet: true,
        stack: @[Frame(
          cmdName: "[top]",
          lang: some doc.lookup(lang),
        )]
      )
      subdoc.stack[0].commands = defaultCommands(subdoc)
      for i in 0..<(args.len div 2):
        subdoc.templateArgs[args[2 * i]] = args[2 * i + 1]
      subdoc.renderStr(subdoc.body)
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  command "inject", (filename: expand), rendered:
    let path = doc.path.splitPath.head / filename
    try:
      doc.renderStr(readFile(path))
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  command "it", render, rendered:
    case doc.target
    of tHtml:
      "<i>$1</i>" % arg
    of tLatex:
      "\\textit{$1}" % arg

  command "lang", (langStr: expand, body: raw), rendered:
    let lang =
      case langStr.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      else: xidocError "Unknown language: $1" % langStr
    doc.stack[^1].lang = some lang
    doc.renderStr(body)

  command "link", (name: ?render, url: expand), rendered:
    case doc.target
    of tHtml:
      "<a href=\"$1\">$2</a>" % [url, name.get(url)]
    of tLatex:
      "" # TODO

  command "list", (items: *render), rendered:
    case doc.target
    of tHtml:
      "<ul>$1</ul>" % items.mapIt("<li>$1</li>" % it).join
    of tLatex:
      "\\begin{itemize}$1\\end{iremize}" % items.mapIt("\\item $1" % it).join

  command "ms", render, rendered:
    case doc.target
    of tHtml:
      "<code>$1</code>" % arg
    of tLatex:
      "\\texttt{$1}" % arg

  command "p", render, rendered:
    case doc.target
    of tHtml:
      "<p>$1</p>" % arg
    of tLatex:
      "\\par $1" % arg

  command "pass", expand, rendered:
    arg.strip

  command "pass-raw", raw, rendered:
    arg.strip

  theoremLikeCommand("proof", pProof, "$1", "$1")

  command "props", (items: *render), rendered:
    case doc.target
    of tHtml:
      "<ul>$1</ul>" % items.mapIt("<li>$1</li>" % it).join
    of tLatex:
      "\\begin{itemize}$1\\end{iremize}" % items.mapIt("\\item $1" % it).join

  command "raw", raw, unrendered:
    arg.strip

  command "render", expand, rendered:
    doc.renderStr(arg)

  command "section", (name: ?render, content: render), rendered:
    let depth = doc.stack.countIt(it.cmdName == "section")
    case doc.target
    of tHtml:
      if name.isSome:
        let headingTag =
          case depth
          of 1: "h2"
          of 2: "h3"
          of 3: "h4"
          of 4: "h5"
          else: "h6"
        "<section><$1 class=\"xd-section-heading\">$2</$1>$3</section>" % [headingTag, name.get, content]
      else:
        "<section>$1</section>" % [content]
    of tLatex:
      if name.isSome:
        "\\section*{$1}$2" % [name.get, content]
      else:
        "\\section*{}$1" % [content]

  command "set-doc-lang", expand, rendered:
    doc.stack[0].lang = some(
      case arg.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      else: xidocError "Unknown language: $1" % arg
    )
    ""

  command "set-math-renderer", expand, rendered:
    doc.mathRenderer = case arg
    of "katex-jsdelivr": mrKatexJsdelivr
    of "katex", "katex-duktape": mrKatex
    else: xidocError "Invalid value for set-math-renderer: $1" % arg
    ""

  command "set-title", expand, rendered:
    case doc.target
    of tHtml:
      doc.addToHead.incl "<title>$1</title>" % arg
    of tLatex:
      doc.addToHead.incl "\\title{$1}" % arg
    ""

  theoremLikeCommand("solution", pSolution, "$1", "$1")

  command "spoiler", (title: render, content: render), rendered:
    case doc.target
    of tHtml:
      "<details class=\"xd-spoiler\"><summary>$1</summary>$2</details>" % [title, content]
    of tLatex:
      xidocError "The spoiler command is not supported in the LaTeX backend"

  command "spoiler-solution", (name: ?render, content: render), rendered:
    let word = pSolution.translate(doc.lookup(lang))
    case doc.target
    of tHtml:
      if name.isSome:
        "<details class=\"xd-spoiler\"><summary><strong>$1 ($2)</strong></summary>$3</details>" % [word, name.get, content]
      else:
        "<details class=\"xd-spoiler\"><summary><strong>$1</strong></summary>$2</details>" % [word, content]
    of tLatex:
      doc.addToHead.incl "\\usepackage{amsthm}"
      doc.addToHead.incl "\\newtheorem{$1}{$2}[section]" % ["spoilersolution", word]
      "\\begin{$1}$2\end{$1}" % ["spoilersolution", content]

  command "style", raw, rendered:
    case doc.target
    of tHtml:
      doc.stack[^1].commands = cssCommands(doc)
      doc.addToHead.incl "<style>$1</style>" % doc.expandStr(arg)
      ""
    else:
      xidocError "The style command can be used only in the HTML backend"


  command "template-arg", render, rendered:
    try:
      doc.templateArgs[arg]
    except KeyError:
      xidocError: &"Template argument not found: {arg}"

  command "term", render, rendered:
    case doc.target
    of tHtml:
      "<dfn>$1</dfn>" % arg
    of tLatex:
      "\\textit{$1}" % arg

  theoremLikeCommand("theorem", pTheorem, "$1", "$1")

  command "title", render, rendered:
    case doc.target
    of tHtml:
      doc.addToHead.incl "<title>$1</title>" % arg
      "<h1>$1</h1>" % arg
    of tLatex:
      doc.addToHead.incl "\\title{$1}" % arg
      "\\maketitle"

  case doc.target
  of tHtml:

    proc generateHtmlTag(tag: string, args: seq[string], body = "", paired = true): string =
      var attrs = newSeq[string]()
      var classes = newSeq[string]()
      for arg in args:
        if arg.startsWith "#":
          attrs.add "id=\"$1\"" % arg[1..^1]
        elif arg.startsWith ".":
          classes.add arg[1..^1]
        else:
          attrs.add arg
      if classes.len != 0:
        attrs.add "class=\"$1\"" % classes.join(" ")
      if paired:
        "<$1>$2</$3>" % [(@[tag] & attrs).join(" "), body, tag]
      else:
        "<$1 />" % [(@[tag] & attrs).join(" ")]

    command "<>", (tag: expand, args: *expand, body: render), rendered:
      generateHtmlTag(tag, args, body)

    for tag in htmlTags:
      # This proc makes sure that tag is captured by value
      (proc(tag: string) =
        if tag in htmlUnpairedTags:
          command "<$1>" % tag, (args: *expand), rendered:
            generateHtmlTag(tag, args, paired = false)
        else:
          command "<$1>" % tag, (args: *expand, body: render), rendered:
            generateHtmlTag(tag, args, body)
      )(tag)

  else:
    discard

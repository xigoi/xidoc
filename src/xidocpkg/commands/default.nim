from std/htmlgen as htg import nil
from std/pegs import match, peg
import ../error
import ../expand
import ../janetinterpret
import ../jsinterpret
import ../parser
import ../translations
import ../types
import ./checkbox
import ./css
import ./draw
import ./math
import ./utils
import matext
import std/options
import std/os
import std/sequtils
import std/sets
import std/strformat
import std/strutils
import std/sugar
import std/tables

const
  htmlTags = "!-- !DOCTYPE a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center circle cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset g h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd label legend li line link main map mark meta meter nav noframes noscript object ol optgroup option output p param path picture polyline pre progress q rect rp rt ruby s samp script section select small source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr".splitWhitespace
  htmlSelfClosingTags = "area base br circle col embed hr img input line link meta param polyline source path rect track wbr".splitWhitespace
  prismCss = [
    shtDefault: staticRead("../../prism/default.css"),
    shtDark: staticRead("../../prism/dark.css"),
    shtFunky: staticRead("../../prism/funky.css"),
    shtFunkyX: staticRead("../../prism/funky-x.css"),
    shtOkaidia: staticRead("../../prism/okaidia.css"),
    shtTwilight: staticRead("../../prism/twilight.css"),
    shtCoy: staticRead("../../prism/coy.css"),
    shtSolarizedLight: staticRead("../../prism/solarized-light.css"),
    shtTomorrowNight: staticRead("../../prism/tomorrow-night.css"),
  ]
  syntaxHighlightingThemeTable = SyntaxHighlightingTheme.mapIt(($it, it)).toTable

commands defaultCommands:

  template theoremLikeCommand(cmdName: static string, phrase: static Phrase, htmlTmpl, latexTmpl: static string, before: untyped = ()) =
    command cmdName, (thName: ?Markup, content: raw), Markup:
      when typeof(before) is void:
        before
      let content = doc.renderStr(content)
      let word = phrase.translate(doc.lookup(lang))
      case doc.target
      of tHtml:
        doc.addToStyle.incl ".xd-theorem-like{margin:1em 0}.xd-theorem-like>p{margin:0.5em 0}"
        htg.`div`(class = &"xd-theorem-like xd-$1" % cmdName,
          htg.strong(if thName.isSome: "$1 ($2)." % [word, thName.get] else: "$1." % [word]), " ", htmlTmpl % content
        )
      of tLatex:
        doc.addToHead.incl "\\usepackage{amsthm}"
        doc.addToHead.incl "\\theoremstyle{definition}\\newtheorem*{XD$1}{$2}" % [cmdName, word]
        "\\begin{XD$1}$2\\end{XD$1}" % [cmdName, latexTmpl % content]
      of tGemtext:
        "\n\n$1. $2" % [if thName.isSome: "$1 ($2)" % [word, thName.get] else: "$1" % [word], content]


  command "#", literal, String:
    ""

  command ";", void, String:
    ";"

  command "()", Markup, Markup:
    "[" & arg & "]"

  command "(", void, String:
    "["

  command ")", void, String:
    "]"

  command "--", void, String:
    "–"

  command "---", void, String:
    "—"

  command "...", void, String:
    "…"

  command "\"", Markup, Markup:
    case doc.target
    of tLatex:
      doc.addToHead.incl "\\usepackage{csquotes}"
      "\\enquote{$1}" % arg
    else:
      pQuotation.translate(doc.lookup(lang)) % arg

  command "$", raw, Markup:
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath(doc.expandStr(arg), displayMode = false)

  command "$$", raw, Markup:
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath(doc.expandStr(arg), displayMode = true)

  command "$$&", raw, Markup:
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath("\\begin{align*}$1\\end{align*}" % doc.expandStr(arg), displayMode = true, addDelimiters = false)

  command "\\", literal, String:
    arg.strip(chars = {'\n'}).dedent

  command "LaTeX", void, Markup:
    case doc.target
    of tHtml:
      doc.addToStyle.incl """.xd-latex{text-transform:uppercase;font-size:1em;}.xd-latex>sub{vertical-align:-0.5ex;margin-left:-0.1667em;margin-right:-0.125em;}.xd-latex>sup{font-size:0.85em;vertical-align:0.15em;margin-left:-0.36em;margin-right:-0.15em;}"""
      htg.span(class = "xd-latex", "L", htg.sup("a"), "T", htg.sub("e"), "X")
    of tLatex:
      "\\LaTeX{}"
    of tGemtext:
      "LaTeX"

  command "add-to-head", Markup, Markup:
    doc.addToHead.incl arg
    ""

  command "arg", String, Markup:
    doc.renderStr(doc.lookup(args, arg))

  command "arg-expand", String, String:
    doc.expandStr(doc.lookup(args, arg))

  command "arg-raw", String, String:
    doc.lookup(args, arg)

  command "arg-raw-escape", String, Markup:
    escapeText(doc.lookup(args, arg), doc.target)

  # command "arg\\", String, String:
  #   doc.lookup(args, arg).dedent

  # command "arg\\-escape", String, String:
  #   escapeText(doc.lookup(args, arg).dedent, doc.target)

  command "bf", Markup, Markup:
    case doc.target
    of tHtml:
      htg.b(arg)
    of tLatex:
      "\\textbf{$1}" % arg
    of tGemtext:
      arg

  command "block-quote", Markup, Markup:
    case doc.target
    of tHtml:
      htg.blockquote(arg)
    of tLatex:
      "\\begin{quote}$1\\end{quote}" % arg
    of tGemtext:
      "\n> $1\n" % arg

  command "checkboxes", raw, Markup:
    case doc.target
    of tHtml:
      doc.stack[^1].commands = checkboxCommands(doc)
      doc.addToStyle.incl """.xd-checkbox-unchecked{list-style-type:"☐ "}.xd-checkbox-checked{list-style-type:"☑ "}.xd-checkbox-crossed{list-style-type:"☒ "}"""
      htg.ul(class = "xd-checkboxes", doc.expandStr(arg))
    else:
      xidocError "Checkboxes are currently not supported for the LaTeX target"

  command "code", (lang: ?String, code: String), Markup:
    case doc.target
    of tHtml:
      doc.addToStyle.incl(prismCss[doc.syntaxHighlightingTheme])
      if lang.isSome:
        htg.code(class = &"language-{lang.get}", code.highlightCode(lang.get))
      else:
        htg.code(code.escapeText(doc.target))
    of tLatex:
      # TODO: use minted
      "\\texttt{$1}" % code
    of tGemtext:
      "\n```\n{$1}\n```\n" % code

  command "code-block", (lang: ?String, code: String), Markup:
    case doc.target
    of tHtml:
      doc.addToStyle.incl(prismCss[doc.syntaxHighlightingTheme])
      if lang.isSome:
        htg.pre(class = &"language-{lang.get}", htg.code(class = &"language-{lang.get}", code.highlightCode(lang.get)))
      else:
        htg.pre(htg.code(code.escapeText(doc.target)))
    of tLatex:
      # TODO: use minted
      doc.addToHead.incl "\\usepackage{minted}"
      "\\begin{minted}$1\n$2\n\\end{minted}\n" % [lang.map(lang => "{$1}" % lang).get(""), code]
    of tGemtext:
      "\n```\n{$1}\n```\n" % code

  command "color", (color: String, text: Markup), Markup:
    case doc.target
    of tHtml:
      htg.span(style = &"color:{color}", text)
    of tLatex:
      doc.addToHead.incl "\\usepackage[svgnames]{xcolor}"
      "\\textcolor{$1}{$2}" % [color, text]
    of tGemtext:
      text

  template def(global: static bool): string {.dirty.} =
    let params = paramList.map(it => it.splitWhitespace).get(@[])
    doc.stack[when global: 0 else: ^2].commands[name] = proc(arg: string): XidocValue =
      let argsList = if arg == "": @[] else: parseXidocArguments(arg)
      if argsList.len != params.len:
        xidocError "Command $1 needs exactly $2 arguments, $3 given" % [name, $params.len, $argsList.len]
      # Merging the following two lines into one causes the thing to break. WTF?
      let argsTable = zip(params, argsList).toTable
      doc.stack[^1].args = argsTable
      result = XidocValue(typ: Markup, str: doc.renderStr(body))
    ""

  command "def", (name: String, paramList: ?String, body: raw), Markup:
    def(global = false)

  command "def-global", (name: String, paramList: ?String, body: raw), Markup:
    def(global = true)

  theoremLikeCommand("dfn", pDefinition, "$1", "$1")

  command "draw", (width: ?String, height: ?String, desc: raw), Markup:
    doc.stack[^1].commands = drawCommands(doc)
    case doc.target
    of tHtml:
      &"""<svg width="{width.get("360")}" height="{height.get("360")}" viewBox="0 0 360 360" version="1.1" xmlns="http://www.w3.org/2000/svg">{doc.expandStr(desc)}</svg>"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  theoremLikeCommand("example", pExample, "$1", "$1")

  theoremLikeCommand("exercise", pExercise, "$1", "$1")

  command "expand", String, String:
    doc.expandStr(arg)

  command "for-each", (name: String, list: List, tmpl: raw), List:
    var results: seq[XidocValue]
    for item in list:
      let itemCopy = item
      doc.stack[^1].commands[name] = (_) => itemCopy
      results.add doc.expand(tmpl, item.typ)
    results

  command "get-doc-path-absolute", void, String:
    doc.stack[0].path.map(path => absolutePath(path)).get("")

  command "get-doc-path-relative-to-containing", String, String:
    when defined(js):
      ""
    else:
      doc.stack[0].path.map(path => (
        var ancestor = path.parentDir
        while ancestor != "":
          let candidate = ancestor / arg
          if fileExists(candidate) or dirExists(candidate) or symlinkExists(candidate):
            break
          ancestor = ancestor.parentDir
        path.relativePath(ancestor)
      )).get("")

  command "hide", String, Markup:
    ""

  command "header-row", (entries: *Markup), Markup:
    if not doc.stack.anyIt(it.cmdName == "table"):
      xidocError "The header-row command has to be inside a table command"
    case doc.target
    of tHtml:
      htg.tr(entries.mapIt(htg.th(it)).join)
    of tLatex:
      "$1\\\\\\midrule " % entries.join("&")
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  command "html-add-attrs", (args: String, tag: Markup), Markup:
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

  command "if-html", raw, Markup:
    if doc.target == tHtml:
      doc.renderStr(arg)
    else:
      ""

  command "if-latex", raw, Markup:
    if doc.target == tLatex:
      doc.renderStr(arg)
    else:
      ""

  command "if-gemtext", raw, Markup:
    if doc.target == tGemtext:
      doc.renderStr(arg)
    else:
      ""

  command "include", (filename: String, args: *Markup), Markup:
    if args.len mod 2 != 0:
      xidocError "Additional arguments to include must come in pairs"
    let path = doc.lookup(path).splitPath.head / filename
    try:
      let subdoc = Document(
        body: readFile(path),
        target: doc.target,
        snippet: true,
        stack: @[Frame(
          cmdName: "[top]",
          lang: some doc.lookup(lang),
          path: some(path),
        )]
      )
      subdoc.stack[0].commands = defaultCommands(subdoc)
      for i in 0..<(args.len div 2):
        subdoc.templateArgs[args[2 * i]] = args[2 * i + 1]
      subdoc.renderStr(subdoc.body)
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  command "inject", (filename: String), Markup:
    let path = doc.lookup(path).splitPath.head / filename
    doc.stack[^1].path = some(path)
    try:
      doc.renderStr(readFile(path))
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  command "it", Markup, Markup:
    case doc.target
    of tHtml:
      htg.i(arg)
    of tLatex:
      "\\textit{$1}" % arg
    of tGemtext:
      arg

  command "janet-call", (function: String, args: *String), String:
    janetCall(function, args, doc.lookup(path))

  command "janet-eval", (code: String, args: *String), String:
    if args.len mod 2 != 0:
      xidocError "Arguments to janet-eval must come in pairs of name; value"
    var values = newSeqOfCap[(string, string)](args.len div 2)
    for i in 0 ..< args.len div 2:
      values.add (args[2 * i], args[2 * i + 1])
    janetEval(code, values, doc.lookup(path))

  command "join", (sep: Markup, list: List), Markup:
    list.mapIt(it.str).join(sep)

  command "js-call", (function: String, args: *String), String:
    jsCall(function, args)

  command "js-eval", (code: String, args: *String), String:
    if args.len mod 2 != 0:
      xidocError "Arguments to js-eval must come in pairs of name; value"
    var values = newSeqOfCap[(string, string)](args.len div 2)
    for i in 0 ..< args.len div 2:
      values.add (args[2 * i], args[2 * i + 1])
    jsEval(code, values)

  command "js-module", String, Markup:
    if doc.target == tHtml:
      doc.addToHead.incl htg.script(`type` = "module", arg)
    ""

  command "js-module-raw", raw, Markup:
    if doc.target == tHtml:
      doc.addToHead.incl htg.script(`type` = "module", arg)
    ""

  command "lang", (langStr: String, body: raw), Markup:
    let lang =
      case langStr.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      else: xidocError "Unknown language: $1" % langStr
    doc.stack[^1].lang = some lang
    doc.renderStr(body)

  theoremLikeCommand("lemma", pLemma, "$1", "$1")

  command "link", (name: ?Markup, url: String), Markup:
    case doc.target
    of tHtml:
      htg.a(href = url, name.get(url))
    of tLatex:
      "" # TODO
    of tGemtext:
      if name.isSome: "\n=> $1 $2" % [url, name.get] else: "\n=> $1" % [url]

  command "list", (items: *Markup), Markup:
    case doc.target
    of tHtml:
      htg.ul(items.mapIt(htg.li(it)).join)
    of tLatex:
      "\\begin{itemize}$1\\end{itemize}" % items.mapIt("\\item $1" % it).join
    of tGemtext:
      "\n$1\n" % items.mapIt("* $1" % it).join("\n")

  command "list-dirs", String, List:
    when defined(js):
      xidocError "The list-dirs command is not available when using JavaScript"
      @[]
    else:
      let currentDir = doc.lookup(path).splitFile.dir
      walkDirs(currentDir / arg).toSeq.mapIt(XidocValue(typ: String, str: it.relativePath(currentDir)))

  command "list-files", String, List:
    when defined(js):
      xidocError "The list-files command is not available when using JavaScript"
      @[]
    else:
      let currentDir = doc.lookup(path).splitFile.dir
      walkFiles(currentDir / arg).toSeq.mapIt(XidocValue(typ: String, str: it.relativePath(currentDir)))

  command "matext", String, Markup:
    let math = try:
      arg.matext
    except ValueError:
      xidocError "Error when parsing math: $1" % arg
    case doc.target
    of tHtml:
      htg.pre(class = "xd-matext", math)
    of tLatex:
      "\\begin{verbatim}$1\\end{verbatim}" % math
    of tGemtext:
      "\n```\n{$1}\n```\n" % math

  command "ms", Markup, Markup:
    case doc.target
    of tHtml:
      htg.code(arg)
    of tLatex:
      "\\texttt{$1}" % arg
    of tGemtext:
      "\n```\n{$1}\n```\n" % arg

  command "ordered-list", (items: *Markup), Markup:
    case doc.target
    of tHtml:
      htg.ol(items.mapIt(htg.li(it)).join)
    of tLatex:
      "\\begin{enumerate}$1\\end{enumerate}" % items.mapIt("\\item $1" % it).join
    of tGemtext:
      # TODO: add numbers
      "\n$1\n" % items.mapIt("* $1" % it).join("\n")

  command "p", Markup, Markup:
    case doc.target
    of tHtml:
      htg.p(arg)
    of tLatex:
      "\\par $1" % arg
    of tGemtext:
      "\n\n$1" % arg

  command "pass", String, Markup:
    arg

  command "pass-raw", raw, Markup:
    arg

  theoremLikeCommand("proof", pProof, "$1", "$1"):
    doc.stack[^1].commands = proofCommands(doc)

  command "props", (items: *Markup), Markup:
    case doc.target
    of tHtml:
      htg.ul(items.mapIt(htg.li(it)).join)
    of tLatex:
      "\\begin{itemize}$1\\end{iremize}" % items.mapIt("\\item $1" % it).join
    of tGemtext:
      "\n$1\n" % items.mapIt("* $1" % it).join("\n")

  command "raw", raw, String:
    arg

  command "render", String, Markup:
    doc.renderStr(arg)

  command "replace-suffix", (sub: String, by: String, str: String), String:
    var str = str
    if str.endsWith(sub):
      str.removeSuffix(sub)
      str &= by
    str

  command "row", (entries: *Markup), Markup:
    if not doc.stack.anyIt(it.cmdName == "table"):
      xidocError "The row command has to be inside a table command"
    case doc.target
    of tHtml:
      htg.tr(entries.mapIt(htg.td(it)).join)
    of tLatex:
      "$1\\\\" % entries.join("&")
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  command "section", (name: ?Markup, content: Markup), Markup:
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
        htg.section("<$1 class=\"xd-section-heading\">$2</$1>$3" % [headingTag, name.get, content])
      else:
        htg.section(content)
    of tLatex:
      let cmd =
        case depth
        of 1: "section"
        of 2: "subsection"
        of 3: "subsubsection"
        else: xidocError "Sections can only be nested 3 levels deep in LaTeX"
      if name.isSome:
        "\\$1*{$2}$3" % [cmd, name.get, content]
      else:
        "\\$1*{}$2" % [cmd, content]
    of tGemtext:
      if name.isSome:
        let prefix =
          case depth
          of 1: "## "
          of 2: "### "
          else: ""
        "\n\n$1$2\n\n$3" % [prefix, name.get, content]
      else:
        "\n\n$1" % [content]

  command "set-doc-lang", String, Markup:
    doc.stack[0].lang = some(
      case arg.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      else: xidocError "Unknown language: $1" % arg
    )
    ""

  command "set-math-renderer", String, Markup:
    xidocWarning "set-math-renderer is deprecated. Math rendering will always be done at compile time."
    ""

  command "set-syntax-highlighting-theme", String, Markup:
    case doc.target
    of tHtml:
      if arg notin syntaxHighlightingThemeTable:
        xidocError &"Invalid syntax highlighting theme: {arg}"
      doc.syntaxHighlightingTheme = syntaxHighlightingThemeTable[arg]
    else:
      discard
    ""

  command "set-title", String, Markup:
    case doc.target
    of tHtml:
      doc.addToHead.incl htg.title(arg)
    of tLatex:
      doc.addToHead.incl "\\title{$1}" % arg
    else:
      discard
    ""

  command "show-title", String, Markup:
    case doc.target
    of tHtml:
      htg.h1(arg)
    of tLatex:
      "\\maketitle"
    of tGemtext:
      "\n# $1\n\n" % arg

  theoremLikeCommand("solution", pSolution, "$1", "$1")

  command "space", void, String:
    " "

  command "spoiler", (title: Markup, content: Markup), Markup:
    case doc.target
    of tHtml:
      htg.details(class = "xd-spoiler", htg.summary(title), content)
    of tLatex:
      xidocError "The spoiler command is not supported in the LaTeX backend"
    of tGemtext:
      xidocError "The spoiler command is not supported in the Gemtext backend"

  command "spoiler-solution", (name: ?Markup, content: Markup), Markup:
    let word = pSolution.translate(doc.lookup(lang))
    case doc.target
    of tHtml:
      htg.details(class = "xd-spoiler",
        htg.summary(htg.strong(if name.isSome: "$1 ($2)" % [word, name.get] else: "$1" % [word])), content
      )
    of tLatex:
      doc.addToHead.incl "\\usepackage{amsthm}"
      doc.addToHead.incl "\\newtheorem{$1}{$2}[section]" % ["spoilersolution", word]
      "\\begin{$1}$2\end{$1}" % ["spoilersolution", content]
    of tGemtext:
      xidocError "The spoiler-solution command is not supported in the Gemtext backend"

  command "style", raw, Markup:
    case doc.target
    of tHtml:
      doc.stack[^1].commands = cssCommands(doc)
      doc.addToStyle.incl doc.expandStr(arg)
    else:
      discard
    ""

  command "table", (spec: ?String, content: Markup), Markup:
    case doc.target
    of tHtml:
      htg.table(content)
    of tLatex:
      if spec.isNone:
        xidocError "Tables in LaTeX currently require a spec"
      doc.addToHead.incl "\\usepackage{booktabs}"
      "\\begin{table}{$1}\\toprule $2\\bottomrule\\end{table}" % [spec.get, content]
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  command "template-arg", Markup, Markup:
    try:
      doc.templateArgs[arg]
    except KeyError:
      xidocError: &"Template argument not found: {arg}"

  command "term", Markup, Markup:
    case doc.target
    of tHtml:
      htg.dfn(arg)
    of tLatex:
      "\\textit{$1}" % arg
    of tGemtext:
      arg

  theoremLikeCommand("theorem", pTheorem, "$1", "$1")

  command "title", (title: Markup, author: ?Markup), Markup:
    case doc.target
    of tHtml:
      doc.addToHead.incl htg.title(title)
      htg.h1(title) & author.map(author => htg.address(author)).get("")
    of tLatex:
      doc.addToHead.incl "\\title{$1}" % title
      if author.isSome:
        doc.addToHead.incl "\\author{$1}" % author.get
      "\\maketitle"
    of tGemtext:
      "# $1\n\n" % title

  command "unit", (number: ?Markup, unit: Markup), Markup:
    if number.isSome:
      # U+2009 Thin Space
      number.get & "\u2009" & unit
    else:
      unit

  command "xidoc", void, Markup:
    case doc.target
    of tHtml:
      doc.addToStyle.incl ".xd-logo{color:#d0c;font-weight:bold}"
      htg.span(class = "xd-logo", "ξ")
    of tLatex:
      doc.addToHead.incl "\\usepackage[svgnames]{xcolor}"
      "\\textcolor{#d0c}{\\(\\xi\\)}"
    of tGemtext:
      "[ξ]"

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

    command "<>", (tag: String, args: *String, body: Markup), Markup:
      generateHtmlTag(tag, args, body)

    for tag in htmlTags:
      # This proc makes sure that tag is captured by value
      (proc(tag: string) =
        if tag in htmlSelfClosingTags:
          command "<$1>" % tag, (args: *String), Markup:
            generateHtmlTag(tag, args, paired = false)
        else:
          command "<$1>" % tag, (args: *String, body: Markup), Markup:
            generateHtmlTag(tag, args, body)
      )(tag)

  of tLatex:

    command "\\", (command: String, args: *Markup), Markup:
      "\\" & args.mapIt("{$1}" % it).join

  else:
    discard

from std/htmlgen as htg import nil
from std/pegs import match, peg
import ../error
import ../expand
import ../jsinterpret
import ../parser
import ../translations
import ../types
import ./checkbox
import ./css
import ./draw
import ./math
import ./utils
import std/options
import std/os
import std/sequtils
import std/sets
import std/strformat
import std/strutils
import std/sugar
import std/tables

const
  htmlTags = "!-- !DOCTYPE a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center circle cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd label legend li link main map mark meta meter nav noframes noscript object ol optgroup option output p param path picture pre progress q rect rp rt ruby s samp script section select small source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr".splitWhitespace
  htmlSelfClosingTags = "area base br circle col embed hr img input link meta param source path rect track wbr".splitWhitespace
  prismCss = [
    shtDefault: staticRead("../../prism/default.css"),
    shtDark: staticRead("../../prism/dark.css"),
    shtFunky: staticRead("../../prism/funky.css"),
    shtOkaidia: staticRead("../../prism/okaidia.css"),
    shtTwilight: staticRead("../../prism/twilight.css"),
    shtCoy: staticRead("../../prism/coy.css"),
    shtSolarizedLight: staticRead("../../prism/solarized-light.css"),
    shtTomorrowNight: staticRead("../../prism/tomorrow-night.css"),
  ]
  syntaxHighlightingThemeTable = SyntaxHighlightingTheme.mapIt(($it, it)).toTable

commands defaultCommands:

  template theoremLikeCommand(cmdName: static string, phrase: static Phrase, htmlTmpl, latexTmpl: static string, before: untyped = ()) =
    command cmdName, (thName: ?render, content: raw), rendered:
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
        doc.addToHead.incl "\\newtheorem{$1}{$2}[section]" % [cmdName, word]
        "\\begin{$1}$2\end{$1}" % [cmdName, latexTmpl % content]


  command "#", literal, unrendered:
    ""

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

  command "...", void, unrendered:
    "…"

  command "\"", render, rendered:
    pQuotation.translate(doc.lookup(lang)) % arg

  command "$", raw, rendered:
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath(doc.expandStr(arg), displayMode = false)

  command "$$", raw, rendered:
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath(doc.expandStr(arg), displayMode = true)

  command "$$&", raw, rendered:
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath("\\begin{align*}$1\\end{align*}" % doc.expandStr(arg), displayMode = true)

  command "LaTeX", void, rendered:
    case doc.target
    of tHtml:
      doc.addToStyle.incl """.xd-latex{text-transform:uppercase;font-size:1em;}.xd-latex>sub{vertical-align:-0.5ex;margin-left:-0.1667em;margin-right:-0.125em;}.xd-latex>sup{font-size:0.85em;vertical-align:0.15em;margin-left:-0.36em;margin-right:-0.15em;}"""
      htg.span(class = "xd-latex", "L", htg.sup("a"), "T", htg.sub("e"), "X")
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
      htg.b(arg)
    of tLatex:
      "\\textbf{$1}" % arg

  command "checkboxes", raw, rendered:
    case doc.target
    of tHtml:
      doc.stack[^1].commands = checkboxCommands(doc)
      doc.addToStyle.incl """.xd-checkbox-unchecked{list-style-type:"☐ "}.xd-checkbox-checked{list-style-type:"☑ "}.xd-checkbox-crossed{list-style-type:"☒ "}"""
      htg.ul(class = "xd-checkboxes", doc.expandStr(arg))
    else:
      xidocError "Checkboxes are currently not supported for the LaTeX target"

  command "code", (lang: ?expand, code: expand), rendered:
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

  command "code-block", (lang: ?expand, code: expand), rendered:
    case doc.target
    of tHtml:
      doc.addToStyle.incl(prismCss[doc.syntaxHighlightingTheme])
      if lang.isSome:
        htg.pre(class = &"language-{lang.get}", htg.code(class = &"language-{lang.get}", code.highlightCode(lang.get)))
      else:
        htg.pre(htg.code(code.escapeText(doc.target)))
    of tLatex:
      # TODO: use minted
      "\\texttt{$1}" % code

  command "color", (color: expand, text: render), rendered:
    case doc.target
    of tHtml:
      htg.span(style = &"color:{color}", text)
    of tLatex:
      doc.addToHead.incl "\\usepackage[svgnames]{xcolor}"
      "\\textcolor{$1}{$2}" % [color, text]

  template def(global: static bool): string {.dirty.} =
    let params = paramList.map(it => it.splitWhitespace).get(@[])
    doc.stack[when global: 0 else: ^2].commands[name] = proc(arg: string): XidocString =
      let argsList = if arg == "": @[] else: parseXidocArguments(arg)
      if argsList.len != params.len:
        xidocError "Command $1 needs exactly $2 arguments, $3 given" % [name, $params.len, $argsList.len]
      # Merging the following two lines into one causes the thing to break. WTF?
      let argsTable = zip(params, argsList).toTable
      doc.stack[^1].args = argsTable
      result = XidocString(rendered: true, str: doc.renderStr(body))
    ""
  command "def", (name: expand, paramList: ?expand, body: raw), rendered:
    def(global = false)

  command "def-global", (name: expand, paramList: ?expand, body: raw), rendered:
    def(global = true)

  theoremLikeCommand("dfn", pDefinition, "$1", "$1")

  command "draw", (width: ?expand, height: ?expand, desc: raw), rendered:
    doc.stack[^1].commands = drawCommands(doc)
    case doc.target
    of tHtml:
      &"""<svg width="{width.get("360")}" height="{height.get("360")}" viewBox="0 0 360 360" version="1.1" xmlns="http://www.w3.org/2000/svg">{doc.expandStr(desc)}</svg>"""
    else:
      xidocError "Drawing is currently not implemented in the LaTeX backend"

  theoremLikeCommand("example", pExample, "$1", "$1")

  theoremLikeCommand("exercise", pExercise, "$1", "$1")

  command "expand", expand, expanded:
    doc.expandStr(arg)

  command "hide", expand, rendered:
    ""

  command "header-row", (entries: *render), rendered:
    if not doc.stack.anyIt(it.cmdName == "table"):
      xidocError "The header-row command has to be inside a table command"
    case doc.target
    of tHtml:
      htg.tr(entries.mapIt(htg.th(it)).join)
    of tLatex:
      "$1\\\\\\midrule " % entries.join("&")

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

  command "inject", (filename: expand), rendered:
    let path = doc.lookup(path).splitPath.head / filename
    doc.stack[^1].path = some(path)
    try:
      doc.renderStr(readFile(path))
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  command "it", render, rendered:
    case doc.target
    of tHtml:
      htg.i(arg)
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
      htg.a(href = url, name.get(url))
    of tLatex:
      "" # TODO

  command "list", (items: *render), rendered:
    case doc.target
    of tHtml:
      htg.ul(items.mapIt(htg.li(it)).join)
    of tLatex:
      "\\begin{itemize}$1\\end{itemize}" % items.mapIt("\\item $1" % it).join

  command "ms", render, rendered:
    case doc.target
    of tHtml:
      htg.code(arg)
    of tLatex:
      "\\texttt{$1}" % arg

  command "p", render, rendered:
    case doc.target
    of tHtml:
      htg.p(arg)
    of tLatex:
      "\\par $1" % arg

  command "pass", expand, rendered:
    arg.strip

  command "pass-raw", raw, rendered:
    arg.strip

  theoremLikeCommand("proof", pProof, "$1", "$1"):
    doc.stack[^1].commands = proofCommands(doc)

  command "props", (items: *render), rendered:
    case doc.target
    of tHtml:
      htg.ul(items.mapIt(htg.li(it)).join)
    of tLatex:
      "\\begin{itemize}$1\\end{iremize}" % items.mapIt("\\item $1" % it).join

  command "raw", raw, unrendered:
    arg.strip

  command "render", expand, rendered:
    doc.renderStr(arg)

  command "row", (entries: *render), rendered:
    if not doc.stack.anyIt(it.cmdName == "table"):
      xidocError "The row command has to be inside a table command"
    case doc.target
    of tHtml:
      htg.tr(entries.mapIt(htg.td(it)).join)
    of tLatex:
      "$1\\\\" % entries.join("&")

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

  command "set-doc-lang", expand, rendered:
    doc.stack[0].lang = some(
      case arg.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      else: xidocError "Unknown language: $1" % arg
    )
    ""

  command "set-math-renderer", expand, rendered:
    stderr.writeLine "Warning: set-math-renderer is deprecated. Math rendering will always be done at compile time."
    ""

  command "set-syntax-highlighting-theme", expand, rendered:
    case doc.target
    of tHtml:
      if arg notin syntaxHighlightingThemeTable:
        xidocError &"Invalid syntax highlighting theme: {arg}"
      doc.syntaxHighlightingTheme = syntaxHighlightingThemeTable[arg]
    else:
      discard
    ""

  command "set-title", expand, rendered:
    case doc.target
    of tHtml:
      doc.addToHead.incl htg.title(arg)
    of tLatex:
      doc.addToHead.incl "\\title{$1}" % arg
    ""

  command "show-title", expand, rendered:
    case doc.target
    of tHtml:
      htg.h1(arg)
    of tLatex:
      "\\maketitle"

  theoremLikeCommand("solution", pSolution, "$1", "$1")

  command "spoiler", (title: render, content: render), rendered:
    case doc.target
    of tHtml:
      htg.details(class = "xd-spoiler", htg.summary(title), content)
    of tLatex:
      xidocError "The spoiler command is not supported in the LaTeX backend"

  command "spoiler-solution", (name: ?render, content: render), rendered:
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

  command "style", raw, rendered:
    case doc.target
    of tHtml:
      doc.stack[^1].commands = cssCommands(doc)
      doc.addToStyle.incl doc.expandStr(arg)
    else:
      discard
    ""

  command "table", (spec: ?expand, content: render), rendered:
    case doc.target
    of tHtml:
      htg.table(content)
    of tLatex:
      if spec.isNone:
        xidocError "Tables in LaTeX currently require a spec"
      doc.addToHead.incl "\\usepackage{booktabs}"
      "\\begin{table}{$1}\\toprule $2\\bottomrule\\end{table}" % [spec.get, content]

  command "template-arg", render, rendered:
    try:
      doc.templateArgs[arg]
    except KeyError:
      xidocError: &"Template argument not found: {arg}"

  command "term", render, rendered:
    case doc.target
    of tHtml:
      htg.dfn(arg)
    of tLatex:
      "\\textit{$1}" % arg

  theoremLikeCommand("theorem", pTheorem, "$1", "$1")

  command "title", render, rendered:
    case doc.target
    of tHtml:
      doc.addToHead.incl htg.title(arg)
      htg.h1(arg)
    of tLatex:
      doc.addToHead.incl "\\title{$1}" % arg
      "\\maketitle"

  command "unit", (number: ?render, unit: render), rendered:
    if number.isSome:
      # U+2009 Thin Space
      number.get & "\u2009" & unit
    else:
      unit

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
        if tag in htmlSelfClosingTags:
          command "<$1>" % tag, (args: *expand), rendered:
            generateHtmlTag(tag, args, paired = false)
        else:
          command "<$1>" % tag, (args: *expand, body: render), rendered:
            generateHtmlTag(tag, args, body)
      )(tag)

  else:
    discard

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
  prismCss = {
    "default": staticRead("../../prism/default.css"),
    "dark": staticRead("../../prism/dark.css"),
    "funky": staticRead("../../prism/funky.css"),
    "funky-x": staticRead("../../prism/funky-x.css"),
    "okaidia": staticRead("../../prism/okaidia.css"),
    "twilight": staticRead("../../prism/twilight.css"),
    "coy": staticRead("../../prism/coy.css"),
    "solarized-light": staticRead("../../prism/solarized-light.css"),
    "tomorrow-night": staticRead("../../prism/tomorrow-night.css"),
  }.toTable

commands defaultCommands:

  template theoremLikeCommand(procName: untyped, cmdName: static string, phrase: static Phrase, htmlTmpl, latexTmpl: static string, before: untyped = ()) =
    proc procName(thName: ?Markup, content: Raw): Markup {.command: cmdName.} =
      when typeof(before) is void:
        before
      let content = doc.renderStr(content)
      let word = phrase.translate(doc.lookup(lang))
      case doc.target
      of tHtml:
        doc.addToStyle.incl ".xd-theorem-like{margin:1rem 0}.xd-theorem-like>p{margin:0.5rem 0}"
        htg.`div`(class = &"xd-theorem-like xd-$1" % cmdName,
          htg.strong(if thName.isSome: "$1 ($2)." % [word, thName.get] else: "$1." % [word]), " ", htmlTmpl % content
        )
      of tLatex:
        doc.addToHead.incl "usepackage"{"amsthm"}
        doc.addToHead.incl "theoremstyle"{"definition"} & "newtheorem*"{"XD" & cmdName}{word}
        env("XD" & cmdName, latexTmpl % content)
      of tGemtext:
        "\n\n$1. $2" % [if thName.isSome: "$1 ($2)" % [word, thName.get] else: "$1" % [word], content]

  proc commentCmd(arg: Literal): String {.command: "#".} =
    ""

  proc semiCmd(): String {.command: ";".} =
    ";"

  proc bracketsCmd(arg: !Markup): Markup {.command: "()".} =
    "[" & arg & "]"

  proc leftBracketCmd(): String {.command: "(".} =
    "["

  proc rightBracketCmd(): String {.command: ")".} =
    "]"

  proc enDashCmd(): String {.command: "--".} =
    "–"

  proc emDashCmd(): String {.command: "---".} =
    "—"

  proc ellipsisCmd(): String {.command: "...".} =
    "…"

  proc quoteCmd(arg: !Markup): Markup {.command: "\"".} =
    case doc.target
    of tLatex:
      doc.addToHead.incl "usepackage"{"csquotes"}
      "enquote"{arg}
    else:
      pQuotation.translate(doc.lookup(lang)) % arg

  proc inlineMathCmd(arg: Raw): Markup {.command: "$".} =
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath(doc.expandStr(arg), displayMode = false)

  proc blockMathCmd(arg: Raw): Markup {.command: "$$".} =
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath(doc.expandStr(arg), displayMode = true)

  proc alignedMathCmd(arg: Raw): Markup {.command: "$$&".} =
    doc.stack[^1].commands = mathCommands(doc)
    doc.renderMath(env("align*", doc.expandStr(arg)), displayMode = true, addDelimiters = false)

  proc LaTeXCmd(): Markup {.command: "LaTeX".} =
    case doc.target
    of tHtml:
      doc.addToStyle.incl """.xd-latex{text-transform:uppercase;font-size:1em;}.xd-latex>sub{vertical-align:-0.5ex;margin-left:-0.1667em;margin-right:-0.125em;}.xd-latex>sup{font-size:0.85em;vertical-align:0.15em;margin-left:-0.36em;margin-right:-0.15em;}"""
      htg.span(class = "xd-latex", "L", htg.sup("a"), "T", htg.sub("e"), "X")
    of tLatex:
      "LaTeX"{""}
    of tGemtext:
      "LaTeX"

  proc addToHeadCmd(arg: !Markup): Markup {.command: "add-to-head".} =
    doc.addToHead.incl arg
    ""

  proc argCmd(arg: !String): Markup {.command: "arg".} =
    doc.renderStr(doc.lookup(args, arg))

  proc argExpandCmd(arg: !String): String {.command: "arg-expand".} =
    doc.expandStr(doc.lookup(args, arg))

  proc argRawCmd(arg: !String): String {.command: "arg-raw".} =
    doc.lookup(args, arg)

  proc argRawEscapeCmd(arg: !String): Markup {.command: "arg-raw-escape".} =
    escapeText(doc.lookup(args, arg), doc.target)

  proc bfCmd(arg: !Markup): Markup {.command: "bf".} =
    case doc.target
    of tHtml:
      htg.b(arg)
    of tLatex:
      "textbf"{arg}
    of tGemtext:
      arg

  proc blockQuoteCmd(quote: !Markup, author: ?Markup): Markup {.command: "block-quote".} =
    case doc.target
    of tHtml:
      htg.blockquote:
        if author.isSome:
          htg.p(quote) & htg.p(htg.cite(author.get))
        else:
          quote
    of tLatex:
      # TODO author support
      env("quote", quote)
    of tGemtext:
      # TODO author support
      "\n> $1\n" % quote

  proc checkboxesCmd(arg: Raw): Markup {.command: "checkboxes".} =
    case doc.target
    of tHtml:
      doc.stack[^1].commands = checkboxCommands(doc)
      doc.addToStyle.incl """.xd-checkbox-unchecked{list-style-type:"☐ "}.xd-checkbox-checked{list-style-type:"☑ "}.xd-checkbox-crossed{list-style-type:"☒ "}"""
      htg.ul(class = "xd-checkboxes", doc.expandStr(arg))
    else:
      xidocError "Checkboxes are currently not supported for the LaTeX target"

  proc applySyntaxHighlightingTheme() =
    let theme = doc.settings.getOrDefault("syntax-highlighting-theme", "default")
    if theme notin prismCss:
      xidocError "Invalid syntax highlighting theme: " & theme
    doc.addToStyle.incl(prismCss[theme])

  proc codeCmd(lang: ?String, code: !String): Markup {.command: "code".} =
    case doc.target
    of tHtml:
      applySyntaxHighlightingTheme()
      if lang.isSome:
        htg.code(class = &"language-{lang.get}", code.highlightCode(lang.get))
      else:
        htg.code(code.escapeText(doc.target))
    of tLatex:
      # TODO: use minted
      "texttt"{code}
    of tGemtext:
      "\n```\n{$1}\n```\n" % code

  proc codeBlockCmd(lang: ?String, code: !String): Markup {.command: "code-block".} =
    case doc.target
    of tHtml:
      applySyntaxHighlightingTheme()
      if lang.isSome:
        htg.pre(class = &"language-{lang.get}", htg.code(class = &"language-{lang.get}", code.highlightCode(lang.get)))
      else:
        htg.pre(htg.code(code.escapeText(doc.target)))
    of tLatex:
      doc.addToHead.incl "\\usepackage{minted}"
      env("minted", lang.map(lang => "{$1}" % lang).get("") & "\n" & code) & "\n"
    of tGemtext:
      "\n```\n{$1}\n```\n" % code

  proc colorCmd(color: !String, text: !Markup): Markup {.command: "color".} =
    case doc.target
    of tHtml:
      htg.span(style = &"color:{color}", text)
    of tLatex:
      doc.addToHead.incl "usepackage"["svgnames"]{"xcolor"}
      "textcolor"{color}{text}
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

  proc defCmd(name: !String, paramList: ?String, body: Raw): Markup {.command: "def".} =
    def(global = false)

  proc defGlobalCmd(name: !String, paramList: ?String, body: Raw): Markup {.command: "def-global".} =
    def(global = true)

  theoremLikeCommand(dfnCmd, "dfn", pDefinition, "$1", "$1")

  proc drawCmd(width: ?String, height: ?String, desc: Raw): Markup {.command: "draw".} =
    doc.stack[^1].commands = drawCommands(doc)
    case doc.target
    of tHtml:
      &"""<svg width="{width.get("360")}" height="{height.get("360")}" viewBox="0 0 360 360" version="1.1" xmlns="http://www.w3.org/2000/svg">{doc.expandStr(desc)}</svg>"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  theoremLikeCommand(exampleCmd, "example", pExample, "$1", "$1")

  theoremLikeCommand(exerciseCmd, "exercise", pExercise, "$1", "$1")

  proc expandCmd(arg: !String): String {.command: "expand".} =
    doc.expandStr(arg)

  proc figureCmd(content: !Markup, caption: ?Markup): Markup {.command: "figure".} =
    case doc.target
    of tHtml:
      if caption.isSome:
        htg.figure(content, htg.figcaption(caption.get))
      else:
        htg.figure(content)
    of tLatex:
      env("figure", "[h]\\centering" & content & caption.map(c => "caption"{c}).get(""))
    of tGemtext:
      "\n" & content & caption.map(c => "\n" & c).get("")

  proc forEachCmd(name: !String, list: !List, tmpl: Raw): List {.command: "for-each".} =
    var results: seq[XidocValue]
    for item in list:
      let itemCopy = item
      doc.stack[^1].commands[name] = (_) => itemCopy
      results.add doc.expand(tmpl, item.typ)
    results

  proc getDocPathAbsoluteCmd(): String {.command: "get-doc-path-absolute".} =
    doc.stack[0].path.map(path => absolutePath(path)).get("")

  proc getDocPathRelativeToContainingCmd(arg: !String): String {.command: "get-doc-path-relative-to-containing".} =
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

  proc hideCmd(arg: !String): Markup {.command: "hide".} =
    ""

  proc headerRowCmd(entries: *Markup): Markup {.command: "header-row".} =
    if not doc.stack.anyIt(it.cmdName == "table"):
      xidocError "The header-row command has to be inside a table command"
    case doc.target
    of tHtml:
      htg.tr(entries.mapIt(htg.th(it)).join)
    of tLatex:
      "$1\\\\\\midrule " % entries.join("&")
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  proc htmlAddAttrsCmd(args: !String, tag: !Markup): Markup {.command: "html-add-attrs".} =
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

  proc ifHtmlCmd(arg: Raw): Markup {.command: "if-html".} =
    if doc.target == tHtml:
      doc.renderStr(arg)
    else:
      ""

  proc ifLatexCmd(arg: Raw): Markup {.command: "if-latex".} =
    if doc.target == tLatex:
      doc.renderStr(arg)
    else:
      ""

  proc ifGemtextCmd(arg: Raw): Markup {.command: "if-gemtext".} =
    if doc.target == tGemtext:
      doc.renderStr(arg)
    else:
      ""

  proc includeCmd(filename: !String, args: *Markup): Markup {.command: "include".} =
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

  proc injectCmd(filename: !String): Markup {.command: "inject".} =
    let path = doc.lookup(path).splitPath.head / filename
    doc.stack[^1].path = some(path)
    try:
      doc.renderStr(readFile(path))
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  proc itCmd(arg: !Markup): Markup {.command: "it".} =
    case doc.target
    of tHtml:
      htg.i(arg)
    of tLatex:
      "textit"{arg}
    of tGemtext:
      arg

  proc janetCallCmd(function: !String, args: *String): String {.command: "janet-call".} =
    janetCall(function, args, doc.lookup(path))

  proc janetEvalCmd(code: !String, args: *String): String {.command: "janet-eval".} =
    if args.len mod 2 != 0:
      xidocError "Arguments to janet-eval must come in pairs of name; value"
    var values = newSeqOfCap[(string, string)](args.len div 2)
    for i in 0 ..< args.len div 2:
      values.add (args[2 * i], args[2 * i + 1])
    janetEval(code, values, doc.lookup(path))

  proc joinCmd(sep: !Markup, list: !List): Markup {.command: "join".} =
    list.mapIt(it.str).join(sep)

  proc jsCallCmd(function: !String, args: *String): String {.command: "js-call".} =
    jsCall(function, args)

  proc jsEvalCmd(code: !String, args: *String): String {.command: "js-eval".} =
    if args.len mod 2 != 0:
      xidocError "Arguments to js-eval must come in pairs of name; value"
    var values = newSeqOfCap[(string, string)](args.len div 2)
    for i in 0 ..< args.len div 2:
      values.add (args[2 * i], args[2 * i + 1])
    jsEval(code, values)

  proc jsModuleCmd(arg: !String): Markup {.command: "js-module".} =
    if doc.target == tHtml:
      doc.addToHead.incl htg.script(`type` = "module", arg)
    ""

  proc jsModuleRawCmd(arg: Raw): Markup {.command: "js-module-raw".} =
    if doc.target == tHtml:
      doc.addToHead.incl htg.script(`type` = "module", arg)
    ""

  proc langCmd(langStr: !String, body: Raw): Markup {.command: "lang".} =
    let lang =
      case langStr.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      else: xidocError "Unknown language: $1" % langStr
    doc.stack[^1].lang = some lang
    doc.renderStr(body)

  theoremLikeCommand(lemmaCmd, "lemma", pLemma, "$1", "$1")

  proc linkCmd(name: ?Markup, url: !String): Markup {.command: "link".} =
    case doc.target
    of tHtml:
      htg.a(href = url, name.get(url))
    of tLatex:
      "" # TODO
    of tGemtext:
      if name.isSome: "\n=> $1 $2" % [url, name.get] else: "\n=> $1" % [url]

  proc linkImageCmd(alt: !String, url: !String, link: ?String): Markup {.command: "link-image".} =
    case doc.target
    of tHtml:
      if link.isSome:
        htg.a(href = link.get, htg.img(src = url, alt = alt))
      else:
        htg.img(src = url, alt = alt)
    of tLatex:
      xidocError "Linking images is not supported in the LaTeX backend"
    of tGemtext:
      if link.isSome:
        xidocError "Linking images with an additional link is not supported in the Gemtext backend"
      "\n=> $1 \u{1e5bc} $2" % [url, alt]

  proc linkStylesheetCmd(url: !String): Markup {.command: "link-stylesheet".} =
    if doc.target == tHtml:
      doc.addToHead.incl(htg.link(rel = "stylesheet", href = url))
    ""

  proc listCmd(items: *Markup): Markup {.command: "list".} =
    case doc.target
    of tHtml:
      htg.ul(items.mapIt(htg.li(it)).join)
    of tLatex:
      env("itemize", items.mapIt("\\item $1" % it).join)
    of tGemtext:
      "\n$1\n" % items.mapIt("* $1" % it).join("\n")

  proc listDirsCmd(arg: !String): List {.command: "list-dirs".} =
    when defined(js):
      xidocError "The list-dirs command is not available when using JavaScript"
      @[]
    else:
      let currentDir = doc.lookup(path).splitFile.dir
      walkDirs(currentDir / arg).toSeq.mapIt(XidocValue(typ: String, str: it.relativePath(currentDir)))

  proc listFilesCmd(arg: !String): List {.command: "list-files".} =
    when defined(js):
      xidocError "The list-files command is not available when using JavaScript"
      @[]
    else:
      let currentDir = doc.lookup(path).splitFile.dir
      walkFiles(currentDir / arg).toSeq.mapIt(XidocValue(typ: String, str: it.relativePath(currentDir)))

  proc matextCmd(arg: !String): Markup {.command: "matext".} =
    let math = try:
      arg.matext
    except ValueError:
      xidocError "Error when parsing math: $1" % arg
    case doc.target
    of tHtml:
      htg.pre(class = "xd-matext", math)
    of tLatex:
      env("verbatim", math) & "\n"
    of tGemtext:
      "\n```\n{$1}\n```\n" % math

  proc msCmd(arg: !Markup): Markup {.command: "ms".} =
    case doc.target
    of tHtml:
      htg.code(arg)
    of tLatex:
      "texttt"{arg}
    of tGemtext:
      "\n```\n{$1}\n```\n" % arg

  proc orderedListCmd(items: *Markup): Markup {.command: "ordered-list".} =
    case doc.target
    of tHtml:
      htg.ol(items.mapIt(htg.li(it)).join)
    of tLatex:
      env("enumerate", items.mapIt("\\item $1" % it).join)
    of tGemtext:
      # TODO: add numbers
      "\n$1\n" % items.mapIt("* $1" % it).join("\n")

  proc pCmd(arg: !Markup): Markup {.command: "p".} =
    case doc.target
    of tHtml:
      htg.p(arg)
    of tLatex:
      "\\par " & arg
    of tGemtext:
      "\n\n$1" % arg

  proc passCmd(arg: !String): Markup {.command: "pass".} =
    arg

  proc passRawCmd(arg: Raw): Markup {.command: "pass-raw".} =
    arg

  theoremLikeCommand(proofCmd, "proof", pProof, "$1", "$1"):
    doc.stack[^1].commands = proofCommands(doc)

  proc propsCmd(items: *Markup): Markup {.command: "props".} =
    case doc.target
    of tHtml:
      htg.ul(items.mapIt(htg.li(it)).join)
    of tLatex:
      env("itemize", items.mapIt("\\item $1" % it).join)
    of tGemtext:
      "\n$1\n" % items.mapIt("* $1" % it).join("\n")

  proc rawCmd(arg: Raw): String {.command: "raw".} =
    arg

  proc rawDedentCmd(arg: Literal): String {.command: "raw<".} =
    arg.strip(chars = {'\n'}).dedent

  proc renderCmd(arg: !String): Markup {.command: "render".} =
    doc.renderStr(arg)

  proc replaceSuffixCmd(sub: !String, by: !String, str: !String): String {.command: "replace-suffix".} =
    var str = str
    if str.endsWith(sub):
      str.removeSuffix(sub)
      str &= by
    str

  proc resetCmd(key: !String): Markup {.command: "reset".} =
    doc.settings.del(key)
    ""

  proc rowCmd(entries: *Markup): Markup {.command: "row".} =
    if not doc.stack.anyIt(it.cmdName == "table"):
      xidocError "The row command has to be inside a table command"
    case doc.target
    of tHtml:
      htg.tr(entries.mapIt(htg.td(it)).join)
    of tLatex:
      "$1\\\\" % entries.join("&")
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  proc sectionCmd(name: ?Markup, content: !Markup): Markup {.command: "section".} =
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

  proc setCmd(key: !String, val: !String): Markup {.command: "set".} =
    doc.settings[key] = val
    ""

  proc setDocLangCmd(arg: !String): Markup {.command: "set-doc-lang".} =
    doc.stack[0].lang = some(
      case arg.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      else: xidocError "Unknown language: $1" % arg
    )
    ""

  proc setMathRendererCmd(arg: !String): Markup {.command: "set-math-renderer".} =
    xidocWarning "[set-math-renderer] is deprecated. Math rendering will always be done at compile time."
    ""

  proc setSyntaxHighlightingThemeCmd(theme: !String): Markup {.command: "set-syntax-highlighting-theme".} =
    xidocWarning "[set-syntax-highlighting-theme] is deprecated. Use [set syntax-highlighting-theme] instead."
    setCmd("syntax-highlighting-theme", theme)

  proc setTitleCmd(arg: !String): Markup {.command: "set-title".} =
    case doc.target
    of tHtml:
      doc.addToHead.incl htg.title(arg)
    of tLatex:
      doc.addToHead.incl "title"{arg}
    else:
      discard
    ""

  proc showTitleCmd(arg: !String): Markup {.command: "show-title".} =
    case doc.target
    of tHtml:
      htg.h1(arg)
    of tLatex:
      "\\maketitle"
    of tGemtext:
      "\n# $1\n\n" % arg

  theoremLikeCommand(solutionCmd, "solution", pSolution, "$1", "$1")

  proc spaceCmd(): String {.command: "space".} =
    " "

  proc spoilerCmd(title: !Markup, content: !Markup): Markup {.command: "spoiler".} =
    case doc.target
    of tHtml:
      htg.details(class = "xd-spoiler", htg.summary(title), content)
    of tLatex:
      xidocError "The spoiler command is not supported in the LaTeX backend"
    of tGemtext:
      xidocError "The spoiler command is not supported in the Gemtext backend"

  proc spoilerSolutionCmd(name: ?Markup, content: !Markup): Markup {.command: "spoiler-solution".} =
    let word = pSolution.translate(doc.lookup(lang))
    case doc.target
    of tHtml:
      htg.details(class = "xd-spoiler xd-theorem-like xd-solution",
        htg.summary(htg.strong(if name.isSome: "$1 ($2)" % [word, name.get] else: "$1" % [word])), content
      )
    of tLatex:
      doc.addToHead.incl "usepackage"{"amsthm"}
      doc.addToHead.incl "newtheorem"{"XDspoilersolution"}{word}
      env("XDspoilersolution", content)
    of tGemtext:
      xidocError "The spoiler-solution command is not supported in the Gemtext backend"

  proc styleCmd(arg: Raw): Markup {.command: "style".} =
    case doc.target
    of tHtml:
      doc.stack[^1].commands = cssCommands(doc)
      doc.addToStyle.incl doc.expandStr(arg)
    else:
      discard
    ""

  proc tableCmd(spec: ?String, content: !Markup): Markup {.command: "table".} =
    case doc.target
    of tHtml:
      htg.table(content)
    of tLatex:
      if spec.isNone:
        xidocError "Tables in LaTeX currently require a spec"
      doc.addToHead.incl "usepackage"{"booktabs"}
      env("table", "{" & spec.get & "}\\toprule " & content & "\\bottomrule")
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  proc templateArgCmd(arg: !Markup): Markup {.command: "template-arg".} =
    try:
      doc.templateArgs[arg]
    except KeyError:
      xidocError: &"Template argument not found: {arg}"

  proc termCmd(arg: !Markup): Markup {.command: "term".} =
    case doc.target
    of tHtml:
      htg.dfn(arg)
    of tLatex:
      "textit"{arg}
    of tGemtext:
      arg

  theoremLikeCommand(theoremCmd, "theorem", pTheorem, "$1", "$1")

  proc titleCmd(title: !Markup, author: ?Markup): Markup {.command: "title".} =
    case doc.target
    of tHtml:
      doc.addToHead.incl htg.title(title)
      htg.h1(title) & author.map(author => htg.address(author)).get("")
    of tLatex:
      doc.addToHead.incl "title"{title}
      if author.isSome:
        doc.addToHead.incl "author"{author.get}
      "\\maketitle"
    of tGemtext:
      "# $1\n\n" % title

  proc unitCmd(number: ?Markup, unit: !Markup): Markup {.command: "unit".} =
    if number.isSome:
      # U+2009 Thin Space
      number.get & "\u2009" & unit
    else:
      unit

  proc xidocCmd(): Markup {.command: "xidoc".} =
    case doc.target
    of tHtml:
      doc.addToStyle.incl ".xd-logo{color:#d0c;font-weight:bold}"
      htg.span(class = "xd-logo", "ξ")
    of tLatex:
      doc.addToHead.incl "usepackage"["svgnames"]{"xcolor"}
      "textcolor"{"#d0c"}{"\\(\\xi\\)"}
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

    proc tagCmd(tag: !String, args: *String, body: !Markup): Markup {.command: "<>".} =
      generateHtmlTag(tag, args, body)

    for tag in htmlTags:
      # This proc makes sure that tag is captured by value
      (proc(tag: string) =
        if tag in htmlSelfClosingTags:
          proc theTagCmd(args: *String): Markup {.command: &"<{tag}>".} =
            generateHtmlTag(tag, args, paired = false)
        else:
          proc theTagCmd(args: *String, body: !Markup): Markup {.command: &"<{tag}>".} =
            generateHtmlTag(tag, args, body)
      )(tag)

  of tLatex:

    proc backslashCmd(command: !String, args: *Markup): Markup {.command: "\\".} =
      "\\" & args.mapIt("{$1}" % it).join

  else:
    discard

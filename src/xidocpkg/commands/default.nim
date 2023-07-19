from std/htmlgen as htg import nil
from std/pegs import match, peg
import ../error
import ../expand
import ../janetinterpret
import ../jsinterpret
import ../parser
import ../pikchr
import ../string_view
import ../translations
import ../types
import ./checkbox
import ./css
import ./draw
import ./javascript
import ./math
import ./utils
import pkg/aspartame
import pkg/heine
import pkg/matext
import std/options
import std/os
import std/sequtils
import std/sets
import std/strformat
import std/strutils
import std/sugar
import std/tables
import std/times

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

commands defaultCommands:

  template theoremLikeCommand(procName: untyped, cmdName: static string, phrase: static Phrase, htmlTmpl, latexTmpl: static string, commands: Commands = nil) =
    proc procName(thName: ?Markup, label: ?String, content: !Markup): Markup {.command: cmdName, safe, useCommands: commands.} =
      let thName = thName.filter(n => n != "")
      let word = phrase.translate(doc.lookup(lang))
      case doc.target
      of tHtml:
        doc.addToStyle.incl ".xd-theorem-like{margin:1rem 0}.xd-theorem-like>p{margin:0.5rem 0}"
        var fullName = word
        ifSome label:
          let num = doc.settings.theoremLikeNumberPrefix & $doc.theoremLikeCounter
          doc.theoremLikeCounter.inc
          fullName.add(" " & num)
          doc.labelNums[label] = (prefix: word & " ", num: num)
        ifSome thName:
          fullName.add(" (" & thName & ")")
        fullName.add(".")
        ifSome label:
          htg.`div`(class = &"xd-theorem-like xd-$1" % cmdName, id = label, htg.strong(fullName), " ", (htmlTmpl % content))
        do:
          htg.`div`(class = &"xd-theorem-like xd-$1" % cmdName, htg.strong(fullName), " ", (htmlTmpl % content))
      of tLatex:
        doc.addToHead.incl "usepackage"{"amsthm"}
        doc.addToHead.incl:
          "theoremstyle"{"definition"} & "newtheorem"{"XD" & cmdName}{word} &
          "theoremstyle"{"definition"} & "newtheorem*"{"XD" & cmdName & "*"}{word} &
          "newEnvironment"{"XD" & cmdName & "Manual"}["1"]{
            "renewCommand"{"\\the" & cmdName}{"#1"} & "\\inner" & cmdName
          }{"\\end" & cmdName}
        var envName = "XD" & cmdName
        var envContent = ""
        ifSome label:
          envName.add("Manual")
          envContent.add("{" & label & "}")
        do:
          envName.add("*")
        ifSome thName:
          envContent.add("[$1]" % thName)
        envContent.add(latexTmpl % content)
        env("XD" & cmdName, envContent)
      of tGemtext:
        # TODO: labels
        "\n\n$1. $2" % [ifSome(thName, "$1 ($2)" % [word, thName], "$1" % [word]), content]

  proc commentCmd(arg: Literal) {.command: "#", safe.} =
    discard

  proc semiCmd(): String {.command: ";", safe.} =
    ";"

  proc bracketsCmd(arg: !Markup): Markup {.command: "()", safe.} =
    "[" & arg & "]"

  proc leftBracketCmd(): String {.command: "(", safe.} =
    "["

  proc rightBracketCmd(): String {.command: ")", safe.} =
    "]"

  proc enDashCmd(): String {.command: "--", safe.} =
    "–"

  proc emDashCmd(): String {.command: "---", safe.} =
    "—"

  proc ellipsisCmd(): String {.command: "...", safe.} =
    "…"

  proc quoteCmd(arg: !Markup): Markup {.command: "\"", safe.} =
    pQuotation.translate(doc.lookup(lang)) % arg

  proc inlineMathCmd(math: !String): Markup {.command: "$", safe, useCommands: mathCommands.} =
    doc.renderMath(math, displayMode = false)

  proc blockMathCmd(math: !String): Markup {.command: "$$", safe, useCommands: mathCommands.} =
    doc.renderMath(math, displayMode = true)

  proc alignedMathCmd(math: !String): Markup {.command: "$$&", safe, useCommands: mathCommands.} =
    doc.renderMath(env("align*", math), displayMode = true, addDelimiters = false)

  proc heineify(math: string): string =
    try:
      math.heine(customCmdHandler = cmd => doc.expandStr(cmd))
    except ParseError:
      xidocError &"Error while rendering Heine: {getCurrentExceptionMsg()}"

  proc inlineHeineCmd(math: !String): Markup {.command: "$h", safe.} =
    inlineMathCmd(math.heineify)

  proc blockHeineCmd(math: !String): Markup {.command: "$$h", safe.} =
    blockMathCmd(math.heineify)

  proc alignedHeineCmd(math: !String): Markup {.command: "$$&h", safe.} =
    alignedMathCmd(math.heineify)

  proc inlineHeineRawCmd(math: Raw): Markup {.command: "*", safe.} =
    inlineMathCmd(math.heineify)

  proc blockHeineRawCmd(math: Raw): Markup {.command: "**", safe.} =
    blockMathCmd(math.heineify)

  proc alignedHeineRawCmd(math: Raw): Markup {.command: "**&", safe.} =
    alignedMathCmd(math.heineify)

  proc LaTeXCmd(): Markup {.command: "LaTeX", safe.} =
    case doc.target
    of tHtml:
      doc.addToStyle.incl """.xd-latex{text-transform:uppercase;font-size:1em;}.xd-latex>sub{vertical-align:-0.5ex;margin-left:-0.1667em;margin-right:-0.125em;}.xd-latex>sup{font-size:0.85em;vertical-align:0.15em;margin-left:-0.36em;margin-right:-0.15em;}"""
      htg.span(class = "xd-latex", "L", htg.sup("a"), "T", htg.sub("e"), "X")
    of tLatex:
      "LaTeX"{""}
    of tGemtext:
      "LaTeX"

  proc addToHeadCmd(arg: !Markup) {.command: "add-to-head".} =
    doc.addToHead.incl arg

  proc argRawCmd(name: !String): String {.command: "arg-raw".} =
    let arg = doc.lookup(args, name)
    ifSome arg:
      arg
    do:
      xidocError &"Parameter not found: {name}"

  proc argCmd(name: !String): Markup {.command: "arg", safe.} =
    doc.renderStr(argRawCmd(name))

  proc argExpandCmd(name: !String): String {.command: "arg-expand".} =
    doc.expandStr(argRawCmd(name))

  proc argRawEscapeCmd(name: !String): Markup {.command: "arg-raw-escape".} =
    argRawCmd(name).escapeText(doc.target)

  proc bfCmd(arg: !Markup): Markup {.command: "bf", safe.} =
    case doc.target
    of tHtml:
      htg.b(arg)
    of tLatex:
      "textbf"{arg}
    of tGemtext:
      arg

  proc blockQuoteCmd(quote: !Markup, author: ?Markup): Markup {.command: "block-quote", safe.} =
    case doc.target
    of tHtml:
      htg.blockquote:
        ifSome author:
          htg.p(quote) & htg.p(htg.cite(author))
        do:
          quote
    of tLatex:
      # TODO author support
      env("quote", quote)
    of tGemtext:
      # TODO author support
      "\n> $1\n" % quote

  proc checkboxesCmd(arg: !String): Markup {.command: "checkboxes", safe, useCommands: checkboxCommands.} =
    case doc.target
    of tHtml:
      doc.addToStyle.incl """.xd-checkbox-unchecked{list-style-type:"☐ "}.xd-checkbox-checked{list-style-type:"☑ "}.xd-checkbox-crossed{list-style-type:"☒ "}"""
      htg.ul(class = "xd-checkboxes", arg)
    else:
      xidocError "Checkboxes are currently not supported for the LaTeX target"

  proc applySyntaxHighlightingTheme() =
    let theme = doc.settings.syntaxHighlightingTheme
    doc.addToStyle.incl(prismCss[theme])

  proc civetCmd(src: !String): String {.command: "civet".} =
    compileCivet(src)

  proc codeCmd(lang: ?String, code: !String): Markup {.command: "code", safe.} =
    case doc.target
    of tHtml:
      applySyntaxHighlightingTheme()
      ifSome lang:
        htg.code(class = &"language-{lang}", code.highlightCode(lang))
      do:
        htg.code(code.escapeText(doc.target))
    of tLatex:
      # TODO: use minted
      "texttt"{code}
    of tGemtext:
      "\n```\n{$1}\n```\n" % code

  proc codeBlockCmd(lang: ?String, code: !String): Markup {.command: "code-block", safe.} =
    case doc.target
    of tHtml:
      applySyntaxHighlightingTheme()
      ifSome lang:
        htg.pre(class = &"language-{lang}", htg.code(class = &"language-{lang}", code.highlightCode(lang)))
      do:
        htg.pre(htg.code(code.escapeText(doc.target)))
    of tLatex:
      doc.addToHead.incl "\\usepackage{minted}"
      env("minted", ifSome(lang, "{$1}" % lang, "") & "\n" & code) & "\n"
    of tGemtext:
      "\n```\n{$1}\n```\n" % code

  proc collapseCmd(title: !Markup, content: !Markup): Markup {.command: "collapse", safe.} =
    case doc.target
    of tHtml:
      htg.details(htg.summary(title), content)
    of tLatex:
      content # TODO: should somehow include title?
    of tGemtext:
      content # TODO: should somehow include title?

  proc collapsibleCmd(title: !Markup, content: !Markup): Markup {.command: "collapsible", safe.} =
    case doc.target
    of tHtml:
      htg.details(open = "", htg.summary(title), content)
    of tLatex:
      content # TODO: should somehow include title?
    of tGemtext:
      content # TODO: should somehow include title?

  proc colorCmd(color: !String, text: !Markup): Markup {.command: "color".} =
    case doc.target
    of tHtml:
      htg.span(style = &"color:{color}", text)
    of tLatex:
      doc.addToHead.incl "usepackage"["svgnames"]{"xcolor"}
      "textcolor"{color}{text}
    of tGemtext:
      text

  proc renderTableOfContentsHtml(table: TableOfContents): string =
    if table.len == 0:
      return ""
    htg.ol(class = "xd-contents"):
      join:
        collect:
          for entry in table:
            htg.li(entry.text) & renderTableOfContentsHtml(entry.children)

  proc contentsCmd(): Markup {.command: "contents", safe.} =
    case doc.stage
    of 0:
      "\xc0[contents]\xc1"
    else:
      case doc.target
      of tHtml:
        renderTableOfContentsHtml(doc.tableOfContents)
      else:
        xidocError "The [contents] command is not available for this backend yet"

  theoremLikeCommand(corollaryCmd, "corollary", pCorollary, "$1", "$1")

  template def(global: static bool) {.dirty.} =
    let params = ifSome(paramList, paramList.splitWhitespace, @[])
    doc.stack[when global: 0 else: ^2].commands[name] = proc(arg: StringView): XidocValue =
      let argsList = if arg == "": @[] else: parseXidocArguments(arg)
      if argsList.len != params.len:
        xidocError &"""Command {name} needs exactly {params.len} argument{(if params.len == 1: "" else: "s")}, {argsList.len} given"""
      # Merging the following two lines into one causes the thing to break. WTF?
      let argsTable = zip(params, argsList).toTable
      doc.stack[^1].args = argsTable
      result = XidocValue(typ: Markup, str: doc.renderStr(body))

  proc defCmd(name: !String, paramList: ?String, body: Raw): Markup {.command: "def", safe.} =
    def(global = false)

  proc defGlobalCmd(name: !String, paramList: ?String, body: Raw): Markup {.command: "def-global".} =
    def(global = true)

  proc descriptionListCmd(args: *Markup): Markup {.command: "description-list", safe.} =
    if args.len mod 2 != 0:
      xidocError "Arguments to description-list must come in pairs"
    var defs: seq[array[2, string]]
    for i in 0..<(args.len div 2):
      defs.add [args[2*i], args[2*i + 1]]
    case doc.target
    of tHtml:
      htg.dl(defs.mapIt(htg.dt(it[0]) & htg.dd(it[1])).join)
    of tLatex:
      env("description", defs.mapIt("\\item[$1] $2" % it).join)
    of tGemtext:
      "\n$1\n" % defs.mapIt("* $1: $2" % it).join("\n")

  theoremLikeCommand(dfnCmd, "dfn", pDefinition, "$1", "$1")

  proc drawCmd(width: ?String, height: ?String, desc: !String): Markup {.command: "draw", useCommands: drawCommands.} =
    case doc.target
    of tHtml:
      &"""<svg width="{width.get("360")}" height="{height.get("360")}" viewBox="0 0 360 360" version="1.1" xmlns="http://www.w3.org/2000/svg">{desc}</svg>"""
    of tLatex:
      xidocError "Drawing is currently not implemented in the LaTeX backend"
    of tGemtext:
      xidocError "Drawing is currently not implemented in the Gemtext backend"

  proc emphCmd(arg: !Markup): Markup {.command: "emph", safe.} =
    case doc.target
    of tHtml:
      htg.em(arg)
    of tLatex:
      "textit"{arg}
    of tGemtext:
      arg

  proc emptyFaviconCmd() {.command: "empty-favicon", safe.} =
    if doc.target == tHtml:
      doc.addToHead.incl htg.link(rel = "icon", href = "data:,")

  theoremLikeCommand(exampleCmd, "example", pExample, "$1", "$1")

  theoremLikeCommand(exerciseCmd, "exercise", pExercise, "$1", "$1")

  proc expandCmd(arg: !String): String {.command: "expand".} =
    doc.expandStr(arg)

  proc figureCmd(content: !Markup, caption: ?Markup): Markup {.command: "figure", safe.} =
    case doc.target
    of tHtml:
      ifSome caption:
        htg.figure(content, htg.figcaption(caption))
      do:
        htg.figure(content)
    of tLatex:
      env("figure", "[h]\\centering" & content & ifSome(caption, "caption"{caption}, ""))
    of tGemtext:
      "\n" & content & ifSome(caption, "\n" & caption, "")

  proc forEachCmd(name: !String, list: !List, tmpl: Raw): List {.command: "for-each", safe.} =
    var results: seq[XidocValue]
    for item in list:
      let itemCopy = item
      doc.stack[^1].commands[name] = (_) => itemCopy
      results.add doc.expand(tmpl, item.typ)
    results

  proc getDocPathAbsoluteCmd(): String {.command: "get-doc-path-absolute".} =
    let path = doc.stack[0].path
    ifSome(path, path.absolutePath, "")

  proc getDocPathRelativeToContainingCmd(arg: !String): String {.command: "get-doc-path-relative-to-containing".} =
    when defined(js):
      ""
    else:
      let path = doc.stack[0].path
      ifSome path:
        var ancestor = path.parentDir
        while ancestor != "":
          let candidate = ancestor / arg
          if fileExists(candidate) or dirExists(candidate) or symlinkExists(candidate):
            break
          ancestor = ancestor.parentDir
        path.relativePath(ancestor)
      do:
        ""

  proc headerRowCmd(entries: *Markup): Markup {.command: "header-row", safe.} =
    if not doc.stack.anyIt(it.cmdName == "table"):
      xidocError "The header-row command has to be inside a table command"
    case doc.target
    of tHtml:
      htg.tr(entries.mapIt(htg.th(it)).join)
    of tLatex:
      "$1\\\\\\midrule " % entries.join("&")
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  proc hideCmd(arg: !String) {.command: "hide", safe.} =
    discard

  theoremLikeCommand(hintCmd, "hint", pHint, "$1", "$1")

  proc htmlAddAttrsCmd(args: *String, tag: !Markup): Markup {.command: "html-add-attrs".} =
    case doc.target
    of tHtml:
      var matches: array[2, string]
      if not tag.match(peg"{'<' [a-zA-Z-]+} {.*}", matches):
        xidocError "Can't add HTML attribute to something that isn't an HTML tag"
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
      matches.join(" " & attrs.join(" "))
    else:
      tag

  proc ifHtmlCmd(arg: Raw): Markup {.command: "if-html", safe.} =
    if doc.target == tHtml:
      doc.renderStr(arg)
    else:
      ""

  proc ifLatexCmd(arg: Raw): Markup {.command: "if-latex", safe.} =
    if doc.target == tLatex:
      doc.renderStr(arg)
    else:
      ""

  proc ifGemtextCmd(arg: Raw): Markup {.command: "if-gemtext", safe.} =
    if doc.target == tGemtext:
      doc.renderStr(arg)
    else:
      ""

  proc includeCmd(filename: !String, args: *Markup): Markup {.command: "include".} =
    if args.len mod 2 != 0:
      xidocError "Additional arguments to include must come in pairs"
    let path = doc.lookup(path).splitPath.head / filename
    try:
      let body = new string
      body[] = readFile(path)
      let subdoc = Document(
        body: body,
        target: doc.target,
        snippet: true,
        stack: @[Frame(
          cmdName: "[top]".toStringView,
          lang: some doc.lookup(lang),
          path: some(path),
        )]
      )
      subdoc.stack[0].commands = defaultCommands(subdoc)
      for i in 0..<(args.len div 2):
        subdoc.templateArgs[args[2 * i]] = args[2 * i + 1]
      subdoc.renderStr
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  proc injectCmd(filename: !String): Markup {.command: "inject".} =
    let path = doc.lookup(path).splitPath.head / filename
    doc.stack[^1].path = some(path)
    try:
      doc.renderStr(readFile(path))
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  proc itCmd(arg: !Markup): Markup {.command: "it", safe.} =
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

  proc joinCmd(sep: !Markup, list: !List): Markup {.command: "join", safe.} =
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

  proc jsModuleCmd(js: Raw) {.command: "js-module".} =
    case doc.target
    of tHtml:
      doc.stack[^1].commands = jsCommands(doc)
      doc.addToHead.incl htg.script(`type` = "module", doc.expandStr(js))
    else:
      discard

  proc jsModuleRawCmd(js: Raw) {.command: "js-module-raw".} =
    if doc.target == tHtml:
      doc.addToHead.incl htg.script(`type` = "module", js)

  proc langCmd(langStr: !String, body: Raw): Markup {.command: "lang", safe.} =
    let lang =
      case langStr.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      of "de", "german": lGerman
      else: xidocError "Unknown language: $1" % langStr
    doc.stack[^1].lang = some lang
    doc.renderStr(body)

  theoremLikeCommand(lemmaCmd, "lemma", pLemma, "$1", "$1")

  proc linesCmd(lns: *Markup): Markup {.command: "lines", safe.} =
    const seps = [
      tHtml: htg.br(),
      tLatex: "\\\\",
      tGemtext: "\n"
    ]
    lns.join(seps[doc.target])

  proc linkCmd(name: ?Markup, url: !String): Markup {.command: "link", safe.} =
    case doc.target
    of tHtml:
      htg.a(href = url, name.get(url))
    of tLatex:
      name.get("") # TODO
    of tGemtext:
      ifSome(name, "\n=> $1 $2" % [url, name], "\n=> $1" % [url])

  proc linkImageCmd(alt: !String, url: !String, link: ?String): Markup {.command: "link-image".} =
    case doc.target
    of tHtml:
      ifSome link:
        htg.a(href = link, htg.img(src = url, alt = alt))
      do:
        htg.img(src = url, alt = alt)
    of tLatex:
      xidocError "Linking images is not supported in the LaTeX backend"
    of tGemtext:
      if link.isSome:
        xidocError "Linking images with an additional link is not supported in the Gemtext backend"
      "\n=> $1 \u{1e5bc} $2" % [url, alt]

  proc linkStylesheetCmd(url: !String) {.command: "link-stylesheet".} =
    if doc.target == tHtml:
      doc.addToHead.incl(htg.link(rel = "stylesheet", href = url))

  proc listCmd(items: *Markup): Markup {.command: "list", safe.} =
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
    else:
      let currentDir = doc.lookup(path).splitFile.dir
      walkDirs(currentDir / arg).toSeq.mapIt(XidocValue(typ: String, str: it.relativePath(currentDir)))

  proc listFilesCmd(arg: !String): List {.command: "list-files".} =
    when defined(js):
      xidocError "The list-files command is not available when using JavaScript"
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

  proc msCmd(arg: !Markup): Markup {.command: "ms", safe.} =
    case doc.target
    of tHtml:
      htg.code(arg)
    of tLatex:
      "texttt"{arg}
    of tGemtext:
      "\n```\n{$1}\n```\n" % arg

  theoremLikeCommand(noteCmd, "note", pNote, "$1", "$1")

  proc nowCmd(formatSpec: ?String): String {.command: "now".} =
    now().format(formatSpec.get("yyyy-MM-dd"))

  proc orderedListCmd(items: *Markup): Markup {.command: "ordered-list", safe.} =
    case doc.target
    of tHtml:
      htg.ol(items.mapIt(htg.li(it)).join)
    of tLatex:
      env("enumerate", items.mapIt("\\item $1" % it).join)
    of tGemtext:
      # TODO: add numbers
      "\n$1\n" % items.mapIt("* $1" % it).join("\n")

  proc pCmd(arg: !Markup): Markup {.command: "p", safe.} =
    case doc.target
    of tHtml:
      htg.p(arg)
    of tLatex:
      "\\par " & arg
    of tGemtext:
      "\n\n$1" % arg

  proc passCmd(arg: !String): Markup {.command: "pass".} =
    arg

  proc passInjectCmd(filename: !String): Markup {.command: "pass-inject".} =
    let path = doc.lookup(path).splitPath.head / filename
    doc.stack[^1].path = some(path)
    try:
      readFile(path)
    except IOError:
      xidocError &"Cannot open file {filename}\n(resolved as {path})"

  proc passRawCmd(arg: Raw): Markup {.command: "pass-raw".} =
    arg

  proc pikchrCmd(width: ?Markup, height: ?Markup, text: !String): Markup {.command: "pikchr", safe.} =
    if doc.target != tHtml:
      xidocError "Pikchr currently only works with the HTML backend"
    var svg = text.pikchr(darkMode = doc.settings.darkMode)
    ifSome width:
      ifSome height:
        svg = htmlAddAttrsCmd(@[&"style=\"width:{width};height:{height}\""], svg)
      do:
        svg = htmlAddAttrsCmd(@[&"style=\"width:{width}\""], svg)
    do: discard
    svg

  proc pikchrRawCmd(text: Raw): Markup {.command: "pikchr-raw", safe.} =
    if doc.target != tHtml:
      xidocError "Pikchr currently only works with the HTML backend"
    text.pikchr(darkMode = doc.settings.darkMode)

  theoremLikeCommand(proofCmd, "proof", pProof, "$1", "$1", commands = proofCommands)

  proc propsCmd(items: *Markup): Markup {.command: "props", safe.} =
    xidocWarning("The [props] command is deprecated. Use [list] instead.")
    listCmd(items)

  proc rawCmd(arg: Raw): String {.command: "raw", safe.} =
    arg

  proc rawDedentCmd(arg: Literal): String {.command: "raw<", safe.} =
    arg.strip(chars = {'\n'}).dedent

  proc refCmd(prefix: ?String, label: !String): Markup {.command: "ref", safe.} =
    let text =
      if label in doc.labelNums:
        let prefix = block:
          ifSome prefix:
            if prefix == "": ""
            else: prefix & " "
          do:
            doc.labelNums[label].prefix
        prefix & doc.labelNums[label].num
      else:
        xidocError "Label not found: $1" % label
    case doc.target
    of tHtml: htg.a(href = "#" & label, text)
    of tLatex, tGemtext: text

  proc renderCmd(arg: !String): Markup {.command: "render", safe.} =
    doc.renderStr(arg)

  proc replaceSuffixCmd(sub: !String, by: !String, str: !String): String {.command: "replace-suffix", safe.} =
    var str = str
    if str.endsWith(sub):
      str.removeSuffix(sub)
      str &= by
    str

  proc resetCmd(key: !String) {.command: "reset".} =
    case key
    of "dark-mode":
      doc.settings.darkMode = false
    of "document-class":
      doc.settings.katexStylesheetPath = ""
    of "katex-stylesheet-path":
      doc.settings.katexStylesheetPath = ""
    of "math-renderer":
      doc.settings.mathRenderer = mrKatexHtml
    of "mathml-only":
      xidocWarning "The \"mathml-only\" setting is deprecated. Please use the \"math-renderer\" setting instead."
      doc.settings.mathRenderer = mrKatexHtml
    of "syntax-highlighting-theme":
      doc.settings.syntaxHighlightingTheme = shtDefault
    of "temml":
      xidocWarning "The \"temml\" setting is deprecated. Please use the \"math-renderer\" setting instead."
      doc.settings.mathRenderer = mrKatexHtml
    of "temml-stylesheet-path":
      doc.settings.temmlStylesheetPath = ""
    else:
      xidocError &"Invalid setting: {key}"

  proc resetTheoremLikeCounterCmd(prefix: ?String) {.command: "reset-theorem-like-counter", safe.} =
    doc.theoremLikeCounter = 1
    ifSome prefix:
      doc.settings.theoremLikeNumberPrefix = prefix

  proc rowCmd(entries: *Markup): Markup {.command: "row", safe.} =
    if not doc.stack.anyIt(it.cmdName == "table"):
      xidocError "The row command has to be inside a table command"
    case doc.target
    of tHtml:
      htg.tr(entries.mapIt(htg.td(it)).join)
    of tLatex:
      "$1\\\\" % entries.join("&")
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  proc sectionCmd(name: ?Markup, id: ?String, content: Raw): Markup {.command: "section", safe.} =
    let depth = doc.stack.countIt(it.cmdName == "section")
    case doc.target
    of tHtml:
      ifSome name:
        let headingTag =
          case depth
          of 1: "h2"
          of 2: "h3"
          of 3: "h4"
          of 4: "h5"
          else: "h6"
        ifSome id:
          doc.addTableOfContentsEntry(htg.a(href = "#" & id, name))
          htg.section(id = id, "<$1 class=\"xd-section-heading\">$2</$1>$3" % [headingTag, name, doc.renderStr(content)])
        do:
          htg.section("<$1 class=\"xd-section-heading\">$2</$1>$3" % [headingTag, name, doc.renderStr(content)])
      do:
        htg.section(doc.renderStr(content))
    of tLatex:
      let cmd =
        case depth
        of 1: "section"
        of 2: "subsection"
        of 3: "subsubsection"
        else: xidocError "Sections can only be nested 3 levels deep in LaTeX"
      ifSome name:
        "\\$1*{$2}$3" % [cmd, name, doc.renderStr(content)]
      do:
        "\\$1*{}$2" % [cmd, doc.renderStr(content)]
    of tGemtext:
      ifSome name:
        let prefix =
          case depth
          of 1: "## "
          of 2: "### "
          else: ""
        "\n\n$1$2\n\n$3" % [prefix, name, doc.renderStr(content)]
      do:
        "\n\n$1" % [doc.renderStr(content)]

  proc setCmd(key: !String, val: !String) {.command: "set".} =
    try:
      case key
      of "dark-mode":
        doc.settings.darkMode = val.parseBool
      of "document-class":
        doc.settings.katexStylesheetPath = val
      of "katex-stylesheet-path":
        doc.settings.katexStylesheetPath = val
      of "math-renderer":
        doc.settings.mathRenderer =
          case val.toLower
          of "katex", "katex-html": mrKatexHtml
          of "katex-mathml": mrKatexMathml
          of "temml": mrTemml
          else: raise newException(ValueError, "")
      of "mathml-only":
        xidocWarning "The \"mathml-only\" setting is deprecated. Please use the \"math-renderer\" setting instead."
        doc.settings.mathRenderer =
          if val.parseBool: mrKatexMathml
          else: mrKatexHtml
      of "syntax-highlighting-theme":
        doc.settings.syntaxHighlightingTheme =
          case val.toLower
          of "default": shtDefault
          of "dark": shtDark
          of "funky": shtFunky
          of "funky-x": shtFunkyX
          of "okaidia": shtOkaidia
          of "twilight": shtTwilight
          of "coy": shtCoy
          of "solarized-light": shtSolarizedLight
          of "tomorrow-night": shtTomorrowNight
          else: raise newException(ValueError, "")
      of "temml":
        xidocWarning "The \"temml\" setting is deprecated. Please use the \"math-renderer\" setting instead."
        doc.settings.mathRenderer =
          if val.parseBool: mrTemml
          else: mrKatexHtml
      of "temml-stylesheet-path":
        doc.settings.temmlStylesheetPath = val
      else:
        xidocError &"Invalid setting: {key}"
    except ValueError:
      xidocError &"Invalid value for setting \"{key}\": {val}"

  proc setDocLangCmd(arg: !String) {.command: "set-doc-lang", safe.} =
    doc.stack[0].lang = some(
      case arg.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      of "de", "german": lGerman
      else: xidocError "Unknown language: $1" % arg
    )

  proc setFaviconCmd(url: !String) {.command: "set-favicon".} =
    if doc.target == tHtml:
      doc.addToHead.incl htg.link(rel = "icon", href = url)

  proc setSyntaxHighlightingThemeCmd(theme: !String): Markup {.command: "set-syntax-highlighting-theme", safe.} =
    xidocWarning "[set-syntax-highlighting-theme] is deprecated. Use [set syntax-highlighting-theme] instead."
    setCmd("syntax-highlighting-theme", theme)

  proc setTitleCmd(arg: !String) {.command: "set-title", safe.} =
    case doc.target
    of tHtml:
      doc.addToHead.incl htg.title(arg)
    of tLatex:
      doc.addToHead.incl "title"{arg}
    else:
      discard

  proc showTitleCmd(arg: !String): Markup {.command: "show-title", safe.} =
    case doc.target
    of tHtml:
      htg.h1(arg)
    of tLatex:
      "\\maketitle"
    of tGemtext:
      "\n# $1\n\n" % arg

  theoremLikeCommand(solutionCmd, "solution", pSolution, "$1", "$1")

  proc spaceCmd(): String {.command: "space", safe.} =
    " "

  proc splitCmd(sep: !Markup, str: !String): List {.command: "split", safe.} =
    str.split(sep).mapIt(XidocValue(typ: String, str: it))

  proc spoilerCmd(title: !Markup, content: !Markup): Markup {.command: "spoiler", safe.} =
    case doc.target
    of tHtml:
      htg.details(class = "xd-spoiler", htg.summary(title), content)
    of tLatex:
      xidocError "The spoiler command is not supported in the LaTeX backend"
    of tGemtext:
      xidocError "The spoiler command is not supported in the Gemtext backend"

  proc spoilerHintCmd(name: ?Markup, content: !Markup): Markup {.command: "spoiler-hint", safe.} =
    let word = pHint.translate(doc.lookup(lang))
    case doc.target
    of tHtml:
      htg.details(class = "xd-spoiler xd-theorem-like xd-hint",
        htg.summary(htg.strong(ifSome(name, "$1 ($2)" % [word, name], "$1" % [word]))),
        content,
      )
    of tLatex:
      doc.addToHead.incl "usepackage"{"amsthm"}
      doc.addToHead.incl "newtheorem"{"XDspoilerhint"}{word}
      env("XDspoilerhint", content)
    of tGemtext:
      xidocError "The spoiler-hint command is not supported in the Gemtext backend"

  proc spoilerSolutionCmd(name: ?Markup, content: !Markup): Markup {.command: "spoiler-solution", safe.} =
    let word = pSolution.translate(doc.lookup(lang))
    case doc.target
    of tHtml:
      htg.details(class = "xd-spoiler xd-theorem-like xd-solution",
        htg.summary(htg.strong(ifSome(name, "$1 ($2)" % [word, name], "$1" % [word]))),
        content,
      )
    of tLatex:
      doc.addToHead.incl "usepackage"{"amsthm"}
      doc.addToHead.incl "newtheorem"{"XDspoilersolution"}{word}
      env("XDspoilersolution", content)
    of tGemtext:
      xidocError "The spoiler-solution command is not supported in the Gemtext backend"

  proc strongCmd(arg: !Markup): Markup {.command: "strong", safe.} =
    case doc.target
    of tHtml:
      htg.strong(arg)
    of tLatex:
      "textbf"{arg}
    of tGemtext:
      arg

  proc styleCmd(arg: !String) {.command: "style", useCommands: cssCommands.} =
    case doc.target
    of tHtml:
      doc.addToStyle.incl arg
    else:
      discard

  proc tableCmd(spec: ?String, content: !Markup): Markup {.command: "table", safe.} =
    case doc.target
    of tHtml:
      htg.table(content)
    of tLatex:
      ifSome spec:
        doc.addToHead.incl "usepackage"{"booktabs"}
        env("tabular", "{" & spec & "}\\toprule " & content & "\\bottomrule")
      do:
        xidocError "Tables in LaTeX currently require a spec"
    of tGemtext:
      xidocError "Tables are currently not supported in the Gemtext backend"

  proc templateArgCmd(arg: !Markup): Markup {.command: "template-arg", safe.} =
    try:
      doc.templateArgs[arg]
    except KeyError:
      xidocError: &"Template argument not found: {arg}"

  proc termCmd(arg: !Markup): Markup {.command: "term", safe.} =
    case doc.target
    of tHtml:
      htg.dfn(arg)
    of tLatex:
      "textit"{arg}
    of tGemtext:
      arg

  theoremLikeCommand(theoremCmd, "theorem", pTheorem, "$1", "$1")

  proc titleCmd(title: !Markup, author: ?Markup): Markup {.command: "title", safe.} =
    case doc.target
    of tHtml:
      doc.addToHead.incl htg.title(title)
      htg.h1(title) & ifSome(author, htg.address(author), "")
    of tLatex:
      doc.addToHead.incl "title"{title}
      ifSome author:
        doc.addToHead.incl "author"{author}
      do: discard
      "\\maketitle"
    of tGemtext:
      "# $1\n\n" % title

  proc unitCmd(number: ?Markup, unit: !Markup): Markup {.command: "unit", safe.} =
    # U+2009 Thin Space
    ifSome(number, number & "\u2009" & unit, unit)

  proc xidocCmd(): Markup {.command: "xidoc", safe.} =
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
      "\\" & command & args.mapIt("{$1}" % it).join

  else:
    discard

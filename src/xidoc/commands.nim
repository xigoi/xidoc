import ./parser
import ./translations
import ./types
import std/macros
import std/options
import std/os
import std/sequtils
import std/sets
import std/strutils
import std/sugar
import std/tables

const
  htmlTags = "!-- !DOCTYPE a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd label legend li link main map mark meta meter nav noframes noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr".splitWhitespace

proc escapeText(text: string, target: Target): string =
  case target
  of tHtml:
    text.multiReplace({"<": "&lt;", ">": "&gt;", "&": "&amp;"})
  of tLatex:
    text

proc expandStr(doc: Document, str: string, ctx: Context): string =
  for node in str.parseXidoc(doc.verbose):
    result.add case node.kind
      of xnkString: node.str
      of xnkWhitespace: " "
      of xnkCommand:
        let command = try:
          doc.commands[node.name]
        except KeyError:
          raise XidocError(msg: "Command not found: $1" % node.name)
        var newCtx = ctx
        newCtx.commandStack.add node.name
        let xstr = command(node.arg, newCtx)
        if xstr.rendered:
          raise XidocError(msg: "Rendered string given in a non-rendered context")
        xstr.str

proc renderStr*(doc: Document, str = doc.body, ctx = Context()): string =
  for node in str.parseXidoc(doc.verbose):
    result.add case node.kind
      of xnkString: node.str.escapeText(doc.target)
      of xnkWhitespace: " "
      of xnkCommand:
        let command = try:
          doc.commands[node.name]
        except KeyError:
          raise XidocError(msg: "Command not found: $1" % node.name)
        var newCtx = ctx
        newCtx.commandStack.add node.name
        let xstr = command(node.arg, newCtx)
        if xstr.rendered:
          xstr.str
        else:
          xstr.str.escapeText(doc.target)

proc defineDefaultCommands*(doc: Document) =

  macro command(name: string, sig: untyped, rendered: untyped, body: untyped): untyped =
    let sigLen = sig.len
    let arg = genSym(nskParam, "arg")
    let ctx = ident"ctx"
    let logic =
      if sig == ident"void":
        quote:
          if `arg` != "":
            raise XidocError(msg: "Command $1 must be called without an argument" % [`name`])
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
          let arg {.inject.} = doc.expandStr(`arg`.strip, `ctx`)
          `body`
      elif sig == ident"render":
        quote:
          let arg {.inject.} = doc.renderStr(`arg`.strip, `ctx`)
          `body`
      else:
        sig.expectKind nnkPar
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
                raise XidocError(msg: "Command $1 needs at least $2 arguments, $3 given" % [`name`, $`minLen`, $`args`.len])
          else:
            let minLen = sigLen - questionPos.len
            let maxLen = sigLen
            quote:
              if `args`.len < `minLen` or `args`.len > `maxLen`:
                raise XidocError(msg: "Command $1 needs at least $2 and at most $3 arguments, $4 given" % [`name`, $`minLen`, $`maxLen`, $`args`.len])
        let unpacks = nnkStmtList.newTree
        template process(kind: NimNode): (proc(doc: Document, str: string, ctx: Context): string {.nimcall.}) =
          if kind == ident"render":
            renderStr
          elif kind == ident"expand":
            expandStr
          elif kind == ident"raw":
            (proc(doc: Document, str: string, ctx: Context): string = str)
          else:
            error "invalid kind"
            (proc(doc: Document, str: string, ctx: Context): string = str)
        if starPos.isSome:
          block beforeStar:
            for index, pair in sig[0..<starPos.get(sigLen)]:
              let name = pair[0]
              let process = process(pair[1])
              unpacks.add quote do:
                let `name` {.inject.} = `process`(doc, `args`[`index`], `ctx`)
          block star:
            let start = starPos.get
            let ende = sigLen - start
            let pair = sig[start]
            let name = pair[0]
            let process = process(pair[1][1])
            unpacks.add quote do:
              let `name` {.inject.} = `args`[`start`..^`ende`].mapIt(`process`(doc, it, `ctx`))
          block afterStar:
            for index, pair in sig[starPos.get + 1 .. ^1]:
              let index = sigLen - index - starPos.get - 1
              let name = pair[0]
              let process = process(pair[1])
              unpacks.add quote do:
                let `name` {.inject.} = `process`(doc, `args`[^`index`], `ctx`)
        else: # starPos.isNone
          block beforeQuestion:
            for index, pair in sig[0..<questionPos.a]:
              let name = pair[0]
              let process = process(pair[1])
              unpacks.add quote do:
                let `name` {.inject.} = `process`(doc, `args`[`index`], `ctx`)
          block question:
            let minLen = sigLen - questionPos.len
            let start = questionPos.a
            for index, pair in sig[questionPos]:
              let name = pair[0]
              let process = process(pair[1][1])
              unpacks.add quote do:
                let `name` {.inject.} =
                  if `args`.len - `minLen` > `index`:
                    some `process`(doc, `args`[`start` + `index`], `ctx`)
                  else:
                    none string
          block afterQuestion:
            for index, pair in sig[questionPos.b + 1 .. ^1]:
              let index = sigLen - index - questionPos.b - 1
              let name = pair[0]
              let process = process(pair[1])
              unpacks.add quote do:
                let `name` {.inject.} = `process`(doc, `args`[^`index`], `ctx`)
        quote:
          let `args` = parseXidocArguments(`arg`)
          `lenCheck`
          `unpacks`
          `body`
    let rendered = newLit(rendered == ident"rendered")
    quote:
      doc.commands[`name`] = proc(`arg`: string, `ctx`: Context): XidocString = XidocString(rendered: `rendered`, str: `logic`)

  proc initKatex() =
    doc.addToHead.incl """<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.13.18/dist/katex.min.css" integrity="sha384-zTROYFVGOfTw7JV7KUu8udsvW2fx4lWOsCEDqhBreBwlHI4ioVRtmIvEThzJHGET" crossorigin="anonymous"><script defer src="https://cdn.jsdelivr.net/npm/katex@0.13.18/dist/katex.min.js" integrity="sha384-GxNFqL3r9uRJQhR+47eDxuPoNE7yLftQM8LcxzgS4HT73tp970WS/wV5p8UzCOmb" crossorigin="anonymous"></script><script type="module">for(let e of document.querySelectorAll`xd-inline-math,xd-block-math`)katex.render(e.innerText,e)</script>"""

  template theoremLikeCommand(cmdName: static string, phrase: static Phrase, htmlTmpl, latexTmpl: static string) =
    command cmdName, (thName: ?render, content: render), rendered:
      let word = phrase.translate(ctx.lang.get(doc.lang))
      case doc.target
      of tHtml:
        if thName.isSome:
          "<p><strong>$1 ($2).</strong> $3</p>" % [word, thName.get, htmlTmpl % content]
        else:
          "<p><strong>$1.</strong> $2</p>" % [word, htmlTmpl % content]
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

  command "--", void, unrendered:
    "–"

  command "---", void, unrendered:
    "—"

  command "$", raw, rendered:
    case doc.target
    of tHtml:
      # TODO: allow choice of way to render
      initKatex()
      "<xd-inline-math>$1</xd-inline-math>" % arg.escapeText(doc.target)
    of tLatex:
      "\\($1\\)" % arg.escapeText(doc.target)

  command "$$", raw, rendered:
    case doc.target
    of tHtml:
      # TODO: allow choice of way to render
      "<xd-block-math>\\displaystyle $1</xd-block-math>" % arg
    of tLatex:
      "\\[$1\\]" % arg

  command "bf", render, rendered:
    case doc.target
    of tHtml:
      "<b>$1</b>" % arg
    of tLatex:
      "\\textbf{$1}" % arg

  theoremLikeCommand("dfn", pDefinition, "<dfn>$1</dfn>", "$1")

  theoremLikeCommand("example", pExample, "$1", "$1")

  command "if-html", raw, rendered:
    if doc.target == tHtml:
      doc.renderStr(arg, ctx)
    else:
      ""

  command "if-latex", raw, rendered:
    if doc.target == tLatex:
      doc.renderStr(arg, ctx)
    else:
      ""

  command "include", (filename: expand, args: *render), rendered:
    if args.len mod 2 != 0:
      raise XidocError(msg: "Additional arguments to include must come in pairs")
    let path = doc.path.splitPath.head / filename
    let subdoc = Document(
      path: path,
      body: readFile(path),
      target: doc.target,
      snippet: true,
      lang: doc.lang,
    )
    subdoc.defineDefaultCommands
    for i in 0..<(args.len div 2):
      subdoc.templateArgs[args[2 * i]] = args[2 * i + 1]
    subdoc.renderStr(subdoc.body, ctx)

  command "inject", (filename: expand), rendered:
    doc.renderStr(readFile(doc.path.splitPath.head / filename))

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
      else: raise XidocError(msg: "Unknown language: $1" % langStr)
    var newCtx = ctx
    newCtx.lang = some lang
    doc.renderStr(body, newCtx)

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

  command "section", (name: ?render, content: render), rendered:
    let depth = ctx.commandStack.count("section")
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
        "\\section{$1}$2" % [name.get, content]
      else:
        "\\section{}$1" % [content]

  command "set-doc-lang", expand, rendered:
    doc.lang =
      case arg.toLowerAscii
      of "en", "english": lEnglish
      of "cs", "cz", "czech": lCzech
      else: raise XidocError(msg: "Unknown language: $1" % arg)
    ""

  command "template-arg", render, rendered:
    doc.templateArgs[arg]

  theoremLikeCommand("theorem", pTheorem, "$1", "$1")

  case doc.target
  of tHtml:

    proc generateHtmlTag(tag: string, args: seq[string], body: string): string =
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
      "<$1>$2</$3>" % [(@[tag] & attrs).join(" "), body, tag]

    command "<>", (tag: expand, args: *expand, body: render), rendered:
      generateHtmlTag(tag, args, body)

    for tag in htmlTags:
      # This proc makes sure that tag is captured by value
      (proc(tag: string) =
        command "<$1>" % tag, (args: *expand, body: render), rendered:
          generateHtmlTag(tag, args, body)
      )(tag)

  else:
    discard

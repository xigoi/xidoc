import ./parser
import ./types
import std/macros
import std/options
import std/os
import std/sequtils
import std/strutils
import std/sugar
import std/tables

const
  htmlTags = "!-- !DOCTYPE a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 to h6 head header hr html i iframe img input ins kbd label legend li link main map mark meta meter nav noframes noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr".splitWhitespace

proc escapeText(text: string, target: Target): string =
  case target
  of tHtml:
    text.multiReplace({"<": "&lt;", ">": "&gt;", "&": "&amp;"})
  of tLatex:
    text

proc expandStr(doc: Document, str: string): string =
  for node in str.parseXidoc(doc.verbose):
    result.add case node.kind
      of xnkString: node.str
      of xnkWhitespace: " "
      of xnkCommand:
        let command = try:
          doc.commands[node.name]
        except KeyError:
          raise XidocError(msg: "Command not found: $1" % node.name)
        let xstr = command(node.arg)
        if xstr.rendered:
          raise XidocError(msg: "Rendered string given in a non-rendered context")
        xstr.str

proc renderStr*(doc: Document, str = doc.body): string =
  for node in str.parseXidoc(doc.verbose):
    result.add case node.kind
      of xnkString: node.str.escapeText(doc.target)
      of xnkWhitespace: " "
      of xnkCommand:
        let command = try:
          doc.commands[node.name]
        except KeyError:
          raise XidocError(msg: "Command not found: $1" % node.name)
        let xstr = command(node.arg)
        if xstr.rendered:
          xstr.str
        else:
          xstr.str.escapeText(doc.target)

proc defineDefaultCommands*(doc: Document) =

  macro command(name: string, signature: untyped, rendered: untyped, body: untyped): untyped =
    let arg = genSym(nskParam, "arg")
    let logic =
      if signature == ident"void":
        quote:
          if `arg` != "":
            raise XidocError(msg: "Command $1 must be called without an argument" % [`name`])
          `body`
      elif signature == ident"literal":
        quote:
          let arg {.inject.} = `arg`
          `body`
      elif signature == ident"raw":
        quote:
          let arg {.inject.} = `arg`.strip
          `body`
      elif signature == ident"expand":
        quote:
          let arg {.inject.} = doc.expandStr `arg`.strip
          `body`
      elif signature == ident"render":
        quote:
          let arg {.inject.} = doc.renderStr `arg`.strip
          `body`
      else:
        signature.expectKind nnkPar
        var starPos = none int
        for index, pair in signature:
          pair.expectKind nnkExprColonExpr
          if pair[1].kind == nnkPrefix and pair[1][0] == ident"*":
            starPos = some index
            break
        let args = genSym(nskLet, "args")
        let lenCheck =
          if starPos.isSome:
            let minLen = signature.len - 1
            quote:
              if `args`.len < `minLen`:
                raise XidocError(msg: "Command $1 needs at least $2 arguments, $3 given" % [`name`, $`minLen`, $`args`.len])
          else:
            let minLen = signature.len
            let maxLen = signature.len
            quote:
              if `args`.len < `minLen` or `args`.len > `maxLen`:
                raise XidocError(msg: "Command $1 needs at least $2 and at most $3 arguments, $4 given" % [`name`, $`minLen`, $`maxLen`, $`args`.len])
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
        for index, pair in signature[0..<starPos.get(signature.len)]:
          let name = pair[0]
          let process = process(pair[1])
          unpacks.add quote do:
            let `name` {.inject.} = `process`(doc, `args`[`index`])
        if starPos.isSome:
          block:
            let start = starPos.get
            let ende = signature.len - start
            let pair = signature[start]
            let name = pair[0]
            let process = process(pair[1][1])
            unpacks.add quote do:
              let `name` {.inject.} = `args`[`start`..^`ende`].mapIt(`process`(doc, it))
          for index, pair in signature[starPos.get + 1 .. ^1]:
            let index = signature.len - index - starPos.get - 1
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
      doc.commands[`name`] = proc(`arg`: string): XidocString = XidocString(rendered: `rendered`, str: `logic`)

  command "#", literal, unrendered:
    ""

  command "", literal, unrendered:
    arg

  command "--", void, unrendered:
    "–"

  command "$", raw, rendered:
    case doc.target
    of tHtml:
      # TODO: make sure it's rendered
      "<xd-inline-math>$1</xd-inline-math>" % arg
    of tLatex:
      "\\($1\\)" % arg

  command "$$", raw, rendered:
    case doc.target
    of tHtml:
      # TODO: make sure it's rendered
      "<xd-block-math>$1</xd-block-math>" % arg
    of tLatex:
      "\\[$1\\]" % arg

  command "bf", render, rendered:
    case doc.target
    of tHtml:
      "<b>$1</b>" % arg
    of tLatex:
      "\\textbf{$1}" % arg

  command "dfn", (content: render), rendered:
    const word = "Definition. " # TODO: i18n
    case doc.target
    of tHtml:
      "<p><strong>$1</strong><dfn>$2</dfn></p>" % [word, content]
    of tLatex:
      # TODO: make it actually work
      "\\begin{definition}$1\end{definition}" % content

  command "include", (filename: expand, args: *render), rendered:
    if args.len mod 2 != 0:
      raise XidocError(msg: "Additional arguments to include must come in pairs")
    let path = doc.path.splitPath.head / filename
    let subdoc = Document(
      path: path,
      body: readFile(path),
      target: doc.target,
      snippet: true,
    )
    subdoc.defineDefaultCommands
    for i in 0..<(args.len div 2):
      subdoc.templateArgs[args[2 * i]] = args[2 * i + 1]
    subdoc.renderStr

  command "inject", (filename: expand), rendered:
    doc.renderStr(readFile(doc.path.splitPath.head / filename))

  command "it", render, rendered:
    case doc.target
    of tHtml:
      "<i>$1</i>" % arg
    of tLatex:
      "\\textit{$1}" % arg

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

  command "pass", expand, rendered:
    arg.strip

  command "pass-raw", raw, rendered:
    arg.strip

  command "props", (items: *render), rendered:
    case doc.target
    of tHtml:
      "<ul>$1</ul>" % items.mapIt("<li>$1</li>" % it).join
    of tLatex:
      "\\begin{itemize}$1\\end{iremize}" % items.mapIt("\\item $1" % it).join

  command "raw", raw, unrendered:
    arg.strip

  command "section", (name: render, content: render), rendered:
    case doc.target
    of tHtml:
      "<section>$1</section>" % content
    of tLatex:
      # TODO: handling of nested sections
      "\\section{$1}" % content

  command "template-arg", render, rendered:
    doc.templateArgs[arg]

  command "theorem", (name: *render, content: render), rendered: # TODO: name: ?render
    const word = "Theorem" # TODO: i18n
    case doc.target
    of tHtml:
      if name.len == 0:
        "<p><strong>$1.</strong> $2</p>" % [word, content]
      else:
        "<p><strong>$1 ($2).</strong> $2</p>" % [word, content]
    of tLatex:
      # TODO: make it actually work
      "\\begin{theorem}$1\end{theorem}" % content

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

from std/htmlgen as htg import nil
import ./types
import std/strutils
import std/sugar
import std/typetraits

type
  TableOfContentsEntry = object
    name: string
    link: string
    children: seq[TableOfContentsEntry]
  TableOfContents* = distinct seq[TableOfContentsEntry]

func renderHtml*(entries: seq[TableOfContentsEntry]): string =
  let renderedEntries = collect:
    for entry in entries:
      htg.li:
        if entry.link == "":
          entry.name
        else:
          htg.a(href = entry.link, entry.name)
  renderedEntries.join

func render*(toc: TableOfContents, target: Target): string =
  case target
  of tHtml:
    let renderedChildren = toc.distinctBase.renderHtml
    result = htg.ol(class = "xd-table-of-contents", renderedChildren)
  else: discard

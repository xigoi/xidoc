import std/unittest
import xidoc

proc shouldRenderAs(input: string, output: string) =
  check input.renderXidoc(snippet = true) == output

suite "plain text":

  test "normal text":
    "hello world".shouldRenderAs("hello world")

  test "escaping special characters":
    "std::vector<std::string&>".shouldRenderAs("std::vector&lt;std::string&amp;>")

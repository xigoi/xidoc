import ../xidocpkg/error

import std/strutils

import std/sugar

when defined(js):

  proc pikchr*(text: string): string =
    xidocError "Pikchr is not available when using JavaScript"

else:

  {.compile: "../pikchr/pikchr.c"}

  let
    darkModeFlag: cuint = 2

  proc pikchr(zText: cstring, zClass: cstring, mFlags: cuint,
              pnWidth: ptr cint, pnHeight: ptr cint): cstring {.importc.}

  proc pikchr*(text: string, darkMode = false): string =
    const class = "xd-pikchr".cstring
    var flags = 0.cuint
    if darkMode:
      flags = flags or darkModeFlag
    let cresult = pikchr(text.cstring, class, flags, nil, nil)
    if cresult.isNil:
      xidocError "Unknown error while rendering Pikchr"
    result = $cresult
    if not result.startsWith("<svg"):
      xidocError "Error while rendering Pikchr:\n" &
        result.strip.dup(removePrefix("<div><pre>")).dup(removeSuffix("</pre></div>")).strip

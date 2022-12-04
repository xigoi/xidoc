import ../xidocpkg/error
import std/strutils
import system/ansi_c

when defined(js):

  proc pikchr*(text: string): string =
    xidocError "Pikchr is not available when using JavaScript"

else:

  {.compile: "../pikchr/pikchr.c"}

  let
    plaintextErrorsFlag: cuint = 1
    darkModeFlag: cuint = 2

  proc pikchr(zText: cstring, zClass: cstring, mFlags: cuint,
              pnWidth: ptr cint, pnHeight: ptr cint): cstring {.importc.}

  proc pikchr*(text: string, darkMode = false): string =
    const class = "xd-pikchr".cstring
    var flags = plaintextErrorsFlag
    if darkMode:
      flags = flags or darkModeFlag
    var width: cint
    let cResult = pikchr(text.cstring, class, flags, width.addr, nil)
    if cResult.isNil:
      xidocError "Unknown error while rendering Pikchr"
    result = $cResult
    cFree cResult
    if width < 0:
      xidocError "Error while rendering Pikchr:\n" & result.strip

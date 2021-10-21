# Package

version       = "2021.10.21"
author        = "Adam Blažek"
description   = "A consistent markup language"
license       = "GPL-3.0-only"
srcDir        = "src"
installExt    = @["nim"]
bin           = @["xidoc"]


# Dependencies

requires "nim >= 1.4.8"

requires "cligen >= 1.5.12"
requires "npeg >= 0.24.1"

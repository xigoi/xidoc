# Package

version       = "2022.8.31"
author        = "Adam Blažek"
description   = "A consistent markup language"
license       = "GPL-3.0-only"
srcDir        = "src"
installExt    = @["nim"]
bin           = @["xidoc"]


# Dependencies

requires "nim >= 1.4.8"

requires "cligen >= 1.5.12"
requires "matext >= 2022.5.13"
requires "npeg >= 0.24.1"


# Tasks

task mjs, "Compile to JavaScript to be used in the playground":
  exec "nimble js -d:release --out:docs/xidoc.js src/xidoc.nim"
  echo "Minifying with terser"
  exec "terser docs/xidoc.js -o docs/xidoc.min.js --compress --mangle --module"
  echo "Done"

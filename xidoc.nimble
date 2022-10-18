# Package

version       = "2022.10.18"
author        = "Adam Blažek"
description   = "A consistent markup language"
license       = "GPL-3.0-only"
srcDir        = "src"
installExt    = @["nim"]
bin           = @["xidoc"]


# Dependencies

requires "nim >= 1.4.8"

requires "https://git.sr.ht/~xigoi/aspartame >= 2022.9.14"
requires "cligen >= 1.5.12"
requires "matext >= 2022.9.3"
requires "npeg >= 0.24.1"


# Tasks

task mjs, "Compile to JavaScript to be used in the playground":
  exec "nimble js -d:release --out:docs/xidoc.js src/xidoc.nim"
  echo "Minifying with terser"
  exec "terser docs/xidoc.js -o docs/xidoc.min.js --compress --mangle --module"
  echo "Done"

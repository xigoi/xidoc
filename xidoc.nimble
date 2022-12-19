# Package

version       = "2022.12.19"
author        = "Adam Blažek"
description   = "A consistent markup language"
license       = "GPL-3.0-only"
srcDir        = "src"
installExt    = @["nim"]
bin           = @["xidoc"]


# Dependencies

requires "nim >= 1.4.8"

requires "aspartame >= 2022.9.14"
requires "cligen >= 1.5.12"
requires "matext >= 2022.9.3"


# Tasks

task mjs, "Compile to JavaScript to be used in the playground":
  exec "nimble js -d:release --out:site/xidoc.js src/xidoc.nim"
  echo "Minifying with terser"
  exec "terser site/xidoc.js -o site/xidoc.min.js --compress --mangle --module"
  echo "Done"

# Package

version       = "2023.706.0"
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
requires "heine >= 2023.414.1"
requires "matext >= 2022.9.3"
requires "https://git.sr.ht/~xigoi/rapidjs >= 2023.706.1"


# Tasks

task mjs, "Compile to JavaScript to be used in the playground":
  exec "nimble js -d:release --out:site/xidoc.js src/xidoc.nim"
  echo "Minifying with terser"
  exec "terser site/xidoc.js -o site/xidoc.min.js --compress --mangle --module --toplevel"
  echo "Done"

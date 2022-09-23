import ../error
import ../types
import ./utils
import aspartame
import std/options
import std/strformat
import std/strutils

commands jsCommands:

  proc forCmd(name: !String, container: !String, body: !String): String {.command: "for".} =
    &"for(const {name} of {container}){{{body}}}"

  proc ifCmd(condition: !String, body: !String, elses: *String): String {.command: "if".} =
    result = &"if({condition}){{{body}}}"
    for i in 0..<(elses.len div 2):
      result &= &"else if({elses[2*i]}){{{elses[2*i+1]}}}"
    if elses.len mod 2 == 1:
      result &= &"else{{{elses[^1]}}}"

  proc ifExprCmd(condition: !String, expr: !String, elses: *String): String {.command: "if=".} =
    result = &"{condition}?{expr}"
    if elses.len mod 2 != 1:
      xidocError "[if=] requires an else clause"
    for i in 0..<(elses.len div 2):
      result &= &":{elses[2*i]}?{elses[2*i+1]}"
    result &= &":{elses[^1]}"

  proc iifCmd(body: !String): String {.command: "iif".} =
    &"(()=>{{{body}}})()"

  proc letCmd(name: !String, value: !String): String {.command: "let".} =
    &"const {name}={value};"

  proc rangeCmd(name: !String, n: !String, m: ?String, r: ?String, body: !String): String {.command: "range".} =
    ifSome m:
      ifSome r:
        &"for(let {name}={n};{name}<{m};{name}+={r}){{{body}}}"
      do:
        &"for(let {name}={n};{name}<{m};++{name}){{{body}}}"
    do:
      &"for(let {name}=0;{name}<{n};++{name}){{{body}}}"

  proc switchCmd(name: !String, cases: *String): String {.command: "switch".} =
    if cases.len mod 2 != 0:
      xidocError "Extra arguments to [switch] must come in pairs"
    result = &"switch({name}){{"
    for i in 0..<(cases.len div 2):
      let label =
        if cases[2*i] == "default": "default"
        else: "case " & cases[2*i]
      result &= &"{label}:{{{cases[2*i+1]}}}break;"
    result &= "}"#}

  proc varCmd(name: !String, value: ?String): String {.command: "var".} =
    ifSome(value, &"let {name}={value};", &"let {name};")

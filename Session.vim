let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/xidoc
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
set shortmess=aoO
badd +0 src/xidoc.nim
badd +0 src/xidocpkg/commands/checkbox.nim
badd +0 src/xidocpkg/commands/css.nim
badd +0 src/xidocpkg/commands/default.nim
badd +0 src/xidocpkg/commands/math.nim
badd +0 src/xidocpkg/commands/utils.nim
badd +0 src/xidocpkg/error.nim
badd +0 src/xidocpkg/expand.nim
badd +0 src/xidocpkg/jsinterpret.nim
badd +0 src/xidocpkg/parser.nim
badd +0 src/xidocpkg/translations.nim
badd +0 src/xidocpkg/types.nim
badd +0 docs/commands.xd
badd +0 docs/head.xd
badd +0 docs/index.xd
badd +0 docs/manual.xd
badd +0 docs/playground.xd
badd +0 docs/todo.xd
argglobal
%argdel
$argadd src/xidoc.nim
$argadd src/xidocpkg/commands/checkbox.nim
$argadd src/xidocpkg/commands/css.nim
$argadd src/xidocpkg/commands/default.nim
$argadd src/xidocpkg/commands/math.nim
$argadd src/xidocpkg/commands/utils.nim
$argadd src/xidocpkg/error.nim
$argadd src/xidocpkg/expand.nim
$argadd src/xidocpkg/jsinterpret.nim
$argadd src/xidocpkg/parser.nim
$argadd src/xidocpkg/translations.nim
$argadd src/xidocpkg/types.nim
$argadd docs/commands.xd
$argadd docs/head.xd
$argadd docs/index.xd
$argadd docs/manual.xd
$argadd docs/playground.xd
$argadd docs/todo.xd
edit src/xidoc.nim
argglobal
setlocal fdm=marker
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 4 - ((3 * winheight(0) + 22) / 45)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 4
normal! 0
tabnext 1
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0&& getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20 shortmess=aoOstTWFcA
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
nohlsearch
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :

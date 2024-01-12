var temml=function(){"use strict";class e{constructor(t,r){let n,s=" "+t;const o=r&&r.loc;if(o&&o.start<=o.end){const e=o.lexer.input;n=o.start;const t=o.end;n===e.length?s+=" at end of input: ":s+=" at position "+(n+1)+": ";const r=e.slice(n,t).replace(/[^]/g,"$&̲");let a,i;a=n>15?"…"+e.slice(n-15,n):e.slice(0,n),i=t+15<e.length?e.slice(t,t+15)+"…":e.slice(t),s+=a+r+i}const a=new Error(s);return a.name="ParseError",a.__proto__=e.prototype,a.position=n,a}}e.prototype.__proto__=Error.prototype;const t=/([A-Z])/g,r={"&":"&amp;",">":"&gt;","<":"&lt;",'"':"&quot;","'":"&#x27;"},n=/[&><"']/g;const s=function(e){return"ordgroup"===e.type||"color"===e.type?1===e.body.length?s(e.body[0]):e:"font"===e.type?s(e.body):e};var o={deflt:function(e,t){return void 0===e?t:e},escape:function(e){return String(e).replace(n,(e=>r[e]))},hyphenate:function(e){return e.replace(t,"-$1").toLowerCase()},getBaseElem:s,isCharacterBox:function(e){const t=s(e);return"mathord"===t.type||"textord"===t.type||"atom"===t.type},protocolFromUrl:function(e){const t=/^\s*([^\\/#]*?)(?::|&#0*58|&#x0*3a)/i.exec(e);return null!=t?t[1]:"_relative"},round:function(e){return+e.toFixed(4)}};class a{constructor(e){e=e||{},this.displayMode=o.deflt(e.displayMode,!1),this.annotate=o.deflt(e.annotate,!1),this.leqno=o.deflt(e.leqno,!1),this.throwOnError=o.deflt(e.throwOnError,!1),this.errorColor=o.deflt(e.errorColor,"#b22222"),this.macros=e.macros||{},this.wrap=o.deflt(e.wrap,"tex"),this.xml=o.deflt(e.xml,!1),this.colorIsTextColor=o.deflt(e.colorIsTextColor,!1),this.strict=o.deflt(e.strict,!1),this.trust=o.deflt(e.trust,!1),this.maxSize=void 0===e.maxSize?[1/0,1/0]:Array.isArray(e.maxSize)?e.maxSize:[1/0,1/0],this.maxExpand=Math.max(0,o.deflt(e.maxExpand,1e3))}isTrusted(e){e.url&&!e.protocol&&(e.protocol=o.protocolFromUrl(e.url));const t="function"==typeof this.trust?this.trust(e):this.trust;return Boolean(t)}}const i={},l={};function c({type:e,names:t,props:r,handler:n,mathmlBuilder:s}){const o={type:e,numArgs:r.numArgs,argTypes:r.argTypes,allowedInArgument:!!r.allowedInArgument,allowedInText:!!r.allowedInText,allowedInMath:void 0===r.allowedInMath||r.allowedInMath,numOptionalArgs:r.numOptionalArgs||0,infix:!!r.infix,primitive:!!r.primitive,handler:n};for(let e=0;e<t.length;++e)i[t[e]]=o;e&&s&&(l[e]=s)}function m({type:e,mathmlBuilder:t}){c({type:e,names:[],props:{numArgs:0},handler(){throw new Error("Should never be called.")},mathmlBuilder:t})}const u=function(e){return"ordgroup"===e.type&&1===e.body.length?e.body[0]:e},p=function(e){return"ordgroup"===e.type?e.body:[e]};class d{constructor(e){this.children=e,this.classes=[],this.style={}}hasClass(e){return this.classes.includes(e)}toNode(){const e=document.createDocumentFragment();for(let t=0;t<this.children.length;t++)e.appendChild(this.children[t].toNode());return e}toMarkup(){let e="";for(let t=0;t<this.children.length;t++)e+=this.children[t].toMarkup();return e}toText(){return this.children.map((e=>e.toText())).join("")}}const h=function(e){return e.filter((e=>e)).join(" ")},g=function(e,t){this.classes=e||[],this.attributes={},this.style=t||{}},f=function(e){const t=document.createElement(e);t.className=h(this.classes);for(const e in this.style)Object.prototype.hasOwnProperty.call(this.style,e)&&(t.style[e]=this.style[e]);for(const e in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,e)&&t.setAttribute(e,this.attributes[e]);for(let e=0;e<this.children.length;e++)t.appendChild(this.children[e].toNode());return t},b=function(e){let t=`<${e}`;this.classes.length&&(t+=` class="${o.escape(h(this.classes))}"`);let r="";for(const e in this.style)Object.prototype.hasOwnProperty.call(this.style,e)&&(r+=`${o.hyphenate(e)}:${this.style[e]};`);r&&(t+=` style="${r}"`);for(const e in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,e)&&(t+=` ${e}="${o.escape(this.attributes[e])}"`);t+=">";for(let e=0;e<this.children.length;e++)t+=this.children[e].toMarkup();return t+=`</${e}>`,t};class y{constructor(e,t,r){g.call(this,e,r),this.children=t||[]}setAttribute(e,t){this.attributes[e]=t}toNode(){return f.call(this,"span")}toMarkup(){return b.call(this,"span")}}class x{constructor(e){this.text=e}toNode(){return document.createTextNode(this.text)}toMarkup(){return o.escape(this.text)}}class w{constructor(e,t,r){this.alt=t,this.src=e,this.classes=["mord"],this.style=r}hasClass(e){return this.classes.includes(e)}toNode(){const e=document.createElement("img");e.src=this.src,e.alt=this.alt,e.className="mord";for(const t in this.style)Object.prototype.hasOwnProperty.call(this.style,t)&&(e.style[t]=this.style[t]);return e}toMarkup(){let e=`<img src='${this.src}' alt='${this.alt}'`,t="";for(const e in this.style)Object.prototype.hasOwnProperty.call(this.style,e)&&(t+=`${o.hyphenate(e)}:${this.style[e]};`);return t&&(e+=` style="${o.escape(t)}"`),e+=">",e}}class k{constructor(e,t,r,n){this.type=e,this.attributes={},this.children=t||[],this.classes=r||[],this.style=n||{}}setAttribute(e,t){this.attributes[e]=t}getAttribute(e){return this.attributes[e]}toNode(){const e=document.createElementNS("http://www.w3.org/1998/Math/MathML",this.type);for(const t in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,t)&&e.setAttribute(t,this.attributes[t]);this.classes.length>0&&(e.className=h(this.classes));for(const t in this.style)Object.prototype.hasOwnProperty.call(this.style,t)&&(e.style[t]=this.style[t]);for(let t=0;t<this.children.length;t++)e.appendChild(this.children[t].toNode());return e}toMarkup(){let e="<"+this.type;for(const t in this.attributes)Object.prototype.hasOwnProperty.call(this.attributes,t)&&(e+=" "+t+'="',e+=o.escape(this.attributes[t]),e+='"');this.classes.length>0&&(e+=` class="${o.escape(h(this.classes))}"`);let t="";for(const e in this.style)Object.prototype.hasOwnProperty.call(this.style,e)&&(t+=`${o.hyphenate(e)}:${this.style[e]};`);t&&(e+=` style="${t}"`),e+=">";for(let t=0;t<this.children.length;t++)e+=this.children[t].toMarkup();return e+="</"+this.type+">",e}toText(){return this.children.map((e=>e.toText())).join("")}}class v{constructor(e){this.text=e}toNode(){return document.createTextNode(this.text)}toMarkup(){return o.escape(this.toText())}toText(){return this.text}}const A=e=>{let t;return 1===e.length&&"mrow"===e[0].type?(t=e.pop(),t.type="mstyle"):t=new k("mstyle",e),t};var N={MathNode:k,TextNode:v,newDocumentFragment:function(e){return new d(e)}};const T=e=>{let t=0;if(e.body)for(const r of e.body)t+=T(r);else if("supsub"===e.type)t+=T(e.base),e.sub&&(t+=.7*T(e.sub)),e.sup&&(t+=.7*T(e.sup));else if("mathord"===e.type||"textord"===e.type)for(const r of e.text.split("")){const e=r.codePointAt(0);t+=96<e&&e<123||944<e&&e<970?.56:47<e&&e<58?.5:.92}else t+=1;return t},q={widehat:"^",widecheck:"ˇ",widetilde:"~",wideparen:"⏜",utilde:"~",overleftarrow:"←",underleftarrow:"←",xleftarrow:"←",overrightarrow:"→",underrightarrow:"→",xrightarrow:"→",underbrace:"⏟",overbrace:"⏞",overgroup:"⏠",overparen:"⏜",undergroup:"⏡",underparen:"⏝",overleftrightarrow:"↔",underleftrightarrow:"↔",xleftrightarrow:"↔",Overrightarrow:"⇒",xRightarrow:"⇒",overleftharpoon:"↼",xleftharpoonup:"↼",overrightharpoon:"⇀",xrightharpoonup:"⇀",xLeftarrow:"⇐",xLeftrightarrow:"⇔",xhookleftarrow:"↩",xhookrightarrow:"↪",xmapsto:"↦",xrightharpoondown:"⇁",xleftharpoondown:"↽",xtwoheadleftarrow:"↞",xtwoheadrightarrow:"↠",xlongequal:"=",xrightleftarrows:"⇄",yields:"→",yieldsLeft:"←",mesomerism:"↔",longrightharpoonup:"⇀",longleftharpoondown:"↽",eqrightharpoonup:"⇀",eqleftharpoondown:"↽","\\cdrightarrow":"→","\\cdleftarrow":"←","\\cdlongequal":"="},S=function(e){const t=new N.TextNode(q[e.slice(1)]),r=new N.MathNode("mo",[t]);return r.setAttribute("stretchy","true"),r},O=["\\widetilde","\\widehat","\\widecheck","\\utilde"];var B=S,M=e=>{const t=S(e.label);if(O.includes(e.label)){const r=T(e.base);1<r&&r<1.6?t.classes.push("tml-crooked-2"):1.6<=r&&r<2.5?t.classes.push("tml-crooked-3"):2.5<=r&&t.classes.push("tml-crooked-4")}return t};const C={bin:1,close:1,inner:1,open:1,punct:1,rel:1},z={"accent-token":1,mathord:1,"op-token":1,spacing:1,textord:1},E={math:{},text:{}};function I(e,t,r,n,s){E[e][n]={group:t,replace:r},s&&r&&(E[e][r]=E[e][n])}const L="math",F="text",$="accent-token",G="bin",D="close",P="inner",R="mathord",j="op-token",U="open",H="punct",V="rel",_="spacing",W="textord";I(L,V,"≡","\\equiv",!0),I(L,V,"≺","\\prec",!0),I(L,V,"≻","\\succ",!0),I(L,V,"∼","\\sim",!0),I(L,V,"⟂","\\perp",!0),I(L,V,"⪯","\\preceq",!0),I(L,V,"⪰","\\succeq",!0),I(L,V,"≃","\\simeq",!0),I(L,V,"≌","\\backcong",!0),I(L,V,"|","\\mid",!0),I(L,V,"≪","\\ll",!0),I(L,V,"≫","\\gg",!0),I(L,V,"≍","\\asymp",!0),I(L,V,"∥","\\parallel"),I(L,V,"⌣","\\smile",!0),I(L,V,"⊑","\\sqsubseteq",!0),I(L,V,"⊒","\\sqsupseteq",!0),I(L,V,"≐","\\doteq",!0),I(L,V,"⌢","\\frown",!0),I(L,V,"∋","\\ni",!0),I(L,V,"∌","\\notni",!0),I(L,V,"∝","\\propto",!0),I(L,V,"⊢","\\vdash",!0),I(L,V,"⊣","\\dashv",!0),I(L,V,"∋","\\owns"),I(L,V,"≘","\\arceq",!0),I(L,V,"≙","\\wedgeq",!0),I(L,V,"≚","\\veeeq",!0),I(L,V,"≛","\\stareq",!0),I(L,V,"≝","\\eqdef",!0),I(L,V,"≞","\\measeq",!0),I(L,V,"≟","\\questeq",!0),I(L,V,"≠","\\ne",!0),I(L,V,"≠","\\neq"),I(L,V,"⩵","\\eqeq",!0),I(L,V,"⩶","\\eqeqeq",!0),I(L,V,"∷","\\dblcolon",!0),I(L,V,"≔","\\coloneqq",!0),I(L,V,"≕","\\eqqcolon",!0),I(L,V,"∹","\\eqcolon",!0),I(L,V,"⩴","\\Coloneqq",!0),I(L,H,".","\\ldotp"),I(L,H,"·","\\cdotp"),I(L,W,"#","\\#"),I(F,W,"#","\\#"),I(L,W,"&","\\&"),I(F,W,"&","\\&"),I(L,W,"ℵ","\\aleph",!0),I(L,W,"∀","\\forall",!0),I(L,W,"ℏ","\\hbar",!0),I(L,W,"∃","\\exists",!0),I(L,W,"∇","\\nabla",!0),I(L,W,"♭","\\flat",!0),I(L,W,"ℓ","\\ell",!0),I(L,W,"♮","\\natural",!0),I(L,W,"Å","\\Angstrom",!0),I(F,W,"Å","\\Angstrom",!0),I(L,W,"♣","\\clubsuit",!0),I(L,W,"♧","\\varclubsuit",!0),I(L,W,"℘","\\wp",!0),I(L,W,"♯","\\sharp",!0),I(L,W,"♢","\\diamondsuit",!0),I(L,W,"♦","\\vardiamondsuit",!0),I(L,W,"ℜ","\\Re",!0),I(L,W,"♡","\\heartsuit",!0),I(L,W,"♥","\\varheartsuit",!0),I(L,W,"ℑ","\\Im",!0),I(L,W,"♠","\\spadesuit",!0),I(L,W,"♤","\\varspadesuit",!0),I(L,W,"♀","\\female",!0),I(L,W,"♂","\\male",!0),I(L,W,"§","\\S",!0),I(F,W,"§","\\S"),I(L,W,"¶","\\P",!0),I(F,W,"¶","\\P"),I(F,W,"☺","\\smiley",!0),I(L,W,"☺","\\smiley",!0),I(L,W,"†","\\dag"),I(F,W,"†","\\dag"),I(F,W,"†","\\textdagger"),I(L,W,"‡","\\ddag"),I(F,W,"‡","\\ddag"),I(F,W,"‡","\\textdaggerdbl"),I(L,D,"⎱","\\rmoustache",!0),I(L,U,"⎰","\\lmoustache",!0),I(L,D,"⟯","\\rgroup",!0),I(L,U,"⟮","\\lgroup",!0),I(L,G,"∓","\\mp",!0),I(L,G,"⊖","\\ominus",!0),I(L,G,"⊎","\\uplus",!0),I(L,G,"⊓","\\sqcap",!0),I(L,G,"∗","\\ast"),I(L,G,"⊔","\\sqcup",!0),I(L,G,"◯","\\bigcirc",!0),I(L,G,"∙","\\bullet",!0),I(L,G,"‡","\\ddagger"),I(L,G,"≀","\\wr",!0),I(L,G,"⨿","\\amalg"),I(L,G,"&","\\And"),I(L,V,"⟵","\\longleftarrow",!0),I(L,V,"⇐","\\Leftarrow",!0),I(L,V,"⟸","\\Longleftarrow",!0),I(L,V,"⟶","\\longrightarrow",!0),I(L,V,"⇒","\\Rightarrow",!0),I(L,V,"⟹","\\Longrightarrow",!0),I(L,V,"↔","\\leftrightarrow",!0),I(L,V,"⟷","\\longleftrightarrow",!0),I(L,V,"⇔","\\Leftrightarrow",!0),I(L,V,"⟺","\\Longleftrightarrow",!0),I(L,V,"↤","\\mapsfrom",!0),I(L,V,"↦","\\mapsto",!0),I(L,V,"⟼","\\longmapsto",!0),I(L,V,"↗","\\nearrow",!0),I(L,V,"↩","\\hookleftarrow",!0),I(L,V,"↪","\\hookrightarrow",!0),I(L,V,"↘","\\searrow",!0),I(L,V,"↼","\\leftharpoonup",!0),I(L,V,"⇀","\\rightharpoonup",!0),I(L,V,"↙","\\swarrow",!0),I(L,V,"↽","\\leftharpoondown",!0),I(L,V,"⇁","\\rightharpoondown",!0),I(L,V,"↖","\\nwarrow",!0),I(L,V,"⇌","\\rightleftharpoons",!0),I(L,R,"↯","\\lightning",!0),I(L,R,"∎","\\QED",!0),I(L,R,"‰","\\permil",!0),I(F,W,"‰","\\permil"),I(L,R,"☉","\\astrosun",!0),I(L,R,"☼","\\sun",!0),I(L,R,"☾","\\leftmoon",!0),I(L,R,"☽","\\rightmoon",!0),I(L,V,"≮","\\nless",!0),I(L,V,"⪇","\\lneq",!0),I(L,V,"≨","\\lneqq",!0),I(L,V,"≨︀","\\lvertneqq"),I(L,V,"⋦","\\lnsim",!0),I(L,V,"⪉","\\lnapprox",!0),I(L,V,"⊀","\\nprec",!0),I(L,V,"⋠","\\npreceq",!0),I(L,V,"⋨","\\precnsim",!0),I(L,V,"⪹","\\precnapprox",!0),I(L,V,"≁","\\nsim",!0),I(L,V,"∤","\\nmid",!0),I(L,V,"∤","\\nshortmid"),I(L,V,"⊬","\\nvdash",!0),I(L,V,"⊭","\\nvDash",!0),I(L,V,"⋪","\\ntriangleleft"),I(L,V,"⋬","\\ntrianglelefteq",!0),I(L,V,"⊄","\\nsubset",!0),I(L,V,"⊅","\\nsupset",!0),I(L,V,"⊊","\\subsetneq",!0),I(L,V,"⊊︀","\\varsubsetneq"),I(L,V,"⫋","\\subsetneqq",!0),I(L,V,"⫋︀","\\varsubsetneqq"),I(L,V,"≯","\\ngtr",!0),I(L,V,"⪈","\\gneq",!0),I(L,V,"≩","\\gneqq",!0),I(L,V,"≩︀","\\gvertneqq"),I(L,V,"⋧","\\gnsim",!0),I(L,V,"⪊","\\gnapprox",!0),I(L,V,"⊁","\\nsucc",!0),I(L,V,"⋡","\\nsucceq",!0),I(L,V,"⋩","\\succnsim",!0),I(L,V,"⪺","\\succnapprox",!0),I(L,V,"≆","\\ncong",!0),I(L,V,"∦","\\nparallel",!0),I(L,V,"∦","\\nshortparallel"),I(L,V,"⊯","\\nVDash",!0),I(L,V,"⋫","\\ntriangleright"),I(L,V,"⋭","\\ntrianglerighteq",!0),I(L,V,"⊋","\\supsetneq",!0),I(L,V,"⊋","\\varsupsetneq"),I(L,V,"⫌","\\supsetneqq",!0),I(L,V,"⫌︀","\\varsupsetneqq"),I(L,V,"⊮","\\nVdash",!0),I(L,V,"⪵","\\precneqq",!0),I(L,V,"⪶","\\succneqq",!0),I(L,G,"⊴","\\unlhd"),I(L,G,"⊵","\\unrhd"),I(L,V,"↚","\\nleftarrow",!0),I(L,V,"↛","\\nrightarrow",!0),I(L,V,"⇍","\\nLeftarrow",!0),I(L,V,"⇏","\\nRightarrow",!0),I(L,V,"↮","\\nleftrightarrow",!0),I(L,V,"⇎","\\nLeftrightarrow",!0),I(L,V,"△","\\vartriangle"),I(L,W,"ℏ","\\hslash"),I(L,W,"▽","\\triangledown"),I(L,W,"◊","\\lozenge"),I(L,W,"Ⓢ","\\circledS"),I(L,W,"®","\\circledR",!0),I(F,W,"®","\\circledR"),I(F,W,"®","\\textregistered"),I(L,W,"∡","\\measuredangle",!0),I(L,W,"∄","\\nexists"),I(L,W,"℧","\\mho"),I(L,W,"Ⅎ","\\Finv",!0),I(L,W,"⅁","\\Game",!0),I(L,W,"‵","\\backprime"),I(L,W,"‶","\\backdprime"),I(L,W,"‷","\\backtrprime"),I(L,W,"▲","\\blacktriangle"),I(L,W,"▼","\\blacktriangledown"),I(L,W,"■","\\blacksquare"),I(L,W,"⧫","\\blacklozenge"),I(L,W,"★","\\bigstar"),I(L,W,"∢","\\sphericalangle",!0),I(L,W,"∁","\\complement",!0),I(L,W,"ð","\\eth",!0),I(F,W,"ð","ð"),I(L,W,"╱","\\diagup"),I(L,W,"╲","\\diagdown"),I(L,W,"□","\\square"),I(L,W,"□","\\Box"),I(L,W,"◊","\\Diamond"),I(L,W,"¥","\\yen",!0),I(F,W,"¥","\\yen",!0),I(L,W,"✓","\\checkmark",!0),I(F,W,"✓","\\checkmark"),I(L,W,"✗","\\ballotx",!0),I(F,W,"✗","\\ballotx"),I(F,W,"•","\\textbullet"),I(L,W,"ℶ","\\beth",!0),I(L,W,"ℸ","\\daleth",!0),I(L,W,"ℷ","\\gimel",!0),I(L,W,"ϝ","\\digamma",!0),I(L,W,"ϰ","\\varkappa"),I(L,U,"⌜","\\ulcorner",!0),I(L,D,"⌝","\\urcorner",!0),I(L,U,"⌞","\\llcorner",!0),I(L,D,"⌟","\\lrcorner",!0),I(L,V,"≦","\\leqq",!0),I(L,V,"⩽","\\leqslant",!0),I(L,V,"⪕","\\eqslantless",!0),I(L,V,"≲","\\lesssim",!0),I(L,V,"⪅","\\lessapprox",!0),I(L,V,"≊","\\approxeq",!0),I(L,G,"⋖","\\lessdot"),I(L,V,"⋘","\\lll",!0),I(L,V,"≶","\\lessgtr",!0),I(L,V,"⋚","\\lesseqgtr",!0),I(L,V,"⪋","\\lesseqqgtr",!0),I(L,V,"≑","\\doteqdot"),I(L,V,"≓","\\risingdotseq",!0),I(L,V,"≒","\\fallingdotseq",!0),I(L,V,"∽","\\backsim",!0),I(L,V,"⋍","\\backsimeq",!0),I(L,V,"⫅","\\subseteqq",!0),I(L,V,"⋐","\\Subset",!0),I(L,V,"⊏","\\sqsubset",!0),I(L,V,"≼","\\preccurlyeq",!0),I(L,V,"⋞","\\curlyeqprec",!0),I(L,V,"≾","\\precsim",!0),I(L,V,"⪷","\\precapprox",!0),I(L,V,"⊲","\\vartriangleleft"),I(L,V,"⊴","\\trianglelefteq"),I(L,V,"⊨","\\vDash",!0),I(L,V,"⊫","\\VDash",!0),I(L,V,"⊪","\\Vvdash",!0),I(L,V,"⌣","\\smallsmile"),I(L,V,"⌢","\\smallfrown"),I(L,V,"≏","\\bumpeq",!0),I(L,V,"≎","\\Bumpeq",!0),I(L,V,"≧","\\geqq",!0),I(L,V,"⩾","\\geqslant",!0),I(L,V,"⪖","\\eqslantgtr",!0),I(L,V,"≳","\\gtrsim",!0),I(L,V,"⪆","\\gtrapprox",!0),I(L,G,"⋗","\\gtrdot"),I(L,V,"⋙","\\ggg",!0),I(L,V,"≷","\\gtrless",!0),I(L,V,"⋛","\\gtreqless",!0),I(L,V,"⪌","\\gtreqqless",!0),I(L,V,"≖","\\eqcirc",!0),I(L,V,"≗","\\circeq",!0),I(L,V,"≜","\\triangleq",!0),I(L,V,"∼","\\thicksim"),I(L,V,"≈","\\thickapprox"),I(L,V,"⫆","\\supseteqq",!0),I(L,V,"⋑","\\Supset",!0),I(L,V,"⊐","\\sqsupset",!0),I(L,V,"≽","\\succcurlyeq",!0),I(L,V,"⋟","\\curlyeqsucc",!0),I(L,V,"≿","\\succsim",!0),I(L,V,"⪸","\\succapprox",!0),I(L,V,"⊳","\\vartriangleright"),I(L,V,"⊵","\\trianglerighteq"),I(L,V,"⊩","\\Vdash",!0),I(L,V,"∣","\\shortmid"),I(L,V,"∥","\\shortparallel"),I(L,V,"≬","\\between",!0),I(L,V,"⋔","\\pitchfork",!0),I(L,V,"∝","\\varpropto"),I(L,V,"◀","\\blacktriangleleft"),I(L,V,"∴","\\therefore",!0),I(L,V,"∍","\\backepsilon"),I(L,V,"▶","\\blacktriangleright"),I(L,V,"∵","\\because",!0),I(L,V,"⋘","\\llless"),I(L,V,"⋙","\\gggtr"),I(L,G,"⊲","\\lhd"),I(L,G,"⊳","\\rhd"),I(L,V,"≂","\\eqsim",!0),I(L,V,"≑","\\Doteq",!0),I(L,V,"⥽","\\strictif",!0),I(L,V,"⥼","\\strictfi",!0),I(L,G,"∔","\\dotplus",!0),I(L,G,"∖","\\smallsetminus"),I(L,G,"⋒","\\Cap",!0),I(L,G,"⋓","\\Cup",!0),I(L,G,"⩞","\\doublebarwedge",!0),I(L,G,"⊟","\\boxminus",!0),I(L,G,"⊞","\\boxplus",!0),I(L,G,"⋇","\\divideontimes",!0),I(L,G,"⋉","\\ltimes",!0),I(L,G,"⋊","\\rtimes",!0),I(L,G,"⋋","\\leftthreetimes",!0),I(L,G,"⋌","\\rightthreetimes",!0),I(L,G,"⋏","\\curlywedge",!0),I(L,G,"⋎","\\curlyvee",!0),I(L,G,"⊝","\\circleddash",!0),I(L,G,"⊛","\\circledast",!0),I(L,G,"⊺","\\intercal",!0),I(L,G,"⋒","\\doublecap"),I(L,G,"⋓","\\doublecup"),I(L,G,"⊠","\\boxtimes",!0),I(L,G,"⋈","\\bowtie",!0),I(L,G,"⋈","\\Join"),I(L,G,"⟕","\\leftouterjoin",!0),I(L,G,"⟖","\\rightouterjoin",!0),I(L,G,"⟗","\\fullouterjoin",!0),I(L,V,"⇢","\\dashrightarrow",!0),I(L,V,"⇠","\\dashleftarrow",!0),I(L,V,"⇇","\\leftleftarrows",!0),I(L,V,"⇆","\\leftrightarrows",!0),I(L,V,"⇚","\\Lleftarrow",!0),I(L,V,"↞","\\twoheadleftarrow",!0),I(L,V,"↢","\\leftarrowtail",!0),I(L,V,"↫","\\looparrowleft",!0),I(L,V,"⇋","\\leftrightharpoons",!0),I(L,V,"↶","\\curvearrowleft",!0),I(L,V,"↺","\\circlearrowleft",!0),I(L,V,"↰","\\Lsh",!0),I(L,V,"⇈","\\upuparrows",!0),I(L,V,"↿","\\upharpoonleft",!0),I(L,V,"⇃","\\downharpoonleft",!0),I(L,V,"⊶","\\origof",!0),I(L,V,"⊷","\\imageof",!0),I(L,V,"⊸","\\multimap",!0),I(L,V,"↭","\\leftrightsquigarrow",!0),I(L,V,"⇉","\\rightrightarrows",!0),I(L,V,"⇄","\\rightleftarrows",!0),I(L,V,"↠","\\twoheadrightarrow",!0),I(L,V,"↣","\\rightarrowtail",!0),I(L,V,"↬","\\looparrowright",!0),I(L,V,"↷","\\curvearrowright",!0),I(L,V,"↻","\\circlearrowright",!0),I(L,V,"↱","\\Rsh",!0),I(L,V,"⇊","\\downdownarrows",!0),I(L,V,"↾","\\upharpoonright",!0),I(L,V,"⇂","\\downharpoonright",!0),I(L,V,"⇝","\\rightsquigarrow",!0),I(L,V,"⇝","\\leadsto"),I(L,V,"⇛","\\Rrightarrow",!0),I(L,V,"↾","\\restriction"),I(L,W,"‘","`"),I(L,W,"$","\\$"),I(F,W,"$","\\$"),I(F,W,"$","\\textdollar"),I(L,W,"¢","\\cent"),I(F,W,"¢","\\cent"),I(L,W,"%","\\%"),I(F,W,"%","\\%"),I(L,W,"_","\\_"),I(F,W,"_","\\_"),I(F,W,"_","\\textunderscore"),I(F,W,"␣","\\textvisiblespace",!0),I(L,W,"∠","\\angle",!0),I(L,W,"∞","\\infty",!0),I(L,W,"′","\\prime"),I(L,W,"″","\\dprime"),I(L,W,"‴","\\trprime"),I(L,W,"⁗","\\qprime"),I(L,W,"△","\\triangle"),I(F,W,"Α","\\Alpha",!0),I(F,W,"Β","\\Beta",!0),I(F,W,"Γ","\\Gamma",!0),I(F,W,"Δ","\\Delta",!0),I(F,W,"Ε","\\Epsilon",!0),I(F,W,"Ζ","\\Zeta",!0),I(F,W,"Η","\\Eta",!0),I(F,W,"Θ","\\Theta",!0),I(F,W,"Ι","\\Iota",!0),I(F,W,"Κ","\\Kappa",!0),I(F,W,"Λ","\\Lambda",!0),I(F,W,"Μ","\\Mu",!0),I(F,W,"Ν","\\Nu",!0),I(F,W,"Ξ","\\Xi",!0),I(F,W,"Ο","\\Omicron",!0),I(F,W,"Π","\\Pi",!0),I(F,W,"Ρ","\\Rho",!0),I(F,W,"Σ","\\Sigma",!0),I(F,W,"Τ","\\Tau",!0),I(F,W,"Υ","\\Upsilon",!0),I(F,W,"Φ","\\Phi",!0),I(F,W,"Χ","\\Chi",!0),I(F,W,"Ψ","\\Psi",!0),I(F,W,"Ω","\\Omega",!0),I(L,R,"Α","\\Alpha",!0),I(L,R,"Β","\\Beta",!0),I(L,R,"Γ","\\Gamma",!0),I(L,R,"Δ","\\Delta",!0),I(L,R,"Ε","\\Epsilon",!0),I(L,R,"Ζ","\\Zeta",!0),I(L,R,"Η","\\Eta",!0),I(L,R,"Θ","\\Theta",!0),I(L,R,"Ι","\\Iota",!0),I(L,R,"Κ","\\Kappa",!0),I(L,R,"Λ","\\Lambda",!0),I(L,R,"Μ","\\Mu",!0),I(L,R,"Ν","\\Nu",!0),I(L,R,"Ξ","\\Xi",!0),I(L,R,"Ο","\\Omicron",!0),I(L,R,"Π","\\Pi",!0),I(L,R,"Ρ","\\Rho",!0),I(L,R,"Σ","\\Sigma",!0),I(L,R,"Τ","\\Tau",!0),I(L,R,"Υ","\\Upsilon",!0),I(L,R,"Φ","\\Phi",!0),I(L,R,"Χ","\\Chi",!0),I(L,R,"Ψ","\\Psi",!0),I(L,R,"Ω","\\Omega",!0),I(L,U,"¬","\\neg",!0),I(L,U,"¬","\\lnot"),I(L,W,"⊤","\\top"),I(L,W,"⊥","\\bot"),I(L,W,"∅","\\emptyset"),I(L,W,"⌀","\\varnothing"),I(L,R,"α","\\alpha",!0),I(L,R,"β","\\beta",!0),I(L,R,"γ","\\gamma",!0),I(L,R,"δ","\\delta",!0),I(L,R,"ϵ","\\epsilon",!0),I(L,R,"ζ","\\zeta",!0),I(L,R,"η","\\eta",!0),I(L,R,"θ","\\theta",!0),I(L,R,"ι","\\iota",!0),I(L,R,"κ","\\kappa",!0),I(L,R,"λ","\\lambda",!0),I(L,R,"μ","\\mu",!0),I(L,R,"ν","\\nu",!0),I(L,R,"ξ","\\xi",!0),I(L,R,"ο","\\omicron",!0),I(L,R,"π","\\pi",!0),I(L,R,"ρ","\\rho",!0),I(L,R,"σ","\\sigma",!0),I(L,R,"τ","\\tau",!0),I(L,R,"υ","\\upsilon",!0),I(L,R,"ϕ","\\phi",!0),I(L,R,"χ","\\chi",!0),I(L,R,"ψ","\\psi",!0),I(L,R,"ω","\\omega",!0),I(L,R,"ε","\\varepsilon",!0),I(L,R,"ϑ","\\vartheta",!0),I(L,R,"ϖ","\\varpi",!0),I(L,R,"ϱ","\\varrho",!0),I(L,R,"ς","\\varsigma",!0),I(L,R,"φ","\\varphi",!0),I(L,R,"Ϙ","\\Coppa",!0),I(L,R,"ϙ","\\coppa",!0),I(L,R,"ϙ","\\varcoppa",!0),I(L,R,"Ϟ","\\Koppa",!0),I(L,R,"ϟ","\\koppa",!0),I(L,R,"Ϡ","\\Sampi",!0),I(L,R,"ϡ","\\sampi",!0),I(L,R,"Ϛ","\\Stigma",!0),I(L,R,"ϛ","\\stigma",!0),I(L,R,"⫫","\\Bot"),I(L,G,"∗","∗",!0),I(L,G,"+","+"),I(L,G,"*","*"),I(L,G,"⁄","⁄"),I(L,G,"−","-",!0),I(L,G,"⋅","\\cdot",!0),I(L,G,"∘","\\circ",!0),I(L,G,"÷","\\div",!0),I(L,G,"±","\\pm",!0),I(L,G,"×","\\times",!0),I(L,G,"∩","\\cap",!0),I(L,G,"∪","\\cup",!0),I(L,G,"∖","\\setminus",!0),I(L,G,"∧","\\land"),I(L,G,"∨","\\lor"),I(L,G,"∧","\\wedge",!0),I(L,G,"∨","\\vee",!0),I(L,U,"⟦","\\llbracket",!0),I(L,D,"⟧","\\rrbracket",!0),I(L,U,"⟨","\\langle",!0),I(L,U,"⟪","\\lAngle",!0),I(L,U,"⦉","\\llangle",!0),I(L,U,"|","\\lvert"),I(L,U,"‖","\\lVert"),I(L,W,"!","\\oc"),I(L,W,"?","\\wn"),I(L,W,"↓","\\shpos"),I(L,W,"↕","\\shift"),I(L,W,"↑","\\shneg"),I(L,D,"?","?"),I(L,D,"!","!"),I(L,D,"‼","‼"),I(L,D,"⟩","\\rangle",!0),I(L,D,"⟫","\\rAngle",!0),I(L,D,"⦊","\\rrangle",!0),I(L,D,"|","\\rvert"),I(L,D,"‖","\\rVert"),I(L,U,"⦃","\\lBrace",!0),I(L,D,"⦄","\\rBrace",!0),I(L,V,"=","\\equal",!0),I(L,V,":",":"),I(L,V,"≈","\\approx",!0),I(L,V,"≅","\\cong",!0),I(L,V,"≥","\\ge"),I(L,V,"≥","\\geq",!0),I(L,V,"←","\\gets"),I(L,V,">","\\gt",!0),I(L,V,"∈","\\in",!0),I(L,V,"∉","\\notin",!0),I(L,V,"","\\@not"),I(L,V,"⊂","\\subset",!0),I(L,V,"⊃","\\supset",!0),I(L,V,"⊆","\\subseteq",!0),I(L,V,"⊇","\\supseteq",!0),I(L,V,"⊈","\\nsubseteq",!0),I(L,V,"⊈","\\nsubseteqq"),I(L,V,"⊉","\\nsupseteq",!0),I(L,V,"⊉","\\nsupseteqq"),I(L,V,"⊨","\\models"),I(L,V,"←","\\leftarrow",!0),I(L,V,"≤","\\le"),I(L,V,"≤","\\leq",!0),I(L,V,"<","\\lt",!0),I(L,V,"→","\\rightarrow",!0),I(L,V,"→","\\to"),I(L,V,"≱","\\ngeq",!0),I(L,V,"≱","\\ngeqq"),I(L,V,"≱","\\ngeqslant"),I(L,V,"≰","\\nleq",!0),I(L,V,"≰","\\nleqq"),I(L,V,"≰","\\nleqslant"),I(L,V,"⫫","\\Perp",!0),I(L,_," ","\\ "),I(L,_," ","\\space"),I(L,_," ","\\nobreakspace"),I(F,_," ","\\ "),I(F,_," "," "),I(F,_," ","\\space"),I(F,_," ","\\nobreakspace"),I(L,_,null,"\\nobreak"),I(L,_,null,"\\allowbreak"),I(L,H,",",","),I(F,H,":",":"),I(L,H,";",";"),I(L,G,"⊼","\\barwedge",!0),I(L,G,"⊻","\\veebar",!0),I(L,G,"⊙","\\odot",!0),I(L,G,"⊕︎","\\oplus"),I(L,G,"⊗","\\otimes",!0),I(L,W,"∂","\\partial",!0),I(L,G,"⊘","\\oslash",!0),I(L,G,"⊚","\\circledcirc",!0),I(L,G,"⊡","\\boxdot",!0),I(L,G,"△","\\bigtriangleup"),I(L,G,"▽","\\bigtriangledown"),I(L,G,"†","\\dagger"),I(L,G,"⋄","\\diamond"),I(L,G,"⋆","\\star"),I(L,G,"◃","\\triangleleft"),I(L,G,"▹","\\triangleright"),I(L,U,"{","\\{"),I(F,W,"{","\\{"),I(F,W,"{","\\textbraceleft"),I(L,D,"}","\\}"),I(F,W,"}","\\}"),I(F,W,"}","\\textbraceright"),I(L,U,"{","\\lbrace"),I(L,D,"}","\\rbrace"),I(L,U,"[","\\lbrack",!0),I(F,W,"[","\\lbrack",!0),I(L,D,"]","\\rbrack",!0),I(F,W,"]","\\rbrack",!0),I(L,U,"(","\\lparen",!0),I(L,D,")","\\rparen",!0),I(L,U,"⦇","\\llparenthesis",!0),I(L,D,"⦈","\\rrparenthesis",!0),I(F,W,"<","\\textless",!0),I(F,W,">","\\textgreater",!0),I(L,U,"⌊","\\lfloor",!0),I(L,D,"⌋","\\rfloor",!0),I(L,U,"⌈","\\lceil",!0),I(L,D,"⌉","\\rceil",!0),I(L,W,"\\","\\backslash"),I(L,W,"|","|"),I(L,W,"|","\\vert"),I(F,W,"|","\\textbar",!0),I(L,W,"‖","\\|"),I(L,W,"‖","\\Vert"),I(F,W,"‖","\\textbardbl"),I(F,W,"~","\\textasciitilde"),I(F,W,"\\","\\textbackslash"),I(F,W,"^","\\textasciicircum"),I(L,V,"↑","\\uparrow",!0),I(L,V,"⇑","\\Uparrow",!0),I(L,V,"↓","\\downarrow",!0),I(L,V,"⇓","\\Downarrow",!0),I(L,V,"↕","\\updownarrow",!0),I(L,V,"⇕","\\Updownarrow",!0),I(L,j,"∐","\\coprod"),I(L,j,"⋁","\\bigvee"),I(L,j,"⋀","\\bigwedge"),I(L,j,"⨄","\\biguplus"),I(L,j,"⋂","\\bigcap"),I(L,j,"⋃","\\bigcup"),I(L,j,"∫","\\int"),I(L,j,"∫","\\intop"),I(L,j,"∬","\\iint"),I(L,j,"∭","\\iiint"),I(L,j,"∏","\\prod"),I(L,j,"∑","\\sum"),I(L,j,"⨂","\\bigotimes"),I(L,j,"⨁","\\bigoplus"),I(L,j,"⨀","\\bigodot"),I(L,j,"⨉","\\bigtimes"),I(L,j,"∮","\\oint"),I(L,j,"∯","\\oiint"),I(L,j,"∰","\\oiiint"),I(L,j,"∱","\\intclockwise"),I(L,j,"∲","\\varointclockwise"),I(L,j,"⨌","\\iiiint"),I(L,j,"⨍","\\intbar"),I(L,j,"⨎","\\intBar"),I(L,j,"⨏","\\fint"),I(L,j,"⨒","\\rppolint"),I(L,j,"⨓","\\scpolint"),I(L,j,"⨕","\\pointint"),I(L,j,"⨖","\\sqint"),I(L,j,"⨗","\\intlarhk"),I(L,j,"⨘","\\intx"),I(L,j,"⨙","\\intcap"),I(L,j,"⨚","\\intcup"),I(L,j,"⨅","\\bigsqcap"),I(L,j,"⨆","\\bigsqcup"),I(L,j,"∫","\\smallint"),I(F,P,"…","\\textellipsis"),I(L,P,"…","\\mathellipsis"),I(F,P,"…","\\ldots",!0),I(L,P,"…","\\ldots",!0),I(L,P,"⋰","\\iddots",!0),I(L,P,"⋯","\\@cdots",!0),I(L,P,"⋱","\\ddots",!0),I(L,W,"⋮","\\varvdots"),I(L,$,"ˊ","\\acute"),I(L,$,"`","\\grave"),I(L,$,"¨","\\ddot"),I(L,$,"…","\\dddot"),I(L,$,"….","\\ddddot"),I(L,$,"~","\\tilde"),I(L,$,"‾","\\bar"),I(L,$,"˘","\\breve"),I(L,$,"ˇ","\\check"),I(L,$,"^","\\hat"),I(L,$,"→","\\vec"),I(L,$,"˙","\\dot"),I(L,$,"˚","\\mathring"),I(L,R,"ı","\\imath",!0),I(L,R,"ȷ","\\jmath",!0),I(L,W,"ı","ı"),I(L,W,"ȷ","ȷ"),I(F,W,"ı","\\i",!0),I(F,W,"ȷ","\\j",!0),I(F,W,"ß","\\ss",!0),I(F,W,"æ","\\ae",!0),I(F,W,"œ","\\oe",!0),I(F,W,"ø","\\o",!0),I(L,R,"ø","\\o",!0),I(F,W,"Æ","\\AE",!0),I(F,W,"Œ","\\OE",!0),I(F,W,"Ø","\\O",!0),I(L,R,"Ø","\\O",!0),I(F,$,"ˊ","\\'"),I(F,$,"ˋ","\\`"),I(F,$,"ˆ","\\^"),I(F,$,"˜","\\~"),I(F,$,"ˉ","\\="),I(F,$,"˘","\\u"),I(F,$,"˙","\\."),I(F,$,"¸","\\c"),I(F,$,"˚","\\r"),I(F,$,"ˇ","\\v"),I(F,$,"¨",'\\"'),I(F,$,"˝","\\H"),I(L,$,"ˊ","\\'"),I(L,$,"ˋ","\\`"),I(L,$,"ˆ","\\^"),I(L,$,"˜","\\~"),I(L,$,"ˉ","\\="),I(L,$,"˘","\\u"),I(L,$,"˙","\\."),I(L,$,"¸","\\c"),I(L,$,"˚","\\r"),I(L,$,"ˇ","\\v"),I(L,$,"¨",'\\"'),I(L,$,"˝","\\H");const X={"--":!0,"---":!0,"``":!0,"''":!0};I(F,W,"–","--",!0),I(F,W,"–","\\textendash"),I(F,W,"—","---",!0),I(F,W,"—","\\textemdash"),I(F,W,"‘","`",!0),I(F,W,"‘","\\textquoteleft"),I(F,W,"’","'",!0),I(F,W,"’","\\textquoteright"),I(F,W,"“","``",!0),I(F,W,"“","\\textquotedblleft"),I(F,W,"”","''",!0),I(F,W,"”","\\textquotedblright"),I(L,W,"°","\\degree",!0),I(F,W,"°","\\degree"),I(F,W,"°","\\textdegree",!0),I(L,W,"£","\\pounds"),I(L,W,"£","\\mathsterling",!0),I(F,W,"£","\\pounds"),I(F,W,"£","\\textsterling",!0),I(L,W,"✠","\\maltese"),I(F,W,"✠","\\maltese"),I(L,W,"€","\\euro",!0),I(F,W,"€","\\euro",!0),I(F,W,"€","\\texteuro"),I(L,W,"©","\\copyright",!0),I(F,W,"©","\\textcopyright"),I(L,W,"⌀","\\diameter",!0),I(F,W,"⌀","\\diameter"),I(L,W,"𝛤","\\varGamma"),I(L,W,"𝛥","\\varDelta"),I(L,W,"𝛩","\\varTheta"),I(L,W,"𝛬","\\varLambda"),I(L,W,"𝛯","\\varXi"),I(L,W,"𝛱","\\varPi"),I(L,W,"𝛴","\\varSigma"),I(L,W,"𝛶","\\varUpsilon"),I(L,W,"𝛷","\\varPhi"),I(L,W,"𝛹","\\varPsi"),I(L,W,"𝛺","\\varOmega"),I(F,W,"𝛤","\\varGamma"),I(F,W,"𝛥","\\varDelta"),I(F,W,"𝛩","\\varTheta"),I(F,W,"𝛬","\\varLambda"),I(F,W,"𝛯","\\varXi"),I(F,W,"𝛱","\\varPi"),I(F,W,"𝛴","\\varSigma"),I(F,W,"𝛶","\\varUpsilon"),I(F,W,"𝛷","\\varPhi"),I(F,W,"𝛹","\\varPsi"),I(F,W,"𝛺","\\varOmega");const Z='0123456789/@."';for(let e=0;e<14;e++){const t=Z.charAt(e);I(L,W,t,t)}const Y='0123456789!@*()-=+";:?/.,';for(let e=0;e<25;e++){const t=Y.charAt(e);I(F,W,t,t)}const K="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";for(let e=0;e<52;e++){const t=K.charAt(e);I(L,R,t,t),I(F,W,t,t)}const J="ÇÐÞçþℂℍℕℙℚℝℤℎℏℊℋℌℐℑℒℓ℘ℛℜℬℰℱℳℭℨ";for(let e=0;e<30;e++){const t=J.charAt(e);I(L,R,t,t),I(F,W,t,t)}let Q="";for(let e=0;e<52;e++){Q=String.fromCharCode(55349,56320+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,56372+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,56424+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,56580+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,56736+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,56788+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,56840+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,56944+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,56632+e),I(L,R,Q,Q),I(F,W,Q,Q);const t=K.charAt(e);Q=String.fromCharCode(55349,56476+e),I(L,R,t,Q),I(F,W,t,Q)}for(let e=0;e<10;e++)Q=String.fromCharCode(55349,57294+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,57314+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,57324+e),I(L,R,Q,Q),I(F,W,Q,Q),Q=String.fromCharCode(55349,57334+e),I(L,R,Q,Q),I(F,W,Q,Q);const ee="([{⌊⌈⟨⟮⎰⟦⦃",te=")]}⌋⌉⟩⟯⎱⟦⦄";const re=function(e,t,r){return!E[t][e]||!E[t][e].replace||55349===e.charCodeAt(0)||Object.prototype.hasOwnProperty.call(X,e)&&r&&(r.fontFamily&&"tt"===r.fontFamily.slice(4,6)||r.font&&"tt"===r.font.slice(4,6))||(e=E[t][e].replace),new N.TextNode(e)},ne=e=>{if("mrow"!==e.type&&"mstyle"!==e.type)return e;if(0===e.children.length)return e;if(!e.children[0].attributes||"mtext"!==e.children[0].type)return e;const t=e.children[0].attributes.mathvariant||"",r=new N.MathNode("mtext",[new N.TextNode(e.children[0].children[0].text)]);for(let n=1;n<e.children.length;n++){const s=e.children[n].attributes.mathvariant||"";if("mrow"===e.children[n].type){const s=e.children[n];for(let n=0;n<s.children.length;n++){if((s.children[n].attributes.mathvariant||"")!==t||"mtext"!==s.children[n].type)return e;r.children[0].text+=s.children[n].children[0].text}}else{if(s!==t||"mtext"!==e.children[n].type)return e;r.children[0].text+=e.children[n].children[0].text}}" "===r.children[0].text.charAt(0)&&(r.children[0].text=" "+r.children[0].text.slice(1));const n=r.children[0].text.length;n>0&&" "===r.children[0].text.charAt(n-1)&&(r.children[0].text=r.children[0].text.slice(0,-1)+" ");for(const[t,n]of Object.entries(e.attributes))r.attributes[t]=n;return r},se=/^[0-9]$/,oe=function(e,t=!1){if(!(1!==e.length||e[0]instanceof d))return e[0];if(!t){e[0]instanceof k&&"mo"===e[0].type&&!e[0].attributes.fence&&(e[0].attributes.lspace="0em",e[0].attributes.rspace="0em");const t=e.length-1;e[t]instanceof k&&"mo"===e[t].type&&!e[t].attributes.fence&&(e[t].attributes.lspace="0em",e[t].attributes.rspace="0em")}return new N.MathNode("mrow",e)},ae=e=>"atom"===e.type&&"rel"===e.family||"mclass"===e.type&&"mrel"===e.mclass,ie=function(e,t,r=!1){if(!r&&1===e.length){const r=ce(e[0],t);return r instanceof k&&"mo"===r.type&&(r.setAttribute("lspace","0em"),r.setAttribute("rspace","0em")),[r]}(e=>{if(e.length<2)return;const t=[];let r=!1;for(let n=0;n<e.length;n++){const s=e[n];"textord"===s.type&&se.test(s.text)?(r||t.push({start:n}),r=!0):(r&&(t[t.length-1].end=n-1),r=!1)}r&&(t[t.length-1].end=e.length-1);for(let r=t.length-1;r>0;r--)t[r-1].end===t[r].start-2&&("atom"===(n=e[t[r].start-1]).type&&","===n.text||"textord"===n.type&&"."===n.text)&&(t[r-1].end=t[r].end,t.splice(r,1));var n;for(let r=t.length-1;r>=0;r--){for(let n=t[r].start+1;n<=t[r].end;n++)e[t[r].start].text+=e[n].text;if(e.splice(t[r].start+1,t[r].end-t[r].start),e.length>t[r].start+1){const n=e[t[r].start+1];"supsub"===n.type&&n.base&&"textord"===n.base.type&&se.test(n.base.text)&&(n.base.text=e[t[r].start].text+n.base.text,e.splice(t[r].start,1))}}})(e);const n=[];for(let r=0;r<e.length;r++){const s=ce(e[r],t);r<e.length-1&&ae(e[r])&&ae(e[r+1])&&s.setAttribute("rspace","0em"),r>0&&ae(e[r])&&ae(e[r-1])&&s.setAttribute("lspace","0em"),n.push(s)}return n},le=function(e,t,r=!1){return oe(ie(e,t,r),r)},ce=function(t,r){if(!t)return new N.MathNode("mrow");if(l[t.type]){return l[t.type](t,r)}throw new e("Got group of unknown type: '"+t.type+"'")},me=e=>new N.MathNode("mtd",[],[],{padding:"0",width:"50%"});function ue(e,t,r,n){let s=null;1===e.length&&"tag"===e[0].type&&(s=e[0].tag,e=e[0].body);const o=ie(e,r),a=n.displayMode||n.annotate?"none":n.wrap,i=0===o.length?null:o[0];let l=1===o.length&&null===s&&i instanceof k?o[0]:function(e,t,r){const n=[];let s=[],o=[],a=0,i=0,l=0;for(;i<e.length;){for(;e[i]instanceof d;)e.splice(i,1,...e[i].children);const r=e[i];if(r.attributes&&r.attributes.linebreak&&"newline"===r.attributes.linebreak){o.length>0&&s.push(new N.MathNode("mrow",o)),s.push(r),o=[];const e=new N.MathNode("mtd",s);e.style.textAlign="left",n.push(new N.MathNode("mtr",[e])),s=[],i+=1}else{if(o.push(r),r.type&&"mo"===r.type&&1===r.children.length){const n=r.children[0].text;if(ee.indexOf(n)>-1)l+=1;else if(te.indexOf(n)>-1)l-=1;else if(0===l&&"="===t&&"="===n){if(a+=1,a>1){o.pop();const e=new N.MathNode("mrow",o);s.push(e),o=[r]}}else if(0===l&&"tex"===t){const t=i<e.length-1?e[i+1]:null;let r=!0;if(!t||"mtext"!==t.type||!t.attributes.linebreak||"nobreak"!==t.attributes.linebreak)for(let t=i+1;t<e.length;t++){const n=e[t];if(!n.type||"mspace"!==n.type||n.attributes.linebreak&&"newline"===n.attributes.linebreak)break;o.push(n),i+=1,n.attributes&&n.attributes.linebreak&&"nobreak"===n.attributes.linebreak&&(r=!1)}if(r){const e=new N.MathNode("mrow",o);s.push(e),o=[]}}}i+=1}}if(o.length>0){const e=new N.MathNode("mrow",o);s.push(e)}if(n.length>0){const e=new N.MathNode("mtd",s);e.style.textAlign="left";const t=new N.MathNode("mtr",[e]);n.push(t);const o=new N.MathNode("mtable",n);return r||(o.setAttribute("columnalign","left"),o.setAttribute("rowspacing","0em")),o}return N.newDocumentFragment(s)}(o,a,n.displayMode);if(s&&(l=((e,t,r,n)=>{t=le(t[0].body,r),(t=ne(t)).classes.push("tml-tag"),e=new N.MathNode("mtd",[e]);const s=[me(),e,me()];s[n?0:2].classes.push(n?"tml-left":"tml-right"),s[n?0:2].children.push(t);const o=new N.MathNode("mtr",s,["tml-tageqn"]),a=new N.MathNode("mtable",[o]);return a.style.width="100%",a.setAttribute("displaystyle","true"),a})(l,s,r,n.leqno)),n.annotate){const e=new N.MathNode("annotation",[new N.TextNode(t)]);e.setAttribute("encoding","application/x-tex"),l=new N.MathNode("semantics",[l,e])}const c=new N.MathNode("math",[l]);return n.xml&&c.setAttribute("xmlns","http://www.w3.org/1998/Math/MathML"),n.displayMode&&(c.setAttribute("display","block"),c.style.display="block math",c.classes=["tml-display"]),c}const pe="ABCDEFGHIJKLMNOPQRSTUVWXYZbdfhkltΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩβδλζφθψ𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐛𝐝𝐟𝐡𝐤𝐥𝐭",de=new Set(["\\alpha","\\gamma","\\delta","\\epsilon","\\eta","\\iota","\\kappa","\\mu","\\nu","\\pi","\\rho","\\sigma","\\tau","\\upsilon","\\chi","\\psi","\\omega","\\imath","\\jmath"]),he=new Set(["\\Gamma","\\Delta","\\Sigma","\\Omega","\\beta","\\delta","\\lambda","\\theta","\\psi"]),ge=(e,t)=>{const r=e.isStretchy?M(e):new N.MathNode("mo",[re(e.label,e.mode)]);if("\\vec"===e.label)r.style.transform="scale(0.75) translate(10%, 30%)";else if(r.style.mathStyle="normal",r.style.mathDepth="0",be.has(e.label)&&o.isCharacterBox(e.base)){let t="";const n=e.base.text;("acegıȷmnopqrsuvwxyzαγεηικμνοπρςστυχωϕ𝐚𝐜𝐞𝐠𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐮𝐯𝐰𝐱𝐲𝐳".indexOf(n)>-1||de.has(n))&&(t="tml-xshift"),(pe.indexOf(n)>-1||he.has(n))&&(t="tml-capshift"),t&&r.classes.push(t)}e.isStretchy||r.setAttribute("stretchy","false");return new N.MathNode("\\c"===e.label?"munder":"mover",[ce(e.base,t),r])},fe=new Set(["\\acute","\\grave","\\ddot","\\dddot","\\ddddot","\\tilde","\\bar","\\breve","\\check","\\hat","\\vec","\\dot","\\mathring"]),be=new Set(["\\acute","\\bar","\\breve","\\check","\\dot","\\ddot","\\grave","\\hat","\\mathring","\\'","\\^","\\~","\\=","\\u","\\.",'\\"',"\\r","\\H","\\v"]);c({type:"accent",names:["\\acute","\\grave","\\ddot","\\dddot","\\ddddot","\\tilde","\\bar","\\breve","\\check","\\hat","\\vec","\\dot","\\mathring","\\overparen","\\widecheck","\\widehat","\\wideparen","\\widetilde","\\overrightarrow","\\overleftarrow","\\Overrightarrow","\\overleftrightarrow","\\overgroup","\\overleftharpoon","\\overrightharpoon"],props:{numArgs:1},handler:(e,t)=>{const r=u(t[0]),n=!fe.has(e.funcName);return{type:"accent",mode:e.parser.mode,label:e.funcName,isStretchy:n,base:r}},mathmlBuilder:ge}),c({type:"accent",names:["\\'","\\`","\\^","\\~","\\=","\\c","\\u","\\.",'\\"',"\\r","\\H","\\v"],props:{numArgs:1,allowedInText:!0,allowedInMath:!0,argTypes:["primitive"]},handler:(e,t)=>{const r=u(t[0]),n=e.parser.mode;return"math"===n&&e.parser.settings.strict&&console.log(`Temml parse error: Command ${e.funcName} is invalid in math mode.`),{type:"accent",mode:n,label:e.funcName,isStretchy:!1,base:r}},mathmlBuilder:ge}),c({type:"accentUnder",names:["\\underleftarrow","\\underrightarrow","\\underleftrightarrow","\\undergroup","\\underparen","\\utilde"],props:{numArgs:1},handler:({parser:e,funcName:t},r)=>{const n=r[0];return{type:"accentUnder",mode:e.mode,label:t,base:n}},mathmlBuilder:(e,t)=>{const r=M(e);r.style["math-depth"]=0;return new N.MathNode("munder",[ce(e.base,t),r])}});const ye={pt:800/803,pc:9600/803,dd:1238/1157*800/803,cc:12.792133216944668,nd:685/642*800/803,nc:1370/107*800/803,sp:1/65536*800/803,mm:25.4/72,cm:2.54/72,in:1/72,px:96/72},xe=["em","ex","mu","pt","mm","cm","in","px","bp","pc","dd","cc","nd","nc","sp"],we=function(e){return"string"!=typeof e&&(e=e.unit),xe.indexOf(e)>-1},ke=e=>[1,.7,.5][Math.max(e-1,0)],ve=function(t,r){let n=t.number;if(r.maxSize[0]<0&&n>0)return{number:0,unit:"em"};const s=t.unit;switch(s){case"mm":case"cm":case"in":case"px":return n*ye[s]>r.maxSize[1]?{number:r.maxSize[1],unit:"pt"}:{number:n,unit:s};case"em":case"ex":return"ex"===s&&(n*=.431),n=Math.min(n/ke(r.level),r.maxSize[0]),{number:o.round(n),unit:"em"};case"bp":return n>r.maxSize[1]&&(n=r.maxSize[1]),{number:n,unit:"pt"};case"pt":case"pc":case"dd":case"cc":case"nd":case"nc":case"sp":return n=Math.min(n*ye[s],r.maxSize[1]),{number:o.round(n),unit:"pt"};case"mu":return n=Math.min(n/18,r.maxSize[0]),{number:o.round(n),unit:"em"};default:throw new e("Invalid unit: '"+s+"'")}},Ae=e=>{const t=new N.MathNode("mspace");return t.setAttribute("width",e+"em"),t},Ne=(e,t=.3,r=0)=>{if(null==e&&0===r)return Ae(t);const n=e?[e]:[];return 0!==t&&n.unshift(Ae(t)),r>0&&n.push(Ae(r)),new N.MathNode("mrow",n)},Te=(e,t)=>Number(e)/ke(t),qe=(e,t,r,n)=>{const s=B(e),o="eq"===e.slice(1,3),a="x"===e.charAt(1)?"1.75":"cd"===e.slice(2,4)?"3.0":o?"1.0":"2.0";s.setAttribute("lspace","0"),s.setAttribute("rspace",o?"0.5em":"0");const i=n.withLevel(n.level<2?2:3),l=Te(a,i.level),c=Te(a,3),m=Ne(null,l.toFixed(4),0),u=Ne(null,c.toFixed(4),0),p=Te(o?0:.3,i.level).toFixed(4);let d,h;const g=t&&t.body&&(t.body.body||t.body.length>0);if(g){let e=ce(t,i);e=Ne(e,p,p),d=new N.MathNode("mover",[e,u])}const f=r&&r.body&&(r.body.body||r.body.length>0);if(f){let e=ce(r,i);e=Ne(e,p,p),h=new N.MathNode("munder",[e,u])}let b;return b=g||f?g&&f?new N.MathNode("munderover",[s,h,d]):g?new N.MathNode("mover",[s,d]):new N.MathNode("munder",[s,h]):new N.MathNode("mover",[s,m]),"3.0"===a&&(b.style.height="1em"),b.setAttribute("accent","false"),b};c({type:"xArrow",names:["\\xleftarrow","\\xrightarrow","\\xLeftarrow","\\xRightarrow","\\xleftrightarrow","\\xLeftrightarrow","\\xhookleftarrow","\\xhookrightarrow","\\xmapsto","\\xrightharpoondown","\\xrightharpoonup","\\xleftharpoondown","\\xleftharpoonup","\\xlongequal","\\xtwoheadrightarrow","\\xtwoheadleftarrow","\\yields","\\yieldsLeft","\\mesomerism","\\longrightharpoonup","\\longleftharpoondown","\\\\cdrightarrow","\\\\cdleftarrow","\\\\cdlongequal"],props:{numArgs:1,numOptionalArgs:1},handler:({parser:e,funcName:t},r,n)=>({type:"xArrow",mode:e.mode,name:t,body:r[0],below:n[0]}),mathmlBuilder(e,t){const r=[qe(e.name,e.body,e.below,t)];return r.unshift(Ae(.2778)),r.push(Ae(.2778)),new N.MathNode("mrow",r)}});const Se={"\\xtofrom":["\\xrightarrow","\\xleftarrow"],"\\xleftrightharpoons":["\\xleftharpoonup","\\xrightharpoondown"],"\\xrightleftharpoons":["\\xrightharpoonup","\\xleftharpoondown"],"\\yieldsLeftRight":["\\yields","\\yieldsLeft"],"\\equilibrium":["\\longrightharpoonup","\\longleftharpoondown"],"\\equilibriumRight":["\\longrightharpoonup","\\eqleftharpoondown"],"\\equilibriumLeft":["\\eqrightharpoonup","\\longleftharpoondown"]};function Oe(e,t){if(!e||e.type!==t)throw new Error(`Expected node of type ${t}, but got `+(e?`node of type ${e.type}`:String(e)));return e}function Be(e){const t=Me(e);if(!t)throw new Error("Expected node of symbol group type, but got "+(e?`node of type ${e.type}`:String(e)));return t}function Me(e){return e&&("atom"===e.type||Object.prototype.hasOwnProperty.call(z,e.type))?e:null}c({type:"stackedArrow",names:["\\xtofrom","\\xleftrightharpoons","\\xrightleftharpoons","\\yieldsLeftRight","\\equilibrium","\\equilibriumRight","\\equilibriumLeft"],props:{numArgs:1,numOptionalArgs:1},handler({parser:e,funcName:t},r,n){const s=r[0]?{type:"hphantom",mode:e.mode,body:r[0]}:null,o=n[0]?{type:"hphantom",mode:e.mode,body:n[0]}:null;return{type:"stackedArrow",mode:e.mode,name:t,body:r[0],upperArrowBelow:o,lowerArrowBody:s,below:n[0]}},mathmlBuilder(e,t){const r=Se[e.name][0],n=Se[e.name][1],s=qe(r,e.body,e.upperArrowBelow,t),o=qe(n,e.lowerArrowBody,e.below,t);let a;const i=new N.MathNode("mpadded",[s]);if(i.setAttribute("voffset","0.3em"),i.setAttribute("height","+0.3em"),i.setAttribute("depth","-0.3em"),"\\equilibriumLeft"===e.name){const e=new N.MathNode("mpadded",[o]);e.setAttribute("width","0.5em"),a=new N.MathNode("mpadded",[Ae(.2778),e,i,Ae(.2778)])}else i.setAttribute("width","\\equilibriumRight"===e.name?"0.5em":"0"),a=new N.MathNode("mpadded",[Ae(.2778),i,o,Ae(.2778)]);return a.setAttribute("voffset","-0.18em"),a.setAttribute("height","-0.18em"),a.setAttribute("depth","+0.18em"),a}});const Ce={">":"\\\\cdrightarrow","<":"\\\\cdleftarrow","=":"\\\\cdlongequal",A:"\\uparrow",V:"\\downarrow","|":"\\Vert",".":"no arrow"},ze=e=>"textord"===e.type&&"@"===e.text;function Ee(e,t,r){const n=Ce[e];switch(n){case"\\\\cdrightarrow":case"\\\\cdleftarrow":return r.callFunction(n,[t[0]],[t[1]]);case"\\uparrow":case"\\downarrow":{const e={type:"atom",text:n,mode:"math",family:"rel"},s={type:"ordgroup",mode:"math",body:[r.callFunction("\\\\cdleft",[t[0]],[]),r.callFunction("\\Big",[e],[]),r.callFunction("\\\\cdright",[t[1]],[])],semisimple:!0};return r.callFunction("\\\\cdparent",[s],[])}case"\\\\cdlongequal":return r.callFunction("\\\\cdlongequal",[],[]);case"\\Vert":{const e={type:"textord",text:"\\Vert",mode:"math"};return r.callFunction("\\Big",[e],[])}default:return{type:"textord",text:" ",mode:"math"}}}c({type:"cdlabel",names:["\\\\cdleft","\\\\cdright"],props:{numArgs:1},handler:({parser:e,funcName:t},r)=>({type:"cdlabel",mode:e.mode,side:t.slice(4),label:r[0]}),mathmlBuilder(e,t){let r=new N.MathNode("mrow",[ce(e.label,t)]);return r=new N.MathNode("mpadded",[r]),r.setAttribute("width","0"),"left"===e.side&&r.setAttribute("lspace","-1width"),r.setAttribute("voffset","0.7em"),r=new N.MathNode("mstyle",[r]),r.setAttribute("displaystyle","false"),r.setAttribute("scriptlevel","1"),r}}),c({type:"cdlabelparent",names:["\\\\cdparent"],props:{numArgs:1},handler:({parser:e},t)=>({type:"cdlabelparent",mode:e.mode,fragment:t[0]}),mathmlBuilder:(e,t)=>new N.MathNode("mrow",[ce(e.fragment,t)])}),c({type:"textord",names:["\\@char"],props:{numArgs:1,allowedInText:!0},handler({parser:t,token:r},n){const s=Oe(n[0],"ordgroup").body;let o="";for(let e=0;e<s.length;e++){o+=Oe(s[e],"textord").text}const a=parseInt(o);if(isNaN(a))throw new e(`\\@char has non-numeric argument ${o}`,r);return{type:"textord",mode:t.mode,text:String.fromCodePoint(a)}}});const Ie=/^(#[a-f0-9]{3}|#?[a-f0-9]{6})$/i,Le=/^(#[a-f0-9]{3}|#?[a-f0-9]{6}|[a-z]+)$/i,Fe=/^ *\d{1,3} *(?:, *\d{1,3} *){2}$/,$e=/^ *[10](?:\.\d*)? *(?:, *[10](?:\.\d*)? *){2}$/,Ge=/^[a-f0-9]{6}$/i,De=e=>{let t=e.toString(16);return 1===t.length&&(t="0"+t),t},Pe=JSON.parse('{\n  "Apricot": "#ffb484",\n  "Aquamarine": "#08b4bc",\n  "Bittersweet": "#c84c14",\n  "blue": "#0000FF",\n  "Blue": "#303494",\n  "BlueGreen": "#08b4bc",\n  "BlueViolet": "#503c94",\n  "BrickRed": "#b8341c",\n  "brown": "#BF8040",\n  "Brown": "#802404",\n  "BurntOrange": "#f8941c",\n  "CadetBlue": "#78749c",\n  "CarnationPink": "#f884b4",\n  "Cerulean": "#08a4e4",\n  "CornflowerBlue": "#40ace4",\n  "cyan": "#00FFFF",\n  "Cyan": "#08acec",\n  "Dandelion": "#ffbc44",\n  "darkgray": "#404040",\n  "DarkOrchid": "#a8548c",\n  "Emerald": "#08ac9c",\n  "ForestGreen": "#089c54",\n  "Fuchsia": "#90348c",\n  "Goldenrod": "#ffdc44",\n  "gray": "#808080",\n  "Gray": "#98949c",\n  "green": "#00FF00",\n  "Green": "#08a44c",\n  "GreenYellow": "#e0e474",\n  "JungleGreen": "#08ac9c",\n  "Lavender": "#f89cc4",\n  "lightgray": "#c0c0c0",\n  "lime": "#BFFF00",\n  "LimeGreen": "#90c43c",\n  "magenta": "#FF00FF",\n  "Magenta": "#f0048c",\n  "Mahogany": "#b0341c",\n  "Maroon": "#b03434",\n  "Melon": "#f89c7c",\n  "MidnightBlue": "#086494",\n  "Mulberry": "#b03c94",\n  "NavyBlue": "#086cbc",\n  "olive": "#7F7F00",\n  "OliveGreen": "#407c34",\n  "orange": "#FF8000",\n  "Orange": "#f8843c",\n  "OrangeRed": "#f0145c",\n  "Orchid": "#b074ac",\n  "Peach": "#f8945c",\n  "Periwinkle": "#8074bc",\n  "PineGreen": "#088c74",\n  "pink": "#ff7f7f",\n  "Plum": "#98248c",\n  "ProcessBlue": "#08b4ec",\n  "purple": "#BF0040",\n  "Purple": "#a0449c",\n  "RawSienna": "#983c04",\n  "red": "#ff0000",\n  "Red": "#f01c24",\n  "RedOrange": "#f86434",\n  "RedViolet": "#a0246c",\n  "Rhodamine": "#f0549c",\n  "Royallue": "#0874bc",\n  "RoyalPurple": "#683c9c",\n  "RubineRed": "#f0047c",\n  "Salmon": "#f8948c",\n  "SeaGreen": "#30bc9c",\n  "Sepia": "#701404",\n  "SkyBlue": "#48c4dc",\n  "SpringGreen": "#c8dc64",\n  "Tan": "#e09c74",\n  "teal": "#007F7F",\n  "TealBlue": "#08acb4",\n  "Thistle": "#d884b4",\n  "Turquoise": "#08b4cc",\n  "violet": "#800080",\n  "Violet": "#60449c",\n  "VioletRed": "#f054a4",\n  "WildStrawberry": "#f0246c",\n  "yellow": "#FFFF00",\n  "Yellow": "#fff404",\n  "YellowGreen": "#98cc6c",\n  "YellowOrange": "#ffa41c"\n}'),Re=(t,r)=>{let n="";if("HTML"===t){if(!Ie.test(r))throw new e("Invalid HTML input.");n=r}else if("RGB"===t){if(!Fe.test(r))throw new e("Invalid RGB input.");r.split(",").map((e=>{n+=De(Number(e.trim()))}))}else{if(!$e.test(r))throw new e("Invalid rbg input.");r.split(",").map((t=>{const r=Number(t.trim());if(r>1)throw new e("Color rgb input must be < 1.");n+=De(Number((255*r).toFixed(0)))}))}return"#"!==n.charAt(0)&&(n="#"+n),n},je=(t,r,n)=>{const s=`\\\\color@${t}`;if(!Le.exec(t))throw new e("Invalid color: '"+t+"'",n);return Ge.test(t)?"#"+t:("#"===t.charAt(0)||(r.has(s)?t=r.get(s).tokens[0].text:Pe[t]&&(t=Pe[t])),t)},Ue=(e,t)=>{let r=ie(e.body,t.withColor(e.color));return r=r.map((t=>(t.style.color=e.color,t))),N.newDocumentFragment(r)};c({type:"color",names:["\\textcolor"],props:{numArgs:2,numOptionalArgs:1,allowedInText:!0,argTypes:["raw","raw","original"]},handler({parser:e,token:t},r,n){const s=n[0]&&Oe(n[0],"raw").string;let o="";if(s){const e=Oe(r[0],"raw").string;o=Re(s,e)}else o=je(Oe(r[0],"raw").string,e.gullet.macros,t);const a=r[1];return{type:"color",mode:e.mode,color:o,body:p(a)}},mathmlBuilder:Ue}),c({type:"color",names:["\\color"],props:{numArgs:1,numOptionalArgs:1,allowedInText:!0,argTypes:["raw","raw"]},handler({parser:e,breakOnTokenText:t,token:r},n,s){const o=s[0]&&Oe(s[0],"raw").string;let a="";if(o){const e=Oe(n[0],"raw").string;a=Re(o,e)}else a=je(Oe(n[0],"raw").string,e.gullet.macros,r);const i=e.parseExpression(!0,t);return{type:"color",mode:e.mode,color:a,body:i}},mathmlBuilder:Ue}),c({type:"color",names:["\\definecolor"],props:{numArgs:3,allowedInText:!0,argTypes:["raw","raw","raw"]},handler({parser:t,funcName:r,token:n},s){const o=Oe(s[0],"raw").string;if(!/^[A-Za-z]+$/.test(o))throw new e("Color name must be latin letters.",n);const a=Oe(s[1],"raw").string;if(!["HTML","RGB","rgb"].includes(a))throw new e("Color model must be HTML, RGB, or rgb.",n);const i=Oe(s[2],"raw").string,l=Re(a,i);return t.gullet.macros.set(`\\\\color@${o}`,{tokens:[{text:l}],numArgs:0}),{type:"internal",mode:t.mode}}}),c({type:"cr",names:["\\\\"],props:{numArgs:0,numOptionalArgs:0,allowedInText:!0},handler({parser:e},t,r){const n="["===e.gullet.future().text?e.parseSizeGroup(!0):null,s=!e.settings.displayMode;return{type:"cr",mode:e.mode,newLine:s,size:n&&Oe(n,"size").value}},mathmlBuilder(e,t){const r=new N.MathNode("mo");if(e.newLine&&(r.setAttribute("linebreak","newline"),e.size)){const n=ve(e.size,t);r.setAttribute("height",n.number+n.unit)}return r}});const He={"\\global":"\\global","\\long":"\\\\globallong","\\\\globallong":"\\\\globallong","\\def":"\\gdef","\\gdef":"\\gdef","\\edef":"\\xdef","\\xdef":"\\xdef","\\let":"\\\\globallet","\\futurelet":"\\\\globalfuture"},Ve=t=>{const r=t.text;if(/^(?:[\\{}$&#^_]|EOF)$/.test(r))throw new e("Expected a control sequence",t);return r},_e=(e,t,r,n)=>{let s=e.gullet.macros.get(r.text);null==s&&(r.noexpand=!0,s={tokens:[r],numArgs:0,unexpandable:!e.gullet.isExpandable(r.text)}),e.gullet.macros.set(t,s,n)};c({type:"internal",names:["\\global","\\long","\\\\globallong"],props:{numArgs:0,allowedInText:!0},handler({parser:t,funcName:r}){t.consumeSpaces();const n=t.fetch();if(He[n.text])return"\\global"!==r&&"\\\\globallong"!==r||(n.text=He[n.text]),Oe(t.parseFunction(),"internal");throw new e("Invalid token after macro prefix",n)}}),c({type:"internal",names:["\\def","\\gdef","\\edef","\\xdef"],props:{numArgs:0,allowedInText:!0,primitive:!0},handler({parser:t,funcName:r}){let n=t.gullet.popToken();const s=n.text;if(/^(?:[\\{}$&#^_]|EOF)$/.test(s))throw new e("Expected a control sequence",n);let o,a=0;const i=[[]];for(;"{"!==t.gullet.future().text;)if(n=t.gullet.popToken(),"#"===n.text){if("{"===t.gullet.future().text){o=t.gullet.future(),i[a].push("{");break}if(n=t.gullet.popToken(),!/^[1-9]$/.test(n.text))throw new e(`Invalid argument number "${n.text}"`);if(parseInt(n.text)!==a+1)throw new e(`Argument number "${n.text}" out of order`);a++,i.push([])}else{if("EOF"===n.text)throw new e("Expected a macro definition");i[a].push(n.text)}let{tokens:l}=t.gullet.consumeArg();return o&&l.unshift(o),"\\edef"!==r&&"\\xdef"!==r||(l=t.gullet.expandTokens(l),l.reverse()),t.gullet.macros.set(s,{tokens:l,numArgs:a,delimiters:i},r===He[r]),{type:"internal",mode:t.mode}}}),c({type:"internal",names:["\\let","\\\\globallet"],props:{numArgs:0,allowedInText:!0,primitive:!0},handler({parser:e,funcName:t}){const r=Ve(e.gullet.popToken());e.gullet.consumeSpaces();const n=(e=>{let t=e.gullet.popToken();return"="===t.text&&(t=e.gullet.popToken()," "===t.text&&(t=e.gullet.popToken())),t})(e);return _e(e,r,n,"\\\\globallet"===t),{type:"internal",mode:e.mode}}}),c({type:"internal",names:["\\futurelet","\\\\globalfuture"],props:{numArgs:0,allowedInText:!0,primitive:!0},handler({parser:e,funcName:t}){const r=Ve(e.gullet.popToken()),n=e.gullet.popToken(),s=e.gullet.popToken();return _e(e,r,s,"\\\\globalfuture"===t),e.gullet.pushToken(s),e.gullet.pushToken(n),{type:"internal",mode:e.mode}}}),c({type:"internal",names:["\\newcommand","\\renewcommand","\\providecommand"],props:{numArgs:0,allowedInText:!0,primitive:!0},handler({parser:t,funcName:r}){let n="";const s=t.gullet.popToken();"{"===s.text?(n=Ve(t.gullet.popToken()),t.gullet.popToken()):n=Ve(s);const o=t.gullet.isDefined(n);if(o&&"\\newcommand"===r)throw new e(`\\newcommand{${n}} attempting to redefine ${n}; use \\renewcommand`);if(!o&&"\\renewcommand"===r)throw new e(`\\renewcommand{${n}} when command ${n} does not yet exist; use \\newcommand`);let a=0;if("["===t.gullet.future().text){let r=t.gullet.popToken();if(r=t.gullet.popToken(),!/^[0-9]$/.test(r.text))throw new e(`Invalid number of arguments: "${r.text}"`);if(a=parseInt(r.text),r=t.gullet.popToken(),"]"!==r.text)throw new e(`Invalid argument "${r.text}"`)}const{tokens:i}=t.gullet.consumeArg();return t.gullet.macros.set(n,{tokens:i,numArgs:a},!t.settings.strict),{type:"internal",mode:t.mode}}});const We={"\\bigl":{mclass:"mopen",size:1},"\\Bigl":{mclass:"mopen",size:2},"\\biggl":{mclass:"mopen",size:3},"\\Biggl":{mclass:"mopen",size:4},"\\bigr":{mclass:"mclose",size:1},"\\Bigr":{mclass:"mclose",size:2},"\\biggr":{mclass:"mclose",size:3},"\\Biggr":{mclass:"mclose",size:4},"\\bigm":{mclass:"mrel",size:1},"\\Bigm":{mclass:"mrel",size:2},"\\biggm":{mclass:"mrel",size:3},"\\Biggm":{mclass:"mrel",size:4},"\\big":{mclass:"mord",size:1},"\\Big":{mclass:"mord",size:2},"\\bigg":{mclass:"mord",size:3},"\\Bigg":{mclass:"mord",size:4}},Xe=["(","\\lparen",")","\\rparen","[","\\lbrack","]","\\rbrack","\\{","\\lbrace","\\}","\\rbrace","⦇","\\llparenthesis","⦈","\\rrparenthesis","\\lfloor","\\rfloor","⌊","⌋","\\lceil","\\rceil","⌈","⌉","<",">","\\langle","⟨","\\rangle","⟩","\\lAngle","⟪","\\rAngle","⟫","\\llangle","⦉","\\rrangle","⦊","\\lt","\\gt","\\lvert","\\rvert","\\lVert","\\rVert","\\lgroup","\\rgroup","⟮","⟯","\\lmoustache","\\rmoustache","⎰","⎱","\\llbracket","\\rrbracket","⟦","⟦","\\lBrace","\\rBrace","⦃","⦄","/","\\backslash","|","\\vert","\\|","\\Vert","\\uparrow","\\Uparrow","\\downarrow","\\Downarrow","\\updownarrow","\\Updownarrow","."],Ze=["}","\\left","\\middle","\\right"],Ye=e=>e.length>0&&(Xe.includes(e)||We[e]||Ze.includes(e)),Ke=[0,1.2,1.8,2.4,3];function Je(t,r){"ordgroup"===t.type&&1===t.body.length&&"⁄"===t.body[0].text&&(t={type:"textord",text:"/",mode:"math"});const n=Me(t);if(n&&Xe.includes(n.text))return["<","\\lt"].includes(n.text)&&(n.text="⟨"),[">","\\gt"].includes(n.text)&&(n.text="⟩"),"/"===n.text&&(n.text="∕"),"\\backslash"===n.text&&(n.text="∖"),n;throw new e(n?`Invalid delimiter '${n.text}' after '${r.funcName}'`:`Invalid delimiter type '${t.type}'`,t)}c({type:"delimsizing",names:["\\bigl","\\Bigl","\\biggl","\\Biggl","\\bigr","\\Bigr","\\biggr","\\Biggr","\\bigm","\\Bigm","\\biggm","\\Biggm","\\big","\\Big","\\bigg","\\Bigg"],props:{numArgs:1,argTypes:["primitive"]},handler:(e,t)=>{const r=Je(t[0],e);return{type:"delimsizing",mode:e.parser.mode,size:We[e.funcName].size,mclass:We[e.funcName].mclass,delim:r.text}},mathmlBuilder:e=>{const t=[];"."===e.delim&&(e.delim=""),t.push(re(e.delim,e.mode));const r=new N.MathNode("mo",t);return"mopen"===e.mclass||"mclose"===e.mclass?r.setAttribute("fence","true"):r.setAttribute("fence","false"),("∖"===e.delim||"\\vert"===e.delim||"|"===e.delim||e.delim.indexOf("arrow")>-1)&&r.setAttribute("stretchy","true"),r.setAttribute("symmetric","true"),r.setAttribute("minsize",Ke[e.size]+"em"),r.setAttribute("maxsize",Ke[e.size]+"em"),r}}),c({type:"leftright-right",names:["\\right"],props:{numArgs:1,argTypes:["primitive"]},handler:(e,t)=>({type:"leftright-right",mode:e.parser.mode,delim:Je(t[0],e).text})}),c({type:"leftright",names:["\\left"],props:{numArgs:1,argTypes:["primitive"]},handler:(e,t)=>{const r=Je(t[0],e),n=e.parser;++n.leftrightDepth;const s=n.parseExpression(!1);--n.leftrightDepth,n.expect("\\right",!1);const o=Oe(n.parseFunction(),"leftright-right");return{type:"leftright",mode:n.mode,body:s,left:r.text,right:o.delim}},mathmlBuilder:(e,t)=>{!function(e){if(!e.body)throw new Error("Bug: The leftright ParseNode wasn't fully parsed.")}(e);const r=ie(e.body,t);"."===e.left&&(e.left="");const n=new N.MathNode("mo",[re(e.left,e.mode)]);n.setAttribute("fence","true"),n.setAttribute("form","prefix"),("∖"===e.left||e.left.indexOf("arrow")>-1)&&n.setAttribute("stretchy","true"),r.unshift(n),"."===e.right&&(e.right="");const s=new N.MathNode("mo",[re(e.right,e.mode)]);return s.setAttribute("fence","true"),s.setAttribute("form","postfix"),("∖"===e.right||e.right.indexOf("arrow")>-1)&&s.setAttribute("stretchy","true"),r.push(s),oe(r)}}),c({type:"middle",names:["\\middle"],props:{numArgs:1,argTypes:["primitive"]},handler:(t,r)=>{const n=Je(r[0],t);if(!t.parser.leftrightDepth)throw new e("\\middle without preceding \\left",n);return{type:"middle",mode:t.parser.mode,delim:n.text}},mathmlBuilder:(e,t)=>{const r=re(e.delim,e.mode),n=new N.MathNode("mo",[r]);return n.setAttribute("fence","true"),e.delim.indexOf("arrow")>-1&&n.setAttribute("stretchy","true"),n.setAttribute("form","prefix"),n.setAttribute("lspace","0.05em"),n.setAttribute("rspace","0.05em"),n}});const Qe=e=>{const t=new N.MathNode("mspace");return t.setAttribute("width","3pt"),t},et=(e,t)=>{let r;switch(r=e.label.indexOf("colorbox")>-1||"\\boxed"===e.label?new N.MathNode("mrow",[Qe(),ce(e.body,t),Qe()]):new N.MathNode("mrow",[ce(e.body,t)]),e.label){case"\\overline":r.style.padding="0.1em 0 0 0",r.style.borderTop="0.065em solid";break;case"\\underline":r.style.padding="0 0 0.1em 0",r.style.borderBottom="0.065em solid";break;case"\\cancel":r.classes.push("tml-cancel");break;case"\\bcancel":r.classes.push("tml-bcancel");break;case"\\angl":r.style.padding="0.03889em 0.03889em 0 0.03889em",r.style.borderTop="0.049em solid",r.style.borderRight="0.049em solid",r.style.marginRight="0.03889em";break;case"\\sout":r.style.backgroundImage="linear-gradient(black, black)",r.style.backgroundRepeat="no-repeat",r.style.backgroundSize="100% 1.5px",r.style.backgroundPosition="0 center";break;case"\\boxed":r.style={padding:"3pt 0 3pt 0",border:"1px solid"},r.setAttribute("scriptlevel","0"),r.setAttribute("displaystyle","true");break;case"\\fbox":r.style={padding:"3pt",border:"1px solid"};break;case"\\fcolorbox":case"\\colorbox":{const t={padding:"3pt 0 3pt 0"};"\\fcolorbox"===e.label&&(t.border="0.06em solid "+String(e.borderColor)),r.style=t;break}case"\\xcancel":r.classes.push("tml-xcancel")}return e.backgroundColor&&r.setAttribute("mathbackground",e.backgroundColor),r};c({type:"enclose",names:["\\colorbox"],props:{numArgs:2,numOptionalArgs:1,allowedInText:!0,argTypes:["raw","raw","text"]},handler({parser:e,funcName:t},r,n){const s=n[0]&&Oe(n[0],"raw").string;let o="";if(s){const e=Oe(r[0],"raw").string;o=Re(s,e)}else o=je(Oe(r[0],"raw").string,e.gullet.macros);const a=r[1];return{type:"enclose",mode:e.mode,label:t,backgroundColor:o,body:a}},mathmlBuilder:et}),c({type:"enclose",names:["\\fcolorbox"],props:{numArgs:3,numOptionalArgs:1,allowedInText:!0,argTypes:["raw","raw","raw","text"]},handler({parser:e,funcName:t},r,n){const s=n[0]&&Oe(n[0],"raw").string;let o,a="";if(s){const e=Oe(r[0],"raw").string,t=Oe(r[0],"raw").string;a=Re(s,e),o=Re(s,t)}else a=je(Oe(r[0],"raw").string,e.gullet.macros),o=je(Oe(r[1],"raw").string,e.gullet.macros);const i=r[2];return{type:"enclose",mode:e.mode,label:t,backgroundColor:o,borderColor:a,body:i}},mathmlBuilder:et}),c({type:"enclose",names:["\\fbox"],props:{numArgs:1,argTypes:["hbox"],allowedInText:!0},handler:({parser:e},t)=>({type:"enclose",mode:e.mode,label:"\\fbox",body:t[0]})}),c({type:"enclose",names:["\\angl","\\cancel","\\bcancel","\\xcancel","\\sout","\\overline","\\boxed"],props:{numArgs:1},handler({parser:e,funcName:t},r){const n=r[0];return{type:"enclose",mode:e.mode,label:t,body:n}},mathmlBuilder:et}),c({type:"enclose",names:["\\underline"],props:{numArgs:1,allowedInText:!0},handler({parser:e,funcName:t},r){const n=r[0];return{type:"enclose",mode:e.mode,label:t,body:n}},mathmlBuilder:et});const tt={};function rt({type:e,names:t,props:r,handler:n,mathmlBuilder:s}){const o={type:e,numArgs:r.numArgs||0,allowedInText:!1,numOptionalArgs:0,handler:n};for(let e=0;e<t.length;++e)tt[t[e]]=o;s&&(l[e]=s)}const nt=0,st=1,ot=2,at=3;function it(e){const t=[];e.consumeSpaces();let r=e.fetch().text;for("\\relax"===r&&(e.consume(),e.consumeSpaces(),r=e.fetch().text);"\\hline"===r||"\\hdashline"===r;)e.consume(),t.push("\\hdashline"===r),e.consumeSpaces(),r=e.fetch().text;return t}const lt=t=>{if(!t.parser.settings.displayMode)throw new e(`{${t.envName}} can be used only in display mode.`)},ct=(e,t,r)=>{let n;const s=e.tags.shift();if(s){if(!s.body)return n=new N.MathNode("mtext",[],[]),n;n=le(s.body,t,!0),n.classes=["tml-tag"]}else{if(e.envClasses.includes("multline")&&(e.leqno&&0!==r||!e.leqno&&r!==e.body.length-1))return n=new N.MathNode("mtext",[],[]),n;n=new N.MathNode("mtext",[new y(["tml-eqn"])])}return n};function mt(t,{cols:r,envClasses:n,addEqnNum:s,singleRow:o,emptySingleRow:a,maxNumCols:i,leqno:l},c){t.gullet.beginGroup(),o||t.gullet.macros.set("\\cr","\\\\\\relax"),s&&(t.gullet.macros.set("\\tag","\\@ifstar\\envtag@literal\\envtag@paren"),t.gullet.macros.set("\\envtag@paren","\\env@tag{{(\\text{#1})}}"),t.gullet.macros.set("\\envtag@literal","\\env@tag{\\text{#1}}"),t.gullet.macros.set("\\notag","\\env@notag"),t.gullet.macros.set("\\nonumber","\\env@notag")),t.gullet.beginGroup();let m=[];const u=[m],p=[],d=[];let h;const g=[];for(g.push(it(t));;){let r=t.parseExpression(!1,o?"\\end":"\\\\");if(s&&!h)for(let e=0;e<r.length;e++)if("envTag"===r[e].type||"noTag"===r[e].type){h="envTag"===r[e].type?r.splice(e,1)[0].body.body[0]:{body:null};break}t.gullet.endGroup(),t.gullet.beginGroup(),r={type:"ordgroup",mode:t.mode,body:r,semisimple:!0},m.push(r);const l=t.fetch().text;if("&"===l){if(i&&m.length===i){if(!n.includes("array"))throw new e(2===i?"The split environment accepts no more than two columns":"The equation environment accepts only one column",t.nextToken);if(t.settings.strict)throw new e("Too few columns specified in the {array} column argument.",t.nextToken)}t.consume()}else{if("\\end"===l){1===m.length&&0===r.body.length&&(u.length>1||!a)&&u.pop(),g.length<u.length+1&&g.push([]);break}if("\\\\"!==l)throw new e("Expected & or \\\\ or \\cr or \\end",t.nextToken);{let e;t.consume()," "!==t.gullet.future().text&&(e=t.parseSizeGroup(!0)),p.push(e?e.value:null),d.push(h),g.push(it(t)),m=[],h=null,u.push(m)}}}return t.gullet.endGroup(),t.gullet.endGroup(),d.push(h),{type:"array",mode:t.mode,body:u,cols:r,rowGaps:p,hLinesBeforeRow:g,envClasses:n,addEqnNum:s,scriptLevel:c,tags:d,leqno:l}}function ut(e){return"d"===e.slice(0,1)?"display":"text"}const pt={c:"center ",l:"left ",r:"right "},dt=e=>{const t=new N.MathNode("mtd",[]);return t.style={padding:"0",width:"50%"},e.envClasses.includes("multline")&&(t.style.width="7.5%"),t},ht=function(e,t){const r=[],n=e.body.length,s=e.hLinesBeforeRow;for(let o=0;o<n;o++){const a=e.body[o],i=[],l="text"===e.scriptLevel?st:"script"===e.scriptLevel?ot:nt;for(let r=0;r<a.length;r++){const s=new N.MathNode("mtd",[ce(a[r],t.withLevel(l))]);if(e.envClasses.includes("multline")){const e=0===o?"left":o===n-1?"right":"center";s.setAttribute("columnalign",e),"center"!==e&&s.classes.push("tml-"+e)}i.push(s)}if(e.addEqnNum){i.unshift(dt(e)),i.push(dt(e));const r=ct(e,t.withLevel(l),o);e.leqno?(i[0].children.push(r),i[0].classes.push("tml-left")):(i[i.length-1].children.push(r),i[i.length-1].classes.push("tml-right"))}const c=new N.MathNode("mtr",i,[]);0===o&&s[0].length>0&&(2===s[0].length?c.children.forEach((e=>{e.style.borderTop="0.15em double"})):c.children.forEach((e=>{e.style.borderTop=s[0][0]?"0.06em dashed":"0.06em solid"}))),s[o+1].length>0&&(2===s[o+1].length?c.children.forEach((e=>{e.style.borderBottom="0.15em double"})):c.children.forEach((e=>{e.style.borderBottom=s[o+1][0]?"0.06em dashed":"0.06em solid"}))),r.push(c)}if(e.envClasses.length>0){const t=e.envClasses.includes("jot")?"0.7":e.envClasses.includes("small")?"0.35":"0.5",n=e.envClasses.includes("abut")||e.envClasses.includes("cases")?"0":e.envClasses.includes("small")?"0.1389":e.envClasses.includes("cd")?"0.25":"0.4",s=0===r.length?0:r[0].children.length,o=(t,r)=>0===t&&0===r||t===s-1&&1===r?"0":"align"!==e.envClasses[0]?n:1===r?"0":e.addEqnNum?t%2?"1":"0":t%2?"0":"1";for(let e=0;e<r.length;e++)for(let n=0;n<r[e].children.length;n++)r[e].children[n].style.padding=`${t}ex ${o(n,1)}em ${t}ex ${o(n,0)}em`;const a=e.envClasses.includes("align")||e.envClasses.includes("alignat");for(let t=0;t<r.length;t++){const n=r[t];if(a){for(let e=0;e<n.children.length;e++)n.children[e].classes=["tml-"+(e%2?"left":"right")];if(e.addEqnNum){const t=e.leqno?0:n.children.length-1;n.children[t].classes=["tml-"+(e.leqno?"left":"right")]}}if(n.children.length>1&&e.envClasses.includes("cases")&&(n.children[1].style.padding=n.children[1].style.padding.replace(/0em$/,"1em")),e.envClasses.includes("cases")||e.envClasses.includes("subarray"))for(const e of n.children)e.classes.push("tml-left")}}else for(let e=0;e<r.length;e++)r[e].children[0].style.paddingLeft="0em",r[e].children.length===r[0].children.length&&(r[e].children[r[e].children.length-1].style.paddingRight="0em");let o=new N.MathNode("mtable",r);"display"===e.scriptLevel&&o.setAttribute("displaystyle","true"),(e.addEqnNum||e.envClasses.includes("multline"))&&(o.style.width="100%");let a="";if(e.cols&&e.cols.length>0){const t=e.cols;let r=!1,n=0,s=t.length;for(;"separator"===t[n].type;)n+=1;for(;"separator"===t[s-1].type;)s-=1;if("separator"===t[0].type){const e="separator"===t[1].type?"0.15em double":"|"===t[0].separator?"0.06em solid ":"0.06em dashed ";for(const t of o.children)t.children[0].style.borderLeft=e}let i=e.addEqnNum?0:-1;for(let e=n;e<s;e++)if("align"===t[e].type){const n=pt[t[e].align];a+=n,i+=1;for(const e of o.children)"center"!==n.trim()&&i<e.children.length&&(e.children[i].classes=["tml-"+n.trim()]);r=!0}else if("separator"===t[e].type){if(r){const r="separator"===t[e+1].type?"0.15em double":"|"===t[e].separator?"0.06em solid":"0.06em dashed";for(const e of o.children)i<e.children.length&&(e.children[i].style.borderRight=r)}r=!1}if("separator"===t[t.length-1].type){const e="separator"===t[t.length-2].type?"0.15em double":"|"===t[t.length-1].separator?"0.06em solid":"0.06em dashed";for(const t of o.children)t.children[t.children.length-1].style.borderRight=e,t.children[t.children.length-1].style.paddingRight="0.4em"}}return e.addEqnNum&&(a="left "+(a.length>0?a:"center ")+"right "),a&&o.setAttribute("columnalign",a.trim()),e.envClasses.includes("small")&&(o=new N.MathNode("mstyle",[o]),o.setAttribute("scriptlevel","1")),o},gt=function(t,r){-1===t.envName.indexOf("ed")&&lt(t);const n=[],s=mt(t.parser,{cols:n,addEqnNum:"align"===t.envName||"alignat"===t.envName,emptySingleRow:!0,envClasses:["abut","jot"],maxNumCols:"split"===t.envName?2:void 0,leqno:t.parser.settings.leqno},"display");let o,a=0;const i=t.envName.indexOf("at")>-1;if(r[0]&&i){let t="";for(let e=0;e<r[0].body.length;e++){t+=Oe(r[0].body[e],"textord").text}if(isNaN(t))throw new e("The alignat enviroment requires a numeric first argument.");o=Number(t),a=2*o}s.body.forEach((function(t){if(i){const r=t.length/2;if(o<r)throw new e(`Too many math in a row: expected ${o}, but got ${r}`,t[0])}else a<t.length&&(a=t.length)}));for(let e=0;e<a;++e){let t="r";e%2==1&&(t="l"),n[e]={type:"align",align:t}}return"split"===t.envName||(i?s.envClasses.push("alignat"):s.envClasses[0]="align"),s};rt({type:"array",names:["array","darray"],props:{numArgs:1},handler(t,r){const n=(Me(r[0])?[r[0]]:Oe(r[0],"ordgroup").body).map((function(t){const r=Be(t).text;if(-1!=="lcr".indexOf(r))return{type:"align",align:r};if("|"===r)return{type:"separator",separator:"|"};if(":"===r)return{type:"separator",separator:":"};throw new e("Unknown column alignment: "+r,t)})),s={cols:n,envClasses:["array"],maxNumCols:n.length};return mt(t.parser,s,ut(t.envName))},mathmlBuilder:ht}),rt({type:"array",names:["matrix","pmatrix","bmatrix","Bmatrix","vmatrix","Vmatrix","matrix*","pmatrix*","bmatrix*","Bmatrix*","vmatrix*","Vmatrix*"],props:{numArgs:0},handler(t){const r={matrix:null,pmatrix:["(",")"],bmatrix:["[","]"],Bmatrix:["\\{","\\}"],vmatrix:["|","|"],Vmatrix:["\\Vert","\\Vert"]}[t.envName.replace("*","")];let n="c";const s={envClasses:[],cols:[]};if("*"===t.envName.charAt(t.envName.length-1)){const r=t.parser;if(r.consumeSpaces(),"["===r.fetch().text){if(r.consume(),r.consumeSpaces(),n=r.fetch().text,-1==="lcr".indexOf(n))throw new e("Expected l or c or r",r.nextToken);r.consume(),r.consumeSpaces(),r.expect("]"),r.consume(),s.cols=[]}}const o=mt(t.parser,s,"text");return o.cols=new Array(o.body[0].length).fill({type:"align",align:n}),r?{type:"leftright",mode:t.mode,body:[o],left:r[0],right:r[1],rightColor:void 0}:o},mathmlBuilder:ht}),rt({type:"array",names:["smallmatrix"],props:{numArgs:0},handler(e){const t=mt(e.parser,{type:"small"},"script");return t.envClasses=["small"],t},mathmlBuilder:ht}),rt({type:"array",names:["subarray"],props:{numArgs:1},handler(t,r){const n=(Me(r[0])?[r[0]]:Oe(r[0],"ordgroup").body).map((function(t){const r=Be(t).text;if(-1!=="lc".indexOf(r))return{type:"align",align:r};throw new e("Unknown column alignment: "+r,t)}));if(n.length>1)throw new e("{subarray} can contain only one column");let s={cols:n,envClasses:["small"]};if(s=mt(t.parser,s,"script"),s.body.length>0&&s.body[0].length>1)throw new e("{subarray} can contain only one column");return s},mathmlBuilder:ht}),rt({type:"array",names:["cases","dcases","rcases","drcases"],props:{numArgs:0},handler(e){const t=mt(e.parser,{cols:[],envClasses:["cases"]},ut(e.envName));return{type:"leftright",mode:e.mode,body:[t],left:e.envName.indexOf("r")>-1?".":"\\{",right:e.envName.indexOf("r")>-1?"\\}":".",rightColor:void 0}},mathmlBuilder:ht}),rt({type:"array",names:["align","align*","aligned","split"],props:{numArgs:0},handler:gt,mathmlBuilder:ht}),rt({type:"array",names:["alignat","alignat*","alignedat"],props:{numArgs:1},handler:gt,mathmlBuilder:ht}),rt({type:"array",names:["gathered","gather","gather*"],props:{numArgs:0},handler(e){"gathered"!==e.envName&&lt(e);const t={cols:[],envClasses:["abut","jot"],addEqnNum:"gather"===e.envName,emptySingleRow:!0,leqno:e.parser.settings.leqno};return mt(e.parser,t,"display")},mathmlBuilder:ht}),rt({type:"array",names:["equation","equation*"],props:{numArgs:0},handler(e){lt(e);const t={addEqnNum:"equation"===e.envName,emptySingleRow:!0,singleRow:!0,maxNumCols:1,envClasses:["align"],leqno:e.parser.settings.leqno};return mt(e.parser,t,"display")},mathmlBuilder:ht}),rt({type:"array",names:["multline","multline*"],props:{numArgs:0},handler(e){lt(e);const t={addEqnNum:"multline"===e.envName,maxNumCols:1,envClasses:["jot","multline"],leqno:e.parser.settings.leqno};return mt(e.parser,t,"display")},mathmlBuilder:ht}),rt({type:"array",names:["CD"],props:{numArgs:0},handler:t=>(lt(t),function(t){const r=[];for(t.gullet.beginGroup(),t.gullet.macros.set("\\cr","\\\\\\relax"),t.gullet.beginGroup();;){r.push(t.parseExpression(!1,"\\\\")),t.gullet.endGroup(),t.gullet.beginGroup();const n=t.fetch().text;if("&"!==n&&"\\\\"!==n){if("\\end"===n){0===r[r.length-1].length&&r.pop();break}throw new e("Expected \\\\ or \\cr or \\end",t.nextToken)}t.consume()}let n=[];const s=[n];for(let i=0;i<r.length;i++){const l=r[i];let c={type:"styling",body:[],mode:"math",scriptLevel:"display"};for(let r=0;r<l.length;r++)if(ze(l[r])){n.push(c),r+=1;const s=Be(l[r]).text,i=new Array(2);if(i[0]={type:"ordgroup",mode:"math",body:[]},i[1]={type:"ordgroup",mode:"math",body:[]},"=|.".indexOf(s)>-1);else{if(!("<>AV".indexOf(s)>-1))throw new e('Expected one of "<>AV=|." after @.');for(let t=0;t<2;t++){let n=!0;for(let c=r+1;c<l.length;c++){if(a=s,("mathord"===(o=l[c]).type||"atom"===o.type)&&o.text===a){n=!1,r=c;break}if(ze(l[c]))throw new e("Missing a "+s+" character to complete a CD arrow.",l[c]);i[t].body.push(l[c])}if(n)throw new e("Missing a "+s+" character to complete a CD arrow.",l[r])}}const m=Ee(s,i,t);n.push(m),c={type:"styling",body:[],mode:"math",scriptLevel:"display"}}else c.body.push(l[r]);i%2==0?n.push(c):n.shift(),n=[],s.push(n)}var o,a;return s.pop(),t.gullet.endGroup(),t.gullet.endGroup(),{type:"array",mode:"math",body:s,envClasses:["jot","cd"],cols:[],hLinesBeforeRow:new Array(s.length+1).fill([])}}(t.parser)),mathmlBuilder:ht}),c({type:"text",names:["\\hline","\\hdashline"],props:{numArgs:0,allowedInText:!0,allowedInMath:!0},handler(t,r){throw new e(`${t.funcName} valid only within array environment`)}});const ft=tt;c({type:"environment",names:["\\begin","\\end"],props:{numArgs:1,argTypes:["text"]},handler({parser:t,funcName:r},n){const s=n[0];if("ordgroup"!==s.type)throw new e("Invalid environment name",s);let o="";for(let e=0;e<s.body.length;++e)o+=Oe(s.body[e],"textord").text;if("\\begin"===r){if(!Object.prototype.hasOwnProperty.call(ft,o))throw new e("No such environment: "+o,s);const r=ft[o],{args:n,optArgs:a}=t.parseArguments("\\begin{"+o+"}",r),i={mode:t.mode,envName:o,parser:t},l=r.handler(i,n,a);t.expect("\\end",!1);const c=t.nextToken,m=Oe(t.parseFunction(),"environment");if(m.name!==o)throw new e(`Mismatch: \\begin{${o}} matched by \\end{${m.name}}`,c);return l}return{type:"environment",mode:t.mode,name:o,nameGroup:s}}}),c({type:"envTag",names:["\\env@tag"],props:{numArgs:1,argTypes:["math"]},handler:({parser:e},t)=>({type:"envTag",mode:e.mode,body:t[0]}),mathmlBuilder:(e,t)=>new N.MathNode("mrow")}),c({type:"noTag",names:["\\env@notag"],props:{numArgs:0},handler:({parser:e})=>({type:"noTag",mode:e.mode}),mathmlBuilder:(e,t)=>new N.MathNode("mrow")});const bt=(e,t)=>{const r=e.font,n=t.withFont(r),s=ce(e.body,n);if(0===s.children.length)return s;if("boldsymbol"===r&&["mo","mpadded","mrow"].includes(s.type))return s.style.fontWeight="bold",s;let o="mo"===s.children[0].type;for(let e=1;e<s.children.length;e++){"mo"===s.children[e].type&&"boldsymbol"===r&&(s.children[e].style.fontWeight="bold"),"mi"!==s.children[e].type&&(o=!1);"normal"!==(s.children[e].attributes&&s.children[e].attributes.mathvariant||"")&&(o=!1)}if(!o)return s;const a=s.children[0];for(let e=1;e<s.children.length;e++)a.children.push(s.children[e].children[0]);if(a.attributes.mathvariant&&"normal"===a.attributes.mathvariant){const e=new N.MathNode("mtext",new N.TextNode("​"));return new N.MathNode("mrow",[e,a])}return a},yt={"\\Bbb":"\\mathbb","\\bold":"\\mathbf","\\frak":"\\mathfrak","\\bm":"\\boldsymbol"};c({type:"font",names:["\\mathrm","\\mathit","\\mathbf","\\mathnormal","\\up@greek","\\boldsymbol","\\mathbb","\\mathcal","\\mathfrak","\\mathscr","\\mathsf","\\mathtt","\\Bbb","\\bm","\\bold","\\frak"],props:{numArgs:1,allowedInArgument:!0},handler:({parser:e,funcName:t},r)=>{const n=u(r[0]);let s=t;return s in yt&&(s=yt[s]),{type:"font",mode:e.mode,font:s.slice(1),body:n}},mathmlBuilder:bt}),c({type:"font",names:["\\rm","\\sf","\\tt","\\bf","\\it","\\cal"],props:{numArgs:0,allowedInText:!0},handler:({parser:e,funcName:t,breakOnTokenText:r},n)=>{const{mode:s}=e,o=e.parseExpression(!0,r);return{type:"font",mode:s,font:`math${t.slice(1)}`,body:{type:"ordgroup",mode:e.mode,body:o}}},mathmlBuilder:bt});const xt=["display","text","script","scriptscript"],wt={auto:-1,display:0,text:0,script:1,scriptscript:2},kt=(e,t)=>{const r="auto"===e.scriptLevel?t.incrementLevel():"display"===e.scriptLevel?t.withLevel(st):"text"===e.scriptLevel?t.withLevel(ot):t.withLevel(at);let n=new N.MathNode("mfrac",[ce(e.numer,r),ce(e.denom,r)]);if(e.hasBarLine){if(e.barSize){const r=ve(e.barSize,t);n.setAttribute("linethickness",r.number+r.unit)}}else n.setAttribute("linethickness","0px");if(null!=e.leftDelim||null!=e.rightDelim){const t=[];if(null!=e.leftDelim){const r=new N.MathNode("mo",[new N.TextNode(e.leftDelim.replace("\\",""))]);r.setAttribute("fence","true"),t.push(r)}if(t.push(n),null!=e.rightDelim){const r=new N.MathNode("mo",[new N.TextNode(e.rightDelim.replace("\\",""))]);r.setAttribute("fence","true"),t.push(r)}n=oe(t)}return"auto"!==e.scriptLevel&&(n=new N.MathNode("mstyle",[n]),n.setAttribute("displaystyle",String("display"===e.scriptLevel)),n.setAttribute("scriptlevel",wt[e.scriptLevel])),n};c({type:"genfrac",names:["\\dfrac","\\frac","\\tfrac","\\dbinom","\\binom","\\tbinom","\\\\atopfrac","\\\\bracefrac","\\\\brackfrac"],props:{numArgs:2,allowedInArgument:!0},handler:({parser:e,funcName:t},r)=>{const n=r[0],s=r[1];let o=!1,a=null,i=null,l="auto";switch(t){case"\\dfrac":case"\\frac":case"\\tfrac":o=!0;break;case"\\\\atopfrac":o=!1;break;case"\\dbinom":case"\\binom":case"\\tbinom":a="(",i=")";break;case"\\\\bracefrac":a="\\{",i="\\}";break;case"\\\\brackfrac":a="[",i="]";break;default:throw new Error("Unrecognized genfrac command")}switch(t){case"\\dfrac":case"\\dbinom":l="display";break;case"\\tfrac":case"\\tbinom":l="text"}return{type:"genfrac",mode:e.mode,continued:!1,numer:n,denom:s,hasBarLine:o,leftDelim:a,rightDelim:i,scriptLevel:l,barSize:null}},mathmlBuilder:kt}),c({type:"genfrac",names:["\\cfrac"],props:{numArgs:2},handler:({parser:e,funcName:t},r)=>{const n=r[0],s=r[1];return{type:"genfrac",mode:e.mode,continued:!0,numer:n,denom:s,hasBarLine:!0,leftDelim:null,rightDelim:null,scriptLevel:"display",barSize:null}}}),c({type:"infix",names:["\\over","\\choose","\\atop","\\brace","\\brack"],props:{numArgs:0,infix:!0},handler({parser:e,funcName:t,token:r}){let n;switch(t){case"\\over":n="\\frac";break;case"\\choose":n="\\binom";break;case"\\atop":n="\\\\atopfrac";break;case"\\brace":n="\\\\bracefrac";break;case"\\brack":n="\\\\brackfrac";break;default:throw new Error("Unrecognized infix genfrac command")}return{type:"infix",mode:e.mode,replaceWith:n,token:r}}});const vt=function(e){let t=null;return e.length>0&&(t=e,t="."===t?null:t),t};c({type:"genfrac",names:["\\genfrac"],props:{numArgs:6,allowedInArgument:!0,argTypes:["math","math","size","text","math","math"]},handler({parser:e},t){const r=t[4],n=t[5],s=u(t[0]),o="atom"===s.type&&"open"===s.family?vt(s.text):null,a=u(t[1]),i="atom"===a.type&&"close"===a.family?vt(a.text):null,l=Oe(t[2],"size");let c,m=null;l.isBlank?c=!0:(m=l.value,c=m.number>0);let p="auto",d=t[3];if("ordgroup"===d.type){if(d.body.length>0){const e=Oe(d.body[0],"textord");p=xt[Number(e.text)]}}else d=Oe(d,"textord"),p=xt[Number(d.text)];return{type:"genfrac",mode:e.mode,numer:r,denom:n,continued:!1,hasBarLine:c,barSize:m,leftDelim:o,rightDelim:i,scriptLevel:p}},mathmlBuilder:kt}),c({type:"infix",names:["\\above"],props:{numArgs:1,argTypes:["size"],infix:!0},handler:({parser:e,funcName:t,token:r},n)=>({type:"infix",mode:e.mode,replaceWith:"\\\\abovefrac",barSize:Oe(n[0],"size").value,token:r})}),c({type:"genfrac",names:["\\\\abovefrac"],props:{numArgs:3,argTypes:["math","size","math"]},handler:({parser:e,funcName:t},r)=>{const n=r[0],s=function(e){if(!e)throw new Error("Expected non-null, but got "+String(e));return e}(Oe(r[1],"infix").barSize),o=r[2],a=s.number>0;return{type:"genfrac",mode:e.mode,numer:n,denom:o,continued:!1,hasBarLine:a,barSize:s,leftDelim:null,rightDelim:null,scriptLevel:"auto"}},mathmlBuilder:kt}),c({type:"hbox",names:["\\hbox"],props:{numArgs:1,argTypes:["hbox"],allowedInArgument:!0,allowedInText:!1},handler:({parser:e},t)=>({type:"hbox",mode:e.mode,body:p(t[0])}),mathmlBuilder(e,t){const r=t.withLevel(st),n=le(e.body,r);return ne(n)}});c({type:"horizBrace",names:["\\overbrace","\\underbrace"],props:{numArgs:1},handler:({parser:e,funcName:t},r)=>({type:"horizBrace",mode:e.mode,label:t,isOver:/^\\over/.test(t),base:r[0]}),mathmlBuilder:(e,t)=>{const r=B(e.label);return r.style["math-depth"]=0,new N.MathNode(e.isOver?"mover":"munder",[ce(e.base,t),r])}}),c({type:"href",names:["\\href"],props:{numArgs:2,argTypes:["url","original"],allowedInText:!0},handler:({parser:t,token:r},n)=>{const s=n[1],o=Oe(n[0],"url").url;if(!t.settings.isTrusted({command:"\\href",url:o}))throw new e('Function "\\href" is not trusted',r);return{type:"href",mode:t.mode,href:o,body:p(s)}},mathmlBuilder:(e,t)=>{let r=le(e.body,t);return r instanceof k||(r=new k("mrow",[r])),r.setAttribute("href",e.href),r}}),c({type:"href",names:["\\url"],props:{numArgs:1,argTypes:["url"],allowedInText:!0},handler:({parser:t,token:r},n)=>{const s=Oe(n[0],"url").url;if(!t.settings.isTrusted({command:"\\url",url:s}))throw new e('Function "\\url" is not trusted',r);const o=[];for(let e=0;e<s.length;e++){let t=s[e];"~"===t&&(t="\\textasciitilde"),o.push({type:"textord",mode:"text",text:t})}const a={type:"text",mode:t.mode,font:"\\texttt",body:o};return{type:"href",mode:t.mode,href:s,body:p(a)}}}),c({type:"html",names:["\\class","\\id","\\style","\\data"],props:{numArgs:2,argTypes:["raw","original"],allowedInText:!0},handler:({parser:t,funcName:r,token:n},s)=>{const o=Oe(s[0],"raw").string,a=s[1];if(t.settings.strict)throw new e(`Function "${r}" is disabled in strict mode`,n);let i;const l={};switch(r){case"\\class":l.class=o,i={command:"\\class",class:o};break;case"\\id":l.id=o,i={command:"\\id",id:o};break;case"\\style":l.style=o,i={command:"\\style",style:o};break;case"\\data":{const t=o.split(",");for(let r=0;r<t.length;r++){const n=t[r].split("=");if(2!==n.length)throw new e("Error parsing key-value for \\data");l["data-"+n[0].trim()]=n[1].trim()}i={command:"\\data",attributes:l};break}default:throw new Error("Unrecognized html command")}if(!t.settings.isTrusted(i))throw new e(`Function "${r}" is not trusted`,n);return{type:"html",mode:t.mode,attributes:l,body:p(a)}},mathmlBuilder:(e,t)=>{const r=le(e.body,t),n=[];e.attributes.class&&n.push(...e.attributes.class.trim().split(/\s+/)),r.classes=n;for(const t in e.attributes)"class"!==t&&Object.prototype.hasOwnProperty.call(e.attributes,t)&&r.setAttribute(t,e.attributes[t]);return r}});const At=function(t){if(/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(t))return{number:+t,unit:"bp"};{const r=/([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(t);if(!r)throw new e("Invalid size: '"+t+"' in \\includegraphics");const n={number:+(r[1]+r[2]),unit:r[3]};if(!we(n))throw new e("Invalid unit: '"+n.unit+"' in \\includegraphics.");return n}};c({type:"includegraphics",names:["\\includegraphics"],props:{numArgs:1,numOptionalArgs:1,argTypes:["raw","url"],allowedInText:!1},handler:({parser:t,token:r},n,s)=>{let o={number:0,unit:"em"},a={number:.9,unit:"em"},i={number:0,unit:"em"},l="";if(s[0]){const t=Oe(s[0],"raw").string.split(",");for(let r=0;r<t.length;r++){const n=t[r].split("=");if(2===n.length){const t=n[1].trim();switch(n[0].trim()){case"alt":l=t;break;case"width":o=At(t);break;case"height":a=At(t);break;case"totalheight":i=At(t);break;default:throw new e("Invalid key: '"+n[0]+"' in \\includegraphics.")}}}}const c=Oe(n[0],"url").url;if(""===l&&(l=c,l=l.replace(/^.*[\\/]/,""),l=l.substring(0,l.lastIndexOf("."))),!t.settings.isTrusted({command:"\\includegraphics",url:c}))throw new e('Function "\\includegraphics" is not trusted',r);return{type:"includegraphics",mode:t.mode,alt:l,width:o,height:a,totalheight:i,src:c}},mathmlBuilder:(e,t)=>{const r=ve(e.height,t),n={number:0,unit:"em"};e.totalheight.number>0&&e.totalheight.unit===r.unit&&e.totalheight.number>r.number&&(n.number=e.totalheight.number-r.number,n.unit=r.unit);let s=0;e.width.number>0&&(s=ve(e.width,t));const o={height:r.number+n.number+"em"};s.number>0&&(o.width=s.number+s.unit),n.number>0&&(o.verticalAlign=-n.number+n.unit);const a=new w(e.src,e.alt,o);return a.height=r,a.depth=n,new N.MathNode("mtext",[a])}}),c({type:"kern",names:["\\kern","\\mkern","\\hskip","\\mskip"],props:{numArgs:1,argTypes:["size"],primitive:!0,allowedInText:!0},handler({parser:t,funcName:r,token:n},s){const o=Oe(s[0],"size");if(t.settings.strict){const s="m"===r[1],a="mu"===o.value.unit;if(s){if(!a)throw new e(`LaTeX's ${r} supports only mu units, not ${o.value.unit} units`,n);if("math"!==t.mode)throw new e(`LaTeX's ${r} works only in math mode`,n)}else if(a)throw new e(`LaTeX's ${r} doesn't support mu units`,n)}return{type:"kern",mode:t.mode,dimension:o.value}},mathmlBuilder(e,t){const r=ve(e.dimension,t),n="em"===r.unit?Nt(r.number):"";if("text"===e.mode&&n.length>0){const e=new N.TextNode(n);return new N.MathNode("mtext",[e])}{const e=new N.MathNode("mspace");return e.setAttribute("width",r.number+r.unit),r.number<0&&(e.style.marginLeft=r.number+r.unit),e}}});const Nt=function(e){return e>=.05555&&e<=.05556?" ":e>=.1666&&e<=.1667?" ":e>=.2222&&e<=.2223?" ":e>=.2777&&e<=.2778?"  ":""},Tt=/[^A-Za-z_0-9-]/g;c({type:"label",names:["\\label"],props:{numArgs:1,argTypes:["raw"]},handler:({parser:e},t)=>({type:"label",mode:e.mode,string:t[0].string.replace(Tt,"")}),mathmlBuilder(e,t){const r=new N.MathNode("mrow",[],["tml-label"]);return e.string.length>0&&r.setAttribute("id",e.string),r}});const qt=["\\clap","\\llap","\\rlap"];c({type:"lap",names:["\\mathllap","\\mathrlap","\\mathclap","\\clap","\\llap","\\rlap"],props:{numArgs:1,allowedInText:!0},handler:({parser:t,funcName:r,token:n},s)=>{if(qt.includes(r)){if(t.settings.strict&&"text"!==t.mode)throw new e(`{${r}} can be used only in text mode.\n Try \\math${r.slice(1)}`,n);r=r.slice(1)}else r=r.slice(5);const o=s[0];return{type:"lap",mode:t.mode,alignment:r,body:o}},mathmlBuilder:(e,t)=>{let r;if("llap"===e.alignment){const n=ie(p(e.body),t),s=new N.MathNode("mphantom",n);r=new N.MathNode("mpadded",[s]),r.setAttribute("width","0px")}const n=ce(e.body,t);let s;if("llap"===e.alignment?(n.style.position="absolute",n.style.right="0",n.style.bottom="0",s=new N.MathNode("mpadded",[r,n])):s=new N.MathNode("mpadded",[n]),"rlap"===e.alignment)e.body.body.length>0&&"genfrac"===e.body.body[0].type&&s.setAttribute("lspace","0.16667em");else{const t="llap"===e.alignment?"-1":"-0.5";s.setAttribute("lspace",t+"width"),"llap"===e.alignment?s.style.position="relative":(s.style.display="flex",s.style.justifyContent="center")}return s.setAttribute("width","0px"),s}}),c({type:"ordgroup",names:["\\(","$"],props:{numArgs:0,allowedInText:!0,allowedInMath:!1},handler({funcName:e,parser:t},r){const n=t.mode;t.switchMode("math");const s="\\("===e?"\\)":"$",o=t.parseExpression(!1,s);return t.expect(s),t.switchMode(n),{type:"ordgroup",mode:t.mode,body:o}}}),c({type:"text",names:["\\)","\\]"],props:{numArgs:0,allowedInText:!0,allowedInMath:!1},handler(t,r){throw new e(`Mismatched ${t.funcName}`,r)}});c({type:"mathchoice",names:["\\mathchoice"],props:{numArgs:4,primitive:!0},handler:({parser:e},t)=>({type:"mathchoice",mode:e.mode,display:p(t[0]),text:p(t[1]),script:p(t[2]),scriptscript:p(t[3])}),mathmlBuilder:(e,t)=>{const r=((e,t)=>{switch(t.level){case nt:return e.display;case st:return e.text;case ot:return e.script;case at:return e.scriptscript;default:return e.text}})(e,t);return le(r,t)}});const St=["text","textord","mathord","atom"],Ot=e=>{const t=new N.MathNode("mspace");return t.setAttribute("width",e+"em"),t};function Bt(e,t){let r;const n=ie(e.body,t);if("minner"===e.mclass)r=new N.MathNode("mpadded",n);else if("mord"===e.mclass)e.isCharacterBox||"mathord"===n[0].type?(r=n[0],r.type="mi"):r=new N.MathNode("mi",n);else{r=new N.MathNode("mrow",n),e.mustPromote?(r=n[0],r.type="mo",e.isCharacterBox&&e.body[0].text&&/[A-Za-z]/.test(e.body[0].text)&&r.setAttribute("mathvariant","italic")):r=new N.MathNode("mrow",n);const s=t.level<2;"mrow"===r.type?s&&("mbin"===e.mclass?(r.children.unshift(Ot(.2222)),r.children.push(Ot(.2222))):"mrel"===e.mclass?(r.children.unshift(Ot(.2778)),r.children.push(Ot(.2778))):"mpunct"===e.mclass?r.children.push(Ot(.1667)):"minner"===e.mclass&&(r.children.unshift(Ot(.0556)),r.children.push(Ot(.0556)))):"mbin"===e.mclass?(r.attributes.lspace=s?"0.2222em":"0",r.attributes.rspace=s?"0.2222em":"0"):"mrel"===e.mclass?(r.attributes.lspace=s?"0.2778em":"0",r.attributes.rspace=s?"0.2778em":"0"):"mpunct"===e.mclass?(r.attributes.lspace="0em",r.attributes.rspace=s?"0.1667em":"0"):"mopen"===e.mclass||"mclose"===e.mclass?(r.attributes.lspace="0em",r.attributes.rspace="0em"):"minner"===e.mclass&&s&&(r.attributes.lspace="0.0556em",r.attributes.width="+0.1111em"),"mopen"!==e.mclass&&"mclose"!==e.mclass&&(delete r.attributes.stretchy,delete r.attributes.form)}return r}c({type:"mclass",names:["\\mathord","\\mathbin","\\mathrel","\\mathopen","\\mathclose","\\mathpunct","\\mathinner"],props:{numArgs:1,primitive:!0},handler({parser:e,funcName:t},r){const n=r[0],s=o.isCharacterBox(n);let a=!0;const i={type:"mathord",text:"",mode:e.mode},l=n.body?n.body:[n];for(const t of l){if(!St.includes(t.type)){a=!1;break}E[e.mode][t.text]?i.text+=E[e.mode][t.text].replace:t.text?i.text+=t.text:t.body&&t.body.map((e=>{i.text+=e.text}))}return{type:"mclass",mode:e.mode,mclass:"m"+t.slice(5),body:p(a?i:n),isCharacterBox:s,mustPromote:a}},mathmlBuilder:Bt});const Mt=e=>{const t="ordgroup"===e.type&&e.body.length?e.body[0]:e;return"atom"!==t.type||"bin"!==t.family&&"rel"!==t.family?"mord":"m"+t.family};c({type:"mclass",names:["\\@binrel"],props:{numArgs:2},handler:({parser:e},t)=>({type:"mclass",mode:e.mode,mclass:Mt(t[0]),body:p(t[1]),isCharacterBox:o.isCharacterBox(t[1])})}),c({type:"mclass",names:["\\stackrel","\\overset","\\underset"],props:{numArgs:2},handler({parser:e,funcName:t},r){const n=r[1],s=r[0],o={type:"op",mode:n.mode,limits:!0,alwaysHandleSupSub:!0,parentIsSupSub:!1,symbol:!1,stack:!0,suppressBaseShift:"\\stackrel"!==t,body:p(n)};return{type:"supsub",mode:s.mode,base:o,sup:"\\underset"===t?null:s,sub:"\\underset"===t?s:null}},mathmlBuilder:Bt});const Ct=(e,t,r)=>{if(!e)return r;const n=ce(e,t);return"mrow"===n.type&&0===n.children.length?r:n};c({type:"multiscript",names:["\\sideset","\\pres@cript"],props:{numArgs:3},handler({parser:t,funcName:r,token:n},s){if(0===s[2].body.length)throw new e(r+"cannot parse an empty base.");const o=s[2].body[0];if(t.settings.strict&&"\\sideset"===r&&!o.symbol)throw new e("The base of \\sideset must be a big operator. Try \\prescript.");if(s[0].body.length>0&&"supsub"!==s[0].body[0].type||s[1].body.length>0&&"supsub"!==s[1].body[0].type)throw new e("\\sideset can parse only subscripts and superscripts in its first two arguments",n);const a=s[0].body.length>0?s[0].body[0]:null,i=s[1].body.length>0?s[1].body[0]:null;return a||i?a?{type:"multiscript",mode:t.mode,isSideset:"\\sideset"===r,prescripts:a,postscripts:i,base:o}:{type:"styling",mode:t.mode,scriptLevel:"text",body:[{type:"supsub",mode:t.mode,base:o,sup:i.sup,sub:i.sub}]}:o},mathmlBuilder(e,t){const r=ce(e.base,t),n=new N.MathNode("mprescripts"),s=new N.MathNode("none");let o=[];const a=Ct(e.prescripts.sub,t,s),i=Ct(e.prescripts.sup,t,s);if(e.isSideset&&(a.setAttribute("style","text-align: left;"),i.setAttribute("style","text-align: left;")),e.postscripts){o=[r,Ct(e.postscripts.sub,t,s),Ct(e.postscripts.sup,t,s),n,a,i]}else o=[r,n,a,i];return new N.MathNode("mmultiscripts",o)}}),c({type:"not",names:["\\not"],props:{numArgs:1,primitive:!0,allowedInText:!1},handler({parser:e},t){const r=o.isCharacterBox(t[0]);let n;if(r)n=p(t[0]),"\\"===n[0].text.charAt(0)&&(n[0].text=E.math[n[0].text].replace),n[0].text=n[0].text.slice(0,1)+"̸"+n[0].text.slice(1);else{n=[{type:"textord",mode:"math",text:"̸"},{type:"kern",mode:"math",dimension:{number:-.6,unit:"em"}},t[0]]}return{type:"not",mode:e.mode,body:n,isCharacterBox:r}},mathmlBuilder(e,t){if(e.isCharacterBox){return ie(e.body,t,!0)[0]}return le(e.body,t)}});const zt=["textord","mathord","atom"],Et=["\\smallint"],It=["textord","mathord","ordgroup","close","leftright"],Lt=e=>{e.attributes.lspace="0.1667em",e.attributes.rspace="0.1667em"},Ft=(e,t)=>{let r;if(e.symbol)r=new k("mo",[re(e.name,e.mode)]),Et.includes(e.name)?r.setAttribute("largeop","false"):r.setAttribute("movablelimits","false"),e.fromMathOp&&Lt(r);else if(e.body)r=new k("mo",ie(e.body,t)),e.fromMathOp&&Lt(r);else if(r=new k("mi",[new v(e.name.slice(1))]),!e.parentIsSupSub){const t=[r,new k("mo",[re("⁡","text")])];if(e.needsLeadingSpace){const e=new k("mspace");e.setAttribute("width","0.1667em"),t.unshift(e)}if(!e.isFollowedByDelimiter){const e=new k("mspace");e.setAttribute("width","0.1667em"),t.push(e)}r=new k("mrow",t)}return r},$t={"∏":"\\prod","∐":"\\coprod","∑":"\\sum","⋀":"\\bigwedge","⋁":"\\bigvee","⋂":"\\bigcap","⋃":"\\bigcup","⨀":"\\bigodot","⨁":"\\bigoplus","⨂":"\\bigotimes","⨄":"\\biguplus","⨅":"\\bigsqcap","⨆":"\\bigsqcup","⨉":"\\bigtimes"};c({type:"op",names:["\\coprod","\\bigvee","\\bigwedge","\\biguplus","\\bigcap","\\bigcup","\\intop","\\prod","\\sum","\\bigotimes","\\bigoplus","\\bigodot","\\bigsqcap","\\bigsqcup","\\bigtimes","\\smallint","∏","∐","∑","⋀","⋁","⋂","⋃","⨀","⨁","⨂","⨄","⨆"],props:{numArgs:0},handler:({parser:e,funcName:t},r)=>{let n=t;return 1===n.length&&(n=$t[n]),{type:"op",mode:e.mode,limits:!0,parentIsSupSub:!1,symbol:!0,stack:!1,name:n}},mathmlBuilder:Ft}),c({type:"op",names:["\\mathop"],props:{numArgs:1,primitive:!0},handler:({parser:e},t)=>{const r=t[0],n=r.body?r.body:[r],s=1===n.length&&zt.includes(n[0].type);return{type:"op",mode:e.mode,limits:!0,parentIsSupSub:!1,symbol:s,fromMathOp:!0,stack:!1,name:s?n[0].text:null,body:s?null:p(r)}},mathmlBuilder:Ft});const Gt={"∫":"\\int","∬":"\\iint","∭":"\\iiint","∮":"\\oint","∯":"\\oiint","∰":"\\oiiint","∱":"\\intclockwise","∲":"\\varointclockwise","⨌":"\\iiiint","⨍":"\\intbar","⨎":"\\intBar","⨏":"\\fint","⨒":"\\rppolint","⨓":"\\scpolint","⨕":"\\pointint","⨖":"\\sqint","⨗":"\\intlarhk","⨘":"\\intx","⨙":"\\intcap","⨚":"\\intcup"};c({type:"op",names:["\\arcsin","\\arccos","\\arctan","\\arctg","\\arcctg","\\arg","\\ch","\\cos","\\cosec","\\cosh","\\cot","\\cotg","\\coth","\\csc","\\ctg","\\cth","\\deg","\\dim","\\exp","\\hom","\\ker","\\lg","\\ln","\\log","\\sec","\\sin","\\sinh","\\sh","\\sgn","\\tan","\\tanh","\\tg","\\th"],props:{numArgs:0},handler({parser:e,funcName:t}){const r=e.prevAtomType,n=e.gullet.future().text;return{type:"op",mode:e.mode,limits:!1,parentIsSupSub:!1,symbol:!1,stack:!1,isFollowedByDelimiter:Ye(n),needsLeadingSpace:r.length>0&&It.includes(r),name:t}},mathmlBuilder:Ft}),c({type:"op",names:["\\det","\\gcd","\\inf","\\lim","\\max","\\min","\\Pr","\\sup"],props:{numArgs:0},handler({parser:e,funcName:t}){const r=e.prevAtomType,n=e.gullet.future().text;return{type:"op",mode:e.mode,limits:!0,parentIsSupSub:!1,symbol:!1,stack:!1,isFollowedByDelimiter:Ye(n),needsLeadingSpace:r.length>0&&It.includes(r),name:t}},mathmlBuilder:Ft}),c({type:"op",names:["\\int","\\iint","\\iiint","\\iiiint","\\oint","\\oiint","\\oiiint","\\intclockwise","\\varointclockwise","\\intbar","\\intBar","\\fint","\\rppolint","\\scpolint","\\pointint","\\sqint","\\intlarhk","\\intx","\\intcap","\\intcup","∫","∬","∭","∮","∯","∰","∱","∲","⨌","⨍","⨎","⨏","⨒","⨓","⨕","⨖","⨗","⨘","⨙","⨚"],props:{numArgs:0},handler({parser:e,funcName:t}){let r=t;return 1===r.length&&(r=Gt[r]),{type:"op",mode:e.mode,limits:!1,parentIsSupSub:!1,symbol:!0,stack:!1,name:r}},mathmlBuilder:Ft});const Dt={};function Pt(e,t){Dt[e]=t}c({type:"operatorname",names:["\\operatorname@","\\operatornamewithlimits"],props:{numArgs:1,allowedInArgument:!0},handler:({parser:e,funcName:t},r)=>{const n=r[0],s=e.prevAtomType,o=e.gullet.future().text;return{type:"operatorname",mode:e.mode,body:p(n),alwaysHandleSupSub:"\\operatornamewithlimits"===t,limits:!1,parentIsSupSub:!1,isFollowedByDelimiter:Ye(o),needsLeadingSpace:s.length>0&&It.includes(s)}},mathmlBuilder:(e,t)=>{let r,n=ie(e.body,t.withFont("mathrm")),s=!0;for(let e=0;e<n.length;e++){let t=n[e];if(t instanceof N.MathNode)switch("mrow"===t.type&&1===t.children.length&&t.children[0]instanceof N.MathNode&&(t=t.children[0]),t.type){case"mi":case"mn":case"ms":case"mtext":break;case"mspace":if(t.attributes.width){const r=t.attributes.width.replace("em",""),o=Nt(Number(r));""===o?s=!1:n[e]=new N.MathNode("mtext",[new N.TextNode(o)])}break;case"mo":{const e=t.children[0];1===t.children.length&&e instanceof N.TextNode?e.text=e.text.replace(/\u2212/,"-").replace(/\u2217/,"*"):s=!1;break}default:s=!1}else s=!1}if(s){const e=n.map((e=>e.toText())).join("");n=[new N.TextNode(e)]}else if(1===n.length&&["mover","munder"].includes(n[0].type)&&("mi"===n[0].children[0].type||"mtext"===n[0].children[0].type)){if(n[0].children[0].type="mi",e.parentIsSupSub)return new N.MathNode("mrow",n);{const e=new N.MathNode("mo",[re("⁡","text")]);return N.newDocumentFragment([n[0],e])}}if(s?(r=new N.MathNode("mi",n),1===n[0].text.length&&r.setAttribute("mathvariant","normal")):r=new N.MathNode("mrow",n),!e.parentIsSupSub){const t=[r,new N.MathNode("mo",[re("⁡","text")])];if(e.needsLeadingSpace){const e=new N.MathNode("mspace");e.setAttribute("width","0.1667em"),t.unshift(e)}if(!e.isFollowedByDelimiter){const e=new N.MathNode("mspace");e.setAttribute("width","0.1667em"),t.push(e)}return N.newDocumentFragment(t)}return r}}),Pt("\\operatorname","\\@ifstar\\operatornamewithlimits\\operatorname@"),m({type:"ordgroup",mathmlBuilder:(e,t)=>le(e.body,t,e.semisimple)}),c({type:"phantom",names:["\\phantom"],props:{numArgs:1,allowedInText:!0},handler:({parser:e},t)=>{const r=t[0];return{type:"phantom",mode:e.mode,body:p(r)}},mathmlBuilder:(e,t)=>{const r=ie(e.body,t);return new N.MathNode("mphantom",r)}}),c({type:"hphantom",names:["\\hphantom"],props:{numArgs:1,allowedInText:!0},handler:({parser:e},t)=>{const r=t[0];return{type:"hphantom",mode:e.mode,body:r}},mathmlBuilder:(e,t)=>{const r=ie(p(e.body),t),n=new N.MathNode("mphantom",r),s=new N.MathNode("mpadded",[n]);return s.setAttribute("height","0px"),s.setAttribute("depth","0px"),s}}),c({type:"vphantom",names:["\\vphantom"],props:{numArgs:1,allowedInText:!0},handler:({parser:e},t)=>{const r=t[0];return{type:"vphantom",mode:e.mode,body:r}},mathmlBuilder:(e,t)=>{const r=ie(p(e.body),t),n=new N.MathNode("mphantom",r),s=new N.MathNode("mpadded",[n]);return s.setAttribute("width","0px"),s}}),c({type:"pmb",names:["\\pmb"],props:{numArgs:1,allowedInText:!0},handler:({parser:e},t)=>({type:"pmb",mode:e.mode,body:p(t[0])}),mathmlBuilder(e,t){const r=ie(e.body,t),n=A(r);return n.setAttribute("style","font-weight:bold"),n}});const Rt=(e,t)=>{const r=t.withLevel(st),n=new N.MathNode("mpadded",[ce(e.body,r)]),s=ve(e.dy,t);return n.setAttribute("voffset",s.number+s.unit),s.number>0?n.style.padding=s.number+s.unit+" 0 0 0":n.style.padding="0 0 "+Math.abs(s.number)+s.unit+" 0",n};c({type:"raise",names:["\\raise","\\lower"],props:{numArgs:2,argTypes:["size","primitive"],primitive:!0},handler({parser:e,funcName:t},r){const n=Oe(r[0],"size").value;"\\lower"===t&&(n.number*=-1);const s=r[1];return{type:"raise",mode:e.mode,dy:n,body:s}},mathmlBuilder:Rt}),c({type:"raise",names:["\\raisebox"],props:{numArgs:2,argTypes:["size","hbox"],allowedInText:!0},handler({parser:e,funcName:t},r){const n=Oe(r[0],"size").value,s=r[1];return{type:"raise",mode:e.mode,dy:n,body:s}},mathmlBuilder:Rt}),c({type:"ref",names:["\\ref","\\eqref"],props:{numArgs:1,argTypes:["raw"]},handler:({parser:e,funcName:t},r)=>({type:"ref",mode:e.mode,funcName:t,string:r[0].string.replace(Tt,"")}),mathmlBuilder(e,t){const r="\\ref"===e.funcName?["tml-ref"]:["tml-ref","tml-eqref"],n=new N.MathNode("mtext",[new N.TextNode("")],r);return n.setAttribute("href","#"+e.string),n}}),c({type:"internal",names:["\\relax"],props:{numArgs:0,allowedInText:!0},handler:({parser:e})=>({type:"internal",mode:e.mode})}),c({type:"rule",names:["\\rule"],props:{numArgs:2,numOptionalArgs:1,argTypes:["size","size","size"]},handler({parser:e},t,r){const n=r[0],s=Oe(t[0],"size"),o=Oe(t[1],"size");return{type:"rule",mode:e.mode,shift:n&&Oe(n,"size").value,width:s.value,height:o.value}},mathmlBuilder(e,t){const r=ve(e.width,t),n=ve(e.height,t),s=e.shift?ve(e.shift,t):{number:0,unit:"em"},o=t.color&&t.getColor()||"black",a=new N.MathNode("mspace");if(r.number>0&&n.number>0&&a.setAttribute("mathbackground",o),a.setAttribute("width",r.number+r.unit),a.setAttribute("height",n.number+n.unit),0===s.number)return a;const i=new N.MathNode("mpadded",[a]);return s.number>=0?i.setAttribute("height","+"+s.number+s.unit):(i.setAttribute("height",s.number+s.unit),i.setAttribute("depth","+"+-s.number+s.unit)),i.setAttribute("voffset",s.number+s.unit),i}});const jt={"\\tiny":.5,"\\sixptsize":.6,"\\Tiny":.6,"\\scriptsize":.7,"\\footnotesize":.8,"\\small":.9,"\\normalsize":1,"\\large":1.2,"\\Large":1.44,"\\LARGE":1.728,"\\huge":2.074,"\\Huge":2.488};c({type:"sizing",names:["\\tiny","\\sixptsize","\\Tiny","\\scriptsize","\\footnotesize","\\small","\\normalsize","\\large","\\Large","\\LARGE","\\huge","\\Huge"],props:{numArgs:0,allowedInText:!0},handler:({breakOnTokenText:e,funcName:t,parser:r},n)=>{r.settings.strict&&"math"===r.mode&&console.log(`Temml strict-mode warning: Command ${t} is invalid in math mode.`);const s=r.parseExpression(!1,e);return{type:"sizing",mode:r.mode,funcName:t,body:s}},mathmlBuilder:(e,t)=>{const r=t.withFontSize(jt[e.funcName]),n=ie(e.body,r),s=A(n),o=(jt[e.funcName]/t.fontSize).toFixed(4);return s.setAttribute("mathsize",o+"em"),s}}),c({type:"smash",names:["\\smash"],props:{numArgs:1,numOptionalArgs:1,allowedInText:!0},handler:({parser:e},t,r)=>{let n=!1,s=!1;const o=r[0]&&Oe(r[0],"ordgroup");if(o){let e="";for(let t=0;t<o.body.length;++t){if(e=o.body[t].text,"t"===e)n=!0;else{if("b"!==e){n=!1,s=!1;break}s=!0}}}else n=!0,s=!0;const a=t[0];return{type:"smash",mode:e.mode,body:a,smashHeight:n,smashDepth:s}},mathmlBuilder:(e,t)=>{const r=new N.MathNode("mpadded",[ce(e.body,t)]);return e.smashHeight&&r.setAttribute("height","0px"),e.smashDepth&&r.setAttribute("depth","0px"),r}}),c({type:"sqrt",names:["\\sqrt"],props:{numArgs:1,numOptionalArgs:1},handler({parser:e},t,r){const n=r[0],s=t[0];return{type:"sqrt",mode:e.mode,body:s,index:n}},mathmlBuilder(e,t){const{body:r,index:n}=e;return n?new N.MathNode("mroot",[ce(r,t),ce(n,t.incrementLevel())]):new N.MathNode("msqrt",[ce(r,t)])}});const Ut={display:0,text:1,script:2,scriptscript:3},Ht={display:["0","true"],text:["0","false"],script:["1","false"],scriptscript:["2","false"]};c({type:"styling",names:["\\displaystyle","\\textstyle","\\scriptstyle","\\scriptscriptstyle"],props:{numArgs:0,allowedInText:!0,primitive:!0},handler({breakOnTokenText:e,funcName:t,parser:r},n){const s=r.parseExpression(!0,e),o=t.slice(1,t.length-5);return{type:"styling",mode:r.mode,scriptLevel:o,body:s}},mathmlBuilder(e,t){const r=t.withLevel(Ut[e.scriptLevel]),n=ie(e.body,r),s=A(n),o=Ht[e.scriptLevel];return s.setAttribute("scriptlevel",o[0]),s.setAttribute("displaystyle",o[1]),s}});const Vt=/^m(over|under|underover)$/;m({type:"supsub",mathmlBuilder(e,t){let r,n,s=!1,o=!1,a=!1,i=!1;e.base&&"horizBrace"===e.base.type&&(n=!!e.sup,n===e.base.isOver&&(s=!0,r=e.base.isOver)),!e.base||e.base.stack||"op"!==e.base.type&&"operatorname"!==e.base.type||(e.base.parentIsSupSub=!0,o=!e.base.symbol,a=o&&!e.isFollowedByDelimiter,i=e.base.needsLeadingSpace);const l=e.base&&e.base.stack?[ce(e.base.body[0],t)]:[ce(e.base,t)],c=t.inSubOrSup();if(e.sub&&l.push(ce(e.sub,c)),e.sup){const t=ce(e.sup,c),r="mrow"===t.type?t.children[0]:t;"mo"===r.type&&r.classes.includes("tml-prime")&&e.base&&e.base.text&&"f"===e.base.text&&r.classes.push("prime-pad"),l.push(t)}let m;if(s)m=r?"mover":"munder";else if(e.sub)if(e.sup){const r=e.base;m=r&&("op"===r.type&&r.limits||"multiscript"===r.type)&&(t.level===nt||r.alwaysHandleSupSub)||r&&"operatorname"===r.type&&r.alwaysHandleSupSub&&(t.level===nt||r.limits)?"munderover":"msubsup"}else{const r=e.base;m=r&&"op"===r.type&&r.limits&&(t.level===nt||r.alwaysHandleSupSub)||r&&"operatorname"===r.type&&r.alwaysHandleSupSub&&(r.limits||t.level===nt)?"munder":"msub"}else{const r=e.base;m=r&&"op"===r.type&&r.limits&&(t.level===nt||r.alwaysHandleSupSub)||r&&"operatorname"===r.type&&r.alwaysHandleSupSub&&(r.limits||t.level===nt)?"mover":"msup"}let u=new N.MathNode(m,l);if(o){const e=new N.MathNode("mo",[re("⁡","text")]);if(i){const t=new N.MathNode("mspace");t.setAttribute("width","0.1667em"),u=N.newDocumentFragment([t,u,e])}else u=N.newDocumentFragment([u,e]);if(a){const e=new N.MathNode("mspace");e.setAttribute("width","0.1667em"),u.children.push(e)}}else Vt.test(m)&&(u=new N.MathNode("mrow",[u]));return u}});const _t=["\\shortmid","\\nshortmid","\\shortparallel","\\nshortparallel","\\smallsetminus"],Wt=["\\Rsh","\\Lsh","\\restriction"];m({type:"atom",mathmlBuilder(e,t){const r=new N.MathNode("mo",[re(e.text,e.mode)]);return"punct"===e.family?r.setAttribute("separator","true"):"open"===e.family||"close"===e.family?"open"===e.family?(r.setAttribute("form","prefix"),r.setAttribute("stretchy","false")):"close"===e.family&&(r.setAttribute("form","postfix"),r.setAttribute("stretchy","false")):"\\mid"===e.text?(r.setAttribute("lspace","0.22em"),r.setAttribute("rspace","0.22em"),r.setAttribute("stretchy","false")):"rel"===e.family&&(e=>{if(1===e.length){const t=e.codePointAt(0);return 8591<t&&t<8704}return e.indexOf("arrow")>-1||e.indexOf("harpoon")>-1||Wt.includes(e)})(e.text)?r.setAttribute("stretchy","false"):_t.includes(e.text)?r.setAttribute("mathsize","70%"):":"===e.text&&(r.attributes.lspace="0.2222em",r.attributes.rspace="0.2222em"),r}});const Xt={mathbf:"bold",mathrm:"normal",textit:"italic",mathit:"italic",mathnormal:"italic",mathbb:"double-struck",mathcal:"script",mathfrak:"fraktur",mathscr:"script",mathsf:"sans-serif",mathtt:"monospace"},Zt=function(e,t){if("texttt"===t.fontFamily)return"monospace";if("textsc"===t.fontFamily)return"normal";if("textsf"===t.fontFamily)return"textit"===t.fontShape&&"textbf"===t.fontWeight?"sans-serif-bold-italic":"textit"===t.fontShape?"sans-serif-italic":"textbf"===t.fontWeight?"sans-serif-bold":"sans-serif";if("textit"===t.fontShape&&"textbf"===t.fontWeight)return"bold-italic";if("textit"===t.fontShape)return"italic";if("textbf"===t.fontWeight)return"bold";const r=t.font;if(!r||"mathnormal"===r)return null;const n=e.mode;switch(r){case"mathit":case"greekItalic":return"italic";case"mathrm":{const t=e.text.codePointAt(0);return 939<t&&t<975?"italic":"normal"}case"up@greek":return"normal";case"boldsymbol":case"mathboldsymbol":return"bold-italic";case"mathbf":return"bold";case"mathbb":return"double-struck";case"mathfrak":return"fraktur";case"mathscr":case"mathcal":return"script";case"mathsf":return"sans-serif";case"mathtt":return"monospace"}let s=e.text;return E[n][s]&&E[n][s].replace&&(s=E[n][s].replace),Object.prototype.hasOwnProperty.call(Xt,r)?Xt[r]:null},Yt=Object.freeze({B:8426,E:8427,F:8427,H:8387,I:8391,L:8390,M:8422,R:8393,e:8394,g:8355,o:8389}),Kt=Object.freeze({C:8426,H:8388,I:8392,R:8394,Z:8398}),Jt=Object.freeze({C:8383,H:8389,N:8391,P:8393,Q:8393,R:8395,Z:8394}),Qt=Object.freeze({"ϵ":119527,"ϑ":119564,"ϰ":119534,"φ":119577,"ϱ":119535,"ϖ":119563}),er=Object.freeze({"ϵ":119643,"ϑ":119680,"ϰ":119650,"φ":119693,"ϱ":119651,"ϖ":119679}),tr=Object.freeze({"ϵ":119701,"ϑ":119738,"ϰ":119708,"φ":119751,"ϱ":119709,"ϖ":119737}),rr=Object.freeze({"ϵ":119759,"ϑ":119796,"ϰ":119766,"φ":119809,"ϱ":119767,"ϖ":119795}),nr=Object.freeze({upperCaseLatin:{normal:e=>0,bold:e=>119743,italic:e=>119795,"bold-italic":e=>119847,script:e=>Yt[e]||119899,"script-bold":e=>119951,fraktur:e=>Kt[e]||120003,"fraktur-bold":e=>120107,"double-struck":e=>Jt[e]||120055,"sans-serif":e=>120159,"sans-serif-bold":e=>120211,"sans-serif-italic":e=>120263,"sans-serif-bold-italic":e=>120380,monospace:e=>120367},lowerCaseLatin:{normal:e=>0,bold:e=>119737,italic:e=>"h"===e?8358:119789,"bold-italic":e=>119841,script:e=>Yt[e]||119893,"script-bold":e=>119945,fraktur:e=>119997,"fraktur-bold":e=>120101,"double-struck":e=>120049,"sans-serif":e=>120153,"sans-serif-bold":e=>120205,"sans-serif-italic":e=>120257,"sans-serif-bold-italic":e=>120309,monospace:e=>120361},upperCaseGreek:{normal:e=>0,bold:e=>"∇"===e?111802:119575,italic:e=>"∇"===e?111860:119633,"bold-italic":e=>"∇"===e?111802:119575,script:e=>0,"script-bold":e=>0,fraktur:e=>0,"fraktur-bold":e=>0,"double-struck":e=>0,"sans-serif":e=>"∇"===e?111976:119749,"sans-serif-bold":e=>"∇"===e?111976:119749,"sans-serif-italic":e=>0,"sans-serif-bold-italic":e=>"∇"===e?112034:119807,monospace:e=>0},lowerCaseGreek:{normal:e=>0,bold:e=>119569,italic:e=>119627,"bold-italic":e=>"ϕ"===e?119678:119685,script:e=>0,"script-bold":e=>0,fraktur:e=>0,"fraktur-bold":e=>0,"double-struck":e=>0,"sans-serif":e=>119743,"sans-serif-bold":e=>119743,"sans-serif-italic":e=>0,"sans-serif-bold-italic":e=>119801,monospace:e=>0},varGreek:{normal:e=>0,bold:e=>Qt[e]||-51,italic:e=>0,"bold-italic":e=>er[e]||58,script:e=>0,"script-bold":e=>0,fraktur:e=>0,"fraktur-bold":e=>0,"double-struck":e=>0,"sans-serif":e=>tr[e]||116,"sans-serif-bold":e=>tr[e]||116,"sans-serif-italic":e=>0,"sans-serif-bold-italic":e=>rr[e]||174,monospace:e=>0},numeral:{normal:e=>0,bold:e=>120734,italic:e=>0,"bold-italic":e=>0,script:e=>0,"script-bold":e=>0,fraktur:e=>0,"fraktur-bold":e=>0,"double-struck":e=>120744,"sans-serif":e=>120754,"sans-serif-bold":e=>120764,"sans-serif-italic":e=>0,"sans-serif-bold-italic":e=>0,monospace:e=>120774}}),sr=(e,t)=>{const r=e.codePointAt(0),n=64<r&&r<91?"upperCaseLatin":96<r&&r<123?"lowerCaseLatin":912<r&&r<938||"∇"===e?"upperCaseGreek":944<r&&r<970||"ϕ"===e?"lowerCaseGreek":120545<r&&r<120572||Qt[e]?"varGreek":47<r&&r<58?"numeral":"other";return"other"===n?e:String.fromCodePoint(r+nr[n][t](e))},or=Object.freeze({a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ꜰ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"s",t:"ᴛ",u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ"}),ar=/^\d(?:[\d,.]*\d)?$/,ir=/[A-Ba-z]/,lr=new Set(["\\prime","\\dprime","\\trprime","\\qprime","\\backprime","\\backdprime","\\backtrprime"]);m({type:"mathord",mathmlBuilder(e,t){const r=re(e.text,e.mode,t),n=r.text.codePointAt(0),s=912<n&&n<938?"normal":"italic",o=Zt(e,t)||s;if("script"===o)return r.text=sr(r.text,o),new N.MathNode("mi",[r],[t.font]);"italic"!==o&&(r.text=sr(r.text,o));let a=new N.MathNode("mi",[r]);return"normal"===o&&(a.setAttribute("mathvariant","normal"),1===r.text.length&&(a=new N.MathNode("mrow",[a]))),a}}),m({type:"textord",mathmlBuilder(e,t){let r=e.text;const n=r.codePointAt(0);"textsc"===t.fontFamily&&96<n&&n<123&&(r=or[r]);const s=re(r,e.mode,t),o=Zt(e,t)||"normal";let a;if(ar.test(e.text)){const t="text"===e.mode?"mtext":"mn";if("italic"===o||"bold-italic"===o)return((e,t,r)=>{const n=new N.MathNode(r,[e]),s=new N.MathNode("mstyle",[n]);return s.style["font-style"]="italic",s.style["font-family"]="Cambria, 'Times New Roman', serif","bold-italic"===t&&(s.style["font-weight"]="bold"),s})(s,o,t);"normal"!==o&&(s.text=s.text.split("").map((e=>sr(e,o))).join("")),a=new N.MathNode(t,[s])}else if("text"===e.mode)"normal"!==o&&(s.text=sr(s.text,o)),a=new N.MathNode("mtext",[s]);else if(lr.has(e.text))a=new N.MathNode("mo",[s]),a.classes.push("tml-prime");else{const e=s.text;"italic"!==o&&(s.text=sr(s.text,o)),a=new N.MathNode("mi",[s]),s.text===e&&ir.test(e)?a.setAttribute("mathvariant","italic"):"∇"===s.text&&"normal"===o&&a.setAttribute("mathvariant","normal")}return a}});const cr={"\\nobreak":"nobreak","\\allowbreak":"allowbreak"},mr={" ":{},"\\ ":{},"~":{className:"nobreak"},"\\space":{},"\\nobreakspace":{className:"nobreak"}};m({type:"spacing",mathmlBuilder(t,r){let n;if(Object.prototype.hasOwnProperty.call(mr,t.text))n=new N.MathNode("mtext",[new N.TextNode(" ")]);else{if(!Object.prototype.hasOwnProperty.call(cr,t.text))throw new e(`Unknown type of space "${t.text}"`);n=new N.MathNode("mo"),"\\nobreak"===t.text&&n.setAttribute("linebreak","nobreak")}return n}}),m({type:"tag"});const ur={"\\text":void 0,"\\textrm":"textrm","\\textsf":"textsf","\\texttt":"texttt","\\textnormal":"textrm","\\textsc":"textsc"},pr={"\\textbf":"textbf","\\textmd":"textmd"},dr={"\\textit":"textit","\\textup":"textup"};c({type:"text",names:["\\text","\\textrm","\\textsf","\\texttt","\\textnormal","\\textsc","\\textbf","\\textmd","\\textit","\\textup"],props:{numArgs:1,argTypes:["text"],allowedInArgument:!0,allowedInText:!0},handler({parser:e,funcName:t},r){const n=r[0];return{type:"text",mode:e.mode,body:p(n),font:t}},mathmlBuilder(e,t){const r=((e,t)=>{const r=e.font;return r?ur[r]?t.withTextFontFamily(ur[r]):pr[r]?t.withTextFontWeight(pr[r]):t.withTextFontShape(dr[r]):t})(e,t),n=le(e.body,r);return ne(n)}}),c({type:"verb",names:["\\verb"],props:{numArgs:0,allowedInText:!0},handler(t,r,n){throw new e("\\verb ended by end of line instead of matching delimiter")},mathmlBuilder(e,t){const r=new N.TextNode(hr(e)),n=new N.MathNode("mtext",[r]);return n.setAttribute("mathvariant","monospace"),n}});const hr=e=>e.body.replace(/ /g,e.star?"␣":" "),gr=i;class fr{constructor(e,t,r){this.lexer=e,this.start=t,this.end=r}static range(e,t){return t?e&&e.loc&&t.loc&&e.loc.lexer===t.loc.lexer?new fr(e.loc.lexer,e.loc.start,t.loc.end):null:e&&e.loc}}class br{constructor(e,t){this.text=e,this.loc=t}range(e,t){return new br(t,fr.range(this,e))}}const yr="[ \r\n\t]",xr=`(\\\\[a-zA-Z@]+)${yr}*`,wr="[̀-ͯ]",kr=new RegExp(`${wr}+$`),vr=`(${yr}+)|\\\\(\n|[ \r\t]+\n?)[ \r\t]*|([!-\\[\\]-‧‪-퟿豈-￿]${wr}*|[\ud800-\udbff][\udc00-\udfff]${wr}*|\\\\verb\\*([^]).*?\\4|\\\\verb([^*a-zA-Z]).*?\\5|${xr}|\\\\[^\ud800-\udfff])`;class Ar{constructor(e,t){this.input=e,this.settings=t,this.tokenRegex=new RegExp(vr,"g"),this.catcodes={"%":14,"~":13}}setCatcode(e,t){this.catcodes[e]=t}lex(){const t=this.input,r=this.tokenRegex.lastIndex;if(r===t.length)return new br("EOF",new fr(this,r,r));const n=this.tokenRegex.exec(t);if(null===n||n.index!==r)throw new e(`Unexpected character: '${t[r]}'`,new br(t[r],new fr(this,r,r+1)));const s=n[6]||n[3]||(n[2]?"\\ ":" ");if(14===this.catcodes[s]){const r=t.indexOf("\n",this.tokenRegex.lastIndex);if(-1===r){if(this.tokenRegex.lastIndex=t.length,this.settings.strict)throw new e("% comment has no terminating newline; LaTeX would fail because of commenting the end of math mode")}else this.tokenRegex.lastIndex=r+1;return this.lex()}return new br(s,new fr(this,r,this.tokenRegex.lastIndex))}}class Nr{constructor(e={},t={}){this.current=t,this.builtins=e,this.undefStack=[]}beginGroup(){this.undefStack.push({})}endGroup(){if(0===this.undefStack.length)throw new e("Unbalanced namespace destruction: attempt to pop global namespace; please report this as a bug");const t=this.undefStack.pop();for(const e in t)Object.prototype.hasOwnProperty.call(t,e)&&(void 0===t[e]?delete this.current[e]:this.current[e]=t[e])}has(e){return Object.prototype.hasOwnProperty.call(this.current,e)||Object.prototype.hasOwnProperty.call(this.builtins,e)}get(e){return Object.prototype.hasOwnProperty.call(this.current,e)?this.current[e]:this.builtins[e]}set(e,t,r=!1){if(r){for(let t=0;t<this.undefStack.length;t++)delete this.undefStack[t][e];this.undefStack.length>0&&(this.undefStack[this.undefStack.length-1][e]=t)}else{const t=this.undefStack[this.undefStack.length-1];t&&!Object.prototype.hasOwnProperty.call(t,e)&&(t[e]=this.current[e])}this.current[e]=t}}const Tr=Dt;Pt("\\noexpand",(function(e){const t=e.popToken();return e.isExpandable(t.text)&&(t.noexpand=!0,t.treatAsRelax=!0),{tokens:[t],numArgs:0}})),Pt("\\expandafter",(function(e){const t=e.popToken();return e.expandOnce(!0),{tokens:[t],numArgs:0}})),Pt("\\@firstoftwo",(function(e){return{tokens:e.consumeArgs(2)[0],numArgs:0}})),Pt("\\@secondoftwo",(function(e){return{tokens:e.consumeArgs(2)[1],numArgs:0}})),Pt("\\@ifnextchar",(function(e){const t=e.consumeArgs(3);e.consumeSpaces();const r=e.future();return 1===t[0].length&&t[0][0].text===r.text?{tokens:t[1],numArgs:0}:{tokens:t[2],numArgs:0}})),Pt("\\@ifstar","\\@ifnextchar *{\\@firstoftwo{#1}}"),Pt("\\TextOrMath",(function(e){const t=e.consumeArgs(2);return"text"===e.mode?{tokens:t[0],numArgs:0}:{tokens:t[1],numArgs:0}}));const qr={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,a:10,A:10,b:11,B:11,c:12,C:12,d:13,D:13,e:14,E:14,f:15,F:15},Sr=e=>{const t=e.future().text;return"EOF"===t?[null,""]:[qr[t.charAt(0)],t]},Or=(e,t,r)=>{for(let n=1;n<t.length;n++){e*=r,e+=qr[t.charAt(n)]}return e};Pt("\\char",(function(t){let r,n=t.popToken(),s="";if("'"===n.text)r=8,n=t.popToken();else if('"'===n.text)r=16,n=t.popToken();else if("`"===n.text)if(n=t.popToken(),"\\"===n.text[0])s=n.text.charCodeAt(1);else{if("EOF"===n.text)throw new e("\\char` missing argument");s=n.text.charCodeAt(0)}else r=10;if(r){let o,a=n.text;if(s=qr[a.charAt(0)],null==s||s>=r)throw new e(`Invalid base-${r} digit ${n.text}`);for(s=Or(s,a,r),[o,a]=Sr(t);null!=o&&o<r;)s*=r,s+=o,s=Or(s,a,r),t.popToken(),[o,a]=Sr(t)}return`\\@char{${s}}`})),Pt("\\surd","\\sqrt{\\vphantom{|}}"),Pt("⊕","\\oplus"),Pt("/","{⁄}"),Pt("\\long",""),Pt("\\bgroup","{"),Pt("\\egroup","}"),Pt("~","\\nobreakspace"),Pt("\\lq","`"),Pt("\\rq","'"),Pt("\\aa","\\r a"),Pt("\\Bbbk","\\Bbb{k}"),Pt("\\mathstrut","\\vphantom{(}"),Pt("\\underbar","\\underline{\\text{#1}}"),Pt("\\vdots","{\\varvdots\\rule{0pt}{15pt}}"),Pt("⋮","\\vdots"),Pt("\\substack","\\begin{subarray}{c}#1\\end{subarray}"),Pt("\\iff","\\DOTSB\\;\\Longleftrightarrow\\;"),Pt("\\implies","\\DOTSB\\;\\Longrightarrow\\;"),Pt("\\impliedby","\\DOTSB\\;\\Longleftarrow\\;");const Br={",":"\\dotsc","\\not":"\\dotsb","+":"\\dotsb","=":"\\dotsb","<":"\\dotsb",">":"\\dotsb","-":"\\dotsb","*":"\\dotsb",":":"\\dotsb","\\DOTSB":"\\dotsb","\\coprod":"\\dotsb","\\bigvee":"\\dotsb","\\bigwedge":"\\dotsb","\\biguplus":"\\dotsb","\\bigcap":"\\dotsb","\\bigcup":"\\dotsb","\\prod":"\\dotsb","\\sum":"\\dotsb","\\bigotimes":"\\dotsb","\\bigoplus":"\\dotsb","\\bigodot":"\\dotsb","\\bigsqcap":"\\dotsb","\\bigsqcup":"\\dotsb","\\bigtimes":"\\dotsb","\\And":"\\dotsb","\\longrightarrow":"\\dotsb","\\Longrightarrow":"\\dotsb","\\longleftarrow":"\\dotsb","\\Longleftarrow":"\\dotsb","\\longleftrightarrow":"\\dotsb","\\Longleftrightarrow":"\\dotsb","\\mapsto":"\\dotsb","\\longmapsto":"\\dotsb","\\hookrightarrow":"\\dotsb","\\doteq":"\\dotsb","\\mathbin":"\\dotsb","\\mathrel":"\\dotsb","\\relbar":"\\dotsb","\\Relbar":"\\dotsb","\\xrightarrow":"\\dotsb","\\xleftarrow":"\\dotsb","\\DOTSI":"\\dotsi","\\int":"\\dotsi","\\oint":"\\dotsi","\\iint":"\\dotsi","\\iiint":"\\dotsi","\\iiiint":"\\dotsi","\\idotsint":"\\dotsi","\\DOTSX":"\\dotsx"};Pt("\\dots",(function(e){let t="\\dotso";const r=e.expandAfterFuture().text;return r in Br?t=Br[r]:("\\not"===r.slice(0,4)||r in E.math&&["bin","rel"].includes(E.math[r].group))&&(t="\\dotsb"),t}));const Mr={")":!0,"]":!0,"\\rbrack":!0,"\\}":!0,"\\rbrace":!0,"\\rangle":!0,"\\rceil":!0,"\\rfloor":!0,"\\rgroup":!0,"\\rmoustache":!0,"\\right":!0,"\\bigr":!0,"\\biggr":!0,"\\Bigr":!0,"\\Biggr":!0,$:!0,";":!0,".":!0,",":!0};Pt("\\dotso",(function(e){return e.future().text in Mr?"\\ldots\\,":"\\ldots"})),Pt("\\dotsc",(function(e){const t=e.future().text;return t in Mr&&","!==t?"\\ldots\\,":"\\ldots"})),Pt("\\cdots",(function(e){return e.future().text in Mr?"\\@cdots\\,":"\\@cdots"})),Pt("\\dotsb","\\cdots"),Pt("\\dotsm","\\cdots"),Pt("\\dotsi","\\!\\cdots"),Pt("\\idotsint","\\dotsi"),Pt("\\dotsx","\\ldots\\,"),Pt("\\DOTSI","\\relax"),Pt("\\DOTSB","\\relax"),Pt("\\DOTSX","\\relax"),Pt("\\tmspace","\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax"),Pt("\\,","{\\tmspace+{3mu}{.1667em}}"),Pt("\\thinspace","\\,"),Pt("\\>","\\mskip{4mu}"),Pt("\\:","{\\tmspace+{4mu}{.2222em}}"),Pt("\\medspace","\\:"),Pt("\\;","{\\tmspace+{5mu}{.2777em}}"),Pt("\\thickspace","\\;"),Pt("\\!","{\\tmspace-{3mu}{.1667em}}"),Pt("\\negthinspace","\\!"),Pt("\\negmedspace","{\\tmspace-{4mu}{.2222em}}"),Pt("\\negthickspace","{\\tmspace-{5mu}{.277em}}"),Pt("\\enspace","\\kern.5em "),Pt("\\enskip","\\hskip.5em\\relax"),Pt("\\quad","\\hskip1em\\relax"),Pt("\\qquad","\\hskip2em\\relax"),Pt("\\AA","\\TextOrMath{\\Angstrom}{\\mathring{A}}\\relax"),Pt("\\tag","\\@ifstar\\tag@literal\\tag@paren"),Pt("\\tag@paren","\\tag@literal{({#1})}"),Pt("\\tag@literal",(t=>{if(t.macros.get("\\df@tag"))throw new e("Multiple \\tag");return"\\def\\df@tag{\\text{#1}}"})),Pt("\\bmod","\\mathbin{\\text{mod}}"),Pt("\\pod","\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)"),Pt("\\pmod","\\pod{{\\rm mod}\\mkern6mu#1}"),Pt("\\mod","\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}{\\rm mod}\\,\\,#1"),Pt("\\newline","\\\\\\relax"),Pt("\\TeX","\\textrm{T}\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125em\\textrm{X}"),Pt("\\LaTeX","\\textrm{L}\\kern-.35em\\raisebox{0.2em}{\\scriptstyle A}\\kern-.15em\\TeX"),Pt("\\Temml","\\textrm{T}\\kern-0.2em\\lower{0.2em}{\\textrm{E}}\\kern-0.08em{\\textrm{M}\\kern-0.08em\\raise{0.2em}\\textrm{M}\\kern-0.08em\\textrm{L}}"),Pt("\\hspace","\\@ifstar\\@hspacer\\@hspace"),Pt("\\@hspace","\\hskip #1\\relax"),Pt("\\@hspacer","\\rule{0pt}{0pt}\\hskip #1\\relax"),Pt("\\colon",'\\mathpunct{\\char"3a}'),Pt("\\prescript","\\pres@cript{_{#1}^{#2}}{}{#3}"),Pt("\\ordinarycolon",'\\char"3a'),Pt("\\vcentcolon","\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}}"),Pt("\\coloneq",'\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"2212}'),Pt("\\Coloneq",'\\mathrel{\\char"2237\\char"2212}'),Pt("\\Eqqcolon",'\\mathrel{\\char"3d\\char"2237}'),Pt("\\Eqcolon",'\\mathrel{\\char"2212\\char"2237}'),Pt("\\colonapprox",'\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"2248}'),Pt("\\Colonapprox",'\\mathrel{\\char"2237\\char"2248}'),Pt("\\colonsim",'\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"223c}'),Pt("\\Colonsim",'\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"223c}'),Pt("\\ratio","\\vcentcolon"),Pt("\\coloncolon","\\dblcolon"),Pt("\\colonequals","\\coloneqq"),Pt("\\coloncolonequals","\\Coloneqq"),Pt("\\equalscolon","\\eqqcolon"),Pt("\\equalscoloncolon","\\Eqqcolon"),Pt("\\colonminus","\\coloneq"),Pt("\\coloncolonminus","\\Coloneq"),Pt("\\minuscolon","\\eqcolon"),Pt("\\minuscoloncolon","\\Eqcolon"),Pt("\\coloncolonapprox","\\Colonapprox"),Pt("\\coloncolonsim","\\Colonsim"),Pt("\\notni","\\mathrel{\\char`∌}"),Pt("\\limsup","\\DOTSB\\operatorname*{lim\\,sup}"),Pt("\\liminf","\\DOTSB\\operatorname*{lim\\,inf}"),Pt("\\injlim","\\DOTSB\\operatorname*{inj\\,lim}"),Pt("\\projlim","\\DOTSB\\operatorname*{proj\\,lim}"),Pt("\\varlimsup","\\DOTSB\\operatorname*{\\overline{\\text{lim}}}"),Pt("\\varliminf","\\DOTSB\\operatorname*{\\underline{\\text{lim}}}"),Pt("\\varinjlim","\\DOTSB\\operatorname*{\\underrightarrow{\\text{lim}}}"),Pt("\\varprojlim","\\DOTSB\\operatorname*{\\underleftarrow{\\text{lim}}}"),Pt("\\centerdot","{\\medspace\\rule{0.167em}{0.189em}\\medspace}"),Pt("\\argmin","\\DOTSB\\operatorname*{arg\\,min}"),Pt("\\argmax","\\DOTSB\\operatorname*{arg\\,max}"),Pt("\\plim","\\DOTSB\\operatorname*{plim}"),Pt("\\bra","\\mathinner{\\langle{#1}|}"),Pt("\\ket","\\mathinner{|{#1}\\rangle}"),Pt("\\braket","\\mathinner{\\langle{#1}\\rangle}"),Pt("\\Bra","\\left\\langle#1\\right|"),Pt("\\Ket","\\left|#1\\right\\rangle");const Cr=e=>t=>{const r=t.consumeArg().tokens,n=t.consumeArg().tokens,s=t.consumeArg().tokens,o=t.consumeArg().tokens,a=t.macros.get("|"),i=t.macros.get("\\|");t.macros.beginGroup();const l=t=>r=>{e&&(r.macros.set("|",a),s.length&&r.macros.set("\\|",i));let o=t;if(!t&&s.length){"|"===r.future().text&&(r.popToken(),o=!0)}return{tokens:o?s:n,numArgs:0}};t.macros.set("|",l(!1)),s.length&&t.macros.set("\\|",l(!0));const c=t.consumeArg().tokens,m=t.expandTokens([...o,...c,...r]);return t.macros.endGroup(),{tokens:m.reverse(),numArgs:0}};Pt("\\bra@ket",Cr(!1)),Pt("\\bra@set",Cr(!0)),Pt("\\Braket","\\bra@ket{\\left\\langle}{\\,\\middle\\vert\\,}{\\,\\middle\\vert\\,}{\\right\\rangle}"),Pt("\\Set","\\bra@set{\\left\\{\\:}{\\;\\middle\\vert\\;}{\\;\\middle\\Vert\\;}{\\:\\right\\}}"),Pt("\\set","\\bra@set{\\{\\,}{\\mid}{}{\\,\\}}"),Pt("\\angln","{\\angl n}"),Pt("\\odv","\\@ifstar\\odv@next\\odv@numerator"),Pt("\\odv@numerator","\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}"),Pt("\\odv@next","\\frac{\\mathrm{d}}{\\mathrm{d}#2}#1"),Pt("\\pdv","\\@ifstar\\pdv@next\\pdv@numerator");const zr=e=>{const t=e[0][0].text,r=(e=>{let t="";for(let r=e.length-1;r>-1;r--)t+=e[r].text;return t})(e[1]).split(","),n=String(r.length),s="1"===n?"\\partial":`\\partial^${n}`;let o="";return r.map((e=>{o+="\\partial "+e.trim()+"\\,"})),[t,s,o.replace(/\\,$/,"")]};Pt("\\pdv@numerator",(function(e){const[t,r,n]=zr(e.consumeArgs(2));return`\\frac{${r} ${t}}{${n}}`})),Pt("\\pdv@next",(function(e){const[t,r,n]=zr(e.consumeArgs(2));return`\\frac{${r}}{${n}} ${t}`})),Pt("\\upalpha","\\up@greek{\\alpha}"),Pt("\\upbeta","\\up@greek{\\beta}"),Pt("\\upgamma","\\up@greek{\\gamma}"),Pt("\\updelta","\\up@greek{\\delta}"),Pt("\\upepsilon","\\up@greek{\\epsilon}"),Pt("\\upzeta","\\up@greek{\\zeta}"),Pt("\\upeta","\\up@greek{\\eta}"),Pt("\\uptheta","\\up@greek{\\theta}"),Pt("\\upiota","\\up@greek{\\iota}"),Pt("\\upkappa","\\up@greek{\\kappa}"),Pt("\\uplambda","\\up@greek{\\lambda}"),Pt("\\upmu","\\up@greek{\\mu}"),Pt("\\upnu","\\up@greek{\\nu}"),Pt("\\upxi","\\up@greek{\\xi}"),Pt("\\upomicron","\\up@greek{\\omicron}"),Pt("\\uppi","\\up@greek{\\pi}"),Pt("\\upalpha","\\up@greek{\\alpha}"),Pt("\\uprho","\\up@greek{\\rho}"),Pt("\\upsigma","\\up@greek{\\sigma}"),Pt("\\uptau","\\up@greek{\\tau}"),Pt("\\upupsilon","\\up@greek{\\upsilon}"),Pt("\\upphi","\\up@greek{\\phi}"),Pt("\\upchi","\\up@greek{\\chi}"),Pt("\\uppsi","\\up@greek{\\psi}"),Pt("\\upomega","\\up@greek{\\omega}"),Pt("\\invamp",'\\mathbin{\\char"214b}'),Pt("\\parr",'\\mathbin{\\char"214b}'),Pt("\\with",'\\mathbin{\\char"26}'),Pt("\\multimapinv",'\\mathrel{\\char"27dc}'),Pt("\\multimapboth",'\\mathrel{\\char"29df}'),Pt("\\scoh",'{\\mkern5mu\\char"2322\\mkern5mu}'),Pt("\\sincoh",'{\\mkern5mu\\char"2323\\mkern5mu}'),Pt("\\coh",'{\\mkern5mu\\rule{}{0.7em}\\mathrlap{\\smash{\\raise2mu{\\char"2322}}}\n{\\smash{\\lower4mu{\\char"2323}}}\\mkern5mu}'),Pt("\\incoh",'{\\mkern5mu\\rule{}{0.7em}\\mathrlap{\\smash{\\raise2mu{\\char"2323}}}\n{\\smash{\\lower4mu{\\char"2322}}}\\mkern5mu}'),Pt("\\standardstate","\\text{\\tiny\\char`⦵}");const Er={"^":!0,_:!0,"\\limits":!0,"\\nolimits":!0};class Ir{constructor(e,t,r){this.settings=t,this.expansionCount=0,this.feed(e),this.macros=new Nr(Tr,t.macros),this.mode=r,this.stack=[]}feed(e){this.lexer=new Ar(e,this.settings)}switchMode(e){this.mode=e}beginGroup(){this.macros.beginGroup()}endGroup(){this.macros.endGroup()}future(){return 0===this.stack.length&&this.pushToken(this.lexer.lex()),this.stack[this.stack.length-1]}popToken(){return this.future(),this.stack.pop()}pushToken(e){this.stack.push(e)}pushTokens(e){this.stack.push(...e)}scanArgument(e){let t,r,n;if(e){if(this.consumeSpaces(),"["!==this.future().text)return null;t=this.popToken(),({tokens:n,end:r}=this.consumeArg(["]"]))}else({tokens:n,start:t,end:r}=this.consumeArg());return this.pushToken(new br("EOF",r.loc)),this.pushTokens(n),t.range(r,"")}consumeSpaces(){for(;;){if(" "!==this.future().text)break;this.stack.pop()}}consumeArg(t){const r=[],n=t&&t.length>0;n||this.consumeSpaces();const s=this.future();let o,a=0,i=0;do{if(o=this.popToken(),r.push(o),"{"===o.text)++a;else if("}"===o.text){if(--a,-1===a)throw new e("Extra }",o)}else if("EOF"===o.text)throw new e("Unexpected end of input in a macro argument, expected '"+(t&&n?t[i]:"}")+"'",o);if(t&&n)if((0===a||1===a&&"{"===t[i])&&o.text===t[i]){if(++i,i===t.length){r.splice(-i,i);break}}else i=0}while(0!==a||n);return"{"===s.text&&"}"===r[r.length-1].text&&(r.pop(),r.shift()),r.reverse(),{tokens:r,start:s,end:o}}consumeArgs(t,r){if(r){if(r.length!==t+1)throw new e("The length of delimiters doesn't match the number of args!");const n=r[0];for(let t=0;t<n.length;t++){const r=this.popToken();if(n[t]!==r.text)throw new e("Use of the macro doesn't match its definition",r)}}const n=[];for(let e=0;e<t;e++)n.push(this.consumeArg(r&&r[e+1]).tokens);return n}expandOnce(t){const r=this.popToken(),n=r.text,s=r.noexpand?null:this._getExpansion(n);if(null==s||t&&s.unexpandable){if(t&&null==s&&"\\"===n[0]&&!this.isDefined(n))throw new e("Undefined control sequence: "+n);return this.pushToken(r),!1}if(this.expansionCount++,this.expansionCount>this.settings.maxExpand)throw new e("Too many expansions: infinite loop or need to increase maxExpand setting");let o=s.tokens;const a=this.consumeArgs(s.numArgs,s.delimiters);if(s.numArgs){o=o.slice();for(let t=o.length-1;t>=0;--t){let r=o[t];if("#"===r.text){if(0===t)throw new e("Incomplete placeholder at end of macro body",r);if(r=o[--t],"#"===r.text)o.splice(t+1,1);else{if(!/^[1-9]$/.test(r.text))throw new e("Not a valid argument number",r);o.splice(t,2,...a[+r.text-1])}}}}return this.pushTokens(o),o.length}expandAfterFuture(){return this.expandOnce(),this.future()}expandNextToken(){for(;;)if(!1===this.expandOnce()){const e=this.stack.pop();return e.treatAsRelax&&(e.text="\\relax"),e}throw new Error}expandMacro(e){return this.macros.has(e)?this.expandTokens([new br(e)]):void 0}expandTokens(e){const t=[],r=this.stack.length;for(this.pushTokens(e);this.stack.length>r;)if(!1===this.expandOnce(!0)){const e=this.stack.pop();e.treatAsRelax&&(e.noexpand=!1,e.treatAsRelax=!1),t.push(e)}return t}expandMacroAsText(e){const t=this.expandMacro(e);return t?t.map((e=>e.text)).join(""):t}_getExpansion(e){const t=this.macros.get(e);if(null==t)return t;if(1===e.length){const t=this.lexer.catcodes[e];if(null!=t&&13!==t)return}const r="function"==typeof t?t(this):t;if("string"==typeof r){let e=0;if(-1!==r.indexOf("#")){const t=r.replace(/##/g,"");for(;-1!==t.indexOf("#"+(e+1));)++e}const t=new Ar(r,this.settings),n=[];let s=t.lex();for(;"EOF"!==s.text;)n.push(s),s=t.lex();n.reverse();return{tokens:n,numArgs:e}}return r}isDefined(e){return this.macros.has(e)||Object.prototype.hasOwnProperty.call(gr,e)||Object.prototype.hasOwnProperty.call(E.math,e)||Object.prototype.hasOwnProperty.call(E.text,e)||Object.prototype.hasOwnProperty.call(Er,e)}isExpandable(e){const t=this.macros.get(e);return null!=t?"string"==typeof t||"function"==typeof t||!t.unexpandable:Object.prototype.hasOwnProperty.call(gr,e)&&!gr[e].primitive}}const Lr=/^[₊₋₌₍₎₀₁₂₃₄₅₆₇₈₉ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵦᵧᵨᵩᵪ]/,Fr=Object.freeze({"₊":"+","₋":"-","₌":"=","₍":"(","₎":")","₀":"0","₁":"1","₂":"2","₃":"3","₄":"4","₅":"5","₆":"6","₇":"7","₈":"8","₉":"9","ₐ":"a","ₑ":"e","ₕ":"h","ᵢ":"i","ⱼ":"j","ₖ":"k","ₗ":"l","ₘ":"m","ₙ":"n","ₒ":"o","ₚ":"p","ᵣ":"r","ₛ":"s","ₜ":"t","ᵤ":"u","ᵥ":"v","ₓ":"x","ᵦ":"β","ᵧ":"γ","ᵨ":"ρ","ᵩ":"ϕ","ᵪ":"χ","⁺":"+","⁻":"-","⁼":"=","⁽":"(","⁾":")","⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9","ᴬ":"A","ᴮ":"B","ᴰ":"D","ᴱ":"E","ᴳ":"G","ᴴ":"H","ᴵ":"I","ᴶ":"J","ᴷ":"K","ᴸ":"L","ᴹ":"M","ᴺ":"N","ᴼ":"O","ᴾ":"P","ᴿ":"R","ᵀ":"T","ᵁ":"U","ⱽ":"V","ᵂ":"W","ᵃ":"a","ᵇ":"b","ᶜ":"c","ᵈ":"d","ᵉ":"e","ᶠ":"f","ᵍ":"g","ʰ":"h","ⁱ":"i","ʲ":"j","ᵏ":"k","ˡ":"l","ᵐ":"m","ⁿ":"n","ᵒ":"o","ᵖ":"p","ʳ":"r","ˢ":"s","ᵗ":"t","ᵘ":"u","ᵛ":"v","ʷ":"w","ˣ":"x","ʸ":"y","ᶻ":"z","ᵝ":"β","ᵞ":"γ","ᵟ":"δ","ᵠ":"ϕ","ᵡ":"χ","ᶿ":"θ"}),$r=Object.freeze({"𝒜":"A","ℬ":"B","𝒞":"C","𝒟":"D","ℰ":"E","ℱ":"F","𝒢":"G","ℋ":"H","ℐ":"I","𝒥":"J","𝒦":"K","ℒ":"L","ℳ":"M","𝒩":"N","𝒪":"O","𝒫":"P","𝒬":"Q","ℛ":"R","𝒮":"S","𝒯":"T","𝒰":"U","𝒱":"V","𝒲":"W","𝒳":"X","𝒴":"Y","𝒵":"Z"});var Gr={"́":{text:"\\'",math:"\\acute"},"̀":{text:"\\`",math:"\\grave"},"̈":{text:'\\"',math:"\\ddot"},"̃":{text:"\\~",math:"\\tilde"},"̄":{text:"\\=",math:"\\bar"},"̆":{text:"\\u",math:"\\breve"},"̌":{text:"\\v",math:"\\check"},"̂":{text:"\\^",math:"\\hat"},"̇":{text:"\\.",math:"\\dot"},"̊":{text:"\\r",math:"\\mathring"},"̋":{text:"\\H"},"̧":{text:"\\c"}},Dr={"á":"á","à":"à","ä":"ä","ǟ":"ǟ","ã":"ã","ā":"ā","ă":"ă","ắ":"ắ","ằ":"ằ","ẵ":"ẵ","ǎ":"ǎ","â":"â","ấ":"ấ","ầ":"ầ","ẫ":"ẫ","ȧ":"ȧ","ǡ":"ǡ","å":"å","ǻ":"ǻ","ḃ":"ḃ","ć":"ć","č":"č","ĉ":"ĉ","ċ":"ċ","ď":"ď","ḋ":"ḋ","é":"é","è":"è","ë":"ë","ẽ":"ẽ","ē":"ē","ḗ":"ḗ","ḕ":"ḕ","ĕ":"ĕ","ě":"ě","ê":"ê","ế":"ế","ề":"ề","ễ":"ễ","ė":"ė","ḟ":"ḟ","ǵ":"ǵ","ḡ":"ḡ","ğ":"ğ","ǧ":"ǧ","ĝ":"ĝ","ġ":"ġ","ḧ":"ḧ","ȟ":"ȟ","ĥ":"ĥ","ḣ":"ḣ","í":"í","ì":"ì","ï":"ï","ḯ":"ḯ","ĩ":"ĩ","ī":"ī","ĭ":"ĭ","ǐ":"ǐ","î":"î","ǰ":"ǰ","ĵ":"ĵ","ḱ":"ḱ","ǩ":"ǩ","ĺ":"ĺ","ľ":"ľ","ḿ":"ḿ","ṁ":"ṁ","ń":"ń","ǹ":"ǹ","ñ":"ñ","ň":"ň","ṅ":"ṅ","ó":"ó","ò":"ò","ö":"ö","ȫ":"ȫ","õ":"õ","ṍ":"ṍ","ṏ":"ṏ","ȭ":"ȭ","ō":"ō","ṓ":"ṓ","ṑ":"ṑ","ŏ":"ŏ","ǒ":"ǒ","ô":"ô","ố":"ố","ồ":"ồ","ỗ":"ỗ","ȯ":"ȯ","ȱ":"ȱ","ő":"ő","ṕ":"ṕ","ṗ":"ṗ","ŕ":"ŕ","ř":"ř","ṙ":"ṙ","ś":"ś","ṥ":"ṥ","š":"š","ṧ":"ṧ","ŝ":"ŝ","ṡ":"ṡ","ẗ":"ẗ","ť":"ť","ṫ":"ṫ","ú":"ú","ù":"ù","ü":"ü","ǘ":"ǘ","ǜ":"ǜ","ǖ":"ǖ","ǚ":"ǚ","ũ":"ũ","ṹ":"ṹ","ū":"ū","ṻ":"ṻ","ŭ":"ŭ","ǔ":"ǔ","û":"û","ů":"ů","ű":"ű","ṽ":"ṽ","ẃ":"ẃ","ẁ":"ẁ","ẅ":"ẅ","ŵ":"ŵ","ẇ":"ẇ","ẘ":"ẘ","ẍ":"ẍ","ẋ":"ẋ","ý":"ý","ỳ":"ỳ","ÿ":"ÿ","ỹ":"ỹ","ȳ":"ȳ","ŷ":"ŷ","ẏ":"ẏ","ẙ":"ẙ","ź":"ź","ž":"ž","ẑ":"ẑ","ż":"ż","Á":"Á","À":"À","Ä":"Ä","Ǟ":"Ǟ","Ã":"Ã","Ā":"Ā","Ă":"Ă","Ắ":"Ắ","Ằ":"Ằ","Ẵ":"Ẵ","Ǎ":"Ǎ","Â":"Â","Ấ":"Ấ","Ầ":"Ầ","Ẫ":"Ẫ","Ȧ":"Ȧ","Ǡ":"Ǡ","Å":"Å","Ǻ":"Ǻ","Ḃ":"Ḃ","Ć":"Ć","Č":"Č","Ĉ":"Ĉ","Ċ":"Ċ","Ď":"Ď","Ḋ":"Ḋ","É":"É","È":"È","Ë":"Ë","Ẽ":"Ẽ","Ē":"Ē","Ḗ":"Ḗ","Ḕ":"Ḕ","Ĕ":"Ĕ","Ě":"Ě","Ê":"Ê","Ế":"Ế","Ề":"Ề","Ễ":"Ễ","Ė":"Ė","Ḟ":"Ḟ","Ǵ":"Ǵ","Ḡ":"Ḡ","Ğ":"Ğ","Ǧ":"Ǧ","Ĝ":"Ĝ","Ġ":"Ġ","Ḧ":"Ḧ","Ȟ":"Ȟ","Ĥ":"Ĥ","Ḣ":"Ḣ","Í":"Í","Ì":"Ì","Ï":"Ï","Ḯ":"Ḯ","Ĩ":"Ĩ","Ī":"Ī","Ĭ":"Ĭ","Ǐ":"Ǐ","Î":"Î","İ":"İ","Ĵ":"Ĵ","Ḱ":"Ḱ","Ǩ":"Ǩ","Ĺ":"Ĺ","Ľ":"Ľ","Ḿ":"Ḿ","Ṁ":"Ṁ","Ń":"Ń","Ǹ":"Ǹ","Ñ":"Ñ","Ň":"Ň","Ṅ":"Ṅ","Ó":"Ó","Ò":"Ò","Ö":"Ö","Ȫ":"Ȫ","Õ":"Õ","Ṍ":"Ṍ","Ṏ":"Ṏ","Ȭ":"Ȭ","Ō":"Ō","Ṓ":"Ṓ","Ṑ":"Ṑ","Ŏ":"Ŏ","Ǒ":"Ǒ","Ô":"Ô","Ố":"Ố","Ồ":"Ồ","Ỗ":"Ỗ","Ȯ":"Ȯ","Ȱ":"Ȱ","Ő":"Ő","Ṕ":"Ṕ","Ṗ":"Ṗ","Ŕ":"Ŕ","Ř":"Ř","Ṙ":"Ṙ","Ś":"Ś","Ṥ":"Ṥ","Š":"Š","Ṧ":"Ṧ","Ŝ":"Ŝ","Ṡ":"Ṡ","Ť":"Ť","Ṫ":"Ṫ","Ú":"Ú","Ù":"Ù","Ü":"Ü","Ǘ":"Ǘ","Ǜ":"Ǜ","Ǖ":"Ǖ","Ǚ":"Ǚ","Ũ":"Ũ","Ṹ":"Ṹ","Ū":"Ū","Ṻ":"Ṻ","Ŭ":"Ŭ","Ǔ":"Ǔ","Û":"Û","Ů":"Ů","Ű":"Ű","Ṽ":"Ṽ","Ẃ":"Ẃ","Ẁ":"Ẁ","Ẅ":"Ẅ","Ŵ":"Ŵ","Ẇ":"Ẇ","Ẍ":"Ẍ","Ẋ":"Ẋ","Ý":"Ý","Ỳ":"Ỳ","Ÿ":"Ÿ","Ỹ":"Ỹ","Ȳ":"Ȳ","Ŷ":"Ŷ","Ẏ":"Ẏ","Ź":"Ź","Ž":"Ž","Ẑ":"Ẑ","Ż":"Ż","ά":"ά","ὰ":"ὰ","ᾱ":"ᾱ","ᾰ":"ᾰ","έ":"έ","ὲ":"ὲ","ή":"ή","ὴ":"ὴ","ί":"ί","ὶ":"ὶ","ϊ":"ϊ","ΐ":"ΐ","ῒ":"ῒ","ῑ":"ῑ","ῐ":"ῐ","ό":"ό","ὸ":"ὸ","ύ":"ύ","ὺ":"ὺ","ϋ":"ϋ","ΰ":"ΰ","ῢ":"ῢ","ῡ":"ῡ","ῠ":"ῠ","ώ":"ώ","ὼ":"ὼ","Ύ":"Ύ","Ὺ":"Ὺ","Ϋ":"Ϋ","Ῡ":"Ῡ","Ῠ":"Ῠ","Ώ":"Ώ","Ὼ":"Ὼ"};const Pr=["bin","op","open","punct","rel"];class Rr{constructor(e,t,r=!1){this.mode="math",this.gullet=new Ir(e,t,this.mode),this.settings=t,this.isPreamble=r,this.leftrightDepth=0,this.prevAtomType=""}expect(t,r=!0){if(this.fetch().text!==t)throw new e(`Expected '${t}', got '${this.fetch().text}'`,this.fetch());r&&this.consume()}consume(){this.nextToken=null}fetch(){return null==this.nextToken&&(this.nextToken=this.gullet.expandNextToken()),this.nextToken}switchMode(e){this.mode=e,this.gullet.switchMode(e)}parse(){this.gullet.beginGroup(),this.settings.colorIsTextColor&&this.gullet.macros.set("\\color","\\textcolor");const e=this.parseExpression(!1);if(this.expect("EOF"),this.isPreamble){const e=Object.create(null);return Object.entries(this.gullet.macros.current).forEach((([t,r])=>{e[t]=r})),this.gullet.endGroup(),e}const t=this.gullet.macros.get("\\df@tag");return this.gullet.endGroup(),t&&(this.gullet.macros.current["\\df@tag"]=t),e}static get endOfExpression(){return["}","\\endgroup","\\end","\\right","\\endtoggle","&"]}subparse(e){const t=this.nextToken;this.consume(),this.gullet.pushToken(new br("}")),this.gullet.pushTokens(e);const r=this.parseExpression(!1);return this.expect("}"),this.nextToken=t,r}parseExpression(e,t){const r=[];for(;;){"math"===this.mode&&this.consumeSpaces();const n=this.fetch();if(-1!==Rr.endOfExpression.indexOf(n.text))break;if(t&&n.text===t)break;if(e&&gr[n.text]&&gr[n.text].infix)break;const s=this.parseAtom(t);if(!s)break;"internal"!==s.type&&(r.push(s),this.prevAtomType="atom"===s.type?s.family:s.type)}return"text"===this.mode&&this.formLigatures(r),this.handleInfixNodes(r)}handleInfixNodes(t){let r,n=-1;for(let s=0;s<t.length;s++)if("infix"===t[s].type){if(-1!==n)throw new e("only one infix operator per group",t[s].token);n=s,r=t[s].replaceWith}if(-1!==n&&r){let e,s;const o=t.slice(0,n),a=t.slice(n+1);let i;return e=1===o.length&&"ordgroup"===o[0].type?o[0]:{type:"ordgroup",mode:this.mode,body:o},s=1===a.length&&"ordgroup"===a[0].type?a[0]:{type:"ordgroup",mode:this.mode,body:a},i="\\\\abovefrac"===r?this.callFunction(r,[e,t[n],s],[]):this.callFunction(r,[e,s],[]),[i]}return t}handleSupSubscript(t){const r=this.fetch(),n=r.text;this.consume(),this.consumeSpaces();const s=this.parseGroup(t);if(!s)throw new e("Expected group after '"+n+"'",r);return s}formatUnsupportedCmd(e){const t=[];for(let r=0;r<e.length;r++)t.push({type:"textord",mode:"text",text:e[r]});const r={type:"text",mode:this.mode,body:t};return{type:"color",mode:this.mode,color:this.settings.errorColor,body:[r]}}parseAtom(t){const r=this.parseGroup("atom",t);if("text"===this.mode)return r;let n,s;for(;;){this.consumeSpaces();const t=this.fetch();if("\\limits"===t.text||"\\nolimits"===t.text){if(r&&"op"===r.type){const e="\\limits"===t.text;r.limits=e,r.alwaysHandleSupSub=!0}else{if(!r||"operatorname"!==r.type)throw new e("Limit controls must follow a math operator",t);r.alwaysHandleSupSub&&(r.limits="\\limits"===t.text)}this.consume()}else if("^"===t.text){if(n)throw new e("Double superscript",t);n=this.handleSupSubscript("superscript")}else if("_"===t.text){if(s)throw new e("Double subscript",t);s=this.handleSupSubscript("subscript")}else if("'"===t.text){if(n)throw new e("Double superscript",t);const r={type:"textord",mode:this.mode,text:"\\prime"},s=[r];for(this.consume();"'"===this.fetch().text;)s.push(r),this.consume();"^"===this.fetch().text&&s.push(this.handleSupSubscript("superscript")),n={type:"ordgroup",mode:this.mode,body:s}}else{if(!Fr[t.text])break;{const e=Lr.test(t.text),r=[];for(r.push(new br(Fr[t.text])),this.consume();;){const t=this.fetch().text;if(!Fr[t])break;if(Lr.test(t)!==e)break;r.unshift(new br(Fr[t])),this.consume()}const o=this.subparse(r);e?s={type:"ordgroup",mode:"math",body:o}:n={type:"ordgroup",mode:"math",body:o}}}}if(n||s){if(r&&"multiscript"===r.type&&!r.postscripts)return r.postscripts={sup:n,sub:s},r;{const e=!r||"op"!==r.type&&"operatorname"!==r.type?void 0:Ye(this.nextToken.text);return{type:"supsub",mode:this.mode,base:r,sup:n,sub:s,isFollowedByDelimiter:e}}}return r}parseFunction(t,r){const n=this.fetch(),s=n.text,o=gr[s];if(!o)return null;if(this.consume(),r&&"atom"!==r&&!o.allowedInArgument)throw new e("Got function '"+s+"' with no arguments"+(r?" as "+r:""),n);if("text"===this.mode&&!o.allowedInText)throw new e("Can't use function '"+s+"' in text mode",n);if("math"===this.mode&&!1===o.allowedInMath)throw new e("Can't use function '"+s+"' in math mode",n);const a=this.prevAtomType,{args:i,optArgs:l}=this.parseArguments(s,o);return this.prevAtomType=a,this.callFunction(s,i,l,n,t)}callFunction(t,r,n,s,o){const a={funcName:t,parser:this,token:s,breakOnTokenText:o},i=gr[t];if(i&&i.handler)return i.handler(a,r,n);throw new e(`No function handler for ${t}`)}parseArguments(t,r){const n=r.numArgs+r.numOptionalArgs;if(0===n)return{args:[],optArgs:[]};const s=[],o=[];for(let a=0;a<n;a++){let n=r.argTypes&&r.argTypes[a];const i=a<r.numOptionalArgs;(r.primitive&&null==n||"sqrt"===r.type&&1===a&&null==o[0])&&(n="primitive");const l=this.parseGroupOfType(`argument to '${t}'`,n,i);if(i)o.push(l);else{if(null==l)throw new e("Null argument, please report this as a bug");s.push(l)}}return{args:s,optArgs:o}}parseGroupOfType(t,r,n){switch(r){case"size":return this.parseSizeGroup(n);case"url":return this.parseUrlGroup(n);case"math":case"text":return this.parseArgumentGroup(n,r);case"hbox":{const e=this.parseArgumentGroup(n,"text");return null!=e?{type:"styling",mode:e.mode,body:[e],scriptLevel:"text"}:null}case"raw":{const e=this.parseStringGroup("raw",n);return null!=e?{type:"raw",mode:"text",string:e.text}:null}case"primitive":{if(n)throw new e("A primitive argument cannot be optional");const r=this.parseGroup(t);if(null==r)throw new e("Expected group as "+t,this.fetch());return r}case"original":case null:case void 0:return this.parseArgumentGroup(n);default:throw new e("Unknown group type as "+t,this.fetch())}}consumeSpaces(){for(;;){const e=this.fetch().text;if(" "!==e&&" "!==e&&"︎"!==e)break;this.consume()}}parseStringGroup(e,t){const r=this.gullet.scanArgument(t);if(null==r)return null;let n,s="";for(;"EOF"!==(n=this.fetch()).text;)s+=n.text,this.consume();return this.consume(),r.text=s,r}parseRegexGroup(t,r){const n=this.fetch();let s,o=n,a="";for(;"EOF"!==(s=this.fetch()).text&&t.test(a+s.text);)o=s,a+=o.text,this.consume();if(""===a)throw new e("Invalid "+r+": '"+n.text+"'",n);return n.range(o,a)}parseSizeGroup(t){let r,n=!1;if(this.gullet.consumeSpaces(),r=t||"{"===this.gullet.future().text?this.parseStringGroup("size",t):this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/,"size"),!r)return null;t||0!==r.text.length||(r.text="0pt",n=!0);const s=/([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(r.text);if(!s)throw new e("Invalid size: '"+r.text+"'",r);const o={number:+(s[1]+s[2]),unit:s[3]};if(!we(o))throw new e("Invalid unit: '"+o.unit+"'",r);return{type:"size",mode:this.mode,value:o,isBlank:n}}parseUrlGroup(e){this.gullet.lexer.setCatcode("%",13),this.gullet.lexer.setCatcode("~",12);const t=this.parseStringGroup("url",e);if(this.gullet.lexer.setCatcode("%",14),this.gullet.lexer.setCatcode("~",13),null==t)return null;let r=t.text.replace(/\\([#$%&~_^{}])/g,"$1");return r=t.text.replace(/{\u2044}/g,"/"),{type:"url",mode:this.mode,url:r}}parseArgumentGroup(e,t){const r=this.gullet.scanArgument(e);if(null==r)return null;const n=this.mode;t&&this.switchMode(t),this.gullet.beginGroup();const s=this.parseExpression(!1,"EOF");this.expect("EOF"),this.gullet.endGroup();const o={type:"ordgroup",mode:this.mode,loc:r.loc,body:s};return t&&this.switchMode(n),o}parseGroup(e,t){const r=this.fetch(),n=r.text;let s;if("{"===n||"\\begingroup"===n||"\\toggle"===n){this.consume();const e="{"===n?"}":"\\begingroup"===n?"\\endgroup":"\\endtoggle";this.gullet.beginGroup();const t=this.parseExpression(!1,e),o=this.fetch();this.expect(e),this.gullet.endGroup(),s={type:"\\endtoggle"===o.text?"toggle":"ordgroup",mode:this.mode,loc:fr.range(r,o),body:t,semisimple:"\\begingroup"===n||void 0}}else s=this.parseFunction(t,e)||this.parseSymbol(),null!=s||"\\"!==n[0]||Object.prototype.hasOwnProperty.call(Er,n)||(s=this.formatUnsupportedCmd(n),this.consume());return s}formLigatures(e){let t=e.length-1;for(let r=0;r<t;++r){const n=e[r],s=n.text;"-"===s&&"-"===e[r+1].text&&(r+1<t&&"-"===e[r+2].text?(e.splice(r,3,{type:"textord",mode:"text",loc:fr.range(n,e[r+2]),text:"---"}),t-=2):(e.splice(r,2,{type:"textord",mode:"text",loc:fr.range(n,e[r+1]),text:"--"}),t-=1)),"'"!==s&&"`"!==s||e[r+1].text!==s||(e.splice(r,2,{type:"textord",mode:"text",loc:fr.range(n,e[r+1]),text:s+s}),t-=1)}}parseSymbol(){const t=this.fetch();let r=t.text;if(/^\\verb[^a-zA-Z]/.test(r)){this.consume();let t=r.slice(5);const n="*"===t.charAt(0);if(n&&(t=t.slice(1)),t.length<2||t.charAt(0)!==t.slice(-1))throw new e("\\verb assertion failed --\n                    please report what input caused this bug");return t=t.slice(1,-1),{type:"verb",mode:"text",body:t,star:n}}if(Object.prototype.hasOwnProperty.call(Dr,r[0])&&!E[this.mode][r[0]]){if(this.settings.strict&&"math"===this.mode)throw new e(`Accented Unicode text character "${r[0]}" used in math mode`,t);r=Dr[r[0]]+r.slice(1)}const n=kr.exec(r);let s;if(n&&(r=r.substring(0,n.index),"i"===r?r="ı":"j"===r&&(r="ȷ")),E[this.mode][r]){let e=E[this.mode][r].group;"bin"===e&&Pr.includes(this.prevAtomType)&&(e="open");const n=fr.range(t);let o;if(Object.prototype.hasOwnProperty.call(C,e)){const t=e;o={type:"atom",mode:this.mode,family:t,loc:n,text:r}}else{if($r[r]){this.consume();const e=this.fetch().text.charCodeAt(0),t=65025===e?"mathscr":"mathcal";return 65024!==e&&65025!==e||this.consume(),{type:"font",mode:"math",font:t,body:{type:"mathord",mode:"math",loc:n,text:$r[r]}}}o={type:e,mode:this.mode,loc:n,text:r}}s=o}else{if(!(r.charCodeAt(0)>=128))return null;if(this.settings.strict&&"math"===this.mode)throw new e(`Unicode text character "${r[0]}" used in math mode`,t);s={type:"textord",mode:"text",loc:fr.range(t),text:r}}if(this.consume(),n)for(let r=0;r<n[0].length;r++){const o=n[0][r];if(!Gr[o])throw new e(`Unknown accent ' ${o}'`,t);const a=Gr[o][this.mode]||Gr[o].text;if(!a)throw new e(`Accent ${o} unsupported in ${this.mode} mode`,t);s={type:"accent",mode:this.mode,loc:fr.range(t),label:a,isStretchy:!1,base:s}}return s}}const jr=function(t,r){if(!("string"==typeof t||t instanceof String))throw new TypeError("Temml can only parse string typed expression");const n=new Rr(t,r);delete n.gullet.macros.current["\\df@tag"];let s=n.parse();if(!(s.length>0&&s[0].type&&"array"===s[0].type&&s[0].addEqnNum)&&n.gullet.macros.get("\\df@tag")){if(!r.displayMode)throw new e("\\tag works only in display mode");n.gullet.feed("\\df@tag"),s=[{type:"tag",mode:"text",body:s,tag:n.parse()}]}return s},Ur=[2,2,3,3];class Hr{constructor(e){this.level=e.level,this.color=e.color,this.font=e.font||"",this.fontFamily=e.fontFamily||"",this.fontSize=e.fontSize||1,this.fontWeight=e.fontWeight||"",this.fontShape=e.fontShape||"",this.maxSize=e.maxSize}extend(e){const t={level:this.level,color:this.color,font:this.font,fontFamily:this.fontFamily,fontSize:this.fontSize,fontWeight:this.fontWeight,fontShape:this.fontShape,maxSize:this.maxSize};for(const r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r]);return new Hr(t)}withLevel(e){return this.extend({level:e})}incrementLevel(){return this.extend({level:Math.min(this.level+1,3)})}inSubOrSup(){return this.extend({level:Ur[this.level]})}withColor(e){return this.extend({color:e})}withFont(e){return this.extend({font:e})}withTextFontFamily(e){return this.extend({fontFamily:e,font:""})}withFontSize(e){return this.extend({fontSize:e})}withTextFontWeight(e){return this.extend({fontWeight:e,font:""})}withTextFontShape(e){return this.extend({fontShape:e,font:""})}getColor(){return this.color}}let Vr=function(e,t,r={}){t.textContent="";const n="math"===t.tagName.toLowerCase();n&&(r.wrap="none");const s=_r(e,r);n||s.children.length>1?(t.textContent="",s.children.forEach((e=>{t.appendChild(e.toNode())}))):t.appendChild(s.toNode())};"undefined"!=typeof document&&"CSS1Compat"!==document.compatMode&&("undefined"!=typeof console&&console.warn("Warning: Temml doesn't work in quirks mode. Make sure your website has a suitable doctype."),Vr=function(){throw new e("Temml doesn't work in quirks mode.")});const _r=function(t,r){const n=new a(r);try{const e=jr(t,n);return ue(e,t,new Hr({level:n.displayMode?nt:st,maxSize:n.maxSize}),n)}catch(r){return function(t,r,n){if(n.throwOnError||!(t instanceof e))throw t;const s=new y(["temml-error"],[new x(r+"\n"+t.toString())]);return s.style.color=n.errorColor,s.style.whiteSpace="pre-line",s}(r,t,n)}};return{version:"0.10.21",render:Vr,renderToString:function(e,t){return _r(e,t).toMarkup()},postProcess:function(e){const t={};let r=0;const n=e.getElementsByClassName("tml-tageqn");for(const e of n){const n=e.getElementsByClassName("tml-eqn");n.length>0&&(r+=1,n[0].id="tml-eqn-"+r);const s=e.getElementsByClassName("tml-label");if(0!==s.length)if(n.length>0)t[s[0].id]=String(r);else{const r=e.getElementsByClassName("tml-tag");r.length>0&&(t[s[0].id]=r[0].textContent)}}[...e.getElementsByClassName("tml-ref")].forEach((e=>{let r=t[e.getAttribute("href").slice(1)];-1===e.className.indexOf("tml-eqref")&&(r=r.replace(/^\(/,""),r=r.replace(/\($/,"")),"("!==r.charAt(0)&&(r="("+r),")"!==r.slice(-1)&&(r+=")"),e.textContent=r}))},ParseError:e,definePreamble:function(e,t){const r=new a(t);if(r.macros={},!("string"==typeof e||e instanceof String))throw new TypeError("Temml can only parse string typed expression");const n=new Rr(e,r,!0);delete n.gullet.macros.current["\\df@tag"];return n.parse()},__parse:function(e,t){const r=new a(t);return jr(e,r)},__renderToMathMLTree:_r,__defineSymbol:I,__defineMacro:Pt}}();﻿/* eslint-disable */
/* -*- Mode: JavaScript; indent-tabs-mode:nil; js-indent-level: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */

/*************************************************************
 *
 *  Temml mhchem.js
 *
 *  This file implements a Temml version of mhchem version 3.3.0.
 *  It is adapted from MathJax/extensions/TeX/mhchem.js
 *  It differs from the MathJax version as follows:
 *    1. The interface is changed so that it can be called from Temml, not MathJax.
 *    2. \rlap and \llap are replaced with \mathrlap and \mathllap.
 *    3. The reaction arrow code is simplified. All reaction arrows are rendered
 *       using Temml extensible arrows instead of building non-extensible arrows.
 *    4. The ~bond forms are composed entirely of \rule elements.
 *    5. Two dashes in _getBond are wrapped in braces to suppress spacing. i.e., {-}
 *    6. The electron dot uses \textbullet instead of \bullet.
 *
 *    This code, as other Temml code, is released under the MIT license.
 * 
 * /*************************************************************
 *
 *  MathJax/extensions/TeX/mhchem.js
 *
 *  Implements the \ce command for handling chemical formulas
 *  from the mhchem LaTeX package.
 *
 *  ---------------------------------------------------------------------
 *
 *  Copyright (c) 2011-2015 The MathJax Consortium
 *  Copyright (c) 2015-2018 Martin Hensel
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

//
// Coding Style
//   - use '' for identifiers that can by minified/uglified
//   - use "" for strings that need to stay untouched

// version: "3.3.0" for MathJax and Temml


// Add \ce, \pu, and \tripleDash to the Temml macros.

temml.__defineMacro("\\ce", function(context) {
  return chemParse(context.consumeArgs(1)[0], "ce")
});

temml.__defineMacro("\\pu", function(context) {
  return chemParse(context.consumeArgs(1)[0], "pu");
});

// Math fonts do not include glyphs for the ~ form of bonds. So we'll send path geometry
// So we'll compose characters built from \rule elements.
temml.__defineMacro("\\uniDash", `{\\rule{0.672em}{0.06em}}`)
temml.__defineMacro("\\triDash", `{\\rule{0.15em}{0.06em}\\kern2mu\\rule{0.15em}{0.06em}\\kern2mu\\rule{0.15em}{0.06em}}`)
temml.__defineMacro("\\tripleDash", `\\kern0.075em\\raise0.25em{\\triDash}\\kern0.075em`)
temml.__defineMacro("\\tripleDashOverLine", `\\kern0.075em\\mathrlap{\\raise0.125em{\\uniDash}}\\raise0.34em{\\triDash}\\kern0.075em`)
temml.__defineMacro("\\tripleDashOverDoubleLine", `\\kern0.075em\\mathrlap{\\mathrlap{\\raise0.48em{\\triDash}}\\raise0.27em{\\uniDash}}{\\raise0.05em{\\uniDash}}\\kern0.075em`)
temml.__defineMacro("\\tripleDashBetweenDoubleLine", `\\kern0.075em\\mathrlap{\\mathrlap{\\raise0.48em{\\uniDash}}\\raise0.27em{\\triDash}}{\\raise0.05em{\\uniDash}}\\kern0.075em`)

  //
  //  This is the main function for handing the \ce and \pu commands.
  //  It takes the argument to \ce or \pu and returns the corresponding TeX string.
  //

  var chemParse = function (tokens, stateMachine) {
    // Recreate the argument string from Temml's array of tokens.
    var str = "";
    var expectedLoc = tokens.length && tokens[tokens.length - 1].loc.start
    for (var i = tokens.length - 1; i >= 0; i--) {
      if(tokens[i].loc.start > expectedLoc) {
        // context.consumeArgs has eaten a space.
        str += " ";
        expectedLoc = tokens[i].loc.start;
      }
      str += tokens[i].text;
      expectedLoc += tokens[i].text.length;
    }
    // Call the mhchem core parser.
    var tex = texify.go(mhchemParser.go(str, stateMachine));
    return tex;
  };

  //
  // Core parser for mhchem syntax  (recursive)
  //
  /** @type {MhchemParser} */
  var mhchemParser = {
    //
    // Parses mchem \ce syntax
    //
    // Call like
    //   go("H2O");
    //
    go: function (input, stateMachine) {
      if (!input) { return []; }
      if (stateMachine === undefined) { stateMachine = 'ce'; }
      var state = '0';

      //
      // String buffers for parsing:
      //
      // buffer.a == amount
      // buffer.o == element
      // buffer.b == left-side superscript
      // buffer.p == left-side subscript
      // buffer.q == right-side subscript
      // buffer.d == right-side superscript
      //
      // buffer.r == arrow
      // buffer.rdt == arrow, script above, type
      // buffer.rd == arrow, script above, content
      // buffer.rqt == arrow, script below, type
      // buffer.rq == arrow, script below, content
      //
      // buffer.text_
      // buffer.rm
      // etc.
      //
      // buffer.parenthesisLevel == int, starting at 0
      // buffer.sb == bool, space before
      // buffer.beginsWithBond == bool
      //
      // These letters are also used as state names.
      //
      // Other states:
      // 0 == begin of main part (arrow/operator unlikely)
      // 1 == next entity
      // 2 == next entity (arrow/operator unlikely)
      // 3 == next atom
      // c == macro
      //
      /** @type {Buffer} */
      var buffer = {};
      buffer['parenthesisLevel'] = 0;

      input = input.replace(/\n/g, " ");
      input = input.replace(/[\u2212\u2013\u2014\u2010]/g, "-");
      input = input.replace(/[\u2026]/g, "...");

      //
      // Looks through mhchemParser.transitions, to execute a matching action
      // (recursive)
      //
      var lastInput;
      var watchdog = 10;
      /** @type {ParserOutput[]} */
      var output = [];
      while (true) {
        if (lastInput !== input) {
          watchdog = 10;
          lastInput = input;
        } else {
          watchdog--;
        }
        //
        // Find actions in transition table
        //
        var machine = mhchemParser.stateMachines[stateMachine];
        var t = machine.transitions[state] || machine.transitions['*'];
        iterateTransitions:
        for (var i=0; i<t.length; i++) {
          var matches = mhchemParser.patterns.match_(t[i].pattern, input);
          if (matches) {
            //
            // Execute actions
            //
            var task = t[i].task;
            for (var iA=0; iA<task.action_.length; iA++) {
              var o;
              //
              // Find and execute action
              //
              if (machine.actions[task.action_[iA].type_]) {
                o = machine.actions[task.action_[iA].type_](buffer, matches.match_, task.action_[iA].option);
              } else if (mhchemParser.actions[task.action_[iA].type_]) {
                o = mhchemParser.actions[task.action_[iA].type_](buffer, matches.match_, task.action_[iA].option);
              } else {
                throw ["MhchemBugA", "mhchem bug A. Please report. (" + task.action_[iA].type_ + ")"];  // Trying to use non-existing action
              }
              //
              // Add output
              //
              mhchemParser.concatArray(output, o);
            }
            //
            // Set next state,
            // Shorten input,
            // Continue with next character
            //   (= apply only one transition per position)
            //
            state = task.nextState || state;
            if (input.length > 0) {
              if (!task.revisit) {
                input = matches.remainder;
              }
              if (!task.toContinue) {
                break iterateTransitions;
              }
            } else {
              return output;
            }
          }
        }
        //
        // Prevent infinite loop
        //
        if (watchdog <= 0) {
          throw ["MhchemBugU", "mhchem bug U. Please report."];  // Unexpected character
        }
      }
    },
    concatArray: function (a, b) {
      if (b) {
        if (Array.isArray(b)) {
          for (var iB=0; iB<b.length; iB++) {
            a.push(b[iB]);
          }
        } else {
          a.push(b);
        }
      }
    },

    patterns: {
      //
      // Matching patterns
      // either regexps or function that return null or {match_:"a", remainder:"bc"}
      //
      patterns: {
        // property names must not look like integers ("2") for correct property traversal order, later on
        'empty': /^$/,
        'else': /^./,
        'else2': /^./,
        'space': /^\s/,
        'space A': /^\s(?=[A-Z\\$])/,
        'space$': /^\s$/,
        'a-z': /^[a-z]/,
        'x': /^x/,
        'x$': /^x$/,
        'i$': /^i$/,
        'letters': /^(?:[a-zA-Z\u03B1-\u03C9\u0391-\u03A9?@]|(?:\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))))+/,
        '\\greek': /^\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))/,
        'one lowercase latin letter $': /^(?:([a-z])(?:$|[^a-zA-Z]))$/,
        '$one lowercase latin letter$ $': /^\$(?:([a-z])(?:$|[^a-zA-Z]))\$$/,
        'one lowercase greek letter $': /^(?:\$?[\u03B1-\u03C9]\$?|\$?\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\s*\$?)(?:\s+|\{\}|(?![a-zA-Z]))$/,
        'digits': /^[0-9]+/,
        '-9.,9': /^[+\-]?(?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))/,
        '-9.,9 no missing 0': /^[+\-]?[0-9]+(?:[.,][0-9]+)?/,
        '(-)(9.,9)(e)(99)': function (input) {
          var m = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))?(\((?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))\))?(?:([eE]|\s*(\*|x|\\times|\u00D7)\s*10\^)([+\-]?[0-9]+|\{[+\-]?[0-9]+\}))?/);
          if (m && m[0]) {
            return { match_: m.splice(1), remainder: input.substr(m[0].length) };
          }
          return null;
        },
        '(-)(9)^(-9)': function (input) {
          var m = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)\^([+\-]?[0-9]+|\{[+\-]?[0-9]+\})/);
          if (m && m[0]) {
            return { match_: m.splice(1), remainder: input.substr(m[0].length) };
          }
          return null;
        },
        'state of aggregation $': function (input) {  // ... or crystal system
          var a = mhchemParser.patterns.findObserveGroups(input, "", /^\([a-z]{1,3}(?=[\),])/, ")", "");  // (aq), (aq,$\infty$), (aq, sat)
          if (a  &&  a.remainder.match(/^($|[\s,;\)\]\}])/)) { return a; }  //  AND end of 'phrase'
          var m = input.match(/^(?:\((?:\\ca\s?)?\$[amothc]\$\))/);  // OR crystal system ($o$) (\ca$c$)
          if (m) {
            return { match_: m[0], remainder: input.substr(m[0].length) };
          }
          return null;
        },
        '_{(state of aggregation)}$': /^_\{(\([a-z]{1,3}\))\}/,
        '{[(': /^(?:\\\{|\[|\()/,
        ')]}': /^(?:\)|\]|\\\})/,
        ', ': /^[,;]\s*/,
        ',': /^[,;]/,
        '.': /^[.]/,
        '. ': /^([.\u22C5\u00B7\u2022])\s*/,
        '...': /^\.\.\.(?=$|[^.])/,
        '* ': /^([*])\s*/,
        '^{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "^{", "", "", "}"); },
        '^($...$)': function (input) { return mhchemParser.patterns.findObserveGroups(input, "^", "$", "$", ""); },
        '^a': /^\^([0-9]+|[^\\_])/,
        '^\\x{}{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "^", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
        '^\\x{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "^", /^\\[a-zA-Z]+\{/, "}", ""); },
        '^\\x': /^\^(\\[a-zA-Z]+)\s*/,
        '^(-1)': /^\^(-?\d+)/,
        '\'': /^'/,
        '_{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "_{", "", "", "}"); },
        '_($...$)': function (input) { return mhchemParser.patterns.findObserveGroups(input, "_", "$", "$", ""); },
        '_9': /^_([+\-]?[0-9]+|[^\\])/,
        '_\\x{}{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "_", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
        '_\\x{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "_", /^\\[a-zA-Z]+\{/, "}", ""); },
        '_\\x': /^_(\\[a-zA-Z]+)\s*/,
        '^_': /^(?:\^(?=_)|\_(?=\^)|[\^_]$)/,
        '{}': /^\{\}/,
        '{...}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "", "{", "}", ""); },
        '{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "{", "", "", "}"); },
        '$...$': function (input) { return mhchemParser.patterns.findObserveGroups(input, "", "$", "$", ""); },
        '${(...)}$': function (input) { return mhchemParser.patterns.findObserveGroups(input, "${", "", "", "}$"); },
        '$(...)$': function (input) { return mhchemParser.patterns.findObserveGroups(input, "$", "", "", "$"); },
        '=<>': /^[=<>]/,
        '#': /^[#\u2261]/,
        '+': /^\+/,
        '-$': /^-(?=[\s_},;\]/]|$|\([a-z]+\))/,  // -space -, -; -] -/ -$ -state-of-aggregation
        '-9': /^-(?=[0-9])/,
        '- orbital overlap': /^-(?=(?:[spd]|sp)(?:$|[\s,;\)\]\}]))/,
        '-': /^-/,
        'pm-operator': /^(?:\\pm|\$\\pm\$|\+-|\+\/-)/,
        'operator': /^(?:\+|(?:[\-=<>]|<<|>>|\\approx|\$\\approx\$)(?=\s|$|-?[0-9]))/,
        'arrowUpDown': /^(?:v|\(v\)|\^|\(\^\))(?=$|[\s,;\)\]\}])/,
        '\\bond{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\bond{", "", "", "}"); },
        '->': /^(?:<->|<-->|->|<-|<=>>|<<=>|<=>|[\u2192\u27F6\u21CC])/,
        'CMT': /^[CMT](?=\[)/,
        '[(...)]': function (input) { return mhchemParser.patterns.findObserveGroups(input, "[", "", "", "]"); },
        '1st-level escape': /^(&|\\\\|\\hline)\s*/,
        '\\,': /^(?:\\[,\ ;:])/,  // \\x - but output no space before
        '\\x{}{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
        '\\x{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "", /^\\[a-zA-Z]+\{/, "}", ""); },
        '\\ca': /^\\ca(?:\s+|(?![a-zA-Z]))/,
        '\\x': /^(?:\\[a-zA-Z]+\s*|\\[_&{}%])/,
        'orbital': /^(?:[0-9]{1,2}[spdfgh]|[0-9]{0,2}sp)(?=$|[^a-zA-Z])/,  // only those with numbers in front, because the others will be formatted correctly anyway
        'others': /^[\/~|]/,
        '\\frac{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\frac{", "", "", "}", "{", "", "", "}"); },
        '\\overset{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\overset{", "", "", "}", "{", "", "", "}"); },
        '\\underset{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\underset{", "", "", "}", "{", "", "", "}"); },
        '\\underbrace{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\underbrace{", "", "", "}_", "{", "", "", "}"); },
        '\\color{(...)}0': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\color{", "", "", "}"); },
        '\\color{(...)}{(...)}1': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\color{", "", "", "}", "{", "", "", "}"); },
        '\\color(...){(...)}2': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\color", "\\", "", /^(?=\{)/, "{", "", "", "}"); },
        '\\ce{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\ce{", "", "", "}"); },
        'oxidation$': /^(?:[+-][IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/,
        'd-oxidation$': /^(?:[+-]?\s?[IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/,  // 0 could be oxidation or charge
        'roman numeral': /^[IVX]+/,
        '1/2$': /^[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+(?:\$[a-z]\$|[a-z])?$/,
        'amount': function (input) {
          var match;
          // e.g. 2, 0.5, 1/2, -2, n/2, +;  $a$ could be added later in parsing
          match = input.match(/^(?:(?:(?:\([+\-]?[0-9]+\/[0-9]+\)|[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+|[+\-]?[0-9]+[.,][0-9]+|[+\-]?\.[0-9]+|[+\-]?[0-9]+)(?:[a-z](?=\s*[A-Z]))?)|[+\-]?[a-z](?=\s*[A-Z])|\+(?!\s))/);
          if (match) {
            return { match_: match[0], remainder: input.substr(match[0].length) };
          }
          var a = mhchemParser.patterns.findObserveGroups(input, "", "$", "$", "");
          if (a) {  // e.g. $2n-1$, $-$
            match = a.match_.match(/^\$(?:\(?[+\-]?(?:[0-9]*[a-z]?[+\-])?[0-9]*[a-z](?:[+\-][0-9]*[a-z]?)?\)?|\+|-)\$$/);
            if (match) {
              return { match_: match[0], remainder: input.substr(match[0].length) };
            }
          }
          return null;
        },
        'amount2': function (input) { return this['amount'](input); },
        '(KV letters),': /^(?:[A-Z][a-z]{0,2}|i)(?=,)/,
        'formula$': function (input) {
          if (input.match(/^\([a-z]+\)$/)) { return null; }  // state of aggregation = no formula
          var match = input.match(/^(?:[a-z]|(?:[0-9\ \+\-\,\.\(\)]+[a-z])+[0-9\ \+\-\,\.\(\)]*|(?:[a-z][0-9\ \+\-\,\.\(\)]+)+[a-z]?)$/);
          if (match) {
            return { match_: match[0], remainder: input.substr(match[0].length) };
          }
          return null;
        },
        'uprightEntities': /^(?:pH|pOH|pC|pK|iPr|iBu)(?=$|[^a-zA-Z])/,
        '/': /^\s*(\/)\s*/,
        '//': /^\s*(\/\/)\s*/,
        '*': /^\s*[*.]\s*/
      },
      findObserveGroups: function (input, begExcl, begIncl, endIncl, endExcl, beg2Excl, beg2Incl, end2Incl, end2Excl, combine) {
        /** @type {{(input: string, pattern: string | RegExp): string | string[] | null;}} */
        var _match = function (input, pattern) {
          if (typeof pattern === "string") {
            if (input.indexOf(pattern) !== 0) { return null; }
            return pattern;
          } else {
            var match = input.match(pattern);
            if (!match) { return null; }
            return match[0];
          }
        };
        /** @type {{(input: string, i: number, endChars: string | RegExp): {endMatchBegin: number, endMatchEnd: number} | null;}} */
        var _findObserveGroups = function (input, i, endChars) {
          var braces = 0;
          while (i < input.length) {
            var a = input.charAt(i);
            var match = _match(input.substr(i), endChars);
            if (match !== null  &&  braces === 0) {
              return { endMatchBegin: i, endMatchEnd: i + match.length };
            } else if (a === "{") {
              braces++;
            } else if (a === "}") {
              if (braces === 0) {
                throw ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"];
              } else {
                braces--;
              }
            }
            i++;
          }
          if (braces > 0) {
            return null;
          }
          return null;
        };
        var match = _match(input, begExcl);
        if (match === null) { return null; }
        input = input.substr(match.length);
        match = _match(input, begIncl);
        if (match === null) { return null; }
        var e = _findObserveGroups(input, match.length, endIncl || endExcl);
        if (e === null) { return null; }
        var match1 = input.substring(0, (endIncl ? e.endMatchEnd : e.endMatchBegin));
        if (!(beg2Excl || beg2Incl)) {
          return {
            match_: match1,
            remainder: input.substr(e.endMatchEnd)
          };
        } else {
          var group2 = this.findObserveGroups(input.substr(e.endMatchEnd), beg2Excl, beg2Incl, end2Incl, end2Excl);
          if (group2 === null) { return null; }
          /** @type {string[]} */
          var matchRet = [match1, group2.match_];
          return {
            match_: (combine ? matchRet.join("") : matchRet),
            remainder: group2.remainder
          };
        }
      },

      //
      // Matching function
      // e.g. match("a", input) will look for the regexp called "a" and see if it matches
      // returns null or {match_:"a", remainder:"bc"}
      //
      match_: function (m, input) {
        var pattern = mhchemParser.patterns.patterns[m];
        if (pattern === undefined) {
          throw ["MhchemBugP", "mhchem bug P. Please report. (" + m + ")"];  // Trying to use non-existing pattern
        } else if (typeof pattern === "function") {
          return mhchemParser.patterns.patterns[m](input);  // cannot use cached var pattern here, because some pattern functions need this===mhchemParser
        } else {  // RegExp
          var match = input.match(pattern);
          if (match) {
            var mm;
            if (match[2]) {
              mm = [ match[1], match[2] ];
            } else if (match[1]) {
              mm = match[1];
            } else {
              mm = match[0];
            }
            return { match_: mm, remainder: input.substr(match[0].length) };
          }
          return null;
        }
      }
    },

    //
    // Generic state machine actions
    //
    actions: {
      'a=': function (buffer, m) { buffer.a = (buffer.a || "") + m; },
      'b=': function (buffer, m) { buffer.b = (buffer.b || "") + m; },
      'p=': function (buffer, m) { buffer.p = (buffer.p || "") + m; },
      'o=': function (buffer, m) { buffer.o = (buffer.o || "") + m; },
      'q=': function (buffer, m) { buffer.q = (buffer.q || "") + m; },
      'd=': function (buffer, m) { buffer.d = (buffer.d || "") + m; },
      'rm=': function (buffer, m) { buffer.rm = (buffer.rm || "") + m; },
      'text=': function (buffer, m) { buffer.text_ = (buffer.text_ || "") + m; },
      'insert': function (buffer, m, a) { return { type_: a }; },
      'insert+p1': function (buffer, m, a) { return { type_: a, p1: m }; },
      'insert+p1+p2': function (buffer, m, a) { return { type_: a, p1: m[0], p2: m[1] }; },
      'copy': function (buffer, m) { return m; },
      'rm': function (buffer, m) { return { type_: 'rm', p1: m || ""}; },
      'text': function (buffer, m) { return mhchemParser.go(m, 'text'); },
      '{text}': function (buffer, m) {
        var ret = [ "{" ];
        mhchemParser.concatArray(ret, mhchemParser.go(m, 'text'));
        ret.push("}");
        return ret;
      },
      'tex-math': function (buffer, m) { return mhchemParser.go(m, 'tex-math'); },
      'tex-math tight': function (buffer, m) { return mhchemParser.go(m, 'tex-math tight'); },
      'bond': function (buffer, m, k) { return { type_: 'bond', kind_: k || m }; },
      'color0-output': function (buffer, m) { return { type_: 'color0', color: m[0] }; },
      'ce': function (buffer, m) { return mhchemParser.go(m); },
      '1/2': function (buffer, m) {
        /** @type {ParserOutput[]} */
        var ret = [];
        if (m.match(/^[+\-]/)) {
          ret.push(m.substr(0, 1));
          m = m.substr(1);
        }
        var n = m.match(/^([0-9]+|\$[a-z]\$|[a-z])\/([0-9]+)(\$[a-z]\$|[a-z])?$/);
        n[1] = n[1].replace(/\$/g, "");
        ret.push({ type_: 'frac', p1: n[1], p2: n[2] });
        if (n[3]) {
          n[3] = n[3].replace(/\$/g, "");
          ret.push({ type_: 'tex-math', p1: n[3] });
        }
        return ret;
      },
      '9,9': function (buffer, m) { return mhchemParser.go(m, '9,9'); }
    },
    //
    // createTransitions
    // convert  { 'letter': { 'state': { action_: 'output' } } }  to  { 'state' => [ { pattern: 'letter', task: { action_: [{type_: 'output'}] } } ] }
    // with expansion of 'a|b' to 'a' and 'b' (at 2 places)
    //
    createTransitions: function (o) {
      var pattern, state;
      /** @type {string[]} */
      var stateArray;
      var i;
      //
      // 1. Collect all states
      //
      /** @type {Transitions} */
      var transitions = {};
      for (pattern in o) {
        for (state in o[pattern]) {
          stateArray = state.split("|");
          o[pattern][state].stateArray = stateArray;
          for (i=0; i<stateArray.length; i++) {
            transitions[stateArray[i]] = [];
          }
        }
      }
      //
      // 2. Fill states
      //
      for (pattern in o) {
        for (state in o[pattern]) {
          stateArray = o[pattern][state].stateArray || [];
          for (i=0; i<stateArray.length; i++) {
            //
            // 2a. Normalize actions into array:  'text=' ==> [{type_:'text='}]
            // (Note to myself: Resolving the function here would be problematic. It would need .bind (for *this*) and currying (for *option*).)
            //
            /** @type {any} */
            var p = o[pattern][state];
            if (p.action_) {
              p.action_ = [].concat(p.action_);
              for (var k=0; k<p.action_.length; k++) {
                if (typeof p.action_[k] === "string") {
                  p.action_[k] = { type_: p.action_[k] };
                }
              }
            } else {
              p.action_ = [];
            }
            //
            // 2.b Multi-insert
            //
            var patternArray = pattern.split("|");
            for (var j=0; j<patternArray.length; j++) {
              if (stateArray[i] === '*') {  // insert into all
                for (var t in transitions) {
                  transitions[t].push({ pattern: patternArray[j], task: p });
                }
              } else {
                transitions[stateArray[i]].push({ pattern: patternArray[j], task: p });
              }
            }
          }
        }
      }
      return transitions;
    },
    stateMachines: {}
  };

  //
  // Definition of state machines
  //
  mhchemParser.stateMachines = {
    //
    // \ce state machines
    //
    //#region ce
    'ce': {  // main parser
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        'else':  {
          '0|1|2': { action_: 'beginsWithBond=false', revisit: true, toContinue: true } },
        'oxidation$': {
          '0': { action_: 'oxidation-output' } },
        'CMT': {
          'r': { action_: 'rdt=', nextState: 'rt' },
          'rd': { action_: 'rqt=', nextState: 'rdt' } },
        'arrowUpDown': {
          '0|1|2|as': { action_: [ 'sb=false', 'output', 'operator' ], nextState: '1' } },
        'uprightEntities': {
          '0|1|2': { action_: [ 'o=', 'output' ], nextState: '1' } },
        'orbital': {
          '0|1|2|3': { action_: 'o=', nextState: 'o' } },
        '->': {
          '0|1|2|3': { action_: 'r=', nextState: 'r' },
          'a|as': { action_: [ 'output', 'r=' ], nextState: 'r' },
          '*': { action_: [ 'output', 'r=' ], nextState: 'r' } },
        '+': {
          'o': { action_: 'd= kv',  nextState: 'd' },
          'd|D': { action_: 'd=', nextState: 'd' },
          'q': { action_: 'd=',  nextState: 'qd' },
          'qd|qD': { action_: 'd=', nextState: 'qd' },
          'dq': { action_: [ 'output', 'd=' ], nextState: 'd' },
          '3': { action_: [ 'sb=false', 'output', 'operator' ], nextState: '0' } },
        'amount': {
          '0|2': { action_: 'a=', nextState: 'a' } },
        'pm-operator': {
          '0|1|2|a|as': { action_: [ 'sb=false', 'output', { type_: 'operator', option: '\\pm' } ], nextState: '0' } },
        'operator': {
          '0|1|2|a|as': { action_: [ 'sb=false', 'output', 'operator' ], nextState: '0' } },
        '-$': {
          'o|q': { action_: [ 'charge or bond', 'output' ],  nextState: 'qd' },
          'd': { action_: 'd=', nextState: 'd' },
          'D': { action_: [ 'output', { type_: 'bond', option: "-" } ], nextState: '3' },
          'q': { action_: 'd=',  nextState: 'qd' },
          'qd': { action_: 'd=', nextState: 'qd' },
          'qD|dq': { action_: [ 'output', { type_: 'bond', option: "-" } ], nextState: '3' } },
        '-9': {
          '3|o': { action_: [ 'output', { type_: 'insert', option: 'hyphen' } ], nextState: '3' } },
        '- orbital overlap': {
          'o': { action_: [ 'output', { type_: 'insert', option: 'hyphen' } ], nextState: '2' },
          'd': { action_: [ 'output', { type_: 'insert', option: 'hyphen' } ], nextState: '2' } },
        '-': {
          '0|1|2': { action_: [ { type_: 'output', option: 1 }, 'beginsWithBond=true', { type_: 'bond', option: "-" } ], nextState: '3' },
          '3': { action_: { type_: 'bond', option: "-" } },
          'a': { action_: [ 'output', { type_: 'insert', option: 'hyphen' } ], nextState: '2' },
          'as': { action_: [ { type_: 'output', option: 2 }, { type_: 'bond', option: "-" } ], nextState: '3' },
          'b': { action_: 'b=' },
          'o': { action_: { type_: '- after o/d', option: false }, nextState: '2' },
          'q': { action_: { type_: '- after o/d', option: false }, nextState: '2' },
          'd|qd|dq': { action_: { type_: '- after o/d', option: true }, nextState: '2' },
          'D|qD|p': { action_: [ 'output', { type_: 'bond', option: "-" } ], nextState: '3' } },
        'amount2': {
          '1|3': { action_: 'a=', nextState: 'a' } },
        'letters': {
          '0|1|2|3|a|as|b|p|bp|o': { action_: 'o=', nextState: 'o' },
          'q|dq': { action_: ['output', 'o='], nextState: 'o' },
          'd|D|qd|qD': { action_: 'o after d', nextState: 'o' } },
        'digits': {
          'o': { action_: 'q=', nextState: 'q' },
          'd|D': { action_: 'q=', nextState: 'dq' },
          'q': { action_: [ 'output', 'o=' ], nextState: 'o' },
          'a': { action_: 'o=', nextState: 'o' } },
        'space A': {
          'b|p|bp': {} },
        'space': {
          'a': { nextState: 'as' },
          '0': { action_: 'sb=false' },
          '1|2': { action_: 'sb=true' },
          'r|rt|rd|rdt|rdq': { action_: 'output', nextState: '0' },
          '*': { action_: [ 'output', 'sb=true' ], nextState: '1'} },
        '1st-level escape': {
          '1|2': { action_: [ 'output', { type_: 'insert+p1', option: '1st-level escape' } ] },
          '*': { action_: [ 'output', { type_: 'insert+p1', option: '1st-level escape' } ], nextState: '0' } },
        '[(...)]': {
          'r|rt': { action_: 'rd=', nextState: 'rd' },
          'rd|rdt': { action_: 'rq=', nextState: 'rdq' } },
        '...': {
          'o|d|D|dq|qd|qD': { action_: [ 'output', { type_: 'bond', option: "..." } ], nextState: '3' },
          '*': { action_: [ { type_: 'output', option: 1 }, { type_: 'insert', option: 'ellipsis' } ], nextState: '1' } },
        '. |* ': {
          '*': { action_: [ 'output', { type_: 'insert', option: 'addition compound' } ], nextState: '1' } },
        'state of aggregation $': {
          '*': { action_: [ 'output', 'state of aggregation' ], nextState: '1' } },
        '{[(': {
          'a|as|o': { action_: [ 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' },
          '0|1|2|3': { action_: [ 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' },
          '*': { action_: [ 'output', 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' } },
        ')]}': {
          '0|1|2|3|b|p|bp|o': { action_: [ 'o=', 'parenthesisLevel--' ], nextState: 'o' },
          'a|as|d|D|q|qd|qD|dq': { action_: [ 'output', 'o=', 'parenthesisLevel--' ], nextState: 'o' } },
        ', ': {
          '*': { action_: [ 'output', 'comma' ], nextState: '0' } },
        '^_': {  // ^ and _ without a sensible argument
          '*': { } },
        '^{(...)}|^($...$)': {
          '0|1|2|as': { action_: 'b=', nextState: 'b' },
          'p': { action_: 'b=', nextState: 'bp' },
          '3|o': { action_: 'd= kv', nextState: 'D' },
          'q': { action_: 'd=', nextState: 'qD' },
          'd|D|qd|qD|dq': { action_: [ 'output', 'd=' ], nextState: 'D' } },
        '^a|^\\x{}{}|^\\x{}|^\\x|\'': {
          '0|1|2|as': { action_: 'b=', nextState: 'b' },
          'p': { action_: 'b=', nextState: 'bp' },
          '3|o': { action_: 'd= kv', nextState: 'd' },
          'q': { action_: 'd=', nextState: 'qd' },
          'd|qd|D|qD': { action_: 'd=' },
          'dq': { action_: [ 'output', 'd=' ], nextState: 'd' } },
        '_{(state of aggregation)}$': {
          'd|D|q|qd|qD|dq': { action_: [ 'output', 'q=' ], nextState: 'q' } },
        '_{(...)}|_($...$)|_9|_\\x{}{}|_\\x{}|_\\x': {
          '0|1|2|as': { action_: 'p=', nextState: 'p' },
          'b': { action_: 'p=', nextState: 'bp' },
          '3|o': { action_: 'q=', nextState: 'q' },
          'd|D': { action_: 'q=', nextState: 'dq' },
          'q|qd|qD|dq': { action_: [ 'output', 'q=' ], nextState: 'q' } },
        '=<>': {
          '0|1|2|3|a|as|o|q|d|D|qd|qD|dq': { action_: [ { type_: 'output', option: 2 }, 'bond' ], nextState: '3' } },
        '#': {
          '0|1|2|3|a|as|o': { action_: [ { type_: 'output', option: 2 }, { type_: 'bond', option: "#" } ], nextState: '3' } },
        '{}': {
          '*': { action_: { type_: 'output', option: 1 },  nextState: '1' } },
        '{...}': {
          '0|1|2|3|a|as|b|p|bp': { action_: 'o=', nextState: 'o' },
          'o|d|D|q|qd|qD|dq': { action_: [ 'output', 'o=' ], nextState: 'o' } },
        '$...$': {
          'a': { action_: 'a=' },  // 2$n$
          '0|1|2|3|as|b|p|bp|o': { action_: 'o=', nextState: 'o' },  // not 'amount'
          'as|o': { action_: 'o=' },
          'q|d|D|qd|qD|dq': { action_: [ 'output', 'o=' ], nextState: 'o' } },
        '\\bond{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'bond' ], nextState: "3" } },
        '\\frac{(...)}': {
          '*': { action_: [ { type_: 'output', option: 1 }, 'frac-output' ], nextState: '3' } },
        '\\overset{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'overset-output' ], nextState: '3' } },
        '\\underset{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'underset-output' ], nextState: '3' } },
        '\\underbrace{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'underbrace-output' ], nextState: '3' } },
        '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'color-output' ], nextState: '3' } },
        '\\color{(...)}0': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'color0-output' ] } },
        '\\ce{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'ce' ], nextState: '3' } },
        '\\,': {
          '*': { action_: [ { type_: 'output', option: 1 }, 'copy' ], nextState: '1' } },
        '\\x{}{}|\\x{}|\\x': {
          '0|1|2|3|a|as|b|p|bp|o|c0': { action_: [ 'o=', 'output' ], nextState: '3' },
          '*': { action_: ['output', 'o=', 'output' ], nextState: '3' } },
        'others': {
          '*': { action_: [ { type_: 'output', option: 1 }, 'copy' ], nextState: '3' } },
        'else2': {
          'a': { action_: 'a to o', nextState: 'o', revisit: true },
          'as': { action_: [ 'output', 'sb=true' ], nextState: '1', revisit: true },
          'r|rt|rd|rdt|rdq': { action_: [ 'output' ], nextState: '0', revisit: true },
          '*': { action_: [ 'output', 'copy' ], nextState: '3' } }
      }),
      actions: {
        'o after d': function (buffer, m) {
          var ret;
          if ((buffer.d || "").match(/^[0-9]+$/)) {
            var tmp = buffer.d;
            buffer.d = undefined;
            ret = this['output'](buffer);
            buffer.b = tmp;
          } else {
            ret = this['output'](buffer);
          }
          mhchemParser.actions['o='](buffer, m);
          return ret;
        },
        'd= kv': function (buffer, m) {
          buffer.d = m;
          buffer.dType = 'kv';
        },
        'charge or bond': function (buffer, m) {
          if (buffer['beginsWithBond']) {
            /** @type {ParserOutput[]} */
            var ret = [];
            mhchemParser.concatArray(ret, this['output'](buffer));
            mhchemParser.concatArray(ret, mhchemParser.actions['bond'](buffer, m, "-"));
            return ret;
          } else {
            buffer.d = m;
          }
        },
        '- after o/d': function (buffer, m, isAfterD) {
          var c1 = mhchemParser.patterns.match_('orbital', buffer.o || "");
          var c2 = mhchemParser.patterns.match_('one lowercase greek letter $', buffer.o || "");
          var c3 = mhchemParser.patterns.match_('one lowercase latin letter $', buffer.o || "");
          var c4 = mhchemParser.patterns.match_('$one lowercase latin letter$ $', buffer.o || "");
          var hyphenFollows =  m==="-" && ( c1 && c1.remainder===""  ||  c2  ||  c3  ||  c4 );
          if (hyphenFollows && !buffer.a && !buffer.b && !buffer.p && !buffer.d && !buffer.q && !c1 && c3) {
            buffer.o = '$' + buffer.o + '$';
          }
          /** @type {ParserOutput[]} */
          var ret = [];
          if (hyphenFollows) {
            mhchemParser.concatArray(ret, this['output'](buffer));
            ret.push({ type_: 'hyphen' });
          } else {
            c1 = mhchemParser.patterns.match_('digits', buffer.d || "");
            if (isAfterD && c1 && c1.remainder==='') {
              mhchemParser.concatArray(ret, mhchemParser.actions['d='](buffer, m));
              mhchemParser.concatArray(ret, this['output'](buffer));
            } else {
              mhchemParser.concatArray(ret, this['output'](buffer));
              mhchemParser.concatArray(ret, mhchemParser.actions['bond'](buffer, m, "-"));
            }
          }
          return ret;
        },
        'a to o': function (buffer) {
          buffer.o = buffer.a;
          buffer.a = undefined;
        },
        'sb=true': function (buffer) { buffer.sb = true; },
        'sb=false': function (buffer) { buffer.sb = false; },
        'beginsWithBond=true': function (buffer) { buffer['beginsWithBond'] = true; },
        'beginsWithBond=false': function (buffer) { buffer['beginsWithBond'] = false; },
        'parenthesisLevel++': function (buffer) { buffer['parenthesisLevel']++; },
        'parenthesisLevel--': function (buffer) { buffer['parenthesisLevel']--; },
        'state of aggregation': function (buffer, m) {
          return { type_: 'state of aggregation', p1: mhchemParser.go(m, 'o') };
        },
        'comma': function (buffer, m) {
          var a = m.replace(/\s*$/, '');
          var withSpace = (a !== m);
          if (withSpace  &&  buffer['parenthesisLevel'] === 0) {
            return { type_: 'comma enumeration L', p1: a };
          } else {
            return { type_: 'comma enumeration M', p1: a };
          }
        },
        'output': function (buffer, m, entityFollows) {
          // entityFollows:
          //   undefined = if we have nothing else to output, also ignore the just read space (buffer.sb)
          //   1 = an entity follows, never omit the space if there was one just read before (can only apply to state 1)
          //   2 = 1 + the entity can have an amount, so output a\, instead of converting it to o (can only apply to states a|as)
          /** @type {ParserOutput | ParserOutput[]} */
          var ret;
          if (!buffer.r) {
            ret = [];
            if (!buffer.a && !buffer.b && !buffer.p && !buffer.o && !buffer.q && !buffer.d && !entityFollows) {
              //ret = [];
            } else {
              if (buffer.sb) {
                ret.push({ type_: 'entitySkip' });
              }
              if (!buffer.o && !buffer.q && !buffer.d && !buffer.b && !buffer.p && entityFollows!==2) {
                buffer.o = buffer.a;
                buffer.a = undefined;
              } else if (!buffer.o && !buffer.q && !buffer.d && (buffer.b || buffer.p)) {
                buffer.o = buffer.a;
                buffer.d = buffer.b;
                buffer.q = buffer.p;
                buffer.a = buffer.b = buffer.p = undefined;
              } else {
                if (buffer.o && buffer.dType==='kv' && mhchemParser.patterns.match_('d-oxidation$', buffer.d || "")) {
                  buffer.dType = 'oxidation';
                } else if (buffer.o && buffer.dType==='kv' && !buffer.q) {
                  buffer.dType = undefined;
                }
              }
              ret.push({
                type_: 'chemfive',
                a: mhchemParser.go(buffer.a, 'a'),
                b: mhchemParser.go(buffer.b, 'bd'),
                p: mhchemParser.go(buffer.p, 'pq'),
                o: mhchemParser.go(buffer.o, 'o'),
                q: mhchemParser.go(buffer.q, 'pq'),
                d: mhchemParser.go(buffer.d, (buffer.dType === 'oxidation' ? 'oxidation' : 'bd')),
                dType: buffer.dType
              });
            }
          } else {  // r
            /** @type {ParserOutput[]} */
            var rd;
            if (buffer.rdt === 'M') {
              rd = mhchemParser.go(buffer.rd, 'tex-math');
            } else if (buffer.rdt === 'T') {
              rd = [ { type_: 'text', p1: buffer.rd || "" } ];
            } else {
              rd = mhchemParser.go(buffer.rd);
            }
            /** @type {ParserOutput[]} */
            var rq;
            if (buffer.rqt === 'M') {
              rq = mhchemParser.go(buffer.rq, 'tex-math');
            } else if (buffer.rqt === 'T') {
              rq = [ { type_: 'text', p1: buffer.rq || ""} ];
            } else {
              rq = mhchemParser.go(buffer.rq);
            }
            ret = {
              type_: 'arrow',
              r: buffer.r,
              rd: rd,
              rq: rq
            };
          }
          for (var p in buffer) {
            if (p !== 'parenthesisLevel'  &&  p !== 'beginsWithBond') {
              delete buffer[p];
            }
          }
          return ret;
        },
        'oxidation-output': function (buffer, m) {
          var ret = [ "{" ];
          mhchemParser.concatArray(ret, mhchemParser.go(m, 'oxidation'));
          ret.push("}");
          return ret;
        },
        'frac-output': function (buffer, m) {
          return { type_: 'frac-ce', p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        'overset-output': function (buffer, m) {
          return { type_: 'overset', p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        'underset-output': function (buffer, m) {
          return { type_: 'underset', p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        'underbrace-output': function (buffer, m) {
          return { type_: 'underbrace', p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        'color-output': function (buffer, m) {
          return { type_: 'color', color1: m[0], color2: mhchemParser.go(m[1]) };
        },
        'r=': function (buffer, m) { buffer.r = m; },
        'rdt=': function (buffer, m) { buffer.rdt = m; },
        'rd=': function (buffer, m) { buffer.rd = m; },
        'rqt=': function (buffer, m) { buffer.rqt = m; },
        'rq=': function (buffer, m) { buffer.rq = m; },
        'operator': function (buffer, m, p1) { return { type_: 'operator', kind_: (p1 || m) }; }
      }
    },
    'a': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        '1/2$': {
          '0': { action_: '1/2' } },
        'else': {
          '0': { nextState: '1', revisit: true } },
        '$(...)$': {
          '*': { action_: 'tex-math tight', nextState: '1' } },
        ',': {
          '*': { action_: { type_: 'insert', option: 'commaDecimal' } } },
        'else2': {
          '*': { action_: 'copy' } }
      }),
      actions: {}
    },
    'o': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        '1/2$': {
          '0': { action_: '1/2' } },
        'else': {
          '0': { nextState: '1', revisit: true } },
        'letters': {
          '*': { action_: 'rm' } },
        '\\ca': {
          '*': { action_: { type_: 'insert', option: 'circa' } } },
        '\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'copy' } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        '{(...)}': {
          '*': { action_: '{text}' } },
        'else2': {
          '*': { action_: 'copy' } }
      }),
      actions: {}
    },
    'text': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        '{...}': {
          '*': { action_: 'text=' } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        '\\greek': {
          '*': { action_: [ 'output', 'rm' ] } },
        '\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: [ 'output', 'copy' ] } },
        'else': {
          '*': { action_: 'text=' } }
      }),
      actions: {
        'output': function (buffer) {
          if (buffer.text_) {
            /** @type {ParserOutput} */
            var ret = { type_: 'text', p1: buffer.text_ };
            for (var p in buffer) { delete buffer[p]; }
            return ret;
          }
        }
      }
    },
    'pq': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        'state of aggregation $': {
          '*': { action_: 'state of aggregation' } },
        'i$': {
          '0': { nextState: '!f', revisit: true } },
        '(KV letters),': {
          '0': { action_: 'rm', nextState: '0' } },
        'formula$': {
          '0': { nextState: 'f', revisit: true } },
        '1/2$': {
          '0': { action_: '1/2' } },
        'else': {
          '0': { nextState: '!f', revisit: true } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        '{(...)}': {
          '*': { action_: 'text' } },
        'a-z': {
          'f': { action_: 'tex-math' } },
        'letters': {
          '*': { action_: 'rm' } },
        '-9.,9': {
          '*': { action_: '9,9'  } },
        ',': {
          '*': { action_: { type_: 'insert+p1', option: 'comma enumeration S' } } },
        '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
          '*': { action_: 'color-output' } },
        '\\color{(...)}0': {
          '*': { action_: 'color0-output' } },
        '\\ce{(...)}': {
          '*': { action_: 'ce' } },
        '\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'copy' } },
        'else2': {
          '*': { action_: 'copy' } }
      }),
      actions: {
        'state of aggregation': function (buffer, m) {
          return { type_: 'state of aggregation subscript', p1: mhchemParser.go(m, 'o') };
        },
        'color-output': function (buffer, m) {
          return { type_: 'color', color1: m[0], color2: mhchemParser.go(m[1], 'pq') };
        }
      }
    },
    'bd': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        'x$': {
          '0': { nextState: '!f', revisit: true } },
        'formula$': {
          '0': { nextState: 'f', revisit: true } },
        'else': {
          '0': { nextState: '!f', revisit: true } },
        '-9.,9 no missing 0': {
          '*': { action_: '9,9' } },
        '.': {
          '*': { action_: { type_: 'insert', option: 'electron dot' } } },
        'a-z': {
          'f': { action_: 'tex-math' } },
        'x': {
          '*': { action_: { type_: 'insert', option: 'KV x' } } },
        'letters': {
          '*': { action_: 'rm' } },
        '\'': {
          '*': { action_: { type_: 'insert', option: 'prime' } } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        '{(...)}': {
          '*': { action_: 'text' } },
        '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
          '*': { action_: 'color-output' } },
        '\\color{(...)}0': {
          '*': { action_: 'color0-output' } },
        '\\ce{(...)}': {
          '*': { action_: 'ce' } },
        '\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'copy' } },
        'else2': {
          '*': { action_: 'copy' } }
      }),
      actions: {
        'color-output': function (buffer, m) {
          return { type_: 'color', color1: m[0], color2: mhchemParser.go(m[1], 'bd') };
        }
      }
    },
    'oxidation': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        'roman numeral': {
          '*': { action_: 'roman-numeral' } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        'else': {
          '*': { action_: 'copy' } }
      }),
      actions: {
        'roman-numeral': function (buffer, m) { return { type_: 'roman numeral', p1: m || "" }; }
      }
    },
    'tex-math': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        '\\ce{(...)}': {
          '*': { action_: [ 'output', 'ce' ] } },
        '{...}|\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'o=' } },
        'else': {
          '*': { action_: 'o=' } }
      }),
      actions: {
        'output': function (buffer) {
          if (buffer.o) {
            /** @type {ParserOutput} */
            var ret = { type_: 'tex-math', p1: buffer.o };
            for (var p in buffer) { delete buffer[p]; }
            return ret;
          }
        }
      }
    },
    'tex-math tight': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        '\\ce{(...)}': {
          '*': { action_: [ 'output', 'ce' ] } },
        '{...}|\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'o=' } },
        '-|+': {
          '*': { action_: 'tight operator' } },
        'else': {
          '*': { action_: 'o=' } }
      }),
      actions: {
        'tight operator': function (buffer, m) { buffer.o = (buffer.o || "") + "{"+m+"}"; },
        'output': function (buffer) {
          if (buffer.o) {
            /** @type {ParserOutput} */
            var ret = { type_: 'tex-math', p1: buffer.o };
            for (var p in buffer) { delete buffer[p]; }
            return ret;
          }
        }
      }
    },
    '9,9': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        ',': {
          '*': { action_: 'comma' } },
        'else': {
          '*': { action_: 'copy' } }
      }),
      actions: {
        'comma': function () { return { type_: 'commaDecimal' }; }
      }
    },
    //#endregion
    //
    // \pu state machines
    //
    //#region pu
    'pu': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        'space$': {
          '*': { action_: [ 'output', 'space' ] } },
        '{[(|)]}': {
          '0|a': { action_: 'copy' } },
        '(-)(9)^(-9)': {
          '0': { action_: 'number^', nextState: 'a' } },
        '(-)(9.,9)(e)(99)': {
          '0': { action_: 'enumber', nextState: 'a' } },
        'space': {
          '0|a': {} },
        'pm-operator': {
          '0|a': { action_: { type_: 'operator', option: '\\pm' }, nextState: '0' } },
        'operator': {
          '0|a': { action_: 'copy', nextState: '0' } },
        '//': {
          'd': { action_: 'o=', nextState: '/' } },
        '/': {
          'd': { action_: 'o=', nextState: '/' } },
        '{...}|else': {
          '0|d': { action_: 'd=', nextState: 'd' },
          'a': { action_: [ 'space', 'd=' ], nextState: 'd' },
          '/|q': { action_: 'q=', nextState: 'q' } }
      }),
      actions: {
        'enumber': function (buffer, m) {
          /** @type {ParserOutput[]} */
          var ret = [];
          if (m[0] === "+-"  ||  m[0] === "+/-") {
            ret.push("\\pm ");
          } else if (m[0]) {
            ret.push(m[0]);
          }
          if (m[1]) {
            mhchemParser.concatArray(ret, mhchemParser.go(m[1], 'pu-9,9'));
            if (m[2]) {
              if (m[2].match(/[,.]/)) {
                mhchemParser.concatArray(ret, mhchemParser.go(m[2], 'pu-9,9'));
              } else {
                ret.push(m[2]);
              }
            }
            m[3] = m[4] || m[3];
            if (m[3]) {
              m[3] = m[3].trim();
              if (m[3] === "e"  ||  m[3].substr(0, 1) === "*") {
                ret.push({ type_: 'cdot' });
              } else {
                ret.push({ type_: 'times' });
              }
            }
          }
          if (m[3]) {
            ret.push("10^{"+m[5]+"}");
          }
          return ret;
        },
        'number^': function (buffer, m) {
          /** @type {ParserOutput[]} */
          var ret = [];
          if (m[0] === "+-"  ||  m[0] === "+/-") {
            ret.push("\\pm ");
          } else if (m[0]) {
            ret.push(m[0]);
          }
          mhchemParser.concatArray(ret, mhchemParser.go(m[1], 'pu-9,9'));
          ret.push("^{"+m[2]+"}");
          return ret;
        },
        'operator': function (buffer, m, p1) { return { type_: 'operator', kind_: (p1 || m) }; },
        'space': function () { return { type_: 'pu-space-1' }; },
        'output': function (buffer) {
          /** @type {ParserOutput | ParserOutput[]} */
          var ret;
          var md = mhchemParser.patterns.match_('{(...)}', buffer.d || "");
          if (md  &&  md.remainder === '') { buffer.d = md.match_; }
          var mq = mhchemParser.patterns.match_('{(...)}', buffer.q || "");
          if (mq  &&  mq.remainder === '') { buffer.q = mq.match_; }
          if (buffer.d) {
            buffer.d = buffer.d.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
            buffer.d = buffer.d.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
          }
          if (buffer.q) {  // fraction
            buffer.q = buffer.q.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
            buffer.q = buffer.q.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
            var b5 = {
              d: mhchemParser.go(buffer.d, 'pu'),
              q: mhchemParser.go(buffer.q, 'pu')
            };
            if (buffer.o === '//') {
              ret = { type_: 'pu-frac', p1: b5.d, p2: b5.q };
            } else {
              ret = b5.d;
              if (b5.d.length > 1  ||  b5.q.length > 1) {
                ret.push({ type_: ' / ' });
              } else {
                ret.push({ type_: '/' });
              }
              mhchemParser.concatArray(ret, b5.q);
            }
          } else {  // no fraction
            ret = mhchemParser.go(buffer.d, 'pu-2');
          }
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
      }
    },
    'pu-2': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        '*': {
          '*': { action_: [ 'output', 'cdot' ], nextState: '0' } },
        '\\x': {
          '*': { action_: 'rm=' } },
        'space': {
          '*': { action_: [ 'output', 'space' ], nextState: '0' } },
        '^{(...)}|^(-1)': {
          '1': { action_: '^(-1)' } },
        '-9.,9': {
          '0': { action_: 'rm=', nextState: '0' },
          '1': { action_: '^(-1)', nextState: '0' } },
        '{...}|else': {
          '*': { action_: 'rm=', nextState: '1' } }
      }),
      actions: {
        'cdot': function () { return { type_: 'tight cdot' }; },
        '^(-1)': function (buffer, m) { buffer.rm += "^{"+m+"}"; },
        'space': function () { return { type_: 'pu-space-2' }; },
        'output': function (buffer) {
          /** @type {ParserOutput | ParserOutput[]} */
          var ret = [];
          if (buffer.rm) {
            var mrm = mhchemParser.patterns.match_('{(...)}', buffer.rm || "");
            if (mrm  &&  mrm.remainder === '') {
              ret = mhchemParser.go(mrm.match_, 'pu');
            } else {
              ret = { type_: 'rm', p1: buffer.rm };
            }
          }
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
      }
    },
    'pu-9,9': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '0': { action_: 'output-0' },
          'o': { action_: 'output-o' } },
        ',': {
          '0': { action_: [ 'output-0', 'comma' ], nextState: 'o' } },
        '.': {
          '0': { action_: [ 'output-0', 'copy' ], nextState: 'o' } },
        'else': {
          '*': { action_: 'text=' } }
      }),
      actions: {
        'comma': function () { return { type_: 'commaDecimal' }; },
        'output-0': function (buffer) {
          /** @type {ParserOutput[]} */
          var ret = [];
          buffer.text_ = buffer.text_ || "";
          if (buffer.text_.length > 4) {
            var a = buffer.text_.length % 3;
            if (a === 0) { a = 3; }
            for (var i=buffer.text_.length-3; i>0; i-=3) {
              ret.push(buffer.text_.substr(i, 3));
              ret.push({ type_: '1000 separator' });
            }
            ret.push(buffer.text_.substr(0, a));
            ret.reverse();
          } else {
            ret.push(buffer.text_);
          }
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        },
        'output-o': function (buffer) {
          /** @type {ParserOutput[]} */
          var ret = [];
          buffer.text_ = buffer.text_ || "";
          if (buffer.text_.length > 4) {
            var a = buffer.text_.length - 3;
            for (var i=0; i<a; i+=3) {
              ret.push(buffer.text_.substr(i, 3));
              ret.push({ type_: '1000 separator' });
            }
            ret.push(buffer.text_.substr(i));
          } else {
            ret.push(buffer.text_);
          }
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
      }
    }
    //#endregion
  };

  //
  // texify: Take MhchemParser output and convert it to TeX
  //
  /** @type {Texify} */
  var texify = {
    go: function (input, isInner) {  // (recursive, max 4 levels)
      if (!input) { return ""; }
      var res = "";
      var cee = false;
      for (var i=0; i < input.length; i++) {
        var inputi = input[i];
        if (typeof inputi === "string") {
          res += inputi;
        } else {
          res += texify._go2(inputi);
          if (inputi.type_ === '1st-level escape') { cee = true; }
        }
      }
      if (!isInner && !cee && res) {
        res = "{" + res + "}";
      }
      return res;
    },
    _goInner: function (input) {
      if (!input) { return input; }
      return texify.go(input, true);
    },
    _go2: function (buf) {
      /** @type {undefined | string} */
      var res;
      switch (buf.type_) {
        case 'chemfive':
          res = "";
          var b5 = {
            a: texify._goInner(buf.a),
            b: texify._goInner(buf.b),
            p: texify._goInner(buf.p),
            o: texify._goInner(buf.o),
            q: texify._goInner(buf.q),
            d: texify._goInner(buf.d)
          };
          //
          // a
          //
          if (b5.a) {
            if (b5.a.match(/^[+\-]/)) { b5.a = "{"+b5.a+"}"; }
            res += b5.a + "\\,";
          }
          //
          // b and p
          //
          if (b5.b || b5.p) {
            res += "{\\vphantom{X}}";
            res += "^{\\hphantom{"+(b5.b||"")+"}}_{\\hphantom{"+(b5.p||"")+"}}";
            res += "{\\vphantom{X}}";
            res += "^{\\smash[t]{\\vphantom{2}}\\mathllap{"+(b5.b||"")+"}}";
            res += "_{\\vphantom{2}\\mathllap{\\smash[t]{"+(b5.p||"")+"}}}";
          }
          //
          // o
          //
          if (b5.o) {
            if (b5.o.match(/^[+\-]/)) { b5.o = "{"+b5.o+"}"; }
            res += b5.o;
          }
          //
          // q and d
          //
          if (buf.dType === 'kv') {
            if (b5.d || b5.q) {
              res += "{\\vphantom{X}}";
            }
            if (b5.d) {
              res += "^{"+b5.d+"}";
            }
            if (b5.q) {
              res += "_{\\smash[t]{"+b5.q+"}}";
            }
          } else if (buf.dType === 'oxidation') {
            if (b5.d) {
              res += "{\\vphantom{X}}";
              res += "^{"+b5.d+"}";
            }
            if (b5.q) {
              // A Firefox bug adds a bogus depth to <mphantom>, so we change \vphantom{X} to {}
              // TODO: Reinstate \vphantom{X} when the Firefox bug is fixed.
//              res += "{\\vphantom{X}}";
              res += "{{}}";
              res += "_{\\smash[t]{"+b5.q+"}}";
            }
          } else {
            if (b5.q) {
              // TODO: Reinstate \vphantom{X} when the Firefox bug is fixed.
//              res += "{\\vphantom{X}}";
              res += "{{}}";
              res += "_{\\smash[t]{"+b5.q+"}}";
            }
            if (b5.d) {
              // TODO: Reinstate \vphantom{X} when the Firefox bug is fixed.
//              res += "{\\vphantom{X}}";
              res += "{{}}";
              res += "^{"+b5.d+"}";
            }
          }
          break;
        case 'rm':
          res = "\\mathrm{"+buf.p1+"}";
          break;
        case 'text':
          if (buf.p1.match(/[\^_]/)) {
            buf.p1 = buf.p1.replace(" ", "~").replace("-", "\\text{-}");
            res = "\\mathrm{"+buf.p1+"}";
          } else {
            res = "\\text{"+buf.p1+"}";
          }
          break;
        case 'roman numeral':
          res = "\\mathrm{"+buf.p1+"}";
          break;
        case 'state of aggregation':
          res = "\\mskip2mu "+texify._goInner(buf.p1);
          break;
        case 'state of aggregation subscript':
          res = "\\mskip1mu "+texify._goInner(buf.p1);
          break;
        case 'bond':
          res = texify._getBond(buf.kind_);
          if (!res) {
            throw ["MhchemErrorBond", "mhchem Error. Unknown bond type (" + buf.kind_ + ")"];
          }
          break;
        case 'frac':
          var c = "\\frac{" + buf.p1 + "}{" + buf.p2 + "}";
          res = "\\mathchoice{\\textstyle"+c+"}{"+c+"}{"+c+"}{"+c+"}";
          break;
        case 'pu-frac':
          var d = "\\frac{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          res = "\\mathchoice{\\textstyle"+d+"}{"+d+"}{"+d+"}{"+d+"}";
          break;
        case 'tex-math':
          res = buf.p1 + " ";
          break;
        case 'frac-ce':
          res = "\\frac{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case 'overset':
          res = "\\overset{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case 'underset':
          res = "\\underset{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case 'underbrace':
          res =  "\\underbrace{" + texify._goInner(buf.p1) + "}_{" + texify._goInner(buf.p2) + "}";
          break;
        case 'color':
          res = "{\\color{" + buf.color1 + "}{" + texify._goInner(buf.color2) + "}}";
          break;
        case 'color0':
          res = "\\color{" + buf.color + "}";
          break;
        case 'arrow':
          var b6 = {
            rd: texify._goInner(buf.rd),
            rq: texify._goInner(buf.rq)
          };
          var arrow = texify._getArrow(buf.r);
          if (b6.rq) { arrow += "[{\\rm " + b6.rq + "}]"; }
          if (b6.rd) {
            arrow += "{\\rm " + b6.rd + "}";
          } else {
            arrow += "{}";
          }
          res = arrow;
          break;
        case 'operator':
          res = texify._getOperator(buf.kind_);
          break;
        case '1st-level escape':
          res = buf.p1+" ";  // &, \\\\, \\hlin
          break;
        case 'space':
          res = " ";
          break;
        case 'entitySkip':
          res = "~";
          break;
        case 'pu-space-1':
          res = "~";
          break;
        case 'pu-space-2':
          res = "\\mkern3mu ";
          break;
        case '1000 separator':
          res = "\\mkern2mu ";
          break;
        case 'commaDecimal':
          res = "{,}";
          break;
          case 'comma enumeration L':
          res = "{"+buf.p1+"}\\mkern6mu ";
          break;
        case 'comma enumeration M':
          res = "{"+buf.p1+"}\\mkern3mu ";
          break;
        case 'comma enumeration S':
          res = "{"+buf.p1+"}\\mkern1mu ";
          break;
        case 'hyphen':
          res = "\\text{-}";
          break;
        case 'addition compound':
          res = "\\,{\\cdot}\\,";
          break;
        case 'electron dot':
          res = "\\mkern1mu \\text{\\textbullet}\\mkern1mu ";
          break;
        case 'KV x':
          res = "{\\times}";
          break;
        case 'prime':
          res = "\\prime ";
          break;
        case 'cdot':
          res = "\\cdot ";
          break;
        case 'tight cdot':
          res = "\\mkern1mu{\\cdot}\\mkern1mu ";
          break;
        case 'times':
          res = "\\times ";
          break;
        case 'circa':
          res = "{\\sim}";
          break;
        case '^':
          res = "uparrow";
          break;
        case 'v':
          res = "downarrow";
          break;
        case 'ellipsis':
          res = "\\ldots ";
          break;
        case '/':
          res = "/";
          break;
        case ' / ':
          res = "\\,/\\,";
          break;
        default:
          assertNever(buf);
          throw ["MhchemBugT", "mhchem bug T. Please report."];  // Missing texify rule or unknown MhchemParser output
      }
      assertString(res);
      return res;
    },
    _getArrow: function (a) {
      switch (a) {
        case "->": return "\\yields";
        case "\u2192": return "\\yields";
        case "\u27F6": return "\\yields";
        case "<-": return "\\yieldsLeft";
        case "<->": return "\\mesomerism";
        case "<-->": return "\\yieldsLeftRight";
        case "<=>": return "\\equilibrium";
        case "\u21CC": return "\\equilibrium";
        case "<=>>": return "\\equilibriumRight";
        case "<<=>": return "\\equilibriumLeft";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    },
    _getBond: function (a) {
      switch (a) {
        case "-": return "{-}";
        case "1": return "{-}";
        case "=": return "{=}";
        case "2": return "{=}";
        case "#": return "{\\equiv}";
        case "3": return "{\\equiv}";
        case "~": return "{\\tripleDash}";
        case "~-": return "{\\tripleDashOverLine}";
        case "~=": return "{\\tripleDashOverDoubleLine}";
        case "~--": return "{\\tripleDashOverDoubleLine}";
        case "-~-": return "{\\tripleDashBetweenDoubleLine}";
        case "...": return "{{\\cdot}{\\cdot}{\\cdot}}";
        case "....": return "{{\\cdot}{\\cdot}{\\cdot}{\\cdot}}";
        case "->": return "{\\rightarrow}";
        case "<-": return "{\\leftarrow}";
        case "<": return "{<}";
        case ">": return "{>}";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    },
    _getOperator: function (a) {
      switch (a) {
        case "+": return " {}+{} ";
        case "-": return " {}-{} ";
        case "=": return " {}={} ";
        case "<": return " {}<{} ";
        case ">": return " {}>{} ";
        case "<<": return " {}\\ll{} ";
        case ">>": return " {}\\gg{} ";
        case "\\pm": return " {}\\pm{} ";
        case "\\approx": return " {}\\approx{} ";
        case "$\\approx$": return " {}\\approx{} ";
        case "v": return " \\downarrow{} ";
        case "(v)": return " \\downarrow{} ";
        case "^": return " \\uparrow{} ";
        case "(^)": return " \\uparrow{} ";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    }
  };

  //
  // Helpers for code analysis
  // Will show type error at calling position
  //
  /** @param {number} a */
  function assertNever(a) {}
  /** @param {string} a */
  function assertString(a) {}
/* eslint-disable no-undef */

/****************************************************
 *
 *  physics.js
 *
 *  Implements the Physics Package for LaTeX input.
 *
 *  ---------------------------------------------------------------------
 *
 *  The original version of this file is licensed as follows:
 *  Copyright (c) 2015-2016 Kolen Cheung <https://github.com/ickc/MathJax-third-party-extensions>.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *  ---------------------------------------------------------------------
 *
 *  This file has been revised from the original in the following ways:
 *  1. The interface is changed so that it can be called from Temml, not MathJax.
 *  2. \Re and \Im are not used, to avoid conflict with existing LaTeX letters.
 *
 *  This revision of the file is released under the MIT license.
 *  https://mit-license.org/
 */
temml.__defineMacro("\\quantity", "{\\left\\{ #1 \\right\\}}");
temml.__defineMacro("\\qty", "{\\left\\{ #1 \\right\\}}");
temml.__defineMacro("\\pqty", "{\\left( #1 \\right)}");
temml.__defineMacro("\\bqty", "{\\left[ #1 \\right]}");
temml.__defineMacro("\\vqty", "{\\left\\vert #1 \\right\\vert}");
temml.__defineMacro("\\Bqty", "{\\left\\{ #1 \\right\\}}");
temml.__defineMacro("\\absolutevalue", "{\\left\\vert #1 \\right\\vert}");
temml.__defineMacro("\\abs", "{\\left\\vert #1 \\right\\vert}");
temml.__defineMacro("\\norm", "{\\left\\Vert #1 \\right\\Vert}");
temml.__defineMacro("\\evaluated", "{\\left.#1 \\right\\vert}");
temml.__defineMacro("\\eval", "{\\left.#1 \\right\\vert}");
temml.__defineMacro("\\order", "{\\mathcal{O} \\left( #1 \\right)}");
temml.__defineMacro("\\commutator", "{\\left[ #1 , #2 \\right]}");
temml.__defineMacro("\\comm", "{\\left[ #1 , #2 \\right]}");
temml.__defineMacro("\\anticommutator", "{\\left\\{ #1 , #2 \\right\\}}");
temml.__defineMacro("\\acomm", "{\\left\\{ #1 , #2 \\right\\}}");
temml.__defineMacro("\\poissonbracket", "{\\left\\{ #1 , #2 \\right\\}}");
temml.__defineMacro("\\pb", "{\\left\\{ #1 , #2 \\right\\}}");
temml.__defineMacro("\\vectorbold", "{\\boldsymbol{ #1 }}");
temml.__defineMacro("\\vb", "{\\boldsymbol{ #1 }}");
temml.__defineMacro("\\vectorarrow", "{\\vec{\\boldsymbol{ #1 }}}");
temml.__defineMacro("\\va", "{\\vec{\\boldsymbol{ #1 }}}");
temml.__defineMacro("\\vectorunit", "{{\\boldsymbol{\\hat{ #1 }}}}");
temml.__defineMacro("\\vu", "{{\\boldsymbol{\\hat{ #1 }}}}");
temml.__defineMacro("\\dotproduct", "\\mathbin{\\boldsymbol\\cdot}");
temml.__defineMacro("\\vdot", "{\\boldsymbol\\cdot}");
temml.__defineMacro("\\crossproduct", "\\mathbin{\\boldsymbol\\times}");
temml.__defineMacro("\\cross", "\\mathbin{\\boldsymbol\\times}");
temml.__defineMacro("\\cp", "\\mathbin{\\boldsymbol\\times}");
temml.__defineMacro("\\gradient", "{\\boldsymbol\\nabla}");
temml.__defineMacro("\\grad", "{\\boldsymbol\\nabla}");
temml.__defineMacro("\\divergence", "{\\grad\\vdot}");
//temml.__defineMacro("\\div", "{\\grad\\vdot}"); Not included in Temml. Conflicts w/LaTeX \div
temml.__defineMacro("\\curl", "{\\grad\\cross}");
temml.__defineMacro("\\laplacian", "\\nabla^2");
temml.__defineMacro("\\tr", "{\\operatorname{tr}}");
temml.__defineMacro("\\Tr", "{\\operatorname{Tr}}");
temml.__defineMacro("\\rank", "{\\operatorname{rank}}");
temml.__defineMacro("\\erf", "{\\operatorname{erf}}");
temml.__defineMacro("\\Res", "{\\operatorname{Res}}");
temml.__defineMacro("\\principalvalue", "{\\mathcal{P}}");
temml.__defineMacro("\\pv", "{\\mathcal{P}}");
temml.__defineMacro("\\PV", "{\\operatorname{P.V.}}");
// Temml does not use the next two lines. They conflict with LaTeX letters.
//temml.__defineMacro("\\Re", "{\\operatorname{Re} \\left\\{ #1 \\right\\}}");
//temml.__defineMacro("\\Im", "{\\operatorname{Im} \\left\\{ #1 \\right\\}}");
temml.__defineMacro("\\qqtext", "{\\quad\\text{ #1 }\\quad}");
temml.__defineMacro("\\qq", "{\\quad\\text{ #1 }\\quad}");
temml.__defineMacro("\\qcomma", "{\\text{,}\\quad}");
temml.__defineMacro("\\qc", "{\\text{,}\\quad}");
temml.__defineMacro("\\qcc", "{\\quad\\text{c.c.}\\quad}");
temml.__defineMacro("\\qif", "{\\quad\\text{if}\\quad}");
temml.__defineMacro("\\qthen", "{\\quad\\text{then}\\quad}");
temml.__defineMacro("\\qelse", "{\\quad\\text{else}\\quad}");
temml.__defineMacro("\\qotherwise", "{\\quad\\text{otherwise}\\quad}");
temml.__defineMacro("\\qunless", "{\\quad\\text{unless}\\quad}");
temml.__defineMacro("\\qgiven", "{\\quad\\text{given}\\quad}");
temml.__defineMacro("\\qusing", "{\\quad\\text{using}\\quad}");
temml.__defineMacro("\\qassume", "{\\quad\\text{assume}\\quad}");
temml.__defineMacro("\\qsince", "{\\quad\\text{since}\\quad}");
temml.__defineMacro("\\qlet", "{\\quad\\text{let}\\quad}");
temml.__defineMacro("\\qfor", "{\\quad\\text{for}\\quad}");
temml.__defineMacro("\\qall", "{\\quad\\text{all}\\quad}");
temml.__defineMacro("\\qeven", "{\\quad\\text{even}\\quad}");
temml.__defineMacro("\\qodd", "{\\quad\\text{odd}\\quad}");
temml.__defineMacro("\\qinteger", "{\\quad\\text{integer}\\quad}");
temml.__defineMacro("\\qand", "{\\quad\\text{and}\\quad}");
temml.__defineMacro("\\qor", "{\\quad\\text{or}\\quad}");
temml.__defineMacro("\\qas", "{\\quad\\text{as}\\quad}");
temml.__defineMacro("\\qin", "{\\quad\\text{in}\\quad}");
temml.__defineMacro("\\differential", "{\\text{d}}");
temml.__defineMacro("\\dd", "{\\text{d}}");
temml.__defineMacro("\\derivative", "{\\frac{\\text{d}{ #1 }}{\\text{d}{ #2 }}}");
temml.__defineMacro("\\dv", "{\\frac{\\text{d}{ #1 }}{\\text{d}{ #2 }}}");
temml.__defineMacro("\\partialderivative", "{\\frac{\\partial{ #1 }}{\\partial{ #2 }}}");
temml.__defineMacro("\\variation", "{\\delta}");
temml.__defineMacro("\\var", "{\\delta}");
temml.__defineMacro("\\functionalderivative", "{\\frac{\\delta{ #1 }}{\\delta{ #2 }}}");
temml.__defineMacro("\\fdv", "{\\frac{\\delta{ #1 }}{\\delta{ #2 }}}");
temml.__defineMacro("\\innerproduct", "{\\left\\langle {#1} \\mid { #2} \\right\\rangle}");
temml.__defineMacro("\\outerproduct",
  "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}");
temml.__defineMacro("\\dyad",
  "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}");
temml.__defineMacro("\\ketbra",
  "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}");
temml.__defineMacro("\\op",
  "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}");
temml.__defineMacro("\\expectationvalue", "{\\left\\langle {#1 } \\right\\rangle}");
temml.__defineMacro("\\expval", "{\\left\\langle {#1 } \\right\\rangle}");
temml.__defineMacro("\\ev", "{\\left\\langle {#1 } \\right\\rangle}");
temml.__defineMacro("\\matrixelement",
  "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}");
temml.__defineMacro("\\matrixel",
  "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}");
temml.__defineMacro("\\mel",
  "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}");
/* eslint-disable no-undef */

//////////////////////////////////////////////////////////////////////
// texvc.sty

// The texvc package contains macros available in mediawiki pages.
// We omit the functions deprecated at
// https://en.wikipedia.org/wiki/Help:Displaying_a_formula#Deprecated_syntax

// We also omit texvc's \O, which conflicts with \text{\O}

temml.__defineMacro("\\darr", "\\downarrow");
temml.__defineMacro("\\dArr", "\\Downarrow");
temml.__defineMacro("\\Darr", "\\Downarrow");
temml.__defineMacro("\\lang", "\\langle");
temml.__defineMacro("\\rang", "\\rangle");
temml.__defineMacro("\\uarr", "\\uparrow");
temml.__defineMacro("\\uArr", "\\Uparrow");
temml.__defineMacro("\\Uarr", "\\Uparrow");
temml.__defineMacro("\\N", "\\mathbb{N}");
temml.__defineMacro("\\R", "\\mathbb{R}");
temml.__defineMacro("\\Z", "\\mathbb{Z}");
temml.__defineMacro("\\alef", "\\aleph");
temml.__defineMacro("\\alefsym", "\\aleph");
temml.__defineMacro("\\bull", "\\bullet");
temml.__defineMacro("\\clubs", "\\clubsuit");
temml.__defineMacro("\\cnums", "\\mathbb{C}");
temml.__defineMacro("\\Complex", "\\mathbb{C}");
temml.__defineMacro("\\Dagger", "\\ddagger");
temml.__defineMacro("\\diamonds", "\\diamondsuit");
temml.__defineMacro("\\empty", "\\emptyset");
temml.__defineMacro("\\exist", "\\exists");
temml.__defineMacro("\\harr", "\\leftrightarrow");
temml.__defineMacro("\\hArr", "\\Leftrightarrow");
temml.__defineMacro("\\Harr", "\\Leftrightarrow");
temml.__defineMacro("\\hearts", "\\heartsuit");
temml.__defineMacro("\\image", "\\Im");
temml.__defineMacro("\\infin", "\\infty");
temml.__defineMacro("\\isin", "\\in");
temml.__defineMacro("\\larr", "\\leftarrow");
temml.__defineMacro("\\lArr", "\\Leftarrow");
temml.__defineMacro("\\Larr", "\\Leftarrow");
temml.__defineMacro("\\lrarr", "\\leftrightarrow");
temml.__defineMacro("\\lrArr", "\\Leftrightarrow");
temml.__defineMacro("\\Lrarr", "\\Leftrightarrow");
temml.__defineMacro("\\natnums", "\\mathbb{N}");
temml.__defineMacro("\\plusmn", "\\pm");
temml.__defineMacro("\\rarr", "\\rightarrow");
temml.__defineMacro("\\rArr", "\\Rightarrow");
temml.__defineMacro("\\Rarr", "\\Rightarrow");
temml.__defineMacro("\\real", "\\Re");
temml.__defineMacro("\\reals", "\\mathbb{R}");
temml.__defineMacro("\\Reals", "\\mathbb{R}");
temml.__defineMacro("\\sdot", "\\cdot");
temml.__defineMacro("\\sect", "\\S");
temml.__defineMacro("\\spades", "\\spadesuit");
temml.__defineMacro("\\sub", "\\subset");
temml.__defineMacro("\\sube", "\\subseteq");
temml.__defineMacro("\\supe", "\\supseteq");
temml.__defineMacro("\\thetasym", "\\vartheta");
temml.__defineMacro("\\weierp", "\\wp");

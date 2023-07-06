"use strict";
var Civet = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // source/lib.js
  var require_lib = __commonJS({
    "source/lib.js"(exports, module) {
      "use strict";
      function addParentPointers(node, parent) {
        if (node == null)
          return;
        if (typeof node !== "object")
          return;
        if (Array.isArray(node)) {
          for (const child of node) {
            addParentPointers(child, parent);
          }
          return;
        }
        node.parent = parent;
        if (node.children) {
          for (const child of node.children) {
            addParentPointers(child, node);
          }
        }
      }
      function addPostfixStatement(statement, ws, post) {
        let children, expressions;
        if (post.blockPrefix?.length) {
          let indent = post.blockPrefix[0][0];
          expressions = [...post.blockPrefix, [indent, statement]];
          children = [" {\n", ...expressions, "\n", indent?.slice?.(0, -2), "}"];
        } else {
          expressions = [["", statement]];
          children = [" { ", ...expressions, " }"];
        }
        const block = {
          type: "BlockStatement",
          children,
          expressions
        };
        children = [...post.children];
        children.push(block);
        if (!isWhitespaceOrEmpty(ws))
          children.push(ws);
        post = { ...post, children, block };
        if (post.type === "IfStatement") {
          post.then = block;
        }
        return post;
      }
      function adjustAtBindings(statements, asThis = false) {
        gatherRecursiveAll(statements, (n) => n.type === "AtBindingProperty").forEach((binding) => {
          const { ref } = binding;
          if (asThis) {
            const atBinding = binding.binding;
            atBinding.children.pop();
            atBinding.type = void 0;
            binding.children.unshift(ref.id, ": this.", ref.base);
            binding.type = "Property";
            binding.ref = void 0;
            return;
          }
          if (ref.names[0] !== ref.base) {
            binding.children.unshift(ref.base, ": ");
          }
        });
      }
      function adjustBindingElements(elements) {
        const names = elements.flatMap((p) => p.names || []), { length } = elements;
        let blockPrefix, restIndex = -1, restCount = 0;
        elements.forEach(({ type }, i) => {
          if (type === "BindingRestElement") {
            if (restIndex < 0)
              restIndex = i;
            restCount++;
          }
        });
        if (restCount === 0) {
          return {
            children: elements,
            names,
            blockPrefix,
            length
          };
        } else if (restCount === 1) {
          const rest = elements[restIndex];
          const after = elements.slice(restIndex + 1);
          const restIdentifier = rest.binding.ref || rest.binding;
          names.push(...rest.names || []);
          let l = after.length;
          if (l) {
            if (arrayElementHasTrailingComma(after[l - 1]))
              l++;
            blockPrefix = {
              type: "PostRestBindingElements",
              children: ["[", insertTrimmingSpace(after, ""), "] = ", restIdentifier, ".splice(-", l.toString(), ")"],
              names: after.flatMap((p) => p.names)
            };
          }
          return {
            names,
            children: [...elements.slice(0, restIndex), {
              ...rest,
              children: rest.children.slice(0, -1)
            }],
            blockPrefix,
            length
          };
        }
        const err = {
          type: "Error",
          children: ["Multiple rest elements in array pattern"]
        };
        return {
          names,
          children: [...elements, err],
          blockPrefix,
          length
        };
      }
      function aliasBinding(p, ref) {
        if (p.type === "Identifier") {
          p.children[0] = ref;
        } else if (p.type === "BindingRestElement") {
          aliasBinding(p.binding, ref);
        } else if (p.value?.type === "Identifier") {
          aliasBinding(p.value, ref);
        } else {
          p.value = ref;
          p.children.push(": ", ref);
        }
      }
      function arrayElementHasTrailingComma(elementNode) {
        const { children } = elementNode, { length } = children;
        const lastChild = children[length - 1];
        if (lastChild) {
          const l2 = lastChild.length;
          if (lastChild[l2 - 1]?.token === ",") {
            return true;
          }
        }
        return false;
      }
      var assert = {
        equal(a, b, msg) {
          if (a !== b) {
            throw new Error(`Assertion failed [${msg}]: ${a} !== ${b}`);
          }
        }
      };
      function blockWithPrefix(prefixStatements, block) {
        if (prefixStatements && prefixStatements.length) {
          const indent = getIndent(block.expressions[0]);
          if (indent) {
            prefixStatements = prefixStatements.map((statement) => [indent, ...statement.slice(1)]);
          }
          const expressions = [...prefixStatements, ...block.expressions];
          block = {
            ...block,
            expressions,
            children: block.children === block.expressions ? expressions : block.children.map((c) => c === block.expressions ? expressions : c)
          };
          if (block.bare) {
            block.children = [[" {"], ...block.children, "}"];
            block.bare = false;
          }
        }
        return block;
      }
      function clone(node) {
        removeParentPointers(node);
        return deepCopy(node);
      }
      function constructInvocation(fn, arg) {
        const fnArr = [fn.leadingComment, fn.expr, fn.trailingComment];
        let expr = fn.expr;
        while (expr.type === "ParenthesizedExpression") {
          expr = expr.expression;
        }
        if (expr.ampersandBlock) {
          const { ref, body } = expr;
          ref.type = "PipedExpression";
          ref.children = [makeLeftHandSideExpression(arg)];
          return {
            type: "UnwrappedExpression",
            children: [skipIfOnlyWS(fn.leadingComment), ...body, skipIfOnlyWS(fn.trailingComment)]
          };
        }
        expr = fn.expr;
        const lhs = makeLeftHandSideExpression(expr);
        let comment = skipIfOnlyWS(fn.trailingComment);
        if (comment)
          lhs.children.splice(2, 0, comment);
        comment = skipIfOnlyWS(fn.leadingComment);
        if (comment)
          lhs.children.splice(1, 0, comment);
        switch (arg.type) {
          case "CommaExpression":
            arg = makeLeftHandSideExpression(arg);
            break;
        }
        return {
          type: "CallExpression",
          children: [lhs, "(", arg, ")"]
        };
      }
      function constructPipeStep(fn, arg, returning) {
        const children = [[fn.leadingComment, fn.expr, fn.trailingComment].map(skipIfOnlyWS), " ", arg];
        switch (fn.expr.token) {
          case "yield":
          case "await":
            if (returning) {
              return [
                children,
                returning
              ];
            }
            return [
              children,
              null
            ];
          case "return":
            return [{
              type: "ReturnStatement",
              children
            }, null];
        }
        if (returning) {
          return [
            constructInvocation(fn, arg),
            returning
          ];
        }
        return [constructInvocation(fn, arg), null];
      }
      var initialSpacingRe = /^(?:\r?\n|\n)*((?:\r?\n|\n)\s+)/;
      function dedentBlockString({ $loc, token: str }, spacing, trim = true) {
        if (spacing == null)
          spacing = str.match(initialSpacingRe);
        if (spacing) {
          str = str.replaceAll(spacing[1], "\n");
          const l = spacing.length;
          $loc.pos += l;
          $loc.length -= l;
        }
        if (trim) {
          str = str.replace(/^(\r?\n|\n)/, "").replace(/(\r?\n|\n)[ \t]*$/, "");
        }
        str = str.replace(/(\\.|`|\$\{)/g, (s) => {
          if (s[0] === "\\") {
            return s;
          }
          return `\\${s}`;
        });
        return {
          $loc,
          token: str
        };
      }
      function dedentBlockSubstitutions($0) {
        const [s, strWithSubstitutions, e] = $0;
        if (strWithSubstitutions.length === 0) {
          return $0;
        }
        let initialSpacing, i = 0, l = strWithSubstitutions.length, results = [s];
        const { token } = strWithSubstitutions[0];
        if (token) {
          initialSpacing = token.match(initialSpacingRe);
        } else {
          initialSpacing = false;
        }
        while (i < l) {
          let segment = strWithSubstitutions[i];
          if (segment.token) {
            segment = dedentBlockString(segment, initialSpacing, false);
            if (i === 0) {
              segment.token = segment.token.replace(/^(\r?\n|\n)/, "");
            }
            if (i === l - 1) {
              segment.token = segment.token.replace(/(\r?\n|\n)[ \t]*$/, "");
            }
            results.push(segment);
          } else {
            results.push(segment);
          }
          i++;
        }
        results.push(e);
        return {
          type: "TemplateLiteral",
          children: results
        };
      }
      function deepCopy(node) {
        if (node == null)
          return node;
        if (typeof node !== "object")
          return node;
        if (Array.isArray(node)) {
          return node.map(deepCopy);
        }
        return Object.fromEntries(
          Object.entries(node).map(([key, value]) => {
            return [key, deepCopy(value)];
          })
        );
      }
      function expressionizeIfClause(clause, b, e) {
        const children = clause.children.slice(1);
        children.push("?", b);
        if (e) {
          children.push(e[0], ":", ...e.slice(2));
        } else {
          children.push(":void 0");
        }
        return {
          type: "IfExpression",
          children
        };
      }
      function expressionizeIteration(exp) {
        const i = exp.children.indexOf(exp.block);
        if (exp.subtype === "DoStatement") {
          insertReturn(exp.block);
          exp.children.splice(i, 1, ...wrapIIFE(exp.children, exp.async));
          return;
        }
        const resultsRef = {
          type: "Ref",
          base: "results",
          id: "results"
        };
        insertPush(exp.block, resultsRef);
        exp.children.splice(
          i,
          1,
          wrapIIFE([
            "const ",
            resultsRef,
            "=[];",
            ...exp.children,
            "; return ",
            resultsRef
          ], exp.async)
        );
      }
      function processBinaryOpExpression($0) {
        const expandedOps = expandChainedComparisons($0);
        let i = 2;
        while (i < expandedOps.length) {
          const op = expandedOps[i];
          if (op.special) {
            let [a, wsOp, op2, wsB, b] = expandedOps.slice(i - 2, i + 3);
            if (op2.token === "instanceof" && b.type === "Literal" && b.children?.[0]?.type === "StringLiteral") {
              a = ["typeof ", makeLeftHandSideExpression(a)];
              if (op2.negated) {
                op2 = { ...op2, token: "!==", negated: false };
              } else {
                op2 = { ...op2, token: "===" };
              }
            }
            if (op2.asConst) {
              a = makeAsConst(a);
              b = makeAsConst(b);
            }
            let children;
            if (op2.call) {
              wsOp = insertTrimmingSpace(wsOp, "");
              if (op2.reversed) {
                wsB = insertTrimmingSpace(wsB, "");
                children = [wsOp, op2.call, "(", wsB, b, ", ", a, ")", op2.suffix];
              } else {
                children = [wsOp, op2.call, "(", a, ",", wsB, b, ")", op2.suffix];
              }
            } else if (op2.method) {
              wsOp = insertTrimmingSpace(wsOp, "");
              wsB = insertTrimmingSpace(wsB, "");
              if (op2.reversed) {
                children = [wsB, b, wsOp, ".", op2.method, "(", a, ")"];
              } else {
                children = [a, wsOp, ".", op2.method, "(", wsB, b, ")"];
              }
            } else if (op2.token) {
              children = [a, wsOp, op2, wsB, b];
              if (op2.negated)
                children = ["(", ...children, ")"];
            } else {
              throw new Error("Unknown operator: " + JSON.stringify(op2));
            }
            if (op2.negated)
              children.unshift("!");
            expandedOps.splice(i - 2, 5, {
              children
            });
          } else {
            i += 4;
          }
        }
        return expandedOps;
      }
      function processCallMemberExpression(node) {
        const { children } = node;
        for (let i = 0; i < children.length; i++) {
          const glob = children[i];
          if (glob?.type === "PropertyGlob") {
            let prefix = children.slice(0, i);
            const parts = [];
            let hoistDec, refAssignment = [];
            if (prefix.length > 1) {
              const ref = {
                type: "Ref",
                base: "ref"
              };
              hoistDec = {
                type: "Declaration",
                children: ["let ", ref],
                names: []
              };
              refAssignment = [{
                type: "AssignmentExpression",
                children: [ref, " = ", prefix]
              }, ","];
              prefix = [ref];
            }
            prefix = prefix.concat(glob.dot);
            for (const part of glob.object.properties) {
              if (part.type === "MethodDefinition") {
                throw new Error("Glob pattern cannot have method definition");
              }
              if (part.value && !["CallExpression", "MemberExpression", "Identifier"].includes(part.value.type)) {
                throw new Error("Glob pattern must have call or member expression value");
              }
              let value = part.value ?? part.name;
              const wValue = getTrimmingSpace(part.value);
              value = prefix.concat(insertTrimmingSpace(value, ""));
              if (wValue)
                value.unshift(wValue);
              if (part.type === "SpreadProperty") {
                parts.push({
                  type: part.type,
                  value,
                  dots: part.dots,
                  delim: part.delim,
                  names: part.names,
                  children: part.children.slice(0, 2).concat(value, part.delim)
                });
              } else {
                parts.push({
                  type: part.type === "Identifier" ? "Property" : part.type,
                  name: part.name,
                  value,
                  delim: part.delim,
                  names: part.names,
                  children: [
                    isWhitespaceOrEmpty(part.children[0]) && part.children[0],
                    part.name,
                    isWhitespaceOrEmpty(part.children[2]) && part.children[2],
                    part.children[3]?.token === ":" ? part.children[3] : ":",
                    value,
                    part.delim
                  ]
                });
              }
            }
            const object = {
              type: "ObjectExpression",
              children: [
                ...refAssignment,
                glob.object.children[0],
                ...parts,
                glob.object.children.at(-1)
              ],
              properties: parts,
              hoistDec
            };
            if (i === children.length - 1)
              return object;
            return processCallMemberExpression({
              ...node,
              children: [object, ...children.slice(i + 1)]
            });
          } else if (glob?.type === "PropertyBind") {
            const prefix = children.slice(0, i);
            return processCallMemberExpression({
              ...node,
              children: [
                prefix,
                {
                  ...glob,
                  type: "PropertyAccess",
                  children: [...glob.children, ".bind(", prefix, ")"]
                },
                ...children.slice(i + 1)
              ]
            });
          }
        }
        return node;
      }
      function wrapIterationReturningResults(statement, outerRef) {
        if (statement.type === "DoStatement") {
          if (outerRef) {
            insertPush(statement.block, outerRef);
          } else {
            insertReturn(statement.block);
          }
          return;
        }
        const resultsRef = {
          type: "Ref",
          base: "results",
          id: "results"
        };
        const declaration = {
          type: "Declaration",
          children: ["const ", resultsRef, "=[];"]
        };
        insertPush(statement.block, resultsRef);
        statement.children.unshift(declaration);
        if (outerRef) {
          statement.children.push(";", outerRef, ".push(", resultsRef, ");");
        } else {
          statement.children.push(";return ", resultsRef, ";");
        }
      }
      function insertPush(node, ref) {
        if (!node)
          return;
        switch (node.type) {
          case "BlockStatement":
            if (node.expressions.length) {
              const last = node.expressions[node.expressions.length - 1];
              insertPush(last, ref);
            } else {
              node.expressions.push([ref, ".push(void 0);"]);
            }
            return;
          case "CaseBlock":
            node.clauses.forEach((clause) => {
              insertPush(clause, ref);
            });
            return;
          case "WhenClause":
            insertPush(node.block, ref);
            return;
          case "DefaultClause":
            insertPush(node.block, ref);
            return;
        }
        if (!Array.isArray(node))
          return;
        const [, exp] = node;
        if (!exp)
          return;
        const indent = getIndent(node);
        switch (exp.type) {
          case "BreakStatement":
          case "ContinueStatement":
          case "DebuggerStatement":
          case "EmptyStatement":
          case "ReturnStatement":
          case "ThrowStatement":
          case "Declaration":
            return;
          case "ForStatement":
          case "IterationStatement":
          case "DoStatement":
            wrapIterationReturningResults(exp, ref);
            return;
          case "BlockStatement":
            insertPush(exp.expressions[exp.expressions.length - 1], ref);
            return;
          case "IfStatement":
            insertPush(exp.then, ref);
            if (exp.else)
              insertPush(exp.else[2], ref);
            else
              exp.children.push([" else {\n", indent, ref, ".push(undefined)\n", indent, "}"]);
            return;
          case "PatternMatchingStatement":
            insertPush(exp.children[0][0], ref);
            return;
          case "SwitchStatement":
            insertPush(exp.children[2], ref);
            return;
          case "TryStatement":
            exp.blocks.forEach((block) => insertPush(block, ref));
            return;
        }
        if (node[node.length - 1]?.type === "SemicolonDelimiter")
          return;
        node.splice(1, 0, ref, ".push(");
        node.push(")");
      }
      function wrapWithReturn(expression) {
        const children = expression ? ["return ", expression] : ["return"];
        return {
          type: "ReturnStatement",
          children
        };
      }
      function expandChainedComparisons([first, binops]) {
        const relationalOps = ["==", "===", "!=", "!==", "<", "<=", ">", ">=", "in"];
        const lowerPrecedenceOps = ["??", "&&", "||", "&", "|", "^"];
        let results = [];
        let i = 0;
        let l = binops.length;
        let start = 0;
        let chains = [];
        while (i < l) {
          const [, op] = binops[i];
          if (relationalOps.includes(op.token) || op.relational) {
            chains.push(i);
          } else if (lowerPrecedenceOps.includes(op.token)) {
            processChains();
            first = [];
          }
          i++;
        }
        processChains();
        return results;
        function processChains() {
          if (chains.length > 1) {
            chains.forEach((index, k) => {
              if (k > 0) {
                results.push(" ", "&&", " ");
              }
              const [pre, op, post, exp] = binops[index];
              let endIndex;
              if (k < chains.length - 1) {
                endIndex = chains[k + 1];
              } else {
                endIndex = i + 1;
              }
              results = results.concat(first, ...binops.slice(start, endIndex));
              first = [exp].concat(binops.slice(index + 1, endIndex));
              start = endIndex;
            });
          } else {
            results = results.concat(first, ...binops.slice(start, i + 1));
            start = i + 1;
          }
          chains.length = 0;
        }
      }
      function processParams(f) {
        const { type, parameters, block } = f;
        if (type === "ArrowFunction" && parameters && parameters.tp && parameters.tp.parameters.length === 1) {
          parameters.tp.parameters.push(",");
        }
        if (!block)
          return;
        const { expressions } = block;
        if (!expressions)
          return;
        const { blockPrefix } = parameters;
        let indent;
        if (!expressions.length) {
          indent = "";
        } else {
          indent = expressions[0][0];
        }
        const [splices, thisAssignments] = gatherBindingCode(parameters, {
          injectParamProps: f.name === "constructor"
        });
        const delimiter = {
          type: "SemicolonDelimiter",
          children: [";"]
        };
        const prefix = splices.map((s) => ["let ", s]).concat(thisAssignments).map(
          (s) => s.type ? {
            ...s,
            children: [indent, ...s.children, delimiter]
          } : [indent, s, delimiter]
        );
        expressions.unshift(...prefix);
      }
      function removeParentPointers(node) {
        if (node == null)
          return;
        if (typeof node !== "object")
          return;
        if (Array.isArray(node)) {
          for (const child of node) {
            removeParentPointers(child);
          }
          return;
        }
        node.parent = null;
        if (node.children) {
          for (const child of node.children) {
            removeParentPointers(child);
          }
        }
      }
      function findAncestor(node, predicate, stopPredicate) {
        node = node.parent;
        while (node && !stopPredicate?.(node)) {
          if (predicate(node))
            return node;
          node = node.parent;
        }
      }
      function gatherNodes(node, predicate) {
        if (node == null)
          return [];
        if (Array.isArray(node)) {
          return node.flatMap((n) => gatherNodes(n, predicate));
        }
        if (predicate(node)) {
          return [node];
        }
        switch (node.type) {
          case "BlockStatement":
            return [];
          case "ForStatement":
            const isDec = node.declaration?.type === "Declaration";
            return node.children.flatMap((n) => {
              if (isDec && n === node.declaration)
                return [];
              return gatherNodes(n, predicate);
            });
          default:
            return gatherNodes(node.children, predicate);
        }
        return [];
      }
      function gatherRecursive(node, predicate, skipPredicate) {
        if (node == null)
          return [];
        if (Array.isArray(node)) {
          return node.flatMap((n) => gatherRecursive(n, predicate, skipPredicate));
        }
        if (skipPredicate?.(node))
          return [];
        if (predicate(node)) {
          return [node];
        }
        return gatherRecursive(node.children, predicate, skipPredicate);
      }
      function gatherRecursiveAll(node, predicate) {
        if (node == null)
          return [];
        if (Array.isArray(node)) {
          return node.flatMap((n) => gatherRecursiveAll(n, predicate));
        }
        const nodes = gatherRecursiveAll(node.children, predicate);
        if (predicate(node)) {
          nodes.push(node);
        }
        return nodes;
      }
      function getIndent(statement) {
        let indent = statement?.[0];
        if (Array.isArray(indent)) {
          indent = indent.flat(Infinity);
          return indent.filter((n) => n && !(n.type === "Comment")).map((n) => {
            if (typeof n === "string")
              return n;
            if (n.token != null)
              return n.token;
            return "";
          });
        }
        return indent;
      }
      function hasAwait(exp) {
        return gatherRecursiveWithinFunction(exp, ({ type }) => type === "Await").length > 0;
      }
      function hasYield(exp) {
        return gatherRecursiveWithinFunction(exp, ({ type }) => type === "Yield").length > 0;
      }
      function hoistRefDecs(statements) {
        gatherRecursiveAll(statements, (s) => s.hoistDec).forEach((node) => {
          let { hoistDec, parent } = node;
          node.hoistDec = null;
          while (parent?.type !== "BlockStatement" || parent.bare && !parent.root) {
            node = parent;
            parent = node.parent;
          }
          if (parent) {
            insertHoistDec(parent, node, hoistDec);
          } else {
            throw new Error("Couldn't find block to hoist declaration into.");
          }
          return;
        });
      }
      function insertHoistDec(block, node, dec) {
        const { expressions } = block;
        const index = expressions.findIndex(([, s]) => node === s);
        if (index < 0)
          throw new Error("Couldn't find expression in block for hoistable declaration.");
        const indent = expressions[index][0];
        expressions.splice(index, 0, [indent, dec, ";"]);
      }
      function insertReturn(node) {
        if (!node)
          return;
        switch (node.type) {
          case "BlockStatement":
            if (node.expressions.length) {
              const last = node.expressions[node.expressions.length - 1];
              insertReturn(last);
            } else {
              if (node.parent.type === "CatchClause") {
                node.expressions.push(["return"]);
              }
            }
            return;
          case "WhenClause":
            node.children.splice(node.children.indexOf(node.break), 1);
            if (node.block.expressions.length) {
              insertReturn(node.block);
            } else {
              node.block.expressions.push(wrapWithReturn());
            }
            return;
          case "DefaultClause":
            insertReturn(node.block);
            return;
        }
        if (!Array.isArray(node))
          return;
        const [, exp, semi] = node;
        if (semi?.type === "SemicolonDelimiter")
          return;
        let indent = getIndent(node);
        if (!exp)
          return;
        switch (exp.type) {
          case "BreakStatement":
          case "ContinueStatement":
          case "DebuggerStatement":
          case "EmptyStatement":
          case "ReturnStatement":
          case "ThrowStatement":
          case "Declaration":
            return;
          case "ForStatement":
          case "IterationStatement":
          case "DoStatement":
            wrapIterationReturningResults(exp);
            return;
          case "BlockStatement":
            insertReturn(exp.expressions[exp.expressions.length - 1]);
            return;
          case "IfStatement":
            insertReturn(exp.then);
            if (exp.else)
              insertReturn(exp.else[2]);
            else
              exp.children.push(["", {
                type: "ReturnStatement",
                children: [";return"]
              }]);
            return;
          case "PatternMatchingStatement":
            insertReturn(exp.children[0][0]);
            return;
          case "SwitchStatement":
            insertSwitchReturns(exp);
            return;
          case "TryStatement":
            exp.blocks.forEach((block) => insertReturn(block));
            return;
        }
        if (node[node.length - 1]?.type === "SemicolonDelimiter")
          return;
        const returnStatement = wrapWithReturn(node[1]);
        node.splice(1, 1, returnStatement);
      }
      function insertSwitchReturns(exp) {
        switch (exp.type) {
          case "SwitchStatement":
            exp.caseBlock.clauses.forEach((clause) => {
              insertReturn(clause);
            });
            return;
          case "SwitchExpression":
            exp.caseBlock.clauses.forEach(insertReturn);
            return;
        }
      }
      function isEmptyBareBlock(node) {
        if (node?.type !== "BlockStatement")
          return false;
        const { bare, expressions } = node;
        return bare && (expressions.length === 0 || expressions.length === 1 && expressions[0][1]?.type === "EmptyStatement");
      }
      function isFunction(node) {
        const { type } = node;
        return type === "FunctionExpression" || type === "ArrowFunction" || type === "MethodDefinition" || node.async;
      }
      function isVoidType(t) {
        return t?.type === "LiteralType" && t.t.type === "VoidType";
      }
      function isWhitespaceOrEmpty(node) {
        if (!node)
          return true;
        if (node.type === "Ref")
          return false;
        if (node.token)
          return node.token.match(/^\s*$/);
        if (node.children)
          node = node.children;
        if (!node.length)
          return true;
        if (typeof node === "string")
          return node.match(/^\s*$/);
        if (Array.isArray(node))
          return node.every(isWhitespaceOrEmpty);
      }
      function gatherRecursiveWithinFunction(node, predicate) {
        return gatherRecursive(node, predicate, isFunction);
      }
      function insertTrimmingSpace(target, c) {
        if (!target)
          return target;
        if (Array.isArray(target))
          return target.map((e, i) => {
            if (i === 0)
              return insertTrimmingSpace(e, c);
            return e;
          });
        if (target.children)
          return Object.assign({}, target, {
            children: target.children.map((e, i) => {
              if (i === 0)
                return insertTrimmingSpace(e, c);
              return e;
            })
          });
        if (target.token)
          return Object.assign({}, target, {
            token: target.token.replace(/^ ?/, c)
          });
        return target;
      }
      function getTrimmingSpace(target) {
        if (!target)
          return;
        if (Array.isArray(target))
          return getTrimmingSpace(target[0]);
        if (target.children)
          return getTrimmingSpace(target.children[0]);
        if (target.token)
          return target.token.match(/^ ?/)[0];
      }
      function forRange(open, forDeclaration, range, stepExp, close) {
        const { start, end, inclusive } = range;
        const counterRef = {
          type: "Ref",
          base: "i",
          id: "i"
        };
        let stepRef;
        if (stepExp) {
          stepExp = insertTrimmingSpace(stepExp, "");
          stepRef = maybeRef(stepExp, "step");
        }
        const startRef = maybeRef(start, "start");
        const endRef = maybeRef(end, "end");
        const startRefDec = startRef !== start ? [startRef, " = ", start, ", "] : [];
        const endRefDec = endRef !== end ? [endRef, " = ", end, ", "] : [];
        let ascDec = [], ascRef, asc;
        if (stepRef) {
          if (stepRef !== stepExp) {
            ascDec = [", ", stepRef, " = ", stepExp];
          }
        } else if (start.type === "Literal" && end.type === "Literal") {
          asc = literalValue(start) <= literalValue(end);
        } else {
          ascRef = {
            type: "Ref",
            base: "asc",
            id: "asc"
          };
          ascDec = [", ", ascRef, " = ", startRef, " <= ", endRef];
        }
        let varAssign = [], varLetAssign = varAssign, varLet = varAssign, blockPrefix;
        if (forDeclaration?.declare) {
          if (forDeclaration.declare.token === "let") {
            const varName = forDeclaration.children.splice(1);
            varAssign = [...insertTrimmingSpace(varName, ""), " = "];
            varLet = [",", ...varName, " = ", counterRef];
          } else {
            blockPrefix = [
              ["", forDeclaration, " = ", counterRef, ";"]
            ];
          }
        } else if (forDeclaration) {
          varAssign = varLetAssign = [forDeclaration, " = "];
        }
        const declaration = {
          type: "Declaration",
          children: ["let ", ...startRefDec, ...endRefDec, counterRef, " = ", ...varLetAssign, startRef, ...varLet, ...ascDec],
          names: forDeclaration?.names
        };
        const counterPart = inclusive ? [counterRef, " <= ", endRef, " : ", counterRef, " >= ", endRef] : [counterRef, " < ", endRef, " : ", counterRef, " > ", endRef];
        const condition = stepRef ? [stepRef, " !== 0 && (", stepRef, " > 0 ? ", ...counterPart, ")"] : ascRef ? [ascRef, " ? ", ...counterPart] : asc ? counterPart.slice(0, 3) : counterPart.slice(4);
        const increment = stepRef ? [...varAssign, counterRef, " += ", stepRef] : ascRef ? [...varAssign, ascRef, " ? ++", counterRef, " : --", counterRef] : [...varAssign, asc ? "++" : "--", counterRef];
        return {
          declaration,
          children: [open, declaration, "; ", ...condition, "; ", ...increment, close],
          blockPrefix
        };
      }
      function gatherBindingCode(statements, opts) {
        const thisAssignments = [];
        const splices = [];
        function insertRestSplices(s, p, thisAssignments2) {
          gatherRecursiveAll(s, (n) => n.blockPrefix || opts?.injectParamProps && n.accessModifier || n.type === "AtBinding").forEach((n) => {
            if (n.type === "AtBinding") {
              const { ref } = n, { id } = ref;
              thisAssignments2.push([`this.${id} = `, ref]);
              return;
            }
            if (opts?.injectParamProps && n.type === "Parameter" && n.accessModifier) {
              n.names.forEach((id) => {
                thisAssignments2.push({
                  type: "AssignmentExpression",
                  children: [`this.${id} = `, id],
                  js: true
                });
              });
              return;
            }
            const { blockPrefix } = n;
            p.push(blockPrefix);
            insertRestSplices(blockPrefix, p, thisAssignments2);
          });
        }
        insertRestSplices(statements, splices, thisAssignments);
        return [splices, thisAssignments];
      }
      function literalValue(literal) {
        let { raw } = literal;
        switch (raw) {
          case "null":
            return null;
          case "true":
            return true;
          case "false":
            return false;
        }
        if (raw.startsWith('"') && raw.endsWith('"') || raw.startsWith("'") && raw.endsWith("'")) {
          return raw.slice(1, -1);
        }
        const numeric = literal.children.find(
          (child) => child.type === "NumericLiteral"
        );
        if (numeric) {
          raw = raw.replace(/_/g, "");
          const { token } = numeric;
          if (token.endsWith("n")) {
            return BigInt(raw.slice(0, -1));
          } else if (token.match(/[\.eE]/)) {
            return parseFloat(raw);
          } else if (token.startsWith("0")) {
            switch (token.charAt(1).toLowerCase()) {
              case "x":
                return parseInt(raw.replace(/0[xX]/, ""), 16);
              case "b":
                return parseInt(raw.replace(/0[bB]/, ""), 2);
              case "o":
                return parseInt(raw.replace(/0[oO]/, ""), 8);
            }
          }
          return parseInt(raw, 10);
        }
        throw new Error("Unrecognized literal " + JSON.stringify(literal));
      }
      var asConst = {
        ts: true,
        children: [" as const"]
      };
      function makeAsConst(node) {
        if (node.type === "Literal" && node.raw !== "null" || node.type === "ArrayExpression" || node.type === "ObjectExpression") {
          return { ...node, children: [...node.children, asConst] };
        }
        return node;
      }
      function makeEmptyBlock() {
        const expressions = [];
        return {
          type: "BlockStatement",
          expressions,
          children: ["{", expressions, "}"],
          bare: false,
          empty: true
        };
      }
      function makeLeftHandSideExpression(expression) {
        switch (expression.type) {
          case "Ref":
          case "Identifier":
          case "Literal":
          case "CallExpression":
          case "MemberExpression":
          case "ParenthesizedExpression":
          case "DebuggerExpression":
          case "SwitchExpression":
          case "ThrowExpression":
          case "TryExpression":
            return expression;
          default:
            return {
              type: "ParenthesizedExpression",
              children: ["(", expression, ")"],
              expression
            };
        }
      }
      function maybeRef(exp, base = "ref") {
        if (!needsRef(exp))
          return exp;
        return {
          type: "Ref",
          base,
          id: base
        };
      }
      function modifyString(str) {
        return str.replace(/(^.?|[^\\]{2})(\\\\)*\n/g, "$1$2\\n");
      }
      function quoteString(str) {
        str = str.replace(/\\/g, "\\\\");
        if (str.includes('"') && !str.includes("'")) {
          return "'" + str.replace(/'/g, "\\'") + "'";
        } else {
          return '"' + str.replace(/"/g, '\\"') + '"';
        }
      }
      function lastAccessInCallExpression(exp) {
        let children, i;
        do {
          ({ children } = exp);
          i = children.length - 1;
          while (i >= 0 && (children[i].type === "Call" || children[i].type === "NonNullAssertion" || children[i].type === "Optional"))
            i--;
          if (i < 0)
            return;
        } while (children[i].type === "MemberExpression" && (exp = children[i]));
        return children[i];
      }
      function convertMethodToFunction(method) {
        const { signature, block } = method;
        let { modifier } = signature;
        if (modifier) {
          if (modifier.get || modifier.set) {
            return;
          } else if (modifier.async) {
            modifier = [modifier.children[0][0], " function ", ...modifier.children.slice(1)];
          } else {
            modifier = ["function ", ...modifier.children];
          }
        } else {
          modifier = "function ";
        }
        return {
          ...signature,
          id: signature.name,
          type: "FunctionExpression",
          children: [
            [modifier, ...signature.children.slice(1)],
            block
          ],
          block
        };
      }
      function convertObjectToJSXAttributes(obj) {
        const { properties } = obj;
        const parts = [];
        const rest = [];
        for (let i = 0; i < properties.length; i++) {
          if (i > 0)
            parts.push(" ");
          const part = properties[i];
          switch (part.type) {
            case "Identifier":
              parts.push([part.name, "={", part.name, "}"]);
              break;
            case "Property":
              if (part.name.type === "ComputedPropertyName") {
                rest.push(part);
              } else {
                parts.push([part.name, "={", insertTrimmingSpace(part.value, ""), "}"]);
              }
              break;
            case "SpreadProperty":
              parts.push(["{", part.dots, part.value, "}"]);
              break;
            case "MethodDefinition":
              const func = convertMethodToFunction(part);
              if (func) {
                parts.push([part.name, "={", convertMethodToFunction(part), "}"]);
              } else {
                rest.push(part);
              }
              break;
            default:
              throw new Error(`invalid object literal type in JSX attribute: ${part.type}`);
          }
        }
        if (rest.length) {
          parts.push(["{...{", ...rest, "}}"]);
        }
        return parts;
      }
      function needsRef(expression, base = "ref") {
        switch (expression.type) {
          case "Ref":
          case "Identifier":
          case "Literal":
            return;
          default:
            return {
              type: "Ref",
              base,
              id: base
            };
        }
      }
      function processCoffeeInterpolation(s, parts, e, $loc) {
        if (parts.length === 0 || parts.length === 1 && parts[0].token != null) {
          return {
            type: "StringLiteral",
            token: parts.length ? `"${modifyString(parts[0].token)}"` : '""',
            $loc
          };
        }
        parts.forEach((part) => {
          if (part.token) {
            const str = part.token.replace(/(`|\$\{)/g, "\\$1");
            part.token = modifyString(str);
          }
        });
        s.token = e.token = "`";
        return {
          type: "TemplateLiteral",
          children: [s, parts, e]
        };
      }
      function processConstAssignmentDeclaration(c, id, suffix, ws, ca, e) {
        c = {
          ...c,
          $loc: {
            pos: ca.$loc.pos - 1,
            length: ca.$loc.length + 1
          }
        };
        let exp;
        if (e.type === "FunctionExpression") {
          exp = e;
        } else {
          exp = e[1];
        }
        if (exp?.children?.[0]?.token?.match(/^\s+$/))
          exp.children.shift();
        if (id.type === "Identifier" && exp?.type === "FunctionExpression" && !exp.id) {
          const i = exp.children.findIndex((c2) => c2?.token === "function") + 1;
          exp = {
            ...exp,
            children: [...exp.children.slice(0, i), " ", id, suffix, ws, ...exp.children.slice(i)]
          };
          return {
            type: "Declaration",
            children: [exp],
            names: id.names
          };
        }
        let [splices, thisAssignments] = gatherBindingCode(id);
        splices = splices.map((s) => [", ", s]);
        thisAssignments = thisAssignments.map((a) => ["", a, ";"]);
        const binding = [c, id, suffix, ...ws];
        const initializer = [ca, e];
        const children = [binding, initializer];
        return {
          type: "Declaration",
          names: id.names,
          children,
          binding,
          initializer,
          splices,
          thisAssignments
        };
      }
      function processLetAssignmentDeclaration(l, id, suffix, ws, la, e) {
        l = {
          ...l,
          $loc: {
            pos: la.$loc.pos - 1,
            length: la.$loc.length + 1
          }
        };
        let [splices, thisAssignments] = gatherBindingCode(id);
        splices = splices.map((s) => [", ", s]);
        thisAssignments = thisAssignments.map((a) => ["", a, ";"]);
        const binding = [l, id, suffix, ...ws];
        const initializer = [la, e];
        const children = [binding, initializer];
        return {
          type: "Declaration",
          names: id.names,
          children,
          binding,
          initializer,
          splices,
          thisAssignments
        };
      }
      function implicitFunctionBlock(f) {
        if (f.abstract || f.block)
          return;
        const { name, parent } = f;
        const expressions = parent?.expressions ?? parent?.elements;
        const currentIndex = expressions?.findIndex(([, def]) => def === f);
        const following = currentIndex >= 0 && expressions[currentIndex + 1]?.[1];
        if (f.type === following?.type && name && name === following.name) {
          f.ts = true;
        } else {
          const block = makeEmptyBlock();
          block.parent = f;
          f.block = block;
          f.children.push(block);
          f.ts = false;
        }
      }
      function processFunctions(statements, config) {
        gatherRecursiveAll(statements, ({ type }) => type === "FunctionExpression" || type === "ArrowFunction").forEach((f) => {
          if (f.type === "FunctionExpression")
            implicitFunctionBlock(f);
          processParams(f);
          if (!processReturnValue(f) && config.implicitReturns) {
            const { block, returnType } = f;
            const isVoid = isVoidType(returnType?.t);
            const isBlock = block?.type === "BlockStatement";
            if (!isVoid && isBlock) {
              insertReturn(block);
            }
          }
        });
        gatherRecursiveAll(statements, ({ type }) => type === "MethodDefinition").forEach((f) => {
          implicitFunctionBlock(f);
          processParams(f);
          if (!processReturnValue(f) && config.implicitReturns) {
            const { signature, block } = f;
            const isConstructor = signature.name === "constructor";
            const isVoid = isVoidType(signature.returnType?.t);
            const isSet = signature.modifier?.set;
            if (!isConstructor && !isSet && !isVoid) {
              insertReturn(block);
            }
          }
        });
      }
      function processSwitchExpressions(statements) {
        gatherRecursiveAll(statements, (n) => n.type === "SwitchExpression").forEach(insertSwitchReturns);
      }
      function processTryExpressions(statements) {
        gatherRecursiveAll(statements, (n) => n.type === "TryExpression").forEach(({ blocks }) => {
          blocks.forEach(insertReturn);
        });
      }
      function processBindingPatternLHS(lhs, tail) {
        adjustAtBindings(lhs, true);
        const [splices, thisAssignments] = gatherBindingCode(lhs);
        tail.push(...splices.map((s) => [", ", s]), ...thisAssignments.map((a) => [", ", a]));
      }
      function processAssignments(statements) {
        gatherRecursiveAll(statements, (n) => n.type === "AssignmentExpression" && n.names === null).forEach((exp) => {
          let { lhs: $1, exp: $2 } = exp, tail = [], i = 0, len = $1.length;
          if ($1.some((left) => left[left.length - 1].special)) {
            if ($1.length !== 1) {
              throw new Error("Only one assignment with id= is allowed");
            }
            const [, lhs, , op] = $1[0];
            const { call } = op;
            op[op.length - 1] = "=";
            $2 = [call, "(", lhs, ", ", $2, ")"];
          }
          let wrapped = false;
          while (i < len) {
            const lastAssignment = $1[i++];
            const [, lhs, , op] = lastAssignment;
            if (op.token !== "=")
              continue;
            if (lhs.type === "ObjectExpression" || lhs.type === "ObjectBindingPattern") {
              if (!wrapped) {
                wrapped = true;
                lhs.children.splice(0, 0, "(");
                tail.push(")");
              }
            }
          }
          i = len - 1;
          while (i >= 0) {
            const lastAssignment = $1[i];
            if (lastAssignment[3].token === "=") {
              const lhs = lastAssignment[1];
              if (lhs.type === "MemberExpression") {
                const members = lhs.children;
                const lastMember = members[members.length - 1];
                if (lastMember.type === "SliceExpression") {
                  const { start, end, children: c } = lastMember;
                  c[0].token = ".splice(";
                  c[1] = start;
                  c[2] = ", ";
                  if (end)
                    c[3] = [end, " - ", start];
                  else
                    c[3] = ["1/0"];
                  c[4] = [", ...", $2];
                  c[5] = ")";
                  lastAssignment.pop();
                  if (isWhitespaceOrEmpty(lastAssignment[2]))
                    lastAssignment.pop();
                  if ($1.length > 1) {
                    throw new Error("Not implemented yet! TODO: Handle multiple splice assignments");
                  }
                  exp.children = [$1];
                  exp.names = [];
                  return;
                }
              } else if (lhs.type === "ObjectBindingPattern" || lhs.type === "ArrayBindingPattern") {
                processBindingPatternLHS(lhs, tail);
              }
            }
            i--;
          }
          const names = $1.flatMap(([, l]) => l.names || []);
          exp.children = [$1, $2, ...tail];
          exp.names = names;
        });
        gatherRecursiveAll(statements, (n) => n.type === "AssignmentExpression" || n.type === "UpdateExpression").forEach((exp) => {
          function extractAssignment(lhs) {
            let expr = lhs;
            while (expr.type === "ParenthesizedExpression") {
              expr = expr.expression;
            }
            if (expr.type === "AssignmentExpression" || expr.type === "UpdateExpression") {
              if (expr.type === "UpdateExpression" && expr.children[0] === expr.assigned) {
                post.push([", ", lhs]);
              } else {
                pre.push([lhs, ", "]);
              }
              return expr.assigned;
            }
          }
          const pre = [], post = [];
          switch (exp.type) {
            case "AssignmentExpression":
              if (!exp.lhs)
                return;
              exp.lhs.forEach((lhsPart, i) => {
                let newLhs2 = extractAssignment(lhsPart[1]);
                if (newLhs2) {
                  lhsPart[1] = newLhs2;
                }
              });
              break;
            case "UpdateExpression":
              let newLhs = extractAssignment(exp.assigned);
              if (newLhs) {
                const i = exp.children.indexOf(exp.assigned);
                exp.assigned = exp.children[i] = newLhs;
              }
              break;
          }
          if (pre.length)
            exp.children.unshift(...pre);
          if (post.length)
            exp.children.push(...post);
        });
      }
      function attachPostfixStatementAsExpression(exp, post) {
        let clause;
        switch (post[1].type) {
          case "ForStatement":
          case "IterationStatement":
          case "DoStatement":
            clause = addPostfixStatement(exp, ...post);
            return {
              type: "IterationExpression",
              children: [clause],
              block: clause.block
            };
          case "IfStatement":
            clause = expressionizeIfClause(post[1], exp);
            return clause;
          default:
            throw new Error("Unknown postfix statement");
        }
      }
      function getPatternConditions(pattern, ref, conditions) {
        if (pattern.rest)
          return;
        switch (pattern.type) {
          case "ArrayBindingPattern": {
            const { elements, length } = pattern, hasRest = elements.some((e) => e.rest), comparator = hasRest ? " >= " : " === ", l = [comparator, (length - hasRest).toString()];
            conditions.push(
              ["Array.isArray(", ref, ")"],
              [ref, ".length", l]
            );
            elements.forEach(({ children: [, e] }, i) => {
              const subRef = [ref, "[", i.toString(), "]"];
              getPatternConditions(e, subRef, conditions);
            });
            const postRest = pattern.children.find((c) => c?.blockPrefix);
            if (postRest) {
              const postElements = postRest.blockPrefix.children[1], { length: postLength } = postElements;
              postElements.forEach(({ children: [, e] }, i) => {
                const subRef = [ref, "[", ref, ".length - ", (postLength + i).toString(), "]"];
                getPatternConditions(e, subRef, conditions);
              });
            }
            break;
          }
          case "ObjectBindingPattern": {
            conditions.push(
              ["typeof ", ref, " === 'object'"],
              [ref, " != null"]
            );
            pattern.properties.forEach((p) => {
              switch (p.type) {
                case "PinProperty":
                case "BindingProperty": {
                  const { name, value } = p;
                  let subRef;
                  switch (name.type) {
                    case "ComputedPropertyName":
                      conditions.push([name.expression, " in ", ref]);
                      subRef = [ref, name];
                      break;
                    case "Literal":
                    case "StringLiteral":
                    case "NumericLiteral":
                      conditions.push([name, " in ", ref]);
                      subRef = [ref, "[", name, "]"];
                      break;
                    default:
                      conditions.push(["'", name, "' in ", ref]);
                      subRef = [ref, ".", name];
                  }
                  if (value) {
                    getPatternConditions(value, subRef, conditions);
                  }
                  break;
                }
              }
            });
            break;
          }
          case "ConditionFragment":
            conditions.push(
              [ref, " ", pattern.children]
            );
            break;
          case "RegularExpressionLiteral": {
            conditions.push(
              ["typeof ", ref, " === 'string'"],
              [pattern, ".test(", ref, ")"]
            );
            break;
          }
          case "PinPattern":
            conditions.push([
              ref,
              " === ",
              pattern.identifier
            ]);
            break;
          case "Literal":
            conditions.push([
              ref,
              " === ",
              pattern
            ]);
            break;
          default:
            break;
        }
      }
      function elideMatchersFromArrayBindings(elements) {
        return elements.map((el) => {
          if (el.type === "BindingRestElement") {
            return ["", el, void 0];
          }
          const { children: [ws, e, sep] } = el;
          switch (e.type) {
            case "Literal":
            case "RegularExpressionLiteral":
            case "StringLiteral":
            case "PinPattern":
              return sep;
            default:
              return [ws, nonMatcherBindings(e), sep];
          }
        });
      }
      function elideMatchersFromPropertyBindings(properties) {
        return properties.map((p) => {
          switch (p.type) {
            case "BindingProperty": {
              const { children, name, value } = p;
              const [ws] = children;
              const sep = children[children.length - 1];
              switch (value && value.type) {
                case "ArrayBindingPattern":
                case "ObjectBindingPattern":
                  return {
                    ...p,
                    children: [ws, name, ": ", nonMatcherBindings(value)]
                  };
                case "Identifier":
                  return p;
                case "Literal":
                case "RegularExpressionLiteral":
                case "StringLiteral":
                default:
                  return {
                    ...p,
                    children: [ws, name, sep]
                  };
              }
            }
            case "PinProperty":
            case "BindingRestProperty":
            default:
              return p;
          }
        });
      }
      function nonMatcherBindings(pattern) {
        switch (pattern.type) {
          case "ArrayBindingPattern": {
            const elements = elideMatchersFromArrayBindings(pattern.elements);
            const children = ["[", elements, "]"];
            return {
              ...pattern,
              children,
              elements
            };
          }
          case "PostRestBindingElements": {
            const els = elideMatchersFromArrayBindings(pattern.children[1]);
            return {
              ...pattern,
              children: [
                pattern.children[0],
                els,
                ...pattern.children.slice(2)
              ]
            };
          }
          case "ObjectBindingPattern":
            return ["{", elideMatchersFromPropertyBindings(pattern.properties), "}"];
          default:
            return pattern;
        }
      }
      function aggregateDuplicateBindings(bindings, ReservedWord) {
        const props = gatherRecursiveAll(bindings, (n) => n.type === "BindingProperty");
        const arrayBindings = gatherRecursiveAll(bindings, (n) => n.type === "ArrayBindingPattern");
        arrayBindings.forEach((a) => {
          const { elements } = a;
          elements.forEach((element) => {
            if (Array.isArray(element)) {
              const [, e] = element;
              if (e.type === "Identifier") {
                props.push(e);
              } else if (e.type === "BindingRestElement") {
                props.push(e);
              }
            }
          });
        });
        const declarations = [];
        const propsGroupedByName = /* @__PURE__ */ new Map();
        for (const p of props) {
          const { name, value } = p;
          const key = value?.name || name?.name || name;
          if (propsGroupedByName.has(key)) {
            propsGroupedByName.get(key).push(p);
          } else {
            propsGroupedByName.set(key, [p]);
          }
        }
        propsGroupedByName.forEach((shared, key) => {
          if (!key)
            return;
          if (ReservedWord({
            pos: 0,
            input: key
          })) {
            shared.forEach((p) => {
              const ref = {
                type: "Ref",
                base: `_${key}`,
                id: key
              };
              aliasBinding(p, ref);
            });
            return;
          }
          if (shared.length === 1)
            return;
          const refs = shared.map((p) => {
            const ref = {
              type: "Ref",
              base: key,
              id: key
            };
            aliasBinding(p, ref);
            return ref;
          });
          declarations.push(["const ", key, " = [", ...refs.map((r, i) => {
            return i === 0 ? r : [", ", r];
          }), "]"]);
        });
        return declarations;
      }
      function processPatternMatching(statements, ReservedWord) {
        gatherRecursiveAll(statements, (n) => n.type === "SwitchStatement" || n.type === "SwitchExpression").forEach((s) => {
          const { caseBlock } = s;
          const { clauses } = caseBlock;
          let errors = false;
          let isPattern = false;
          if (clauses.some((c) => c.type === "PatternClause")) {
            isPattern = true;
            clauses.forEach((c) => {
              if (!(c.type === "PatternClause" || c.type === "DefaultClause")) {
                errors = true;
                c.children.push({
                  type: "Error",
                  message: "Can't mix pattern matching and non-pattern matching clauses"
                });
              }
            });
          }
          if (errors || !isPattern)
            return;
          let { expression } = s;
          if (expression.type === "ParenthesizedExpression") {
            expression = expression.expression;
          }
          let hoistDec, refAssignment = [], ref = needsRef(expression, "m") || expression;
          if (ref !== expression) {
            hoistDec = {
              type: "Declaration",
              children: ["let ", ref],
              names: []
            };
            refAssignment = [{
              type: "AssignmentExpression",
              children: [ref, " = ", expression]
            }, ","];
          }
          let prev = [], root = prev;
          const l = clauses.length;
          clauses.forEach((c, i) => {
            if (c.type === "DefaultClause") {
              prev.push(c.block);
              return;
            }
            let { patterns, block } = c;
            let pattern = patterns[0];
            const indent = block.expressions?.[0]?.[0] || "";
            const alternativeConditions = patterns.map((pattern2, i2) => {
              const conditions = [];
              getPatternConditions(pattern2, ref, conditions);
              return conditions;
            });
            const conditionExpression = alternativeConditions.map((conditions, i2) => {
              const conditionArray = conditions.map((c2, i3) => {
                if (i3 === 0)
                  return c2;
                return [" && ", ...c2];
              });
              if (i2 === 0)
                return conditionArray;
              return [" || ", ...conditionArray];
            });
            const condition = {
              type: "ParenthesizedExpression",
              children: ["(", ...refAssignment, conditionExpression, ")"],
              expression: conditionExpression
            };
            const prefix = [];
            switch (pattern.type) {
              case "ArrayBindingPattern":
                if (pattern.length === 0)
                  break;
              case "ObjectBindingPattern": {
                if (pattern.properties?.length === 0)
                  break;
                let [splices, thisAssignments] = gatherBindingCode(pattern);
                const patternBindings = nonMatcherBindings(pattern);
                splices = splices.map((s2) => [", ", nonMatcherBindings(s2)]);
                thisAssignments = thisAssignments.map((a) => [indent, a, ";"]);
                const duplicateDeclarations = aggregateDuplicateBindings([patternBindings, splices], ReservedWord);
                prefix.push([indent, "const ", patternBindings, " = ", ref, splices, ";"]);
                prefix.push(...thisAssignments);
                prefix.push(...duplicateDeclarations.map((d) => [indent, d, ";"]));
                break;
              }
            }
            block.expressions.unshift(...prefix);
            const next = [];
            if (block.bare) {
              block.children.unshift(" {");
              block.children.push("}");
              block.bare = false;
            }
            if (i < l - 1)
              next.push("\n", "else ");
            prev.push(["", {
              type: "IfStatement",
              children: ["if", condition, block, next],
              then: block,
              else: next,
              hoistDec
            }]);
            hoistDec = void 0;
            refAssignment = [];
            prev = next;
          });
          if (s.type === "SwitchExpression") {
            insertReturn(root[0]);
            root.splice(0, 1, wrapIIFE(root[0]));
          }
          s.type = "PatternMatchingStatement";
          s.children = [root];
          addParentPointers(s, s.parent);
        });
      }
      function processPipelineExpressions(statements) {
        gatherRecursiveAll(statements, (n) => n.type === "PipelineExpression").forEach((s) => {
          const [ws, , body] = s.children;
          let [, arg] = s.children;
          let i = 0, l = body.length;
          const refDec = [];
          const children = [ws, refDec];
          let usingRef = null;
          for (i = 0; i < l; i++) {
            const step = body[i];
            const [leadingComment, pipe, trailingComment, expr] = step;
            const returns = pipe.token === "||>";
            let ref, result, returning = returns ? arg : null;
            if (pipe.token === "|>=") {
              let initRef;
              if (i === 0) {
                outer:
                  switch (arg.type) {
                    case "MemberExpression":
                      if (arg.children.length <= 2)
                        break;
                    case "CallExpression":
                      const access = arg.children.pop();
                      switch (access.type) {
                        case "PropertyAccess":
                        case "SliceExpression":
                          break;
                        default:
                          children.unshift({
                            type: "Error",
                            $loc: pipe.token.$loc,
                            message: `Can't assign to ${access.type}`
                          });
                          arg.children.push(access);
                          break outer;
                      }
                      usingRef = needsRef({});
                      initRef = {
                        type: "AssignmentExpression",
                        children: [usingRef, " = ", arg, ","]
                      };
                      arg = {
                        type: "MemberExpression",
                        children: [usingRef, access]
                      };
                      break;
                  }
                children.pop();
                const lhs = [[
                  [refDec, initRef],
                  arg,
                  [],
                  { token: "=", children: [" = "] }
                ]];
                Object.assign(s, {
                  type: "AssignmentExpression",
                  children: [lhs, children],
                  names: null,
                  lhs,
                  assigned: arg,
                  exp: children
                });
                arg = clone(arg);
                if (arg.children[0].type === "Ref") {
                  arg.children[0] = usingRef;
                }
              } else {
                children.unshift({
                  type: "Error",
                  $loc: pipe.token.$loc,
                  message: "Can't use |>= in the middle of a pipeline"
                });
              }
            } else {
              s.children = children;
            }
            if (returns && (ref = needsRef(arg))) {
              usingRef = usingRef || ref;
              arg = {
                type: "ParenthesizedExpression",
                children: ["(", {
                  type: "AssignmentExpression",
                  children: [usingRef, " = ", arg]
                }, ")"]
              };
              returning = usingRef;
            }
            [result, returning] = constructPipeStep(
              {
                leadingComment: skipIfOnlyWS(leadingComment),
                trailingComment: skipIfOnlyWS(trailingComment),
                expr
              },
              arg,
              returning
            );
            if (result.type === "ReturnStatement") {
              if (i < l - 1) {
                result.children.push({
                  type: "Error",
                  message: "Can't continue a pipeline after returning"
                });
              }
              arg = result;
              if (children[children.length - 1] === ",") {
                children.pop();
                children.push(";");
              }
              break;
            }
            if (returning) {
              arg = returning;
              children.push(result, ",");
            } else {
              arg = result;
            }
          }
          if (usingRef) {
            refDec.unshift("let ", usingRef, ";");
          }
          children.push(arg);
          addParentPointers(s, s.parent);
        });
      }
      function processProgram(root, config, m, ReservedWord) {
        assert.equal(m.forbidClassImplicitCall.length, 1, "forbidClassImplicitCall");
        assert.equal(m.forbidIndentedApplication.length, 1, "forbidIndentedApplication");
        assert.equal(m.forbidTrailingMemberProperty.length, 1, "forbidTrailingMemberProperty");
        assert.equal(m.forbidMultiLineImplicitObjectLiteral.length, 1, "forbidMultiLineImplicitObjectLiteral");
        assert.equal(m.JSXTagStack.length, 0, "JSXTagStack should be empty");
        addParentPointers(root);
        const { expressions: statements } = root;
        processPipelineExpressions(statements);
        processAssignments(statements);
        processPatternMatching(statements, ReservedWord);
        processFunctions(statements, config);
        processSwitchExpressions(statements);
        processTryExpressions(statements);
        hoistRefDecs(statements);
        gatherRecursiveAll(statements, (n) => n.type === "IterationExpression").forEach((e) => expressionizeIteration(e));
        statements.unshift(...m.prelude);
        if (config.autoLet) {
          createLetDecs(statements, []);
        } else if (config.autoVar) {
          createVarDecs(statements, []);
        }
        populateRefs(statements);
        adjustAtBindings(statements);
      }
      function findDecs(statements) {
        const declarationNames = gatherNodes(statements, ({ type }) => type === "Declaration").flatMap((d) => d.names);
        return new Set(declarationNames);
      }
      function populateRefs(statements) {
        const refNodes = gatherRecursive(statements, ({ type }) => type === "Ref");
        if (refNodes.length) {
          const ids = gatherRecursive(statements, (s) => s.type === "Identifier");
          const names = new Set(ids.flatMap(({ names: names2 }) => names2 || []));
          refNodes.forEach((ref) => {
            const { type, base } = ref;
            if (type !== "Ref")
              return;
            ref.type = "Identifier";
            let n = 0;
            let name = base;
            while (names.has(name)) {
              n++;
              name = `${base}${n}`;
            }
            names.add(name);
            ref.children = ref.names = [name];
          });
        }
      }
      function createVarDecs(statements, scopes, pushVar) {
        function hasDec(name) {
          return scopes.some((s) => s.has(name));
        }
        function findAssignments(statements2, decs2) {
          let assignmentStatements2 = gatherNodes(statements2, (node) => {
            return node.type === "AssignmentExpression";
          });
          if (assignmentStatements2.length) {
            assignmentStatements2 = assignmentStatements2.concat(findAssignments(assignmentStatements2.map((s) => s.children), decs2));
          }
          return assignmentStatements2;
        }
        if (!pushVar) {
          pushVar = function(name) {
            varIds.push(name);
            decs.add(name);
          };
        }
        const decs = findDecs(statements);
        scopes.push(decs);
        const varIds = [];
        const assignmentStatements = findAssignments(statements, scopes);
        const undeclaredIdentifiers = assignmentStatements.flatMap((a) => a.names);
        undeclaredIdentifiers.filter((x, i, a) => {
          if (!hasDec(x))
            return a.indexOf(x) === i;
        }).forEach(pushVar);
        const fnNodes = gatherNodes(statements, (s) => s.type === "FunctionExpression");
        const forNodes = gatherNodes(statements, (s) => s.type === "ForStatement");
        const blockNodes = new Set(gatherNodes(statements, (s) => s.type === "BlockStatement"));
        fnNodes.forEach(({ block }) => blockNodes.delete(block));
        forNodes.forEach(({ block }) => blockNodes.delete(block));
        blockNodes.forEach((block) => {
          createVarDecs(block.expressions, scopes, pushVar);
        });
        forNodes.forEach(({ block, declaration }) => {
          scopes.push(new Set(declaration.names));
          createVarDecs(block.expressions, scopes, pushVar);
          scopes.pop();
        });
        fnNodes.forEach(({ block, parameters }) => {
          scopes.push(new Set(parameters.names));
          createVarDecs(block.expressions, scopes);
          scopes.pop();
        });
        if (varIds.length) {
          const indent = getIndent(statements[0]);
          let delimiter = ";";
          if (statements[0][1]?.parent?.root) {
            delimiter = ";\n";
          }
          statements.unshift([indent, "var ", varIds.join(", "), delimiter]);
        }
        scopes.pop();
      }
      function createLetDecs(statements, scopes) {
        function findVarDecs(statements2, decs) {
          const declarationNames = gatherRecursive(
            statements2,
            (node) => node.type === "Declaration" && node.children && node.children.length > 0 && node.children[0].token && node.children[0].token.startsWith("var") || node.type === "FunctionExpression"
          ).filter((node) => node.type === "Declaration").flatMap((node) => node.names);
          return new Set(declarationNames);
        }
        let declaredIdentifiers = findVarDecs(statements);
        function hasDec(name) {
          return declaredIdentifiers.has(name) || scopes.some((s) => s.has(name));
        }
        function gatherBlockOrOther(statement) {
          return gatherNodes(statement, (s) => s.type === "BlockStatement" || s.type === "AssignmentExpression" || s.type === "Declaration").flatMap((node) => {
            if (node.type == "BlockStatement")
              return node.bare ? gatherBlockOrOther(node.expressions) : node;
            else if (node.children && node.children.length)
              return [...gatherBlockOrOther(node.children), node];
            else
              return [];
          });
        }
        let currentScope = /* @__PURE__ */ new Set();
        scopes.push(currentScope);
        const fnNodes = gatherNodes(statements, (s) => s.type === "FunctionExpression");
        const forNodes = gatherNodes(statements, (s) => s.type === "ForStatement");
        let targetStatements = [];
        for (const statement of statements) {
          const nodes = gatherBlockOrOther(statement);
          let undeclaredIdentifiers = [];
          for (const node of nodes) {
            if (node.type == "BlockStatement") {
              let block = node;
              let fnNode = fnNodes.find((fnNode2) => fnNode2.block === block);
              let forNode = forNodes.find((forNode2) => forNode2.block === block);
              if (fnNode != null) {
                scopes.push(new Set(fnNode.parameters.names));
                createLetDecs(block.expressions, scopes);
                scopes.pop();
              } else if (forNode != null) {
                scopes.push(new Set(forNode.declaration.names));
                createLetDecs(block.expressions, scopes);
                scopes.pop();
              } else
                createLetDecs(block.expressions, scopes);
              continue;
            }
            if (node.names == null)
              continue;
            let names = node.names.filter((name) => !hasDec(name));
            if (node.type == "AssignmentExpression")
              undeclaredIdentifiers.push(...names);
            names.forEach((name) => currentScope.add(name));
          }
          if (undeclaredIdentifiers.length > 0) {
            let indent = statement[0];
            let firstIdentifier = gatherNodes(statement[1], (node) => node.type == "Identifier")[0];
            if (undeclaredIdentifiers.length == 1 && statement[1].type == "AssignmentExpression" && statement[1].names.length == 1 && statement[1].names[0] == undeclaredIdentifiers[0] && firstIdentifier && firstIdentifier.names == undeclaredIdentifiers[0] && gatherNodes(statement[1], (node) => node.type === "ObjectBindingPattern").length == 0)
              statement[1].children.unshift(["let "]);
            else {
              let tail = "\n";
              if (gatherNodes(indent, (node) => node.token && node.token.endsWith("\n")).length > 0)
                tail = void 0;
              targetStatements.push([indent, "let ", undeclaredIdentifiers.join(", "), tail]);
            }
          }
          targetStatements.push(statement);
        }
        scopes.pop();
        statements.splice(0, statements.length, targetStatements);
      }
      function processReturnValue(func) {
        const { block } = func;
        const values = gatherRecursiveWithinFunction(
          block,
          ({ type }) => type === "ReturnValue"
        );
        if (!values.length)
          return false;
        const ref = {
          type: "Ref",
          base: "ret",
          id: "ret"
        };
        let declared;
        values.forEach((value) => {
          value.children = [ref];
          const ancestor = findAncestor(
            value,
            ({ type }) => type === "Declaration",
            isFunction
          );
          if (ancestor)
            declared = true;
        });
        if (!declared) {
          let returnType = func.returnType ?? func.signature?.returnType;
          if (returnType) {
            const { t } = returnType;
            if (t.type === "TypePredicate") {
              returnType = ": boolean";
            } else if (t.type === "AssertsType") {
              returnType = void 0;
            }
          }
          block.expressions.unshift([
            getIndent(block.expressions[0]),
            {
              type: "Declaration",
              children: ["let ", ref, returnType],
              names: []
            },
            ";"
          ]);
        }
        gatherRecursiveWithinFunction(
          block,
          (r) => r.type === "ReturnStatement" && !r.expression
        ).forEach((r) => {
          r.expression = ref;
          r.children.splice(-1, 1, " ", ref);
        });
        if (block.children.at(-2)?.type !== "ReturnStatement") {
          block.expressions.push([
            [getIndent(block.expressions.at(-1))],
            {
              type: "ReturnStatement",
              expression: ref,
              children: ["return ", ref]
            }
          ]);
        }
        return true;
      }
      function processUnaryExpression(pre, exp, post) {
        if (!(pre.length || post))
          return exp;
        if (post?.token === "?") {
          post = {
            $loc: post.$loc,
            token: " != null"
          };
          switch (exp.type) {
            case "Identifier":
            case "Literal":
            case "AmpersandRef":
              return {
                ...exp,
                children: [...pre, ...exp.children, post]
              };
            default:
              const expression = {
                ...exp,
                children: [...pre, "(", exp.children, ")", post]
              };
              return {
                type: "ParenthesizedExpression",
                children: ["(", expression, ")"],
                expression
              };
          }
        }
        if (exp.type === "Literal") {
          if (pre.length === 1 && pre[0].token === "-") {
            const children = [pre[0], ...exp.children];
            if (post)
              exp.children.push(post);
            return {
              type: "Literal",
              children,
              raw: `-${exp.raw}`
            };
          }
        }
        const l = pre.length;
        if (l) {
          const last = pre[l - 1];
          if (last.type === "Await" && last.op) {
            if (exp.type !== "ParenthesizedExpression") {
              exp = ["(", exp, ")"];
            }
            exp = {
              type: "CallExpression",
              children: [" Promise", last.op, exp]
            };
          }
        }
        return {
          type: "UnaryExpression",
          children: [...pre, exp, post]
        };
      }
      function prune2(node) {
        if (node === null || node === void 0)
          return;
        if (node.length === 0)
          return;
        if (Array.isArray(node)) {
          const a = node.map((n) => prune2(n)).filter((n) => !!n);
          if (a.length > 1)
            return a;
          if (a.length === 1)
            return a[0];
          return;
        }
        if (node.children != null) {
          node.children = prune2(node.children);
          return node;
        }
        return node;
      }
      function reorderBindingRestProperty(props) {
        const names = props.flatMap((p) => p.names);
        let restIndex = -1;
        let restCount = 0;
        props.forEach(({ type }, i) => {
          if (type === "BindingRestProperty") {
            if (restIndex < 0)
              restIndex = i;
            restCount++;
          }
        });
        if (restCount === 0) {
          return {
            children: props,
            names
          };
        } else if (restCount === 1) {
          let after = props.slice(restIndex + 1);
          let rest = props[restIndex];
          props = props.slice(0, restIndex);
          if (after.length) {
            const [restDelim] = rest.children.slice(-1), lastAfterProp = after[after.length - 1], lastAfterChildren = lastAfterProp.children, [lastDelim] = lastAfterChildren.slice(-1);
            rest = { ...rest, children: [...rest.children.slice(0, -1), lastDelim] };
            after = [...after.slice(0, -1), { ...lastAfterProp, children: [...lastAfterChildren.slice(0, -1), restDelim] }];
          }
          const children = [...props, ...after, rest];
          return {
            children,
            names
          };
        }
        return {
          children: [{
            type: "Error",
            message: "Multiple rest properties in object pattern"
          }, props]
        };
      }
      function replaceNodes(root, predicate, replacer) {
        if (root == null)
          return root;
        const array = Array.isArray(root) ? root : root.children;
        if (!array)
          return root;
        array.forEach((node, i) => {
          if (node == null)
            return;
          if (predicate(node)) {
            array[i] = replacer(node, root);
          } else {
            replaceNodes(node, predicate, replacer);
          }
        });
        return root;
      }
      function skipIfOnlyWS(target) {
        if (!target)
          return target;
        if (Array.isArray(target)) {
          if (target.length === 1) {
            return skipIfOnlyWS(target[0]);
          } else if (target.every((e) => skipIfOnlyWS(e) === void 0)) {
            return void 0;
          }
          return target;
        }
        if (target.token != null && target.token.trim() === "") {
          return void 0;
        }
        return target;
      }
      function typeOfJSX(node, config, getRef) {
        switch (node.type) {
          case "JSXElement":
            return typeOfJSXElement(node, config, getRef);
          case "JSXFragment":
            return typeOfJSXFragment(node, config, getRef);
        }
      }
      function typeOfJSXElement(node, config, getRef) {
        if (config.solid) {
          if (config.server && !config.client) {
            return ["string"];
          }
          let { tag } = node;
          const clientType = tag[0] === tag[0].toLowerCase() ? [getRef("IntrinsicElements"), '<"', tag, '">'] : ["ReturnType<typeof ", tag, ">"];
          if (config.server) {
            return ["string", " | ", clientType];
          } else {
            return clientType;
          }
        }
      }
      function typeOfJSXFragment(node, config, getRef) {
        if (config.solid) {
          let type = [];
          let lastType;
          for (let child of node.jsxChildren) {
            switch (child.type) {
              case "JSXText":
                if (lastType !== "JSXText") {
                  type.push("string");
                }
                break;
              case "JSXElement":
                type.push(typeOfJSXElement(child, config, getRef));
                break;
              case "JSXFragment":
                type.push(...typeOfJSXFragment(child, config, getRef));
                break;
              case "JSXChildExpression":
                if (child.expression) {
                  type.push(["typeof ", child.expression]);
                }
                break;
              default:
                throw new Error(`unknown child in JSXFragment: ${JSON.stringify(child)}`);
            }
            lastType = child.type;
          }
          if (type.length === 1) {
            return type[0];
          } else {
            type = type.flatMap((t) => [t, ", "]);
            type.pop();
            return ["[", type, "]"];
          }
        }
      }
      function wrapIIFE(exp, async) {
        let prefix, suffix;
        if (async) {
          prefix = "(async ()=>";
          suffix = ")()";
        } else if (hasAwait(exp)) {
          prefix = "(await (async ()=>";
          suffix = ")())";
        } else {
          prefix = "(()=>";
          suffix = ")()";
        }
        const expressions = Array.isArray(exp) ? [[...exp]] : [exp];
        const block = {
          type: "BlockStatement",
          expressions,
          children: ["{", expressions, "}"],
          bare: false
        };
        return [
          prefix,
          block,
          suffix
        ];
      }
      module.exports = {
        addParentPointers,
        addPostfixStatement,
        adjustAtBindings,
        adjustBindingElements,
        aliasBinding,
        arrayElementHasTrailingComma,
        attachPostfixStatementAsExpression,
        blockWithPrefix,
        clone,
        constructInvocation,
        constructPipeStep,
        convertMethodToFunction,
        convertObjectToJSXAttributes,
        dedentBlockString,
        dedentBlockSubstitutions,
        deepCopy,
        expressionizeIfClause,
        expressionizeIteration,
        findAncestor,
        forRange,
        gatherBindingCode,
        gatherNodes,
        gatherRecursive,
        gatherRecursiveAll,
        gatherRecursiveWithinFunction,
        getIndent,
        getTrimmingSpace,
        hasAwait,
        hasYield,
        hoistRefDecs,
        insertReturn,
        insertSwitchReturns,
        insertTrimmingSpace,
        isEmptyBareBlock,
        isFunction,
        isVoidType,
        isWhitespaceOrEmpty,
        lastAccessInCallExpression,
        literalValue,
        makeAsConst,
        makeEmptyBlock,
        makeLeftHandSideExpression,
        maybeRef,
        modifyString,
        needsRef,
        processBinaryOpExpression,
        processCallMemberExpression,
        processCoffeeInterpolation,
        processConstAssignmentDeclaration,
        processLetAssignmentDeclaration,
        processParams,
        processProgram,
        processReturnValue,
        processUnaryExpression,
        prune: prune2,
        quoteString,
        removeParentPointers,
        reorderBindingRestProperty,
        replaceNodes,
        skipIfOnlyWS,
        typeOfJSX,
        wrapIIFE
      };
    }
  });

  // source/parser.hera
  var require_parser = __commonJS({
    "source/parser.hera"(exports, module) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parserState = exports.$R$0 = exports.$TV = exports.$TS = exports.$TR = exports.$T = exports.$Y = exports.$N = exports.$TOKEN = exports.$TEXT = exports.$P = exports.$Q = exports.$E = exports.$S = exports.$C = exports.$R = exports.$L = exports.$EXPECT = void 0;
      function $EXPECT(parser2, fail2, expectation) {
        return function(state) {
          const result = parser2(state);
          if (result)
            return result;
          const { pos } = state;
          fail2(pos, expectation);
          return;
        };
      }
      exports.$EXPECT = $EXPECT;
      function $L(str) {
        return function(state) {
          const { input, pos } = state;
          const { length } = str;
          if (input.substr(pos, length) === str) {
            return {
              loc: {
                pos,
                length
              },
              pos: pos + length,
              value: str
            };
          }
          return;
        };
      }
      exports.$L = $L;
      function $R(regExp) {
        return function(state) {
          const { input, pos } = state;
          regExp.lastIndex = state.pos;
          let l, m, v;
          if (m = input.match(regExp)) {
            v = m[0];
            l = v.length;
            return {
              loc: {
                pos,
                length: l
              },
              pos: pos + l,
              value: m
            };
          }
          return;
        };
      }
      exports.$R = $R;
      function $C(...terms) {
        return (state) => {
          let i = 0;
          const l = terms.length;
          while (i < l) {
            const r = terms[i++](state);
            if (r)
              return r;
          }
          return;
        };
      }
      exports.$C = $C;
      function $S(...terms) {
        return (state) => {
          let { input, pos, tokenize, events } = state, i = 0, value;
          const results = [], s = pos, l = terms.length;
          while (i < l) {
            const r = terms[i++]({ input, pos, tokenize, events });
            if (r) {
              ({ pos, value } = r);
              results.push(value);
            } else
              return;
          }
          return {
            loc: {
              pos: s,
              length: pos - s
            },
            pos,
            value: results
          };
        };
      }
      exports.$S = $S;
      function $E(fn) {
        return (state) => {
          const r = fn(state);
          if (r)
            return r;
          const { pos } = state;
          return {
            loc: {
              pos,
              length: 0
            },
            pos,
            value: void 0
          };
        };
      }
      exports.$E = $E;
      function $Q(fn) {
        return (state) => {
          let { input, pos, tokenize, events } = state;
          let value;
          const s = pos;
          const results = [];
          while (true) {
            const prevPos = pos;
            const r = fn({ input, pos, tokenize, events });
            if (r == void 0)
              break;
            ({ pos, value } = r);
            if (pos === prevPos)
              break;
            else
              results.push(value);
          }
          return {
            loc: {
              pos: s,
              length: pos - s
            },
            pos,
            value: results
          };
        };
      }
      exports.$Q = $Q;
      function $P(fn) {
        return (state) => {
          const { input, pos: s, tokenize, events } = state;
          let value;
          const first = fn(state);
          if (!first)
            return;
          let { pos } = first;
          const results = [first.value];
          while (true) {
            const prevPos = pos;
            const r = fn({ input, pos, tokenize, events });
            if (!r)
              break;
            ({ pos, value } = r);
            if (pos === prevPos)
              break;
            results.push(value);
          }
          return {
            loc: {
              pos: s,
              length: pos - s
            },
            value: results,
            pos
          };
        };
      }
      exports.$P = $P;
      function $TEXT(fn) {
        return (state) => {
          const newState = fn(state);
          if (!newState)
            return;
          newState.value = state.input.substring(state.pos, newState.pos);
          return newState;
        };
      }
      exports.$TEXT = $TEXT;
      function $TOKEN(name, state, newState) {
        if (!newState)
          return;
        newState.value = {
          type: name,
          children: [].concat(newState.value),
          token: state.input.substring(state.pos, newState.pos),
          loc: newState.loc
        };
        return newState;
      }
      exports.$TOKEN = $TOKEN;
      function $N(fn) {
        return (state) => {
          const newState = fn(state);
          if (newState)
            return;
          return {
            loc: {
              pos: state.pos,
              length: 0
            },
            value: void 0,
            pos: state.pos
          };
        };
      }
      exports.$N = $N;
      function $Y(fn) {
        return (state) => {
          const newState = fn(state);
          if (!newState)
            return;
          return {
            loc: {
              pos: state.pos,
              length: 0
            },
            value: void 0,
            pos: state.pos
          };
        };
      }
      exports.$Y = $Y;
      function $T(parser2, fn) {
        return function(state) {
          const result = parser2(state);
          if (!result)
            return;
          if (state.tokenize)
            return result;
          const { value } = result;
          const mappedValue = fn(value);
          result.value = mappedValue;
          return result;
        };
      }
      exports.$T = $T;
      function $TR(parser2, fn) {
        return function(state) {
          const result = parser2(state);
          if (!result)
            return;
          if (state.tokenize)
            return result;
          const { loc, value } = result;
          const mappedValue = fn(SKIP, loc, ...value);
          if (mappedValue === SKIP) {
            return;
          }
          result.value = mappedValue;
          return result;
        };
      }
      exports.$TR = $TR;
      function $TS(parser2, fn) {
        return function(state) {
          const result = parser2(state);
          if (!result)
            return;
          if (state.tokenize)
            return result;
          const { loc, value } = result;
          const mappedValue = fn(SKIP, loc, value, ...value);
          if (mappedValue === SKIP) {
            return;
          }
          result.value = mappedValue;
          return result;
        };
      }
      exports.$TS = $TS;
      function $TV(parser2, fn) {
        return function(state) {
          const result = parser2(state);
          if (!result)
            return;
          if (state.tokenize)
            return result;
          const { loc, value } = result;
          const mappedValue = fn(SKIP, loc, value, value);
          if (mappedValue === SKIP) {
            return;
          }
          result.value = mappedValue;
          return result;
        };
      }
      exports.$TV = $TV;
      function $R$0(parser2) {
        return function(state) {
          const result = parser2(state);
          if (!result)
            return;
          const value = result.value[0];
          result.value = value;
          return result;
        };
      }
      exports.$R$0 = $R$0;
      var SKIP = {};
      var failHintRegex = /\S+|\s+|$/y;
      var failExpected = Array(16);
      var failIndex = 0;
      var maxFailPos = 0;
      function fail(pos, expected) {
        if (pos < maxFailPos)
          return;
        if (pos > maxFailPos) {
          maxFailPos = pos;
          failExpected.length = failIndex = 0;
        }
        failExpected[failIndex++] = expected;
        return;
      }
      var ParseError = class extends Error {
        constructor(message, name, filename, line, column, offset) {
          super(message);
          this.message = message;
          this.name = name;
          this.filename = filename;
          this.line = line;
          this.column = column;
          this.offset = offset;
        }
      };
      function parserState(grammar) {
        function location(input, pos) {
          const [line, column] = input.split(/\n|\r\n|\r/).reduce(([row, col], line2) => {
            const l = line2.length + 1;
            if (pos >= l) {
              pos -= l;
              return [row + 1, 1];
            } else if (pos >= 0) {
              col += pos;
              pos = -1;
              return [row, col];
            } else {
              return [row, col];
            }
          }, [1, 1]);
          return [line, column];
        }
        function validate(input, result, { filename }) {
          if (result && result.pos === input.length)
            return result.value;
          const expectations = Array.from(new Set(failExpected.slice(0, failIndex)));
          let l = location(input, maxFailPos), [line, column] = l;
          if (result && result.pos > maxFailPos) {
            l = location(input, result.pos);
            throw new Error(`${filename}:${line}:${column} Unconsumed input at #{l}

${input.slice(result.pos)}
`);
          }
          if (expectations.length) {
            failHintRegex.lastIndex = maxFailPos;
            let [hint] = input.match(failHintRegex);
            if (hint.length)
              hint = JSON.stringify(hint);
            else
              hint = "EOF";
            const error = new ParseError(`${filename}:${line}:${column} Failed to parse
Expected:
	${expectations.join("\n	")}
Found: ${hint}
`, "ParseError", filename, line, column, maxFailPos);
            throw error;
          }
          if (result) {
            throw new Error(`
Unconsumed input at ${l}

${input.slice(result.pos)}
`);
          }
          throw new Error("No result");
        }
        return {
          parse: (input, options = {}) => {
            if (typeof input !== "string")
              throw new Error("Input must be a string");
            const parser2 = options.startRule != null ? grammar[options.startRule] : Object.values(grammar)[0];
            if (!parser2)
              throw new Error("Could not find rule with name '#{opts.startRule}'");
            const filename = options.filename || "<anonymous>";
            failIndex = 0;
            maxFailPos = 0;
            failExpected.length = 0;
            return validate(input, parser2({
              input,
              pos: 0,
              tokenize: options.tokenize || false,
              events: options.events
            }), {
              filename
            });
          }
        };
      }
      exports.parserState = parserState;
      var { parse: parse2 } = parserState({
        Program,
        TopLevelStatements,
        NestedTopLevelStatements,
        TopLevelSingleLineStatements,
        TopLevelStatement,
        ExtendedExpression,
        SingleLineExtendedExpression,
        NonPipelineExtendedExpression,
        NonAssignmentExtendedExpression,
        NestedNonAssignmentExtendedExpression,
        ExpressionizedStatement,
        Expression,
        Arguments,
        ImplicitArguments,
        ExplicitArguments,
        ApplicationStart,
        ForbiddenImplicitCalls,
        ArgumentsWithTrailingMemberExpressions,
        TrailingMemberExpressions,
        AllowedTrailingMemberExpressions,
        CommaDelimiter,
        ArgumentList,
        NonPipelineArgumentList,
        NestedArgumentList,
        NestedArgument,
        SingleLineArgumentExpressions,
        ArgumentPart,
        NonPipelineArgumentPart,
        BinaryOpExpression,
        BinaryOpRHS,
        SingleLineBinaryOpRHS,
        RHS,
        ParenthesizedAssignment,
        UnaryExpression,
        UnaryPostfix,
        UpdateExpression,
        UpdateExpressionSymbol,
        AssignmentExpression,
        NonPipelineAssignmentExpression,
        SingleLineAssignmentExpression,
        AssignmentExpressionTail,
        ActualAssignment,
        YieldExpression,
        YieldTail,
        ArrowFunction,
        FatArrow,
        FatArrowBody,
        ConditionalExpression,
        TernaryRest,
        NestedTernaryRest,
        ShortCircuitExpression,
        PipelineExpression,
        PipelineHeadItem,
        PipelineTailItem,
        PrimaryExpression,
        ParenthesizedExpression,
        ClassDeclaration,
        ClassExpression,
        ClassBinding,
        ClassHeritage,
        ExtendsClause,
        ExtendsToken,
        ExtendsTarget,
        ImplementsClause,
        ImplementsToken,
        ImplementsShorthand,
        ImplementsTarget,
        ClassBody,
        NestedClassElements,
        NestedClassElement,
        ClassElement,
        ClassElementDefinition,
        ClassSignature,
        ClassSignatureBody,
        NestedClassSignatureElements,
        NestedClassSignatureElement,
        ClassSignatureElement,
        AccessModifier,
        FieldDefinition,
        ThisLiteral,
        AtThis,
        LeftHandSideExpression,
        CallExpression,
        CallExpressionRest,
        OptionalShorthand,
        OptionalDot,
        NonNullAssertion,
        MemberExpression,
        MemberExpressionRest,
        MemberBracketContent,
        SliceParameters,
        PropertyAccess,
        PropertyGlob,
        PropertyBind,
        SuperProperty,
        MetaProperty,
        ReturnValue,
        AfterReturnShorthand,
        Parameters,
        NonEmptyParameters,
        FunctionRestParameter,
        ParameterElement,
        ParameterElementDelimiter,
        BindingIdentifier,
        NWBindingIdentifier,
        AtIdentifierRef,
        PinPattern,
        BindingPattern,
        ObjectBindingPattern,
        ObjectBindingPatternContent,
        BindingPropertyList,
        ArrayBindingPattern,
        ArrayBindingPatternContent,
        BindingElementList,
        NestedBindingElementList,
        Elision,
        NestedBindingProperties,
        NestedBindingPropertyList,
        BindingProperty,
        BindingRestProperty,
        NestedBindingElements,
        NestedBindingElement,
        BindingElement,
        BindingRestElement,
        EmptyBindingPattern,
        FunctionDeclaration,
        FunctionSignature,
        FunctionExpression,
        AmpersandFunctionExpression,
        OperatorDeclaration,
        OperatorSignature,
        AmpersandBlockRHS,
        AmpersandBlockRHSBody,
        AmpersandUnaryPrefix,
        ThinArrowFunction,
        Arrow,
        ExplicitBlock,
        ImplicitNestedBlock,
        Block,
        ThenClause,
        BracedOrEmptyBlock,
        NoPostfixBracedOrEmptyBlock,
        EmptyBlock,
        EmptyBareBlock,
        BracedBlock,
        NoPostfixBracedBlock,
        NonSingleBracedBlock,
        SingleLineStatements,
        PostfixedSingleLineStatements,
        BracedContent,
        NestedBlockStatements,
        NestedBlockStatement,
        BlockStatementPart,
        Literal,
        LiteralContent,
        NullLiteral,
        BooleanLiteral,
        CoffeeScriptBooleanLiteral,
        Identifier,
        IdentifierName,
        IdentifierReference,
        UpcomingAssignment,
        ArrayLiteral,
        RangeExpression,
        ArrayLiteralContent,
        NestedElementList,
        NestedElement,
        ArrayElementDelimiter,
        ElementListWithIndentedApplicationForbidden,
        ElementList,
        ElementListRest,
        ArrayElementExpression,
        ObjectLiteral,
        BracedObjectLiteral,
        BracedObjectLiteralContent,
        NestedImplicitObjectLiteral,
        NestedImplicitPropertyDefinitions,
        NestedImplicitPropertyDefinition,
        NestedPropertyDefinitions,
        NestedPropertyDefinition,
        InlineObjectLiteral,
        ImplicitInlineObjectPropertyDelimiter,
        ObjectPropertyDelimiter,
        PropertyDefinitionList,
        PropertyDefinition,
        NamedProperty,
        ImplicitNamedProperty,
        SnugNamedProperty,
        PropertyName,
        ComputedPropertyName,
        Decorator,
        Decorators,
        MethodDefinition,
        MethodModifier,
        MethodSignature,
        ClassElementName,
        PrivateIdentifier,
        WAssignmentOp,
        AssignmentOp,
        OperatorAssignmentOp,
        AssignmentOpSymbol,
        CoffeeWordAssignmentOp,
        BinaryOp,
        BinaryOpSymbol,
        Xor,
        Xnor,
        UnaryOp,
        AwaitOp,
        ModuleItem,
        StatementListItem,
        PostfixedStatement,
        PostfixedExpression,
        NonPipelinePostfixedExpression,
        PostfixStatement,
        Statement,
        EmptyStatement,
        BlockStatement,
        LabelledStatement,
        Label,
        LabelledItem,
        IfStatement,
        ElseClause,
        IfClause,
        UnlessClause,
        IfExpression,
        UnlessExpression,
        ElseExpressionClause,
        ExpressionBlock,
        ElseExpressionBlock,
        NestedBlockExpressions,
        NestedBlockExpression,
        BlockExpressionPart,
        IterationStatement,
        IterationExpression,
        LoopStatement,
        LoopClause,
        DoWhileStatement,
        DoStatement,
        WhileStatement,
        WhileClause,
        ForStatement,
        ForClause,
        ForStatementControl,
        WhenCondition,
        CoffeeForStatementParameters,
        CoffeeForIndex,
        CoffeeForDeclaration,
        ForStatementParameters,
        ForRangeParameters,
        ForInOfDeclaration,
        ForDeclaration,
        ForBinding,
        SwitchStatement,
        EmptyCondition,
        SwitchExpression,
        CaseBlock,
        NestedCaseClauses,
        NestedCaseClause,
        CaseClause,
        PatternExpressionList,
        ConditionFragment,
        CaseExpressionList,
        ImpliedColon,
        TryStatement,
        TryExpression,
        CatchClause,
        CatchBind,
        FinallyClause,
        CatchParameter,
        Condition,
        DeclarationCondition,
        ExpressionWithIndentedApplicationForbidden,
        ForbidClassImplicitCall,
        AllowClassImplicitCall,
        RestoreClassImplicitCall,
        ClassImplicitCallForbidden,
        ForbidIndentedApplication,
        AllowIndentedApplication,
        RestoreIndentedApplication,
        IndentedApplicationAllowed,
        ForbidTrailingMemberProperty,
        AllowTrailingMemberProperty,
        RestoreTrailingMemberProperty,
        TrailingMemberPropertyAllowed,
        ForbidMultiLineImplicitObjectLiteral,
        AllowMultiLineImplicitObjectLiteral,
        RestoreMultiLineImplicitObjectLiteral,
        MultiLineImplicitObjectLiteralAllowed,
        AllowNewlineBinaryOp,
        ForbidNewlineBinaryOp,
        RestoreNewlineBinaryOp,
        NewlineBinaryOpAllowed,
        AllowAll,
        RestoreAll,
        ExpressionStatement,
        KeywordStatement,
        Break,
        Continue,
        Debugger,
        DebuggerExpression,
        ThrowExpression,
        MaybeNestedExpression,
        ImportDeclaration,
        ImpliedImport,
        ImportClause,
        NameSpaceImport,
        NamedImports,
        FromClause,
        ImportAssertion,
        TypeAndImportSpecifier,
        ImportSpecifier,
        ImportAsToken,
        ModuleExportName,
        ModuleSpecifier,
        UnprocessedModuleSpecifier,
        UnquotedSpecifier,
        ImportedBinding,
        ExportDeclaration,
        ExportVarDec,
        ExportFromClause,
        TypeAndNamedExports,
        NamedExports,
        ExportSpecifier,
        ImplicitExportSpecifier,
        Declaration,
        HoistableDeclaration,
        LexicalDeclaration,
        ConstAssignment,
        LetAssignment,
        LexicalBinding,
        Initializer,
        VariableStatement,
        VariableDeclarationList,
        VariableDeclaration,
        NumericLiteral,
        NumericLiteralKind,
        DecimalBigIntegerLiteral,
        DecimalLiteral,
        ExponentPart,
        BinaryIntegerLiteral,
        OctalIntegerLiteral,
        HexIntegerLiteral,
        IntegerLiteral,
        IntegerLiteralKind,
        DecimalIntegerLiteral,
        StringLiteral,
        DoubleStringCharacters,
        SingleStringCharacters,
        TripleDoubleStringCharacters,
        TripleSingleStringCharacters,
        CoffeeStringSubstitution,
        CoffeeInterpolatedDoubleQuotedString,
        CoffeeDoubleQuotedStringCharacters,
        RegularExpressionLiteral,
        RegularExpressionClass,
        RegularExpressionClassCharacters,
        HeregexLiteral,
        HeregexBody,
        HeregexPart,
        HeregexComment,
        RegularExpressionBody,
        RegExpPart,
        RegExpCharacter,
        RegularExpressionFlags,
        TemplateLiteral,
        TemplateSubstitution,
        TemplateCharacters,
        TemplateBlockCharacters,
        ReservedWord,
        Comment,
        SingleLineComment,
        JSSingleLineComment,
        MultiLineComment,
        JSMultiLineComment,
        CoffeeSingleLineComment,
        CoffeeMultiLineComment,
        CoffeeHereCommentStart,
        InlineComment,
        RestOfLine,
        TrailingComment,
        _,
        NonNewlineWhitespace,
        Trimmed_,
        __,
        Whitespace,
        ExpressionDelimiter,
        SimpleStatementDelimiter,
        StatementDelimiter,
        SemicolonDelimiter,
        NonIdContinue,
        Loc,
        Abstract,
        Ampersand,
        As,
        At,
        AtAt,
        Async,
        Await,
        Backtick,
        By,
        Case,
        Catch,
        Class,
        CloseBrace,
        CloseBracket,
        CloseParen,
        CoffeeSubstitutionStart,
        Colon,
        Comma,
        ConstructorShorthand,
        Declare,
        Default,
        Delete,
        Do,
        Dot,
        DotDot,
        DotDotDot,
        DoubleColon,
        DoubleQuote,
        Else,
        Equals,
        Export,
        Extends,
        Finally,
        For,
        From,
        Function,
        GetOrSet,
        If,
        Import,
        In,
        LetOrConst,
        Const,
        Is,
        LetOrConstOrVar,
        Loop,
        New,
        Not,
        Of,
        OpenAngleBracket,
        OpenBrace,
        OpenBracket,
        OpenParen,
        Operator,
        Public,
        Private,
        Protected,
        Pipe,
        QuestionMark,
        Readonly,
        Return,
        Satisfies,
        Semicolon,
        SingleQuote,
        Star,
        Static,
        SubstitutionStart,
        Switch,
        Target,
        Then,
        This,
        Throw,
        TripleDoubleQuote,
        TripleSingleQuote,
        TripleSlash,
        TripleTick,
        Try,
        Typeof,
        Unless,
        Until,
        Var,
        Void,
        When,
        While,
        Yield,
        JSXImplicitFragment,
        JSXTag,
        JSXElement,
        JSXSelfClosingElement,
        PushJSXOpeningElement,
        PopJSXStack,
        JSXOpeningElement,
        JSXOptionalClosingElement,
        JSXClosingElement,
        JSXFragment,
        PushJSXOpeningFragment,
        JSXOptionalClosingFragment,
        JSXClosingFragment,
        JSXElementName,
        JSXIdentifierName,
        JSXAttributes,
        JSXAttribute,
        JSXAttributeSpace,
        JSXShorthandString,
        JSXAttributeName,
        JSXAttributeInitializer,
        JSXAttributeValue,
        InlineJSXAttributeValue,
        InlineJSXBinaryOpRHS,
        InlineJSXUnaryExpression,
        InlineJSXUnaryOp,
        InlineJSXUnaryPostfix,
        InlineJSXUpdateExpression,
        InlineJSXCallExpression,
        InlineJSXCallExpressionRest,
        InlineJSXMemberExpression,
        InlineJSXMemberExpressionRest,
        InlineJSXPrimaryExpression,
        JSXMixedChildren,
        JSXChildren,
        JSXNestedChildren,
        JSXEOS,
        JSXNested,
        JSXChild,
        JSXComment,
        JSXCommentContent,
        JSXText,
        JSXChildExpression,
        IndentedJSXChildExpression,
        NestedJSXChildExpression,
        TypeDeclaration,
        TypeDeclarationRest,
        TypeLexicalDeclaration,
        TypeDeclarationBinding,
        InterfaceExtendsClause,
        InterfaceExtendsTarget,
        TypeKeyword,
        Enum,
        Interface,
        Global,
        Module,
        Namespace,
        InterfaceBlock,
        NestedInterfaceProperties,
        NestedInterfaceProperty,
        InterfaceProperty,
        BasicInterfaceProperty,
        InterfacePropertyDelimiter,
        ModuleBlock,
        NestedModuleItems,
        NestedModuleItem,
        DeclareBlock,
        NestedDeclareElements,
        NestedDeclareElement,
        DeclareElement,
        EnumDeclaration,
        EnumBlock,
        NestedEnumProperties,
        NestedEnumProperty,
        EnumProperty,
        TypeProperty,
        TypeIndexSignature,
        TypeIndex,
        TypeSuffix,
        ReturnTypeSuffix,
        TypePredicate,
        Type,
        TypeBinary,
        TypeUnary,
        TypeUnarySuffix,
        TypeUnaryOp,
        TypeIndexedAccess,
        TypePrimary,
        ImportType,
        TypeTuple,
        TypeList,
        TypeElement,
        NestedTypeList,
        NestedType,
        TypeConditional,
        TypeTemplateSubstitution,
        TypeTemplateLiteral,
        CoffeeStringTypeSubstitution,
        CoffeeInterpolatedDoubleQuotedTypeLiteral,
        TypeLiteral,
        InlineInterfaceLiteral,
        InlineBasicInterfaceProperty,
        InlineInterfacePropertyDelimiter,
        TypeBinaryOp,
        FunctionType,
        TypeArrowFunction,
        TypeArguments,
        TypeArgument,
        TypeArgumentDelimiter,
        TypeParameters,
        TypeParameter,
        TypeConstraint,
        TypeInitializer,
        TypeParameterDelimiter,
        ThisType,
        Shebang,
        CivetPrologue,
        CivetPrologueContent,
        CivetOption,
        UnknownPrologue,
        DirectivePrologue,
        EOS,
        EOL,
        DebugHere,
        InsertSemicolon,
        InsertOpenParen,
        InsertCloseParen,
        InsertOpenBrace,
        InsertInlineOpenBrace,
        InsertCloseBrace,
        InsertOpenBracket,
        InsertCloseBracket,
        InsertComma,
        InsertConst,
        InsertLet,
        InsertReadonly,
        InsertNewline,
        InsertIndent,
        InsertSpace,
        InsertDot,
        InsertBreak,
        InsertVar,
        CoffeeBinaryExistentialEnabled,
        CoffeeBooleansEnabled,
        CoffeeClassesEnabled,
        CoffeeCommentEnabled,
        CoffeeDoEnabled,
        CoffeeForLoopsEnabled,
        CoffeeInterpolationEnabled,
        CoffeeIsntEnabled,
        CoffeeJSXEnabled,
        CoffeeLineContinuationEnabled,
        CoffeeNotEnabled,
        CoffeeOfEnabled,
        CoffeePrototypeEnabled,
        ObjectIsEnabled,
        Reset,
        Init,
        Indent,
        TrackIndented,
        Samedent,
        IndentedFurther,
        NotDedented,
        Dedented,
        PushIndent,
        PopIndent,
        Nested
      });
      var $L0 = $L("");
      var $L1 = $L("/ ");
      var $L2 = $L("=");
      var $L3 = $L("(");
      var $L4 = $L("?");
      var $L5 = $L(".");
      var $L6 = $L("++");
      var $L7 = $L("--");
      var $L8 = $L("=>");
      var $L9 = $L("\u21D2");
      var $L10 = $L(" ");
      var $L11 = $L(":");
      var $L12 = $L("implements");
      var $L13 = $L("<:");
      var $L14 = $L("#");
      var $L15 = $L("super");
      var $L16 = $L("import");
      var $L17 = $L("!");
      var $L18 = $L("^");
      var $L19 = $L("-");
      var $L20 = $L("import.meta");
      var $L21 = $L("return.value");
      var $L22 = $L(",");
      var $L23 = $L("->");
      var $L24 = $L("\u2192");
      var $L25 = $L("}");
      var $L26 = $L("null");
      var $L27 = $L("true");
      var $L28 = $L("false");
      var $L29 = $L("yes");
      var $L30 = $L("on");
      var $L31 = $L("no");
      var $L32 = $L("off");
      var $L33 = $L(">");
      var $L34 = $L("]");
      var $L35 = $L("**=");
      var $L36 = $L("*=");
      var $L37 = $L("/=");
      var $L38 = $L("%=");
      var $L39 = $L("+=");
      var $L40 = $L("-=");
      var $L41 = $L("<<=");
      var $L42 = $L(">>>=");
      var $L43 = $L(">>=");
      var $L44 = $L("&&=");
      var $L45 = $L("&=");
      var $L46 = $L("^=");
      var $L47 = $L("||=");
      var $L48 = $L("|=");
      var $L49 = $L("??=");
      var $L50 = $L("?=");
      var $L51 = $L("and=");
      var $L52 = $L("or=");
      var $L53 = $L("**");
      var $L54 = $L("*");
      var $L55 = $L("/");
      var $L56 = $L("%%");
      var $L57 = $L("%");
      var $L58 = $L("+");
      var $L59 = $L("<=");
      var $L60 = $L("\u2264");
      var $L61 = $L(">=");
      var $L62 = $L("\u2265");
      var $L63 = $L("<?");
      var $L64 = $L("!<?");
      var $L65 = $L("<<");
      var $L66 = $L("\xAB");
      var $L67 = $L(">>>");
      var $L68 = $L("\u22D9");
      var $L69 = $L(">>");
      var $L70 = $L("\xBB");
      var $L71 = $L("!==");
      var $L72 = $L("\u2262");
      var $L73 = $L("!=");
      var $L74 = $L("\u2260");
      var $L75 = $L("isnt");
      var $L76 = $L("===");
      var $L77 = $L("\u2263");
      var $L78 = $L("\u2A76");
      var $L79 = $L("==");
      var $L80 = $L("\u2261");
      var $L81 = $L("\u2A75");
      var $L82 = $L("and");
      var $L83 = $L("&&");
      var $L84 = $L("of");
      var $L85 = $L("or");
      var $L86 = $L("||");
      var $L87 = $L("\u2016");
      var $L88 = $L("^^");
      var $L89 = $L("xor");
      var $L90 = $L("xnor");
      var $L91 = $L("??");
      var $L92 = $L("\u2047");
      var $L93 = $L("instanceof");
      var $L94 = $L("\u2208");
      var $L95 = $L("\u220B");
      var $L96 = $L("\u220C");
      var $L97 = $L("\u2209");
      var $L98 = $L("&");
      var $L99 = $L("|");
      var $L100 = $L(";");
      var $L101 = $L("$:");
      var $L102 = $L("own");
      var $L103 = $L("break");
      var $L104 = $L("continue");
      var $L105 = $L("debugger");
      var $L106 = $L("assert");
      var $L107 = $L(":=");
      var $L108 = $L("\u2254");
      var $L109 = $L(".=");
      var $L110 = $L("/*");
      var $L111 = $L("*/");
      var $L112 = $L("\\");
      var $L113 = $L("[");
      var $L114 = $L("`");
      var $L115 = $L("abstract");
      var $L116 = $L("as");
      var $L117 = $L("@");
      var $L118 = $L("@@");
      var $L119 = $L("async");
      var $L120 = $L("await");
      var $L121 = $L("by");
      var $L122 = $L("case");
      var $L123 = $L("catch");
      var $L124 = $L("class");
      var $L125 = $L(")");
      var $L126 = $L("#{");
      var $L127 = $L("declare");
      var $L128 = $L("default");
      var $L129 = $L("delete");
      var $L130 = $L("do");
      var $L131 = $L("..");
      var $L132 = $L("\u2025");
      var $L133 = $L("...");
      var $L134 = $L("\u2026");
      var $L135 = $L("::");
      var $L136 = $L('"');
      var $L137 = $L("else");
      var $L138 = $L("export");
      var $L139 = $L("extends");
      var $L140 = $L("finally");
      var $L141 = $L("for");
      var $L142 = $L("from");
      var $L143 = $L("function");
      var $L144 = $L("get");
      var $L145 = $L("set");
      var $L146 = $L("if");
      var $L147 = $L("in");
      var $L148 = $L("let");
      var $L149 = $L("const");
      var $L150 = $L("is");
      var $L151 = $L("loop");
      var $L152 = $L("new");
      var $L153 = $L("not");
      var $L154 = $L("<");
      var $L155 = $L("{");
      var $L156 = $L("operator");
      var $L157 = $L("public");
      var $L158 = $L("private");
      var $L159 = $L("protected");
      var $L160 = $L("||>");
      var $L161 = $L("|\u25B7");
      var $L162 = $L("|>=");
      var $L163 = $L("\u25B7=");
      var $L164 = $L("|>");
      var $L165 = $L("\u25B7");
      var $L166 = $L("readonly");
      var $L167 = $L("return");
      var $L168 = $L("satisfies");
      var $L169 = $L("'");
      var $L170 = $L("static");
      var $L171 = $L("${");
      var $L172 = $L("switch");
      var $L173 = $L("target");
      var $L174 = $L("then");
      var $L175 = $L("this");
      var $L176 = $L("throw");
      var $L177 = $L('"""');
      var $L178 = $L("'''");
      var $L179 = $L("///");
      var $L180 = $L("```");
      var $L181 = $L("try");
      var $L182 = $L("typeof");
      var $L183 = $L("unless");
      var $L184 = $L("until");
      var $L185 = $L("var");
      var $L186 = $L("void");
      var $L187 = $L("when");
      var $L188 = $L("while");
      var $L189 = $L("yield");
      var $L190 = $L("/>");
      var $L191 = $L("</");
      var $L192 = $L("<>");
      var $L193 = $L("</>");
      var $L194 = $L("<!--");
      var $L195 = $L("-->");
      var $L196 = $L("type");
      var $L197 = $L("enum");
      var $L198 = $L("interface");
      var $L199 = $L("global");
      var $L200 = $L("module");
      var $L201 = $L("namespace");
      var $L202 = $L("asserts");
      var $L203 = $L("keyof");
      var $L204 = $L("infer");
      var $L205 = $L("[]");
      var $L206 = $L("civet");
      var $R0 = $R(new RegExp("(as|of|satisfies|then|when|implements|xor|xnor)(?!\\p{ID_Continue}|[\\u200C\\u200D$])", "suy"));
      var $R1 = $R(new RegExp("[0-9]", "suy"));
      var $R2 = $R(new RegExp("[)}]", "suy"));
      var $R3 = $R(new RegExp("[&]", "suy"));
      var $R4 = $R(new RegExp("[!~+-]+", "suy"));
      var $R5 = $R(new RegExp("(?:\\p{ID_Start}|[_$])(?:\\p{ID_Continue}|[\\u200C\\u200D$])*", "suy"));
      var $R6 = $R(new RegExp("[!+-]", "suy"));
      var $R7 = $R(new RegExp("<(?!\\p{ID_Start}|[_$])", "suy"));
      var $R8 = $R(new RegExp("!\\^\\^?", "suy"));
      var $R9 = $R(new RegExp("(?!\\+\\+|--)[!~+-](?!\\s|[!~+-]*&)", "suy"));
      var $R10 = $R(new RegExp("(?=[\\s\\)])", "suy"));
      var $R11 = $R(new RegExp('[^;"\\s]+', "suy"));
      var $R12 = $R(new RegExp("(?:0|[1-9](?:_[0-9]|[0-9])*)n", "suy"));
      var $R13 = $R(new RegExp("(?:0|[1-9](?:_[0-9]|[0-9])*)(?=\\.(?:\\p{ID_Start}|[_$]))", "suy"));
      var $R14 = $R(new RegExp("(?:0|[1-9](?:_[0-9]|[0-9])*)(?:\\.(?:[0-9](?:_[0-9]|[0-9])*))?", "suy"));
      var $R15 = $R(new RegExp("(?:\\.[0-9](?:_[0-9]|[0-9])*)", "suy"));
      var $R16 = $R(new RegExp("(?:[eE][+-]?[0-9]+(?:_[0-9]|[0-9])*)", "suy"));
      var $R17 = $R(new RegExp("0[bB][01](?:[01]|_[01])*n?", "suy"));
      var $R18 = $R(new RegExp("0[oO][0-7](?:[0-7]|_[0-7])*n?", "suy"));
      var $R19 = $R(new RegExp("0[xX][0-9a-fA-F](?:[0-9a-fA-F]|_[0-9a-fA-F])*n?", "suy"));
      var $R20 = $R(new RegExp("(?:0|[1-9](?:_[0-9]|[0-9])*)", "suy"));
      var $R21 = $R(new RegExp('(?:\\\\.|[^"])*', "suy"));
      var $R22 = $R(new RegExp("(?:\\\\.|[^'])*", "suy"));
      var $R23 = $R(new RegExp('(?:"(?!"")|#(?!\\{)|\\\\.|[^#"])+', "suy"));
      var $R24 = $R(new RegExp("(?:'(?!'')|\\\\.|[^'])*", "suy"));
      var $R25 = $R(new RegExp('(?:\\\\.|#(?!\\{)|[^"#])+', "suy"));
      var $R26 = $R(new RegExp("(?:\\\\.|[^\\]])*", "suy"));
      var $R27 = $R(new RegExp("(?:\\\\.)", "suy"));
      var $R28 = $R(new RegExp("[\\s]+", "suy"));
      var $R29 = $R(new RegExp("\\/(?!\\/\\/)", "suy"));
      var $R30 = $R(new RegExp("[^[\\/\\s#\\\\]+", "suy"));
      var $R31 = $R(new RegExp("[*\\/\\r\\n]", "suy"));
      var $R32 = $R(new RegExp("(?:\\\\.|[^[\\/\\r\\n])+", "suy"));
      var $R33 = $R(new RegExp("(?:\\p{ID_Continue}|[\\u200C\\u200D$])*", "suy"));
      var $R34 = $R(new RegExp("(?:\\$(?!\\{)|\\\\.|[^$`])+", "suy"));
      var $R35 = $R(new RegExp("(?:\\$(?!\\{)|`(?!``)|\\\\.|[^$`])+", "suy"));
      var $R36 = $R(new RegExp("(?:on|off|yes|no)(?!\\p{ID_Continue})", "suy"));
      var $R37 = $R(new RegExp("(?:isnt)(?!\\p{ID_Continue})", "suy"));
      var $R38 = $R(new RegExp("(?:by)(?!\\p{ID_Continue})", "suy"));
      var $R39 = $R(new RegExp("(?:of)(?!\\p{ID_Continue})", "suy"));
      var $R40 = $R(new RegExp("(?:and|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|import|in|instanceof|interface|is|let|loop|new|not|null|or|private|protected|public|return|static|super|switch|this|throw|true|try|typeof|unless|until|var|void|while|with|yield)(?!\\p{ID_Continue})", "suy"));
      var $R41 = $R(new RegExp("\\/\\/(?!\\/)[^\\r\\n]*", "suy"));
      var $R42 = $R(new RegExp(".", "suy"));
      var $R43 = $R(new RegExp("#(?!##(?!#))([^\\r\\n]*)", "suy"));
      var $R44 = $R(new RegExp("[^]*?###", "suy"));
      var $R45 = $R(new RegExp("###(?!#)", "suy"));
      var $R46 = $R(new RegExp("[^\\r\\n]", "suy"));
      var $R47 = $R(new RegExp("[ \\t]+", "suy"));
      var $R48 = $R(new RegExp("(?!\\p{ID_Continue})", "suy"));
      var $R49 = $R(new RegExp("\\s", "suy"));
      var $R50 = $R(new RegExp("(?:\\p{ID_Start}|[_$])(?:\\p{ID_Continue}|[\\u200C\\u200D$-])*", "suy"));
      var $R51 = $R(new RegExp("[\\s>]|\\/>", "suy"));
      var $R52 = $R(new RegExp("(?:[-\\w:]+|\\([^()]*\\)|\\[[^\\[\\]]*\\])+", "suy"));
      var $R53 = $R(new RegExp(`"[^"]*"|'[^']*'`, "suy"));
      var $R54 = $R(new RegExp("[<>]", "suy"));
      var $R55 = $R(new RegExp("[!~+-](?!\\s|[!~+-]*&)", "suy"));
      var $R56 = $R(new RegExp("(?:-[^-]|[^-]*)*", "suy"));
      var $R57 = $R(new RegExp("[^{}<>\\r\\n]+", "suy"));
      var $R58 = $R(new RegExp("[+-]?", "suy"));
      var $R59 = $R(new RegExp("[+-]", "suy"));
      var $R60 = $R(new RegExp("#![^\\r\\n]*", "suy"));
      var $R61 = $R(new RegExp("[\\t ]*", "suy"));
      var $R62 = $R(new RegExp("[\\s]*", "suy"));
      var $R63 = $R(new RegExp("\\s+([+-]?)([a-zA-Z0-9-]+)(\\s*=\\s*([a-zA-Z0-9.+-]*))?", "suy"));
      var $R64 = $R(new RegExp("\\r\\n|\\n|\\r|$", "suy"));
      var $R65 = $R(new RegExp("[ \\t]*", "suy"));
      var Program$0 = $TS($S(Reset, Init, $E(EOS), TopLevelStatements, __), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var statements = $4;
        processProgram({
          type: "BlockStatement",
          expressions: statements,
          children: [statements],
          bare: true,
          root: true
        }, module.config, module, ReservedWord);
        return $0;
      });
      function Program(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Program", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Program", state, Program$0(state));
          if (state.events)
            state.events.exit?.("Program", state, result, eventData);
          return result;
        } else {
          const result = Program$0(state);
          if (state.events)
            state.events.exit?.("Program", state, result, eventData);
          return result;
        }
      }
      var TopLevelStatements$0 = $TS($S(TrackIndented, TopLevelSingleLineStatements, $Q(NestedTopLevelStatements), PopIndent), function($skip, $loc, $0, $1, $2, $3, $4) {
        var indent = $1;
        var first = $2;
        var rest = $3;
        return [
          [indent, ...first[0]],
          ...first.slice(1).map((s) => ["", ...s]),
          ...rest.flat()
        ];
      });
      var TopLevelStatements$1 = $TS($S(TopLevelSingleLineStatements, $Q(NestedTopLevelStatements)), function($skip, $loc, $0, $1, $2) {
        var first = $1;
        var rest = $2;
        return [
          ...first.map((s) => ["", ...s]),
          ...rest.flat()
        ];
      });
      var TopLevelStatements$2 = $T($EXPECT($L0, fail, 'TopLevelStatements ""'), function(value) {
        return [];
      });
      function TopLevelStatements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TopLevelStatements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TopLevelStatements", state, TopLevelStatements$0(state) || TopLevelStatements$1(state) || TopLevelStatements$2(state));
          if (state.events)
            state.events.exit?.("TopLevelStatements", state, result, eventData);
          return result;
        } else {
          const result = TopLevelStatements$0(state) || TopLevelStatements$1(state) || TopLevelStatements$2(state);
          if (state.events)
            state.events.exit?.("TopLevelStatements", state, result, eventData);
          return result;
        }
      }
      var NestedTopLevelStatements$0 = $TS($S(Nested, TopLevelSingleLineStatements), function($skip, $loc, $0, $1, $2) {
        var nested = $1;
        var statements = $2;
        return [
          [nested, ...statements[0]],
          ...statements.slice(1).map((s) => ["", ...s])
        ];
      });
      function NestedTopLevelStatements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedTopLevelStatements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedTopLevelStatements", state, NestedTopLevelStatements$0(state));
          if (state.events)
            state.events.exit?.("NestedTopLevelStatements", state, result, eventData);
          return result;
        } else {
          const result = NestedTopLevelStatements$0(state);
          if (state.events)
            state.events.exit?.("NestedTopLevelStatements", state, result, eventData);
          return result;
        }
      }
      var TopLevelSingleLineStatements$0 = $P(TopLevelStatement);
      function TopLevelSingleLineStatements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TopLevelSingleLineStatements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TopLevelSingleLineStatements", state, TopLevelSingleLineStatements$0(state));
          if (state.events)
            state.events.exit?.("TopLevelSingleLineStatements", state, result, eventData);
          return result;
        } else {
          const result = TopLevelSingleLineStatements$0(state);
          if (state.events)
            state.events.exit?.("TopLevelSingleLineStatements", state, result, eventData);
          return result;
        }
      }
      var TopLevelStatement$0 = $TS($S($N(EOS), $E(_), ModuleItem, StatementDelimiter), function($skip, $loc, $0, $1, $2, $3, $4) {
        var ws = $2;
        var statement = $3;
        var delimiter = $4;
        if (ws) {
          statement = {
            ...statement,
            children: [ws, ...statement.children]
          };
        }
        return [statement, delimiter];
      });
      function TopLevelStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TopLevelStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TopLevelStatement", state, TopLevelStatement$0(state));
          if (state.events)
            state.events.exit?.("TopLevelStatement", state, result, eventData);
          return result;
        } else {
          const result = TopLevelStatement$0(state);
          if (state.events)
            state.events.exit?.("TopLevelStatement", state, result, eventData);
          return result;
        }
      }
      var ExtendedExpression$0 = NonAssignmentExtendedExpression;
      var ExtendedExpression$1 = AssignmentExpression;
      function ExtendedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExtendedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExtendedExpression", state, ExtendedExpression$0(state) || ExtendedExpression$1(state));
          if (state.events)
            state.events.exit?.("ExtendedExpression", state, result, eventData);
          return result;
        } else {
          const result = ExtendedExpression$0(state) || ExtendedExpression$1(state);
          if (state.events)
            state.events.exit?.("ExtendedExpression", state, result, eventData);
          return result;
        }
      }
      var SingleLineExtendedExpression$0 = NonAssignmentExtendedExpression;
      var SingleLineExtendedExpression$1 = SingleLineAssignmentExpression;
      function SingleLineExtendedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SingleLineExtendedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SingleLineExtendedExpression", state, SingleLineExtendedExpression$0(state) || SingleLineExtendedExpression$1(state));
          if (state.events)
            state.events.exit?.("SingleLineExtendedExpression", state, result, eventData);
          return result;
        } else {
          const result = SingleLineExtendedExpression$0(state) || SingleLineExtendedExpression$1(state);
          if (state.events)
            state.events.exit?.("SingleLineExtendedExpression", state, result, eventData);
          return result;
        }
      }
      var NonPipelineExtendedExpression$0 = NonAssignmentExtendedExpression;
      var NonPipelineExtendedExpression$1 = NonPipelineAssignmentExpression;
      function NonPipelineExtendedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonPipelineExtendedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonPipelineExtendedExpression", state, NonPipelineExtendedExpression$0(state) || NonPipelineExtendedExpression$1(state));
          if (state.events)
            state.events.exit?.("NonPipelineExtendedExpression", state, result, eventData);
          return result;
        } else {
          const result = NonPipelineExtendedExpression$0(state) || NonPipelineExtendedExpression$1(state);
          if (state.events)
            state.events.exit?.("NonPipelineExtendedExpression", state, result, eventData);
          return result;
        }
      }
      var NonAssignmentExtendedExpression$0 = NestedNonAssignmentExtendedExpression;
      var NonAssignmentExtendedExpression$1 = $TS($S(__, ExpressionizedStatement), function($skip, $loc, $0, $1, $2) {
        return {
          ...$2,
          children: [...$1, ...$2.children]
        };
      });
      function NonAssignmentExtendedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonAssignmentExtendedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonAssignmentExtendedExpression", state, NonAssignmentExtendedExpression$0(state) || NonAssignmentExtendedExpression$1(state));
          if (state.events)
            state.events.exit?.("NonAssignmentExtendedExpression", state, result, eventData);
          return result;
        } else {
          const result = NonAssignmentExtendedExpression$0(state) || NonAssignmentExtendedExpression$1(state);
          if (state.events)
            state.events.exit?.("NonAssignmentExtendedExpression", state, result, eventData);
          return result;
        }
      }
      var NestedNonAssignmentExtendedExpression$0 = $TS($S($Y(EOS), PushIndent, $E($S(Nested, ExpressionizedStatement)), PopIndent), function($skip, $loc, $0, $1, $2, $3, $4) {
        var expression = $3;
        if (expression)
          return expression;
        return $skip;
      });
      function NestedNonAssignmentExtendedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedNonAssignmentExtendedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedNonAssignmentExtendedExpression", state, NestedNonAssignmentExtendedExpression$0(state));
          if (state.events)
            state.events.exit?.("NestedNonAssignmentExtendedExpression", state, result, eventData);
          return result;
        } else {
          const result = NestedNonAssignmentExtendedExpression$0(state);
          if (state.events)
            state.events.exit?.("NestedNonAssignmentExtendedExpression", state, result, eventData);
          return result;
        }
      }
      var ExpressionizedStatement$0 = DebuggerExpression;
      var ExpressionizedStatement$1 = IfExpression;
      var ExpressionizedStatement$2 = UnlessExpression;
      var ExpressionizedStatement$3 = IterationExpression;
      var ExpressionizedStatement$4 = SwitchExpression;
      var ExpressionizedStatement$5 = ThrowExpression;
      var ExpressionizedStatement$6 = TryExpression;
      function ExpressionizedStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExpressionizedStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExpressionizedStatement", state, ExpressionizedStatement$0(state) || ExpressionizedStatement$1(state) || ExpressionizedStatement$2(state) || ExpressionizedStatement$3(state) || ExpressionizedStatement$4(state) || ExpressionizedStatement$5(state) || ExpressionizedStatement$6(state));
          if (state.events)
            state.events.exit?.("ExpressionizedStatement", state, result, eventData);
          return result;
        } else {
          const result = ExpressionizedStatement$0(state) || ExpressionizedStatement$1(state) || ExpressionizedStatement$2(state) || ExpressionizedStatement$3(state) || ExpressionizedStatement$4(state) || ExpressionizedStatement$5(state) || ExpressionizedStatement$6(state);
          if (state.events)
            state.events.exit?.("ExpressionizedStatement", state, result, eventData);
          return result;
        }
      }
      var Expression$0 = $TS($S(AssignmentExpression, $Q($S(CommaDelimiter, AssignmentExpression))), function($skip, $loc, $0, $1, $2) {
        if ($2.length == 0)
          return $1;
        return $0;
      });
      function Expression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Expression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Expression", state, Expression$0(state));
          if (state.events)
            state.events.exit?.("Expression", state, result, eventData);
          return result;
        } else {
          const result = Expression$0(state);
          if (state.events)
            state.events.exit?.("Expression", state, result, eventData);
          return result;
        }
      }
      var Arguments$0 = ExplicitArguments;
      var Arguments$1 = $TS($S(ForbidTrailingMemberProperty, $E(ImplicitArguments), RestoreTrailingMemberProperty), function($skip, $loc, $0, $1, $2, $3) {
        var args = $2;
        if (args)
          return args;
        return $skip;
      });
      function Arguments(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Arguments", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Arguments", state, Arguments$0(state) || Arguments$1(state));
          if (state.events)
            state.events.exit?.("Arguments", state, result, eventData);
          return result;
        } else {
          const result = Arguments$0(state) || Arguments$1(state);
          if (state.events)
            state.events.exit?.("Arguments", state, result, eventData);
          return result;
        }
      }
      var ImplicitArguments$0 = $TS($S($E($S(TypeArguments, $N(ImplementsToken))), ApplicationStart, InsertOpenParen, $Q(_), NonPipelineArgumentList, InsertCloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        var ta = $1;
        var open = $3;
        var ws = $4;
        var args = $5;
        var close = $6;
        if (args.length === 1 && args[0].type === "IterationExpression" && args[0].subtype !== "DoStatement" && !args[0].async && isEmptyBareBlock(args[0].block)) {
          return $skip;
        }
        return [ta?.[0], open, insertTrimmingSpace(ws, ""), args, close];
      });
      function ImplicitArguments(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplicitArguments", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplicitArguments", state, ImplicitArguments$0(state));
          if (state.events)
            state.events.exit?.("ImplicitArguments", state, result, eventData);
          return result;
        } else {
          const result = ImplicitArguments$0(state);
          if (state.events)
            state.events.exit?.("ImplicitArguments", state, result, eventData);
          return result;
        }
      }
      var ExplicitArguments$0 = $S($E(TypeArguments), OpenParen, $E(ArgumentList), $E($S(__, Comma)), __, CloseParen);
      function ExplicitArguments(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExplicitArguments", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExplicitArguments", state, ExplicitArguments$0(state));
          if (state.events)
            state.events.exit?.("ExplicitArguments", state, result, eventData);
          return result;
        } else {
          const result = ExplicitArguments$0(state);
          if (state.events)
            state.events.exit?.("ExplicitArguments", state, result, eventData);
          return result;
        }
      }
      var ApplicationStart$0 = $S(IndentedApplicationAllowed, $Y(NestedImplicitObjectLiteral));
      var ApplicationStart$1 = $S($N(EOS), $Y($S(_, $N(ForbiddenImplicitCalls))));
      function ApplicationStart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ApplicationStart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ApplicationStart", state, ApplicationStart$0(state) || ApplicationStart$1(state));
          if (state.events)
            state.events.exit?.("ApplicationStart", state, result, eventData);
          return result;
        } else {
          const result = ApplicationStart$0(state) || ApplicationStart$1(state);
          if (state.events)
            state.events.exit?.("ApplicationStart", state, result, eventData);
          return result;
        }
      }
      var ForbiddenImplicitCalls$0 = $R$0($EXPECT($R0, fail, "ForbiddenImplicitCalls /(as|of|satisfies|then|when|implements|xor|xnor)(?!\\p{ID_Continue}|[\\u200C\\u200D$])/"));
      var ForbiddenImplicitCalls$1 = $EXPECT($L1, fail, 'ForbiddenImplicitCalls "/ "');
      var ForbiddenImplicitCalls$2 = $S(ClassImplicitCallForbidden, $C(Class, AtAt));
      var ForbiddenImplicitCalls$3 = $S(Identifier, $EXPECT($L2, fail, 'ForbiddenImplicitCalls "="'), Whitespace);
      var ForbiddenImplicitCalls$4 = $TS($S(Identifier, $N($EXPECT($L3, fail, 'ForbiddenImplicitCalls "("'))), function($skip, $loc, $0, $1, $2) {
        var id = $1;
        if (module.operators.has(id.name))
          return $0;
        return $skip;
      });
      var ForbiddenImplicitCalls$5 = $TS($S(Not, $E(_), Identifier), function($skip, $loc, $0, $1, $2, $3) {
        var id = $3;
        if (module.operators.has(id.name))
          return $0;
        return $skip;
      });
      function ForbiddenImplicitCalls(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForbiddenImplicitCalls", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForbiddenImplicitCalls", state, ForbiddenImplicitCalls$0(state) || ForbiddenImplicitCalls$1(state) || ForbiddenImplicitCalls$2(state) || ForbiddenImplicitCalls$3(state) || ForbiddenImplicitCalls$4(state) || ForbiddenImplicitCalls$5(state));
          if (state.events)
            state.events.exit?.("ForbiddenImplicitCalls", state, result, eventData);
          return result;
        } else {
          const result = ForbiddenImplicitCalls$0(state) || ForbiddenImplicitCalls$1(state) || ForbiddenImplicitCalls$2(state) || ForbiddenImplicitCalls$3(state) || ForbiddenImplicitCalls$4(state) || ForbiddenImplicitCalls$5(state);
          if (state.events)
            state.events.exit?.("ForbiddenImplicitCalls", state, result, eventData);
          return result;
        }
      }
      var ArgumentsWithTrailingMemberExpressions$0 = $TS($S(Arguments, AllowedTrailingMemberExpressions), function($skip, $loc, $0, $1, $2) {
        var args = $1;
        var trailing = $2;
        const call = {
          type: "Call",
          children: args
        };
        return [call, ...trailing];
      });
      function ArgumentsWithTrailingMemberExpressions(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArgumentsWithTrailingMemberExpressions", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArgumentsWithTrailingMemberExpressions", state, ArgumentsWithTrailingMemberExpressions$0(state));
          if (state.events)
            state.events.exit?.("ArgumentsWithTrailingMemberExpressions", state, result, eventData);
          return result;
        } else {
          const result = ArgumentsWithTrailingMemberExpressions$0(state);
          if (state.events)
            state.events.exit?.("ArgumentsWithTrailingMemberExpressions", state, result, eventData);
          return result;
        }
      }
      var TrailingMemberExpressions$0 = $TS($S($Q(MemberExpressionRest), $Q($S($C(Samedent, IndentedFurther), $Y($S($E($EXPECT($L4, fail, 'TrailingMemberExpressions "?"')), $EXPECT($L5, fail, 'TrailingMemberExpressions "."'), $N($EXPECT($R1, fail, "TrailingMemberExpressions /[0-9]/")))), MemberExpressionRest))), function($skip, $loc, $0, $1, $2) {
        return $1.concat($2);
      });
      function TrailingMemberExpressions(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TrailingMemberExpressions", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TrailingMemberExpressions", state, TrailingMemberExpressions$0(state));
          if (state.events)
            state.events.exit?.("TrailingMemberExpressions", state, result, eventData);
          return result;
        } else {
          const result = TrailingMemberExpressions$0(state);
          if (state.events)
            state.events.exit?.("TrailingMemberExpressions", state, result, eventData);
          return result;
        }
      }
      var AllowedTrailingMemberExpressions$0 = $T($S(TrailingMemberPropertyAllowed, TrailingMemberExpressions), function(value) {
        return value[1];
      });
      var AllowedTrailingMemberExpressions$1 = $Q(MemberExpressionRest);
      function AllowedTrailingMemberExpressions(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AllowedTrailingMemberExpressions", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AllowedTrailingMemberExpressions", state, AllowedTrailingMemberExpressions$0(state) || AllowedTrailingMemberExpressions$1(state));
          if (state.events)
            state.events.exit?.("AllowedTrailingMemberExpressions", state, result, eventData);
          return result;
        } else {
          const result = AllowedTrailingMemberExpressions$0(state) || AllowedTrailingMemberExpressions$1(state);
          if (state.events)
            state.events.exit?.("AllowedTrailingMemberExpressions", state, result, eventData);
          return result;
        }
      }
      var CommaDelimiter$0 = $S($E($C(Samedent, IndentedFurther)), $Q(_), Comma);
      function CommaDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CommaDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CommaDelimiter", state, CommaDelimiter$0(state));
          if (state.events)
            state.events.exit?.("CommaDelimiter", state, result, eventData);
          return result;
        } else {
          const result = CommaDelimiter$0(state);
          if (state.events)
            state.events.exit?.("CommaDelimiter", state, result, eventData);
          return result;
        }
      }
      var ArgumentList$0 = $S(ArgumentPart, $P($S(CommaDelimiter, $C(NestedImplicitObjectLiteral, NestedArgumentList))));
      var ArgumentList$1 = $TS($S(NestedImplicitObjectLiteral), function($skip, $loc, $0, $1) {
        return insertTrimmingSpace($1, "");
      });
      var ArgumentList$2 = NestedArgumentList;
      var ArgumentList$3 = $TS($S($E(_), ArgumentPart, $Q($S(CommaDelimiter, $E(_), ArgumentPart))), function($skip, $loc, $0, $1, $2, $3) {
        return [...$1 || [], $2, ...$3];
      });
      function ArgumentList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArgumentList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArgumentList", state, ArgumentList$0(state) || ArgumentList$1(state) || ArgumentList$2(state) || ArgumentList$3(state));
          if (state.events)
            state.events.exit?.("ArgumentList", state, result, eventData);
          return result;
        } else {
          const result = ArgumentList$0(state) || ArgumentList$1(state) || ArgumentList$2(state) || ArgumentList$3(state);
          if (state.events)
            state.events.exit?.("ArgumentList", state, result, eventData);
          return result;
        }
      }
      var NonPipelineArgumentList$0 = $S(NonPipelineArgumentPart, $P($S(CommaDelimiter, $C(NestedImplicitObjectLiteral, NestedArgumentList))));
      var NonPipelineArgumentList$1 = $TS($S(NestedImplicitObjectLiteral), function($skip, $loc, $0, $1) {
        return insertTrimmingSpace($1, "");
      });
      var NonPipelineArgumentList$2 = NestedArgumentList;
      var NonPipelineArgumentList$3 = $TS($S($E(_), NonPipelineArgumentPart, $Q($S(CommaDelimiter, $E(_), NonPipelineArgumentPart))), function($skip, $loc, $0, $1, $2, $3) {
        return [...$1 || [], $2, ...$3];
      });
      function NonPipelineArgumentList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonPipelineArgumentList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonPipelineArgumentList", state, NonPipelineArgumentList$0(state) || NonPipelineArgumentList$1(state) || NonPipelineArgumentList$2(state) || NonPipelineArgumentList$3(state));
          if (state.events)
            state.events.exit?.("NonPipelineArgumentList", state, result, eventData);
          return result;
        } else {
          const result = NonPipelineArgumentList$0(state) || NonPipelineArgumentList$1(state) || NonPipelineArgumentList$2(state) || NonPipelineArgumentList$3(state);
          if (state.events)
            state.events.exit?.("NonPipelineArgumentList", state, result, eventData);
          return result;
        }
      }
      var NestedArgumentList$0 = $TS($S(PushIndent, $Q(NestedArgument), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var args = $2;
        if (args.length)
          return args;
        return $skip;
      });
      function NestedArgumentList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedArgumentList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedArgumentList", state, NestedArgumentList$0(state));
          if (state.events)
            state.events.exit?.("NestedArgumentList", state, result, eventData);
          return result;
        } else {
          const result = NestedArgumentList$0(state);
          if (state.events)
            state.events.exit?.("NestedArgumentList", state, result, eventData);
          return result;
        }
      }
      var NestedArgument$0 = $S(Nested, SingleLineArgumentExpressions, ParameterElementDelimiter);
      function NestedArgument(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedArgument", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedArgument", state, NestedArgument$0(state));
          if (state.events)
            state.events.exit?.("NestedArgument", state, result, eventData);
          return result;
        } else {
          const result = NestedArgument$0(state);
          if (state.events)
            state.events.exit?.("NestedArgument", state, result, eventData);
          return result;
        }
      }
      var SingleLineArgumentExpressions$0 = $S($E(_), ArgumentPart, $Q($S($E(_), Comma, $E(_), ArgumentPart)));
      function SingleLineArgumentExpressions(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SingleLineArgumentExpressions", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SingleLineArgumentExpressions", state, SingleLineArgumentExpressions$0(state));
          if (state.events)
            state.events.exit?.("SingleLineArgumentExpressions", state, result, eventData);
          return result;
        } else {
          const result = SingleLineArgumentExpressions$0(state);
          if (state.events)
            state.events.exit?.("SingleLineArgumentExpressions", state, result, eventData);
          return result;
        }
      }
      var ArgumentPart$0 = $S(DotDotDot, ExtendedExpression);
      var ArgumentPart$1 = $TS($S(ExtendedExpression, $E(DotDotDot)), function($skip, $loc, $0, $1, $2) {
        if ($2) {
          return [$2, $1];
        }
        return $1;
      });
      function ArgumentPart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArgumentPart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArgumentPart", state, ArgumentPart$0(state) || ArgumentPart$1(state));
          if (state.events)
            state.events.exit?.("ArgumentPart", state, result, eventData);
          return result;
        } else {
          const result = ArgumentPart$0(state) || ArgumentPart$1(state);
          if (state.events)
            state.events.exit?.("ArgumentPart", state, result, eventData);
          return result;
        }
      }
      var NonPipelineArgumentPart$0 = $S(DotDotDot, NonPipelineExtendedExpression);
      var NonPipelineArgumentPart$1 = $TS($S(NonPipelineExtendedExpression, $E(DotDotDot)), function($skip, $loc, $0, $1, $2) {
        if ($2) {
          return [$2, $1];
        }
        return $1;
      });
      function NonPipelineArgumentPart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonPipelineArgumentPart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonPipelineArgumentPart", state, NonPipelineArgumentPart$0(state) || NonPipelineArgumentPart$1(state));
          if (state.events)
            state.events.exit?.("NonPipelineArgumentPart", state, result, eventData);
          return result;
        } else {
          const result = NonPipelineArgumentPart$0(state) || NonPipelineArgumentPart$1(state);
          if (state.events)
            state.events.exit?.("NonPipelineArgumentPart", state, result, eventData);
          return result;
        }
      }
      var BinaryOpExpression$0 = $TS($S(UnaryExpression, $Q(BinaryOpRHS)), function($skip, $loc, $0, $1, $2) {
        if ($2.length)
          return processBinaryOpExpression($0);
        return $1;
      });
      function BinaryOpExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BinaryOpExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BinaryOpExpression", state, BinaryOpExpression$0(state));
          if (state.events)
            state.events.exit?.("BinaryOpExpression", state, result, eventData);
          return result;
        } else {
          const result = BinaryOpExpression$0(state);
          if (state.events)
            state.events.exit?.("BinaryOpExpression", state, result, eventData);
          return result;
        }
      }
      var BinaryOpRHS$0 = $TS($S(BinaryOp, RHS), function($skip, $loc, $0, $1, $2) {
        var op = $1;
        var rhs = $2;
        return [[], op, [], rhs];
      });
      var BinaryOpRHS$1 = $T($S(NewlineBinaryOpAllowed, $S(NotDedented, BinaryOp, $C(_, $S(EOS, __)), RHS)), function(value) {
        var rhs = value[1];
        return rhs;
      });
      var BinaryOpRHS$2 = $T($S($N(NewlineBinaryOpAllowed), SingleLineBinaryOpRHS), function(value) {
        return value[1];
      });
      function BinaryOpRHS(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BinaryOpRHS", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BinaryOpRHS", state, BinaryOpRHS$0(state) || BinaryOpRHS$1(state) || BinaryOpRHS$2(state));
          if (state.events)
            state.events.exit?.("BinaryOpRHS", state, result, eventData);
          return result;
        } else {
          const result = BinaryOpRHS$0(state) || BinaryOpRHS$1(state) || BinaryOpRHS$2(state);
          if (state.events)
            state.events.exit?.("BinaryOpRHS", state, result, eventData);
          return result;
        }
      }
      var SingleLineBinaryOpRHS$0 = $TS($S($E(_), BinaryOp, $C(_, $S(EOS, __)), RHS), function($skip, $loc, $0, $1, $2, $3, $4) {
        var ws1 = $1;
        var op = $2;
        var ws2 = $3;
        var rhs = $4;
        return [ws1 || [], op, ws2, rhs];
      });
      function SingleLineBinaryOpRHS(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SingleLineBinaryOpRHS", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SingleLineBinaryOpRHS", state, SingleLineBinaryOpRHS$0(state));
          if (state.events)
            state.events.exit?.("SingleLineBinaryOpRHS", state, result, eventData);
          return result;
        } else {
          const result = SingleLineBinaryOpRHS$0(state);
          if (state.events)
            state.events.exit?.("SingleLineBinaryOpRHS", state, result, eventData);
          return result;
        }
      }
      var RHS$0 = ParenthesizedAssignment;
      var RHS$1 = UnaryExpression;
      var RHS$2 = ExpressionizedStatement;
      function RHS(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RHS", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RHS", state, RHS$0(state) || RHS$1(state) || RHS$2(state));
          if (state.events)
            state.events.exit?.("RHS", state, result, eventData);
          return result;
        } else {
          const result = RHS$0(state) || RHS$1(state) || RHS$2(state);
          if (state.events)
            state.events.exit?.("RHS", state, result, eventData);
          return result;
        }
      }
      var ParenthesizedAssignment$0 = $S(InsertOpenParen, ActualAssignment, InsertCloseParen);
      function ParenthesizedAssignment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ParenthesizedAssignment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ParenthesizedAssignment", state, ParenthesizedAssignment$0(state));
          if (state.events)
            state.events.exit?.("ParenthesizedAssignment", state, result, eventData);
          return result;
        } else {
          const result = ParenthesizedAssignment$0(state);
          if (state.events)
            state.events.exit?.("ParenthesizedAssignment", state, result, eventData);
          return result;
        }
      }
      var UnaryExpression$0 = $TS($S($Q(UnaryOp), $C(UpdateExpression, NestedNonAssignmentExtendedExpression), $E(UnaryPostfix)), function($skip, $loc, $0, $1, $2, $3) {
        var pre = $1;
        var exp = $2;
        var post = $3;
        return processUnaryExpression(pre, exp, post);
      });
      var UnaryExpression$1 = $TS($S(CoffeeDoEnabled, Do, __, $C($S(LeftHandSideExpression, $N($S(__, AssignmentOpSymbol))), ArrowFunction, ExtendedExpression)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var ws = $3;
        var exp = $4;
        ws = insertTrimmingSpace(ws, "");
        return ["(", ...ws, exp, ")()"];
      });
      function UnaryExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UnaryExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UnaryExpression", state, UnaryExpression$0(state) || UnaryExpression$1(state));
          if (state.events)
            state.events.exit?.("UnaryExpression", state, result, eventData);
          return result;
        } else {
          const result = UnaryExpression$0(state) || UnaryExpression$1(state);
          if (state.events)
            state.events.exit?.("UnaryExpression", state, result, eventData);
          return result;
        }
      }
      var UnaryPostfix$0 = QuestionMark;
      var UnaryPostfix$1 = $T($P($S(__, As, Type)), function(value) {
        return { "ts": true, "children": value };
      });
      var UnaryPostfix$2 = $T($P($S(__, Satisfies, Type)), function(value) {
        return { "ts": true, "children": value };
      });
      function UnaryPostfix(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UnaryPostfix", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UnaryPostfix", state, UnaryPostfix$0(state) || UnaryPostfix$1(state) || UnaryPostfix$2(state));
          if (state.events)
            state.events.exit?.("UnaryPostfix", state, result, eventData);
          return result;
        } else {
          const result = UnaryPostfix$0(state) || UnaryPostfix$1(state) || UnaryPostfix$2(state);
          if (state.events)
            state.events.exit?.("UnaryPostfix", state, result, eventData);
          return result;
        }
      }
      var UpdateExpression$0 = $TS($S(UpdateExpressionSymbol, UnaryExpression), function($skip, $loc, $0, $1, $2) {
        return {
          type: "UpdateExpression",
          assigned: $2,
          children: $0
        };
      });
      var UpdateExpression$1 = $TS($S(LeftHandSideExpression, $E(UpdateExpressionSymbol)), function($skip, $loc, $0, $1, $2) {
        if (!$2)
          return $1;
        return {
          type: "UpdateExpression",
          assigned: $1,
          children: $0
        };
      });
      function UpdateExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UpdateExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UpdateExpression", state, UpdateExpression$0(state) || UpdateExpression$1(state));
          if (state.events)
            state.events.exit?.("UpdateExpression", state, result, eventData);
          return result;
        } else {
          const result = UpdateExpression$0(state) || UpdateExpression$1(state);
          if (state.events)
            state.events.exit?.("UpdateExpression", state, result, eventData);
          return result;
        }
      }
      var UpdateExpressionSymbol$0 = $TV($C($EXPECT($L6, fail, 'UpdateExpressionSymbol "++"'), $EXPECT($L7, fail, 'UpdateExpressionSymbol "--"')), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function UpdateExpressionSymbol(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UpdateExpressionSymbol", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UpdateExpressionSymbol", state, UpdateExpressionSymbol$0(state));
          if (state.events)
            state.events.exit?.("UpdateExpressionSymbol", state, result, eventData);
          return result;
        } else {
          const result = UpdateExpressionSymbol$0(state);
          if (state.events)
            state.events.exit?.("UpdateExpressionSymbol", state, result, eventData);
          return result;
        }
      }
      var AssignmentExpression$0 = PipelineExpression;
      var AssignmentExpression$1 = SingleLineAssignmentExpression;
      var AssignmentExpression$2 = $S(__, AssignmentExpressionTail);
      function AssignmentExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AssignmentExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AssignmentExpression", state, AssignmentExpression$0(state) || AssignmentExpression$1(state) || AssignmentExpression$2(state));
          if (state.events)
            state.events.exit?.("AssignmentExpression", state, result, eventData);
          return result;
        } else {
          const result = AssignmentExpression$0(state) || AssignmentExpression$1(state) || AssignmentExpression$2(state);
          if (state.events)
            state.events.exit?.("AssignmentExpression", state, result, eventData);
          return result;
        }
      }
      var NonPipelineAssignmentExpression$0 = SingleLineAssignmentExpression;
      var NonPipelineAssignmentExpression$1 = $S(__, AssignmentExpressionTail);
      function NonPipelineAssignmentExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonPipelineAssignmentExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonPipelineAssignmentExpression", state, NonPipelineAssignmentExpression$0(state) || NonPipelineAssignmentExpression$1(state));
          if (state.events)
            state.events.exit?.("NonPipelineAssignmentExpression", state, result, eventData);
          return result;
        } else {
          const result = NonPipelineAssignmentExpression$0(state) || NonPipelineAssignmentExpression$1(state);
          if (state.events)
            state.events.exit?.("NonPipelineAssignmentExpression", state, result, eventData);
          return result;
        }
      }
      var SingleLineAssignmentExpression$0 = $TS($S($E(_), AssignmentExpressionTail), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        var tail = $2;
        if (ws?.length) {
          if (tail.children && tail.type !== "IterationExpression") {
            return {
              ...tail,
              children: [...ws, ...tail.children]
            };
          }
          return $0;
        }
        return tail;
      });
      function SingleLineAssignmentExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SingleLineAssignmentExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SingleLineAssignmentExpression", state, SingleLineAssignmentExpression$0(state));
          if (state.events)
            state.events.exit?.("SingleLineAssignmentExpression", state, result, eventData);
          return result;
        } else {
          const result = SingleLineAssignmentExpression$0(state);
          if (state.events)
            state.events.exit?.("SingleLineAssignmentExpression", state, result, eventData);
          return result;
        }
      }
      var AssignmentExpressionTail$0 = YieldExpression;
      var AssignmentExpressionTail$1 = ArrowFunction;
      var AssignmentExpressionTail$2 = ActualAssignment;
      var AssignmentExpressionTail$3 = ConditionalExpression;
      function AssignmentExpressionTail(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AssignmentExpressionTail", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AssignmentExpressionTail", state, AssignmentExpressionTail$0(state) || AssignmentExpressionTail$1(state) || AssignmentExpressionTail$2(state) || AssignmentExpressionTail$3(state));
          if (state.events)
            state.events.exit?.("AssignmentExpressionTail", state, result, eventData);
          return result;
        } else {
          const result = AssignmentExpressionTail$0(state) || AssignmentExpressionTail$1(state) || AssignmentExpressionTail$2(state) || AssignmentExpressionTail$3(state);
          if (state.events)
            state.events.exit?.("AssignmentExpressionTail", state, result, eventData);
          return result;
        }
      }
      var ActualAssignment$0 = $TS($S($P($S(__, UpdateExpression, WAssignmentOp)), ExtendedExpression), function($skip, $loc, $0, $1, $2) {
        $1 = $1.map((x) => [x[0], x[1], ...x[2]]);
        $0 = [$1, $2];
        return {
          type: "AssignmentExpression",
          children: $0,
          names: null,
          lhs: $1,
          assigned: $1[0][1],
          exp: $2
        };
      });
      function ActualAssignment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ActualAssignment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ActualAssignment", state, ActualAssignment$0(state));
          if (state.events)
            state.events.exit?.("ActualAssignment", state, result, eventData);
          return result;
        } else {
          const result = ActualAssignment$0(state);
          if (state.events)
            state.events.exit?.("ActualAssignment", state, result, eventData);
          return result;
        }
      }
      var YieldExpression$0 = $S(Yield, YieldTail);
      function YieldExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("YieldExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("YieldExpression", state, YieldExpression$0(state));
          if (state.events)
            state.events.exit?.("YieldExpression", state, result, eventData);
          return result;
        } else {
          const result = YieldExpression$0(state);
          if (state.events)
            state.events.exit?.("YieldExpression", state, result, eventData);
          return result;
        }
      }
      var YieldTail$0 = $Y(EOS);
      var YieldTail$1 = $S($E($S($E(_), Star)), AssignmentExpression);
      function YieldTail(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("YieldTail", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("YieldTail", state, YieldTail$0(state) || YieldTail$1(state));
          if (state.events)
            state.events.exit?.("YieldTail", state, result, eventData);
          return result;
        } else {
          const result = YieldTail$0(state) || YieldTail$1(state);
          if (state.events)
            state.events.exit?.("YieldTail", state, result, eventData);
          return result;
        }
      }
      var ArrowFunction$0 = ThinArrowFunction;
      var ArrowFunction$1 = $TS($S($E($S(Async, _)), Parameters, $E(ReturnTypeSuffix), FatArrow, FatArrowBody), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var async = $1;
        var parameters = $2;
        var suffix = $3;
        var expOrBlock = $5;
        if (hasAwait(expOrBlock) && !async) {
          async = "async ";
        }
        let error;
        if (hasYield(expOrBlock)) {
          error = {
            type: "Error",
            message: "Can't use yield inside of => arrow function"
          };
        }
        return {
          type: "ArrowFunction",
          parameters,
          returnType: suffix,
          ts: false,
          async,
          block: expOrBlock,
          children: [async, $0.slice(1), error]
        };
      });
      function ArrowFunction(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArrowFunction", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArrowFunction", state, ArrowFunction$0(state) || ArrowFunction$1(state));
          if (state.events)
            state.events.exit?.("ArrowFunction", state, result, eventData);
          return result;
        } else {
          const result = ArrowFunction$0(state) || ArrowFunction$1(state);
          if (state.events)
            state.events.exit?.("ArrowFunction", state, result, eventData);
          return result;
        }
      }
      var FatArrow$0 = $TS($S($E(_), $C($EXPECT($L8, fail, 'FatArrow "=>"'), $EXPECT($L9, fail, 'FatArrow "\u21D2"'))), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        if (!ws)
          return " =>";
        return [$1, "=>"];
      });
      function FatArrow(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FatArrow", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FatArrow", state, FatArrow$0(state));
          if (state.events)
            state.events.exit?.("FatArrow", state, result, eventData);
          return result;
        } else {
          const result = FatArrow$0(state);
          if (state.events)
            state.events.exit?.("FatArrow", state, result, eventData);
          return result;
        }
      }
      var FatArrowBody$0 = $T($S($N(EOS), NonPipelinePostfixedExpression, $N(SemicolonDelimiter)), function(value) {
        var exp = value[1];
        return exp;
      });
      var FatArrowBody$1 = BracedOrEmptyBlock;
      function FatArrowBody(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FatArrowBody", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FatArrowBody", state, FatArrowBody$0(state) || FatArrowBody$1(state));
          if (state.events)
            state.events.exit?.("FatArrowBody", state, result, eventData);
          return result;
        } else {
          const result = FatArrowBody$0(state) || FatArrowBody$1(state);
          if (state.events)
            state.events.exit?.("FatArrowBody", state, result, eventData);
          return result;
        }
      }
      var ConditionalExpression$0 = $TS($S(ShortCircuitExpression, $E(TernaryRest)), function($skip, $loc, $0, $1, $2) {
        if ($2) {
          return [$1, ...$2];
        }
        return $1;
      });
      function ConditionalExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ConditionalExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ConditionalExpression", state, ConditionalExpression$0(state));
          if (state.events)
            state.events.exit?.("ConditionalExpression", state, result, eventData);
          return result;
        } else {
          const result = ConditionalExpression$0(state);
          if (state.events)
            state.events.exit?.("ConditionalExpression", state, result, eventData);
          return result;
        }
      }
      var TernaryRest$0 = NestedTernaryRest;
      var TernaryRest$1 = $TS($S($N(CoffeeBinaryExistentialEnabled), $Y($EXPECT($L10, fail, 'TernaryRest " "')), $E(_), QuestionMark, ExtendedExpression, __, Colon, ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8) {
        return $0.slice(2);
      });
      function TernaryRest(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TernaryRest", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TernaryRest", state, TernaryRest$0(state) || TernaryRest$1(state));
          if (state.events)
            state.events.exit?.("TernaryRest", state, result, eventData);
          return result;
        } else {
          const result = TernaryRest$0(state) || TernaryRest$1(state);
          if (state.events)
            state.events.exit?.("TernaryRest", state, result, eventData);
          return result;
        }
      }
      var NestedTernaryRest$0 = $TS($S(PushIndent, $E($S(Nested, QuestionMark, ExtendedExpression, Nested, Colon, ExtendedExpression)), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        if ($2)
          return $2;
        return $skip;
      });
      function NestedTernaryRest(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedTernaryRest", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedTernaryRest", state, NestedTernaryRest$0(state));
          if (state.events)
            state.events.exit?.("NestedTernaryRest", state, result, eventData);
          return result;
        } else {
          const result = NestedTernaryRest$0(state);
          if (state.events)
            state.events.exit?.("NestedTernaryRest", state, result, eventData);
          return result;
        }
      }
      var ShortCircuitExpression$0 = BinaryOpExpression;
      function ShortCircuitExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ShortCircuitExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ShortCircuitExpression", state, ShortCircuitExpression$0(state));
          if (state.events)
            state.events.exit?.("ShortCircuitExpression", state, result, eventData);
          return result;
        } else {
          const result = ShortCircuitExpression$0(state);
          if (state.events)
            state.events.exit?.("ShortCircuitExpression", state, result, eventData);
          return result;
        }
      }
      var PipelineExpression$0 = $TS($S($E(_), PipelineHeadItem, $P($S(NotDedented, Pipe, __, PipelineTailItem))), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var head = $2;
        var body = $3;
        if (head.token === "&") {
          const ref = {
            type: "Ref",
            base: "$"
          };
          const arrowBody = {
            type: "PipelineExpression",
            children: [ws, ref, body]
          };
          return {
            type: "ArrowFunction",
            children: [ref, " => ", arrowBody],
            ref,
            body: [arrowBody],
            ampersandBlock: true
          };
        }
        return {
          type: "PipelineExpression",
          children: [ws, head, body]
        };
      });
      function PipelineExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PipelineExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PipelineExpression", state, PipelineExpression$0(state));
          if (state.events)
            state.events.exit?.("PipelineExpression", state, result, eventData);
          return result;
        } else {
          const result = PipelineExpression$0(state);
          if (state.events)
            state.events.exit?.("PipelineExpression", state, result, eventData);
          return result;
        }
      }
      var PipelineHeadItem$0 = NonPipelineExtendedExpression;
      var PipelineHeadItem$1 = ParenthesizedExpression;
      var PipelineHeadItem$2 = Ampersand;
      function PipelineHeadItem(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PipelineHeadItem", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PipelineHeadItem", state, PipelineHeadItem$0(state) || PipelineHeadItem$1(state) || PipelineHeadItem$2(state));
          if (state.events)
            state.events.exit?.("PipelineHeadItem", state, result, eventData);
          return result;
        } else {
          const result = PipelineHeadItem$0(state) || PipelineHeadItem$1(state) || PipelineHeadItem$2(state);
          if (state.events)
            state.events.exit?.("PipelineHeadItem", state, result, eventData);
          return result;
        }
      }
      var PipelineTailItem$0 = Await;
      var PipelineTailItem$1 = Yield;
      var PipelineTailItem$2 = Return;
      var PipelineTailItem$3 = AmpersandFunctionExpression;
      var PipelineTailItem$4 = $T($S($N(Ampersand), PipelineHeadItem), function(value) {
        return value[1];
      });
      function PipelineTailItem(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PipelineTailItem", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PipelineTailItem", state, PipelineTailItem$0(state) || PipelineTailItem$1(state) || PipelineTailItem$2(state) || PipelineTailItem$3(state) || PipelineTailItem$4(state));
          if (state.events)
            state.events.exit?.("PipelineTailItem", state, result, eventData);
          return result;
        } else {
          const result = PipelineTailItem$0(state) || PipelineTailItem$1(state) || PipelineTailItem$2(state) || PipelineTailItem$3(state) || PipelineTailItem$4(state);
          if (state.events)
            state.events.exit?.("PipelineTailItem", state, result, eventData);
          return result;
        }
      }
      var PrimaryExpression$0 = ObjectLiteral;
      var PrimaryExpression$1 = ThisLiteral;
      var PrimaryExpression$2 = TemplateLiteral;
      var PrimaryExpression$3 = Literal;
      var PrimaryExpression$4 = ArrayLiteral;
      var PrimaryExpression$5 = IdentifierReference;
      var PrimaryExpression$6 = FunctionExpression;
      var PrimaryExpression$7 = ClassExpression;
      var PrimaryExpression$8 = RegularExpressionLiteral;
      var PrimaryExpression$9 = ParenthesizedExpression;
      var PrimaryExpression$10 = JSXImplicitFragment;
      function PrimaryExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PrimaryExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PrimaryExpression", state, PrimaryExpression$0(state) || PrimaryExpression$1(state) || PrimaryExpression$2(state) || PrimaryExpression$3(state) || PrimaryExpression$4(state) || PrimaryExpression$5(state) || PrimaryExpression$6(state) || PrimaryExpression$7(state) || PrimaryExpression$8(state) || PrimaryExpression$9(state) || PrimaryExpression$10(state));
          if (state.events)
            state.events.exit?.("PrimaryExpression", state, result, eventData);
          return result;
        } else {
          const result = PrimaryExpression$0(state) || PrimaryExpression$1(state) || PrimaryExpression$2(state) || PrimaryExpression$3(state) || PrimaryExpression$4(state) || PrimaryExpression$5(state) || PrimaryExpression$6(state) || PrimaryExpression$7(state) || PrimaryExpression$8(state) || PrimaryExpression$9(state) || PrimaryExpression$10(state);
          if (state.events)
            state.events.exit?.("PrimaryExpression", state, result, eventData);
          return result;
        }
      }
      var ParenthesizedExpression$0 = $TS($S(OpenParen, AllowAll, $E($S(PostfixedExpression, __, CloseParen)), RestoreAll), function($skip, $loc, $0, $1, $2, $3, $4) {
        var open = $1;
        if (!$3)
          return $skip;
        const [exp, ws, close] = $3;
        switch (exp.type) {
          case "IterationExpression":
            return exp;
        }
        return {
          type: "ParenthesizedExpression",
          children: [open, exp, ws, close],
          expression: exp
        };
      });
      function ParenthesizedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ParenthesizedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ParenthesizedExpression", state, ParenthesizedExpression$0(state));
          if (state.events)
            state.events.exit?.("ParenthesizedExpression", state, result, eventData);
          return result;
        } else {
          const result = ParenthesizedExpression$0(state);
          if (state.events)
            state.events.exit?.("ParenthesizedExpression", state, result, eventData);
          return result;
        }
      }
      var ClassDeclaration$0 = ClassExpression;
      function ClassDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassDeclaration", state, ClassDeclaration$0(state));
          if (state.events)
            state.events.exit?.("ClassDeclaration", state, result, eventData);
          return result;
        } else {
          const result = ClassDeclaration$0(state);
          if (state.events)
            state.events.exit?.("ClassDeclaration", state, result, eventData);
          return result;
        }
      }
      var ClassExpression$0 = $S($E(Decorators), $E($S(Abstract, __)), Class, $N($EXPECT($L11, fail, 'ClassExpression ":"')), $E(ClassBinding), $E(ClassHeritage), ClassBody);
      function ClassExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassExpression", state, ClassExpression$0(state));
          if (state.events)
            state.events.exit?.("ClassExpression", state, result, eventData);
          return result;
        } else {
          const result = ClassExpression$0(state);
          if (state.events)
            state.events.exit?.("ClassExpression", state, result, eventData);
          return result;
        }
      }
      var ClassBinding$0 = $T($S($N(EOS), BindingIdentifier, $E(TypeParameters)), function(value) {
        return [value[1], value[2]];
      });
      function ClassBinding(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassBinding", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassBinding", state, ClassBinding$0(state));
          if (state.events)
            state.events.exit?.("ClassBinding", state, result, eventData);
          return result;
        } else {
          const result = ClassBinding$0(state);
          if (state.events)
            state.events.exit?.("ClassBinding", state, result, eventData);
          return result;
        }
      }
      var ClassHeritage$0 = $S(ExtendsClause, $E(ImplementsClause));
      var ClassHeritage$1 = ImplementsClause;
      function ClassHeritage(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassHeritage", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassHeritage", state, ClassHeritage$0(state) || ClassHeritage$1(state));
          if (state.events)
            state.events.exit?.("ClassHeritage", state, result, eventData);
          return result;
        } else {
          const result = ClassHeritage$0(state) || ClassHeritage$1(state);
          if (state.events)
            state.events.exit?.("ClassHeritage", state, result, eventData);
          return result;
        }
      }
      var ExtendsClause$0 = $S(ExtendsToken, __, ExtendsTarget);
      function ExtendsClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExtendsClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExtendsClause", state, ExtendsClause$0(state));
          if (state.events)
            state.events.exit?.("ExtendsClause", state, result, eventData);
          return result;
        } else {
          const result = ExtendsClause$0(state);
          if (state.events)
            state.events.exit?.("ExtendsClause", state, result, eventData);
          return result;
        }
      }
      var ExtendsToken$0 = $TS($S(Loc, __, OpenAngleBracket, $E($EXPECT($L10, fail, 'ExtendsToken " "'))), function($skip, $loc, $0, $1, $2, $3, $4) {
        var l = $1;
        var ws = $2;
        var lt = $3;
        const children = [
          ...ws,
          { ...lt, token: "extends " }
        ];
        if (!ws.length) {
          children.unshift({ $loc: l.$loc, token: " " });
        }
        return { children };
      });
      var ExtendsToken$1 = $S(__, Extends);
      function ExtendsToken(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExtendsToken", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExtendsToken", state, ExtendsToken$0(state) || ExtendsToken$1(state));
          if (state.events)
            state.events.exit?.("ExtendsToken", state, result, eventData);
          return result;
        } else {
          const result = ExtendsToken$0(state) || ExtendsToken$1(state);
          if (state.events)
            state.events.exit?.("ExtendsToken", state, result, eventData);
          return result;
        }
      }
      var ExtendsTarget$0 = $TS($S(ExpressionWithIndentedApplicationForbidden, $E(TypeArguments)), function($skip, $loc, $0, $1, $2) {
        var exp = $1;
        var ta = $2;
        exp = makeLeftHandSideExpression(exp);
        if (ta)
          return [exp, ta];
        return exp;
      });
      function ExtendsTarget(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExtendsTarget", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExtendsTarget", state, ExtendsTarget$0(state));
          if (state.events)
            state.events.exit?.("ExtendsTarget", state, result, eventData);
          return result;
        } else {
          const result = ExtendsTarget$0(state);
          if (state.events)
            state.events.exit?.("ExtendsTarget", state, result, eventData);
          return result;
        }
      }
      var ImplementsClause$0 = $TS($S(ImplementsToken, ImplementsTarget, $Q($S(Comma, ImplementsTarget))), function($skip, $loc, $0, $1, $2, $3) {
        return {
          ts: true,
          children: $0
        };
      });
      function ImplementsClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplementsClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplementsClause", state, ImplementsClause$0(state));
          if (state.events)
            state.events.exit?.("ImplementsClause", state, result, eventData);
          return result;
        } else {
          const result = ImplementsClause$0(state);
          if (state.events)
            state.events.exit?.("ImplementsClause", state, result, eventData);
          return result;
        }
      }
      var ImplementsToken$0 = $TS($S(Loc, __, ImplementsShorthand, $E($EXPECT($L10, fail, 'ImplementsToken " "'))), function($skip, $loc, $0, $1, $2, $3, $4) {
        var l = $1;
        var ws = $2;
        var token = $3;
        const children = [...ws, token];
        if (!ws.length) {
          children.unshift({ $loc: l.$loc, token: " " });
        }
        return { children };
      });
      var ImplementsToken$1 = $TS($S(__, $EXPECT($L12, fail, 'ImplementsToken "implements"'), NonIdContinue), function($skip, $loc, $0, $1, $2, $3) {
        $2 = { $loc, token: $2 };
        return [$1, $2];
      });
      function ImplementsToken(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplementsToken", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplementsToken", state, ImplementsToken$0(state) || ImplementsToken$1(state));
          if (state.events)
            state.events.exit?.("ImplementsToken", state, result, eventData);
          return result;
        } else {
          const result = ImplementsToken$0(state) || ImplementsToken$1(state);
          if (state.events)
            state.events.exit?.("ImplementsToken", state, result, eventData);
          return result;
        }
      }
      var ImplementsShorthand$0 = $TV($EXPECT($L13, fail, 'ImplementsShorthand "<:"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "implements " };
      });
      function ImplementsShorthand(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplementsShorthand", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplementsShorthand", state, ImplementsShorthand$0(state));
          if (state.events)
            state.events.exit?.("ImplementsShorthand", state, result, eventData);
          return result;
        } else {
          const result = ImplementsShorthand$0(state);
          if (state.events)
            state.events.exit?.("ImplementsShorthand", state, result, eventData);
          return result;
        }
      }
      var ImplementsTarget$0 = $S(__, IdentifierName, $Q($S(Dot, IdentifierName)), $E(TypeArguments));
      function ImplementsTarget(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplementsTarget", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplementsTarget", state, ImplementsTarget$0(state));
          if (state.events)
            state.events.exit?.("ImplementsTarget", state, result, eventData);
          return result;
        } else {
          const result = ImplementsTarget$0(state);
          if (state.events)
            state.events.exit?.("ImplementsTarget", state, result, eventData);
          return result;
        }
      }
      var ClassBody$0 = $TS($S(__, OpenBrace, $E(NestedClassElements), __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var elements = $3;
        return {
          type: "ClassBody",
          children: $0,
          elements
        };
      });
      var ClassBody$1 = $TS($S(InsertOpenBrace, $E(NestedClassElements), InsertNewline, InsertIndent, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var elements = $2;
        return {
          type: "ClassBody",
          children: $0,
          elements
        };
      });
      function ClassBody(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassBody", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassBody", state, ClassBody$0(state) || ClassBody$1(state));
          if (state.events)
            state.events.exit?.("ClassBody", state, result, eventData);
          return result;
        } else {
          const result = ClassBody$0(state) || ClassBody$1(state);
          if (state.events)
            state.events.exit?.("ClassBody", state, result, eventData);
          return result;
        }
      }
      var NestedClassElements$0 = $TS($S(PushIndent, $Q(NestedClassElement), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var elements = $2;
        if (!elements.length)
          return $skip;
        return elements;
      });
      function NestedClassElements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedClassElements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedClassElements", state, NestedClassElements$0(state));
          if (state.events)
            state.events.exit?.("NestedClassElements", state, result, eventData);
          return result;
        } else {
          const result = NestedClassElements$0(state);
          if (state.events)
            state.events.exit?.("NestedClassElements", state, result, eventData);
          return result;
        }
      }
      var NestedClassElement$0 = $S(Nested, ClassElement, StatementDelimiter);
      function NestedClassElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedClassElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedClassElement", state, NestedClassElement$0(state));
          if (state.events)
            state.events.exit?.("NestedClassElement", state, result, eventData);
          return result;
        } else {
          const result = NestedClassElement$0(state);
          if (state.events)
            state.events.exit?.("NestedClassElement", state, result, eventData);
          return result;
        }
      }
      var ClassElement$0 = $TS($S($E(Decorators), $E(AccessModifier), $E($S(Static, $E(_))), ClassElementDefinition), function($skip, $loc, $0, $1, $2, $3, $4) {
        var definition = $4;
        return {
          ...definition,
          children: [$1, $2, $3, ...definition.children]
        };
      });
      var ClassElement$1 = $TS($S(Static, BracedBlock), function($skip, $loc, $0, $1, $2) {
        return {
          type: "ClassStaticBlock",
          children: $0
        };
      });
      function ClassElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassElement", state, ClassElement$0(state) || ClassElement$1(state));
          if (state.events)
            state.events.exit?.("ClassElement", state, result, eventData);
          return result;
        } else {
          const result = ClassElement$0(state) || ClassElement$1(state);
          if (state.events)
            state.events.exit?.("ClassElement", state, result, eventData);
          return result;
        }
      }
      var ClassElementDefinition$0 = MethodDefinition;
      var ClassElementDefinition$1 = FieldDefinition;
      function ClassElementDefinition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassElementDefinition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassElementDefinition", state, ClassElementDefinition$0(state) || ClassElementDefinition$1(state));
          if (state.events)
            state.events.exit?.("ClassElementDefinition", state, result, eventData);
          return result;
        } else {
          const result = ClassElementDefinition$0(state) || ClassElementDefinition$1(state);
          if (state.events)
            state.events.exit?.("ClassElementDefinition", state, result, eventData);
          return result;
        }
      }
      var ClassSignature$0 = $S($E(Decorators), $E($S(Abstract, __)), Class, $E(ClassBinding), $E(ClassHeritage), ClassSignatureBody);
      function ClassSignature(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassSignature", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassSignature", state, ClassSignature$0(state));
          if (state.events)
            state.events.exit?.("ClassSignature", state, result, eventData);
          return result;
        } else {
          const result = ClassSignature$0(state);
          if (state.events)
            state.events.exit?.("ClassSignature", state, result, eventData);
          return result;
        }
      }
      var ClassSignatureBody$0 = $S(__, OpenBrace, $E(NestedClassSignatureElements), __, CloseBrace);
      var ClassSignatureBody$1 = $S(InsertOpenBrace, $E(NestedClassSignatureElements), InsertNewline, InsertIndent, InsertCloseBrace);
      function ClassSignatureBody(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassSignatureBody", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassSignatureBody", state, ClassSignatureBody$0(state) || ClassSignatureBody$1(state));
          if (state.events)
            state.events.exit?.("ClassSignatureBody", state, result, eventData);
          return result;
        } else {
          const result = ClassSignatureBody$0(state) || ClassSignatureBody$1(state);
          if (state.events)
            state.events.exit?.("ClassSignatureBody", state, result, eventData);
          return result;
        }
      }
      var NestedClassSignatureElements$0 = $TS($S(PushIndent, $Q(NestedClassSignatureElement), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var elements = $2;
        if (!elements.length)
          return $skip;
        return elements;
      });
      function NestedClassSignatureElements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedClassSignatureElements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedClassSignatureElements", state, NestedClassSignatureElements$0(state));
          if (state.events)
            state.events.exit?.("NestedClassSignatureElements", state, result, eventData);
          return result;
        } else {
          const result = NestedClassSignatureElements$0(state);
          if (state.events)
            state.events.exit?.("NestedClassSignatureElements", state, result, eventData);
          return result;
        }
      }
      var NestedClassSignatureElement$0 = $S(Nested, ClassSignatureElement, StatementDelimiter);
      function NestedClassSignatureElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedClassSignatureElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedClassSignatureElement", state, NestedClassSignatureElement$0(state));
          if (state.events)
            state.events.exit?.("NestedClassSignatureElement", state, result, eventData);
          return result;
        } else {
          const result = NestedClassSignatureElement$0(state);
          if (state.events)
            state.events.exit?.("NestedClassSignatureElement", state, result, eventData);
          return result;
        }
      }
      var ClassSignatureElement$0 = $S($E(Decorators), $E(AccessModifier), $E($S(Static, $E(_))), $C(MethodSignature, FieldDefinition));
      var ClassSignatureElement$1 = $S(Static, ClassSignatureBody);
      function ClassSignatureElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassSignatureElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassSignatureElement", state, ClassSignatureElement$0(state) || ClassSignatureElement$1(state));
          if (state.events)
            state.events.exit?.("ClassSignatureElement", state, result, eventData);
          return result;
        } else {
          const result = ClassSignatureElement$0(state) || ClassSignatureElement$1(state);
          if (state.events)
            state.events.exit?.("ClassSignatureElement", state, result, eventData);
          return result;
        }
      }
      var AccessModifier$0 = $TS($S($E($S($C(Public, Private, Protected), NotDedented)), $E($S(Readonly, NotDedented))), function($skip, $loc, $0, $1, $2) {
        if (!($1 || $2))
          return $skip;
        return {
          ts: true,
          children: $0
        };
      });
      function AccessModifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AccessModifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AccessModifier", state, AccessModifier$0(state));
          if (state.events)
            state.events.exit?.("AccessModifier", state, result, eventData);
          return result;
        } else {
          const result = AccessModifier$0(state);
          if (state.events)
            state.events.exit?.("AccessModifier", state, result, eventData);
          return result;
        }
      }
      var FieldDefinition$0 = $TS($S(CoffeeClassesEnabled, ClassElementName, $E(_), Colon, __, AssignmentExpression), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        var id = $2;
        var exp = $6;
        switch (exp.type) {
          case "FunctionExpression":
            const fnTokenIndex = exp.children.findIndex((c) => c?.token?.startsWith("function"));
            const children = exp.children.slice();
            if (exp.generator) {
              children.splice(fnTokenIndex, 2, children[fnTokenIndex + 1], id);
            } else {
              children.splice(fnTokenIndex, 1, id);
            }
            return {
              ...exp,
              children
            };
          default:
            return {
              type: "FieldDefinition",
              children: [id, " = ", exp]
            };
        }
      });
      var FieldDefinition$1 = $TS($S(InsertReadonly, ClassElementName, $E(TypeSuffix), __, ConstAssignment, ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        var r = $1;
        var ca = $5;
        r.children[0].$loc = {
          pos: ca.$loc.pos - 1,
          length: ca.$loc.length + 1
        };
        return {
          type: "FieldDefinition",
          children: $0
        };
      });
      var FieldDefinition$2 = $TS($S($E($S(Abstract, $E(_))), $E($S(Readonly, $E(_))), ClassElementName, $E(TypeSuffix), $E(Initializer)), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        if ($1)
          return { children: $0, ts: true };
        return {
          type: "FieldDefinition",
          children: $0
        };
      });
      function FieldDefinition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FieldDefinition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FieldDefinition", state, FieldDefinition$0(state) || FieldDefinition$1(state) || FieldDefinition$2(state));
          if (state.events)
            state.events.exit?.("FieldDefinition", state, result, eventData);
          return result;
        } else {
          const result = FieldDefinition$0(state) || FieldDefinition$1(state) || FieldDefinition$2(state);
          if (state.events)
            state.events.exit?.("FieldDefinition", state, result, eventData);
          return result;
        }
      }
      var ThisLiteral$0 = This;
      var ThisLiteral$1 = $TS($S(AtThis, $TEXT($S($E($EXPECT($L14, fail, 'ThisLiteral "#"')), IdentifierName))), function($skip, $loc, $0, $1, $2) {
        var at = $1;
        var id = $2;
        return [at, ".", id];
      });
      var ThisLiteral$2 = AtThis;
      function ThisLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ThisLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ThisLiteral", state, ThisLiteral$0(state) || ThisLiteral$1(state) || ThisLiteral$2(state));
          if (state.events)
            state.events.exit?.("ThisLiteral", state, result, eventData);
          return result;
        } else {
          const result = ThisLiteral$0(state) || ThisLiteral$1(state) || ThisLiteral$2(state);
          if (state.events)
            state.events.exit?.("ThisLiteral", state, result, eventData);
          return result;
        }
      }
      var AtThis$0 = $TV(At, function($skip, $loc, $0, $1) {
        var at = $0;
        return { ...at, token: "this" };
      });
      function AtThis(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AtThis", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AtThis", state, AtThis$0(state));
          if (state.events)
            state.events.exit?.("AtThis", state, result, eventData);
          return result;
        } else {
          const result = AtThis$0(state);
          if (state.events)
            state.events.exit?.("AtThis", state, result, eventData);
          return result;
        }
      }
      var LeftHandSideExpression$0 = $S($P($S(New, $N($C($EXPECT($L5, fail, 'LeftHandSideExpression "."'), $EXPECT($L11, fail, 'LeftHandSideExpression ":"'))), __)), CallExpression, $E(TypeArguments));
      var LeftHandSideExpression$1 = CallExpression;
      function LeftHandSideExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LeftHandSideExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LeftHandSideExpression", state, LeftHandSideExpression$0(state) || LeftHandSideExpression$1(state));
          if (state.events)
            state.events.exit?.("LeftHandSideExpression", state, result, eventData);
          return result;
        } else {
          const result = LeftHandSideExpression$0(state) || LeftHandSideExpression$1(state);
          if (state.events)
            state.events.exit?.("LeftHandSideExpression", state, result, eventData);
          return result;
        }
      }
      var CallExpression$0 = $TS($S($EXPECT($L15, fail, 'CallExpression "super"'), ArgumentsWithTrailingMemberExpressions, $Q(CallExpressionRest)), function($skip, $loc, $0, $1, $2, $3) {
        var rest = $3;
        return processCallMemberExpression({
          type: "CallExpression",
          children: [$1, ...$2, ...rest.flat()]
        });
      });
      var CallExpression$1 = $TS($S($EXPECT($L16, fail, 'CallExpression "import"'), ArgumentsWithTrailingMemberExpressions, $Q(CallExpressionRest)), function($skip, $loc, $0, $1, $2, $3) {
        var rest = $3;
        return processCallMemberExpression({
          type: "CallExpression",
          children: [$1, ...$2, ...rest.flat()]
        });
      });
      var CallExpression$2 = $TS($S(MemberExpression, AllowedTrailingMemberExpressions, $Q(CallExpressionRest)), function($skip, $loc, $0, $1, $2, $3) {
        var member = $1;
        var trailing = $2;
        var rest = $3;
        if (rest.length || trailing.length) {
          rest = rest.flat();
          return processCallMemberExpression({
            type: "CallExpression",
            children: [member, ...trailing, ...rest]
          });
        }
        return member;
      });
      function CallExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CallExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CallExpression", state, CallExpression$0(state) || CallExpression$1(state) || CallExpression$2(state));
          if (state.events)
            state.events.exit?.("CallExpression", state, result, eventData);
          return result;
        } else {
          const result = CallExpression$0(state) || CallExpression$1(state) || CallExpression$2(state);
          if (state.events)
            state.events.exit?.("CallExpression", state, result, eventData);
          return result;
        }
      }
      var CallExpressionRest$0 = MemberExpressionRest;
      var CallExpressionRest$1 = $TV($C(TemplateLiteral, StringLiteral), function($skip, $loc, $0, $1) {
        if ($1.type === "StringLiteral") {
          return "`" + $1.token.slice(1, -1).replace(/(`|\$\{)/g, "\\$1") + "`";
        }
        return $1;
      });
      var CallExpressionRest$2 = $TS($S($E($C(OptionalShorthand, NonNullAssertion)), ArgumentsWithTrailingMemberExpressions), function($skip, $loc, $0, $1, $2) {
        if (!$1)
          return $2;
        return [$1, ...$2];
      });
      function CallExpressionRest(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CallExpressionRest", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CallExpressionRest", state, CallExpressionRest$0(state) || CallExpressionRest$1(state) || CallExpressionRest$2(state));
          if (state.events)
            state.events.exit?.("CallExpressionRest", state, result, eventData);
          return result;
        } else {
          const result = CallExpressionRest$0(state) || CallExpressionRest$1(state) || CallExpressionRest$2(state);
          if (state.events)
            state.events.exit?.("CallExpressionRest", state, result, eventData);
          return result;
        }
      }
      var OptionalShorthand$0 = $TS($S(QuestionMark, OptionalDot), function($skip, $loc, $0, $1, $2) {
        return {
          type: "Optional",
          children: $0
        };
      });
      function OptionalShorthand(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OptionalShorthand", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OptionalShorthand", state, OptionalShorthand$0(state));
          if (state.events)
            state.events.exit?.("OptionalShorthand", state, result, eventData);
          return result;
        } else {
          const result = OptionalShorthand$0(state);
          if (state.events)
            state.events.exit?.("OptionalShorthand", state, result, eventData);
          return result;
        }
      }
      var OptionalDot$0 = Dot;
      var OptionalDot$1 = InsertDot;
      function OptionalDot(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OptionalDot", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OptionalDot", state, OptionalDot$0(state) || OptionalDot$1(state));
          if (state.events)
            state.events.exit?.("OptionalDot", state, result, eventData);
          return result;
        } else {
          const result = OptionalDot$0(state) || OptionalDot$1(state);
          if (state.events)
            state.events.exit?.("OptionalDot", state, result, eventData);
          return result;
        }
      }
      var NonNullAssertion$0 = $T($S($EXPECT($L17, fail, 'NonNullAssertion "!"'), $N($EXPECT($L18, fail, 'NonNullAssertion "^"'))), function(value) {
        return { "type": "NonNullAssertion", "ts": true, "children": value[0] };
      });
      function NonNullAssertion(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonNullAssertion", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonNullAssertion", state, NonNullAssertion$0(state));
          if (state.events)
            state.events.exit?.("NonNullAssertion", state, result, eventData);
          return result;
        } else {
          const result = NonNullAssertion$0(state);
          if (state.events)
            state.events.exit?.("NonNullAssertion", state, result, eventData);
          return result;
        }
      }
      var MemberExpression$0 = $TS($S($C(PrimaryExpression, SuperProperty, MetaProperty), $Q(MemberExpressionRest)), function($skip, $loc, $0, $1, $2) {
        var rest = $2;
        if (rest.length || Array.isArray($1)) {
          return processCallMemberExpression({
            type: "MemberExpression",
            children: [$1, ...rest].flat()
          });
        }
        return $1;
      });
      function MemberExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MemberExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MemberExpression", state, MemberExpression$0(state));
          if (state.events)
            state.events.exit?.("MemberExpression", state, result, eventData);
          return result;
        } else {
          const result = MemberExpression$0(state);
          if (state.events)
            state.events.exit?.("MemberExpression", state, result, eventData);
          return result;
        }
      }
      var MemberExpressionRest$0 = $TS($S($E($C(OptionalShorthand, NonNullAssertion)), MemberBracketContent), function($skip, $loc, $0, $1, $2) {
        if ($1) {
          if ($1.type === "Optional" && $2.type === "SliceExpression") {
            return [$1.children[0], $2];
          }
          return $0.flat();
        }
        return $2;
      });
      var MemberExpressionRest$1 = PropertyAccess;
      var MemberExpressionRest$2 = PropertyGlob;
      var MemberExpressionRest$3 = PropertyBind;
      var MemberExpressionRest$4 = NonNullAssertion;
      function MemberExpressionRest(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MemberExpressionRest", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MemberExpressionRest", state, MemberExpressionRest$0(state) || MemberExpressionRest$1(state) || MemberExpressionRest$2(state) || MemberExpressionRest$3(state) || MemberExpressionRest$4(state));
          if (state.events)
            state.events.exit?.("MemberExpressionRest", state, result, eventData);
          return result;
        } else {
          const result = MemberExpressionRest$0(state) || MemberExpressionRest$1(state) || MemberExpressionRest$2(state) || MemberExpressionRest$3(state) || MemberExpressionRest$4(state);
          if (state.events)
            state.events.exit?.("MemberExpressionRest", state, result, eventData);
          return result;
        }
      }
      var MemberBracketContent$0 = $TS($S(OpenBracket, $C(SliceParameters, PostfixedExpression), __, CloseBracket), function($skip, $loc, $0, $1, $2, $3, $4) {
        var open = $1;
        var expression = $2;
        var ws = $3;
        var close = $4;
        if (expression.type === "SliceParameters") {
          const { start, end, children } = expression;
          return {
            type: "SliceExpression",
            start,
            end,
            children: [
              { ...open, token: ".slice(" },
              ...children,
              [...ws, { ...close, token: ")" }]
            ]
          };
        }
        return {
          type: "Index",
          children: $0,
          expression
        };
      });
      var MemberBracketContent$1 = $TS($S(Dot, $C(TemplateLiteral, StringLiteral)), function($skip, $loc, $0, $1, $2) {
        var dot = $1;
        var str = $2;
        return {
          type: "Index",
          children: [
            { token: "[", $loc: dot.$loc },
            str,
            "]"
          ]
        };
      });
      var MemberBracketContent$2 = $TS($S(Dot, IntegerLiteral), function($skip, $loc, $0, $1, $2) {
        var dot = $1;
        var num = $2;
        return {
          type: "Index",
          children: [
            { token: "[", $loc: dot.$loc },
            num,
            "]"
          ]
        };
      });
      var MemberBracketContent$3 = $TS($S(Dot, $EXPECT($L19, fail, 'MemberBracketContent "-"'), IntegerLiteral), function($skip, $loc, $0, $1, $2, $3) {
        var dot = $1;
        var neg = $2;
        var num = $3;
        return [
          { type: "PropertyAccess", children: [dot, "at"] },
          { type: "Call", children: ["(", neg, num, ")"] }
        ];
      });
      function MemberBracketContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MemberBracketContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MemberBracketContent", state, MemberBracketContent$0(state) || MemberBracketContent$1(state) || MemberBracketContent$2(state) || MemberBracketContent$3(state));
          if (state.events)
            state.events.exit?.("MemberBracketContent", state, result, eventData);
          return result;
        } else {
          const result = MemberBracketContent$0(state) || MemberBracketContent$1(state) || MemberBracketContent$2(state) || MemberBracketContent$3(state);
          if (state.events)
            state.events.exit?.("MemberBracketContent", state, result, eventData);
          return result;
        }
      }
      var SliceParameters$0 = $TS($S(ExtendedExpression, __, $C(DotDotDot, DotDot), $E(ExtendedExpression)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var start = $1;
        var ws = $2;
        var sep = $3;
        var end = $4;
        const inclusive = sep.token === "..";
        let children;
        if (end) {
          const inc = [];
          if (inclusive) {
            end = ["1 + ", end];
            inc.push(" || 1/0");
          }
          children = [start, [...ws, { ...sep, token: ", " }], [end, ...inc]];
        } else {
          children = [start, ws];
        }
        return {
          type: "SliceParameters",
          start,
          end,
          children
        };
      });
      var SliceParameters$1 = $TS($S(Loc, __, $C(DotDotDot, DotDot), ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4) {
        var l = $1;
        var ws = $2;
        var sep = $3;
        var end = $4;
        const inclusive = sep.token === "..";
        const inc = [];
        if (inclusive) {
          end = ["1 + ", end];
          inc.push(" || 1/0");
        }
        const start = {
          $loc: l.$loc,
          token: "0"
        };
        return {
          type: "SliceParameters",
          start,
          end,
          children: [start, [...ws, { ...sep, token: ", " }], [end, ...inc]]
        };
      });
      var SliceParameters$2 = $TS($S(Loc, __, $C(DotDot, DotDotDot), $Y($S(__, CloseBracket))), function($skip, $loc, $0, $1, $2, $3, $4) {
        var l = $1;
        var ws = $2;
        const start = {
          $loc: l.$loc,
          token: "0"
        };
        return {
          type: "SliceParameters",
          start,
          end: void 0,
          children: [start, ws]
        };
      });
      function SliceParameters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SliceParameters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SliceParameters", state, SliceParameters$0(state) || SliceParameters$1(state) || SliceParameters$2(state));
          if (state.events)
            state.events.exit?.("SliceParameters", state, result, eventData);
          return result;
        } else {
          const result = SliceParameters$0(state) || SliceParameters$1(state) || SliceParameters$2(state);
          if (state.events)
            state.events.exit?.("SliceParameters", state, result, eventData);
          return result;
        }
      }
      var PropertyAccess$0 = $TS($S($E($C(QuestionMark, NonNullAssertion)), Dot, $C(IdentifierName, PrivateIdentifier)), function($skip, $loc, $0, $1, $2, $3) {
        var id = $3;
        const children = [$2, ...id.children];
        if ($1)
          children.unshift($1);
        return {
          type: "PropertyAccess",
          name: id.name,
          children
        };
      });
      var PropertyAccess$1 = $TS($S(CoffeePrototypeEnabled, DoubleColon, $E(IdentifierName)), function($skip, $loc, $0, $1, $2, $3) {
        var p = $2;
        var id = $3;
        if (id) {
          p.token = ".prototype.";
          return [p, id];
        }
        p.token = ".prototype";
        return p;
      });
      function PropertyAccess(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PropertyAccess", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PropertyAccess", state, PropertyAccess$0(state) || PropertyAccess$1(state));
          if (state.events)
            state.events.exit?.("PropertyAccess", state, result, eventData);
          return result;
        } else {
          const result = PropertyAccess$0(state) || PropertyAccess$1(state);
          if (state.events)
            state.events.exit?.("PropertyAccess", state, result, eventData);
          return result;
        }
      }
      var PropertyGlob$0 = $TS($S(OptionalDot, BracedObjectLiteral), function($skip, $loc, $0, $1, $2) {
        var dot = $1;
        var object = $2;
        return {
          type: "PropertyGlob",
          dot,
          object,
          children: $0
        };
      });
      function PropertyGlob(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PropertyGlob", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PropertyGlob", state, PropertyGlob$0(state));
          if (state.events)
            state.events.exit?.("PropertyGlob", state, result, eventData);
          return result;
        } else {
          const result = PropertyGlob$0(state);
          if (state.events)
            state.events.exit?.("PropertyGlob", state, result, eventData);
          return result;
        }
      }
      var PropertyBind$0 = $TS($S($E($C(QuestionMark, NonNullAssertion)), At, OptionalDot, $C(IdentifierName, PrivateIdentifier)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var modifier = $1;
        var dot = $3;
        var id = $4;
        return {
          type: "PropertyBind",
          name: id.name,
          children: [modifier, dot, id]
        };
      });
      function PropertyBind(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PropertyBind", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PropertyBind", state, PropertyBind$0(state));
          if (state.events)
            state.events.exit?.("PropertyBind", state, result, eventData);
          return result;
        } else {
          const result = PropertyBind$0(state);
          if (state.events)
            state.events.exit?.("PropertyBind", state, result, eventData);
          return result;
        }
      }
      var SuperProperty$0 = $S($EXPECT($L15, fail, 'SuperProperty "super"'), MemberBracketContent);
      var SuperProperty$1 = $S($EXPECT($L15, fail, 'SuperProperty "super"'), $N($C(QuestionMark, NonNullAssertion)), PropertyAccess);
      function SuperProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SuperProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SuperProperty", state, SuperProperty$0(state) || SuperProperty$1(state));
          if (state.events)
            state.events.exit?.("SuperProperty", state, result, eventData);
          return result;
        } else {
          const result = SuperProperty$0(state) || SuperProperty$1(state);
          if (state.events)
            state.events.exit?.("SuperProperty", state, result, eventData);
          return result;
        }
      }
      var MetaProperty$0 = $S(New, Dot, Target);
      var MetaProperty$1 = $TS($S($EXPECT($L20, fail, 'MetaProperty "import.meta"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      var MetaProperty$2 = ReturnValue;
      function MetaProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MetaProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MetaProperty", state, MetaProperty$0(state) || MetaProperty$1(state) || MetaProperty$2(state));
          if (state.events)
            state.events.exit?.("MetaProperty", state, result, eventData);
          return result;
        } else {
          const result = MetaProperty$0(state) || MetaProperty$1(state) || MetaProperty$2(state);
          if (state.events)
            state.events.exit?.("MetaProperty", state, result, eventData);
          return result;
        }
      }
      var ReturnValue$0 = $TV($C($S($EXPECT($L21, fail, 'ReturnValue "return.value"'), NonIdContinue), $S(Return, $Y(AfterReturnShorthand))), function($skip, $loc, $0, $1) {
        return { type: "ReturnValue", children: [$1[0]] };
      });
      function ReturnValue(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ReturnValue", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ReturnValue", state, ReturnValue$0(state));
          if (state.events)
            state.events.exit?.("ReturnValue", state, result, eventData);
          return result;
        } else {
          const result = ReturnValue$0(state);
          if (state.events)
            state.events.exit?.("ReturnValue", state, result, eventData);
          return result;
        }
      }
      var AfterReturnShorthand$0 = WAssignmentOp;
      var AfterReturnShorthand$1 = UpdateExpressionSymbol;
      var AfterReturnShorthand$2 = TypeSuffix;
      var AfterReturnShorthand$3 = $S(__, LetAssignment);
      var AfterReturnShorthand$4 = $S(__, ConstAssignment);
      function AfterReturnShorthand(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AfterReturnShorthand", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AfterReturnShorthand", state, AfterReturnShorthand$0(state) || AfterReturnShorthand$1(state) || AfterReturnShorthand$2(state) || AfterReturnShorthand$3(state) || AfterReturnShorthand$4(state));
          if (state.events)
            state.events.exit?.("AfterReturnShorthand", state, result, eventData);
          return result;
        } else {
          const result = AfterReturnShorthand$0(state) || AfterReturnShorthand$1(state) || AfterReturnShorthand$2(state) || AfterReturnShorthand$3(state) || AfterReturnShorthand$4(state);
          if (state.events)
            state.events.exit?.("AfterReturnShorthand", state, result, eventData);
          return result;
        }
      }
      var Parameters$0 = NonEmptyParameters;
      var Parameters$1 = $TS($S($E(TypeParameters), Loc), function($skip, $loc, $0, $1, $2) {
        var tp = $1;
        var p = $2;
        return {
          type: "Parameters",
          children: [tp, { $loc: p.$loc, token: "()" }],
          tp,
          names: [],
          implicit: true
        };
      });
      function Parameters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Parameters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Parameters", state, Parameters$0(state) || Parameters$1(state));
          if (state.events)
            state.events.exit?.("Parameters", state, result, eventData);
          return result;
        } else {
          const result = Parameters$0(state) || Parameters$1(state);
          if (state.events)
            state.events.exit?.("Parameters", state, result, eventData);
          return result;
        }
      }
      var NonEmptyParameters$0 = $TS($S($E(TypeParameters), OpenParen, $E(ThisType), $Q(ParameterElement), $E(FunctionRestParameter), $Q(ParameterElement), $S(__, CloseParen)), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7) {
        var tp = $1;
        var open = $2;
        var tt = $3;
        var pes = $4;
        var rest = $5;
        var after = $6;
        var close = $7;
        const names = pes.flatMap((p) => p.names);
        if (rest) {
          const restIdentifier = rest.binding.ref || rest.binding;
          names.push(...rest.names || []);
          let blockPrefix;
          if (after.length) {
            blockPrefix = {
              children: ["[", insertTrimmingSpace(after, ""), "] = ", restIdentifier, ".splice(-", after.length.toString(), ")"],
              names: after.flatMap((p) => p.names)
            };
          }
          return {
            type: "Parameters",
            children: [
              tp,
              open,
              tt,
              ...pes,
              { ...rest, children: rest.children.slice(0, -1) },
              close
            ],
            tp,
            names,
            blockPrefix
          };
        }
        return {
          type: "Parameters",
          children: [tp, open, tt, ...pes, close],
          names: pes.flatMap((p) => p.names),
          tp
        };
      });
      function NonEmptyParameters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonEmptyParameters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonEmptyParameters", state, NonEmptyParameters$0(state));
          if (state.events)
            state.events.exit?.("NonEmptyParameters", state, result, eventData);
          return result;
        } else {
          const result = NonEmptyParameters$0(state);
          if (state.events)
            state.events.exit?.("NonEmptyParameters", state, result, eventData);
          return result;
        }
      }
      var FunctionRestParameter$0 = $TS($S(BindingRestElement, $E(TypeSuffix), ParameterElementDelimiter), function($skip, $loc, $0, $1, $2, $3) {
        var id = $1;
        return {
          type: "FunctionRestParameter",
          children: $0,
          names: id.names,
          binding: id.binding
        };
      });
      function FunctionRestParameter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FunctionRestParameter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FunctionRestParameter", state, FunctionRestParameter$0(state));
          if (state.events)
            state.events.exit?.("FunctionRestParameter", state, result, eventData);
          return result;
        } else {
          const result = FunctionRestParameter$0(state);
          if (state.events)
            state.events.exit?.("FunctionRestParameter", state, result, eventData);
          return result;
        }
      }
      var ParameterElement$0 = $TS($S(__, $E(AccessModifier), $C(BindingIdentifier, BindingPattern), $E(TypeSuffix), $E(Initializer), ParameterElementDelimiter), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        return {
          type: "Parameter",
          children: $0,
          names: $3.names,
          accessModifier: $2
        };
      });
      function ParameterElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ParameterElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ParameterElement", state, ParameterElement$0(state));
          if (state.events)
            state.events.exit?.("ParameterElement", state, result, eventData);
          return result;
        } else {
          const result = ParameterElement$0(state);
          if (state.events)
            state.events.exit?.("ParameterElement", state, result, eventData);
          return result;
        }
      }
      var ParameterElementDelimiter$0 = $S($Q(_), Comma);
      var ParameterElementDelimiter$1 = $Y($S(__, $R$0($EXPECT($R2, fail, "ParameterElementDelimiter /[)}]/"))));
      var ParameterElementDelimiter$2 = $T($S($Y(EOS), InsertComma), function(value) {
        return value[1];
      });
      function ParameterElementDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ParameterElementDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ParameterElementDelimiter", state, ParameterElementDelimiter$0(state) || ParameterElementDelimiter$1(state) || ParameterElementDelimiter$2(state));
          if (state.events)
            state.events.exit?.("ParameterElementDelimiter", state, result, eventData);
          return result;
        } else {
          const result = ParameterElementDelimiter$0(state) || ParameterElementDelimiter$1(state) || ParameterElementDelimiter$2(state);
          if (state.events)
            state.events.exit?.("ParameterElementDelimiter", state, result, eventData);
          return result;
        }
      }
      var BindingIdentifier$0 = $TS($S(__, NWBindingIdentifier), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        var identifier = $2;
        return { ...identifier, children: [...ws, ...identifier.children] };
      });
      function BindingIdentifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BindingIdentifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BindingIdentifier", state, BindingIdentifier$0(state));
          if (state.events)
            state.events.exit?.("BindingIdentifier", state, result, eventData);
          return result;
        } else {
          const result = BindingIdentifier$0(state);
          if (state.events)
            state.events.exit?.("BindingIdentifier", state, result, eventData);
          return result;
        }
      }
      var NWBindingIdentifier$0 = $TS($S(At, AtIdentifierRef), function($skip, $loc, $0, $1, $2) {
        var ref = $2;
        return {
          type: "AtBinding",
          children: [ref],
          ref
        };
      });
      var NWBindingIdentifier$1 = Identifier;
      var NWBindingIdentifier$2 = $TS($S(ReturnValue), function($skip, $loc, $0, $1) {
        return { children: [$1], names: [] };
      });
      function NWBindingIdentifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NWBindingIdentifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NWBindingIdentifier", state, NWBindingIdentifier$0(state) || NWBindingIdentifier$1(state) || NWBindingIdentifier$2(state));
          if (state.events)
            state.events.exit?.("NWBindingIdentifier", state, result, eventData);
          return result;
        } else {
          const result = NWBindingIdentifier$0(state) || NWBindingIdentifier$1(state) || NWBindingIdentifier$2(state);
          if (state.events)
            state.events.exit?.("NWBindingIdentifier", state, result, eventData);
          return result;
        }
      }
      var AtIdentifierRef$0 = $TV(ReservedWord, function($skip, $loc, $0, $1) {
        var r = $0;
        return {
          type: "Ref",
          base: `_${r}`,
          id: r
        };
      });
      var AtIdentifierRef$1 = $TV(IdentifierName, function($skip, $loc, $0, $1) {
        var id = $0;
        return {
          type: "Ref",
          base: id.name,
          id: id.name
        };
      });
      function AtIdentifierRef(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AtIdentifierRef", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AtIdentifierRef", state, AtIdentifierRef$0(state) || AtIdentifierRef$1(state));
          if (state.events)
            state.events.exit?.("AtIdentifierRef", state, result, eventData);
          return result;
        } else {
          const result = AtIdentifierRef$0(state) || AtIdentifierRef$1(state);
          if (state.events)
            state.events.exit?.("AtIdentifierRef", state, result, eventData);
          return result;
        }
      }
      var PinPattern$0 = $TS($S($EXPECT($L18, fail, 'PinPattern "^"'), Identifier), function($skip, $loc, $0, $1, $2) {
        var identifier = $2;
        return {
          type: "PinPattern",
          children: $0,
          identifier
        };
      });
      function PinPattern(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PinPattern", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PinPattern", state, PinPattern$0(state));
          if (state.events)
            state.events.exit?.("PinPattern", state, result, eventData);
          return result;
        } else {
          const result = PinPattern$0(state);
          if (state.events)
            state.events.exit?.("PinPattern", state, result, eventData);
          return result;
        }
      }
      var BindingPattern$0 = ObjectBindingPattern;
      var BindingPattern$1 = ArrayBindingPattern;
      var BindingPattern$2 = PinPattern;
      var BindingPattern$3 = Literal;
      var BindingPattern$4 = RegularExpressionLiteral;
      function BindingPattern(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BindingPattern", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BindingPattern", state, BindingPattern$0(state) || BindingPattern$1(state) || BindingPattern$2(state) || BindingPattern$3(state) || BindingPattern$4(state));
          if (state.events)
            state.events.exit?.("BindingPattern", state, result, eventData);
          return result;
        } else {
          const result = BindingPattern$0(state) || BindingPattern$1(state) || BindingPattern$2(state) || BindingPattern$3(state) || BindingPattern$4(state);
          if (state.events)
            state.events.exit?.("BindingPattern", state, result, eventData);
          return result;
        }
      }
      var ObjectBindingPattern$0 = $TS($S($E(_), OpenBrace, ObjectBindingPatternContent, __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var c = $3;
        return {
          type: "ObjectBindingPattern",
          children: $0,
          names: c.names,
          properties: c.children
        };
      });
      function ObjectBindingPattern(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ObjectBindingPattern", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ObjectBindingPattern", state, ObjectBindingPattern$0(state));
          if (state.events)
            state.events.exit?.("ObjectBindingPattern", state, result, eventData);
          return result;
        } else {
          const result = ObjectBindingPattern$0(state);
          if (state.events)
            state.events.exit?.("ObjectBindingPattern", state, result, eventData);
          return result;
        }
      }
      var ObjectBindingPatternContent$0 = NestedBindingProperties;
      var ObjectBindingPatternContent$1 = $TV($E(BindingPropertyList), function($skip, $loc, $0, $1) {
        var props = $0;
        if (!props)
          return { children: [], names: [] };
        return reorderBindingRestProperty(props);
      });
      function ObjectBindingPatternContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ObjectBindingPatternContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ObjectBindingPatternContent", state, ObjectBindingPatternContent$0(state) || ObjectBindingPatternContent$1(state));
          if (state.events)
            state.events.exit?.("ObjectBindingPatternContent", state, result, eventData);
          return result;
        } else {
          const result = ObjectBindingPatternContent$0(state) || ObjectBindingPatternContent$1(state);
          if (state.events)
            state.events.exit?.("ObjectBindingPatternContent", state, result, eventData);
          return result;
        }
      }
      var BindingPropertyList$0 = $TV($P($S(BindingProperty, ObjectPropertyDelimiter)), function($skip, $loc, $0, $1) {
        var props = $0;
        return props.map(([prop, delim]) => {
          return {
            ...prop,
            children: [...prop.children, delim]
          };
        });
      });
      function BindingPropertyList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BindingPropertyList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BindingPropertyList", state, BindingPropertyList$0(state));
          if (state.events)
            state.events.exit?.("BindingPropertyList", state, result, eventData);
          return result;
        } else {
          const result = BindingPropertyList$0(state);
          if (state.events)
            state.events.exit?.("BindingPropertyList", state, result, eventData);
          return result;
        }
      }
      var ArrayBindingPattern$0 = $TS($S($E(_), OpenBracket, ArrayBindingPatternContent, __, CloseBracket), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var c = $3;
        return {
          type: "ArrayBindingPattern",
          children: $0,
          names: c.names,
          elements: c.children,
          length: c.length
        };
      });
      function ArrayBindingPattern(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArrayBindingPattern", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArrayBindingPattern", state, ArrayBindingPattern$0(state));
          if (state.events)
            state.events.exit?.("ArrayBindingPattern", state, result, eventData);
          return result;
        } else {
          const result = ArrayBindingPattern$0(state);
          if (state.events)
            state.events.exit?.("ArrayBindingPattern", state, result, eventData);
          return result;
        }
      }
      var ArrayBindingPatternContent$0 = NestedBindingElements;
      var ArrayBindingPatternContent$1 = $TV($E(BindingElementList), function($skip, $loc, $0, $1) {
        var elements = $0;
        if (!elements)
          return { children: [], names: [], length: 0 };
        return adjustBindingElements(elements);
      });
      function ArrayBindingPatternContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArrayBindingPatternContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArrayBindingPatternContent", state, ArrayBindingPatternContent$0(state) || ArrayBindingPatternContent$1(state));
          if (state.events)
            state.events.exit?.("ArrayBindingPatternContent", state, result, eventData);
          return result;
        } else {
          const result = ArrayBindingPatternContent$0(state) || ArrayBindingPatternContent$1(state);
          if (state.events)
            state.events.exit?.("ArrayBindingPatternContent", state, result, eventData);
          return result;
        }
      }
      var BindingElementList$0 = $TV($P($S(BindingElement, ArrayElementDelimiter)), function($skip, $loc, $0, $1) {
        var elements = $0;
        return elements.map(([element, delim]) => {
          return {
            ...element,
            children: [...element.children, delim]
          };
        });
      });
      function BindingElementList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BindingElementList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BindingElementList", state, BindingElementList$0(state));
          if (state.events)
            state.events.exit?.("BindingElementList", state, result, eventData);
          return result;
        } else {
          const result = BindingElementList$0(state);
          if (state.events)
            state.events.exit?.("BindingElementList", state, result, eventData);
          return result;
        }
      }
      var NestedBindingElementList$0 = $TS($S(Nested, BindingElementList), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        var elements = $2;
        return elements.map((element, i) => {
          if (i > 0)
            return element;
          return {
            ...element,
            children: [ws, ...element.children]
          };
        });
      });
      function NestedBindingElementList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBindingElementList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBindingElementList", state, NestedBindingElementList$0(state));
          if (state.events)
            state.events.exit?.("NestedBindingElementList", state, result, eventData);
          return result;
        } else {
          const result = NestedBindingElementList$0(state);
          if (state.events)
            state.events.exit?.("NestedBindingElementList", state, result, eventData);
          return result;
        }
      }
      var Elision$0 = $S(__, Comma);
      function Elision(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Elision", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Elision", state, Elision$0(state));
          if (state.events)
            state.events.exit?.("Elision", state, result, eventData);
          return result;
        } else {
          const result = Elision$0(state);
          if (state.events)
            state.events.exit?.("Elision", state, result, eventData);
          return result;
        }
      }
      var NestedBindingProperties$0 = $TS($S(PushIndent, $Q(NestedBindingPropertyList), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var props = $2;
        if (!props.length)
          return $skip;
        return reorderBindingRestProperty(props.flat());
      });
      function NestedBindingProperties(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBindingProperties", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBindingProperties", state, NestedBindingProperties$0(state));
          if (state.events)
            state.events.exit?.("NestedBindingProperties", state, result, eventData);
          return result;
        } else {
          const result = NestedBindingProperties$0(state);
          if (state.events)
            state.events.exit?.("NestedBindingProperties", state, result, eventData);
          return result;
        }
      }
      var NestedBindingPropertyList$0 = $TS($S(Nested, BindingPropertyList), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        var props = $2;
        return props.map((prop, i) => {
          if (i > 0)
            return prop;
          return {
            ...prop,
            children: [ws, ...prop.children]
          };
        });
      });
      function NestedBindingPropertyList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBindingPropertyList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBindingPropertyList", state, NestedBindingPropertyList$0(state));
          if (state.events)
            state.events.exit?.("NestedBindingPropertyList", state, result, eventData);
          return result;
        } else {
          const result = NestedBindingPropertyList$0(state);
          if (state.events)
            state.events.exit?.("NestedBindingPropertyList", state, result, eventData);
          return result;
        }
      }
      var BindingProperty$0 = BindingRestProperty;
      var BindingProperty$1 = $TS($S($E(_), PropertyName, $E(_), Colon, $E(_), $C(BindingIdentifier, BindingPattern), $E(Initializer)), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7) {
        var name = $2;
        var value = $6;
        var init = $7;
        return {
          type: "BindingProperty",
          children: $0,
          name,
          value,
          init,
          names: value.names
        };
      });
      var BindingProperty$2 = $TS($S($E(_), $E($EXPECT($L18, fail, 'BindingProperty "^"')), BindingIdentifier, $E(Initializer)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var ws = $1;
        var pin = $2;
        var binding = $3;
        var init = $4;
        if (binding.type === "AtBinding") {
          return {
            type: "AtBindingProperty",
            children: $0,
            binding,
            ref: binding.ref,
            init,
            names: []
          };
        }
        if (pin) {
          return {
            type: "PinProperty",
            children: [ws, binding],
            name: binding,
            value: {
              type: "PinPattern",
              identifier: binding
            }
          };
        }
        return {
          type: "BindingProperty",
          children: $0,
          name: binding,
          value: void 0,
          init,
          names: binding.names,
          identifier: binding
        };
      });
      function BindingProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BindingProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BindingProperty", state, BindingProperty$0(state) || BindingProperty$1(state) || BindingProperty$2(state));
          if (state.events)
            state.events.exit?.("BindingProperty", state, result, eventData);
          return result;
        } else {
          const result = BindingProperty$0(state) || BindingProperty$1(state) || BindingProperty$2(state);
          if (state.events)
            state.events.exit?.("BindingProperty", state, result, eventData);
          return result;
        }
      }
      var BindingRestProperty$0 = $TS($S($E(_), DotDotDot, BindingIdentifier), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var dots = $2;
        var id = $3;
        return {
          ...id,
          type: "BindingRestProperty",
          children: [...ws || [], dots, ...id.children]
        };
      });
      var BindingRestProperty$1 = $TS($S($E(_), BindingIdentifier, DotDotDot), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var id = $2;
        var dots = $3;
        return {
          ...id,
          type: "BindingRestProperty",
          children: [...ws || [], dots, ...id.children]
        };
      });
      function BindingRestProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BindingRestProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BindingRestProperty", state, BindingRestProperty$0(state) || BindingRestProperty$1(state));
          if (state.events)
            state.events.exit?.("BindingRestProperty", state, result, eventData);
          return result;
        } else {
          const result = BindingRestProperty$0(state) || BindingRestProperty$1(state);
          if (state.events)
            state.events.exit?.("BindingRestProperty", state, result, eventData);
          return result;
        }
      }
      var NestedBindingElements$0 = $TS($S(PushIndent, $Q(NestedBindingElementList), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var elements = $2;
        if (!elements.length)
          return $skip;
        return adjustBindingElements(elements.flat());
      });
      function NestedBindingElements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBindingElements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBindingElements", state, NestedBindingElements$0(state));
          if (state.events)
            state.events.exit?.("NestedBindingElements", state, result, eventData);
          return result;
        } else {
          const result = NestedBindingElements$0(state);
          if (state.events)
            state.events.exit?.("NestedBindingElements", state, result, eventData);
          return result;
        }
      }
      var NestedBindingElement$0 = $TS($S(Nested, BindingElement), function($skip, $loc, $0, $1, $2) {
        var indent = $1;
        var element = $2;
        return {
          ...element,
          children: [indent, ...element.children]
        };
      });
      function NestedBindingElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBindingElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBindingElement", state, NestedBindingElement$0(state));
          if (state.events)
            state.events.exit?.("NestedBindingElement", state, result, eventData);
          return result;
        } else {
          const result = NestedBindingElement$0(state);
          if (state.events)
            state.events.exit?.("NestedBindingElement", state, result, eventData);
          return result;
        }
      }
      var BindingElement$0 = BindingRestElement;
      var BindingElement$1 = $TS($S($E(_), $C(BindingIdentifier, BindingPattern), $E(Initializer)), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var binding = $2;
        var initializer = $3;
        if (binding.children) {
          binding = {
            ...binding,
            children: [...binding.children, initializer]
          };
        }
        return {
          names: binding.names,
          children: [ws, binding]
        };
      });
      var BindingElement$2 = $TV($Y($S($E(_), $EXPECT($L22, fail, 'BindingElement ","'))), function($skip, $loc, $0, $1) {
        return {
          children: [{
            type: "ElisionElement",
            children: [""]
          }],
          names: []
        };
      });
      function BindingElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BindingElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BindingElement", state, BindingElement$0(state) || BindingElement$1(state) || BindingElement$2(state));
          if (state.events)
            state.events.exit?.("BindingElement", state, result, eventData);
          return result;
        } else {
          const result = BindingElement$0(state) || BindingElement$1(state) || BindingElement$2(state);
          if (state.events)
            state.events.exit?.("BindingElement", state, result, eventData);
          return result;
        }
      }
      var BindingRestElement$0 = $TS($S($E(_), DotDotDot, $C(BindingIdentifier, BindingPattern, EmptyBindingPattern)), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var dots = $2;
        var binding = $3;
        return {
          type: "BindingRestElement",
          children: [...ws || [], dots, binding],
          binding,
          name: binding.name,
          names: binding.names,
          rest: true
        };
      });
      var BindingRestElement$1 = $TS($S($E(_), $C(BindingIdentifier, BindingPattern), DotDotDot), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var binding = $2;
        var dots = $3;
        return {
          type: "BindingRestElement",
          children: [...ws || [], dots, binding],
          binding,
          name: binding.name,
          names: binding.names,
          rest: true
        };
      });
      function BindingRestElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BindingRestElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BindingRestElement", state, BindingRestElement$0(state) || BindingRestElement$1(state));
          if (state.events)
            state.events.exit?.("BindingRestElement", state, result, eventData);
          return result;
        } else {
          const result = BindingRestElement$0(state) || BindingRestElement$1(state);
          if (state.events)
            state.events.exit?.("BindingRestElement", state, result, eventData);
          return result;
        }
      }
      var EmptyBindingPattern$0 = $TV($EXPECT($L0, fail, 'EmptyBindingPattern ""'), function($skip, $loc, $0, $1) {
        const ref = {
          type: "Ref",
          base: "ref",
          id: "ref"
        };
        return {
          type: "EmptyBinding",
          children: [ref],
          names: [],
          ref
        };
      });
      function EmptyBindingPattern(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EmptyBindingPattern", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EmptyBindingPattern", state, EmptyBindingPattern$0(state));
          if (state.events)
            state.events.exit?.("EmptyBindingPattern", state, result, eventData);
          return result;
        } else {
          const result = EmptyBindingPattern$0(state);
          if (state.events)
            state.events.exit?.("EmptyBindingPattern", state, result, eventData);
          return result;
        }
      }
      var FunctionDeclaration$0 = $TS($S(FunctionExpression), function($skip, $loc, $0, $1) {
        if ($1.id)
          return $1;
        return makeLeftHandSideExpression($1);
      });
      function FunctionDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FunctionDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FunctionDeclaration", state, FunctionDeclaration$0(state));
          if (state.events)
            state.events.exit?.("FunctionDeclaration", state, result, eventData);
          return result;
        } else {
          const result = FunctionDeclaration$0(state);
          if (state.events)
            state.events.exit?.("FunctionDeclaration", state, result, eventData);
          return result;
        }
      }
      var FunctionSignature$0 = $TS($S($E($S(Async, _)), Function, $E($S($E(_), Star)), $E($S($E(_), NWBindingIdentifier)), $E(_), Parameters, $E(ReturnTypeSuffix)), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7) {
        var async = $1;
        var func = $2;
        var generator = $3;
        var wid = $4;
        var w = $5;
        var parameters = $6;
        var suffix = $7;
        if (!async)
          async = [];
        if (!generator)
          generator = [];
        const id = wid?.[1];
        return {
          type: "FunctionSignature",
          id,
          name: id?.name,
          parameters,
          returnType: suffix,
          ts: false,
          async,
          generator,
          block: null,
          children: !parameters.implicit ? [async, func, generator, wid, w, parameters, suffix] : [async, func, generator, wid, parameters, w, suffix]
        };
      });
      function FunctionSignature(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FunctionSignature", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FunctionSignature", state, FunctionSignature$0(state));
          if (state.events)
            state.events.exit?.("FunctionSignature", state, result, eventData);
          return result;
        } else {
          const result = FunctionSignature$0(state);
          if (state.events)
            state.events.exit?.("FunctionSignature", state, result, eventData);
          return result;
        }
      }
      var FunctionExpression$0 = $TS($S(FunctionSignature, $E(BracedBlock)), function($skip, $loc, $0, $1, $2) {
        var signature = $1;
        var block = $2;
        if (!block) {
          return {
            ...signature,
            type: "FunctionExpression",
            ts: true
          };
        }
        if (hasAwait(block) && !signature.async.length) {
          signature.async.push("async ");
        }
        if (hasYield(block) && !signature.generator.length) {
          signature.generator.push("*");
        }
        return {
          ...signature,
          type: "FunctionExpression",
          children: [...signature.children, block],
          block
        };
      });
      var FunctionExpression$1 = AmpersandFunctionExpression;
      function FunctionExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FunctionExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FunctionExpression", state, FunctionExpression$0(state) || FunctionExpression$1(state));
          if (state.events)
            state.events.exit?.("FunctionExpression", state, result, eventData);
          return result;
        } else {
          const result = FunctionExpression$0(state) || FunctionExpression$1(state);
          if (state.events)
            state.events.exit?.("FunctionExpression", state, result, eventData);
          return result;
        }
      }
      var AmpersandFunctionExpression$0 = $TS($S($E(AmpersandUnaryPrefix), $C(Ampersand, $S($N(NumericLiteral), $Y($S($E(QuestionMark), Dot)))), $E(AmpersandBlockRHS)), function($skip, $loc, $0, $1, $2, $3) {
        var prefix = $1;
        var rhs = $3;
        if (!prefix && !rhs)
          return $skip;
        let body, ref;
        if (!rhs) {
          ref = {
            type: "Ref",
            base: "$",
            id: "$"
          };
          body = [prefix, ref];
        } else {
          ({ ref } = rhs);
          body = [prefix, rhs];
        }
        const children = [ref, " => ", ...body];
        if (hasAwait(body)) {
          children.unshift("async ");
        }
        return {
          type: "ArrowFunction",
          children,
          ref,
          body,
          ampersandBlock: true
        };
      });
      function AmpersandFunctionExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AmpersandFunctionExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AmpersandFunctionExpression", state, AmpersandFunctionExpression$0(state));
          if (state.events)
            state.events.exit?.("AmpersandFunctionExpression", state, result, eventData);
          return result;
        } else {
          const result = AmpersandFunctionExpression$0(state);
          if (state.events)
            state.events.exit?.("AmpersandFunctionExpression", state, result, eventData);
          return result;
        }
      }
      var OperatorDeclaration$0 = $TS($S(Operator, _, LexicalDeclaration), function($skip, $loc, $0, $1, $2, $3) {
        var op = $1;
        var w = $2;
        var decl = $3;
        decl.names.forEach((name) => module.operators.add(name));
        return [insertTrimmingSpace(w, ""), decl];
      });
      var OperatorDeclaration$1 = $TS($S(OperatorSignature, BracedBlock), function($skip, $loc, $0, $1, $2) {
        var signature = $1;
        var block = $2;
        module.operators.add(signature.id.name);
        return {
          ...signature,
          type: "FunctionExpression",
          children: [...signature.children, block],
          block,
          operator: true
        };
      });
      var OperatorDeclaration$2 = $TS($S(Operator, _, Identifier, $Q($S(CommaDelimiter, $E(_), Identifier))), function($skip, $loc, $0, $1, $2, $3, $4) {
        var op = $1;
        var w1 = $2;
        var id = $3;
        var ids = $4;
        module.operators.add(id.name);
        ids.forEach(([, , id2]) => module.operators.add(id2.name));
        return [];
      });
      function OperatorDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OperatorDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OperatorDeclaration", state, OperatorDeclaration$0(state) || OperatorDeclaration$1(state) || OperatorDeclaration$2(state));
          if (state.events)
            state.events.exit?.("OperatorDeclaration", state, result, eventData);
          return result;
        } else {
          const result = OperatorDeclaration$0(state) || OperatorDeclaration$1(state) || OperatorDeclaration$2(state);
          if (state.events)
            state.events.exit?.("OperatorDeclaration", state, result, eventData);
          return result;
        }
      }
      var OperatorSignature$0 = $TS($S(Operator, $E($S(_, Function)), _, Identifier, $E(_), NonEmptyParameters, $E(ReturnTypeSuffix)), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7) {
        var op = $1;
        var func = $2;
        var w1 = $3;
        var id = $4;
        var w2 = $5;
        var parameters = $6;
        var suffix = $7;
        if (!func) {
          func = { $loc: op.$loc, token: "function" };
        } else {
          func = [insertTrimmingSpace(func[0], ""), func[1]];
        }
        return {
          type: "FunctionSignature",
          id,
          parameters,
          returnType: suffix,
          ts: false,
          block: null,
          children: [func, w1, id, w2, parameters, suffix]
        };
      });
      function OperatorSignature(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OperatorSignature", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OperatorSignature", state, OperatorSignature$0(state));
          if (state.events)
            state.events.exit?.("OperatorSignature", state, result, eventData);
          return result;
        } else {
          const result = OperatorSignature$0(state);
          if (state.events)
            state.events.exit?.("OperatorSignature", state, result, eventData);
          return result;
        }
      }
      var AmpersandBlockRHS$0 = $TS($S(ForbidTrailingMemberProperty, $E(AmpersandBlockRHSBody), RestoreTrailingMemberProperty), function($skip, $loc, $0, $1, $2, $3) {
        if (!$2)
          return $skip;
        return $2;
      });
      function AmpersandBlockRHS(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AmpersandBlockRHS", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AmpersandBlockRHS", state, AmpersandBlockRHS$0(state));
          if (state.events)
            state.events.exit?.("AmpersandBlockRHS", state, result, eventData);
          return result;
        } else {
          const result = AmpersandBlockRHS$0(state);
          if (state.events)
            state.events.exit?.("AmpersandBlockRHS", state, result, eventData);
          return result;
        }
      }
      var AmpersandBlockRHSBody$0 = $TS($S($E($S($N(_), $P(CallExpressionRest))), $E(QuestionMark), $E($S($N($EXPECT($R3, fail, "AmpersandBlockRHSBody /[&]/")), $P(BinaryOpRHS)))), function($skip, $loc, $0, $1, $2, $3) {
        var callExpRest = $1;
        var unaryPostfix = $2;
        var binopRHS = $3;
        if (!callExpRest && !binopRHS)
          return $skip;
        const ref = {
          type: "Ref",
          base: "$",
          id: "$"
        };
        let exp = {
          type: "AmpersandRef",
          children: [ref],
          names: [],
          ref
        };
        if (callExpRest) {
          exp.children.push(...callExpRest[1]);
        }
        if (unaryPostfix) {
          exp = processUnaryExpression([], exp, unaryPostfix);
        }
        if (binopRHS) {
          return {
            children: processBinaryOpExpression([exp, binopRHS[1]]),
            ref
          };
        }
        return exp;
      });
      function AmpersandBlockRHSBody(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AmpersandBlockRHSBody", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AmpersandBlockRHSBody", state, AmpersandBlockRHSBody$0(state));
          if (state.events)
            state.events.exit?.("AmpersandBlockRHSBody", state, result, eventData);
          return result;
        } else {
          const result = AmpersandBlockRHSBody$0(state);
          if (state.events)
            state.events.exit?.("AmpersandBlockRHSBody", state, result, eventData);
          return result;
        }
      }
      var AmpersandUnaryPrefix$0 = $R$0($EXPECT($R4, fail, "AmpersandUnaryPrefix /[!~+-]+/"));
      function AmpersandUnaryPrefix(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AmpersandUnaryPrefix", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AmpersandUnaryPrefix", state, AmpersandUnaryPrefix$0(state));
          if (state.events)
            state.events.exit?.("AmpersandUnaryPrefix", state, result, eventData);
          return result;
        } else {
          const result = AmpersandUnaryPrefix$0(state);
          if (state.events)
            state.events.exit?.("AmpersandUnaryPrefix", state, result, eventData);
          return result;
        }
      }
      var ThinArrowFunction$0 = $TS($S($E($S(Async, _)), Parameters, $E(ReturnTypeSuffix), $E(_), Arrow, BracedOrEmptyBlock), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        var async = $1;
        var parameters = $2;
        var suffix = $3;
        var arrow = $5;
        var block = $6;
        if (hasAwait(block) && !async) {
          async = "async ";
        }
        let generator;
        if (hasYield(block)) {
          generator = "*";
        }
        return {
          type: "FunctionExpression",
          id: void 0,
          parameters,
          returnType: suffix,
          ts: false,
          async,
          generator,
          block,
          children: [
            async,
            { $loc: arrow.$loc, token: "function" },
            generator,
            parameters,
            suffix,
            block
          ]
        };
      });
      function ThinArrowFunction(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ThinArrowFunction", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ThinArrowFunction", state, ThinArrowFunction$0(state));
          if (state.events)
            state.events.exit?.("ThinArrowFunction", state, result, eventData);
          return result;
        } else {
          const result = ThinArrowFunction$0(state);
          if (state.events)
            state.events.exit?.("ThinArrowFunction", state, result, eventData);
          return result;
        }
      }
      var Arrow$0 = $TV($C($EXPECT($L23, fail, 'Arrow "->"'), $EXPECT($L24, fail, 'Arrow "\u2192"')), function($skip, $loc, $0, $1) {
        return { $loc, token: "->" };
      });
      function Arrow(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Arrow", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Arrow", state, Arrow$0(state));
          if (state.events)
            state.events.exit?.("Arrow", state, result, eventData);
          return result;
        } else {
          const result = Arrow$0(state);
          if (state.events)
            state.events.exit?.("Arrow", state, result, eventData);
          return result;
        }
      }
      var ExplicitBlock$0 = $TS($S(__, OpenBrace, __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4) {
        const expressions = [];
        return {
          type: "BlockStatement",
          expressions,
          children: [$1, expressions, $2],
          bare: false,
          empty: true
        };
      });
      var ExplicitBlock$1 = $TS($S(__, OpenBrace, NestedBlockStatements, __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var block = $3;
        return {
          ...block,
          children: [$1, $2, ...block.children, $4, $5],
          bare: false
        };
      });
      function ExplicitBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExplicitBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExplicitBlock", state, ExplicitBlock$0(state) || ExplicitBlock$1(state));
          if (state.events)
            state.events.exit?.("ExplicitBlock", state, result, eventData);
          return result;
        } else {
          const result = ExplicitBlock$0(state) || ExplicitBlock$1(state);
          if (state.events)
            state.events.exit?.("ExplicitBlock", state, result, eventData);
          return result;
        }
      }
      var ImplicitNestedBlock$0 = $TS($S($Y(EOS), InsertOpenBrace, AllowAll, $E($S(NestedBlockStatements, InsertNewline, InsertIndent, InsertCloseBrace)), RestoreAll), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var open = $2;
        if (!$4)
          return $skip;
        const [block, ...tail] = $4;
        return {
          ...block,
          children: [open, ...block.children, ...tail],
          bare: false
        };
      });
      function ImplicitNestedBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplicitNestedBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplicitNestedBlock", state, ImplicitNestedBlock$0(state));
          if (state.events)
            state.events.exit?.("ImplicitNestedBlock", state, result, eventData);
          return result;
        } else {
          const result = ImplicitNestedBlock$0(state);
          if (state.events)
            state.events.exit?.("ImplicitNestedBlock", state, result, eventData);
          return result;
        }
      }
      var Block$0 = ExplicitBlock;
      var Block$1 = ImplicitNestedBlock;
      var Block$2 = ThenClause;
      var Block$3 = $TS($S($E(_), $N(EOS), Statement), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var s = $3;
        const expressions = [[ws, s]];
        return {
          type: "BlockStatement",
          expressions,
          children: [expressions],
          bare: true
        };
      });
      function Block(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Block", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Block", state, Block$0(state) || Block$1(state) || Block$2(state) || Block$3(state));
          if (state.events)
            state.events.exit?.("Block", state, result, eventData);
          return result;
        } else {
          const result = Block$0(state) || Block$1(state) || Block$2(state) || Block$3(state);
          if (state.events)
            state.events.exit?.("Block", state, result, eventData);
          return result;
        }
      }
      var ThenClause$0 = $T($S(Then, SingleLineStatements), function(value) {
        return value[1];
      });
      function ThenClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ThenClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ThenClause", state, ThenClause$0(state));
          if (state.events)
            state.events.exit?.("ThenClause", state, result, eventData);
          return result;
        } else {
          const result = ThenClause$0(state);
          if (state.events)
            state.events.exit?.("ThenClause", state, result, eventData);
          return result;
        }
      }
      var BracedOrEmptyBlock$0 = BracedBlock;
      var BracedOrEmptyBlock$1 = EmptyBlock;
      function BracedOrEmptyBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BracedOrEmptyBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BracedOrEmptyBlock", state, BracedOrEmptyBlock$0(state) || BracedOrEmptyBlock$1(state));
          if (state.events)
            state.events.exit?.("BracedOrEmptyBlock", state, result, eventData);
          return result;
        } else {
          const result = BracedOrEmptyBlock$0(state) || BracedOrEmptyBlock$1(state);
          if (state.events)
            state.events.exit?.("BracedOrEmptyBlock", state, result, eventData);
          return result;
        }
      }
      var NoPostfixBracedOrEmptyBlock$0 = NoPostfixBracedBlock;
      var NoPostfixBracedOrEmptyBlock$1 = EmptyBlock;
      function NoPostfixBracedOrEmptyBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NoPostfixBracedOrEmptyBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NoPostfixBracedOrEmptyBlock", state, NoPostfixBracedOrEmptyBlock$0(state) || NoPostfixBracedOrEmptyBlock$1(state));
          if (state.events)
            state.events.exit?.("NoPostfixBracedOrEmptyBlock", state, result, eventData);
          return result;
        } else {
          const result = NoPostfixBracedOrEmptyBlock$0(state) || NoPostfixBracedOrEmptyBlock$1(state);
          if (state.events)
            state.events.exit?.("NoPostfixBracedOrEmptyBlock", state, result, eventData);
          return result;
        }
      }
      var EmptyBlock$0 = $TS($S(InsertOpenBrace, InsertCloseBrace), function($skip, $loc, $0, $1, $2) {
        const expressions = [];
        return {
          type: "BlockStatement",
          expressions,
          children: [$1, expressions, $2],
          bare: false,
          empty: true
        };
      });
      function EmptyBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EmptyBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EmptyBlock", state, EmptyBlock$0(state));
          if (state.events)
            state.events.exit?.("EmptyBlock", state, result, eventData);
          return result;
        } else {
          const result = EmptyBlock$0(state);
          if (state.events)
            state.events.exit?.("EmptyBlock", state, result, eventData);
          return result;
        }
      }
      var EmptyBareBlock$0 = $TV($EXPECT($L0, fail, 'EmptyBareBlock ""'), function($skip, $loc, $0, $1) {
        const expressions = [];
        return {
          type: "BlockStatement",
          expressions,
          children: [expressions],
          bare: true
        };
      });
      function EmptyBareBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EmptyBareBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EmptyBareBlock", state, EmptyBareBlock$0(state));
          if (state.events)
            state.events.exit?.("EmptyBareBlock", state, result, eventData);
          return result;
        } else {
          const result = EmptyBareBlock$0(state);
          if (state.events)
            state.events.exit?.("EmptyBareBlock", state, result, eventData);
          return result;
        }
      }
      var BracedBlock$0 = NonSingleBracedBlock;
      var BracedBlock$1 = $TS($S(InsertOpenBrace, $N(EOS), PostfixedSingleLineStatements, InsertSpace, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var o = $1;
        var s = $3;
        var ws = $4;
        var c = $5;
        if (!s.children.length)
          return $skip;
        return {
          type: "BlockStatement",
          expressions: s.expressions,
          children: [o, s.children, ws, c]
        };
      });
      function BracedBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BracedBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BracedBlock", state, BracedBlock$0(state) || BracedBlock$1(state));
          if (state.events)
            state.events.exit?.("BracedBlock", state, result, eventData);
          return result;
        } else {
          const result = BracedBlock$0(state) || BracedBlock$1(state);
          if (state.events)
            state.events.exit?.("BracedBlock", state, result, eventData);
          return result;
        }
      }
      var NoPostfixBracedBlock$0 = NonSingleBracedBlock;
      var NoPostfixBracedBlock$1 = $TS($S(InsertOpenBrace, $N(EOS), SingleLineStatements, InsertSpace, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var o = $1;
        var s = $3;
        var ws = $4;
        var c = $5;
        if (!s.children.length)
          return $skip;
        return {
          type: "BlockStatement",
          expressions: s.expressions,
          children: [o, s.children, ws, c]
        };
      });
      function NoPostfixBracedBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NoPostfixBracedBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NoPostfixBracedBlock", state, NoPostfixBracedBlock$0(state) || NoPostfixBracedBlock$1(state));
          if (state.events)
            state.events.exit?.("NoPostfixBracedBlock", state, result, eventData);
          return result;
        } else {
          const result = NoPostfixBracedBlock$0(state) || NoPostfixBracedBlock$1(state);
          if (state.events)
            state.events.exit?.("NoPostfixBracedBlock", state, result, eventData);
          return result;
        }
      }
      var NonSingleBracedBlock$0 = $TS($S($E(_), OpenBrace, AllowAll, $E($S(BracedContent, __, CloseBrace)), RestoreAll), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var ws1 = $1;
        var open = $2;
        if (!$4)
          return $skip;
        const [block, ws2, close] = $4;
        return {
          type: "BlockStatement",
          expressions: block.expressions,
          children: [ws1, open, ...block.children, ws2, close],
          bare: false
        };
        return block;
      });
      var NonSingleBracedBlock$1 = ImplicitNestedBlock;
      var NonSingleBracedBlock$2 = $TS($S(InsertOpenBrace, $Y(EOS), ObjectLiteral, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4) {
        var s = $3;
        return {
          type: "BlockStatement",
          expressions: [s],
          children: [$1, s, $3]
        };
      });
      function NonSingleBracedBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonSingleBracedBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonSingleBracedBlock", state, NonSingleBracedBlock$0(state) || NonSingleBracedBlock$1(state) || NonSingleBracedBlock$2(state));
          if (state.events)
            state.events.exit?.("NonSingleBracedBlock", state, result, eventData);
          return result;
        } else {
          const result = NonSingleBracedBlock$0(state) || NonSingleBracedBlock$1(state) || NonSingleBracedBlock$2(state);
          if (state.events)
            state.events.exit?.("NonSingleBracedBlock", state, result, eventData);
          return result;
        }
      }
      var SingleLineStatements$0 = $TS($S($Q($S($S($E(_), $N(EOS)), Statement, SemicolonDelimiter)), $E($S($S($E(_), $N(EOS)), Statement, $E(SemicolonDelimiter)))), function($skip, $loc, $0, $1, $2) {
        var stmts = $1;
        var last = $2;
        const children = [...stmts];
        if (last)
          children.push(last);
        return {
          type: "BlockStatement",
          expressions: children,
          children,
          bare: true
        };
      });
      function SingleLineStatements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SingleLineStatements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SingleLineStatements", state, SingleLineStatements$0(state));
          if (state.events)
            state.events.exit?.("SingleLineStatements", state, result, eventData);
          return result;
        } else {
          const result = SingleLineStatements$0(state);
          if (state.events)
            state.events.exit?.("SingleLineStatements", state, result, eventData);
          return result;
        }
      }
      var PostfixedSingleLineStatements$0 = $TS($S($Q($S($S($E(_), $N(EOS)), PostfixedStatement, SemicolonDelimiter)), $E($S($S($E(_), $N(EOS)), PostfixedStatement, $E(SemicolonDelimiter)))), function($skip, $loc, $0, $1, $2) {
        var stmts = $1;
        var last = $2;
        const children = [...stmts];
        if (last)
          children.push(last);
        return {
          type: "BlockStatement",
          expressions: children,
          children,
          bare: true
        };
      });
      function PostfixedSingleLineStatements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PostfixedSingleLineStatements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PostfixedSingleLineStatements", state, PostfixedSingleLineStatements$0(state));
          if (state.events)
            state.events.exit?.("PostfixedSingleLineStatements", state, result, eventData);
          return result;
        } else {
          const result = PostfixedSingleLineStatements$0(state);
          if (state.events)
            state.events.exit?.("PostfixedSingleLineStatements", state, result, eventData);
          return result;
        }
      }
      var BracedContent$0 = NestedBlockStatements;
      var BracedContent$1 = $TS($S($E(_), Statement), function($skip, $loc, $0, $1, $2) {
        const expressions = [["", $2]];
        return {
          type: "BlockStatement",
          expressions,
          children: [$1, expressions]
        };
      });
      var BracedContent$2 = $TV($Y($S(__, $EXPECT($L25, fail, 'BracedContent "}"'))), function($skip, $loc, $0, $1) {
        const expressions = [];
        return {
          type: "BlockStatement",
          expressions,
          children: [expressions]
        };
      });
      function BracedContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BracedContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BracedContent", state, BracedContent$0(state) || BracedContent$1(state) || BracedContent$2(state));
          if (state.events)
            state.events.exit?.("BracedContent", state, result, eventData);
          return result;
        } else {
          const result = BracedContent$0(state) || BracedContent$1(state) || BracedContent$2(state);
          if (state.events)
            state.events.exit?.("BracedContent", state, result, eventData);
          return result;
        }
      }
      var NestedBlockStatements$0 = $TS($S(PushIndent, $Q(NestedBlockStatement), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var statements = $2;
        if (!statements.length)
          return $skip;
        statements = statements.flat();
        return {
          type: "BlockStatement",
          expressions: statements,
          children: [statements],
          bare: true
        };
      });
      function NestedBlockStatements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBlockStatements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBlockStatements", state, NestedBlockStatements$0(state));
          if (state.events)
            state.events.exit?.("NestedBlockStatements", state, result, eventData);
          return result;
        } else {
          const result = NestedBlockStatements$0(state);
          if (state.events)
            state.events.exit?.("NestedBlockStatements", state, result, eventData);
          return result;
        }
      }
      var NestedBlockStatement$0 = $TS($S(Nested, $P(BlockStatementPart)), function($skip, $loc, $0, $1, $2) {
        var nested = $1;
        var statements = $2;
        return [
          [nested, ...statements[0]],
          ...statements.slice(1).map((s) => ["", ...s])
        ];
      });
      function NestedBlockStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBlockStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBlockStatement", state, NestedBlockStatement$0(state));
          if (state.events)
            state.events.exit?.("NestedBlockStatement", state, result, eventData);
          return result;
        } else {
          const result = NestedBlockStatement$0(state);
          if (state.events)
            state.events.exit?.("NestedBlockStatement", state, result, eventData);
          return result;
        }
      }
      var BlockStatementPart$0 = $TS($S($N(EOS), $E(_), StatementListItem, StatementDelimiter), function($skip, $loc, $0, $1, $2, $3, $4) {
        var ws = $2;
        var statement = $3;
        var delimiter = $4;
        if (ws) {
          statement = { ...statement, children: [ws, ...statement.children] };
        }
        return [statement, delimiter];
      });
      function BlockStatementPart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BlockStatementPart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BlockStatementPart", state, BlockStatementPart$0(state));
          if (state.events)
            state.events.exit?.("BlockStatementPart", state, result, eventData);
          return result;
        } else {
          const result = BlockStatementPart$0(state);
          if (state.events)
            state.events.exit?.("BlockStatementPart", state, result, eventData);
          return result;
        }
      }
      var Literal$0 = $TS($S(LiteralContent), function($skip, $loc, $0, $1) {
        return {
          type: "Literal",
          subtype: $1.type,
          children: $0,
          raw: $1.token
        };
      });
      function Literal(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Literal", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Literal", state, Literal$0(state));
          if (state.events)
            state.events.exit?.("Literal", state, result, eventData);
          return result;
        } else {
          const result = Literal$0(state);
          if (state.events)
            state.events.exit?.("Literal", state, result, eventData);
          return result;
        }
      }
      var LiteralContent$0 = NullLiteral;
      var LiteralContent$1 = BooleanLiteral;
      var LiteralContent$2 = NumericLiteral;
      var LiteralContent$3 = StringLiteral;
      function LiteralContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LiteralContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LiteralContent", state, LiteralContent$0(state) || LiteralContent$1(state) || LiteralContent$2(state) || LiteralContent$3(state));
          if (state.events)
            state.events.exit?.("LiteralContent", state, result, eventData);
          return result;
        } else {
          const result = LiteralContent$0(state) || LiteralContent$1(state) || LiteralContent$2(state) || LiteralContent$3(state);
          if (state.events)
            state.events.exit?.("LiteralContent", state, result, eventData);
          return result;
        }
      }
      var NullLiteral$0 = $TS($S($EXPECT($L26, fail, 'NullLiteral "null"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function NullLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NullLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NullLiteral", state, NullLiteral$0(state));
          if (state.events)
            state.events.exit?.("NullLiteral", state, result, eventData);
          return result;
        } else {
          const result = NullLiteral$0(state);
          if (state.events)
            state.events.exit?.("NullLiteral", state, result, eventData);
          return result;
        }
      }
      var BooleanLiteral$0 = $T($S(CoffeeBooleansEnabled, CoffeeScriptBooleanLiteral), function(value) {
        return value[1];
      });
      var BooleanLiteral$1 = $TS($S($C($EXPECT($L27, fail, 'BooleanLiteral "true"'), $EXPECT($L28, fail, 'BooleanLiteral "false"')), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function BooleanLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BooleanLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BooleanLiteral", state, BooleanLiteral$0(state) || BooleanLiteral$1(state));
          if (state.events)
            state.events.exit?.("BooleanLiteral", state, result, eventData);
          return result;
        } else {
          const result = BooleanLiteral$0(state) || BooleanLiteral$1(state);
          if (state.events)
            state.events.exit?.("BooleanLiteral", state, result, eventData);
          return result;
        }
      }
      var CoffeeScriptBooleanLiteral$0 = $TS($S($C($EXPECT($L29, fail, 'CoffeeScriptBooleanLiteral "yes"'), $EXPECT($L30, fail, 'CoffeeScriptBooleanLiteral "on"')), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: "true" };
      });
      var CoffeeScriptBooleanLiteral$1 = $TS($S($C($EXPECT($L31, fail, 'CoffeeScriptBooleanLiteral "no"'), $EXPECT($L32, fail, 'CoffeeScriptBooleanLiteral "off"')), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: "false" };
      });
      function CoffeeScriptBooleanLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeScriptBooleanLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeScriptBooleanLiteral", state, CoffeeScriptBooleanLiteral$0(state) || CoffeeScriptBooleanLiteral$1(state));
          if (state.events)
            state.events.exit?.("CoffeeScriptBooleanLiteral", state, result, eventData);
          return result;
        } else {
          const result = CoffeeScriptBooleanLiteral$0(state) || CoffeeScriptBooleanLiteral$1(state);
          if (state.events)
            state.events.exit?.("CoffeeScriptBooleanLiteral", state, result, eventData);
          return result;
        }
      }
      var Identifier$0 = $T($S($N(ReservedWord), IdentifierName), function(value) {
        return value[1];
      });
      function Identifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Identifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Identifier", state, Identifier$0(state));
          if (state.events)
            state.events.exit?.("Identifier", state, result, eventData);
          return result;
        } else {
          const result = Identifier$0(state);
          if (state.events)
            state.events.exit?.("Identifier", state, result, eventData);
          return result;
        }
      }
      var IdentifierName$0 = $TR($EXPECT($R5, fail, "IdentifierName /(?:\\p{ID_Start}|[_$])(?:\\p{ID_Continue}|[\\u200C\\u200D$])*/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return {
          type: "Identifier",
          name: $0,
          names: [$0],
          children: [{
            $loc,
            token: $0
          }]
        };
      });
      function IdentifierName(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IdentifierName", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IdentifierName", state, IdentifierName$0(state));
          if (state.events)
            state.events.exit?.("IdentifierName", state, result, eventData);
          return result;
        } else {
          const result = IdentifierName$0(state);
          if (state.events)
            state.events.exit?.("IdentifierName", state, result, eventData);
          return result;
        }
      }
      var IdentifierReference$0 = Identifier;
      function IdentifierReference(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IdentifierReference", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IdentifierReference", state, IdentifierReference$0(state));
          if (state.events)
            state.events.exit?.("IdentifierReference", state, result, eventData);
          return result;
        } else {
          const result = IdentifierReference$0(state);
          if (state.events)
            state.events.exit?.("IdentifierReference", state, result, eventData);
          return result;
        }
      }
      var UpcomingAssignment$0 = $Y($S(__, $EXPECT($L2, fail, 'UpcomingAssignment "="'), $N($C($EXPECT($L2, fail, 'UpcomingAssignment "="'), $EXPECT($L33, fail, 'UpcomingAssignment ">"')))));
      function UpcomingAssignment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UpcomingAssignment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UpcomingAssignment", state, UpcomingAssignment$0(state));
          if (state.events)
            state.events.exit?.("UpcomingAssignment", state, result, eventData);
          return result;
        } else {
          const result = UpcomingAssignment$0(state);
          if (state.events)
            state.events.exit?.("UpcomingAssignment", state, result, eventData);
          return result;
        }
      }
      var ArrayLiteral$0 = $T($S(ArrayBindingPattern, UpcomingAssignment), function(value) {
        return value[0];
      });
      var ArrayLiteral$1 = $TS($S(OpenBracket, AllowAll, $E($S(ArrayLiteralContent, __, CloseBracket)), RestoreAll), function($skip, $loc, $0, $1, $2, $3, $4) {
        var open = $1;
        if (!$3)
          return $skip;
        const [content, ws, close] = $3;
        if (content.type === "RangeExpression") {
          return {
            ...content,
            children: [...content.children, ...ws]
          };
        }
        let children;
        if (Array.isArray(content)) {
          children = [open, ...content, ...ws, close];
        } else {
          children = [open, content, ...ws, close];
        }
        const names = children.flatMap((c) => {
          return c.names || [];
        });
        return {
          type: "ArrayExpression",
          children,
          names
        };
      });
      function ArrayLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArrayLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArrayLiteral", state, ArrayLiteral$0(state) || ArrayLiteral$1(state));
          if (state.events)
            state.events.exit?.("ArrayLiteral", state, result, eventData);
          return result;
        } else {
          const result = ArrayLiteral$0(state) || ArrayLiteral$1(state);
          if (state.events)
            state.events.exit?.("ArrayLiteral", state, result, eventData);
          return result;
        }
      }
      var RangeExpression$0 = $TS($S(ExtendedExpression, __, $C(DotDotDot, DotDot), ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4) {
        var s = $1;
        var ws = $2;
        var range = $3;
        var e = $4;
        const inclusive = range.token === "..";
        range.token = ",";
        if (s.type === "Literal" && e.type === "Literal") {
          const start = literalValue(s);
          const end = literalValue(e);
          if (typeof start !== typeof end) {
            throw new Error("Range start and end must be of the same type");
          }
          if (typeof start === "string") {
            if (start.length !== 1 || end.length !== 1) {
              throw new Error("String range start and end must be a single character");
            }
            const startCode = start.charCodeAt(0);
            const endCode = end.charCodeAt(0);
            const step = startCode < endCode ? 1 : -1;
            const length = Math.abs(endCode - startCode) + (inclusive ? 1 : 0);
            if (length <= 26) {
              return {
                type: "RangeExpression",
                children: ["[", Array.from({ length }, (_2, i) => JSON.stringify(String.fromCharCode(startCode + i * step))).join(", "), "]"],
                inclusive,
                start: s,
                end: e
              };
            } else {
              const inclusiveAdjust2 = inclusive ? " + 1" : "";
              const children2 = ["((s, e) => {let step = e > s ? 1 : -1; return Array.from({length: Math.abs(e - s)", inclusiveAdjust2, "}, (_, i) => String.fromCharCode(s + i * step))})(", startCode.toString(), ws, range, endCode.toString(), ")"];
              return {
                type: "RangeExpression",
                children: children2,
                inclusive,
                start: s,
                end: e
              };
            }
          } else if (typeof start === "number") {
            const step = end > start ? 1 : -1;
            const length = Math.abs(end - start) + (inclusive ? 1 : 0);
            if (length <= 20) {
              return {
                type: "RangeExpression",
                children: ["[", Array.from({ length }, (_2, i) => start + i * step).join(", "), "]"],
                inclusive,
                start: s,
                end: e
              };
            }
          }
        }
        const inclusiveAdjust = inclusive ? " + 1" : "";
        const children = ["((s, e) => {let step = e > s ? 1 : -1; return Array.from({length: Math.abs(e - s)", inclusiveAdjust, "}, (_, i) => s + i * step)})(", s, ws, range, e, ")"];
        return {
          type: "RangeExpression",
          children,
          inclusive,
          start: s,
          end: e
        };
      });
      function RangeExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RangeExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RangeExpression", state, RangeExpression$0(state));
          if (state.events)
            state.events.exit?.("RangeExpression", state, result, eventData);
          return result;
        } else {
          const result = RangeExpression$0(state);
          if (state.events)
            state.events.exit?.("RangeExpression", state, result, eventData);
          return result;
        }
      }
      var ArrayLiteralContent$0 = RangeExpression;
      var ArrayLiteralContent$1 = $S(NestedImplicitObjectLiteral, $Q($S(__, Comma, NestedImplicitObjectLiteral)));
      var ArrayLiteralContent$2 = NestedElementList;
      var ArrayLiteralContent$3 = $TS($S(ElementListWithIndentedApplicationForbidden, InsertComma, $E(NestedElementList)), function($skip, $loc, $0, $1, $2, $3) {
        var list = $1;
        var comma = $2;
        var nested = $3;
        if (nested) {
          return [...list, comma, ...nested];
        } else {
          return list;
        }
      });
      function ArrayLiteralContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArrayLiteralContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArrayLiteralContent", state, ArrayLiteralContent$0(state) || ArrayLiteralContent$1(state) || ArrayLiteralContent$2(state) || ArrayLiteralContent$3(state));
          if (state.events)
            state.events.exit?.("ArrayLiteralContent", state, result, eventData);
          return result;
        } else {
          const result = ArrayLiteralContent$0(state) || ArrayLiteralContent$1(state) || ArrayLiteralContent$2(state) || ArrayLiteralContent$3(state);
          if (state.events)
            state.events.exit?.("ArrayLiteralContent", state, result, eventData);
          return result;
        }
      }
      var NestedElementList$0 = $TS($S(PushIndent, $Q(NestedElement), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var elements = $2;
        if (elements.length)
          return elements.flat();
        return $skip;
      });
      function NestedElementList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedElementList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedElementList", state, NestedElementList$0(state));
          if (state.events)
            state.events.exit?.("NestedElementList", state, result, eventData);
          return result;
        } else {
          const result = NestedElementList$0(state);
          if (state.events)
            state.events.exit?.("NestedElementList", state, result, eventData);
          return result;
        }
      }
      var NestedElement$0 = $TS($S(Nested, ElementList, ArrayElementDelimiter), function($skip, $loc, $0, $1, $2, $3) {
        var indent = $1;
        var list = $2;
        var delimiter = $3;
        const { length } = list;
        if (length) {
          return list.map((e, i) => {
            if (i === 0 && i === length - 1) {
              return { ...e, children: [indent, ...e.children, delimiter] };
            }
            if (i === 0) {
              return { ...e, children: [indent, ...e.children] };
            }
            if (i === length - 1) {
              return { ...e, children: [...e.children, delimiter] };
            }
            return e;
          });
        }
      });
      function NestedElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedElement", state, NestedElement$0(state));
          if (state.events)
            state.events.exit?.("NestedElement", state, result, eventData);
          return result;
        } else {
          const result = NestedElement$0(state);
          if (state.events)
            state.events.exit?.("NestedElement", state, result, eventData);
          return result;
        }
      }
      var ArrayElementDelimiter$0 = $S(__, Comma);
      var ArrayElementDelimiter$1 = $Y($S(__, $EXPECT($L34, fail, 'ArrayElementDelimiter "]"')));
      var ArrayElementDelimiter$2 = $T($S($Y(EOS), InsertComma), function(value) {
        return value[1];
      });
      function ArrayElementDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArrayElementDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArrayElementDelimiter", state, ArrayElementDelimiter$0(state) || ArrayElementDelimiter$1(state) || ArrayElementDelimiter$2(state));
          if (state.events)
            state.events.exit?.("ArrayElementDelimiter", state, result, eventData);
          return result;
        } else {
          const result = ArrayElementDelimiter$0(state) || ArrayElementDelimiter$1(state) || ArrayElementDelimiter$2(state);
          if (state.events)
            state.events.exit?.("ArrayElementDelimiter", state, result, eventData);
          return result;
        }
      }
      var ElementListWithIndentedApplicationForbidden$0 = $TS($S(ForbidIndentedApplication, $E(ElementList), RestoreIndentedApplication), function($skip, $loc, $0, $1, $2, $3) {
        if ($2)
          return $2;
        return $skip;
      });
      function ElementListWithIndentedApplicationForbidden(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ElementListWithIndentedApplicationForbidden", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ElementListWithIndentedApplicationForbidden", state, ElementListWithIndentedApplicationForbidden$0(state));
          if (state.events)
            state.events.exit?.("ElementListWithIndentedApplicationForbidden", state, result, eventData);
          return result;
        } else {
          const result = ElementListWithIndentedApplicationForbidden$0(state);
          if (state.events)
            state.events.exit?.("ElementListWithIndentedApplicationForbidden", state, result, eventData);
          return result;
        }
      }
      var ElementList$0 = $TS($S(ArrayElementExpression, $Q(ElementListRest)), function($skip, $loc, $0, $1, $2) {
        var first = $1;
        var rest = $2;
        if (rest.length) {
          return [{
            ...first,
            children: [...first.children, rest[0][0]]
          }].concat(rest.map(([_2, e], i) => {
            const delim = rest[i + 1]?.[0];
            return {
              ...e,
              children: [...e.children, delim]
            };
          }));
        }
        return [first];
      });
      function ElementList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ElementList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ElementList", state, ElementList$0(state));
          if (state.events)
            state.events.exit?.("ElementList", state, result, eventData);
          return result;
        } else {
          const result = ElementList$0(state);
          if (state.events)
            state.events.exit?.("ElementList", state, result, eventData);
          return result;
        }
      }
      var ElementListRest$0 = $S($S(__, Comma), ArrayElementExpression);
      function ElementListRest(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ElementListRest", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ElementListRest", state, ElementListRest$0(state));
          if (state.events)
            state.events.exit?.("ElementListRest", state, result, eventData);
          return result;
        } else {
          const result = ElementListRest$0(state);
          if (state.events)
            state.events.exit?.("ElementListRest", state, result, eventData);
          return result;
        }
      }
      var ArrayElementExpression$0 = JSXTag;
      var ArrayElementExpression$1 = $TS($S($E(ExtendedExpression), __, DotDotDot, $Y(ArrayElementDelimiter)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var exp = $1;
        var ws = $2;
        var dots = $3;
        if (!exp) {
          exp = {
            type: "Ref",
            base: "ref",
            id: "ref",
            names: []
          };
        }
        return {
          type: "SpreadElement",
          children: [...ws, dots, exp],
          names: exp.names
        };
      });
      var ArrayElementExpression$2 = $TS($S($E($S($E($S(__, DotDotDot, __)), ExtendedExpression)), $Y(ArrayElementDelimiter)), function($skip, $loc, $0, $1, $2) {
        var expMaybeSpread = $1;
        if (expMaybeSpread) {
          const [spread, exp] = expMaybeSpread;
          if (!spread) {
            return {
              type: "ArrayElement",
              children: [exp],
              names: exp.names
            };
          } else {
            return {
              type: "SpreadElement",
              children: [...spread, exp],
              names: exp.names
            };
          }
        }
        return {
          type: "ElisionElement",
          children: []
        };
      });
      function ArrayElementExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ArrayElementExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ArrayElementExpression", state, ArrayElementExpression$0(state) || ArrayElementExpression$1(state) || ArrayElementExpression$2(state));
          if (state.events)
            state.events.exit?.("ArrayElementExpression", state, result, eventData);
          return result;
        } else {
          const result = ArrayElementExpression$0(state) || ArrayElementExpression$1(state) || ArrayElementExpression$2(state);
          if (state.events)
            state.events.exit?.("ArrayElementExpression", state, result, eventData);
          return result;
        }
      }
      var ObjectLiteral$0 = $T($S(ObjectBindingPattern, UpcomingAssignment), function(value) {
        return value[0];
      });
      var ObjectLiteral$1 = BracedObjectLiteral;
      var ObjectLiteral$2 = NestedImplicitObjectLiteral;
      var ObjectLiteral$3 = InlineObjectLiteral;
      function ObjectLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ObjectLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ObjectLiteral", state, ObjectLiteral$0(state) || ObjectLiteral$1(state) || ObjectLiteral$2(state) || ObjectLiteral$3(state));
          if (state.events)
            state.events.exit?.("ObjectLiteral", state, result, eventData);
          return result;
        } else {
          const result = ObjectLiteral$0(state) || ObjectLiteral$1(state) || ObjectLiteral$2(state) || ObjectLiteral$3(state);
          if (state.events)
            state.events.exit?.("ObjectLiteral", state, result, eventData);
          return result;
        }
      }
      var BracedObjectLiteral$0 = $TS($S(OpenBrace, AllowAll, $E($S($E(BracedObjectLiteralContent), __, CloseBrace)), RestoreAll), function($skip, $loc, $0, $1, $2, $3, $4) {
        var open = $1;
        if (!$3)
          return $skip;
        const [properties, ...close] = $3;
        if (properties) {
          const children = [open, ...properties, close];
          return {
            type: "ObjectExpression",
            children,
            names: children.flatMap((c) => {
              return c.names || [];
            }),
            properties
          };
        }
        return {
          type: "ObjectExpression",
          children: [open, close],
          names: []
        };
      });
      function BracedObjectLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BracedObjectLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BracedObjectLiteral", state, BracedObjectLiteral$0(state));
          if (state.events)
            state.events.exit?.("BracedObjectLiteral", state, result, eventData);
          return result;
        } else {
          const result = BracedObjectLiteral$0(state);
          if (state.events)
            state.events.exit?.("BracedObjectLiteral", state, result, eventData);
          return result;
        }
      }
      var BracedObjectLiteralContent$0 = NestedPropertyDefinitions;
      var BracedObjectLiteralContent$1 = PropertyDefinitionList;
      function BracedObjectLiteralContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BracedObjectLiteralContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BracedObjectLiteralContent", state, BracedObjectLiteralContent$0(state) || BracedObjectLiteralContent$1(state));
          if (state.events)
            state.events.exit?.("BracedObjectLiteralContent", state, result, eventData);
          return result;
        } else {
          const result = BracedObjectLiteralContent$0(state) || BracedObjectLiteralContent$1(state);
          if (state.events)
            state.events.exit?.("BracedObjectLiteralContent", state, result, eventData);
          return result;
        }
      }
      var NestedImplicitObjectLiteral$0 = $TS($S(InsertOpenBrace, NestedImplicitPropertyDefinitions, InsertNewline, InsertIndent, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        return {
          type: "ObjectExpression",
          children: [$1, ...$2, $3, $4, $5]
        };
      });
      function NestedImplicitObjectLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedImplicitObjectLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedImplicitObjectLiteral", state, NestedImplicitObjectLiteral$0(state));
          if (state.events)
            state.events.exit?.("NestedImplicitObjectLiteral", state, result, eventData);
          return result;
        } else {
          const result = NestedImplicitObjectLiteral$0(state);
          if (state.events)
            state.events.exit?.("NestedImplicitObjectLiteral", state, result, eventData);
          return result;
        }
      }
      var NestedImplicitPropertyDefinitions$0 = $TS($S(PushIndent, $Q(NestedImplicitPropertyDefinition), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var defs = $2;
        if (!defs.length)
          return $skip;
        return defs.flat();
      });
      function NestedImplicitPropertyDefinitions(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedImplicitPropertyDefinitions", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedImplicitPropertyDefinitions", state, NestedImplicitPropertyDefinitions$0(state));
          if (state.events)
            state.events.exit?.("NestedImplicitPropertyDefinitions", state, result, eventData);
          return result;
        } else {
          const result = NestedImplicitPropertyDefinitions$0(state);
          if (state.events)
            state.events.exit?.("NestedImplicitPropertyDefinitions", state, result, eventData);
          return result;
        }
      }
      var NestedImplicitPropertyDefinition$0 = $TS($S(Nested, ImplicitNamedProperty, ObjectPropertyDelimiter), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var prop = $2;
        var delimiter = $3;
        return {
          ...prop,
          children: [...ws, ...prop.children, delimiter]
        };
      });
      function NestedImplicitPropertyDefinition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedImplicitPropertyDefinition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedImplicitPropertyDefinition", state, NestedImplicitPropertyDefinition$0(state));
          if (state.events)
            state.events.exit?.("NestedImplicitPropertyDefinition", state, result, eventData);
          return result;
        } else {
          const result = NestedImplicitPropertyDefinition$0(state);
          if (state.events)
            state.events.exit?.("NestedImplicitPropertyDefinition", state, result, eventData);
          return result;
        }
      }
      var NestedPropertyDefinitions$0 = $TS($S(PushIndent, $Q(NestedPropertyDefinition), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var defs = $2;
        if (!defs.length)
          return $skip;
        return defs.flat();
      });
      function NestedPropertyDefinitions(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedPropertyDefinitions", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedPropertyDefinitions", state, NestedPropertyDefinitions$0(state));
          if (state.events)
            state.events.exit?.("NestedPropertyDefinitions", state, result, eventData);
          return result;
        } else {
          const result = NestedPropertyDefinitions$0(state);
          if (state.events)
            state.events.exit?.("NestedPropertyDefinitions", state, result, eventData);
          return result;
        }
      }
      var NestedPropertyDefinition$0 = $TS($S(Nested, $P($S(PropertyDefinition, ObjectPropertyDelimiter))), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        var inlineProps = $2;
        return inlineProps.map(([prop, delimiter], i) => ({
          ...prop,
          children: [...i === 0 ? ws : [], ...prop.children, delimiter]
        }));
      });
      function NestedPropertyDefinition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedPropertyDefinition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedPropertyDefinition", state, NestedPropertyDefinition$0(state));
          if (state.events)
            state.events.exit?.("NestedPropertyDefinition", state, result, eventData);
          return result;
        } else {
          const result = NestedPropertyDefinition$0(state);
          if (state.events)
            state.events.exit?.("NestedPropertyDefinition", state, result, eventData);
          return result;
        }
      }
      var InlineObjectLiteral$0 = $TS($S(InsertInlineOpenBrace, SnugNamedProperty, $Q($S(ImplicitInlineObjectPropertyDelimiter, ImplicitNamedProperty)), $E($S($E(_), Comma, $Y(Dedented))), InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var open = $1;
        var first = $2;
        var rest = $3;
        var trailing = $4;
        var close = $5;
        return {
          type: "ObjectExpression",
          children: [open, first, ...rest, trailing, close]
        };
      });
      function InlineObjectLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineObjectLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineObjectLiteral", state, InlineObjectLiteral$0(state));
          if (state.events)
            state.events.exit?.("InlineObjectLiteral", state, result, eventData);
          return result;
        } else {
          const result = InlineObjectLiteral$0(state);
          if (state.events)
            state.events.exit?.("InlineObjectLiteral", state, result, eventData);
          return result;
        }
      }
      var ImplicitInlineObjectPropertyDelimiter$0 = $S($E(_), Comma, $C(NotDedented, $E(_)));
      var ImplicitInlineObjectPropertyDelimiter$1 = $T($S($Y($S(Samedent, ImplicitNamedProperty)), InsertComma, $C(Samedent, $E(_))), function(value) {
        return [value[1], value[2]];
      });
      function ImplicitInlineObjectPropertyDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplicitInlineObjectPropertyDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplicitInlineObjectPropertyDelimiter", state, ImplicitInlineObjectPropertyDelimiter$0(state) || ImplicitInlineObjectPropertyDelimiter$1(state));
          if (state.events)
            state.events.exit?.("ImplicitInlineObjectPropertyDelimiter", state, result, eventData);
          return result;
        } else {
          const result = ImplicitInlineObjectPropertyDelimiter$0(state) || ImplicitInlineObjectPropertyDelimiter$1(state);
          if (state.events)
            state.events.exit?.("ImplicitInlineObjectPropertyDelimiter", state, result, eventData);
          return result;
        }
      }
      var ObjectPropertyDelimiter$0 = $S($E(_), Comma);
      var ObjectPropertyDelimiter$1 = $Y($S(__, $EXPECT($L25, fail, 'ObjectPropertyDelimiter "}"')));
      var ObjectPropertyDelimiter$2 = $T($S($Y(EOS), InsertComma), function(value) {
        return value[1];
      });
      function ObjectPropertyDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ObjectPropertyDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ObjectPropertyDelimiter", state, ObjectPropertyDelimiter$0(state) || ObjectPropertyDelimiter$1(state) || ObjectPropertyDelimiter$2(state));
          if (state.events)
            state.events.exit?.("ObjectPropertyDelimiter", state, result, eventData);
          return result;
        } else {
          const result = ObjectPropertyDelimiter$0(state) || ObjectPropertyDelimiter$1(state) || ObjectPropertyDelimiter$2(state);
          if (state.events)
            state.events.exit?.("ObjectPropertyDelimiter", state, result, eventData);
          return result;
        }
      }
      var PropertyDefinitionList$0 = $TV($P($S(PropertyDefinition, ObjectPropertyDelimiter)), function($skip, $loc, $0, $1) {
        return $0.map(([prop, delim]) => {
          return {
            ...prop,
            delim,
            children: [...prop.children, delim]
          };
        });
      });
      function PropertyDefinitionList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PropertyDefinitionList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PropertyDefinitionList", state, PropertyDefinitionList$0(state));
          if (state.events)
            state.events.exit?.("PropertyDefinitionList", state, result, eventData);
          return result;
        } else {
          const result = PropertyDefinitionList$0(state);
          if (state.events)
            state.events.exit?.("PropertyDefinitionList", state, result, eventData);
          return result;
        }
      }
      var PropertyDefinition$0 = $TS($S(__, AtThis, IdentifierReference), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var at = $2;
        var id = $3;
        const value = [at, ".", id];
        return {
          type: "Property",
          children: [ws, id, ": ", ...value],
          name: id,
          names: id.names,
          value
        };
      });
      var PropertyDefinition$1 = $TS($S(__, NamedProperty), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        var prop = $2;
        return {
          ...prop,
          children: [ws, ...prop.children]
        };
      });
      var PropertyDefinition$2 = $TS($S(__, $TEXT($EXPECT($R6, fail, "PropertyDefinition /[!+-]/")), PropertyName), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var toggle = $2;
        var id = $3;
        const value = toggle === "+" ? "true" : "false";
        return {
          type: "Property",
          children: [ws, id, ": ", value],
          name: id,
          names: id.names,
          value
        };
      });
      var PropertyDefinition$3 = $TS($S(__, MethodDefinition), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        var def = $2;
        if (!def.block || def.block.empty)
          return $skip;
        return {
          ...def,
          children: [ws, ...def.children]
        };
      });
      var PropertyDefinition$4 = $TS($S(__, DotDotDot, ExtendedExpression), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var dots = $2;
        var exp = $3;
        return {
          type: "SpreadProperty",
          children: [ws, dots, exp],
          names: exp.names,
          dots,
          value: exp
        };
      });
      var PropertyDefinition$5 = $TS($S(__, CallExpression), function($skip, $loc, $0, $1, $2) {
        var ws = $1;
        var value = $2;
        if (value.type === "Identifier") {
          return { ...value, children: [ws, ...value.children] };
        }
        const last = lastAccessInCallExpression(value);
        if (!last)
          return $skip;
        let name, hoistDec, ref, refAssignment;
        const { expression, type } = last;
        if (type === "Index") {
          ref = maybeRef(expression);
          if (ref !== expression) {
            hoistDec = {
              type: "Declaration",
              children: ["let ", ref]
            };
            refAssignment = {
              type: "Assignment",
              children: [ref, " = ", expression]
            };
            name = {
              type: "ComputedPropertyName",
              children: [last.children[0], "(", refAssignment, ",", ref, ")", ...last.children.slice(-2)]
            };
            value = {
              ...value,
              children: value.children.map((c) => {
                if (c === last)
                  return {
                    type: "Index",
                    children: ["[", ref, "]"]
                  };
                return c;
              })
            };
          } else {
            name = {
              type: "ComputedPropertyName",
              children: last.children
            };
          }
        } else {
          ({ name } = last);
          if (!name)
            return $skip;
        }
        return {
          type: "Property",
          children: [ws, name, ": ", value],
          name,
          value,
          names: [],
          hoistDec
        };
      });
      function PropertyDefinition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PropertyDefinition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PropertyDefinition", state, PropertyDefinition$0(state) || PropertyDefinition$1(state) || PropertyDefinition$2(state) || PropertyDefinition$3(state) || PropertyDefinition$4(state) || PropertyDefinition$5(state));
          if (state.events)
            state.events.exit?.("PropertyDefinition", state, result, eventData);
          return result;
        } else {
          const result = PropertyDefinition$0(state) || PropertyDefinition$1(state) || PropertyDefinition$2(state) || PropertyDefinition$3(state) || PropertyDefinition$4(state) || PropertyDefinition$5(state);
          if (state.events)
            state.events.exit?.("PropertyDefinition", state, result, eventData);
          return result;
        }
      }
      var NamedProperty$0 = $TS($S(PropertyName, $E(_), Colon, ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4) {
        var name = $1;
        var exp = $4;
        return {
          type: "Property",
          children: $0,
          name,
          names: exp.names || [],
          value: exp
        };
      });
      function NamedProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NamedProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NamedProperty", state, NamedProperty$0(state));
          if (state.events)
            state.events.exit?.("NamedProperty", state, result, eventData);
          return result;
        } else {
          const result = NamedProperty$0(state);
          if (state.events)
            state.events.exit?.("NamedProperty", state, result, eventData);
          return result;
        }
      }
      var ImplicitNamedProperty$0 = $TS($S(PropertyName, $E(_), Colon, $C(MultiLineImplicitObjectLiteralAllowed, $N(EOS)), ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var name = $1;
        var exp = $5;
        return {
          type: "Property",
          children: $0,
          name,
          names: exp.names || [],
          value: exp
        };
      });
      function ImplicitNamedProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplicitNamedProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplicitNamedProperty", state, ImplicitNamedProperty$0(state));
          if (state.events)
            state.events.exit?.("ImplicitNamedProperty", state, result, eventData);
          return result;
        } else {
          const result = ImplicitNamedProperty$0(state);
          if (state.events)
            state.events.exit?.("ImplicitNamedProperty", state, result, eventData);
          return result;
        }
      }
      var SnugNamedProperty$0 = $TS($S(PropertyName, Colon, $C(MultiLineImplicitObjectLiteralAllowed, $N(EOS)), ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4) {
        var exp = $4;
        return {
          type: "Property",
          children: $0,
          names: exp.names || []
        };
      });
      function SnugNamedProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SnugNamedProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SnugNamedProperty", state, SnugNamedProperty$0(state));
          if (state.events)
            state.events.exit?.("SnugNamedProperty", state, result, eventData);
          return result;
        } else {
          const result = SnugNamedProperty$0(state);
          if (state.events)
            state.events.exit?.("SnugNamedProperty", state, result, eventData);
          return result;
        }
      }
      var PropertyName$0 = NumericLiteral;
      var PropertyName$1 = ComputedPropertyName;
      var PropertyName$2 = StringLiteral;
      var PropertyName$3 = IdentifierName;
      function PropertyName(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PropertyName", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PropertyName", state, PropertyName$0(state) || PropertyName$1(state) || PropertyName$2(state) || PropertyName$3(state));
          if (state.events)
            state.events.exit?.("PropertyName", state, result, eventData);
          return result;
        } else {
          const result = PropertyName$0(state) || PropertyName$1(state) || PropertyName$2(state) || PropertyName$3(state);
          if (state.events)
            state.events.exit?.("PropertyName", state, result, eventData);
          return result;
        }
      }
      var ComputedPropertyName$0 = $TS($S(OpenBracket, PostfixedExpression, __, CloseBracket), function($skip, $loc, $0, $1, $2, $3, $4) {
        var expression = $2;
        return {
          type: "ComputedPropertyName",
          children: $0,
          expression
        };
      });
      var ComputedPropertyName$1 = $TS($S(InsertOpenBracket, TemplateLiteral, InsertCloseBracket), function($skip, $loc, $0, $1, $2, $3) {
        var expression = $2;
        if ($2.type === "StringLiteral")
          return $2;
        return {
          type: "ComputedPropertyName",
          children: $0,
          expression
        };
      });
      var ComputedPropertyName$2 = $TS($S(InsertOpenBracket, $EXPECT($L19, fail, 'ComputedPropertyName "-"'), NumericLiteral, InsertCloseBracket), function($skip, $loc, $0, $1, $2, $3, $4) {
        return {
          type: "ComputedPropertyName",
          children: $0
        };
      });
      function ComputedPropertyName(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ComputedPropertyName", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ComputedPropertyName", state, ComputedPropertyName$0(state) || ComputedPropertyName$1(state) || ComputedPropertyName$2(state));
          if (state.events)
            state.events.exit?.("ComputedPropertyName", state, result, eventData);
          return result;
        } else {
          const result = ComputedPropertyName$0(state) || ComputedPropertyName$1(state) || ComputedPropertyName$2(state);
          if (state.events)
            state.events.exit?.("ComputedPropertyName", state, result, eventData);
          return result;
        }
      }
      var Decorator$0 = $S(AtAt, CallExpression);
      function Decorator(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Decorator", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Decorator", state, Decorator$0(state));
          if (state.events)
            state.events.exit?.("Decorator", state, result, eventData);
          return result;
        } else {
          const result = Decorator$0(state);
          if (state.events)
            state.events.exit?.("Decorator", state, result, eventData);
          return result;
        }
      }
      var Decorators$0 = $TS($S(ForbidClassImplicitCall, $Q($S(__, Decorator)), __, RestoreClassImplicitCall), function($skip, $loc, $0, $1, $2, $3, $4) {
        var decorators = $2;
        if (!decorators.length)
          return $skip;
        return $0;
      });
      function Decorators(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Decorators", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Decorators", state, Decorators$0(state));
          if (state.events)
            state.events.exit?.("Decorators", state, result, eventData);
          return result;
        } else {
          const result = Decorators$0(state);
          if (state.events)
            state.events.exit?.("Decorators", state, result, eventData);
          return result;
        }
      }
      var MethodDefinition$0 = $TS($S(Abstract, __, MethodSignature), function($skip, $loc, $0, $1, $2, $3) {
        var signature = $3;
        return {
          type: "MethodDefinition",
          children: $0,
          name: signature.name,
          abstract: true,
          signature,
          parameters: signature.parameters,
          ts: true
        };
      });
      var MethodDefinition$1 = $TS($S(MethodSignature, $N(PropertyAccess), $E(BracedBlock)), function($skip, $loc, $0, $1, $2, $3) {
        var signature = $1;
        var block = $3;
        let children = $0;
        let generatorPos = 0;
        const { modifier } = signature;
        if (hasAwait(block)) {
          generatorPos++;
          children = children.slice();
          if (modifier?.get || modifier?.set) {
            children.push({
              type: "Error",
              message: "Getters and setters cannot be async"
            });
          } else if (modifier?.async) {
          } else {
            children.unshift("async ");
          }
        }
        if (hasYield(block)) {
          if (children === $0)
            children = children.slice();
          if (modifier?.get || modifier?.set) {
            children.push({
              type: "Error",
              message: "Getters and setters cannot be generators"
            });
          } else if (modifier?.generator) {
          } else {
            children.splice(generatorPos, 0, "*");
          }
        }
        return {
          type: "MethodDefinition",
          children,
          name: signature.name,
          signature,
          block,
          parameters: signature.parameters
        };
      });
      function MethodDefinition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MethodDefinition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MethodDefinition", state, MethodDefinition$0(state) || MethodDefinition$1(state));
          if (state.events)
            state.events.exit?.("MethodDefinition", state, result, eventData);
          return result;
        } else {
          const result = MethodDefinition$0(state) || MethodDefinition$1(state);
          if (state.events)
            state.events.exit?.("MethodDefinition", state, result, eventData);
          return result;
        }
      }
      var MethodModifier$0 = $TS($S(GetOrSet, $E(_), $Y(ClassElementName)), function($skip, $loc, $0, $1, $2, $3) {
        var kind = $1;
        return {
          type: "MethodModifier",
          async: false,
          generator: false,
          get: kind.token === "get",
          set: kind.token === "set",
          children: $0
        };
      });
      var MethodModifier$1 = $TS($S($S(Async, __), $E($S(Star, __))), function($skip, $loc, $0, $1, $2) {
        return {
          type: "MethodModifier",
          async: true,
          get: false,
          set: false,
          generator: !!$1,
          children: $0
        };
      });
      var MethodModifier$2 = $TS($S(Star, __), function($skip, $loc, $0, $1, $2) {
        return {
          type: "MethodModifier",
          async: false,
          get: false,
          set: false,
          generator: true,
          children: $0
        };
      });
      function MethodModifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MethodModifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MethodModifier", state, MethodModifier$0(state) || MethodModifier$1(state) || MethodModifier$2(state));
          if (state.events)
            state.events.exit?.("MethodModifier", state, result, eventData);
          return result;
        } else {
          const result = MethodModifier$0(state) || MethodModifier$1(state) || MethodModifier$2(state);
          if (state.events)
            state.events.exit?.("MethodModifier", state, result, eventData);
          return result;
        }
      }
      var MethodSignature$0 = $TS($S(ConstructorShorthand, NonEmptyParameters), function($skip, $loc, $0, $1, $2) {
        var parameters = $2;
        return {
          type: "MethodSignature",
          children: $0,
          name: $1.token,
          returnType: void 0,
          parameters
        };
      });
      var MethodSignature$1 = $TS($S($E(MethodModifier), ClassElementName, $E(_), NonEmptyParameters, $E(ReturnTypeSuffix)), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var modifier = $1;
        var name = $2;
        var parameters = $4;
        var returnType = $5;
        if (name.name) {
          name = name.name;
        } else if (name.token) {
          name = name.token.match(/^(?:"|')/) ? name.token.slice(1, -1) : name.token;
        }
        return {
          type: "MethodSignature",
          children: $0,
          name,
          modifier,
          returnType,
          parameters
        };
      });
      function MethodSignature(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MethodSignature", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MethodSignature", state, MethodSignature$0(state) || MethodSignature$1(state));
          if (state.events)
            state.events.exit?.("MethodSignature", state, result, eventData);
          return result;
        } else {
          const result = MethodSignature$0(state) || MethodSignature$1(state);
          if (state.events)
            state.events.exit?.("MethodSignature", state, result, eventData);
          return result;
        }
      }
      var ClassElementName$0 = PropertyName;
      var ClassElementName$1 = PrivateIdentifier;
      function ClassElementName(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassElementName", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassElementName", state, ClassElementName$0(state) || ClassElementName$1(state));
          if (state.events)
            state.events.exit?.("ClassElementName", state, result, eventData);
          return result;
        } else {
          const result = ClassElementName$0(state) || ClassElementName$1(state);
          if (state.events)
            state.events.exit?.("ClassElementName", state, result, eventData);
          return result;
        }
      }
      var PrivateIdentifier$0 = $TV($TEXT($S($EXPECT($L14, fail, 'PrivateIdentifier "#"'), IdentifierName)), function($skip, $loc, $0, $1) {
        return {
          type: "Identifier",
          name: $0,
          names: [$0],
          children: [{
            $loc,
            token: $0
          }]
        };
      });
      function PrivateIdentifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PrivateIdentifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PrivateIdentifier", state, PrivateIdentifier$0(state));
          if (state.events)
            state.events.exit?.("PrivateIdentifier", state, result, eventData);
          return result;
        } else {
          const result = PrivateIdentifier$0(state);
          if (state.events)
            state.events.exit?.("PrivateIdentifier", state, result, eventData);
          return result;
        }
      }
      var WAssignmentOp$0 = $S(__, AssignmentOp);
      var WAssignmentOp$1 = $S(_, OperatorAssignmentOp);
      function WAssignmentOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("WAssignmentOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("WAssignmentOp", state, WAssignmentOp$0(state) || WAssignmentOp$1(state));
          if (state.events)
            state.events.exit?.("WAssignmentOp", state, result, eventData);
          return result;
        } else {
          const result = WAssignmentOp$0(state) || WAssignmentOp$1(state);
          if (state.events)
            state.events.exit?.("WAssignmentOp", state, result, eventData);
          return result;
        }
      }
      var AssignmentOp$0 = $TS($S(AssignmentOpSymbol, $E(_)), function($skip, $loc, $0, $1, $2) {
        if ($2?.length) {
          return {
            token: $1,
            children: [$1, ...$2]
          };
        }
        return { $loc, token: $1 };
      });
      function AssignmentOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AssignmentOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AssignmentOp", state, AssignmentOp$0(state));
          if (state.events)
            state.events.exit?.("AssignmentOp", state, result, eventData);
          return result;
        } else {
          const result = AssignmentOp$0(state);
          if (state.events)
            state.events.exit?.("AssignmentOp", state, result, eventData);
          return result;
        }
      }
      var OperatorAssignmentOp$0 = $TS($S(Xor, $EXPECT($L2, fail, 'OperatorAssignmentOp "="'), $Y(Whitespace), $E(_)), function($skip, $loc, $0, $1, $2, $3, $4) {
        return {
          special: true,
          call: module.getRef("xor"),
          children: [$2, ...$4]
        };
      });
      var OperatorAssignmentOp$1 = $TS($S(Xnor, $EXPECT($L2, fail, 'OperatorAssignmentOp "="'), $Y(Whitespace), $E(_)), function($skip, $loc, $0, $1, $2, $3, $4) {
        return {
          special: true,
          call: module.getRef("xnor"),
          children: [$2, ...$4]
        };
      });
      var OperatorAssignmentOp$2 = $TS($S(Identifier, $EXPECT($L2, fail, 'OperatorAssignmentOp "="'), $Y(Whitespace), $E(_)), function($skip, $loc, $0, $1, $2, $3, $4) {
        return {
          special: true,
          call: $1,
          children: [$2, ...$4]
        };
      });
      function OperatorAssignmentOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OperatorAssignmentOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OperatorAssignmentOp", state, OperatorAssignmentOp$0(state) || OperatorAssignmentOp$1(state) || OperatorAssignmentOp$2(state));
          if (state.events)
            state.events.exit?.("OperatorAssignmentOp", state, result, eventData);
          return result;
        } else {
          const result = OperatorAssignmentOp$0(state) || OperatorAssignmentOp$1(state) || OperatorAssignmentOp$2(state);
          if (state.events)
            state.events.exit?.("OperatorAssignmentOp", state, result, eventData);
          return result;
        }
      }
      var AssignmentOpSymbol$0 = $EXPECT($L35, fail, 'AssignmentOpSymbol "**="');
      var AssignmentOpSymbol$1 = $EXPECT($L36, fail, 'AssignmentOpSymbol "*="');
      var AssignmentOpSymbol$2 = $EXPECT($L37, fail, 'AssignmentOpSymbol "/="');
      var AssignmentOpSymbol$3 = $EXPECT($L38, fail, 'AssignmentOpSymbol "%="');
      var AssignmentOpSymbol$4 = $EXPECT($L39, fail, 'AssignmentOpSymbol "+="');
      var AssignmentOpSymbol$5 = $EXPECT($L40, fail, 'AssignmentOpSymbol "-="');
      var AssignmentOpSymbol$6 = $EXPECT($L41, fail, 'AssignmentOpSymbol "<<="');
      var AssignmentOpSymbol$7 = $EXPECT($L42, fail, 'AssignmentOpSymbol ">>>="');
      var AssignmentOpSymbol$8 = $EXPECT($L43, fail, 'AssignmentOpSymbol ">>="');
      var AssignmentOpSymbol$9 = $EXPECT($L44, fail, 'AssignmentOpSymbol "&&="');
      var AssignmentOpSymbol$10 = $EXPECT($L45, fail, 'AssignmentOpSymbol "&="');
      var AssignmentOpSymbol$11 = $EXPECT($L46, fail, 'AssignmentOpSymbol "^="');
      var AssignmentOpSymbol$12 = $EXPECT($L47, fail, 'AssignmentOpSymbol "||="');
      var AssignmentOpSymbol$13 = $EXPECT($L48, fail, 'AssignmentOpSymbol "|="');
      var AssignmentOpSymbol$14 = $EXPECT($L49, fail, 'AssignmentOpSymbol "??="');
      var AssignmentOpSymbol$15 = $T($EXPECT($L50, fail, 'AssignmentOpSymbol "?="'), function(value) {
        return "??=";
      });
      var AssignmentOpSymbol$16 = $T($S($EXPECT($L2, fail, 'AssignmentOpSymbol "="'), $N($EXPECT($L2, fail, 'AssignmentOpSymbol "="'))), function(value) {
        return value[0];
      });
      var AssignmentOpSymbol$17 = $T($S(CoffeeWordAssignmentOp), function(value) {
        return value[0];
      });
      function AssignmentOpSymbol(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AssignmentOpSymbol", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AssignmentOpSymbol", state, AssignmentOpSymbol$0(state) || AssignmentOpSymbol$1(state) || AssignmentOpSymbol$2(state) || AssignmentOpSymbol$3(state) || AssignmentOpSymbol$4(state) || AssignmentOpSymbol$5(state) || AssignmentOpSymbol$6(state) || AssignmentOpSymbol$7(state) || AssignmentOpSymbol$8(state) || AssignmentOpSymbol$9(state) || AssignmentOpSymbol$10(state) || AssignmentOpSymbol$11(state) || AssignmentOpSymbol$12(state) || AssignmentOpSymbol$13(state) || AssignmentOpSymbol$14(state) || AssignmentOpSymbol$15(state) || AssignmentOpSymbol$16(state) || AssignmentOpSymbol$17(state));
          if (state.events)
            state.events.exit?.("AssignmentOpSymbol", state, result, eventData);
          return result;
        } else {
          const result = AssignmentOpSymbol$0(state) || AssignmentOpSymbol$1(state) || AssignmentOpSymbol$2(state) || AssignmentOpSymbol$3(state) || AssignmentOpSymbol$4(state) || AssignmentOpSymbol$5(state) || AssignmentOpSymbol$6(state) || AssignmentOpSymbol$7(state) || AssignmentOpSymbol$8(state) || AssignmentOpSymbol$9(state) || AssignmentOpSymbol$10(state) || AssignmentOpSymbol$11(state) || AssignmentOpSymbol$12(state) || AssignmentOpSymbol$13(state) || AssignmentOpSymbol$14(state) || AssignmentOpSymbol$15(state) || AssignmentOpSymbol$16(state) || AssignmentOpSymbol$17(state);
          if (state.events)
            state.events.exit?.("AssignmentOpSymbol", state, result, eventData);
          return result;
        }
      }
      var CoffeeWordAssignmentOp$0 = $T($EXPECT($L51, fail, 'CoffeeWordAssignmentOp "and="'), function(value) {
        return "&&=";
      });
      var CoffeeWordAssignmentOp$1 = $T($EXPECT($L52, fail, 'CoffeeWordAssignmentOp "or="'), function(value) {
        return "||=";
      });
      function CoffeeWordAssignmentOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeWordAssignmentOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeWordAssignmentOp", state, CoffeeWordAssignmentOp$0(state) || CoffeeWordAssignmentOp$1(state));
          if (state.events)
            state.events.exit?.("CoffeeWordAssignmentOp", state, result, eventData);
          return result;
        } else {
          const result = CoffeeWordAssignmentOp$0(state) || CoffeeWordAssignmentOp$1(state);
          if (state.events)
            state.events.exit?.("CoffeeWordAssignmentOp", state, result, eventData);
          return result;
        }
      }
      var BinaryOp$0 = $TS($S(BinaryOpSymbol), function($skip, $loc, $0, $1) {
        if (typeof $1 === "string")
          return { $loc, token: $1 };
        return $1;
      });
      var BinaryOp$1 = $TV(Identifier, function($skip, $loc, $0, $1) {
        var id = $0;
        if (!module.operators.has(id.name))
          return $skip;
        return {
          call: id,
          special: true
        };
      });
      var BinaryOp$2 = $TS($S(Not, __, Identifier), function($skip, $loc, $0, $1, $2, $3) {
        var id = $3;
        if (!module.operators.has(id.name))
          return $skip;
        return {
          call: id,
          special: true,
          negated: true
        };
      });
      function BinaryOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BinaryOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BinaryOp", state, BinaryOp$0(state) || BinaryOp$1(state) || BinaryOp$2(state));
          if (state.events)
            state.events.exit?.("BinaryOp", state, result, eventData);
          return result;
        } else {
          const result = BinaryOp$0(state) || BinaryOp$1(state) || BinaryOp$2(state);
          if (state.events)
            state.events.exit?.("BinaryOp", state, result, eventData);
          return result;
        }
      }
      var BinaryOpSymbol$0 = $EXPECT($L53, fail, 'BinaryOpSymbol "**"');
      var BinaryOpSymbol$1 = $EXPECT($L54, fail, 'BinaryOpSymbol "*"');
      var BinaryOpSymbol$2 = $EXPECT($L55, fail, 'BinaryOpSymbol "/"');
      var BinaryOpSymbol$3 = $TV($EXPECT($L56, fail, 'BinaryOpSymbol "%%"'), function($skip, $loc, $0, $1) {
        return {
          call: module.getRef("modulo"),
          special: true
        };
      });
      var BinaryOpSymbol$4 = $EXPECT($L57, fail, 'BinaryOpSymbol "%"');
      var BinaryOpSymbol$5 = $EXPECT($L58, fail, 'BinaryOpSymbol "+"');
      var BinaryOpSymbol$6 = $EXPECT($L19, fail, 'BinaryOpSymbol "-"');
      var BinaryOpSymbol$7 = $EXPECT($L59, fail, 'BinaryOpSymbol "<="');
      var BinaryOpSymbol$8 = $T($EXPECT($L60, fail, 'BinaryOpSymbol "\u2264"'), function(value) {
        return "<=";
      });
      var BinaryOpSymbol$9 = $EXPECT($L61, fail, 'BinaryOpSymbol ">="');
      var BinaryOpSymbol$10 = $T($EXPECT($L62, fail, 'BinaryOpSymbol "\u2265"'), function(value) {
        return ">=";
      });
      var BinaryOpSymbol$11 = $TV($EXPECT($L63, fail, 'BinaryOpSymbol "<?"'), function($skip, $loc, $0, $1) {
        return {
          $loc,
          token: "instanceof",
          relational: true,
          special: true
        };
      });
      var BinaryOpSymbol$12 = $TV($EXPECT($L64, fail, 'BinaryOpSymbol "!<?"'), function($skip, $loc, $0, $1) {
        return {
          $loc,
          token: "instanceof",
          relational: true,
          special: true,
          negated: true
        };
      });
      var BinaryOpSymbol$13 = $EXPECT($L65, fail, 'BinaryOpSymbol "<<"');
      var BinaryOpSymbol$14 = $T($EXPECT($L66, fail, 'BinaryOpSymbol "\xAB"'), function(value) {
        return "<<";
      });
      var BinaryOpSymbol$15 = $TR($EXPECT($R7, fail, "BinaryOpSymbol /<(?!\\p{ID_Start}|[_$])/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return "<";
      });
      var BinaryOpSymbol$16 = $EXPECT($L67, fail, 'BinaryOpSymbol ">>>"');
      var BinaryOpSymbol$17 = $T($EXPECT($L68, fail, 'BinaryOpSymbol "\u22D9"'), function(value) {
        return ">>>";
      });
      var BinaryOpSymbol$18 = $EXPECT($L69, fail, 'BinaryOpSymbol ">>"');
      var BinaryOpSymbol$19 = $T($EXPECT($L70, fail, 'BinaryOpSymbol "\xBB"'), function(value) {
        return ">>";
      });
      var BinaryOpSymbol$20 = $EXPECT($L33, fail, 'BinaryOpSymbol ">"');
      var BinaryOpSymbol$21 = $EXPECT($L71, fail, 'BinaryOpSymbol "!=="');
      var BinaryOpSymbol$22 = $T($EXPECT($L72, fail, 'BinaryOpSymbol "\u2262"'), function(value) {
        return "!==";
      });
      var BinaryOpSymbol$23 = $TV($C($EXPECT($L73, fail, 'BinaryOpSymbol "!="'), $EXPECT($L74, fail, 'BinaryOpSymbol "\u2260"')), function($skip, $loc, $0, $1) {
        if (module.config.coffeeEq)
          return "!==";
        return "!=";
      });
      var BinaryOpSymbol$24 = $TS($S($EXPECT($L75, fail, 'BinaryOpSymbol "isnt"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        if (module.config.coffeeIsnt)
          return "!==";
        return $skip;
      });
      var BinaryOpSymbol$25 = $EXPECT($L76, fail, 'BinaryOpSymbol "==="');
      var BinaryOpSymbol$26 = $T($C($EXPECT($L77, fail, 'BinaryOpSymbol "\u2263"'), $EXPECT($L78, fail, 'BinaryOpSymbol "\u2A76"')), function(value) {
        return "===";
      });
      var BinaryOpSymbol$27 = $TV($C($EXPECT($L79, fail, 'BinaryOpSymbol "=="'), $EXPECT($L80, fail, 'BinaryOpSymbol "\u2261"'), $EXPECT($L81, fail, 'BinaryOpSymbol "\u2A75"')), function($skip, $loc, $0, $1) {
        if (module.config.coffeeEq)
          return "===";
        return "==";
      });
      var BinaryOpSymbol$28 = $T($S($EXPECT($L82, fail, 'BinaryOpSymbol "and"'), NonIdContinue), function(value) {
        return "&&";
      });
      var BinaryOpSymbol$29 = $EXPECT($L83, fail, 'BinaryOpSymbol "&&"');
      var BinaryOpSymbol$30 = $T($S(CoffeeOfEnabled, $EXPECT($L84, fail, 'BinaryOpSymbol "of"'), NonIdContinue), function(value) {
        return "in";
      });
      var BinaryOpSymbol$31 = $T($S($EXPECT($L85, fail, 'BinaryOpSymbol "or"'), NonIdContinue), function(value) {
        return "||";
      });
      var BinaryOpSymbol$32 = $EXPECT($L86, fail, 'BinaryOpSymbol "||"');
      var BinaryOpSymbol$33 = $T($EXPECT($L87, fail, 'BinaryOpSymbol "\u2016"'), function(value) {
        return "||";
      });
      var BinaryOpSymbol$34 = $TV($C($EXPECT($L88, fail, 'BinaryOpSymbol "^^"'), $S($EXPECT($L89, fail, 'BinaryOpSymbol "xor"'), NonIdContinue)), function($skip, $loc, $0, $1) {
        return {
          call: module.getRef("xor"),
          special: true
        };
      });
      var BinaryOpSymbol$35 = $TV($C($EXPECT($R8, fail, "BinaryOpSymbol /!\\^\\^?/"), $S($EXPECT($L90, fail, 'BinaryOpSymbol "xnor"'), NonIdContinue)), function($skip, $loc, $0, $1) {
        return {
          call: module.getRef("xnor"),
          special: true
        };
      });
      var BinaryOpSymbol$36 = $EXPECT($L91, fail, 'BinaryOpSymbol "??"');
      var BinaryOpSymbol$37 = $T($EXPECT($L92, fail, 'BinaryOpSymbol "\u2047"'), function(value) {
        return "??";
      });
      var BinaryOpSymbol$38 = $T($S(CoffeeBinaryExistentialEnabled, $EXPECT($L4, fail, 'BinaryOpSymbol "?"')), function(value) {
        return "??";
      });
      var BinaryOpSymbol$39 = $TS($S($EXPECT($L93, fail, 'BinaryOpSymbol "instanceof"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return {
          $loc,
          token: $1,
          relational: true,
          special: true
        };
      });
      var BinaryOpSymbol$40 = $TS($S(Not, __, $EXPECT($L93, fail, 'BinaryOpSymbol "instanceof"'), NonIdContinue), function($skip, $loc, $0, $1, $2, $3, $4) {
        return {
          $loc,
          token: "instanceof",
          relational: true,
          special: true,
          negated: true
        };
      });
      var BinaryOpSymbol$41 = $TV($C($S($N(CoffeeOfEnabled), Not, __, In), $S(CoffeeOfEnabled, Not, __, $EXPECT($L84, fail, 'BinaryOpSymbol "of"'), NonIdContinue)), function($skip, $loc, $0, $1) {
        return {
          $loc,
          token: "in",
          special: true,
          negated: true
        };
      });
      var BinaryOpSymbol$42 = $TV($C($S(Is, __, In), $EXPECT($L94, fail, 'BinaryOpSymbol "\u2208"')), function($skip, $loc, $0, $1) {
        return {
          method: "includes",
          relational: true,
          reversed: true,
          special: true
        };
      });
      var BinaryOpSymbol$43 = $TV($EXPECT($L95, fail, 'BinaryOpSymbol "\u220B"'), function($skip, $loc, $0, $1) {
        return {
          method: "includes",
          relational: true,
          special: true
        };
      });
      var BinaryOpSymbol$44 = $TV($EXPECT($L96, fail, 'BinaryOpSymbol "\u220C"'), function($skip, $loc, $0, $1) {
        return {
          method: "includes",
          relational: true,
          special: true,
          negated: true
        };
      });
      var BinaryOpSymbol$45 = $TS($S(CoffeeOfEnabled, In), function($skip, $loc, $0, $1, $2) {
        return {
          call: [module.getRef("indexOf"), ".call"],
          relational: true,
          reversed: true,
          suffix: " >= 0",
          special: true
        };
      });
      var BinaryOpSymbol$46 = $TV($C($S(Is, __, Not, __, In), $EXPECT($L97, fail, 'BinaryOpSymbol "\u2209"')), function($skip, $loc, $0, $1) {
        return {
          method: "includes",
          relational: true,
          reversed: true,
          special: true,
          negated: true
        };
      });
      var BinaryOpSymbol$47 = $TS($S(CoffeeOfEnabled, Not, __, In), function($skip, $loc, $0, $1, $2, $3, $4) {
        return {
          call: [module.getRef("indexOf"), ".call"],
          relational: true,
          reversed: true,
          suffix: " < 0",
          special: true
        };
      });
      var BinaryOpSymbol$48 = $TS($S($N(CoffeeNotEnabled), Is, __, Not), function($skip, $loc, $0, $1, $2, $3, $4) {
        if (module.config.objectIs) {
          return {
            call: module.getRef("is"),
            relational: true,
            special: true,
            asConst: true,
            negated: true
          };
        }
        return "!==";
      });
      var BinaryOpSymbol$49 = $TS($S(Is), function($skip, $loc, $0, $1) {
        if (module.config.objectIs) {
          return {
            call: module.getRef("is"),
            relational: true,
            special: true,
            asConst: true
          };
        }
        return "===";
      });
      var BinaryOpSymbol$50 = $TS($S(In), function($skip, $loc, $0, $1) {
        return "in";
      });
      var BinaryOpSymbol$51 = $EXPECT($L98, fail, 'BinaryOpSymbol "&"');
      var BinaryOpSymbol$52 = $EXPECT($L18, fail, 'BinaryOpSymbol "^"');
      var BinaryOpSymbol$53 = $EXPECT($L99, fail, 'BinaryOpSymbol "|"');
      function BinaryOpSymbol(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BinaryOpSymbol", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BinaryOpSymbol", state, BinaryOpSymbol$0(state) || BinaryOpSymbol$1(state) || BinaryOpSymbol$2(state) || BinaryOpSymbol$3(state) || BinaryOpSymbol$4(state) || BinaryOpSymbol$5(state) || BinaryOpSymbol$6(state) || BinaryOpSymbol$7(state) || BinaryOpSymbol$8(state) || BinaryOpSymbol$9(state) || BinaryOpSymbol$10(state) || BinaryOpSymbol$11(state) || BinaryOpSymbol$12(state) || BinaryOpSymbol$13(state) || BinaryOpSymbol$14(state) || BinaryOpSymbol$15(state) || BinaryOpSymbol$16(state) || BinaryOpSymbol$17(state) || BinaryOpSymbol$18(state) || BinaryOpSymbol$19(state) || BinaryOpSymbol$20(state) || BinaryOpSymbol$21(state) || BinaryOpSymbol$22(state) || BinaryOpSymbol$23(state) || BinaryOpSymbol$24(state) || BinaryOpSymbol$25(state) || BinaryOpSymbol$26(state) || BinaryOpSymbol$27(state) || BinaryOpSymbol$28(state) || BinaryOpSymbol$29(state) || BinaryOpSymbol$30(state) || BinaryOpSymbol$31(state) || BinaryOpSymbol$32(state) || BinaryOpSymbol$33(state) || BinaryOpSymbol$34(state) || BinaryOpSymbol$35(state) || BinaryOpSymbol$36(state) || BinaryOpSymbol$37(state) || BinaryOpSymbol$38(state) || BinaryOpSymbol$39(state) || BinaryOpSymbol$40(state) || BinaryOpSymbol$41(state) || BinaryOpSymbol$42(state) || BinaryOpSymbol$43(state) || BinaryOpSymbol$44(state) || BinaryOpSymbol$45(state) || BinaryOpSymbol$46(state) || BinaryOpSymbol$47(state) || BinaryOpSymbol$48(state) || BinaryOpSymbol$49(state) || BinaryOpSymbol$50(state) || BinaryOpSymbol$51(state) || BinaryOpSymbol$52(state) || BinaryOpSymbol$53(state));
          if (state.events)
            state.events.exit?.("BinaryOpSymbol", state, result, eventData);
          return result;
        } else {
          const result = BinaryOpSymbol$0(state) || BinaryOpSymbol$1(state) || BinaryOpSymbol$2(state) || BinaryOpSymbol$3(state) || BinaryOpSymbol$4(state) || BinaryOpSymbol$5(state) || BinaryOpSymbol$6(state) || BinaryOpSymbol$7(state) || BinaryOpSymbol$8(state) || BinaryOpSymbol$9(state) || BinaryOpSymbol$10(state) || BinaryOpSymbol$11(state) || BinaryOpSymbol$12(state) || BinaryOpSymbol$13(state) || BinaryOpSymbol$14(state) || BinaryOpSymbol$15(state) || BinaryOpSymbol$16(state) || BinaryOpSymbol$17(state) || BinaryOpSymbol$18(state) || BinaryOpSymbol$19(state) || BinaryOpSymbol$20(state) || BinaryOpSymbol$21(state) || BinaryOpSymbol$22(state) || BinaryOpSymbol$23(state) || BinaryOpSymbol$24(state) || BinaryOpSymbol$25(state) || BinaryOpSymbol$26(state) || BinaryOpSymbol$27(state) || BinaryOpSymbol$28(state) || BinaryOpSymbol$29(state) || BinaryOpSymbol$30(state) || BinaryOpSymbol$31(state) || BinaryOpSymbol$32(state) || BinaryOpSymbol$33(state) || BinaryOpSymbol$34(state) || BinaryOpSymbol$35(state) || BinaryOpSymbol$36(state) || BinaryOpSymbol$37(state) || BinaryOpSymbol$38(state) || BinaryOpSymbol$39(state) || BinaryOpSymbol$40(state) || BinaryOpSymbol$41(state) || BinaryOpSymbol$42(state) || BinaryOpSymbol$43(state) || BinaryOpSymbol$44(state) || BinaryOpSymbol$45(state) || BinaryOpSymbol$46(state) || BinaryOpSymbol$47(state) || BinaryOpSymbol$48(state) || BinaryOpSymbol$49(state) || BinaryOpSymbol$50(state) || BinaryOpSymbol$51(state) || BinaryOpSymbol$52(state) || BinaryOpSymbol$53(state);
          if (state.events)
            state.events.exit?.("BinaryOpSymbol", state, result, eventData);
          return result;
        }
      }
      var Xor$0 = $EXPECT($L88, fail, 'Xor "^^"');
      var Xor$1 = $S($EXPECT($L89, fail, 'Xor "xor"'), NonIdContinue);
      function Xor(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Xor", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Xor", state, Xor$0(state) || Xor$1(state));
          if (state.events)
            state.events.exit?.("Xor", state, result, eventData);
          return result;
        } else {
          const result = Xor$0(state) || Xor$1(state);
          if (state.events)
            state.events.exit?.("Xor", state, result, eventData);
          return result;
        }
      }
      var Xnor$0 = $R$0($EXPECT($R8, fail, "Xnor /!\\^\\^?/"));
      var Xnor$1 = $EXPECT($L90, fail, 'Xnor "xnor"');
      function Xnor(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Xnor", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Xnor", state, Xnor$0(state) || Xnor$1(state));
          if (state.events)
            state.events.exit?.("Xnor", state, result, eventData);
          return result;
        } else {
          const result = Xnor$0(state) || Xnor$1(state);
          if (state.events)
            state.events.exit?.("Xnor", state, result, eventData);
          return result;
        }
      }
      var UnaryOp$0 = $TR($EXPECT($R9, fail, "UnaryOp /(?!\\+\\+|--)[!~+-](?!\\s|[!~+-]*&)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      var UnaryOp$1 = AwaitOp;
      var UnaryOp$2 = $S($C(Delete, Void, Typeof), $N($EXPECT($L11, fail, 'UnaryOp ":"')), $E(_));
      var UnaryOp$3 = $T($S(Not, $E($EXPECT($L10, fail, 'UnaryOp " "')), $E(_)), function(value) {
        return [value[0], value[2]];
      });
      function UnaryOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UnaryOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UnaryOp", state, UnaryOp$0(state) || UnaryOp$1(state) || UnaryOp$2(state) || UnaryOp$3(state));
          if (state.events)
            state.events.exit?.("UnaryOp", state, result, eventData);
          return result;
        } else {
          const result = UnaryOp$0(state) || UnaryOp$1(state) || UnaryOp$2(state) || UnaryOp$3(state);
          if (state.events)
            state.events.exit?.("UnaryOp", state, result, eventData);
          return result;
        }
      }
      var AwaitOp$0 = $TS($S(Await, $E($S(Dot, IdentifierName)), $C($Y(OpenParen), _, $Y(EOS))), function($skip, $loc, $0, $1, $2, $3) {
        var a = $1;
        var op = $2;
        var ws = $3;
        if (op) {
          return {
            ...a,
            op,
            children: [a, ...ws || []]
          };
        }
        return [a, ...ws || []];
      });
      function AwaitOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AwaitOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AwaitOp", state, AwaitOp$0(state));
          if (state.events)
            state.events.exit?.("AwaitOp", state, result, eventData);
          return result;
        } else {
          const result = AwaitOp$0(state);
          if (state.events)
            state.events.exit?.("AwaitOp", state, result, eventData);
          return result;
        }
      }
      var ModuleItem$0 = ImportDeclaration;
      var ModuleItem$1 = ExportDeclaration;
      var ModuleItem$2 = StatementListItem;
      function ModuleItem(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ModuleItem", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ModuleItem", state, ModuleItem$0(state) || ModuleItem$1(state) || ModuleItem$2(state));
          if (state.events)
            state.events.exit?.("ModuleItem", state, result, eventData);
          return result;
        } else {
          const result = ModuleItem$0(state) || ModuleItem$1(state) || ModuleItem$2(state);
          if (state.events)
            state.events.exit?.("ModuleItem", state, result, eventData);
          return result;
        }
      }
      var StatementListItem$0 = Declaration;
      var StatementListItem$1 = PostfixedStatement;
      function StatementListItem(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("StatementListItem", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("StatementListItem", state, StatementListItem$0(state) || StatementListItem$1(state));
          if (state.events)
            state.events.exit?.("StatementListItem", state, result, eventData);
          return result;
        } else {
          const result = StatementListItem$0(state) || StatementListItem$1(state);
          if (state.events)
            state.events.exit?.("StatementListItem", state, result, eventData);
          return result;
        }
      }
      var PostfixedStatement$0 = $TS($S(Statement, $E($S($E(_), PostfixStatement))), function($skip, $loc, $0, $1, $2) {
        var statement = $1;
        var post = $2;
        if (post)
          return addPostfixStatement(statement, ...post);
        return statement;
      });
      function PostfixedStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PostfixedStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PostfixedStatement", state, PostfixedStatement$0(state));
          if (state.events)
            state.events.exit?.("PostfixedStatement", state, result, eventData);
          return result;
        } else {
          const result = PostfixedStatement$0(state);
          if (state.events)
            state.events.exit?.("PostfixedStatement", state, result, eventData);
          return result;
        }
      }
      var PostfixedExpression$0 = $TS($S(ExtendedExpression, $E($S($E(_), PostfixStatement))), function($skip, $loc, $0, $1, $2) {
        var expression = $1;
        var post = $2;
        if (post)
          return attachPostfixStatementAsExpression(expression, post);
        return expression;
      });
      function PostfixedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PostfixedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PostfixedExpression", state, PostfixedExpression$0(state));
          if (state.events)
            state.events.exit?.("PostfixedExpression", state, result, eventData);
          return result;
        } else {
          const result = PostfixedExpression$0(state);
          if (state.events)
            state.events.exit?.("PostfixedExpression", state, result, eventData);
          return result;
        }
      }
      var NonPipelinePostfixedExpression$0 = $TS($S(NonPipelineExtendedExpression, $E($S($E(_), PostfixStatement))), function($skip, $loc, $0, $1, $2) {
        var expression = $1;
        var post = $2;
        if (post)
          return attachPostfixStatementAsExpression(expression, post);
        return expression;
      });
      function NonPipelinePostfixedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonPipelinePostfixedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonPipelinePostfixedExpression", state, NonPipelinePostfixedExpression$0(state));
          if (state.events)
            state.events.exit?.("NonPipelinePostfixedExpression", state, result, eventData);
          return result;
        } else {
          const result = NonPipelinePostfixedExpression$0(state);
          if (state.events)
            state.events.exit?.("NonPipelinePostfixedExpression", state, result, eventData);
          return result;
        }
      }
      var PostfixStatement$0 = ForClause;
      var PostfixStatement$1 = IfClause;
      var PostfixStatement$2 = LoopClause;
      var PostfixStatement$3 = UnlessClause;
      var PostfixStatement$4 = WhileClause;
      function PostfixStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PostfixStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PostfixStatement", state, PostfixStatement$0(state) || PostfixStatement$1(state) || PostfixStatement$2(state) || PostfixStatement$3(state) || PostfixStatement$4(state));
          if (state.events)
            state.events.exit?.("PostfixStatement", state, result, eventData);
          return result;
        } else {
          const result = PostfixStatement$0(state) || PostfixStatement$1(state) || PostfixStatement$2(state) || PostfixStatement$3(state) || PostfixStatement$4(state);
          if (state.events)
            state.events.exit?.("PostfixStatement", state, result, eventData);
          return result;
        }
      }
      var Statement$0 = KeywordStatement;
      var Statement$1 = VariableStatement;
      var Statement$2 = IfStatement;
      var Statement$3 = IterationStatement;
      var Statement$4 = SwitchStatement;
      var Statement$5 = TryStatement;
      var Statement$6 = EmptyStatement;
      var Statement$7 = LabelledStatement;
      var Statement$8 = $TS($S(ExpressionStatement), function($skip, $loc, $0, $1) {
        if ($1.type === "ObjectExpression" || $1.type === "FunctionExpression" && !$1.id) {
          return makeLeftHandSideExpression($1);
        }
        return $1;
      });
      var Statement$9 = BlockStatement;
      function Statement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Statement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Statement", state, Statement$0(state) || Statement$1(state) || Statement$2(state) || Statement$3(state) || Statement$4(state) || Statement$5(state) || Statement$6(state) || Statement$7(state) || Statement$8(state) || Statement$9(state));
          if (state.events)
            state.events.exit?.("Statement", state, result, eventData);
          return result;
        } else {
          const result = Statement$0(state) || Statement$1(state) || Statement$2(state) || Statement$3(state) || Statement$4(state) || Statement$5(state) || Statement$6(state) || Statement$7(state) || Statement$8(state) || Statement$9(state);
          if (state.events)
            state.events.exit?.("Statement", state, result, eventData);
          return result;
        }
      }
      var EmptyStatement$0 = $TS($S($E(_), $Y($EXPECT($L100, fail, 'EmptyStatement ";"'))), function($skip, $loc, $0, $1, $2) {
        return { type: "EmptyStatement", children: $1 || [] };
      });
      function EmptyStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EmptyStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EmptyStatement", state, EmptyStatement$0(state));
          if (state.events)
            state.events.exit?.("EmptyStatement", state, result, eventData);
          return result;
        } else {
          const result = EmptyStatement$0(state);
          if (state.events)
            state.events.exit?.("EmptyStatement", state, result, eventData);
          return result;
        }
      }
      var BlockStatement$0 = $T($S(ExplicitBlock, $N($S(__, $EXPECT($L2, fail, 'BlockStatement "="')))), function(value) {
        return value[0];
      });
      function BlockStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BlockStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BlockStatement", state, BlockStatement$0(state));
          if (state.events)
            state.events.exit?.("BlockStatement", state, result, eventData);
          return result;
        } else {
          const result = BlockStatement$0(state);
          if (state.events)
            state.events.exit?.("BlockStatement", state, result, eventData);
          return result;
        }
      }
      var LabelledStatement$0 = $S(Label, LabelledItem);
      function LabelledStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LabelledStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LabelledStatement", state, LabelledStatement$0(state));
          if (state.events)
            state.events.exit?.("LabelledStatement", state, result, eventData);
          return result;
        } else {
          const result = LabelledStatement$0(state);
          if (state.events)
            state.events.exit?.("LabelledStatement", state, result, eventData);
          return result;
        }
      }
      var Label$0 = $TS($S(Colon, Identifier, Whitespace), function($skip, $loc, $0, $1, $2, $3) {
        var colon = $1;
        var id = $2;
        var w = $3;
        return [id, colon, w];
      });
      var Label$1 = $S($EXPECT($L101, fail, 'Label "$:"'), Whitespace);
      function Label(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Label", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Label", state, Label$0(state) || Label$1(state));
          if (state.events)
            state.events.exit?.("Label", state, result, eventData);
          return result;
        } else {
          const result = Label$0(state) || Label$1(state);
          if (state.events)
            state.events.exit?.("Label", state, result, eventData);
          return result;
        }
      }
      var LabelledItem$0 = Statement;
      var LabelledItem$1 = FunctionDeclaration;
      function LabelledItem(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LabelledItem", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LabelledItem", state, LabelledItem$0(state) || LabelledItem$1(state));
          if (state.events)
            state.events.exit?.("LabelledItem", state, result, eventData);
          return result;
        } else {
          const result = LabelledItem$0(state) || LabelledItem$1(state);
          if (state.events)
            state.events.exit?.("LabelledItem", state, result, eventData);
          return result;
        }
      }
      var IfStatement$0 = $TS($S($C(IfClause, UnlessClause), Block, $E(ElseClause)), function($skip, $loc, $0, $1, $2, $3) {
        var clause = $1;
        var block = $2;
        var e = $3;
        const children = [...clause.children];
        block = blockWithPrefix(clause.condition.expression.blockPrefix, block);
        children.push(block);
        if (block.bare && e)
          children.push(";");
        if (e)
          children.push(e);
        return {
          ...clause,
          children,
          then: block,
          else: e
        };
      });
      function IfStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IfStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IfStatement", state, IfStatement$0(state));
          if (state.events)
            state.events.exit?.("IfStatement", state, result, eventData);
          return result;
        } else {
          const result = IfStatement$0(state);
          if (state.events)
            state.events.exit?.("IfStatement", state, result, eventData);
          return result;
        }
      }
      var ElseClause$0 = $S(Samedent, Else, Block);
      var ElseClause$1 = $S($E(_), Else, Block);
      function ElseClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ElseClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ElseClause", state, ElseClause$0(state) || ElseClause$1(state));
          if (state.events)
            state.events.exit?.("ElseClause", state, result, eventData);
          return result;
        } else {
          const result = ElseClause$0(state) || ElseClause$1(state);
          if (state.events)
            state.events.exit?.("ElseClause", state, result, eventData);
          return result;
        }
      }
      var IfClause$0 = $TS($S(If, Condition), function($skip, $loc, $0, $1, $2) {
        var condition = $2;
        return {
          type: "IfStatement",
          children: $0,
          condition
        };
      });
      function IfClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IfClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IfClause", state, IfClause$0(state));
          if (state.events)
            state.events.exit?.("IfClause", state, result, eventData);
          return result;
        } else {
          const result = IfClause$0(state);
          if (state.events)
            state.events.exit?.("IfClause", state, result, eventData);
          return result;
        }
      }
      var UnlessClause$0 = $TS($S(Unless, Condition), function($skip, $loc, $0, $1, $2) {
        var kind = $1;
        var condition = $2;
        kind = { ...kind, token: "if" };
        return {
          type: "IfStatement",
          children: [kind, ["(!", condition, ")"]],
          condition
        };
      });
      function UnlessClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UnlessClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UnlessClause", state, UnlessClause$0(state));
          if (state.events)
            state.events.exit?.("UnlessClause", state, result, eventData);
          return result;
        } else {
          const result = UnlessClause$0(state);
          if (state.events)
            state.events.exit?.("UnlessClause", state, result, eventData);
          return result;
        }
      }
      var IfExpression$0 = $TS($S(IfClause, ExpressionBlock, $E(ElseExpressionClause)), function($skip, $loc, $0, $1, $2, $3) {
        var clause = $1;
        var b = $2;
        var e = $3;
        return expressionizeIfClause(clause, b, e);
      });
      function IfExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IfExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IfExpression", state, IfExpression$0(state));
          if (state.events)
            state.events.exit?.("IfExpression", state, result, eventData);
          return result;
        } else {
          const result = IfExpression$0(state);
          if (state.events)
            state.events.exit?.("IfExpression", state, result, eventData);
          return result;
        }
      }
      var UnlessExpression$0 = $TS($S(UnlessClause, ExpressionBlock, $E(ElseExpressionClause)), function($skip, $loc, $0, $1, $2, $3) {
        var clause = $1;
        var b = $2;
        var e = $3;
        return expressionizeIfClause(clause, b, e);
      });
      function UnlessExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UnlessExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UnlessExpression", state, UnlessExpression$0(state));
          if (state.events)
            state.events.exit?.("UnlessExpression", state, result, eventData);
          return result;
        } else {
          const result = UnlessExpression$0(state);
          if (state.events)
            state.events.exit?.("UnlessExpression", state, result, eventData);
          return result;
        }
      }
      var ElseExpressionClause$0 = $TS($S($C($S(Samedent, Else), $S($E(_), Else)), ElseExpressionBlock), function($skip, $loc, $0, $1, $2) {
        return [...$1, $2];
      });
      function ElseExpressionClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ElseExpressionClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ElseExpressionClause", state, ElseExpressionClause$0(state));
          if (state.events)
            state.events.exit?.("ElseExpressionClause", state, result, eventData);
          return result;
        } else {
          const result = ElseExpressionClause$0(state);
          if (state.events)
            state.events.exit?.("ElseExpressionClause", state, result, eventData);
          return result;
        }
      }
      var ExpressionBlock$0 = $TS($S(InsertOpenParen, NestedBlockExpressions, InsertNewline, InsertIndent, InsertCloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var exps = $2;
        exps = exps.flat();
        if (exps.length === 1) {
          let [ws, exp] = exps[0];
          switch (exp.type) {
            case "Identifier":
            case "Literal":
              return [ws, exp];
          }
        }
        exps = exps.map((e, i) => {
          if (i === exps.length - 1) {
            return e.slice(0, -1);
          }
          return e;
        });
        return {
          type: "BlockExpressions",
          expressions: exps,
          children: [$1, exps, $3, $4, $5]
        };
      });
      var ExpressionBlock$1 = $S(Then, ExtendedExpression);
      function ExpressionBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExpressionBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExpressionBlock", state, ExpressionBlock$0(state) || ExpressionBlock$1(state));
          if (state.events)
            state.events.exit?.("ExpressionBlock", state, result, eventData);
          return result;
        } else {
          const result = ExpressionBlock$0(state) || ExpressionBlock$1(state);
          if (state.events)
            state.events.exit?.("ExpressionBlock", state, result, eventData);
          return result;
        }
      }
      var ElseExpressionBlock$0 = $TS($S(InsertOpenParen, NestedBlockExpressions, InsertNewline, InsertIndent, InsertCloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var exps = $2;
        exps = exps.flat();
        if (exps.length === 1) {
          let [ws, exp] = exps[0];
          switch (exp.type) {
            case "Identifier":
            case "Literal":
              return [ws, exp];
          }
        }
        exps = exps.map((e, i) => {
          if (i === exps.length - 1) {
            return e.slice(0, -1);
          }
          return e;
        });
        return {
          type: "BlockExpressions",
          expressions: exps,
          children: [$1, exps, $3, $4, $5]
        };
      });
      var ElseExpressionBlock$1 = $T($S($N(EOS), ExpressionWithIndentedApplicationForbidden), function(value) {
        return value[1];
      });
      function ElseExpressionBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ElseExpressionBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ElseExpressionBlock", state, ElseExpressionBlock$0(state) || ElseExpressionBlock$1(state));
          if (state.events)
            state.events.exit?.("ElseExpressionBlock", state, result, eventData);
          return result;
        } else {
          const result = ElseExpressionBlock$0(state) || ElseExpressionBlock$1(state);
          if (state.events)
            state.events.exit?.("ElseExpressionBlock", state, result, eventData);
          return result;
        }
      }
      var NestedBlockExpressions$0 = $TS($S(PushIndent, $Q(NestedBlockExpression), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var exps = $2;
        if (!exps.length)
          return $skip;
        return exps;
      });
      function NestedBlockExpressions(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBlockExpressions", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBlockExpressions", state, NestedBlockExpressions$0(state));
          if (state.events)
            state.events.exit?.("NestedBlockExpressions", state, result, eventData);
          return result;
        } else {
          const result = NestedBlockExpressions$0(state);
          if (state.events)
            state.events.exit?.("NestedBlockExpressions", state, result, eventData);
          return result;
        }
      }
      var NestedBlockExpression$0 = $TS($S(Nested, $P(BlockExpressionPart)), function($skip, $loc, $0, $1, $2) {
        var nested = $1;
        var expressions = $2;
        return [
          [nested, ...expressions[0]],
          ...expressions.slice(1).map((s) => ["", ...s])
        ];
      });
      function NestedBlockExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedBlockExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedBlockExpression", state, NestedBlockExpression$0(state));
          if (state.events)
            state.events.exit?.("NestedBlockExpression", state, result, eventData);
          return result;
        } else {
          const result = NestedBlockExpression$0(state);
          if (state.events)
            state.events.exit?.("NestedBlockExpression", state, result, eventData);
          return result;
        }
      }
      var BlockExpressionPart$0 = $TS($S($N(EOS), $E(_), PostfixedExpression, ExpressionDelimiter), function($skip, $loc, $0, $1, $2, $3, $4) {
        var ws = $2;
        var exp = $3;
        var delimiter = $4;
        if (ws) {
          exp = { ...exp, children: [ws, ...exp.children] };
        }
        return [exp, delimiter];
      });
      function BlockExpressionPart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BlockExpressionPart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BlockExpressionPart", state, BlockExpressionPart$0(state));
          if (state.events)
            state.events.exit?.("BlockExpressionPart", state, result, eventData);
          return result;
        } else {
          const result = BlockExpressionPart$0(state);
          if (state.events)
            state.events.exit?.("BlockExpressionPart", state, result, eventData);
          return result;
        }
      }
      var IterationStatement$0 = LoopStatement;
      var IterationStatement$1 = $T($S($N(CoffeeDoEnabled), DoWhileStatement), function(value) {
        return value[1];
      });
      var IterationStatement$2 = $T($S($N(CoffeeDoEnabled), DoStatement), function(value) {
        return value[1];
      });
      var IterationStatement$3 = WhileStatement;
      var IterationStatement$4 = ForStatement;
      function IterationStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IterationStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IterationStatement", state, IterationStatement$0(state) || IterationStatement$1(state) || IterationStatement$2(state) || IterationStatement$3(state) || IterationStatement$4(state));
          if (state.events)
            state.events.exit?.("IterationStatement", state, result, eventData);
          return result;
        } else {
          const result = IterationStatement$0(state) || IterationStatement$1(state) || IterationStatement$2(state) || IterationStatement$3(state) || IterationStatement$4(state);
          if (state.events)
            state.events.exit?.("IterationStatement", state, result, eventData);
          return result;
        }
      }
      var IterationExpression$0 = $TS($S($E($S(Async, __)), IterationStatement), function($skip, $loc, $0, $1, $2) {
        var async = $1;
        var statement = $2;
        return {
          type: "IterationExpression",
          subtype: statement.type,
          children: [statement],
          block: statement.block,
          async
        };
      });
      function IterationExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IterationExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IterationExpression", state, IterationExpression$0(state));
          if (state.events)
            state.events.exit?.("IterationExpression", state, result, eventData);
          return result;
        } else {
          const result = IterationExpression$0(state);
          if (state.events)
            state.events.exit?.("IterationExpression", state, result, eventData);
          return result;
        }
      }
      var LoopStatement$0 = $TS($S(LoopClause, Block), function($skip, $loc, $0, $1, $2) {
        var clause = $1;
        var block = $2;
        return {
          type: "IterationStatement",
          children: [...clause.children, block],
          block
        };
      });
      function LoopStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LoopStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LoopStatement", state, LoopStatement$0(state));
          if (state.events)
            state.events.exit?.("LoopStatement", state, result, eventData);
          return result;
        } else {
          const result = LoopStatement$0(state);
          if (state.events)
            state.events.exit?.("LoopStatement", state, result, eventData);
          return result;
        }
      }
      var LoopClause$0 = $T($S(Loop), function(value) {
        return { "type": "IterationStatement", "children": [value[0]] };
      });
      function LoopClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LoopClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LoopClause", state, LoopClause$0(state));
          if (state.events)
            state.events.exit?.("LoopClause", state, result, eventData);
          return result;
        } else {
          const result = LoopClause$0(state);
          if (state.events)
            state.events.exit?.("LoopClause", state, result, eventData);
          return result;
        }
      }
      var DoWhileStatement$0 = $T($S(Do, NoPostfixBracedBlock, __, WhileClause), function(value) {
        var block = value[1];
        return { "type": "IterationStatement", "children": value, "block": block };
      });
      function DoWhileStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DoWhileStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DoWhileStatement", state, DoWhileStatement$0(state));
          if (state.events)
            state.events.exit?.("DoWhileStatement", state, result, eventData);
          return result;
        } else {
          const result = DoWhileStatement$0(state);
          if (state.events)
            state.events.exit?.("DoWhileStatement", state, result, eventData);
          return result;
        }
      }
      var DoStatement$0 = $TS($S(Do, NoPostfixBracedBlock), function($skip, $loc, $0, $1, $2) {
        var block = $2;
        block = insertTrimmingSpace(block, "");
        return {
          type: "DoStatement",
          children: [block],
          block
        };
      });
      function DoStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DoStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DoStatement", state, DoStatement$0(state));
          if (state.events)
            state.events.exit?.("DoStatement", state, result, eventData);
          return result;
        } else {
          const result = DoStatement$0(state);
          if (state.events)
            state.events.exit?.("DoStatement", state, result, eventData);
          return result;
        }
      }
      var WhileStatement$0 = $TS($S(WhileClause, Block), function($skip, $loc, $0, $1, $2) {
        var clause = $1;
        var block = $2;
        block = blockWithPrefix(clause.condition.expression.blockPrefix, block);
        return {
          ...clause,
          children: [...clause.children, block],
          block
        };
      });
      function WhileStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("WhileStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("WhileStatement", state, WhileStatement$0(state));
          if (state.events)
            state.events.exit?.("WhileStatement", state, result, eventData);
          return result;
        } else {
          const result = WhileStatement$0(state);
          if (state.events)
            state.events.exit?.("WhileStatement", state, result, eventData);
          return result;
        }
      }
      var WhileClause$0 = $TS($S($C(While, Until), $E(_), Condition), function($skip, $loc, $0, $1, $2, $3) {
        var kind = $1;
        var ws = $2;
        var condition = $3;
        if (kind.token === "until") {
          kind.token = "while";
          return {
            type: "IterationStatement",
            children: [kind, ...ws, ["(!", ...condition.children, ")"]],
            condition
          };
        }
        return {
          type: "IterationStatement",
          children: [kind, ...ws, ...condition.children],
          condition
        };
      });
      function WhileClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("WhileClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("WhileClause", state, WhileClause$0(state));
          if (state.events)
            state.events.exit?.("WhileClause", state, result, eventData);
          return result;
        } else {
          const result = WhileClause$0(state);
          if (state.events)
            state.events.exit?.("WhileClause", state, result, eventData);
          return result;
        }
      }
      var ForStatement$0 = $TS($S(ForClause, Block), function($skip, $loc, $0, $1, $2) {
        var clause = $1;
        var block = $2;
        block = blockWithPrefix(clause.blockPrefix, block);
        return {
          ...clause,
          children: [...clause.children, block],
          block
        };
      });
      function ForStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForStatement", state, ForStatement$0(state));
          if (state.events)
            state.events.exit?.("ForStatement", state, result, eventData);
          return result;
        } else {
          const result = ForStatement$0(state);
          if (state.events)
            state.events.exit?.("ForStatement", state, result, eventData);
          return result;
        }
      }
      var ForClause$0 = $TS($S(For, __, ForStatementControl), function($skip, $loc, $0, $1, $2, $3) {
        var c = $3;
        const { children, declaration } = c;
        return {
          type: "ForStatement",
          children: [$1, ...$2, ...children],
          declaration,
          block: null,
          blockPrefix: c.blockPrefix
        };
      });
      function ForClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForClause", state, ForClause$0(state));
          if (state.events)
            state.events.exit?.("ForClause", state, result, eventData);
          return result;
        } else {
          const result = ForClause$0(state);
          if (state.events)
            state.events.exit?.("ForClause", state, result, eventData);
          return result;
        }
      }
      var ForStatementControl$0 = $T($S($N(CoffeeForLoopsEnabled), ForStatementParameters), function(value) {
        return value[1];
      });
      var ForStatementControl$1 = $TS($S(CoffeeForLoopsEnabled, CoffeeForStatementParameters, $E(WhenCondition)), function($skip, $loc, $0, $1, $2, $3) {
        if ($3) {
          const block = "continue;";
          $2 = {
            ...$2,
            blockPrefix: [
              ...$2.blockPrefix,
              ["", {
                type: "IfStatement",
                then: block,
                children: ["if (!(", insertTrimmingSpace($3, ""), ")) ", block]
              }]
            ]
          };
        }
        return $2;
      });
      function ForStatementControl(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForStatementControl", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForStatementControl", state, ForStatementControl$0(state) || ForStatementControl$1(state));
          if (state.events)
            state.events.exit?.("ForStatementControl", state, result, eventData);
          return result;
        } else {
          const result = ForStatementControl$0(state) || ForStatementControl$1(state);
          if (state.events)
            state.events.exit?.("ForStatementControl", state, result, eventData);
          return result;
        }
      }
      var WhenCondition$0 = $T($S(__, When, ExpressionWithIndentedApplicationForbidden), function(value) {
        var exp = value[2];
        return exp;
      });
      function WhenCondition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("WhenCondition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("WhenCondition", state, WhenCondition$0(state));
          if (state.events)
            state.events.exit?.("WhenCondition", state, result, eventData);
          return result;
        } else {
          const result = WhenCondition$0(state);
          if (state.events)
            state.events.exit?.("WhenCondition", state, result, eventData);
          return result;
        }
      }
      var CoffeeForStatementParameters$0 = $TS($S($E($S(Await, __)), InsertOpenParen, CoffeeForDeclaration, $E(CoffeeForIndex), __, $C(In, Of, From), ExpressionWithIndentedApplicationForbidden, $E($S($E(_), By, ExpressionWithIndentedApplicationForbidden)), InsertCloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        var open = $2;
        var declaration = $3;
        var index = $4;
        var kind = $6;
        var exp = $7;
        var step = $8;
        var close = $9;
        let blockPrefix = [];
        exp = insertTrimmingSpace(exp, "");
        declaration = insertTrimmingSpace(declaration, "");
        if (kind.token === "from") {
          if (step) {
            throw new Error("Can't use 'by' with 'from' in CoffeeScript for loops");
          }
          kind.token = "of";
        } else if (kind.token === "of") {
          if (step) {
            throw new Error("Can't use 'by' with 'of' in CoffeeScript for loops");
          }
          if (declaration.own) {
            const hasPropRef = module.getRef("hasProp");
            blockPrefix.push(["", "if (!", hasPropRef, ".call(", exp, ", ", declaration, ")) continue", ";"]);
          }
          if (index) {
            blockPrefix.push(["", {
              type: "AssignmentExpression",
              children: [index, " = ", exp, "[", declaration, "]"],
              names: index.names
            }, ";"]);
          }
          kind.token = "in";
        } else if (kind.token === "in") {
          const counterRef = {
            type: "Ref",
            base: "i",
            id: "i"
          };
          const lenRef = {
            type: "Ref",
            base: "len",
            id: "len"
          };
          let expRef;
          switch (exp.type) {
            case "Identifier":
              expRef = exp;
              break;
            case "RangeExpression":
              return forRange(open, declaration, exp, step?.[2], close);
            default:
              expRef = {
                type: "Ref",
                base: "ref",
                id: "ref"
              };
          }
          const varRef = declaration;
          let increment = "++", indexAssignment, assignmentNames = [...varRef.names];
          if (index) {
            index = insertTrimmingSpace(index, "");
            indexAssignment = [index, "="];
            assignmentNames.push(...index.names);
          }
          const expRefDec = expRef !== exp ? [expRef, " = ", insertTrimmingSpace(exp, ""), ", "] : [];
          blockPrefix.push(["", {
            type: "AssignmentExpression",
            children: [varRef, " = ", expRef, "[", indexAssignment, counterRef, "]"],
            names: assignmentNames
          }, ";"]);
          declaration = {
            type: "Declaration",
            children: ["let ", ...expRefDec, counterRef, " = 0, ", lenRef, " = ", expRef, ".length"],
            names: []
          };
          let condition = [counterRef, " < ", lenRef, "; "];
          if (step) {
            let [stepWs, , stepExp] = step;
            stepWs = insertTrimmingSpace(stepWs, "");
            if (stepExp.type === "Literal") {
              increment = [" +=", ...stepWs, stepExp];
              if (stepExp.raw[0] === "-") {
                declaration = {
                  type: "Declaration",
                  children: ["let ", ...expRefDec, counterRef, " = ", expRef, ".length - 1"],
                  names: []
                };
                condition = [counterRef, " >= 0; "];
              }
            } else {
              throw new Error("TODO: Support non-literal step in CoffeeScript for loops");
            }
            return {
              declaration,
              children: [$1, open, declaration, "; ", ...condition, counterRef, increment, close],
              blockPrefix
            };
          }
          return {
            declaration,
            children: [$1, open, declaration, "; ", ...condition, counterRef, increment, close],
            blockPrefix
          };
        }
        return {
          declaration,
          children: [$1, open, declaration, $5, kind, " ", exp, close],
          blockPrefix
        };
      });
      var CoffeeForStatementParameters$1 = ForRangeParameters;
      function CoffeeForStatementParameters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeForStatementParameters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeForStatementParameters", state, CoffeeForStatementParameters$0(state) || CoffeeForStatementParameters$1(state));
          if (state.events)
            state.events.exit?.("CoffeeForStatementParameters", state, result, eventData);
          return result;
        } else {
          const result = CoffeeForStatementParameters$0(state) || CoffeeForStatementParameters$1(state);
          if (state.events)
            state.events.exit?.("CoffeeForStatementParameters", state, result, eventData);
          return result;
        }
      }
      var CoffeeForIndex$0 = $TS($S($E(_), Comma, $E(_), BindingIdentifier), function($skip, $loc, $0, $1, $2, $3, $4) {
        var ws1 = $1;
        var ws2 = $3;
        var id = $4;
        ws2 = insertTrimmingSpace(ws1, "");
        return {
          ...id,
          children: [...ws1 || [], ...ws2 || [], ...id.children]
        };
      });
      function CoffeeForIndex(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeForIndex", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeForIndex", state, CoffeeForIndex$0(state));
          if (state.events)
            state.events.exit?.("CoffeeForIndex", state, result, eventData);
          return result;
        } else {
          const result = CoffeeForIndex$0(state);
          if (state.events)
            state.events.exit?.("CoffeeForIndex", state, result, eventData);
          return result;
        }
      }
      var CoffeeForDeclaration$0 = $TS($S($E($S(__, $EXPECT($L102, fail, 'CoffeeForDeclaration "own"'), NonIdContinue)), ForBinding), function($skip, $loc, $0, $1, $2) {
        var own = $1;
        var binding = $2;
        return {
          type: "AssignmentExpression",
          own: Boolean(own),
          children: [$2],
          names: $2.names
        };
      });
      function CoffeeForDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeForDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeForDeclaration", state, CoffeeForDeclaration$0(state));
          if (state.events)
            state.events.exit?.("CoffeeForDeclaration", state, result, eventData);
          return result;
        } else {
          const result = CoffeeForDeclaration$0(state);
          if (state.events)
            state.events.exit?.("CoffeeForDeclaration", state, result, eventData);
          return result;
        }
      }
      var ForStatementParameters$0 = $TS($S(OpenParen, __, $C(LexicalDeclaration, VariableStatement, $E(Expression)), __, Semicolon, $E(Expression), Semicolon, $E(Expression), __, CloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) {
        var declaration = $3;
        return {
          declaration,
          children: $0
        };
      });
      var ForStatementParameters$1 = $TS($S(InsertOpenParen, __, $C(LexicalDeclaration, VariableStatement, $E(Expression)), __, Semicolon, $E(Expression), Semicolon, $E($S($N(EOS), Expression)), InsertCloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        var declaration = $3;
        return {
          declaration,
          children: $0
        };
      });
      var ForStatementParameters$2 = $TS($S($E($S(Await, __)), OpenParen, __, ForInOfDeclaration, __, $C(In, Of), ExpressionWithIndentedApplicationForbidden, $E($S(__, By, ExpressionWithIndentedApplicationForbidden)), __, CloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) {
        var open = $2;
        var declaration = $4;
        var op = $6;
        var exp = $7;
        var step = $8;
        var close = $10;
        if (exp.type === "RangeExpression" && op.token === "of") {
          return forRange(open, declaration, exp, step, close);
        } else if (step) {
          throw new Error("for..of/in cannot use 'by' except with range literals");
        }
        return {
          declaration,
          children: $0
        };
      });
      var ForStatementParameters$3 = $TS($S($E($S(Await, __)), InsertOpenParen, ForInOfDeclaration, __, $C(In, Of), ExpressionWithIndentedApplicationForbidden, $E($S(__, By, ExpressionWithIndentedApplicationForbidden)), InsertCloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8) {
        var open = $2;
        var declaration = $3;
        var op = $5;
        var exp = $6;
        var step = $7;
        var close = $8;
        if (exp.type === "RangeExpression" && op.token === "of") {
          return forRange(open, declaration, exp, step, close);
        } else if (step) {
          throw new Error("for..of/in cannot use 'by' except with range literals");
        }
        return {
          declaration,
          children: $0
        };
      });
      var ForStatementParameters$4 = ForRangeParameters;
      function ForStatementParameters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForStatementParameters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForStatementParameters", state, ForStatementParameters$0(state) || ForStatementParameters$1(state) || ForStatementParameters$2(state) || ForStatementParameters$3(state) || ForStatementParameters$4(state));
          if (state.events)
            state.events.exit?.("ForStatementParameters", state, result, eventData);
          return result;
        } else {
          const result = ForStatementParameters$0(state) || ForStatementParameters$1(state) || ForStatementParameters$2(state) || ForStatementParameters$3(state) || ForStatementParameters$4(state);
          if (state.events)
            state.events.exit?.("ForStatementParameters", state, result, eventData);
          return result;
        }
      }
      var ForRangeParameters$0 = $TS($S($E($S(Await, __)), OpenParen, OpenBracket, RangeExpression, CloseBracket, $E($S(__, By, ExpressionWithIndentedApplicationForbidden)), CloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7) {
        var open = $2;
        var exp = $4;
        var step = $6;
        var close = $7;
        return forRange(open, null, exp, step, close);
      });
      var ForRangeParameters$1 = $TS($S($E($S(Await, __)), InsertOpenParen, OpenBracket, RangeExpression, CloseBracket, $E($S(__, By, ExpressionWithIndentedApplicationForbidden)), InsertCloseParen), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7) {
        var open = $2;
        var exp = $4;
        var step = $6;
        var close = $7;
        return forRange(open, null, exp, step, close);
      });
      function ForRangeParameters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForRangeParameters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForRangeParameters", state, ForRangeParameters$0(state) || ForRangeParameters$1(state));
          if (state.events)
            state.events.exit?.("ForRangeParameters", state, result, eventData);
          return result;
        } else {
          const result = ForRangeParameters$0(state) || ForRangeParameters$1(state);
          if (state.events)
            state.events.exit?.("ForRangeParameters", state, result, eventData);
          return result;
        }
      }
      var ForInOfDeclaration$0 = $TS($S(Var, ForBinding), function($skip, $loc, $0, $1, $2) {
        var binding = $2;
        return {
          type: "ForDeclaration",
          children: $0,
          declare: $1,
          names: binding.names
        };
      });
      var ForInOfDeclaration$1 = ForDeclaration;
      var ForInOfDeclaration$2 = LeftHandSideExpression;
      function ForInOfDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForInOfDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForInOfDeclaration", state, ForInOfDeclaration$0(state) || ForInOfDeclaration$1(state) || ForInOfDeclaration$2(state));
          if (state.events)
            state.events.exit?.("ForInOfDeclaration", state, result, eventData);
          return result;
        } else {
          const result = ForInOfDeclaration$0(state) || ForInOfDeclaration$1(state) || ForInOfDeclaration$2(state);
          if (state.events)
            state.events.exit?.("ForInOfDeclaration", state, result, eventData);
          return result;
        }
      }
      var ForDeclaration$0 = $TS($S(LetOrConst, ForBinding), function($skip, $loc, $0, $1, $2) {
        var c = $1;
        var binding = $2;
        return {
          type: "ForDeclaration",
          children: [c, binding],
          declare: c,
          names: binding.names
        };
      });
      var ForDeclaration$1 = $TS($S(InsertConst, ForBinding, $EXPECT($R10, fail, "ForDeclaration /(?=[\\s\\)])/")), function($skip, $loc, $0, $1, $2, $3) {
        var c = $1;
        var binding = $2;
        return {
          type: "ForDeclaration",
          children: [c, binding],
          declare: c,
          names: binding.names
        };
      });
      function ForDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForDeclaration", state, ForDeclaration$0(state) || ForDeclaration$1(state));
          if (state.events)
            state.events.exit?.("ForDeclaration", state, result, eventData);
          return result;
        } else {
          const result = ForDeclaration$0(state) || ForDeclaration$1(state);
          if (state.events)
            state.events.exit?.("ForDeclaration", state, result, eventData);
          return result;
        }
      }
      var ForBinding$0 = BindingIdentifier;
      var ForBinding$1 = BindingPattern;
      function ForBinding(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForBinding", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForBinding", state, ForBinding$0(state) || ForBinding$1(state));
          if (state.events)
            state.events.exit?.("ForBinding", state, result, eventData);
          return result;
        } else {
          const result = ForBinding$0(state) || ForBinding$1(state);
          if (state.events)
            state.events.exit?.("ForBinding", state, result, eventData);
          return result;
        }
      }
      var SwitchStatement$0 = $TS($S(Switch, $C(EmptyCondition, Condition), CaseBlock), function($skip, $loc, $0, $1, $2, $3) {
        var condition = $2;
        var caseBlock = $3;
        if (condition.type === "EmptyCondition") {
          caseBlock.clauses.forEach(({ cases }) => {
            if (cases) {
              cases.forEach((c) => {
                const exp = c[1];
                switch (exp.type) {
                  case "Identifier":
                  case "Literal":
                    c.splice(1, 0, "!");
                    break;
                  default:
                    c.splice(1, 1, "!(", exp, ")");
                }
              });
            }
          });
        }
        return {
          type: "SwitchStatement",
          children: $0,
          expression: condition,
          caseBlock
        };
      });
      function SwitchStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SwitchStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SwitchStatement", state, SwitchStatement$0(state));
          if (state.events)
            state.events.exit?.("SwitchStatement", state, result, eventData);
          return result;
        } else {
          const result = SwitchStatement$0(state);
          if (state.events)
            state.events.exit?.("SwitchStatement", state, result, eventData);
          return result;
        }
      }
      var EmptyCondition$0 = $TV($Y(EOS), function($skip, $loc, $0, $1) {
        return {
          type: "EmptyCondition",
          children: [{
            $loc,
            token: " (false)"
          }]
        };
      });
      function EmptyCondition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EmptyCondition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EmptyCondition", state, EmptyCondition$0(state));
          if (state.events)
            state.events.exit?.("EmptyCondition", state, result, eventData);
          return result;
        } else {
          const result = EmptyCondition$0(state);
          if (state.events)
            state.events.exit?.("EmptyCondition", state, result, eventData);
          return result;
        }
      }
      var SwitchExpression$0 = $TV(SwitchStatement, function($skip, $loc, $0, $1) {
        var e = $0;
        return {
          type: "SwitchExpression",
          children: wrapIIFE(e.children),
          expression: e.expression,
          caseBlock: e.caseBlock
        };
      });
      function SwitchExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SwitchExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SwitchExpression", state, SwitchExpression$0(state));
          if (state.events)
            state.events.exit?.("SwitchExpression", state, result, eventData);
          return result;
        } else {
          const result = SwitchExpression$0(state);
          if (state.events)
            state.events.exit?.("SwitchExpression", state, result, eventData);
          return result;
        }
      }
      var CaseBlock$0 = $TS($S($E($C(Samedent, _)), OpenBrace, NestedCaseClauses, __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var clauses = $3;
        return {
          type: "CaseBlock",
          clauses,
          children: $0
        };
      });
      var CaseBlock$1 = $TS($S(InsertOpenBrace, NestedCaseClauses, InsertNewline, InsertIndent, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var clauses = $2;
        return {
          type: "CaseBlock",
          clauses,
          children: $0
        };
      });
      function CaseBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CaseBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CaseBlock", state, CaseBlock$0(state) || CaseBlock$1(state));
          if (state.events)
            state.events.exit?.("CaseBlock", state, result, eventData);
          return result;
        } else {
          const result = CaseBlock$0(state) || CaseBlock$1(state);
          if (state.events)
            state.events.exit?.("CaseBlock", state, result, eventData);
          return result;
        }
      }
      var NestedCaseClauses$0 = $TS($S(PushIndent, $Q(NestedCaseClause), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var clauses = $2;
        if (clauses.length)
          return clauses;
        return $skip;
      });
      function NestedCaseClauses(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedCaseClauses", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedCaseClauses", state, NestedCaseClauses$0(state));
          if (state.events)
            state.events.exit?.("NestedCaseClauses", state, result, eventData);
          return result;
        } else {
          const result = NestedCaseClauses$0(state);
          if (state.events)
            state.events.exit?.("NestedCaseClauses", state, result, eventData);
          return result;
        }
      }
      var NestedCaseClause$0 = $TS($S(Nested, CaseClause), function($skip, $loc, $0, $1, $2) {
        var indent = $1;
        var clause = $2;
        return {
          ...clause,
          children: [indent, ...clause.children]
        };
      });
      function NestedCaseClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedCaseClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedCaseClause", state, NestedCaseClause$0(state));
          if (state.events)
            state.events.exit?.("NestedCaseClause", state, result, eventData);
          return result;
        } else {
          const result = NestedCaseClause$0(state);
          if (state.events)
            state.events.exit?.("NestedCaseClause", state, result, eventData);
          return result;
        }
      }
      var CaseClause$0 = $TS($S(PatternExpressionList, $C(ThenClause, NestedBlockStatements, EmptyBareBlock)), function($skip, $loc, $0, $1, $2) {
        var patterns = $1;
        var block = $2;
        return {
          type: "PatternClause",
          children: $0,
          block,
          patterns
        };
      });
      var CaseClause$1 = $T($S(Case, CaseExpressionList, $C(NestedBlockStatements, EmptyBareBlock)), function(value) {
        return { "type": "CaseClause", "children": value };
      });
      var CaseClause$2 = $TS($S(When, CaseExpressionList, InsertOpenBrace, $C(ThenClause, NestedBlockStatements, EmptyBareBlock), InsertBreak, InsertNewline, InsertIndent, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8) {
        var cases = $2;
        var block = $4;
        var b = $5;
        return {
          type: "WhenClause",
          cases,
          block,
          break: b,
          children: $0
        };
      });
      var CaseClause$3 = $TS($S(Default, ImpliedColon, $C(NestedBlockStatements, EmptyBareBlock)), function($skip, $loc, $0, $1, $2, $3) {
        var block = $3;
        return {
          type: "DefaultClause",
          block,
          children: $0
        };
      });
      var CaseClause$4 = $TS($S(Else, ImpliedColon, $C(ThenClause, BracedBlock, EmptyBlock)), function($skip, $loc, $0, $1, $2, $3) {
        var block = $3;
        $1.token = "default";
        return {
          type: "DefaultClause",
          block,
          children: $0
        };
      });
      function CaseClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CaseClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CaseClause", state, CaseClause$0(state) || CaseClause$1(state) || CaseClause$2(state) || CaseClause$3(state) || CaseClause$4(state));
          if (state.events)
            state.events.exit?.("CaseClause", state, result, eventData);
          return result;
        } else {
          const result = CaseClause$0(state) || CaseClause$1(state) || CaseClause$2(state) || CaseClause$3(state) || CaseClause$4(state);
          if (state.events)
            state.events.exit?.("CaseClause", state, result, eventData);
          return result;
        }
      }
      var PatternExpressionList$0 = $TS($S(ConditionFragment, $Q($S($E(_), Comma, $E(_), ConditionFragment))), function($skip, $loc, $0, $1, $2) {
        var first = $1;
        var rest = $2;
        return [first, ...rest.map(([, , , p]) => p)];
      });
      function PatternExpressionList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PatternExpressionList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PatternExpressionList", state, PatternExpressionList$0(state));
          if (state.events)
            state.events.exit?.("PatternExpressionList", state, result, eventData);
          return result;
        } else {
          const result = PatternExpressionList$0(state);
          if (state.events)
            state.events.exit?.("PatternExpressionList", state, result, eventData);
          return result;
        }
      }
      var ConditionFragment$0 = BindingPattern;
      var ConditionFragment$1 = $TV($P(SingleLineBinaryOpRHS), function($skip, $loc, $0, $1) {
        var pattern = $0;
        return {
          type: "ConditionFragment",
          children: pattern
        };
      });
      function ConditionFragment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ConditionFragment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ConditionFragment", state, ConditionFragment$0(state) || ConditionFragment$1(state));
          if (state.events)
            state.events.exit?.("ConditionFragment", state, result, eventData);
          return result;
        } else {
          const result = ConditionFragment$0(state) || ConditionFragment$1(state);
          if (state.events)
            state.events.exit?.("ConditionFragment", state, result, eventData);
          return result;
        }
      }
      var CaseExpressionList$0 = $TS($S(ForbidMultiLineImplicitObjectLiteral, $E($S($Q(_), ExpressionWithIndentedApplicationForbidden, ImpliedColon)), $Q($S(__, Comma, ExpressionWithIndentedApplicationForbidden, ImpliedColon)), RestoreMultiLineImplicitObjectLiteral), function($skip, $loc, $0, $1, $2, $3, $4) {
        var first = $2;
        var rest = $3;
        if (!first)
          return $skip;
        const result = rest.map(([ws, _comma, exp, col]) => {
          exp = insertTrimmingSpace(exp, "");
          if (ws.length)
            return [insertTrimmingSpace("case ", ws), exp, col];
          return ["case ", exp, col];
        });
        result.unshift(first);
        return result;
      });
      function CaseExpressionList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CaseExpressionList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CaseExpressionList", state, CaseExpressionList$0(state));
          if (state.events)
            state.events.exit?.("CaseExpressionList", state, result, eventData);
          return result;
        } else {
          const result = CaseExpressionList$0(state);
          if (state.events)
            state.events.exit?.("CaseExpressionList", state, result, eventData);
          return result;
        }
      }
      var ImpliedColon$0 = $S($E(_), Colon);
      var ImpliedColon$1 = $TV($EXPECT($L0, fail, 'ImpliedColon ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: ":" };
      });
      function ImpliedColon(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImpliedColon", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImpliedColon", state, ImpliedColon$0(state) || ImpliedColon$1(state));
          if (state.events)
            state.events.exit?.("ImpliedColon", state, result, eventData);
          return result;
        } else {
          const result = ImpliedColon$0(state) || ImpliedColon$1(state);
          if (state.events)
            state.events.exit?.("ImpliedColon", state, result, eventData);
          return result;
        }
      }
      var TryStatement$0 = $TS($S(Try, $N($EXPECT($L11, fail, 'TryStatement ":"')), NoPostfixBracedOrEmptyBlock, $E(CatchClause), $E(FinallyClause)), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var t = $1;
        var b = $3;
        var c = $4;
        var f = $5;
        if (!c && !f) {
          const emptyCatchBlock = makeEmptyBlock();
          c = {
            type: "CatchClause",
            children: [" catch(e) ", emptyCatchBlock],
            block: emptyCatchBlock
          };
          return {
            type: "TryStatement",
            blocks: [b, emptyCatchBlock],
            children: [t, b, c]
          };
        }
        const blocks = [b];
        if (c)
          blocks.push(c.block);
        return {
          type: "TryStatement",
          blocks,
          children: [t, b, c, f]
        };
      });
      function TryStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TryStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TryStatement", state, TryStatement$0(state));
          if (state.events)
            state.events.exit?.("TryStatement", state, result, eventData);
          return result;
        } else {
          const result = TryStatement$0(state);
          if (state.events)
            state.events.exit?.("TryStatement", state, result, eventData);
          return result;
        }
      }
      var TryExpression$0 = $TV(TryStatement, function($skip, $loc, $0, $1) {
        var t = $0;
        return {
          type: "TryExpression",
          blocks: t.blocks,
          children: wrapIIFE(t)
        };
      });
      function TryExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TryExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TryExpression", state, TryExpression$0(state));
          if (state.events)
            state.events.exit?.("TryExpression", state, result, eventData);
          return result;
        } else {
          const result = TryExpression$0(state);
          if (state.events)
            state.events.exit?.("TryExpression", state, result, eventData);
          return result;
        }
      }
      var CatchClause$0 = $TS($S($C(Samedent, _), Catch, $E(CatchBind), $C(ThenClause, BracedOrEmptyBlock)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var block = $4;
        return {
          type: "CatchClause",
          children: $0,
          block
        };
      });
      function CatchClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CatchClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CatchClause", state, CatchClause$0(state));
          if (state.events)
            state.events.exit?.("CatchClause", state, result, eventData);
          return result;
        } else {
          const result = CatchClause$0(state);
          if (state.events)
            state.events.exit?.("CatchClause", state, result, eventData);
          return result;
        }
      }
      var CatchBind$0 = $S($E(_), OpenParen, __, CatchParameter, __, CloseParen);
      var CatchBind$1 = $S(_, InsertOpenParen, CatchParameter, InsertCloseParen);
      function CatchBind(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CatchBind", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CatchBind", state, CatchBind$0(state) || CatchBind$1(state));
          if (state.events)
            state.events.exit?.("CatchBind", state, result, eventData);
          return result;
        } else {
          const result = CatchBind$0(state) || CatchBind$1(state);
          if (state.events)
            state.events.exit?.("CatchBind", state, result, eventData);
          return result;
        }
      }
      var FinallyClause$0 = $S($C(Samedent, _), Finally, $C(ThenClause, BracedOrEmptyBlock));
      function FinallyClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FinallyClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FinallyClause", state, FinallyClause$0(state));
          if (state.events)
            state.events.exit?.("FinallyClause", state, result, eventData);
          return result;
        } else {
          const result = FinallyClause$0(state);
          if (state.events)
            state.events.exit?.("FinallyClause", state, result, eventData);
          return result;
        }
      }
      var CatchParameter$0 = $S(BindingIdentifier, $E(TypeSuffix));
      var CatchParameter$1 = $S(BindingPattern, $E(TypeSuffix));
      function CatchParameter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CatchParameter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CatchParameter", state, CatchParameter$0(state) || CatchParameter$1(state));
          if (state.events)
            state.events.exit?.("CatchParameter", state, result, eventData);
          return result;
        } else {
          const result = CatchParameter$0(state) || CatchParameter$1(state);
          if (state.events)
            state.events.exit?.("CatchParameter", state, result, eventData);
          return result;
        }
      }
      var Condition$0 = $TS($S(OpenParen, $E(_), DeclarationCondition, CloseParen), function($skip, $loc, $0, $1, $2, $3, $4) {
        var open = $1;
        var ws = $2;
        var expression = $3;
        var close = $4;
        return {
          type: "ParenthesizedExpression",
          children: [open, ws, expression, close],
          expression
        };
      });
      var Condition$1 = $T($S(ParenthesizedExpression, $N($S($E(_), $C(BinaryOp, AssignmentOp, Dot, QuestionMark))), $N($S(_, OperatorAssignmentOp))), function(value) {
        return value[0];
      });
      var Condition$2 = $TS($S(InsertOpenParen, DeclarationCondition, InsertCloseParen), function($skip, $loc, $0, $1, $2, $3) {
        var open = $1;
        var expression = $2;
        var close = $3;
        return {
          type: "ParenthesizedExpression",
          children: [open, expression, close],
          expression
        };
      });
      var Condition$3 = $TS($S(InsertOpenParen, ExpressionWithIndentedApplicationForbidden, InsertCloseParen), function($skip, $loc, $0, $1, $2, $3) {
        var open = $1;
        var expression = $2;
        var close = $3;
        if (expression.type === "ParenthesizedExpression")
          return expression;
        expression = insertTrimmingSpace(expression, "");
        return {
          type: "ParenthesizedExpression",
          children: [open, expression, close],
          expression
        };
      });
      function Condition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Condition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Condition", state, Condition$0(state) || Condition$1(state) || Condition$2(state) || Condition$3(state));
          if (state.events)
            state.events.exit?.("Condition", state, result, eventData);
          return result;
        } else {
          const result = Condition$0(state) || Condition$1(state) || Condition$2(state) || Condition$3(state);
          if (state.events)
            state.events.exit?.("Condition", state, result, eventData);
          return result;
        }
      }
      var DeclarationCondition$0 = $TV(LexicalDeclaration, function($skip, $loc, $0, $1) {
        var dec = $0;
        const ref = {
          type: "Ref",
          base: "ref"
        };
        const { binding, initializer, splices, thisAssignments } = dec;
        const initCondition = {
          type: "AssignmentExpression",
          children: [ref, " ", initializer],
          hoistDec: {
            type: "Declaration",
            children: ["let ", ref],
            names: []
          },
          blockPrefix: [
            ["", [binding, "= ", ref, ...splices], ";"],
            ...thisAssignments
          ]
        };
        return initCondition;
      });
      function DeclarationCondition(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DeclarationCondition", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DeclarationCondition", state, DeclarationCondition$0(state));
          if (state.events)
            state.events.exit?.("DeclarationCondition", state, result, eventData);
          return result;
        } else {
          const result = DeclarationCondition$0(state);
          if (state.events)
            state.events.exit?.("DeclarationCondition", state, result, eventData);
          return result;
        }
      }
      var ExpressionWithIndentedApplicationForbidden$0 = $TS($S(ForbidIndentedApplication, ForbidNewlineBinaryOp, $E(ExtendedExpression), RestoreNewlineBinaryOp, RestoreIndentedApplication), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var exp = $3;
        if (exp)
          return exp;
        return $skip;
      });
      function ExpressionWithIndentedApplicationForbidden(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExpressionWithIndentedApplicationForbidden", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExpressionWithIndentedApplicationForbidden", state, ExpressionWithIndentedApplicationForbidden$0(state));
          if (state.events)
            state.events.exit?.("ExpressionWithIndentedApplicationForbidden", state, result, eventData);
          return result;
        } else {
          const result = ExpressionWithIndentedApplicationForbidden$0(state);
          if (state.events)
            state.events.exit?.("ExpressionWithIndentedApplicationForbidden", state, result, eventData);
          return result;
        }
      }
      var ForbidClassImplicitCall$0 = $TV($EXPECT($L0, fail, 'ForbidClassImplicitCall ""'), function($skip, $loc, $0, $1) {
        module.forbidClassImplicitCall.push(true);
      });
      function ForbidClassImplicitCall(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForbidClassImplicitCall", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForbidClassImplicitCall", state, ForbidClassImplicitCall$0(state));
          if (state.events)
            state.events.exit?.("ForbidClassImplicitCall", state, result, eventData);
          return result;
        } else {
          const result = ForbidClassImplicitCall$0(state);
          if (state.events)
            state.events.exit?.("ForbidClassImplicitCall", state, result, eventData);
          return result;
        }
      }
      var AllowClassImplicitCall$0 = $TV($EXPECT($L0, fail, 'AllowClassImplicitCall ""'), function($skip, $loc, $0, $1) {
        module.forbidClassImplicitCall.push(false);
      });
      function AllowClassImplicitCall(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AllowClassImplicitCall", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AllowClassImplicitCall", state, AllowClassImplicitCall$0(state));
          if (state.events)
            state.events.exit?.("AllowClassImplicitCall", state, result, eventData);
          return result;
        } else {
          const result = AllowClassImplicitCall$0(state);
          if (state.events)
            state.events.exit?.("AllowClassImplicitCall", state, result, eventData);
          return result;
        }
      }
      var RestoreClassImplicitCall$0 = $TV($EXPECT($L0, fail, 'RestoreClassImplicitCall ""'), function($skip, $loc, $0, $1) {
        module.forbidClassImplicitCall.pop();
      });
      function RestoreClassImplicitCall(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RestoreClassImplicitCall", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RestoreClassImplicitCall", state, RestoreClassImplicitCall$0(state));
          if (state.events)
            state.events.exit?.("RestoreClassImplicitCall", state, result, eventData);
          return result;
        } else {
          const result = RestoreClassImplicitCall$0(state);
          if (state.events)
            state.events.exit?.("RestoreClassImplicitCall", state, result, eventData);
          return result;
        }
      }
      var ClassImplicitCallForbidden$0 = $TV($EXPECT($L0, fail, 'ClassImplicitCallForbidden ""'), function($skip, $loc, $0, $1) {
        if (!module.classImplicitCallForbidden)
          return $skip;
        return;
      });
      function ClassImplicitCallForbidden(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ClassImplicitCallForbidden", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ClassImplicitCallForbidden", state, ClassImplicitCallForbidden$0(state));
          if (state.events)
            state.events.exit?.("ClassImplicitCallForbidden", state, result, eventData);
          return result;
        } else {
          const result = ClassImplicitCallForbidden$0(state);
          if (state.events)
            state.events.exit?.("ClassImplicitCallForbidden", state, result, eventData);
          return result;
        }
      }
      var ForbidIndentedApplication$0 = $TV($EXPECT($L0, fail, 'ForbidIndentedApplication ""'), function($skip, $loc, $0, $1) {
        module.forbidIndentedApplication.push(true);
      });
      function ForbidIndentedApplication(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForbidIndentedApplication", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForbidIndentedApplication", state, ForbidIndentedApplication$0(state));
          if (state.events)
            state.events.exit?.("ForbidIndentedApplication", state, result, eventData);
          return result;
        } else {
          const result = ForbidIndentedApplication$0(state);
          if (state.events)
            state.events.exit?.("ForbidIndentedApplication", state, result, eventData);
          return result;
        }
      }
      var AllowIndentedApplication$0 = $TV($EXPECT($L0, fail, 'AllowIndentedApplication ""'), function($skip, $loc, $0, $1) {
        module.forbidIndentedApplication.push(false);
      });
      function AllowIndentedApplication(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AllowIndentedApplication", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AllowIndentedApplication", state, AllowIndentedApplication$0(state));
          if (state.events)
            state.events.exit?.("AllowIndentedApplication", state, result, eventData);
          return result;
        } else {
          const result = AllowIndentedApplication$0(state);
          if (state.events)
            state.events.exit?.("AllowIndentedApplication", state, result, eventData);
          return result;
        }
      }
      var RestoreIndentedApplication$0 = $TV($EXPECT($L0, fail, 'RestoreIndentedApplication ""'), function($skip, $loc, $0, $1) {
        module.forbidIndentedApplication.pop();
      });
      function RestoreIndentedApplication(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RestoreIndentedApplication", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RestoreIndentedApplication", state, RestoreIndentedApplication$0(state));
          if (state.events)
            state.events.exit?.("RestoreIndentedApplication", state, result, eventData);
          return result;
        } else {
          const result = RestoreIndentedApplication$0(state);
          if (state.events)
            state.events.exit?.("RestoreIndentedApplication", state, result, eventData);
          return result;
        }
      }
      var IndentedApplicationAllowed$0 = $TV($EXPECT($L0, fail, 'IndentedApplicationAllowed ""'), function($skip, $loc, $0, $1) {
        if (module.config.verbose) {
          console.log("forbidIndentedApplication:", module.forbidIndentedApplication);
        }
        if (module.indentedApplicationForbidden)
          return $skip;
        return;
      });
      function IndentedApplicationAllowed(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IndentedApplicationAllowed", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IndentedApplicationAllowed", state, IndentedApplicationAllowed$0(state));
          if (state.events)
            state.events.exit?.("IndentedApplicationAllowed", state, result, eventData);
          return result;
        } else {
          const result = IndentedApplicationAllowed$0(state);
          if (state.events)
            state.events.exit?.("IndentedApplicationAllowed", state, result, eventData);
          return result;
        }
      }
      var ForbidTrailingMemberProperty$0 = $TV($EXPECT($L0, fail, 'ForbidTrailingMemberProperty ""'), function($skip, $loc, $0, $1) {
        module.forbidTrailingMemberProperty.push(true);
      });
      function ForbidTrailingMemberProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForbidTrailingMemberProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForbidTrailingMemberProperty", state, ForbidTrailingMemberProperty$0(state));
          if (state.events)
            state.events.exit?.("ForbidTrailingMemberProperty", state, result, eventData);
          return result;
        } else {
          const result = ForbidTrailingMemberProperty$0(state);
          if (state.events)
            state.events.exit?.("ForbidTrailingMemberProperty", state, result, eventData);
          return result;
        }
      }
      var AllowTrailingMemberProperty$0 = $TV($EXPECT($L0, fail, 'AllowTrailingMemberProperty ""'), function($skip, $loc, $0, $1) {
        module.forbidTrailingMemberProperty.push(false);
      });
      function AllowTrailingMemberProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AllowTrailingMemberProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AllowTrailingMemberProperty", state, AllowTrailingMemberProperty$0(state));
          if (state.events)
            state.events.exit?.("AllowTrailingMemberProperty", state, result, eventData);
          return result;
        } else {
          const result = AllowTrailingMemberProperty$0(state);
          if (state.events)
            state.events.exit?.("AllowTrailingMemberProperty", state, result, eventData);
          return result;
        }
      }
      var RestoreTrailingMemberProperty$0 = $TV($EXPECT($L0, fail, 'RestoreTrailingMemberProperty ""'), function($skip, $loc, $0, $1) {
        module.forbidTrailingMemberProperty.pop();
      });
      function RestoreTrailingMemberProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RestoreTrailingMemberProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RestoreTrailingMemberProperty", state, RestoreTrailingMemberProperty$0(state));
          if (state.events)
            state.events.exit?.("RestoreTrailingMemberProperty", state, result, eventData);
          return result;
        } else {
          const result = RestoreTrailingMemberProperty$0(state);
          if (state.events)
            state.events.exit?.("RestoreTrailingMemberProperty", state, result, eventData);
          return result;
        }
      }
      var TrailingMemberPropertyAllowed$0 = $TV($EXPECT($L0, fail, 'TrailingMemberPropertyAllowed ""'), function($skip, $loc, $0, $1) {
        if (module.config.verbose) {
          console.log("forbidTrailingMemberProperty:", module.forbidTrailingMemberProperty);
        }
        if (module.trailingMemberPropertyForbidden)
          return $skip;
      });
      function TrailingMemberPropertyAllowed(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TrailingMemberPropertyAllowed", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TrailingMemberPropertyAllowed", state, TrailingMemberPropertyAllowed$0(state));
          if (state.events)
            state.events.exit?.("TrailingMemberPropertyAllowed", state, result, eventData);
          return result;
        } else {
          const result = TrailingMemberPropertyAllowed$0(state);
          if (state.events)
            state.events.exit?.("TrailingMemberPropertyAllowed", state, result, eventData);
          return result;
        }
      }
      var ForbidMultiLineImplicitObjectLiteral$0 = $TV($EXPECT($L0, fail, 'ForbidMultiLineImplicitObjectLiteral ""'), function($skip, $loc, $0, $1) {
        module.forbidMultiLineImplicitObjectLiteral.push(true);
      });
      function ForbidMultiLineImplicitObjectLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForbidMultiLineImplicitObjectLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForbidMultiLineImplicitObjectLiteral", state, ForbidMultiLineImplicitObjectLiteral$0(state));
          if (state.events)
            state.events.exit?.("ForbidMultiLineImplicitObjectLiteral", state, result, eventData);
          return result;
        } else {
          const result = ForbidMultiLineImplicitObjectLiteral$0(state);
          if (state.events)
            state.events.exit?.("ForbidMultiLineImplicitObjectLiteral", state, result, eventData);
          return result;
        }
      }
      var AllowMultiLineImplicitObjectLiteral$0 = $TV($EXPECT($L0, fail, 'AllowMultiLineImplicitObjectLiteral ""'), function($skip, $loc, $0, $1) {
        module.forbidMultiLineImplicitObjectLiteral.push(false);
      });
      function AllowMultiLineImplicitObjectLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AllowMultiLineImplicitObjectLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AllowMultiLineImplicitObjectLiteral", state, AllowMultiLineImplicitObjectLiteral$0(state));
          if (state.events)
            state.events.exit?.("AllowMultiLineImplicitObjectLiteral", state, result, eventData);
          return result;
        } else {
          const result = AllowMultiLineImplicitObjectLiteral$0(state);
          if (state.events)
            state.events.exit?.("AllowMultiLineImplicitObjectLiteral", state, result, eventData);
          return result;
        }
      }
      var RestoreMultiLineImplicitObjectLiteral$0 = $TV($EXPECT($L0, fail, 'RestoreMultiLineImplicitObjectLiteral ""'), function($skip, $loc, $0, $1) {
        module.forbidMultiLineImplicitObjectLiteral.pop();
      });
      function RestoreMultiLineImplicitObjectLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RestoreMultiLineImplicitObjectLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RestoreMultiLineImplicitObjectLiteral", state, RestoreMultiLineImplicitObjectLiteral$0(state));
          if (state.events)
            state.events.exit?.("RestoreMultiLineImplicitObjectLiteral", state, result, eventData);
          return result;
        } else {
          const result = RestoreMultiLineImplicitObjectLiteral$0(state);
          if (state.events)
            state.events.exit?.("RestoreMultiLineImplicitObjectLiteral", state, result, eventData);
          return result;
        }
      }
      var MultiLineImplicitObjectLiteralAllowed$0 = $TV($EXPECT($L0, fail, 'MultiLineImplicitObjectLiteralAllowed ""'), function($skip, $loc, $0, $1) {
        if (module.config.verbose) {
          console.log("forbidMultiLineImplicitObjectLiteral:", module.forbidMultiLineImplicitObjectLiteral);
        }
        if (module.multiLineImplicitObjectLiteralForbidden)
          return $skip;
      });
      function MultiLineImplicitObjectLiteralAllowed(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MultiLineImplicitObjectLiteralAllowed", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MultiLineImplicitObjectLiteralAllowed", state, MultiLineImplicitObjectLiteralAllowed$0(state));
          if (state.events)
            state.events.exit?.("MultiLineImplicitObjectLiteralAllowed", state, result, eventData);
          return result;
        } else {
          const result = MultiLineImplicitObjectLiteralAllowed$0(state);
          if (state.events)
            state.events.exit?.("MultiLineImplicitObjectLiteralAllowed", state, result, eventData);
          return result;
        }
      }
      var AllowNewlineBinaryOp$0 = $TV($EXPECT($L0, fail, 'AllowNewlineBinaryOp ""'), function($skip, $loc, $0, $1) {
        module.forbidNewlineBinaryOp.push(false);
      });
      function AllowNewlineBinaryOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AllowNewlineBinaryOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AllowNewlineBinaryOp", state, AllowNewlineBinaryOp$0(state));
          if (state.events)
            state.events.exit?.("AllowNewlineBinaryOp", state, result, eventData);
          return result;
        } else {
          const result = AllowNewlineBinaryOp$0(state);
          if (state.events)
            state.events.exit?.("AllowNewlineBinaryOp", state, result, eventData);
          return result;
        }
      }
      var ForbidNewlineBinaryOp$0 = $TV($EXPECT($L0, fail, 'ForbidNewlineBinaryOp ""'), function($skip, $loc, $0, $1) {
        module.forbidNewlineBinaryOp.push(true);
      });
      function ForbidNewlineBinaryOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ForbidNewlineBinaryOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ForbidNewlineBinaryOp", state, ForbidNewlineBinaryOp$0(state));
          if (state.events)
            state.events.exit?.("ForbidNewlineBinaryOp", state, result, eventData);
          return result;
        } else {
          const result = ForbidNewlineBinaryOp$0(state);
          if (state.events)
            state.events.exit?.("ForbidNewlineBinaryOp", state, result, eventData);
          return result;
        }
      }
      var RestoreNewlineBinaryOp$0 = $TV($EXPECT($L0, fail, 'RestoreNewlineBinaryOp ""'), function($skip, $loc, $0, $1) {
        module.forbidNewlineBinaryOp.pop();
      });
      function RestoreNewlineBinaryOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RestoreNewlineBinaryOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RestoreNewlineBinaryOp", state, RestoreNewlineBinaryOp$0(state));
          if (state.events)
            state.events.exit?.("RestoreNewlineBinaryOp", state, result, eventData);
          return result;
        } else {
          const result = RestoreNewlineBinaryOp$0(state);
          if (state.events)
            state.events.exit?.("RestoreNewlineBinaryOp", state, result, eventData);
          return result;
        }
      }
      var NewlineBinaryOpAllowed$0 = $TV($EXPECT($L0, fail, 'NewlineBinaryOpAllowed ""'), function($skip, $loc, $0, $1) {
        if (module.config.verbose) {
          console.log("forbidNewlineBinaryOp:", module.forbidNewlineBinaryOp);
        }
        if (module.newlineBinaryOpForbidden)
          return $skip;
      });
      function NewlineBinaryOpAllowed(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NewlineBinaryOpAllowed", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NewlineBinaryOpAllowed", state, NewlineBinaryOpAllowed$0(state));
          if (state.events)
            state.events.exit?.("NewlineBinaryOpAllowed", state, result, eventData);
          return result;
        } else {
          const result = NewlineBinaryOpAllowed$0(state);
          if (state.events)
            state.events.exit?.("NewlineBinaryOpAllowed", state, result, eventData);
          return result;
        }
      }
      var AllowAll$0 = $S(AllowTrailingMemberProperty, AllowIndentedApplication, AllowMultiLineImplicitObjectLiteral, AllowClassImplicitCall, AllowNewlineBinaryOp);
      function AllowAll(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AllowAll", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AllowAll", state, AllowAll$0(state));
          if (state.events)
            state.events.exit?.("AllowAll", state, result, eventData);
          return result;
        } else {
          const result = AllowAll$0(state);
          if (state.events)
            state.events.exit?.("AllowAll", state, result, eventData);
          return result;
        }
      }
      var RestoreAll$0 = $S(RestoreTrailingMemberProperty, RestoreIndentedApplication, RestoreMultiLineImplicitObjectLiteral, RestoreClassImplicitCall, RestoreNewlineBinaryOp);
      function RestoreAll(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RestoreAll", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RestoreAll", state, RestoreAll$0(state));
          if (state.events)
            state.events.exit?.("RestoreAll", state, result, eventData);
          return result;
        } else {
          const result = RestoreAll$0(state);
          if (state.events)
            state.events.exit?.("RestoreAll", state, result, eventData);
          return result;
        }
      }
      var ExpressionStatement$0 = IterationExpression;
      var ExpressionStatement$1 = Expression;
      function ExpressionStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExpressionStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExpressionStatement", state, ExpressionStatement$0(state) || ExpressionStatement$1(state));
          if (state.events)
            state.events.exit?.("ExpressionStatement", state, result, eventData);
          return result;
        } else {
          const result = ExpressionStatement$0(state) || ExpressionStatement$1(state);
          if (state.events)
            state.events.exit?.("ExpressionStatement", state, result, eventData);
          return result;
        }
      }
      var KeywordStatement$0 = $TS($S(Break, $E($S(_, $E(Colon), Identifier))), function($skip, $loc, $0, $1, $2) {
        return {
          type: "BreakStatement",
          children: $2 ? [$1, $2[0], $2[2]] : [$1]
        };
      });
      var KeywordStatement$1 = $TS($S(Continue, $E($S(_, $E(Colon), Identifier))), function($skip, $loc, $0, $1, $2) {
        return {
          type: "ContinueStatement",
          children: $2 ? [$1, $2[0], $2[2]] : [$1]
        };
      });
      var KeywordStatement$2 = $T($S(Debugger), function(value) {
        return { "type": "DebuggerStatement", "children": value };
      });
      var KeywordStatement$3 = $T($S(Return, $N($C($EXPECT($L11, fail, 'KeywordStatement ":"'), $EXPECT($L5, fail, 'KeywordStatement "."'), AfterReturnShorthand)), $E(MaybeNestedExpression)), function(value) {
        var expression = value[2];
        return { "type": "ReturnStatement", "expression": expression, "children": value };
      });
      var KeywordStatement$4 = $T($S(Throw, ExtendedExpression), function(value) {
        return { "type": "ThrowStatement", "children": value };
      });
      function KeywordStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("KeywordStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("KeywordStatement", state, KeywordStatement$0(state) || KeywordStatement$1(state) || KeywordStatement$2(state) || KeywordStatement$3(state) || KeywordStatement$4(state));
          if (state.events)
            state.events.exit?.("KeywordStatement", state, result, eventData);
          return result;
        } else {
          const result = KeywordStatement$0(state) || KeywordStatement$1(state) || KeywordStatement$2(state) || KeywordStatement$3(state) || KeywordStatement$4(state);
          if (state.events)
            state.events.exit?.("KeywordStatement", state, result, eventData);
          return result;
        }
      }
      var Break$0 = $TS($S($EXPECT($L103, fail, 'Break "break"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Break(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Break", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Break", state, Break$0(state));
          if (state.events)
            state.events.exit?.("Break", state, result, eventData);
          return result;
        } else {
          const result = Break$0(state);
          if (state.events)
            state.events.exit?.("Break", state, result, eventData);
          return result;
        }
      }
      var Continue$0 = $TS($S($EXPECT($L104, fail, 'Continue "continue"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Continue(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Continue", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Continue", state, Continue$0(state));
          if (state.events)
            state.events.exit?.("Continue", state, result, eventData);
          return result;
        } else {
          const result = Continue$0(state);
          if (state.events)
            state.events.exit?.("Continue", state, result, eventData);
          return result;
        }
      }
      var Debugger$0 = $TS($S($EXPECT($L105, fail, 'Debugger "debugger"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Debugger(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Debugger", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Debugger", state, Debugger$0(state));
          if (state.events)
            state.events.exit?.("Debugger", state, result, eventData);
          return result;
        } else {
          const result = Debugger$0(state);
          if (state.events)
            state.events.exit?.("Debugger", state, result, eventData);
          return result;
        }
      }
      var DebuggerExpression$0 = $TS($S(Debugger), function($skip, $loc, $0, $1) {
        return {
          type: "DebuggerExpression",
          children: wrapIIFE($1)
        };
      });
      function DebuggerExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DebuggerExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DebuggerExpression", state, DebuggerExpression$0(state));
          if (state.events)
            state.events.exit?.("DebuggerExpression", state, result, eventData);
          return result;
        } else {
          const result = DebuggerExpression$0(state);
          if (state.events)
            state.events.exit?.("DebuggerExpression", state, result, eventData);
          return result;
        }
      }
      var ThrowExpression$0 = $TS($S(Throw, ExtendedExpression), function($skip, $loc, $0, $1, $2) {
        return {
          type: "ThrowExpression",
          children: wrapIIFE($0)
        };
      });
      function ThrowExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ThrowExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ThrowExpression", state, ThrowExpression$0(state));
          if (state.events)
            state.events.exit?.("ThrowExpression", state, result, eventData);
          return result;
        } else {
          const result = ThrowExpression$0(state);
          if (state.events)
            state.events.exit?.("ThrowExpression", state, result, eventData);
          return result;
        }
      }
      var MaybeNestedExpression$0 = $TS($S($N(EOS), ExtendedExpression), function($skip, $loc, $0, $1, $2) {
        return $2;
      });
      var MaybeNestedExpression$1 = $TS($S($Y(EOS), ObjectLiteral), function($skip, $loc, $0, $1, $2) {
        return $2;
      });
      var MaybeNestedExpression$2 = $S($Y(EOS), InsertSpace, InsertOpenParen, PushIndent, Nested, ExtendedExpression, PopIndent, InsertNewline, InsertIndent, InsertCloseParen);
      function MaybeNestedExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MaybeNestedExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MaybeNestedExpression", state, MaybeNestedExpression$0(state) || MaybeNestedExpression$1(state) || MaybeNestedExpression$2(state));
          if (state.events)
            state.events.exit?.("MaybeNestedExpression", state, result, eventData);
          return result;
        } else {
          const result = MaybeNestedExpression$0(state) || MaybeNestedExpression$1(state) || MaybeNestedExpression$2(state);
          if (state.events)
            state.events.exit?.("MaybeNestedExpression", state, result, eventData);
          return result;
        }
      }
      var ImportDeclaration$0 = $T($S(Import, __, TypeKeyword, __, ImportClause, __, FromClause, $E(ImportAssertion)), function(value) {
        return { "type": "ImportDeclaration", "ts": true, "children": value };
      });
      var ImportDeclaration$1 = $T($S(Import, __, ImportClause, __, FromClause, $E(ImportAssertion)), function(value) {
        return { "type": "ImportDeclaration", "children": value };
      });
      var ImportDeclaration$2 = $T($S(Import, __, ModuleSpecifier, $E(ImportAssertion)), function(value) {
        return { "type": "ImportDeclaration", "children": value };
      });
      var ImportDeclaration$3 = $TS($S(ImpliedImport, $E($S(TypeKeyword, __)), ImportClause, __, FromClause, $E(ImportAssertion)), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        var i = $1;
        var t = $2;
        var c = $3;
        var w = $4;
        var f = $5;
        var a = $6;
        i.$loc = {
          pos: f[0].$loc.pos - 1,
          length: f[0].$loc.length + 1
        };
        const children = [i, t, c, w, f, a];
        if (!t)
          return children;
        return { type: "ImportDeclaration", ts: true, children };
      });
      function ImportDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImportDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImportDeclaration", state, ImportDeclaration$0(state) || ImportDeclaration$1(state) || ImportDeclaration$2(state) || ImportDeclaration$3(state));
          if (state.events)
            state.events.exit?.("ImportDeclaration", state, result, eventData);
          return result;
        } else {
          const result = ImportDeclaration$0(state) || ImportDeclaration$1(state) || ImportDeclaration$2(state) || ImportDeclaration$3(state);
          if (state.events)
            state.events.exit?.("ImportDeclaration", state, result, eventData);
          return result;
        }
      }
      var ImpliedImport$0 = $TV($EXPECT($L0, fail, 'ImpliedImport ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "import " };
      });
      function ImpliedImport(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImpliedImport", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImpliedImport", state, ImpliedImport$0(state));
          if (state.events)
            state.events.exit?.("ImpliedImport", state, result, eventData);
          return result;
        } else {
          const result = ImpliedImport$0(state);
          if (state.events)
            state.events.exit?.("ImpliedImport", state, result, eventData);
          return result;
        }
      }
      var ImportClause$0 = $TS($S(ImportedBinding, $E($S(__, Comma, __, $C(NameSpaceImport, NamedImports)))), function($skip, $loc, $0, $1, $2) {
        var binding = $1;
        var rest = $2;
        if (rest) {
          return {
            type: "Declaration",
            children: $0,
            names: [...binding.names, ...rest[3].names]
          };
        }
        return {
          type: "Declaration",
          children: $0,
          names: binding.names
        };
      });
      var ImportClause$1 = NameSpaceImport;
      var ImportClause$2 = NamedImports;
      function ImportClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImportClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImportClause", state, ImportClause$0(state) || ImportClause$1(state) || ImportClause$2(state));
          if (state.events)
            state.events.exit?.("ImportClause", state, result, eventData);
          return result;
        } else {
          const result = ImportClause$0(state) || ImportClause$1(state) || ImportClause$2(state);
          if (state.events)
            state.events.exit?.("ImportClause", state, result, eventData);
          return result;
        }
      }
      var NameSpaceImport$0 = $TS($S(Star, ImportAsToken, __, ImportedBinding), function($skip, $loc, $0, $1, $2, $3, $4) {
        var binding = $4;
        return {
          type: "Declaration",
          children: $0,
          names: binding.names
        };
      });
      function NameSpaceImport(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NameSpaceImport", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NameSpaceImport", state, NameSpaceImport$0(state));
          if (state.events)
            state.events.exit?.("NameSpaceImport", state, result, eventData);
          return result;
        } else {
          const result = NameSpaceImport$0(state);
          if (state.events)
            state.events.exit?.("NameSpaceImport", state, result, eventData);
          return result;
        }
      }
      var NamedImports$0 = $TS($S(OpenBrace, $Q(TypeAndImportSpecifier), $E($S(__, Comma)), __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var specifiers = $2;
        const names = specifiers.flatMap(({ binding }) => binding.names);
        return {
          type: "Declaration",
          children: $0,
          names
        };
      });
      function NamedImports(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NamedImports", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NamedImports", state, NamedImports$0(state));
          if (state.events)
            state.events.exit?.("NamedImports", state, result, eventData);
          return result;
        } else {
          const result = NamedImports$0(state);
          if (state.events)
            state.events.exit?.("NamedImports", state, result, eventData);
          return result;
        }
      }
      var FromClause$0 = $S(From, __, ModuleSpecifier);
      function FromClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FromClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FromClause", state, FromClause$0(state));
          if (state.events)
            state.events.exit?.("FromClause", state, result, eventData);
          return result;
        } else {
          const result = FromClause$0(state);
          if (state.events)
            state.events.exit?.("FromClause", state, result, eventData);
          return result;
        }
      }
      var ImportAssertion$0 = $S($E(_), $EXPECT($L106, fail, 'ImportAssertion "assert"'), NonIdContinue, $E(_), ObjectLiteral);
      function ImportAssertion(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImportAssertion", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImportAssertion", state, ImportAssertion$0(state));
          if (state.events)
            state.events.exit?.("ImportAssertion", state, result, eventData);
          return result;
        } else {
          const result = ImportAssertion$0(state);
          if (state.events)
            state.events.exit?.("ImportAssertion", state, result, eventData);
          return result;
        }
      }
      var TypeAndImportSpecifier$0 = $TS($S($E($S(__, TypeKeyword)), ImportSpecifier), function($skip, $loc, $0, $1, $2) {
        if (!$1)
          return $2;
        return { ts: true, children: $0, binding: $2.binding };
      });
      var TypeAndImportSpecifier$1 = $TS($S(__, Operator, ImportSpecifier), function($skip, $loc, $0, $1, $2, $3) {
        var ws = $1;
        var spec = $3;
        if (spec.binding.type !== "Identifier") {
          throw new Error("Expected identifier after `operator`");
        }
        module.operators.add(spec.binding.name);
        return {
          ...spec,
          children: [
            ws,
            insertTrimmingSpace(spec[0], ""),
            spec.children.slice(1)
          ]
        };
      });
      function TypeAndImportSpecifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeAndImportSpecifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeAndImportSpecifier", state, TypeAndImportSpecifier$0(state) || TypeAndImportSpecifier$1(state));
          if (state.events)
            state.events.exit?.("TypeAndImportSpecifier", state, result, eventData);
          return result;
        } else {
          const result = TypeAndImportSpecifier$0(state) || TypeAndImportSpecifier$1(state);
          if (state.events)
            state.events.exit?.("TypeAndImportSpecifier", state, result, eventData);
          return result;
        }
      }
      var ImportSpecifier$0 = $TS($S(__, ModuleExportName, ImportAsToken, __, ImportedBinding, ObjectPropertyDelimiter), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        var binding = $5;
        return {
          binding,
          children: $0
        };
      });
      var ImportSpecifier$1 = $TS($S(__, ImportedBinding, ObjectPropertyDelimiter), function($skip, $loc, $0, $1, $2, $3) {
        var binding = $2;
        return {
          binding,
          children: $0
        };
      });
      function ImportSpecifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImportSpecifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImportSpecifier", state, ImportSpecifier$0(state) || ImportSpecifier$1(state));
          if (state.events)
            state.events.exit?.("ImportSpecifier", state, result, eventData);
          return result;
        } else {
          const result = ImportSpecifier$0(state) || ImportSpecifier$1(state);
          if (state.events)
            state.events.exit?.("ImportSpecifier", state, result, eventData);
          return result;
        }
      }
      var ImportAsToken$0 = $S(__, As);
      var ImportAsToken$1 = $TS($S(Loc, __, Colon, $E($EXPECT($L10, fail, 'ImportAsToken " "'))), function($skip, $loc, $0, $1, $2, $3, $4) {
        var l = $1;
        var ws = $2;
        var c = $3;
        const children = [
          ...ws,
          { ...c, token: "as " }
        ];
        if (!ws.length) {
          children.unshift({ $loc: l.$loc, token: " " });
        }
        return {
          children
        };
      });
      function ImportAsToken(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImportAsToken", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImportAsToken", state, ImportAsToken$0(state) || ImportAsToken$1(state));
          if (state.events)
            state.events.exit?.("ImportAsToken", state, result, eventData);
          return result;
        } else {
          const result = ImportAsToken$0(state) || ImportAsToken$1(state);
          if (state.events)
            state.events.exit?.("ImportAsToken", state, result, eventData);
          return result;
        }
      }
      var ModuleExportName$0 = StringLiteral;
      var ModuleExportName$1 = IdentifierName;
      function ModuleExportName(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ModuleExportName", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ModuleExportName", state, ModuleExportName$0(state) || ModuleExportName$1(state));
          if (state.events)
            state.events.exit?.("ModuleExportName", state, result, eventData);
          return result;
        } else {
          const result = ModuleExportName$0(state) || ModuleExportName$1(state);
          if (state.events)
            state.events.exit?.("ModuleExportName", state, result, eventData);
          return result;
        }
      }
      var ModuleSpecifier$0 = $TS($S(UnprocessedModuleSpecifier), function($skip, $loc, $0, $1) {
        if (!module.config.rewriteTsImports)
          return $1;
        const { token } = $1;
        return { $loc, token: token.replace(/\.([mc])?ts(['"])$/, ".$1js$2") };
      });
      function ModuleSpecifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ModuleSpecifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ModuleSpecifier", state, ModuleSpecifier$0(state));
          if (state.events)
            state.events.exit?.("ModuleSpecifier", state, result, eventData);
          return result;
        } else {
          const result = ModuleSpecifier$0(state);
          if (state.events)
            state.events.exit?.("ModuleSpecifier", state, result, eventData);
          return result;
        }
      }
      var UnprocessedModuleSpecifier$0 = StringLiteral;
      var UnprocessedModuleSpecifier$1 = UnquotedSpecifier;
      function UnprocessedModuleSpecifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UnprocessedModuleSpecifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UnprocessedModuleSpecifier", state, UnprocessedModuleSpecifier$0(state) || UnprocessedModuleSpecifier$1(state));
          if (state.events)
            state.events.exit?.("UnprocessedModuleSpecifier", state, result, eventData);
          return result;
        } else {
          const result = UnprocessedModuleSpecifier$0(state) || UnprocessedModuleSpecifier$1(state);
          if (state.events)
            state.events.exit?.("UnprocessedModuleSpecifier", state, result, eventData);
          return result;
        }
      }
      var UnquotedSpecifier$0 = $TV($EXPECT($R11, fail, 'UnquotedSpecifier /[^;"\\s]+/'), function($skip, $loc, $0, $1) {
        var spec = $0;
        return { $loc, token: `"${spec}"` };
      });
      function UnquotedSpecifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UnquotedSpecifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UnquotedSpecifier", state, UnquotedSpecifier$0(state));
          if (state.events)
            state.events.exit?.("UnquotedSpecifier", state, result, eventData);
          return result;
        } else {
          const result = UnquotedSpecifier$0(state);
          if (state.events)
            state.events.exit?.("UnquotedSpecifier", state, result, eventData);
          return result;
        }
      }
      var ImportedBinding$0 = BindingIdentifier;
      function ImportedBinding(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImportedBinding", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImportedBinding", state, ImportedBinding$0(state));
          if (state.events)
            state.events.exit?.("ImportedBinding", state, result, eventData);
          return result;
        } else {
          const result = ImportedBinding$0(state);
          if (state.events)
            state.events.exit?.("ImportedBinding", state, result, eventData);
          return result;
        }
      }
      var ExportDeclaration$0 = $TS($S($E(Decorators), Export, __, Default, __, $C(HoistableDeclaration, ClassDeclaration, ExtendedExpression)), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        return { type: "ExportDeclaration", children: $0 };
      });
      var ExportDeclaration$1 = $TS($S(Export, __, ExportFromClause, __, FromClause), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        return { type: "ExportDeclaration", ts: $3.ts, children: $0 };
      });
      var ExportDeclaration$2 = $TS($S($E(Decorators), Export, __, $C(Declaration, VariableStatement, TypeAndNamedExports, ExportVarDec)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var decl = $4;
        return { type: "ExportDeclaration", ts: decl.ts, children: $0 };
      });
      function ExportDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExportDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExportDeclaration", state, ExportDeclaration$0(state) || ExportDeclaration$1(state) || ExportDeclaration$2(state));
          if (state.events)
            state.events.exit?.("ExportDeclaration", state, result, eventData);
          return result;
        } else {
          const result = ExportDeclaration$0(state) || ExportDeclaration$1(state) || ExportDeclaration$2(state);
          if (state.events)
            state.events.exit?.("ExportDeclaration", state, result, eventData);
          return result;
        }
      }
      var ExportVarDec$0 = $TS($S(InsertVar, VariableDeclarationList), function($skip, $loc, $0, $1, $2) {
        return {
          ...$2,
          children: [$1, ...$2.children]
        };
      });
      function ExportVarDec(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExportVarDec", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExportVarDec", state, ExportVarDec$0(state));
          if (state.events)
            state.events.exit?.("ExportVarDec", state, result, eventData);
          return result;
        } else {
          const result = ExportVarDec$0(state);
          if (state.events)
            state.events.exit?.("ExportVarDec", state, result, eventData);
          return result;
        }
      }
      var ExportFromClause$0 = $S(Star, $E($S(__, As, __, ModuleExportName)));
      var ExportFromClause$1 = TypeAndNamedExports;
      function ExportFromClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExportFromClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExportFromClause", state, ExportFromClause$0(state) || ExportFromClause$1(state));
          if (state.events)
            state.events.exit?.("ExportFromClause", state, result, eventData);
          return result;
        } else {
          const result = ExportFromClause$0(state) || ExportFromClause$1(state);
          if (state.events)
            state.events.exit?.("ExportFromClause", state, result, eventData);
          return result;
        }
      }
      var TypeAndNamedExports$0 = $TS($S($E($S(TypeKeyword, __)), NamedExports), function($skip, $loc, $0, $1, $2) {
        if (!$1)
          return $2;
        return { ts: true, children: $0 };
      });
      function TypeAndNamedExports(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeAndNamedExports", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeAndNamedExports", state, TypeAndNamedExports$0(state));
          if (state.events)
            state.events.exit?.("TypeAndNamedExports", state, result, eventData);
          return result;
        } else {
          const result = TypeAndNamedExports$0(state);
          if (state.events)
            state.events.exit?.("TypeAndNamedExports", state, result, eventData);
          return result;
        }
      }
      var NamedExports$0 = $S(OpenBrace, $Q(ExportSpecifier), $E($S(__, Comma)), __, CloseBrace);
      var NamedExports$1 = $TS($S(InsertInlineOpenBrace, ImplicitExportSpecifier, $Q($S(ImplicitInlineObjectPropertyDelimiter, ImplicitExportSpecifier)), InsertCloseBrace, $Y($C(StatementDelimiter, $S(__, From)))), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var open = $1;
        var first = $2;
        var rest = $3;
        var close = $4;
        return [open, first, ...rest, close];
      });
      function NamedExports(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NamedExports", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NamedExports", state, NamedExports$0(state) || NamedExports$1(state));
          if (state.events)
            state.events.exit?.("NamedExports", state, result, eventData);
          return result;
        } else {
          const result = NamedExports$0(state) || NamedExports$1(state);
          if (state.events)
            state.events.exit?.("NamedExports", state, result, eventData);
          return result;
        }
      }
      var ExportSpecifier$0 = $TS($S(__, $E($S(TypeKeyword, __)), ModuleExportName, $E($S(__, As, __, ModuleExportName)), ObjectPropertyDelimiter), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        if (!$2)
          return $0;
        return { ts: true, children: $0 };
      });
      function ExportSpecifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExportSpecifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExportSpecifier", state, ExportSpecifier$0(state));
          if (state.events)
            state.events.exit?.("ExportSpecifier", state, result, eventData);
          return result;
        } else {
          const result = ExportSpecifier$0(state);
          if (state.events)
            state.events.exit?.("ExportSpecifier", state, result, eventData);
          return result;
        }
      }
      var ImplicitExportSpecifier$0 = $S($N(Default), ModuleExportName, $E($S(__, As, __, ModuleExportName)));
      function ImplicitExportSpecifier(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImplicitExportSpecifier", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImplicitExportSpecifier", state, ImplicitExportSpecifier$0(state));
          if (state.events)
            state.events.exit?.("ImplicitExportSpecifier", state, result, eventData);
          return result;
        } else {
          const result = ImplicitExportSpecifier$0(state);
          if (state.events)
            state.events.exit?.("ImplicitExportSpecifier", state, result, eventData);
          return result;
        }
      }
      var Declaration$0 = HoistableDeclaration;
      var Declaration$1 = ClassDeclaration;
      var Declaration$2 = $TV(LexicalDeclaration, function($skip, $loc, $0, $1) {
        var d = $0;
        if (d.thisAssignments?.length)
          return {
            ...d,
            children: [...d.children, ...d.splices, ";", ...d.thisAssignments]
          };
        if (d.splices?.length)
          return {
            ...d,
            children: [...d.children, ...d.splices]
          };
        return d;
      });
      var Declaration$3 = TypeDeclaration;
      var Declaration$4 = EnumDeclaration;
      var Declaration$5 = OperatorDeclaration;
      function Declaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Declaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Declaration", state, Declaration$0(state) || Declaration$1(state) || Declaration$2(state) || Declaration$3(state) || Declaration$4(state) || Declaration$5(state));
          if (state.events)
            state.events.exit?.("Declaration", state, result, eventData);
          return result;
        } else {
          const result = Declaration$0(state) || Declaration$1(state) || Declaration$2(state) || Declaration$3(state) || Declaration$4(state) || Declaration$5(state);
          if (state.events)
            state.events.exit?.("Declaration", state, result, eventData);
          return result;
        }
      }
      var HoistableDeclaration$0 = FunctionDeclaration;
      function HoistableDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("HoistableDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("HoistableDeclaration", state, HoistableDeclaration$0(state));
          if (state.events)
            state.events.exit?.("HoistableDeclaration", state, result, eventData);
          return result;
        } else {
          const result = HoistableDeclaration$0(state);
          if (state.events)
            state.events.exit?.("HoistableDeclaration", state, result, eventData);
          return result;
        }
      }
      var LexicalDeclaration$0 = $TS($S(LetOrConst, LexicalBinding, $Q($S(__, Comma, LexicalBinding))), function($skip, $loc, $0, $1, $2, $3) {
        var d = $1;
        var binding = $2;
        var tail = $3;
        const { splices, thisAssignments } = binding;
        return {
          type: "Declaration",
          children: $0,
          names: [...binding.names].concat(tail.flatMap(([, , b]) => b.names)),
          binding: {
            ...binding.binding,
            children: [d, ...binding.binding.children]
          },
          initializer: binding.initializer,
          splices,
          thisAssignments
        };
      });
      var LexicalDeclaration$1 = $TS($S(InsertConst, $C(BindingPattern, BindingIdentifier), $E(TypeSuffix), __, ConstAssignment, ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        return processConstAssignmentDeclaration(...$0);
      });
      var LexicalDeclaration$2 = $TS($S(InsertLet, $C(BindingPattern, BindingIdentifier), $E(TypeSuffix), __, LetAssignment, ExtendedExpression), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        var l = $1;
        var id = $2;
        var suffix = $3;
        var ws = $4;
        var la = $5;
        var e = $6;
        return processLetAssignmentDeclaration(...$0);
      });
      function LexicalDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LexicalDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LexicalDeclaration", state, LexicalDeclaration$0(state) || LexicalDeclaration$1(state) || LexicalDeclaration$2(state));
          if (state.events)
            state.events.exit?.("LexicalDeclaration", state, result, eventData);
          return result;
        } else {
          const result = LexicalDeclaration$0(state) || LexicalDeclaration$1(state) || LexicalDeclaration$2(state);
          if (state.events)
            state.events.exit?.("LexicalDeclaration", state, result, eventData);
          return result;
        }
      }
      var ConstAssignment$0 = $TV($C($EXPECT($L107, fail, 'ConstAssignment ":="'), $EXPECT($L108, fail, 'ConstAssignment "\u2254"')), function($skip, $loc, $0, $1) {
        return { $loc, token: "=" };
      });
      function ConstAssignment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ConstAssignment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ConstAssignment", state, ConstAssignment$0(state));
          if (state.events)
            state.events.exit?.("ConstAssignment", state, result, eventData);
          return result;
        } else {
          const result = ConstAssignment$0(state);
          if (state.events)
            state.events.exit?.("ConstAssignment", state, result, eventData);
          return result;
        }
      }
      var LetAssignment$0 = $TV($EXPECT($L109, fail, 'LetAssignment ".="'), function($skip, $loc, $0, $1) {
        return { $loc, token: "=" };
      });
      function LetAssignment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LetAssignment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LetAssignment", state, LetAssignment$0(state));
          if (state.events)
            state.events.exit?.("LetAssignment", state, result, eventData);
          return result;
        } else {
          const result = LetAssignment$0(state);
          if (state.events)
            state.events.exit?.("LetAssignment", state, result, eventData);
          return result;
        }
      }
      var LexicalBinding$0 = $TS($S(BindingPattern, $E(TypeSuffix), $E(_), Initializer), function($skip, $loc, $0, $1, $2, $3, $4) {
        var binding = $1;
        var suffix = $2;
        var ws = $3;
        var initializer = $4;
        const bindingChildren = [...binding.children];
        if (suffix)
          bindingChildren.push(suffix);
        if (ws)
          bindingChildren.push(...ws);
        binding = {
          ...binding,
          children: bindingChildren
        };
        const [splices, thisAssignments] = gatherBindingCode(binding.children);
        return {
          children: [binding, initializer],
          names: binding.names,
          binding,
          initializer,
          splices: splices.map((s) => [",", s]),
          thisAssignments: thisAssignments.map((s) => ["", s, ";"])
        };
      });
      var LexicalBinding$1 = $TS($S(BindingIdentifier, $E(TypeSuffix), $E(_), $E(Initializer)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var binding = $1;
        var suffix = $2;
        var ws = $3;
        var initializer = $4;
        const bindingChildren = [...binding.children];
        if (suffix)
          bindingChildren.push(suffix);
        if (ws)
          bindingChildren.push(...ws);
        binding = {
          ...binding,
          children: bindingChildren
        };
        return {
          children: [binding, initializer],
          names: binding.names,
          binding,
          initializer,
          splices: [],
          thisAssignments: []
        };
      });
      function LexicalBinding(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LexicalBinding", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LexicalBinding", state, LexicalBinding$0(state) || LexicalBinding$1(state));
          if (state.events)
            state.events.exit?.("LexicalBinding", state, result, eventData);
          return result;
        } else {
          const result = LexicalBinding$0(state) || LexicalBinding$1(state);
          if (state.events)
            state.events.exit?.("LexicalBinding", state, result, eventData);
          return result;
        }
      }
      var Initializer$0 = $S(__, Equals, ExtendedExpression);
      function Initializer(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Initializer", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Initializer", state, Initializer$0(state));
          if (state.events)
            state.events.exit?.("Initializer", state, result, eventData);
          return result;
        } else {
          const result = Initializer$0(state);
          if (state.events)
            state.events.exit?.("Initializer", state, result, eventData);
          return result;
        }
      }
      var VariableStatement$0 = $TS($S(Var, __, VariableDeclarationList), function($skip, $loc, $0, $1, $2, $3) {
        return Object.assign({}, $3, {
          children: [$1, ...$2, ...$3.children]
        });
      });
      function VariableStatement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("VariableStatement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("VariableStatement", state, VariableStatement$0(state));
          if (state.events)
            state.events.exit?.("VariableStatement", state, result, eventData);
          return result;
        } else {
          const result = VariableStatement$0(state);
          if (state.events)
            state.events.exit?.("VariableStatement", state, result, eventData);
          return result;
        }
      }
      var VariableDeclarationList$0 = $TS($S(VariableDeclaration, $Q($S(__, Comma, __, VariableDeclaration))), function($skip, $loc, $0, $1, $2) {
        let children;
        if ($2.length) {
          children = [$1, ...$2];
        } else {
          children = [$1];
        }
        const names = children.flatMap((c) => c.names || []);
        return {
          type: "Declaration",
          children,
          names
        };
      });
      function VariableDeclarationList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("VariableDeclarationList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("VariableDeclarationList", state, VariableDeclarationList$0(state));
          if (state.events)
            state.events.exit?.("VariableDeclarationList", state, result, eventData);
          return result;
        } else {
          const result = VariableDeclarationList$0(state);
          if (state.events)
            state.events.exit?.("VariableDeclarationList", state, result, eventData);
          return result;
        }
      }
      var VariableDeclaration$0 = $TS($S(BindingPattern, $E(TypeSuffix), Initializer), function($skip, $loc, $0, $1, $2, $3) {
        const children = [...$1.children];
        if ($2)
          children.push($2);
        children.push($3);
        return {
          children,
          names: $1.names
        };
      });
      var VariableDeclaration$1 = $TS($S(BindingIdentifier, $E(TypeSuffix), $E(Initializer)), function($skip, $loc, $0, $1, $2, $3) {
        const children = [...$1.children];
        if ($2)
          children.push($2);
        if ($3)
          children.push($3);
        return {
          children,
          names: $1.names
        };
      });
      function VariableDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("VariableDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("VariableDeclaration", state, VariableDeclaration$0(state) || VariableDeclaration$1(state));
          if (state.events)
            state.events.exit?.("VariableDeclaration", state, result, eventData);
          return result;
        } else {
          const result = VariableDeclaration$0(state) || VariableDeclaration$1(state);
          if (state.events)
            state.events.exit?.("VariableDeclaration", state, result, eventData);
          return result;
        }
      }
      var NumericLiteral$0 = $TS($S(NumericLiteralKind), function($skip, $loc, $0, $1) {
        return { type: "NumericLiteral", $loc, token: $1 };
      });
      function NumericLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NumericLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NumericLiteral", state, NumericLiteral$0(state));
          if (state.events)
            state.events.exit?.("NumericLiteral", state, result, eventData);
          return result;
        } else {
          const result = NumericLiteral$0(state);
          if (state.events)
            state.events.exit?.("NumericLiteral", state, result, eventData);
          return result;
        }
      }
      var NumericLiteralKind$0 = DecimalBigIntegerLiteral;
      var NumericLiteralKind$1 = BinaryIntegerLiteral;
      var NumericLiteralKind$2 = OctalIntegerLiteral;
      var NumericLiteralKind$3 = HexIntegerLiteral;
      var NumericLiteralKind$4 = DecimalLiteral;
      function NumericLiteralKind(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NumericLiteralKind", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NumericLiteralKind", state, NumericLiteralKind$0(state) || NumericLiteralKind$1(state) || NumericLiteralKind$2(state) || NumericLiteralKind$3(state) || NumericLiteralKind$4(state));
          if (state.events)
            state.events.exit?.("NumericLiteralKind", state, result, eventData);
          return result;
        } else {
          const result = NumericLiteralKind$0(state) || NumericLiteralKind$1(state) || NumericLiteralKind$2(state) || NumericLiteralKind$3(state) || NumericLiteralKind$4(state);
          if (state.events)
            state.events.exit?.("NumericLiteralKind", state, result, eventData);
          return result;
        }
      }
      var DecimalBigIntegerLiteral$0 = $R$0($EXPECT($R12, fail, "DecimalBigIntegerLiteral /(?:0|[1-9](?:_[0-9]|[0-9])*)n/"));
      function DecimalBigIntegerLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DecimalBigIntegerLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DecimalBigIntegerLiteral", state, DecimalBigIntegerLiteral$0(state));
          if (state.events)
            state.events.exit?.("DecimalBigIntegerLiteral", state, result, eventData);
          return result;
        } else {
          const result = DecimalBigIntegerLiteral$0(state);
          if (state.events)
            state.events.exit?.("DecimalBigIntegerLiteral", state, result, eventData);
          return result;
        }
      }
      var DecimalLiteral$0 = $TV($TEXT($EXPECT($R13, fail, "DecimalLiteral /(?:0|[1-9](?:_[0-9]|[0-9])*)(?=\\.(?:\\p{ID_Start}|[_$]))/")), function($skip, $loc, $0, $1) {
        return $1 + ".";
      });
      var DecimalLiteral$1 = $TEXT($S($EXPECT($R14, fail, "DecimalLiteral /(?:0|[1-9](?:_[0-9]|[0-9])*)(?:\\.(?:[0-9](?:_[0-9]|[0-9])*))?/"), $E(ExponentPart)));
      var DecimalLiteral$2 = $TEXT($S($EXPECT($R15, fail, "DecimalLiteral /(?:\\.[0-9](?:_[0-9]|[0-9])*)/"), $E(ExponentPart)));
      function DecimalLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DecimalLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DecimalLiteral", state, DecimalLiteral$0(state) || DecimalLiteral$1(state) || DecimalLiteral$2(state));
          if (state.events)
            state.events.exit?.("DecimalLiteral", state, result, eventData);
          return result;
        } else {
          const result = DecimalLiteral$0(state) || DecimalLiteral$1(state) || DecimalLiteral$2(state);
          if (state.events)
            state.events.exit?.("DecimalLiteral", state, result, eventData);
          return result;
        }
      }
      var ExponentPart$0 = $R$0($EXPECT($R16, fail, "ExponentPart /(?:[eE][+-]?[0-9]+(?:_[0-9]|[0-9])*)/"));
      function ExponentPart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExponentPart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExponentPart", state, ExponentPart$0(state));
          if (state.events)
            state.events.exit?.("ExponentPart", state, result, eventData);
          return result;
        } else {
          const result = ExponentPart$0(state);
          if (state.events)
            state.events.exit?.("ExponentPart", state, result, eventData);
          return result;
        }
      }
      var BinaryIntegerLiteral$0 = $R$0($EXPECT($R17, fail, "BinaryIntegerLiteral /0[bB][01](?:[01]|_[01])*n?/"));
      function BinaryIntegerLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BinaryIntegerLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BinaryIntegerLiteral", state, BinaryIntegerLiteral$0(state));
          if (state.events)
            state.events.exit?.("BinaryIntegerLiteral", state, result, eventData);
          return result;
        } else {
          const result = BinaryIntegerLiteral$0(state);
          if (state.events)
            state.events.exit?.("BinaryIntegerLiteral", state, result, eventData);
          return result;
        }
      }
      var OctalIntegerLiteral$0 = $R$0($EXPECT($R18, fail, "OctalIntegerLiteral /0[oO][0-7](?:[0-7]|_[0-7])*n?/"));
      function OctalIntegerLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OctalIntegerLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OctalIntegerLiteral", state, OctalIntegerLiteral$0(state));
          if (state.events)
            state.events.exit?.("OctalIntegerLiteral", state, result, eventData);
          return result;
        } else {
          const result = OctalIntegerLiteral$0(state);
          if (state.events)
            state.events.exit?.("OctalIntegerLiteral", state, result, eventData);
          return result;
        }
      }
      var HexIntegerLiteral$0 = $R$0($EXPECT($R19, fail, "HexIntegerLiteral /0[xX][0-9a-fA-F](?:[0-9a-fA-F]|_[0-9a-fA-F])*n?/"));
      function HexIntegerLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("HexIntegerLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("HexIntegerLiteral", state, HexIntegerLiteral$0(state));
          if (state.events)
            state.events.exit?.("HexIntegerLiteral", state, result, eventData);
          return result;
        } else {
          const result = HexIntegerLiteral$0(state);
          if (state.events)
            state.events.exit?.("HexIntegerLiteral", state, result, eventData);
          return result;
        }
      }
      var IntegerLiteral$0 = $TS($S(IntegerLiteralKind), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function IntegerLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IntegerLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IntegerLiteral", state, IntegerLiteral$0(state));
          if (state.events)
            state.events.exit?.("IntegerLiteral", state, result, eventData);
          return result;
        } else {
          const result = IntegerLiteral$0(state);
          if (state.events)
            state.events.exit?.("IntegerLiteral", state, result, eventData);
          return result;
        }
      }
      var IntegerLiteralKind$0 = DecimalBigIntegerLiteral;
      var IntegerLiteralKind$1 = BinaryIntegerLiteral;
      var IntegerLiteralKind$2 = OctalIntegerLiteral;
      var IntegerLiteralKind$3 = HexIntegerLiteral;
      var IntegerLiteralKind$4 = DecimalIntegerLiteral;
      function IntegerLiteralKind(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IntegerLiteralKind", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IntegerLiteralKind", state, IntegerLiteralKind$0(state) || IntegerLiteralKind$1(state) || IntegerLiteralKind$2(state) || IntegerLiteralKind$3(state) || IntegerLiteralKind$4(state));
          if (state.events)
            state.events.exit?.("IntegerLiteralKind", state, result, eventData);
          return result;
        } else {
          const result = IntegerLiteralKind$0(state) || IntegerLiteralKind$1(state) || IntegerLiteralKind$2(state) || IntegerLiteralKind$3(state) || IntegerLiteralKind$4(state);
          if (state.events)
            state.events.exit?.("IntegerLiteralKind", state, result, eventData);
          return result;
        }
      }
      var DecimalIntegerLiteral$0 = $R$0($EXPECT($R20, fail, "DecimalIntegerLiteral /(?:0|[1-9](?:_[0-9]|[0-9])*)/"));
      function DecimalIntegerLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DecimalIntegerLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DecimalIntegerLiteral", state, DecimalIntegerLiteral$0(state));
          if (state.events)
            state.events.exit?.("DecimalIntegerLiteral", state, result, eventData);
          return result;
        } else {
          const result = DecimalIntegerLiteral$0(state);
          if (state.events)
            state.events.exit?.("DecimalIntegerLiteral", state, result, eventData);
          return result;
        }
      }
      var StringLiteral$0 = $TS($S(DoubleQuote, DoubleStringCharacters, DoubleQuote), function($skip, $loc, $0, $1, $2, $3) {
        var str = $2;
        return {
          type: "StringLiteral",
          token: `"${modifyString(str.token)}"`,
          $loc
        };
      });
      var StringLiteral$1 = $TS($S(SingleQuote, SingleStringCharacters, SingleQuote), function($skip, $loc, $0, $1, $2, $3) {
        var str = $2;
        return {
          type: "StringLiteral",
          token: `'${modifyString(str.token)}'`,
          $loc
        };
      });
      function StringLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("StringLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("StringLiteral", state, StringLiteral$0(state) || StringLiteral$1(state));
          if (state.events)
            state.events.exit?.("StringLiteral", state, result, eventData);
          return result;
        } else {
          const result = StringLiteral$0(state) || StringLiteral$1(state);
          if (state.events)
            state.events.exit?.("StringLiteral", state, result, eventData);
          return result;
        }
      }
      var DoubleStringCharacters$0 = $TR($EXPECT($R21, fail, 'DoubleStringCharacters /(?:\\\\.|[^"])*/'), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function DoubleStringCharacters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DoubleStringCharacters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DoubleStringCharacters", state, DoubleStringCharacters$0(state));
          if (state.events)
            state.events.exit?.("DoubleStringCharacters", state, result, eventData);
          return result;
        } else {
          const result = DoubleStringCharacters$0(state);
          if (state.events)
            state.events.exit?.("DoubleStringCharacters", state, result, eventData);
          return result;
        }
      }
      var SingleStringCharacters$0 = $TR($EXPECT($R22, fail, "SingleStringCharacters /(?:\\\\.|[^'])*/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function SingleStringCharacters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SingleStringCharacters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SingleStringCharacters", state, SingleStringCharacters$0(state));
          if (state.events)
            state.events.exit?.("SingleStringCharacters", state, result, eventData);
          return result;
        } else {
          const result = SingleStringCharacters$0(state);
          if (state.events)
            state.events.exit?.("SingleStringCharacters", state, result, eventData);
          return result;
        }
      }
      var TripleDoubleStringCharacters$0 = $TR($EXPECT($R23, fail, 'TripleDoubleStringCharacters /(?:"(?!"")|#(?!\\{)|\\\\.|[^#"])+/'), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function TripleDoubleStringCharacters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TripleDoubleStringCharacters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TripleDoubleStringCharacters", state, TripleDoubleStringCharacters$0(state));
          if (state.events)
            state.events.exit?.("TripleDoubleStringCharacters", state, result, eventData);
          return result;
        } else {
          const result = TripleDoubleStringCharacters$0(state);
          if (state.events)
            state.events.exit?.("TripleDoubleStringCharacters", state, result, eventData);
          return result;
        }
      }
      var TripleSingleStringCharacters$0 = $TR($EXPECT($R24, fail, "TripleSingleStringCharacters /(?:'(?!'')|\\\\.|[^'])*/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function TripleSingleStringCharacters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TripleSingleStringCharacters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TripleSingleStringCharacters", state, TripleSingleStringCharacters$0(state));
          if (state.events)
            state.events.exit?.("TripleSingleStringCharacters", state, result, eventData);
          return result;
        } else {
          const result = TripleSingleStringCharacters$0(state);
          if (state.events)
            state.events.exit?.("TripleSingleStringCharacters", state, result, eventData);
          return result;
        }
      }
      var CoffeeStringSubstitution$0 = $S(CoffeeSubstitutionStart, PostfixedExpression, __, CloseBrace);
      function CoffeeStringSubstitution(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeStringSubstitution", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeStringSubstitution", state, CoffeeStringSubstitution$0(state));
          if (state.events)
            state.events.exit?.("CoffeeStringSubstitution", state, result, eventData);
          return result;
        } else {
          const result = CoffeeStringSubstitution$0(state);
          if (state.events)
            state.events.exit?.("CoffeeStringSubstitution", state, result, eventData);
          return result;
        }
      }
      var CoffeeInterpolatedDoubleQuotedString$0 = $TS($S(CoffeeInterpolationEnabled, DoubleQuote, $Q($C(CoffeeDoubleQuotedStringCharacters, CoffeeStringSubstitution)), DoubleQuote), function($skip, $loc, $0, $1, $2, $3, $4) {
        var s = $2;
        var parts = $3;
        var e = $4;
        return processCoffeeInterpolation(s, parts, e, $loc);
      });
      function CoffeeInterpolatedDoubleQuotedString(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeInterpolatedDoubleQuotedString", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeInterpolatedDoubleQuotedString", state, CoffeeInterpolatedDoubleQuotedString$0(state));
          if (state.events)
            state.events.exit?.("CoffeeInterpolatedDoubleQuotedString", state, result, eventData);
          return result;
        } else {
          const result = CoffeeInterpolatedDoubleQuotedString$0(state);
          if (state.events)
            state.events.exit?.("CoffeeInterpolatedDoubleQuotedString", state, result, eventData);
          return result;
        }
      }
      var CoffeeDoubleQuotedStringCharacters$0 = $TR($EXPECT($R25, fail, 'CoffeeDoubleQuotedStringCharacters /(?:\\\\.|#(?!\\{)|[^"#])+/'), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function CoffeeDoubleQuotedStringCharacters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeDoubleQuotedStringCharacters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeDoubleQuotedStringCharacters", state, CoffeeDoubleQuotedStringCharacters$0(state));
          if (state.events)
            state.events.exit?.("CoffeeDoubleQuotedStringCharacters", state, result, eventData);
          return result;
        } else {
          const result = CoffeeDoubleQuotedStringCharacters$0(state);
          if (state.events)
            state.events.exit?.("CoffeeDoubleQuotedStringCharacters", state, result, eventData);
          return result;
        }
      }
      var RegularExpressionLiteral$0 = HeregexLiteral;
      var RegularExpressionLiteral$1 = $TV($TEXT($S($EXPECT($L55, fail, 'RegularExpressionLiteral "/"'), RegularExpressionBody, $EXPECT($L55, fail, 'RegularExpressionLiteral "/"'), RegularExpressionFlags)), function($skip, $loc, $0, $1) {
        return { type: "RegularExpressionLiteral", $loc, token: $1 };
      });
      function RegularExpressionLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RegularExpressionLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RegularExpressionLiteral", state, RegularExpressionLiteral$0(state) || RegularExpressionLiteral$1(state));
          if (state.events)
            state.events.exit?.("RegularExpressionLiteral", state, result, eventData);
          return result;
        } else {
          const result = RegularExpressionLiteral$0(state) || RegularExpressionLiteral$1(state);
          if (state.events)
            state.events.exit?.("RegularExpressionLiteral", state, result, eventData);
          return result;
        }
      }
      var RegularExpressionClass$0 = $TV($TEXT($S(OpenBracket, RegularExpressionClassCharacters, CloseBracket)), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function RegularExpressionClass(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RegularExpressionClass", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RegularExpressionClass", state, RegularExpressionClass$0(state));
          if (state.events)
            state.events.exit?.("RegularExpressionClass", state, result, eventData);
          return result;
        } else {
          const result = RegularExpressionClass$0(state);
          if (state.events)
            state.events.exit?.("RegularExpressionClass", state, result, eventData);
          return result;
        }
      }
      var RegularExpressionClassCharacters$0 = $TR($EXPECT($R26, fail, "RegularExpressionClassCharacters /(?:\\\\.|[^\\]])*/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function RegularExpressionClassCharacters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RegularExpressionClassCharacters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RegularExpressionClassCharacters", state, RegularExpressionClassCharacters$0(state));
          if (state.events)
            state.events.exit?.("RegularExpressionClassCharacters", state, result, eventData);
          return result;
        } else {
          const result = RegularExpressionClassCharacters$0(state);
          if (state.events)
            state.events.exit?.("RegularExpressionClassCharacters", state, result, eventData);
          return result;
        }
      }
      var HeregexLiteral$0 = $TS($S(TripleSlash, HeregexBody, TripleSlash, RegularExpressionFlags), function($skip, $loc, $0, $1, $2, $3, $4) {
        var open = $1;
        var body = $2;
        var close = $3;
        var flags = $4;
        let hasSubstitutions = body.some((part) => part.type === "Substitution");
        if (hasSubstitutions) {
          const result = [
            { ...open, token: "RegExp(`" },
            body.map(
              (e) => e.type === "Substitution" ? e : {
                ...e,
                token: e.token.replace(/`|\\|\$/g, "\\$&")
              }
            ),
            "`"
          ];
          if (flags.length) {
            result.push(
              ", ",
              JSON.stringify(flags)
            );
          }
          result.push({ ...close, token: ")" });
          return result;
        }
        return {
          type: "RegularExpressionLiteral",
          children: $0
        };
      });
      function HeregexLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("HeregexLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("HeregexLiteral", state, HeregexLiteral$0(state));
          if (state.events)
            state.events.exit?.("HeregexLiteral", state, result, eventData);
          return result;
        } else {
          const result = HeregexLiteral$0(state);
          if (state.events)
            state.events.exit?.("HeregexLiteral", state, result, eventData);
          return result;
        }
      }
      var HeregexBody$0 = $T($S($N(TripleSlash), $Q(HeregexPart)), function(value) {
        return value[1];
      });
      function HeregexBody(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("HeregexBody", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("HeregexBody", state, HeregexBody$0(state));
          if (state.events)
            state.events.exit?.("HeregexBody", state, result, eventData);
          return result;
        } else {
          const result = HeregexBody$0(state);
          if (state.events)
            state.events.exit?.("HeregexBody", state, result, eventData);
          return result;
        }
      }
      var HeregexPart$0 = RegularExpressionClass;
      var HeregexPart$1 = $T($S(CoffeeStringSubstitution), function(value) {
        return { "type": "Substitution", "children": value[0] };
      });
      var HeregexPart$2 = $T($S(TemplateSubstitution), function(value) {
        return { "type": "Substitution", "children": value[0] };
      });
      var HeregexPart$3 = $TR($EXPECT($R27, fail, "HeregexPart /(?:\\\\.)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        let token = $0;
        switch ($0[1]) {
          case "\n":
            token = "\\n";
            break;
          case "\r":
            token = "\\r";
            break;
          case " ":
            token = " ";
            break;
        }
        return { $loc, token };
      });
      var HeregexPart$4 = $TS($S(HeregexComment), function($skip, $loc, $0, $1) {
        return { $loc, token: "" };
      });
      var HeregexPart$5 = $TR($EXPECT($R28, fail, "HeregexPart /[\\s]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: "" };
      });
      var HeregexPart$6 = $TR($EXPECT($R29, fail, "HeregexPart /\\/(?!\\/\\/)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: "\\/" };
      });
      var HeregexPart$7 = $TR($EXPECT($R30, fail, "HeregexPart /[^[\\/\\s#\\\\]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function HeregexPart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("HeregexPart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("HeregexPart", state, HeregexPart$0(state) || HeregexPart$1(state) || HeregexPart$2(state) || HeregexPart$3(state) || HeregexPart$4(state) || HeregexPart$5(state) || HeregexPart$6(state) || HeregexPart$7(state));
          if (state.events)
            state.events.exit?.("HeregexPart", state, result, eventData);
          return result;
        } else {
          const result = HeregexPart$0(state) || HeregexPart$1(state) || HeregexPart$2(state) || HeregexPart$3(state) || HeregexPart$4(state) || HeregexPart$5(state) || HeregexPart$6(state) || HeregexPart$7(state);
          if (state.events)
            state.events.exit?.("HeregexPart", state, result, eventData);
          return result;
        }
      }
      var HeregexComment$0 = JSSingleLineComment;
      var HeregexComment$1 = CoffeeSingleLineComment;
      function HeregexComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("HeregexComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("HeregexComment", state, HeregexComment$0(state) || HeregexComment$1(state));
          if (state.events)
            state.events.exit?.("HeregexComment", state, result, eventData);
          return result;
        } else {
          const result = HeregexComment$0(state) || HeregexComment$1(state);
          if (state.events)
            state.events.exit?.("HeregexComment", state, result, eventData);
          return result;
        }
      }
      var RegularExpressionBody$0 = $S($N($R$0($EXPECT($R31, fail, "RegularExpressionBody /[*\\/\\r\\n]/"))), $Q(RegExpPart));
      function RegularExpressionBody(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RegularExpressionBody", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RegularExpressionBody", state, RegularExpressionBody$0(state));
          if (state.events)
            state.events.exit?.("RegularExpressionBody", state, result, eventData);
          return result;
        } else {
          const result = RegularExpressionBody$0(state);
          if (state.events)
            state.events.exit?.("RegularExpressionBody", state, result, eventData);
          return result;
        }
      }
      var RegExpPart$0 = RegularExpressionClass;
      var RegExpPart$1 = RegExpCharacter;
      function RegExpPart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RegExpPart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RegExpPart", state, RegExpPart$0(state) || RegExpPart$1(state));
          if (state.events)
            state.events.exit?.("RegExpPart", state, result, eventData);
          return result;
        } else {
          const result = RegExpPart$0(state) || RegExpPart$1(state);
          if (state.events)
            state.events.exit?.("RegExpPart", state, result, eventData);
          return result;
        }
      }
      var RegExpCharacter$0 = $R$0($EXPECT($R32, fail, "RegExpCharacter /(?:\\\\.|[^[\\/\\r\\n])+/"));
      function RegExpCharacter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RegExpCharacter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RegExpCharacter", state, RegExpCharacter$0(state));
          if (state.events)
            state.events.exit?.("RegExpCharacter", state, result, eventData);
          return result;
        } else {
          const result = RegExpCharacter$0(state);
          if (state.events)
            state.events.exit?.("RegExpCharacter", state, result, eventData);
          return result;
        }
      }
      var RegularExpressionFlags$0 = $R$0($EXPECT($R33, fail, "RegularExpressionFlags /(?:\\p{ID_Continue}|[\\u200C\\u200D$])*/"));
      function RegularExpressionFlags(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RegularExpressionFlags", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RegularExpressionFlags", state, RegularExpressionFlags$0(state));
          if (state.events)
            state.events.exit?.("RegularExpressionFlags", state, result, eventData);
          return result;
        } else {
          const result = RegularExpressionFlags$0(state);
          if (state.events)
            state.events.exit?.("RegularExpressionFlags", state, result, eventData);
          return result;
        }
      }
      var TemplateLiteral$0 = $TS($S(TripleTick, $Q($C(TemplateBlockCharacters, TemplateSubstitution)), TripleTick), function($skip, $loc, $0, $1, $2, $3) {
        return dedentBlockSubstitutions($0);
      });
      var TemplateLiteral$1 = $TS($S(Backtick, $Q($C(TemplateCharacters, TemplateSubstitution)), Backtick), function($skip, $loc, $0, $1, $2, $3) {
        return {
          type: "TemplateLiteral",
          children: $0
        };
      });
      var TemplateLiteral$2 = $TS($S(TripleDoubleQuote, $Q($C(TripleDoubleStringCharacters, CoffeeStringSubstitution)), TripleDoubleQuote), function($skip, $loc, $0, $1, $2, $3) {
        return dedentBlockSubstitutions($0);
      });
      var TemplateLiteral$3 = $TS($S(TripleSingleQuote, TripleSingleStringCharacters, TripleSingleQuote), function($skip, $loc, $0, $1, $2, $3) {
        var s = $1;
        var str = $2;
        var e = $3;
        return {
          type: "TemplateLiteral",
          children: [s, dedentBlockString(str), e]
        };
      });
      var TemplateLiteral$4 = CoffeeInterpolatedDoubleQuotedString;
      function TemplateLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TemplateLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TemplateLiteral", state, TemplateLiteral$0(state) || TemplateLiteral$1(state) || TemplateLiteral$2(state) || TemplateLiteral$3(state) || TemplateLiteral$4(state));
          if (state.events)
            state.events.exit?.("TemplateLiteral", state, result, eventData);
          return result;
        } else {
          const result = TemplateLiteral$0(state) || TemplateLiteral$1(state) || TemplateLiteral$2(state) || TemplateLiteral$3(state) || TemplateLiteral$4(state);
          if (state.events)
            state.events.exit?.("TemplateLiteral", state, result, eventData);
          return result;
        }
      }
      var TemplateSubstitution$0 = $S(SubstitutionStart, PostfixedExpression, __, CloseBrace);
      function TemplateSubstitution(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TemplateSubstitution", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TemplateSubstitution", state, TemplateSubstitution$0(state));
          if (state.events)
            state.events.exit?.("TemplateSubstitution", state, result, eventData);
          return result;
        } else {
          const result = TemplateSubstitution$0(state);
          if (state.events)
            state.events.exit?.("TemplateSubstitution", state, result, eventData);
          return result;
        }
      }
      var TemplateCharacters$0 = $TR($EXPECT($R34, fail, "TemplateCharacters /(?:\\$(?!\\{)|\\\\.|[^$`])+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function TemplateCharacters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TemplateCharacters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TemplateCharacters", state, TemplateCharacters$0(state));
          if (state.events)
            state.events.exit?.("TemplateCharacters", state, result, eventData);
          return result;
        } else {
          const result = TemplateCharacters$0(state);
          if (state.events)
            state.events.exit?.("TemplateCharacters", state, result, eventData);
          return result;
        }
      }
      var TemplateBlockCharacters$0 = $TR($EXPECT($R35, fail, "TemplateBlockCharacters /(?:\\$(?!\\{)|`(?!``)|\\\\.|[^$`])+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function TemplateBlockCharacters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TemplateBlockCharacters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TemplateBlockCharacters", state, TemplateBlockCharacters$0(state));
          if (state.events)
            state.events.exit?.("TemplateBlockCharacters", state, result, eventData);
          return result;
        } else {
          const result = TemplateBlockCharacters$0(state);
          if (state.events)
            state.events.exit?.("TemplateBlockCharacters", state, result, eventData);
          return result;
        }
      }
      var ReservedWord$0 = $S(CoffeeBooleansEnabled, $R$0($EXPECT($R36, fail, "ReservedWord /(?:on|off|yes|no)(?!\\p{ID_Continue})/")));
      var ReservedWord$1 = $S(CoffeeIsntEnabled, $R$0($EXPECT($R37, fail, "ReservedWord /(?:isnt)(?!\\p{ID_Continue})/")));
      var ReservedWord$2 = $S(CoffeeForLoopsEnabled, $R$0($EXPECT($R38, fail, "ReservedWord /(?:by)(?!\\p{ID_Continue})/")));
      var ReservedWord$3 = $S(CoffeeOfEnabled, $R$0($EXPECT($R39, fail, "ReservedWord /(?:of)(?!\\p{ID_Continue})/")));
      var ReservedWord$4 = $R$0($EXPECT($R40, fail, "ReservedWord /(?:and|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|import|in|instanceof|interface|is|let|loop|new|not|null|or|private|protected|public|return|static|super|switch|this|throw|true|try|typeof|unless|until|var|void|while|with|yield)(?!\\p{ID_Continue})/"));
      function ReservedWord(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ReservedWord", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ReservedWord", state, ReservedWord$0(state) || ReservedWord$1(state) || ReservedWord$2(state) || ReservedWord$3(state) || ReservedWord$4(state));
          if (state.events)
            state.events.exit?.("ReservedWord", state, result, eventData);
          return result;
        } else {
          const result = ReservedWord$0(state) || ReservedWord$1(state) || ReservedWord$2(state) || ReservedWord$3(state) || ReservedWord$4(state);
          if (state.events)
            state.events.exit?.("ReservedWord", state, result, eventData);
          return result;
        }
      }
      var Comment$0 = MultiLineComment;
      var Comment$1 = SingleLineComment;
      function Comment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Comment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Comment", state, Comment$0(state) || Comment$1(state));
          if (state.events)
            state.events.exit?.("Comment", state, result, eventData);
          return result;
        } else {
          const result = Comment$0(state) || Comment$1(state);
          if (state.events)
            state.events.exit?.("Comment", state, result, eventData);
          return result;
        }
      }
      var SingleLineComment$0 = JSSingleLineComment;
      var SingleLineComment$1 = $S(CoffeeCommentEnabled, CoffeeSingleLineComment);
      function SingleLineComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SingleLineComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SingleLineComment", state, SingleLineComment$0(state) || SingleLineComment$1(state));
          if (state.events)
            state.events.exit?.("SingleLineComment", state, result, eventData);
          return result;
        } else {
          const result = SingleLineComment$0(state) || SingleLineComment$1(state);
          if (state.events)
            state.events.exit?.("SingleLineComment", state, result, eventData);
          return result;
        }
      }
      var JSSingleLineComment$0 = $TR($EXPECT($R41, fail, "JSSingleLineComment /\\/\\/(?!\\/)[^\\r\\n]*/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { type: "Comment", $loc, token: $0 };
      });
      function JSSingleLineComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSSingleLineComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSSingleLineComment", state, JSSingleLineComment$0(state));
          if (state.events)
            state.events.exit?.("JSSingleLineComment", state, result, eventData);
          return result;
        } else {
          const result = JSSingleLineComment$0(state);
          if (state.events)
            state.events.exit?.("JSSingleLineComment", state, result, eventData);
          return result;
        }
      }
      var MultiLineComment$0 = JSMultiLineComment;
      var MultiLineComment$1 = CoffeeMultiLineComment;
      function MultiLineComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("MultiLineComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("MultiLineComment", state, MultiLineComment$0(state) || MultiLineComment$1(state));
          if (state.events)
            state.events.exit?.("MultiLineComment", state, result, eventData);
          return result;
        } else {
          const result = MultiLineComment$0(state) || MultiLineComment$1(state);
          if (state.events)
            state.events.exit?.("MultiLineComment", state, result, eventData);
          return result;
        }
      }
      var JSMultiLineComment$0 = $TV($TEXT($S($EXPECT($L110, fail, 'JSMultiLineComment "/*"'), $Q($S($N($EXPECT($L111, fail, 'JSMultiLineComment "*/"')), $EXPECT($R42, fail, "JSMultiLineComment /./"))), $EXPECT($L111, fail, 'JSMultiLineComment "*/"'))), function($skip, $loc, $0, $1) {
        return { type: "Comment", $loc, token: $1 };
      });
      function JSMultiLineComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSMultiLineComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSMultiLineComment", state, JSMultiLineComment$0(state));
          if (state.events)
            state.events.exit?.("JSMultiLineComment", state, result, eventData);
          return result;
        } else {
          const result = JSMultiLineComment$0(state);
          if (state.events)
            state.events.exit?.("JSMultiLineComment", state, result, eventData);
          return result;
        }
      }
      var CoffeeSingleLineComment$0 = $TR($EXPECT($R43, fail, "CoffeeSingleLineComment /#(?!##(?!#))([^\\r\\n]*)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { type: "Comment", $loc, token: `//${$1}` };
      });
      function CoffeeSingleLineComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeSingleLineComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeSingleLineComment", state, CoffeeSingleLineComment$0(state));
          if (state.events)
            state.events.exit?.("CoffeeSingleLineComment", state, result, eventData);
          return result;
        } else {
          const result = CoffeeSingleLineComment$0(state);
          if (state.events)
            state.events.exit?.("CoffeeSingleLineComment", state, result, eventData);
          return result;
        }
      }
      var CoffeeMultiLineComment$0 = $TS($S(CoffeeHereCommentStart, $TEXT($EXPECT($R44, fail, "CoffeeMultiLineComment /[^]*?###/"))), function($skip, $loc, $0, $1, $2) {
        $2 = $2.slice(0, $2.length - 3).replace(/\*\//g, "* /");
        return { type: "Comment", $loc, token: `/*${$2}*/` };
      });
      function CoffeeMultiLineComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeMultiLineComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeMultiLineComment", state, CoffeeMultiLineComment$0(state));
          if (state.events)
            state.events.exit?.("CoffeeMultiLineComment", state, result, eventData);
          return result;
        } else {
          const result = CoffeeMultiLineComment$0(state);
          if (state.events)
            state.events.exit?.("CoffeeMultiLineComment", state, result, eventData);
          return result;
        }
      }
      var CoffeeHereCommentStart$0 = $R$0($EXPECT($R45, fail, "CoffeeHereCommentStart /###(?!#)/"));
      function CoffeeHereCommentStart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeHereCommentStart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeHereCommentStart", state, CoffeeHereCommentStart$0(state));
          if (state.events)
            state.events.exit?.("CoffeeHereCommentStart", state, result, eventData);
          return result;
        } else {
          const result = CoffeeHereCommentStart$0(state);
          if (state.events)
            state.events.exit?.("CoffeeHereCommentStart", state, result, eventData);
          return result;
        }
      }
      var InlineComment$0 = $TV($TEXT($S($EXPECT($L110, fail, 'InlineComment "/*"'), $TEXT($Q($S($N($EXPECT($L111, fail, 'InlineComment "*/"')), $EXPECT($R46, fail, "InlineComment /[^\\r\\n]/")))), $EXPECT($L111, fail, 'InlineComment "*/"'))), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function InlineComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineComment", state, InlineComment$0(state));
          if (state.events)
            state.events.exit?.("InlineComment", state, result, eventData);
          return result;
        } else {
          const result = InlineComment$0(state);
          if (state.events)
            state.events.exit?.("InlineComment", state, result, eventData);
          return result;
        }
      }
      var RestOfLine$0 = $S($Q($C(NonNewlineWhitespace, SingleLineComment, MultiLineComment)), EOL);
      function RestOfLine(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("RestOfLine", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("RestOfLine", state, RestOfLine$0(state));
          if (state.events)
            state.events.exit?.("RestOfLine", state, result, eventData);
          return result;
        } else {
          const result = RestOfLine$0(state);
          if (state.events)
            state.events.exit?.("RestOfLine", state, result, eventData);
          return result;
        }
      }
      var TrailingComment$0 = $S($E(_), $E(SingleLineComment));
      function TrailingComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TrailingComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TrailingComment", state, TrailingComment$0(state));
          if (state.events)
            state.events.exit?.("TrailingComment", state, result, eventData);
          return result;
        } else {
          const result = TrailingComment$0(state);
          if (state.events)
            state.events.exit?.("TrailingComment", state, result, eventData);
          return result;
        }
      }
      var _$0 = $P($C(NonNewlineWhitespace, InlineComment));
      function _(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("_", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("_", state, _$0(state));
          if (state.events)
            state.events.exit?.("_", state, result, eventData);
          return result;
        } else {
          const result = _$0(state);
          if (state.events)
            state.events.exit?.("_", state, result, eventData);
          return result;
        }
      }
      var NonNewlineWhitespace$0 = $TR($EXPECT($R47, fail, "NonNewlineWhitespace /[ \\t]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      var NonNewlineWhitespace$1 = $T($S(CoffeeLineContinuationEnabled, $EXPECT($L112, fail, 'NonNewlineWhitespace "\\\\\\\\"'), EOL), function(value) {
        return "";
      });
      function NonNewlineWhitespace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonNewlineWhitespace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonNewlineWhitespace", state, NonNewlineWhitespace$0(state) || NonNewlineWhitespace$1(state));
          if (state.events)
            state.events.exit?.("NonNewlineWhitespace", state, result, eventData);
          return result;
        } else {
          const result = NonNewlineWhitespace$0(state) || NonNewlineWhitespace$1(state);
          if (state.events)
            state.events.exit?.("NonNewlineWhitespace", state, result, eventData);
          return result;
        }
      }
      var Trimmed_$0 = $TV($Q(_), function($skip, $loc, $0, $1) {
        var ws = $0;
        return insertTrimmingSpace(ws, "");
      });
      function Trimmed_(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Trimmed_", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Trimmed_", state, Trimmed_$0(state));
          if (state.events)
            state.events.exit?.("Trimmed_", state, result, eventData);
          return result;
        } else {
          const result = Trimmed_$0(state);
          if (state.events)
            state.events.exit?.("Trimmed_", state, result, eventData);
          return result;
        }
      }
      var __$0 = $Q($C(Whitespace, Comment));
      function __(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("__", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("__", state, __$0(state));
          if (state.events)
            state.events.exit?.("__", state, result, eventData);
          return result;
        } else {
          const result = __$0(state);
          if (state.events)
            state.events.exit?.("__", state, result, eventData);
          return result;
        }
      }
      var Whitespace$0 = $TR($EXPECT($R28, fail, "Whitespace /[\\s]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function Whitespace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Whitespace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Whitespace", state, Whitespace$0(state));
          if (state.events)
            state.events.exit?.("Whitespace", state, result, eventData);
          return result;
        } else {
          const result = Whitespace$0(state);
          if (state.events)
            state.events.exit?.("Whitespace", state, result, eventData);
          return result;
        }
      }
      var ExpressionDelimiter$0 = $TS($S($E(_), Semicolon, InsertComma, TrailingComment), function($skip, $loc, $0, $1, $2, $3, $4) {
        return [$1, $3, $4];
      });
      var ExpressionDelimiter$1 = $T($S($Y(EOS), InsertComma), function(value) {
        return value[1];
      });
      function ExpressionDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ExpressionDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ExpressionDelimiter", state, ExpressionDelimiter$0(state) || ExpressionDelimiter$1(state));
          if (state.events)
            state.events.exit?.("ExpressionDelimiter", state, result, eventData);
          return result;
        } else {
          const result = ExpressionDelimiter$0(state) || ExpressionDelimiter$1(state);
          if (state.events)
            state.events.exit?.("ExpressionDelimiter", state, result, eventData);
          return result;
        }
      }
      var SimpleStatementDelimiter$0 = SemicolonDelimiter;
      var SimpleStatementDelimiter$1 = $Y(EOS);
      function SimpleStatementDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SimpleStatementDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SimpleStatementDelimiter", state, SimpleStatementDelimiter$0(state) || SimpleStatementDelimiter$1(state));
          if (state.events)
            state.events.exit?.("SimpleStatementDelimiter", state, result, eventData);
          return result;
        } else {
          const result = SimpleStatementDelimiter$0(state) || SimpleStatementDelimiter$1(state);
          if (state.events)
            state.events.exit?.("SimpleStatementDelimiter", state, result, eventData);
          return result;
        }
      }
      var StatementDelimiter$0 = SemicolonDelimiter;
      var StatementDelimiter$1 = $S($Y($S(Samedent, $C($EXPECT($L3, fail, 'StatementDelimiter "("'), $EXPECT($L113, fail, 'StatementDelimiter "["'), $EXPECT($L114, fail, 'StatementDelimiter "`"'), $EXPECT($L58, fail, 'StatementDelimiter "+"'), $EXPECT($L19, fail, 'StatementDelimiter "-"'), $EXPECT($L54, fail, 'StatementDelimiter "*"'), $EXPECT($L55, fail, 'StatementDelimiter "/"'), ObjectLiteral, Arrow, FatArrow, $S(Function, $E($S($E(_), Star)), $E(_), $EXPECT($L3, fail, 'StatementDelimiter "("'))))), InsertSemicolon);
      var StatementDelimiter$2 = $Y(EOS);
      function StatementDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("StatementDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("StatementDelimiter", state, StatementDelimiter$0(state) || StatementDelimiter$1(state) || StatementDelimiter$2(state));
          if (state.events)
            state.events.exit?.("StatementDelimiter", state, result, eventData);
          return result;
        } else {
          const result = StatementDelimiter$0(state) || StatementDelimiter$1(state) || StatementDelimiter$2(state);
          if (state.events)
            state.events.exit?.("StatementDelimiter", state, result, eventData);
          return result;
        }
      }
      var SemicolonDelimiter$0 = $TS($S($E(_), Semicolon, TrailingComment), function($skip, $loc, $0, $1, $2, $3) {
        return {
          type: "SemicolonDelimiter",
          children: $0
        };
      });
      function SemicolonDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SemicolonDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SemicolonDelimiter", state, SemicolonDelimiter$0(state));
          if (state.events)
            state.events.exit?.("SemicolonDelimiter", state, result, eventData);
          return result;
        } else {
          const result = SemicolonDelimiter$0(state);
          if (state.events)
            state.events.exit?.("SemicolonDelimiter", state, result, eventData);
          return result;
        }
      }
      var NonIdContinue$0 = $R$0($EXPECT($R48, fail, "NonIdContinue /(?!\\p{ID_Continue})/"));
      function NonIdContinue(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NonIdContinue", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NonIdContinue", state, NonIdContinue$0(state));
          if (state.events)
            state.events.exit?.("NonIdContinue", state, result, eventData);
          return result;
        } else {
          const result = NonIdContinue$0(state);
          if (state.events)
            state.events.exit?.("NonIdContinue", state, result, eventData);
          return result;
        }
      }
      var Loc$0 = $TV($EXPECT($L0, fail, 'Loc ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "" };
      });
      function Loc(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Loc", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Loc", state, Loc$0(state));
          if (state.events)
            state.events.exit?.("Loc", state, result, eventData);
          return result;
        } else {
          const result = Loc$0(state);
          if (state.events)
            state.events.exit?.("Loc", state, result, eventData);
          return result;
        }
      }
      var Abstract$0 = $TV($TEXT($S($EXPECT($L115, fail, 'Abstract "abstract"'), NonIdContinue, $E($EXPECT($L10, fail, 'Abstract " "')))), function($skip, $loc, $0, $1) {
        return { $loc, token: $1, ts: true };
      });
      function Abstract(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Abstract", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Abstract", state, Abstract$0(state));
          if (state.events)
            state.events.exit?.("Abstract", state, result, eventData);
          return result;
        } else {
          const result = Abstract$0(state);
          if (state.events)
            state.events.exit?.("Abstract", state, result, eventData);
          return result;
        }
      }
      var Ampersand$0 = $TV($EXPECT($L98, fail, 'Ampersand "&"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function Ampersand(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Ampersand", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Ampersand", state, Ampersand$0(state));
          if (state.events)
            state.events.exit?.("Ampersand", state, result, eventData);
          return result;
        } else {
          const result = Ampersand$0(state);
          if (state.events)
            state.events.exit?.("Ampersand", state, result, eventData);
          return result;
        }
      }
      var As$0 = $TS($S($EXPECT($L116, fail, 'As "as"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function As(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("As", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("As", state, As$0(state));
          if (state.events)
            state.events.exit?.("As", state, result, eventData);
          return result;
        } else {
          const result = As$0(state);
          if (state.events)
            state.events.exit?.("As", state, result, eventData);
          return result;
        }
      }
      var At$0 = $TV($EXPECT($L117, fail, 'At "@"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function At(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("At", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("At", state, At$0(state));
          if (state.events)
            state.events.exit?.("At", state, result, eventData);
          return result;
        } else {
          const result = At$0(state);
          if (state.events)
            state.events.exit?.("At", state, result, eventData);
          return result;
        }
      }
      var AtAt$0 = $TV($EXPECT($L118, fail, 'AtAt "@@"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "@" };
      });
      function AtAt(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("AtAt", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("AtAt", state, AtAt$0(state));
          if (state.events)
            state.events.exit?.("AtAt", state, result, eventData);
          return result;
        } else {
          const result = AtAt$0(state);
          if (state.events)
            state.events.exit?.("AtAt", state, result, eventData);
          return result;
        }
      }
      var Async$0 = $TS($S($EXPECT($L119, fail, 'Async "async"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1, type: "Async" };
      });
      function Async(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Async", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Async", state, Async$0(state));
          if (state.events)
            state.events.exit?.("Async", state, result, eventData);
          return result;
        } else {
          const result = Async$0(state);
          if (state.events)
            state.events.exit?.("Async", state, result, eventData);
          return result;
        }
      }
      var Await$0 = $TS($S($EXPECT($L120, fail, 'Await "await"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1, type: "Await" };
      });
      function Await(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Await", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Await", state, Await$0(state));
          if (state.events)
            state.events.exit?.("Await", state, result, eventData);
          return result;
        } else {
          const result = Await$0(state);
          if (state.events)
            state.events.exit?.("Await", state, result, eventData);
          return result;
        }
      }
      var Backtick$0 = $TV($EXPECT($L114, fail, 'Backtick "`"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function Backtick(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Backtick", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Backtick", state, Backtick$0(state));
          if (state.events)
            state.events.exit?.("Backtick", state, result, eventData);
          return result;
        } else {
          const result = Backtick$0(state);
          if (state.events)
            state.events.exit?.("Backtick", state, result, eventData);
          return result;
        }
      }
      var By$0 = $TS($S($EXPECT($L121, fail, 'By "by"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function By(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("By", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("By", state, By$0(state));
          if (state.events)
            state.events.exit?.("By", state, result, eventData);
          return result;
        } else {
          const result = By$0(state);
          if (state.events)
            state.events.exit?.("By", state, result, eventData);
          return result;
        }
      }
      var Case$0 = $TS($S($EXPECT($L122, fail, 'Case "case"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Case(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Case", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Case", state, Case$0(state));
          if (state.events)
            state.events.exit?.("Case", state, result, eventData);
          return result;
        } else {
          const result = Case$0(state);
          if (state.events)
            state.events.exit?.("Case", state, result, eventData);
          return result;
        }
      }
      var Catch$0 = $TS($S($EXPECT($L123, fail, 'Catch "catch"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Catch(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Catch", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Catch", state, Catch$0(state));
          if (state.events)
            state.events.exit?.("Catch", state, result, eventData);
          return result;
        } else {
          const result = Catch$0(state);
          if (state.events)
            state.events.exit?.("Catch", state, result, eventData);
          return result;
        }
      }
      var Class$0 = $TS($S($EXPECT($L124, fail, 'Class "class"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Class(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Class", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Class", state, Class$0(state));
          if (state.events)
            state.events.exit?.("Class", state, result, eventData);
          return result;
        } else {
          const result = Class$0(state);
          if (state.events)
            state.events.exit?.("Class", state, result, eventData);
          return result;
        }
      }
      var CloseBrace$0 = $TV($EXPECT($L25, fail, 'CloseBrace "}"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function CloseBrace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CloseBrace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CloseBrace", state, CloseBrace$0(state));
          if (state.events)
            state.events.exit?.("CloseBrace", state, result, eventData);
          return result;
        } else {
          const result = CloseBrace$0(state);
          if (state.events)
            state.events.exit?.("CloseBrace", state, result, eventData);
          return result;
        }
      }
      var CloseBracket$0 = $TV($EXPECT($L34, fail, 'CloseBracket "]"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function CloseBracket(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CloseBracket", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CloseBracket", state, CloseBracket$0(state));
          if (state.events)
            state.events.exit?.("CloseBracket", state, result, eventData);
          return result;
        } else {
          const result = CloseBracket$0(state);
          if (state.events)
            state.events.exit?.("CloseBracket", state, result, eventData);
          return result;
        }
      }
      var CloseParen$0 = $TV($EXPECT($L125, fail, 'CloseParen ")"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function CloseParen(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CloseParen", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CloseParen", state, CloseParen$0(state));
          if (state.events)
            state.events.exit?.("CloseParen", state, result, eventData);
          return result;
        } else {
          const result = CloseParen$0(state);
          if (state.events)
            state.events.exit?.("CloseParen", state, result, eventData);
          return result;
        }
      }
      var CoffeeSubstitutionStart$0 = $TV($EXPECT($L126, fail, 'CoffeeSubstitutionStart "#{"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "${" };
      });
      function CoffeeSubstitutionStart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeSubstitutionStart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeSubstitutionStart", state, CoffeeSubstitutionStart$0(state));
          if (state.events)
            state.events.exit?.("CoffeeSubstitutionStart", state, result, eventData);
          return result;
        } else {
          const result = CoffeeSubstitutionStart$0(state);
          if (state.events)
            state.events.exit?.("CoffeeSubstitutionStart", state, result, eventData);
          return result;
        }
      }
      var Colon$0 = $TS($S($EXPECT($L11, fail, 'Colon ":"'), $N($EXPECT($L2, fail, 'Colon "="'))), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Colon(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Colon", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Colon", state, Colon$0(state));
          if (state.events)
            state.events.exit?.("Colon", state, result, eventData);
          return result;
        } else {
          const result = Colon$0(state);
          if (state.events)
            state.events.exit?.("Colon", state, result, eventData);
          return result;
        }
      }
      var Comma$0 = $TV($EXPECT($L22, fail, 'Comma ","'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function Comma(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Comma", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Comma", state, Comma$0(state));
          if (state.events)
            state.events.exit?.("Comma", state, result, eventData);
          return result;
        } else {
          const result = Comma$0(state);
          if (state.events)
            state.events.exit?.("Comma", state, result, eventData);
          return result;
        }
      }
      var ConstructorShorthand$0 = $TV($EXPECT($L117, fail, 'ConstructorShorthand "@"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "constructor" };
      });
      function ConstructorShorthand(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ConstructorShorthand", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ConstructorShorthand", state, ConstructorShorthand$0(state));
          if (state.events)
            state.events.exit?.("ConstructorShorthand", state, result, eventData);
          return result;
        } else {
          const result = ConstructorShorthand$0(state);
          if (state.events)
            state.events.exit?.("ConstructorShorthand", state, result, eventData);
          return result;
        }
      }
      var Declare$0 = $TS($S($EXPECT($L127, fail, 'Declare "declare"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Declare(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Declare", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Declare", state, Declare$0(state));
          if (state.events)
            state.events.exit?.("Declare", state, result, eventData);
          return result;
        } else {
          const result = Declare$0(state);
          if (state.events)
            state.events.exit?.("Declare", state, result, eventData);
          return result;
        }
      }
      var Default$0 = $TS($S($EXPECT($L128, fail, 'Default "default"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Default(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Default", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Default", state, Default$0(state));
          if (state.events)
            state.events.exit?.("Default", state, result, eventData);
          return result;
        } else {
          const result = Default$0(state);
          if (state.events)
            state.events.exit?.("Default", state, result, eventData);
          return result;
        }
      }
      var Delete$0 = $TS($S($EXPECT($L129, fail, 'Delete "delete"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Delete(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Delete", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Delete", state, Delete$0(state));
          if (state.events)
            state.events.exit?.("Delete", state, result, eventData);
          return result;
        } else {
          const result = Delete$0(state);
          if (state.events)
            state.events.exit?.("Delete", state, result, eventData);
          return result;
        }
      }
      var Do$0 = $TS($S($EXPECT($L130, fail, 'Do "do"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Do(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Do", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Do", state, Do$0(state));
          if (state.events)
            state.events.exit?.("Do", state, result, eventData);
          return result;
        } else {
          const result = Do$0(state);
          if (state.events)
            state.events.exit?.("Do", state, result, eventData);
          return result;
        }
      }
      var Dot$0 = $TV($EXPECT($L5, fail, 'Dot "."'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function Dot(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Dot", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Dot", state, Dot$0(state));
          if (state.events)
            state.events.exit?.("Dot", state, result, eventData);
          return result;
        } else {
          const result = Dot$0(state);
          if (state.events)
            state.events.exit?.("Dot", state, result, eventData);
          return result;
        }
      }
      var DotDot$0 = $TS($S($EXPECT($L131, fail, 'DotDot ".."'), $N($EXPECT($L5, fail, 'DotDot "."'))), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      var DotDot$1 = $TV($EXPECT($L132, fail, 'DotDot "\u2025"'), function($skip, $loc, $0, $1) {
        return { $loc, token: ".." };
      });
      function DotDot(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DotDot", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DotDot", state, DotDot$0(state) || DotDot$1(state));
          if (state.events)
            state.events.exit?.("DotDot", state, result, eventData);
          return result;
        } else {
          const result = DotDot$0(state) || DotDot$1(state);
          if (state.events)
            state.events.exit?.("DotDot", state, result, eventData);
          return result;
        }
      }
      var DotDotDot$0 = $TV($EXPECT($L133, fail, 'DotDotDot "..."'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      var DotDotDot$1 = $TV($EXPECT($L134, fail, 'DotDotDot "\u2026"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "..." };
      });
      function DotDotDot(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DotDotDot", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DotDotDot", state, DotDotDot$0(state) || DotDotDot$1(state));
          if (state.events)
            state.events.exit?.("DotDotDot", state, result, eventData);
          return result;
        } else {
          const result = DotDotDot$0(state) || DotDotDot$1(state);
          if (state.events)
            state.events.exit?.("DotDotDot", state, result, eventData);
          return result;
        }
      }
      var DoubleColon$0 = $TV($EXPECT($L135, fail, 'DoubleColon "::"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function DoubleColon(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DoubleColon", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DoubleColon", state, DoubleColon$0(state));
          if (state.events)
            state.events.exit?.("DoubleColon", state, result, eventData);
          return result;
        } else {
          const result = DoubleColon$0(state);
          if (state.events)
            state.events.exit?.("DoubleColon", state, result, eventData);
          return result;
        }
      }
      var DoubleQuote$0 = $TV($EXPECT($L136, fail, 'DoubleQuote "\\\\\\""'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function DoubleQuote(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DoubleQuote", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DoubleQuote", state, DoubleQuote$0(state));
          if (state.events)
            state.events.exit?.("DoubleQuote", state, result, eventData);
          return result;
        } else {
          const result = DoubleQuote$0(state);
          if (state.events)
            state.events.exit?.("DoubleQuote", state, result, eventData);
          return result;
        }
      }
      var Else$0 = $TS($S($EXPECT($L137, fail, 'Else "else"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Else(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Else", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Else", state, Else$0(state));
          if (state.events)
            state.events.exit?.("Else", state, result, eventData);
          return result;
        } else {
          const result = Else$0(state);
          if (state.events)
            state.events.exit?.("Else", state, result, eventData);
          return result;
        }
      }
      var Equals$0 = $TV($EXPECT($L2, fail, 'Equals "="'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function Equals(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Equals", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Equals", state, Equals$0(state));
          if (state.events)
            state.events.exit?.("Equals", state, result, eventData);
          return result;
        } else {
          const result = Equals$0(state);
          if (state.events)
            state.events.exit?.("Equals", state, result, eventData);
          return result;
        }
      }
      var Export$0 = $TS($S($EXPECT($L138, fail, 'Export "export"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Export(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Export", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Export", state, Export$0(state));
          if (state.events)
            state.events.exit?.("Export", state, result, eventData);
          return result;
        } else {
          const result = Export$0(state);
          if (state.events)
            state.events.exit?.("Export", state, result, eventData);
          return result;
        }
      }
      var Extends$0 = $TS($S($EXPECT($L139, fail, 'Extends "extends"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Extends(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Extends", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Extends", state, Extends$0(state));
          if (state.events)
            state.events.exit?.("Extends", state, result, eventData);
          return result;
        } else {
          const result = Extends$0(state);
          if (state.events)
            state.events.exit?.("Extends", state, result, eventData);
          return result;
        }
      }
      var Finally$0 = $TS($S($EXPECT($L140, fail, 'Finally "finally"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Finally(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Finally", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Finally", state, Finally$0(state));
          if (state.events)
            state.events.exit?.("Finally", state, result, eventData);
          return result;
        } else {
          const result = Finally$0(state);
          if (state.events)
            state.events.exit?.("Finally", state, result, eventData);
          return result;
        }
      }
      var For$0 = $TS($S($EXPECT($L141, fail, 'For "for"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function For(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("For", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("For", state, For$0(state));
          if (state.events)
            state.events.exit?.("For", state, result, eventData);
          return result;
        } else {
          const result = For$0(state);
          if (state.events)
            state.events.exit?.("For", state, result, eventData);
          return result;
        }
      }
      var From$0 = $TS($S($EXPECT($L142, fail, 'From "from"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function From(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("From", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("From", state, From$0(state));
          if (state.events)
            state.events.exit?.("From", state, result, eventData);
          return result;
        } else {
          const result = From$0(state);
          if (state.events)
            state.events.exit?.("From", state, result, eventData);
          return result;
        }
      }
      var Function$0 = $TS($S($EXPECT($L143, fail, 'Function "function"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Function(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Function", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Function", state, Function$0(state));
          if (state.events)
            state.events.exit?.("Function", state, result, eventData);
          return result;
        } else {
          const result = Function$0(state);
          if (state.events)
            state.events.exit?.("Function", state, result, eventData);
          return result;
        }
      }
      var GetOrSet$0 = $TS($S($C($EXPECT($L144, fail, 'GetOrSet "get"'), $EXPECT($L145, fail, 'GetOrSet "set"')), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1, type: "GetOrSet" };
      });
      function GetOrSet(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("GetOrSet", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("GetOrSet", state, GetOrSet$0(state));
          if (state.events)
            state.events.exit?.("GetOrSet", state, result, eventData);
          return result;
        } else {
          const result = GetOrSet$0(state);
          if (state.events)
            state.events.exit?.("GetOrSet", state, result, eventData);
          return result;
        }
      }
      var If$0 = $TV($TEXT($S($EXPECT($L146, fail, 'If "if"'), NonIdContinue, $E($EXPECT($L10, fail, 'If " "')))), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function If(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("If", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("If", state, If$0(state));
          if (state.events)
            state.events.exit?.("If", state, result, eventData);
          return result;
        } else {
          const result = If$0(state);
          if (state.events)
            state.events.exit?.("If", state, result, eventData);
          return result;
        }
      }
      var Import$0 = $TS($S($EXPECT($L16, fail, 'Import "import"'), $Y($EXPECT($R49, fail, "Import /\\s/"))), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Import(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Import", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Import", state, Import$0(state));
          if (state.events)
            state.events.exit?.("Import", state, result, eventData);
          return result;
        } else {
          const result = Import$0(state);
          if (state.events)
            state.events.exit?.("Import", state, result, eventData);
          return result;
        }
      }
      var In$0 = $TS($S($EXPECT($L147, fail, 'In "in"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function In(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("In", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("In", state, In$0(state));
          if (state.events)
            state.events.exit?.("In", state, result, eventData);
          return result;
        } else {
          const result = In$0(state);
          if (state.events)
            state.events.exit?.("In", state, result, eventData);
          return result;
        }
      }
      var LetOrConst$0 = $TS($S($C($EXPECT($L148, fail, 'LetOrConst "let"'), $EXPECT($L149, fail, 'LetOrConst "const"')), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function LetOrConst(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LetOrConst", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LetOrConst", state, LetOrConst$0(state));
          if (state.events)
            state.events.exit?.("LetOrConst", state, result, eventData);
          return result;
        } else {
          const result = LetOrConst$0(state);
          if (state.events)
            state.events.exit?.("LetOrConst", state, result, eventData);
          return result;
        }
      }
      var Const$0 = $TS($S($EXPECT($L149, fail, 'Const "const"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Const(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Const", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Const", state, Const$0(state));
          if (state.events)
            state.events.exit?.("Const", state, result, eventData);
          return result;
        } else {
          const result = Const$0(state);
          if (state.events)
            state.events.exit?.("Const", state, result, eventData);
          return result;
        }
      }
      var Is$0 = $TS($S($EXPECT($L150, fail, 'Is "is"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Is(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Is", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Is", state, Is$0(state));
          if (state.events)
            state.events.exit?.("Is", state, result, eventData);
          return result;
        } else {
          const result = Is$0(state);
          if (state.events)
            state.events.exit?.("Is", state, result, eventData);
          return result;
        }
      }
      var LetOrConstOrVar$0 = LetOrConst;
      var LetOrConstOrVar$1 = Var;
      function LetOrConstOrVar(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("LetOrConstOrVar", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("LetOrConstOrVar", state, LetOrConstOrVar$0(state) || LetOrConstOrVar$1(state));
          if (state.events)
            state.events.exit?.("LetOrConstOrVar", state, result, eventData);
          return result;
        } else {
          const result = LetOrConstOrVar$0(state) || LetOrConstOrVar$1(state);
          if (state.events)
            state.events.exit?.("LetOrConstOrVar", state, result, eventData);
          return result;
        }
      }
      var Loop$0 = $TS($S($EXPECT($L151, fail, 'Loop "loop"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: "while(true)" };
      });
      function Loop(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Loop", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Loop", state, Loop$0(state));
          if (state.events)
            state.events.exit?.("Loop", state, result, eventData);
          return result;
        } else {
          const result = Loop$0(state);
          if (state.events)
            state.events.exit?.("Loop", state, result, eventData);
          return result;
        }
      }
      var New$0 = $TS($S($EXPECT($L152, fail, 'New "new"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function New(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("New", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("New", state, New$0(state));
          if (state.events)
            state.events.exit?.("New", state, result, eventData);
          return result;
        } else {
          const result = New$0(state);
          if (state.events)
            state.events.exit?.("New", state, result, eventData);
          return result;
        }
      }
      var Not$0 = $TS($S($EXPECT($L153, fail, 'Not "not"'), NonIdContinue, $N($S($E(_), $EXPECT($L11, fail, 'Not ":"')))), function($skip, $loc, $0, $1, $2, $3) {
        return { $loc, token: "!" };
      });
      function Not(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Not", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Not", state, Not$0(state));
          if (state.events)
            state.events.exit?.("Not", state, result, eventData);
          return result;
        } else {
          const result = Not$0(state);
          if (state.events)
            state.events.exit?.("Not", state, result, eventData);
          return result;
        }
      }
      var Of$0 = $TS($S($EXPECT($L84, fail, 'Of "of"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Of(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Of", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Of", state, Of$0(state));
          if (state.events)
            state.events.exit?.("Of", state, result, eventData);
          return result;
        } else {
          const result = Of$0(state);
          if (state.events)
            state.events.exit?.("Of", state, result, eventData);
          return result;
        }
      }
      var OpenAngleBracket$0 = $TV($EXPECT($L154, fail, 'OpenAngleBracket "<"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function OpenAngleBracket(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OpenAngleBracket", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OpenAngleBracket", state, OpenAngleBracket$0(state));
          if (state.events)
            state.events.exit?.("OpenAngleBracket", state, result, eventData);
          return result;
        } else {
          const result = OpenAngleBracket$0(state);
          if (state.events)
            state.events.exit?.("OpenAngleBracket", state, result, eventData);
          return result;
        }
      }
      var OpenBrace$0 = $TV($EXPECT($L155, fail, 'OpenBrace "{"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function OpenBrace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OpenBrace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OpenBrace", state, OpenBrace$0(state));
          if (state.events)
            state.events.exit?.("OpenBrace", state, result, eventData);
          return result;
        } else {
          const result = OpenBrace$0(state);
          if (state.events)
            state.events.exit?.("OpenBrace", state, result, eventData);
          return result;
        }
      }
      var OpenBracket$0 = $TV($EXPECT($L113, fail, 'OpenBracket "["'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function OpenBracket(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OpenBracket", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OpenBracket", state, OpenBracket$0(state));
          if (state.events)
            state.events.exit?.("OpenBracket", state, result, eventData);
          return result;
        } else {
          const result = OpenBracket$0(state);
          if (state.events)
            state.events.exit?.("OpenBracket", state, result, eventData);
          return result;
        }
      }
      var OpenParen$0 = $TV($EXPECT($L3, fail, 'OpenParen "("'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function OpenParen(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("OpenParen", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("OpenParen", state, OpenParen$0(state));
          if (state.events)
            state.events.exit?.("OpenParen", state, result, eventData);
          return result;
        } else {
          const result = OpenParen$0(state);
          if (state.events)
            state.events.exit?.("OpenParen", state, result, eventData);
          return result;
        }
      }
      var Operator$0 = $TS($S($EXPECT($L156, fail, 'Operator "operator"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Operator(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Operator", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Operator", state, Operator$0(state));
          if (state.events)
            state.events.exit?.("Operator", state, result, eventData);
          return result;
        } else {
          const result = Operator$0(state);
          if (state.events)
            state.events.exit?.("Operator", state, result, eventData);
          return result;
        }
      }
      var Public$0 = $TS($S($EXPECT($L157, fail, 'Public "public"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Public(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Public", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Public", state, Public$0(state));
          if (state.events)
            state.events.exit?.("Public", state, result, eventData);
          return result;
        } else {
          const result = Public$0(state);
          if (state.events)
            state.events.exit?.("Public", state, result, eventData);
          return result;
        }
      }
      var Private$0 = $TS($S($EXPECT($L158, fail, 'Private "private"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Private(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Private", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Private", state, Private$0(state));
          if (state.events)
            state.events.exit?.("Private", state, result, eventData);
          return result;
        } else {
          const result = Private$0(state);
          if (state.events)
            state.events.exit?.("Private", state, result, eventData);
          return result;
        }
      }
      var Protected$0 = $TS($S($EXPECT($L159, fail, 'Protected "protected"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Protected(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Protected", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Protected", state, Protected$0(state));
          if (state.events)
            state.events.exit?.("Protected", state, result, eventData);
          return result;
        } else {
          const result = Protected$0(state);
          if (state.events)
            state.events.exit?.("Protected", state, result, eventData);
          return result;
        }
      }
      var Pipe$0 = $TV($C($EXPECT($L160, fail, 'Pipe "||>"'), $EXPECT($L161, fail, 'Pipe "|\u25B7"')), function($skip, $loc, $0, $1) {
        return { $loc, token: "||>" };
      });
      var Pipe$1 = $TV($C($EXPECT($L162, fail, 'Pipe "|>="'), $EXPECT($L163, fail, 'Pipe "\u25B7="')), function($skip, $loc, $0, $1) {
        return { $loc, token: "|>=" };
      });
      var Pipe$2 = $TV($C($EXPECT($L164, fail, 'Pipe "|>"'), $EXPECT($L165, fail, 'Pipe "\u25B7"')), function($skip, $loc, $0, $1) {
        return { $loc, token: "|>" };
      });
      function Pipe(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Pipe", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Pipe", state, Pipe$0(state) || Pipe$1(state) || Pipe$2(state));
          if (state.events)
            state.events.exit?.("Pipe", state, result, eventData);
          return result;
        } else {
          const result = Pipe$0(state) || Pipe$1(state) || Pipe$2(state);
          if (state.events)
            state.events.exit?.("Pipe", state, result, eventData);
          return result;
        }
      }
      var QuestionMark$0 = $TV($EXPECT($L4, fail, 'QuestionMark "?"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function QuestionMark(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("QuestionMark", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("QuestionMark", state, QuestionMark$0(state));
          if (state.events)
            state.events.exit?.("QuestionMark", state, result, eventData);
          return result;
        } else {
          const result = QuestionMark$0(state);
          if (state.events)
            state.events.exit?.("QuestionMark", state, result, eventData);
          return result;
        }
      }
      var Readonly$0 = $TS($S($EXPECT($L166, fail, 'Readonly "readonly"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1, ts: true };
      });
      function Readonly(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Readonly", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Readonly", state, Readonly$0(state));
          if (state.events)
            state.events.exit?.("Readonly", state, result, eventData);
          return result;
        } else {
          const result = Readonly$0(state);
          if (state.events)
            state.events.exit?.("Readonly", state, result, eventData);
          return result;
        }
      }
      var Return$0 = $TS($S($EXPECT($L167, fail, 'Return "return"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Return(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Return", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Return", state, Return$0(state));
          if (state.events)
            state.events.exit?.("Return", state, result, eventData);
          return result;
        } else {
          const result = Return$0(state);
          if (state.events)
            state.events.exit?.("Return", state, result, eventData);
          return result;
        }
      }
      var Satisfies$0 = $TS($S($EXPECT($L168, fail, 'Satisfies "satisfies"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Satisfies(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Satisfies", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Satisfies", state, Satisfies$0(state));
          if (state.events)
            state.events.exit?.("Satisfies", state, result, eventData);
          return result;
        } else {
          const result = Satisfies$0(state);
          if (state.events)
            state.events.exit?.("Satisfies", state, result, eventData);
          return result;
        }
      }
      var Semicolon$0 = $TV($EXPECT($L100, fail, 'Semicolon ";"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function Semicolon(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Semicolon", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Semicolon", state, Semicolon$0(state));
          if (state.events)
            state.events.exit?.("Semicolon", state, result, eventData);
          return result;
        } else {
          const result = Semicolon$0(state);
          if (state.events)
            state.events.exit?.("Semicolon", state, result, eventData);
          return result;
        }
      }
      var SingleQuote$0 = $TV($EXPECT($L169, fail, `SingleQuote "'"`), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function SingleQuote(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SingleQuote", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SingleQuote", state, SingleQuote$0(state));
          if (state.events)
            state.events.exit?.("SingleQuote", state, result, eventData);
          return result;
        } else {
          const result = SingleQuote$0(state);
          if (state.events)
            state.events.exit?.("SingleQuote", state, result, eventData);
          return result;
        }
      }
      var Star$0 = $TV($EXPECT($L54, fail, 'Star "*"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function Star(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Star", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Star", state, Star$0(state));
          if (state.events)
            state.events.exit?.("Star", state, result, eventData);
          return result;
        } else {
          const result = Star$0(state);
          if (state.events)
            state.events.exit?.("Star", state, result, eventData);
          return result;
        }
      }
      var Static$0 = $TS($S($EXPECT($L170, fail, 'Static "static"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      var Static$1 = $TS($S($EXPECT($L117, fail, 'Static "@"'), $N($C($EXPECT($L3, fail, 'Static "("'), $EXPECT($L117, fail, 'Static "@"')))), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: "static " };
      });
      function Static(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Static", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Static", state, Static$0(state) || Static$1(state));
          if (state.events)
            state.events.exit?.("Static", state, result, eventData);
          return result;
        } else {
          const result = Static$0(state) || Static$1(state);
          if (state.events)
            state.events.exit?.("Static", state, result, eventData);
          return result;
        }
      }
      var SubstitutionStart$0 = $TV($EXPECT($L171, fail, 'SubstitutionStart "${"'), function($skip, $loc, $0, $1) {
        return { $loc, token: $1 };
      });
      function SubstitutionStart(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("SubstitutionStart", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("SubstitutionStart", state, SubstitutionStart$0(state));
          if (state.events)
            state.events.exit?.("SubstitutionStart", state, result, eventData);
          return result;
        } else {
          const result = SubstitutionStart$0(state);
          if (state.events)
            state.events.exit?.("SubstitutionStart", state, result, eventData);
          return result;
        }
      }
      var Switch$0 = $TS($S($EXPECT($L172, fail, 'Switch "switch"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Switch(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Switch", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Switch", state, Switch$0(state));
          if (state.events)
            state.events.exit?.("Switch", state, result, eventData);
          return result;
        } else {
          const result = Switch$0(state);
          if (state.events)
            state.events.exit?.("Switch", state, result, eventData);
          return result;
        }
      }
      var Target$0 = $TS($S($EXPECT($L173, fail, 'Target "target"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Target(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Target", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Target", state, Target$0(state));
          if (state.events)
            state.events.exit?.("Target", state, result, eventData);
          return result;
        } else {
          const result = Target$0(state);
          if (state.events)
            state.events.exit?.("Target", state, result, eventData);
          return result;
        }
      }
      var Then$0 = $TS($S(__, $EXPECT($L174, fail, 'Then "then"'), NonIdContinue), function($skip, $loc, $0, $1, $2, $3) {
        return { $loc, token: "" };
      });
      function Then(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Then", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Then", state, Then$0(state));
          if (state.events)
            state.events.exit?.("Then", state, result, eventData);
          return result;
        } else {
          const result = Then$0(state);
          if (state.events)
            state.events.exit?.("Then", state, result, eventData);
          return result;
        }
      }
      var This$0 = $TS($S($EXPECT($L175, fail, 'This "this"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function This(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("This", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("This", state, This$0(state));
          if (state.events)
            state.events.exit?.("This", state, result, eventData);
          return result;
        } else {
          const result = This$0(state);
          if (state.events)
            state.events.exit?.("This", state, result, eventData);
          return result;
        }
      }
      var Throw$0 = $TS($S($EXPECT($L176, fail, 'Throw "throw"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Throw(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Throw", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Throw", state, Throw$0(state));
          if (state.events)
            state.events.exit?.("Throw", state, result, eventData);
          return result;
        } else {
          const result = Throw$0(state);
          if (state.events)
            state.events.exit?.("Throw", state, result, eventData);
          return result;
        }
      }
      var TripleDoubleQuote$0 = $TV($EXPECT($L177, fail, 'TripleDoubleQuote "\\\\\\"\\\\\\"\\\\\\""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "`" };
      });
      function TripleDoubleQuote(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TripleDoubleQuote", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TripleDoubleQuote", state, TripleDoubleQuote$0(state));
          if (state.events)
            state.events.exit?.("TripleDoubleQuote", state, result, eventData);
          return result;
        } else {
          const result = TripleDoubleQuote$0(state);
          if (state.events)
            state.events.exit?.("TripleDoubleQuote", state, result, eventData);
          return result;
        }
      }
      var TripleSingleQuote$0 = $TV($EXPECT($L178, fail, `TripleSingleQuote "'''"`), function($skip, $loc, $0, $1) {
        return { $loc, token: "`" };
      });
      function TripleSingleQuote(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TripleSingleQuote", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TripleSingleQuote", state, TripleSingleQuote$0(state));
          if (state.events)
            state.events.exit?.("TripleSingleQuote", state, result, eventData);
          return result;
        } else {
          const result = TripleSingleQuote$0(state);
          if (state.events)
            state.events.exit?.("TripleSingleQuote", state, result, eventData);
          return result;
        }
      }
      var TripleSlash$0 = $TV($EXPECT($L179, fail, 'TripleSlash "///"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "/" };
      });
      function TripleSlash(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TripleSlash", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TripleSlash", state, TripleSlash$0(state));
          if (state.events)
            state.events.exit?.("TripleSlash", state, result, eventData);
          return result;
        } else {
          const result = TripleSlash$0(state);
          if (state.events)
            state.events.exit?.("TripleSlash", state, result, eventData);
          return result;
        }
      }
      var TripleTick$0 = $TV($EXPECT($L180, fail, 'TripleTick "```"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "`" };
      });
      function TripleTick(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TripleTick", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TripleTick", state, TripleTick$0(state));
          if (state.events)
            state.events.exit?.("TripleTick", state, result, eventData);
          return result;
        } else {
          const result = TripleTick$0(state);
          if (state.events)
            state.events.exit?.("TripleTick", state, result, eventData);
          return result;
        }
      }
      var Try$0 = $TS($S($EXPECT($L181, fail, 'Try "try"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Try(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Try", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Try", state, Try$0(state));
          if (state.events)
            state.events.exit?.("Try", state, result, eventData);
          return result;
        } else {
          const result = Try$0(state);
          if (state.events)
            state.events.exit?.("Try", state, result, eventData);
          return result;
        }
      }
      var Typeof$0 = $TS($S($EXPECT($L182, fail, 'Typeof "typeof"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Typeof(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Typeof", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Typeof", state, Typeof$0(state));
          if (state.events)
            state.events.exit?.("Typeof", state, result, eventData);
          return result;
        } else {
          const result = Typeof$0(state);
          if (state.events)
            state.events.exit?.("Typeof", state, result, eventData);
          return result;
        }
      }
      var Unless$0 = $TS($S($EXPECT($L183, fail, 'Unless "unless"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Unless(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Unless", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Unless", state, Unless$0(state));
          if (state.events)
            state.events.exit?.("Unless", state, result, eventData);
          return result;
        } else {
          const result = Unless$0(state);
          if (state.events)
            state.events.exit?.("Unless", state, result, eventData);
          return result;
        }
      }
      var Until$0 = $TS($S($EXPECT($L184, fail, 'Until "until"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Until(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Until", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Until", state, Until$0(state));
          if (state.events)
            state.events.exit?.("Until", state, result, eventData);
          return result;
        } else {
          const result = Until$0(state);
          if (state.events)
            state.events.exit?.("Until", state, result, eventData);
          return result;
        }
      }
      var Var$0 = $TS($S($EXPECT($L185, fail, 'Var "var"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Var(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Var", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Var", state, Var$0(state));
          if (state.events)
            state.events.exit?.("Var", state, result, eventData);
          return result;
        } else {
          const result = Var$0(state);
          if (state.events)
            state.events.exit?.("Var", state, result, eventData);
          return result;
        }
      }
      var Void$0 = $TS($S($EXPECT($L186, fail, 'Void "void"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Void(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Void", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Void", state, Void$0(state));
          if (state.events)
            state.events.exit?.("Void", state, result, eventData);
          return result;
        } else {
          const result = Void$0(state);
          if (state.events)
            state.events.exit?.("Void", state, result, eventData);
          return result;
        }
      }
      var When$0 = $TS($S($EXPECT($L187, fail, 'When "when"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: "case" };
      });
      function When(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("When", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("When", state, When$0(state));
          if (state.events)
            state.events.exit?.("When", state, result, eventData);
          return result;
        } else {
          const result = When$0(state);
          if (state.events)
            state.events.exit?.("When", state, result, eventData);
          return result;
        }
      }
      var While$0 = $TS($S($EXPECT($L188, fail, 'While "while"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function While(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("While", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("While", state, While$0(state));
          if (state.events)
            state.events.exit?.("While", state, result, eventData);
          return result;
        } else {
          const result = While$0(state);
          if (state.events)
            state.events.exit?.("While", state, result, eventData);
          return result;
        }
      }
      var Yield$0 = $TS($S($EXPECT($L189, fail, 'Yield "yield"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1, type: "Yield" };
      });
      function Yield(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Yield", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Yield", state, Yield$0(state));
          if (state.events)
            state.events.exit?.("Yield", state, result, eventData);
          return result;
        } else {
          const result = Yield$0(state);
          if (state.events)
            state.events.exit?.("Yield", state, result, eventData);
          return result;
        }
      }
      var JSXImplicitFragment$0 = $TS($S(JSXTag, $Q($S(Samedent, JSXTag))), function($skip, $loc, $0, $1, $2) {
        const jsx = $2.length === 0 ? $1 : {
          type: "JSXFragment",
          children: [
            "<>\n",
            module.currentIndent.token,
            ...$0,
            "\n",
            module.currentIndent.token,
            "</>"
          ],
          jsxChildren: [$1].concat($2.map(([, tag]) => tag))
        };
        const type = typeOfJSX(jsx, module.config, module.getRef);
        return type ? [
          { ts: true, children: ["("] },
          jsx,
          { ts: true, children: [" as any as ", type, ")"] }
        ] : jsx;
      });
      function JSXImplicitFragment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXImplicitFragment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXImplicitFragment", state, JSXImplicitFragment$0(state));
          if (state.events)
            state.events.exit?.("JSXImplicitFragment", state, result, eventData);
          return result;
        } else {
          const result = JSXImplicitFragment$0(state);
          if (state.events)
            state.events.exit?.("JSXImplicitFragment", state, result, eventData);
          return result;
        }
      }
      var JSXTag$0 = JSXElement;
      var JSXTag$1 = JSXFragment;
      var JSXTag$2 = JSXComment;
      function JSXTag(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXTag", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXTag", state, JSXTag$0(state) || JSXTag$1(state) || JSXTag$2(state));
          if (state.events)
            state.events.exit?.("JSXTag", state, result, eventData);
          return result;
        } else {
          const result = JSXTag$0(state) || JSXTag$1(state) || JSXTag$2(state);
          if (state.events)
            state.events.exit?.("JSXTag", state, result, eventData);
          return result;
        }
      }
      var JSXElement$0 = JSXSelfClosingElement;
      var JSXElement$1 = $TS($S($N(CoffeeJSXEnabled), PushJSXOpeningElement, $E(JSXMixedChildren), JSXOptionalClosingElement, PopJSXStack), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var open = $2;
        var children = $3;
        var close = $4;
        if (!children)
          return $skip;
        $0 = $0.slice(1);
        let parts;
        if (close) {
          parts = $0;
        } else if (children.jsxChildren.length) {
          parts = [
            ...$0,
            "\n",
            module.currentIndent.token,
            ["</", open[1], ">"]
          ];
        } else {
          parts = [open.slice(0, -1), " />"];
        }
        return { type: "JSXElement", children: parts, tag: open[1] };
      });
      var JSXElement$2 = $TS($S(CoffeeJSXEnabled, JSXOpeningElement, $E(JSXChildren), $E(Whitespace), JSXClosingElement), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var open = $2;
        var close = $5;
        $0 = $0.slice(1);
        if (open[1] !== close[2])
          return $skip;
        return { type: "JSXElement", children: $0, tag: open[1] };
      });
      function JSXElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXElement", state, JSXElement$0(state) || JSXElement$1(state) || JSXElement$2(state));
          if (state.events)
            state.events.exit?.("JSXElement", state, result, eventData);
          return result;
        } else {
          const result = JSXElement$0(state) || JSXElement$1(state) || JSXElement$2(state);
          if (state.events)
            state.events.exit?.("JSXElement", state, result, eventData);
          return result;
        }
      }
      var JSXSelfClosingElement$0 = $TS($S($EXPECT($L154, fail, 'JSXSelfClosingElement "<"'), JSXElementName, $E(TypeArguments), $E(JSXAttributes), $E(Whitespace), $EXPECT($L190, fail, 'JSXSelfClosingElement "/>"')), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6) {
        return { type: "JSXElement", children: $0, tag: $2 };
      });
      function JSXSelfClosingElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXSelfClosingElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXSelfClosingElement", state, JSXSelfClosingElement$0(state));
          if (state.events)
            state.events.exit?.("JSXSelfClosingElement", state, result, eventData);
          return result;
        } else {
          const result = JSXSelfClosingElement$0(state);
          if (state.events)
            state.events.exit?.("JSXSelfClosingElement", state, result, eventData);
          return result;
        }
      }
      var PushJSXOpeningElement$0 = $TS($S(JSXOpeningElement), function($skip, $loc, $0, $1) {
        module.JSXTagStack.push($1[1]);
        return $1;
      });
      function PushJSXOpeningElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PushJSXOpeningElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PushJSXOpeningElement", state, PushJSXOpeningElement$0(state));
          if (state.events)
            state.events.exit?.("PushJSXOpeningElement", state, result, eventData);
          return result;
        } else {
          const result = PushJSXOpeningElement$0(state);
          if (state.events)
            state.events.exit?.("PushJSXOpeningElement", state, result, eventData);
          return result;
        }
      }
      var PopJSXStack$0 = $TV($EXPECT($L0, fail, 'PopJSXStack ""'), function($skip, $loc, $0, $1) {
        module.JSXTagStack.pop();
      });
      function PopJSXStack(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PopJSXStack", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PopJSXStack", state, PopJSXStack$0(state));
          if (state.events)
            state.events.exit?.("PopJSXStack", state, result, eventData);
          return result;
        } else {
          const result = PopJSXStack$0(state);
          if (state.events)
            state.events.exit?.("PopJSXStack", state, result, eventData);
          return result;
        }
      }
      var JSXOpeningElement$0 = $S($EXPECT($L154, fail, 'JSXOpeningElement "<"'), JSXElementName, $E(TypeArguments), $E(JSXAttributes), $E(Whitespace), $EXPECT($L33, fail, 'JSXOpeningElement ">"'));
      function JSXOpeningElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXOpeningElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXOpeningElement", state, JSXOpeningElement$0(state));
          if (state.events)
            state.events.exit?.("JSXOpeningElement", state, result, eventData);
          return result;
        } else {
          const result = JSXOpeningElement$0(state);
          if (state.events)
            state.events.exit?.("JSXOpeningElement", state, result, eventData);
          return result;
        }
      }
      var JSXOptionalClosingElement$0 = $TS($S($E(Whitespace), JSXClosingElement), function($skip, $loc, $0, $1, $2) {
        var close = $2;
        if (module.currentJSXTag !== close[2])
          return $skip;
        return $0;
      });
      var JSXOptionalClosingElement$1 = $EXPECT($L0, fail, 'JSXOptionalClosingElement ""');
      function JSXOptionalClosingElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXOptionalClosingElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXOptionalClosingElement", state, JSXOptionalClosingElement$0(state) || JSXOptionalClosingElement$1(state));
          if (state.events)
            state.events.exit?.("JSXOptionalClosingElement", state, result, eventData);
          return result;
        } else {
          const result = JSXOptionalClosingElement$0(state) || JSXOptionalClosingElement$1(state);
          if (state.events)
            state.events.exit?.("JSXOptionalClosingElement", state, result, eventData);
          return result;
        }
      }
      var JSXClosingElement$0 = $S($EXPECT($L191, fail, 'JSXClosingElement "</"'), $E(Whitespace), JSXElementName, $E(Whitespace), $EXPECT($L33, fail, 'JSXClosingElement ">"'));
      function JSXClosingElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXClosingElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXClosingElement", state, JSXClosingElement$0(state));
          if (state.events)
            state.events.exit?.("JSXClosingElement", state, result, eventData);
          return result;
        } else {
          const result = JSXClosingElement$0(state);
          if (state.events)
            state.events.exit?.("JSXClosingElement", state, result, eventData);
          return result;
        }
      }
      var JSXFragment$0 = $TS($S($N(CoffeeJSXEnabled), PushJSXOpeningFragment, $E(JSXMixedChildren), JSXOptionalClosingFragment, PopJSXStack), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var open = $2;
        var children = $3;
        var close = $4;
        if (!children)
          return $skip;
        $0 = $0.slice(1);
        const parts = close ? $0 : [
          ...$0,
          "\n",
          module.currentIndent.token,
          "</>"
        ];
        return { type: "JSXFragment", children: parts, jsxChildren: children.jsxChildren };
      });
      var JSXFragment$1 = $TS($S(CoffeeJSXEnabled, $EXPECT($L192, fail, 'JSXFragment "<>"'), $E(JSXChildren), $E(Whitespace), JSXClosingFragment), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var children = $3;
        $0 = $0.slice(1);
        return {
          type: "JSXFragment",
          children: $0,
          jsxChildren: children ? children.jsxChildren : []
        };
      });
      function JSXFragment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXFragment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXFragment", state, JSXFragment$0(state) || JSXFragment$1(state));
          if (state.events)
            state.events.exit?.("JSXFragment", state, result, eventData);
          return result;
        } else {
          const result = JSXFragment$0(state) || JSXFragment$1(state);
          if (state.events)
            state.events.exit?.("JSXFragment", state, result, eventData);
          return result;
        }
      }
      var PushJSXOpeningFragment$0 = $TV($EXPECT($L192, fail, 'PushJSXOpeningFragment "<>"'), function($skip, $loc, $0, $1) {
        module.JSXTagStack.push("");
        return $1;
      });
      function PushJSXOpeningFragment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PushJSXOpeningFragment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PushJSXOpeningFragment", state, PushJSXOpeningFragment$0(state));
          if (state.events)
            state.events.exit?.("PushJSXOpeningFragment", state, result, eventData);
          return result;
        } else {
          const result = PushJSXOpeningFragment$0(state);
          if (state.events)
            state.events.exit?.("PushJSXOpeningFragment", state, result, eventData);
          return result;
        }
      }
      var JSXOptionalClosingFragment$0 = $TS($S($E(Whitespace), JSXClosingFragment), function($skip, $loc, $0, $1, $2) {
        if (module.currentJSXTag !== "")
          return $skip;
        return $0;
      });
      var JSXOptionalClosingFragment$1 = $EXPECT($L0, fail, 'JSXOptionalClosingFragment ""');
      function JSXOptionalClosingFragment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXOptionalClosingFragment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXOptionalClosingFragment", state, JSXOptionalClosingFragment$0(state) || JSXOptionalClosingFragment$1(state));
          if (state.events)
            state.events.exit?.("JSXOptionalClosingFragment", state, result, eventData);
          return result;
        } else {
          const result = JSXOptionalClosingFragment$0(state) || JSXOptionalClosingFragment$1(state);
          if (state.events)
            state.events.exit?.("JSXOptionalClosingFragment", state, result, eventData);
          return result;
        }
      }
      var JSXClosingFragment$0 = $EXPECT($L193, fail, 'JSXClosingFragment "</>"');
      function JSXClosingFragment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXClosingFragment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXClosingFragment", state, JSXClosingFragment$0(state));
          if (state.events)
            state.events.exit?.("JSXClosingFragment", state, result, eventData);
          return result;
        } else {
          const result = JSXClosingFragment$0(state);
          if (state.events)
            state.events.exit?.("JSXClosingFragment", state, result, eventData);
          return result;
        }
      }
      var JSXElementName$0 = $TV($Y($S($C($EXPECT($L14, fail, 'JSXElementName "#"'), Dot), JSXShorthandString)), function($skip, $loc, $0, $1) {
        return module.config.defaultElement;
      });
      var JSXElementName$1 = $TEXT($S(JSXIdentifierName, $C($S(Colon, JSXIdentifierName), $Q($S(Dot, JSXIdentifierName)))));
      function JSXElementName(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXElementName", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXElementName", state, JSXElementName$0(state) || JSXElementName$1(state));
          if (state.events)
            state.events.exit?.("JSXElementName", state, result, eventData);
          return result;
        } else {
          const result = JSXElementName$0(state) || JSXElementName$1(state);
          if (state.events)
            state.events.exit?.("JSXElementName", state, result, eventData);
          return result;
        }
      }
      var JSXIdentifierName$0 = $R$0($EXPECT($R50, fail, "JSXIdentifierName /(?:\\p{ID_Start}|[_$])(?:\\p{ID_Continue}|[\\u200C\\u200D$-])*/"));
      function JSXIdentifierName(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXIdentifierName", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXIdentifierName", state, JSXIdentifierName$0(state));
          if (state.events)
            state.events.exit?.("JSXIdentifierName", state, result, eventData);
          return result;
        } else {
          const result = JSXIdentifierName$0(state);
          if (state.events)
            state.events.exit?.("JSXIdentifierName", state, result, eventData);
          return result;
        }
      }
      var JSXAttributes$0 = $TV($Q($S($E(Whitespace), JSXAttribute)), function($skip, $loc, $0, $1) {
        const classes = [];
        let attrs = $0.filter((pair) => {
          const [, attr] = pair;
          if (attr.type === "JSXClass") {
            classes.push(attr.class);
            return false;
          }
          return true;
        });
        if (classes.length) {
          let isBraced = function(c) {
            return c[0] === "{" || c[0]?.token === "{";
          }, unbrace = function(c) {
            return c.slice(1, -1);
          }, parseClass = function(c) {
            c = c.token || c;
            if (c.startsWith("'")) {
              c = '"' + c.slice(1, -1).replace(/\\*"/g, (m) => m.length % 2 == 0 ? m : "\\" + m) + '"';
            }
            return JSON.parse(c);
          };
          let className = module.config.react ? "className" : "class";
          attrs = attrs.filter((pair) => {
            const [, attr] = pair;
            if ((attr[0][0] === "class" || attr[0][0] === "className") && !attr[0][1]) {
              className = attr[0][0];
              classes.push(attr[1][attr[1].length - 1]);
              return false;
            }
            return true;
          });
          const strings = [], exprs = [];
          classes.forEach((c) => {
            if (isBraced(c)) {
              exprs.push(unbrace(c));
              exprs.push(", ");
            } else {
              strings.push(parseClass(c));
            }
          });
          const stringPart = strings.filter(Boolean).join(" ");
          let classValue;
          if (exprs.length) {
            exprs.pop();
            if (stringPart) {
              exprs.unshift(JSON.stringify(stringPart), ", ");
            }
            if (exprs.length === 1) {
              let root = exprs[0];
              while (root.length && isWhitespaceOrEmpty(root[root.length - 1])) {
                root = root.slice(0, -1);
              }
              while (root?.length === 1)
                root = root[0];
              if (root?.children)
                root = root.children;
              if (root?.[0]?.token === "`") {
                classValue = ["{", ...exprs, "}"];
              } else {
                classValue = ["{(", ...exprs, ') || ""}'];
              }
            } else {
              classValue = ["{[", ...exprs, '].filter(Boolean).join(" ")}'];
            }
          } else {
            classValue = JSON.stringify(stringPart);
          }
          attrs.splice(0, 0, [" ", [className, ["=", classValue]]]);
        }
        return attrs.map((pair) => {
          const [space, attr] = pair;
          if (space && attr[0] === " ") {
            pair = [space, attr.slice(1)];
          }
          return pair;
        });
      });
      function JSXAttributes(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXAttributes", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXAttributes", state, JSXAttributes$0(state));
          if (state.events)
            state.events.exit?.("JSXAttributes", state, result, eventData);
          return result;
        } else {
          const result = JSXAttributes$0(state);
          if (state.events)
            state.events.exit?.("JSXAttributes", state, result, eventData);
          return result;
        }
      }
      var JSXAttribute$0 = $TS($S(BracedObjectLiteral), function($skip, $loc, $0, $1) {
        return convertObjectToJSXAttributes($1);
      });
      var JSXAttribute$1 = $TS($S(JSXAttributeName, $C(JSXAttributeInitializer, $Y(JSXAttributeSpace))), function($skip, $loc, $0, $1, $2) {
        var name = $1;
        var value = $2;
        if (name.type === "ComputedPropertyName") {
          if (value) {
            value = value[value.length - 1];
            if (value[0]?.token === "{" && value[value.length - 1]?.token === "}") {
              value = value.slice(1, -1);
            }
          } else {
            value = "true";
          }
          return ["{...{", name, ": ", value, "}}"];
        } else {
          return $0;
        }
      });
      var JSXAttribute$2 = $S(InsertInlineOpenBrace, DotDotDot, InlineJSXAttributeValue, InsertCloseBrace, $Y(JSXAttributeSpace));
      var JSXAttribute$3 = $TS($S(AtThis, $E(Identifier), $Q(InlineJSXCallExpressionRest), $Y(JSXAttributeSpace)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var at = $1;
        var id = $2;
        var rest = $3;
        const access = id && {
          type: "PropertyAccess",
          children: [".", id],
          name: id
        };
        const expr = processCallMemberExpression({
          type: "CallExpression",
          children: [at, access, ...rest.flat()]
        });
        const last = lastAccessInCallExpression(expr);
        if (!last)
          return $skip;
        let name;
        if (last.type === "Index") {
          return [
            "{...{",
            { ...last, type: "ComputedPropertyName" },
            ": ",
            expr,
            "}}"
          ];
        } else if (last.name) {
          return [last.name, "={", expr, "}"];
        }
        return $skip;
      });
      var JSXAttribute$4 = $TS($S(Identifier, $P(InlineJSXCallExpressionRest), $Y(JSXAttributeSpace)), function($skip, $loc, $0, $1, $2, $3) {
        var id = $1;
        var rest = $2;
        const expr = processCallMemberExpression({
          type: "CallExpression",
          children: [id, ...rest.flat()]
        });
        if (expr.type === "ObjectExpression") {
          return convertObjectToJSXAttributes(expr);
        }
        const last = lastAccessInCallExpression(expr);
        if (!last)
          return $skip;
        let name;
        if (last.type === "Index") {
          return [
            "{...{",
            { ...last, type: "ComputedPropertyName" },
            ": ",
            expr,
            "}}"
          ];
        } else if (last.name) {
          return [last.name, "={", expr, "}"];
        }
        return $skip;
      });
      var JSXAttribute$5 = $TS($S($EXPECT($L14, fail, 'JSXAttribute "#"'), JSXShorthandString), function($skip, $loc, $0, $1, $2) {
        return [" ", "id=", $2];
      });
      var JSXAttribute$6 = $TS($S(Dot, JSXShorthandString), function($skip, $loc, $0, $1, $2) {
        return {
          type: "JSXClass",
          class: $2
        };
      });
      var JSXAttribute$7 = $TS($S($TEXT($EXPECT($R6, fail, "JSXAttribute /[!+-]/")), JSXAttributeName, $Y(JSXAttributeSpace)), function($skip, $loc, $0, $1, $2, $3) {
        var toggle = $1;
        var id = $2;
        const value = toggle === "+" ? "true" : "false";
        return [" ", id, "={", value, "}"];
      });
      function JSXAttribute(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXAttribute", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXAttribute", state, JSXAttribute$0(state) || JSXAttribute$1(state) || JSXAttribute$2(state) || JSXAttribute$3(state) || JSXAttribute$4(state) || JSXAttribute$5(state) || JSXAttribute$6(state) || JSXAttribute$7(state));
          if (state.events)
            state.events.exit?.("JSXAttribute", state, result, eventData);
          return result;
        } else {
          const result = JSXAttribute$0(state) || JSXAttribute$1(state) || JSXAttribute$2(state) || JSXAttribute$3(state) || JSXAttribute$4(state) || JSXAttribute$5(state) || JSXAttribute$6(state) || JSXAttribute$7(state);
          if (state.events)
            state.events.exit?.("JSXAttribute", state, result, eventData);
          return result;
        }
      }
      var JSXAttributeSpace$0 = $R$0($EXPECT($R51, fail, "JSXAttributeSpace /[\\s>]|\\/>/"));
      function JSXAttributeSpace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXAttributeSpace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXAttributeSpace", state, JSXAttributeSpace$0(state));
          if (state.events)
            state.events.exit?.("JSXAttributeSpace", state, result, eventData);
          return result;
        } else {
          const result = JSXAttributeSpace$0(state);
          if (state.events)
            state.events.exit?.("JSXAttributeSpace", state, result, eventData);
          return result;
        }
      }
      var JSXShorthandString$0 = $TR($EXPECT($R52, fail, "JSXShorthandString /(?:[-\\w:]+|\\([^()]*\\)|\\[[^\\[\\]]*\\])+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return quoteString($0);
      });
      var JSXShorthandString$1 = $TS($S(TemplateLiteral), function($skip, $loc, $0, $1) {
        return ["{", $1, "}"];
      });
      var JSXShorthandString$2 = StringLiteral;
      var JSXShorthandString$3 = $S(OpenBrace, PostfixedExpression, $E(Whitespace), CloseBrace);
      function JSXShorthandString(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXShorthandString", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXShorthandString", state, JSXShorthandString$0(state) || JSXShorthandString$1(state) || JSXShorthandString$2(state) || JSXShorthandString$3(state));
          if (state.events)
            state.events.exit?.("JSXShorthandString", state, result, eventData);
          return result;
        } else {
          const result = JSXShorthandString$0(state) || JSXShorthandString$1(state) || JSXShorthandString$2(state) || JSXShorthandString$3(state);
          if (state.events)
            state.events.exit?.("JSXShorthandString", state, result, eventData);
          return result;
        }
      }
      var JSXAttributeName$0 = $S(JSXIdentifierName, $E($S(Colon, JSXIdentifierName)));
      var JSXAttributeName$1 = ComputedPropertyName;
      function JSXAttributeName(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXAttributeName", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXAttributeName", state, JSXAttributeName$0(state) || JSXAttributeName$1(state));
          if (state.events)
            state.events.exit?.("JSXAttributeName", state, result, eventData);
          return result;
        } else {
          const result = JSXAttributeName$0(state) || JSXAttributeName$1(state);
          if (state.events)
            state.events.exit?.("JSXAttributeName", state, result, eventData);
          return result;
        }
      }
      var JSXAttributeInitializer$0 = $S($E(Whitespace), Equals, $E(Whitespace), JSXAttributeValue);
      function JSXAttributeInitializer(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXAttributeInitializer", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXAttributeInitializer", state, JSXAttributeInitializer$0(state));
          if (state.events)
            state.events.exit?.("JSXAttributeInitializer", state, result, eventData);
          return result;
        } else {
          const result = JSXAttributeInitializer$0(state);
          if (state.events)
            state.events.exit?.("JSXAttributeInitializer", state, result, eventData);
          return result;
        }
      }
      var JSXAttributeValue$0 = $S(OpenBrace, PostfixedExpression, $E(Whitespace), CloseBrace);
      var JSXAttributeValue$1 = JSXElement;
      var JSXAttributeValue$2 = JSXFragment;
      var JSXAttributeValue$3 = $TS($S(InsertInlineOpenBrace, InlineJSXAttributeValue, InsertCloseBrace, $Y(JSXAttributeSpace)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var open = $1;
        var value = $2;
        var close = $3;
        if (value.type === "StringLiteral") {
          return $skip;
        }
        return [open, value, close];
      });
      var JSXAttributeValue$4 = $R$0($EXPECT($R53, fail, `JSXAttributeValue /"[^"]*"|'[^']*'/`));
      function JSXAttributeValue(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXAttributeValue", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXAttributeValue", state, JSXAttributeValue$0(state) || JSXAttributeValue$1(state) || JSXAttributeValue$2(state) || JSXAttributeValue$3(state) || JSXAttributeValue$4(state));
          if (state.events)
            state.events.exit?.("JSXAttributeValue", state, result, eventData);
          return result;
        } else {
          const result = JSXAttributeValue$0(state) || JSXAttributeValue$1(state) || JSXAttributeValue$2(state) || JSXAttributeValue$3(state) || JSXAttributeValue$4(state);
          if (state.events)
            state.events.exit?.("JSXAttributeValue", state, result, eventData);
          return result;
        }
      }
      var InlineJSXAttributeValue$0 = $TS($S(InlineJSXUnaryExpression, $Q(InlineJSXBinaryOpRHS)), function($skip, $loc, $0, $1, $2) {
        if ($2.length)
          return processBinaryOpExpression($0);
        return $1;
      });
      function InlineJSXAttributeValue(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXAttributeValue", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXAttributeValue", state, InlineJSXAttributeValue$0(state));
          if (state.events)
            state.events.exit?.("InlineJSXAttributeValue", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXAttributeValue$0(state);
          if (state.events)
            state.events.exit?.("InlineJSXAttributeValue", state, result, eventData);
          return result;
        }
      }
      var InlineJSXBinaryOpRHS$0 = $TS($S($N($EXPECT($R54, fail, "InlineJSXBinaryOpRHS /[<>]/")), BinaryOp, InlineJSXUnaryExpression), function($skip, $loc, $0, $1, $2, $3) {
        var op = $2;
        var rhs = $3;
        return [[], op, [], rhs];
      });
      function InlineJSXBinaryOpRHS(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXBinaryOpRHS", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXBinaryOpRHS", state, InlineJSXBinaryOpRHS$0(state));
          if (state.events)
            state.events.exit?.("InlineJSXBinaryOpRHS", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXBinaryOpRHS$0(state);
          if (state.events)
            state.events.exit?.("InlineJSXBinaryOpRHS", state, result, eventData);
          return result;
        }
      }
      var InlineJSXUnaryExpression$0 = $TS($S($Q(InlineJSXUnaryOp), InlineJSXUpdateExpression, $E(InlineJSXUnaryPostfix)), function($skip, $loc, $0, $1, $2, $3) {
        var pre = $1;
        var exp = $2;
        var post = $3;
        return processUnaryExpression(pre, exp, post);
      });
      function InlineJSXUnaryExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXUnaryExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXUnaryExpression", state, InlineJSXUnaryExpression$0(state));
          if (state.events)
            state.events.exit?.("InlineJSXUnaryExpression", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXUnaryExpression$0(state);
          if (state.events)
            state.events.exit?.("InlineJSXUnaryExpression", state, result, eventData);
          return result;
        }
      }
      var InlineJSXUnaryOp$0 = $TR($EXPECT($R55, fail, "InlineJSXUnaryOp /[!~+-](?!\\s|[!~+-]*&)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function InlineJSXUnaryOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXUnaryOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXUnaryOp", state, InlineJSXUnaryOp$0(state));
          if (state.events)
            state.events.exit?.("InlineJSXUnaryOp", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXUnaryOp$0(state);
          if (state.events)
            state.events.exit?.("InlineJSXUnaryOp", state, result, eventData);
          return result;
        }
      }
      var InlineJSXUnaryPostfix$0 = QuestionMark;
      function InlineJSXUnaryPostfix(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXUnaryPostfix", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXUnaryPostfix", state, InlineJSXUnaryPostfix$0(state));
          if (state.events)
            state.events.exit?.("InlineJSXUnaryPostfix", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXUnaryPostfix$0(state);
          if (state.events)
            state.events.exit?.("InlineJSXUnaryPostfix", state, result, eventData);
          return result;
        }
      }
      var InlineJSXUpdateExpression$0 = $S(UpdateExpressionSymbol, UnaryExpression);
      var InlineJSXUpdateExpression$1 = $TS($S(InlineJSXCallExpression, $E(UpdateExpressionSymbol)), function($skip, $loc, $0, $1, $2) {
        if ($2)
          return $0;
        return $1;
      });
      function InlineJSXUpdateExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXUpdateExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXUpdateExpression", state, InlineJSXUpdateExpression$0(state) || InlineJSXUpdateExpression$1(state));
          if (state.events)
            state.events.exit?.("InlineJSXUpdateExpression", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXUpdateExpression$0(state) || InlineJSXUpdateExpression$1(state);
          if (state.events)
            state.events.exit?.("InlineJSXUpdateExpression", state, result, eventData);
          return result;
        }
      }
      var InlineJSXCallExpression$0 = $TS($S($EXPECT($L15, fail, 'InlineJSXCallExpression "super"'), ExplicitArguments, $Q(InlineJSXCallExpressionRest)), function($skip, $loc, $0, $1, $2, $3) {
        var args = $2;
        var rest = $3;
        return processCallMemberExpression({
          type: "CallExpression",
          children: [
            $1,
            { type: "Call", children: args },
            ...rest.flat()
          ]
        });
      });
      var InlineJSXCallExpression$1 = $TS($S($EXPECT($L16, fail, 'InlineJSXCallExpression "import"'), ExplicitArguments, $Q(InlineJSXCallExpressionRest)), function($skip, $loc, $0, $1, $2, $3) {
        var args = $2;
        var rest = $3;
        return processCallMemberExpression({
          type: "CallExpression",
          children: [
            $1,
            { type: "Call", children: args },
            ...rest.flat()
          ]
        });
      });
      var InlineJSXCallExpression$2 = $TS($S(InlineJSXMemberExpression, $Q(InlineJSXCallExpressionRest)), function($skip, $loc, $0, $1, $2) {
        var member = $1;
        var rest = $2;
        if (rest.length) {
          rest = rest.flat();
          return processCallMemberExpression({
            type: "CallExpression",
            children: [member, ...rest]
          });
        }
        return member;
      });
      function InlineJSXCallExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXCallExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXCallExpression", state, InlineJSXCallExpression$0(state) || InlineJSXCallExpression$1(state) || InlineJSXCallExpression$2(state));
          if (state.events)
            state.events.exit?.("InlineJSXCallExpression", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXCallExpression$0(state) || InlineJSXCallExpression$1(state) || InlineJSXCallExpression$2(state);
          if (state.events)
            state.events.exit?.("InlineJSXCallExpression", state, result, eventData);
          return result;
        }
      }
      var InlineJSXCallExpressionRest$0 = InlineJSXMemberExpressionRest;
      var InlineJSXCallExpressionRest$1 = $TV($C(TemplateLiteral, StringLiteral), function($skip, $loc, $0, $1) {
        if ($1.type === "StringLiteral") {
          return "`" + $1.token.slice(1, -1).replace(/(`|\$\{)/g, "\\$1") + "`";
        }
        return $1;
      });
      var InlineJSXCallExpressionRest$2 = $TS($S($E($C(OptionalShorthand, NonNullAssertion)), ExplicitArguments), function($skip, $loc, $0, $1, $2) {
        var args = $2;
        args = { type: "Call", children: args };
        if (!$1)
          return args;
        return [$1, args];
      });
      function InlineJSXCallExpressionRest(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXCallExpressionRest", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXCallExpressionRest", state, InlineJSXCallExpressionRest$0(state) || InlineJSXCallExpressionRest$1(state) || InlineJSXCallExpressionRest$2(state));
          if (state.events)
            state.events.exit?.("InlineJSXCallExpressionRest", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXCallExpressionRest$0(state) || InlineJSXCallExpressionRest$1(state) || InlineJSXCallExpressionRest$2(state);
          if (state.events)
            state.events.exit?.("InlineJSXCallExpressionRest", state, result, eventData);
          return result;
        }
      }
      var InlineJSXMemberExpression$0 = $TS($S($C(InlineJSXPrimaryExpression, SuperProperty, MetaProperty), $Q(InlineJSXMemberExpressionRest)), function($skip, $loc, $0, $1, $2) {
        var rest = $2;
        if (rest.length || Array.isArray($1)) {
          return processCallMemberExpression({
            type: "MemberExpression",
            children: [$1, ...rest].flat()
          });
        }
        return $1;
      });
      function InlineJSXMemberExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXMemberExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXMemberExpression", state, InlineJSXMemberExpression$0(state));
          if (state.events)
            state.events.exit?.("InlineJSXMemberExpression", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXMemberExpression$0(state);
          if (state.events)
            state.events.exit?.("InlineJSXMemberExpression", state, result, eventData);
          return result;
        }
      }
      var InlineJSXMemberExpressionRest$0 = $TS($S($E($C(OptionalShorthand, NonNullAssertion)), MemberBracketContent), function($skip, $loc, $0, $1, $2) {
        if ($1) {
          if ($1.type === "Optional" && $2.type === "SliceExpression") {
            return [$1.children[0], $2];
          }
          return $0;
        }
        return $2;
      });
      var InlineJSXMemberExpressionRest$1 = PropertyAccess;
      var InlineJSXMemberExpressionRest$2 = PropertyGlob;
      var InlineJSXMemberExpressionRest$3 = PropertyBind;
      var InlineJSXMemberExpressionRest$4 = NonNullAssertion;
      function InlineJSXMemberExpressionRest(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXMemberExpressionRest", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXMemberExpressionRest", state, InlineJSXMemberExpressionRest$0(state) || InlineJSXMemberExpressionRest$1(state) || InlineJSXMemberExpressionRest$2(state) || InlineJSXMemberExpressionRest$3(state) || InlineJSXMemberExpressionRest$4(state));
          if (state.events)
            state.events.exit?.("InlineJSXMemberExpressionRest", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXMemberExpressionRest$0(state) || InlineJSXMemberExpressionRest$1(state) || InlineJSXMemberExpressionRest$2(state) || InlineJSXMemberExpressionRest$3(state) || InlineJSXMemberExpressionRest$4(state);
          if (state.events)
            state.events.exit?.("InlineJSXMemberExpressionRest", state, result, eventData);
          return result;
        }
      }
      var InlineJSXPrimaryExpression$0 = NullLiteral;
      var InlineJSXPrimaryExpression$1 = BooleanLiteral;
      var InlineJSXPrimaryExpression$2 = NumericLiteral;
      var InlineJSXPrimaryExpression$3 = TemplateLiteral;
      var InlineJSXPrimaryExpression$4 = ThisLiteral;
      var InlineJSXPrimaryExpression$5 = ArrayLiteral;
      var InlineJSXPrimaryExpression$6 = BracedObjectLiteral;
      var InlineJSXPrimaryExpression$7 = IdentifierReference;
      var InlineJSXPrimaryExpression$8 = RegularExpressionLiteral;
      var InlineJSXPrimaryExpression$9 = ParenthesizedExpression;
      function InlineJSXPrimaryExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineJSXPrimaryExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineJSXPrimaryExpression", state, InlineJSXPrimaryExpression$0(state) || InlineJSXPrimaryExpression$1(state) || InlineJSXPrimaryExpression$2(state) || InlineJSXPrimaryExpression$3(state) || InlineJSXPrimaryExpression$4(state) || InlineJSXPrimaryExpression$5(state) || InlineJSXPrimaryExpression$6(state) || InlineJSXPrimaryExpression$7(state) || InlineJSXPrimaryExpression$8(state) || InlineJSXPrimaryExpression$9(state));
          if (state.events)
            state.events.exit?.("InlineJSXPrimaryExpression", state, result, eventData);
          return result;
        } else {
          const result = InlineJSXPrimaryExpression$0(state) || InlineJSXPrimaryExpression$1(state) || InlineJSXPrimaryExpression$2(state) || InlineJSXPrimaryExpression$3(state) || InlineJSXPrimaryExpression$4(state) || InlineJSXPrimaryExpression$5(state) || InlineJSXPrimaryExpression$6(state) || InlineJSXPrimaryExpression$7(state) || InlineJSXPrimaryExpression$8(state) || InlineJSXPrimaryExpression$9(state);
          if (state.events)
            state.events.exit?.("InlineJSXPrimaryExpression", state, result, eventData);
          return result;
        }
      }
      var JSXMixedChildren$0 = $TS($S($Q(JSXChild), JSXNestedChildren), function($skip, $loc, $0, $1, $2) {
        var c1 = $1;
        var c2 = $2;
        return {
          children: c1.concat(c2),
          jsxChildren: c1.concat(c2.jsxChildren)
        };
      });
      function JSXMixedChildren(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXMixedChildren", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXMixedChildren", state, JSXMixedChildren$0(state));
          if (state.events)
            state.events.exit?.("JSXMixedChildren", state, result, eventData);
          return result;
        } else {
          const result = JSXMixedChildren$0(state);
          if (state.events)
            state.events.exit?.("JSXMixedChildren", state, result, eventData);
          return result;
        }
      }
      var JSXChildren$0 = $TV($Q($S($Q($S($E(NonNewlineWhitespace), EOL, $E(NonNewlineWhitespace))), JSXChild)), function($skip, $loc, $0, $1) {
        return {
          children: $1,
          jsxChildren: $1.map((children) => children[1])
        };
      });
      function JSXChildren(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXChildren", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXChildren", state, JSXChildren$0(state));
          if (state.events)
            state.events.exit?.("JSXChildren", state, result, eventData);
          return result;
        } else {
          const result = JSXChildren$0(state);
          if (state.events)
            state.events.exit?.("JSXChildren", state, result, eventData);
          return result;
        }
      }
      var JSXNestedChildren$0 = $TS($S(PushIndent, $Q($S(JSXNested, $P(JSXChild))), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        if ($2.length) {
          return {
            children: $2,
            jsxChildren: [].concat(...$2.map((nestedChildren) => nestedChildren[1]))
          };
        }
        return $skip;
      });
      var JSXNestedChildren$1 = $TV($Y($C(JSXEOS, $EXPECT($L25, fail, 'JSXNestedChildren "}"'), JSXClosingElement, JSXClosingFragment)), function($skip, $loc, $0, $1) {
        return { children: [], jsxChildren: [] };
      });
      function JSXNestedChildren(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXNestedChildren", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXNestedChildren", state, JSXNestedChildren$0(state) || JSXNestedChildren$1(state));
          if (state.events)
            state.events.exit?.("JSXNestedChildren", state, result, eventData);
          return result;
        } else {
          const result = JSXNestedChildren$0(state) || JSXNestedChildren$1(state);
          if (state.events)
            state.events.exit?.("JSXNestedChildren", state, result, eventData);
          return result;
        }
      }
      var JSXEOS$0 = $P($S($E(NonNewlineWhitespace), EOL));
      function JSXEOS(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXEOS", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXEOS", state, JSXEOS$0(state));
          if (state.events)
            state.events.exit?.("JSXEOS", state, result, eventData);
          return result;
        } else {
          const result = JSXEOS$0(state);
          if (state.events)
            state.events.exit?.("JSXEOS", state, result, eventData);
          return result;
        }
      }
      var JSXNested$0 = $TS($S(JSXEOS, Indent), function($skip, $loc, $0, $1, $2) {
        var eos = $1;
        var indent = $2;
        const { level } = indent;
        const currentIndent = module.currentIndent;
        if (level !== currentIndent.level)
          return $skip;
        return $0;
      });
      function JSXNested(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXNested", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXNested", state, JSXNested$0(state));
          if (state.events)
            state.events.exit?.("JSXNested", state, result, eventData);
          return result;
        } else {
          const result = JSXNested$0(state);
          if (state.events)
            state.events.exit?.("JSXNested", state, result, eventData);
          return result;
        }
      }
      var JSXChild$0 = JSXElement;
      var JSXChild$1 = JSXFragment;
      var JSXChild$2 = JSXComment;
      var JSXChild$3 = $TS($S(OpenBrace, IndentedJSXChildExpression, __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4) {
        var expression = $2;
        return {
          type: "JSXChildExpression",
          children: $0,
          expression
        };
      });
      var JSXChild$4 = $TS($S(OpenBrace, $E(JSXChildExpression), __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4) {
        var expression = $2;
        return {
          type: "JSXChildExpression",
          children: $0,
          expression
        };
      });
      var JSXChild$5 = $TS($S(InsertInlineOpenBrace, ArrowFunction, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3) {
        var expression = $2;
        return {
          type: "JSXChildExpression",
          children: $0,
          expression
        };
      });
      var JSXChild$6 = JSXText;
      function JSXChild(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXChild", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXChild", state, JSXChild$0(state) || JSXChild$1(state) || JSXChild$2(state) || JSXChild$3(state) || JSXChild$4(state) || JSXChild$5(state) || JSXChild$6(state));
          if (state.events)
            state.events.exit?.("JSXChild", state, result, eventData);
          return result;
        } else {
          const result = JSXChild$0(state) || JSXChild$1(state) || JSXChild$2(state) || JSXChild$3(state) || JSXChild$4(state) || JSXChild$5(state) || JSXChild$6(state);
          if (state.events)
            state.events.exit?.("JSXChild", state, result, eventData);
          return result;
        }
      }
      var JSXComment$0 = $TS($S($EXPECT($L194, fail, 'JSXComment "<!--"'), JSXCommentContent, $EXPECT($L195, fail, 'JSXComment "-->"')), function($skip, $loc, $0, $1, $2, $3) {
        return ["{/*", $2, "*/}"];
      });
      function JSXComment(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXComment", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXComment", state, JSXComment$0(state));
          if (state.events)
            state.events.exit?.("JSXComment", state, result, eventData);
          return result;
        } else {
          const result = JSXComment$0(state);
          if (state.events)
            state.events.exit?.("JSXComment", state, result, eventData);
          return result;
        }
      }
      var JSXCommentContent$0 = $TR($EXPECT($R56, fail, "JSXCommentContent /(?:-[^-]|[^-]*)*/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0.replace(/\*\//g, "* /") };
      });
      function JSXCommentContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXCommentContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXCommentContent", state, JSXCommentContent$0(state));
          if (state.events)
            state.events.exit?.("JSXCommentContent", state, result, eventData);
          return result;
        } else {
          const result = JSXCommentContent$0(state);
          if (state.events)
            state.events.exit?.("JSXCommentContent", state, result, eventData);
          return result;
        }
      }
      var JSXText$0 = $TR($EXPECT($R57, fail, "JSXText /[^{}<>\\r\\n]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return {
          type: "JSXText",
          token: $0,
          $loc
        };
      });
      function JSXText(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXText", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXText", state, JSXText$0(state));
          if (state.events)
            state.events.exit?.("JSXText", state, result, eventData);
          return result;
        } else {
          const result = JSXText$0(state);
          if (state.events)
            state.events.exit?.("JSXText", state, result, eventData);
          return result;
        }
      }
      var JSXChildExpression$0 = $S($E(Whitespace), $E($S(DotDotDot, $E(Whitespace))), PostfixedExpression);
      function JSXChildExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("JSXChildExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("JSXChildExpression", state, JSXChildExpression$0(state));
          if (state.events)
            state.events.exit?.("JSXChildExpression", state, result, eventData);
          return result;
        } else {
          const result = JSXChildExpression$0(state);
          if (state.events)
            state.events.exit?.("JSXChildExpression", state, result, eventData);
          return result;
        }
      }
      var IndentedJSXChildExpression$0 = $TS($S(PushIndent, $E(NestedJSXChildExpression), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        if (!$2)
          return $skip;
        return $2;
      });
      function IndentedJSXChildExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IndentedJSXChildExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IndentedJSXChildExpression", state, IndentedJSXChildExpression$0(state));
          if (state.events)
            state.events.exit?.("IndentedJSXChildExpression", state, result, eventData);
          return result;
        } else {
          const result = IndentedJSXChildExpression$0(state);
          if (state.events)
            state.events.exit?.("IndentedJSXChildExpression", state, result, eventData);
          return result;
        }
      }
      var NestedJSXChildExpression$0 = $S(JSXNested, JSXChildExpression);
      function NestedJSXChildExpression(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedJSXChildExpression", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedJSXChildExpression", state, NestedJSXChildExpression$0(state));
          if (state.events)
            state.events.exit?.("NestedJSXChildExpression", state, result, eventData);
          return result;
        } else {
          const result = NestedJSXChildExpression$0(state);
          if (state.events)
            state.events.exit?.("NestedJSXChildExpression", state, result, eventData);
          return result;
        }
      }
      var TypeDeclaration$0 = $T($S($E($S(Export, $E(_))), $S(Declare, $E(_)), TypeLexicalDeclaration), function(value) {
        return { "ts": true, "children": value };
      });
      var TypeDeclaration$1 = $T($S($E($S(Export, $E(_))), $E($S(Declare, $E(_))), TypeDeclarationRest), function(value) {
        return { "ts": true, "children": value };
      });
      function TypeDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeDeclaration", state, TypeDeclaration$0(state) || TypeDeclaration$1(state));
          if (state.events)
            state.events.exit?.("TypeDeclaration", state, result, eventData);
          return result;
        } else {
          const result = TypeDeclaration$0(state) || TypeDeclaration$1(state);
          if (state.events)
            state.events.exit?.("TypeDeclaration", state, result, eventData);
          return result;
        }
      }
      var TypeDeclarationRest$0 = $S(TypeKeyword, $E(_), IdentifierName, $E(TypeParameters), __, Equals, $C($S($E(_), Type), $S(__, Type)));
      var TypeDeclarationRest$1 = $S(Interface, $E(_), IdentifierName, $E(TypeParameters), $E(InterfaceExtendsClause), InterfaceBlock);
      var TypeDeclarationRest$2 = $S(Namespace, $E(_), IdentifierName, ModuleBlock);
      var TypeDeclarationRest$3 = FunctionSignature;
      function TypeDeclarationRest(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeDeclarationRest", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeDeclarationRest", state, TypeDeclarationRest$0(state) || TypeDeclarationRest$1(state) || TypeDeclarationRest$2(state) || TypeDeclarationRest$3(state));
          if (state.events)
            state.events.exit?.("TypeDeclarationRest", state, result, eventData);
          return result;
        } else {
          const result = TypeDeclarationRest$0(state) || TypeDeclarationRest$1(state) || TypeDeclarationRest$2(state) || TypeDeclarationRest$3(state);
          if (state.events)
            state.events.exit?.("TypeDeclarationRest", state, result, eventData);
          return result;
        }
      }
      var TypeLexicalDeclaration$0 = $S(__, LetOrConstOrVar, TypeDeclarationBinding, $Q($S(CommaDelimiter, __, TypeDeclarationBinding)));
      var TypeLexicalDeclaration$1 = $S(__, EnumDeclaration);
      var TypeLexicalDeclaration$2 = ClassSignature;
      var TypeLexicalDeclaration$3 = $S(Namespace, $E(_), IdentifierName, DeclareBlock);
      var TypeLexicalDeclaration$4 = $S(Module, _, StringLiteral, $E(DeclareBlock));
      var TypeLexicalDeclaration$5 = $S(Global, $E(DeclareBlock));
      function TypeLexicalDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeLexicalDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeLexicalDeclaration", state, TypeLexicalDeclaration$0(state) || TypeLexicalDeclaration$1(state) || TypeLexicalDeclaration$2(state) || TypeLexicalDeclaration$3(state) || TypeLexicalDeclaration$4(state) || TypeLexicalDeclaration$5(state));
          if (state.events)
            state.events.exit?.("TypeLexicalDeclaration", state, result, eventData);
          return result;
        } else {
          const result = TypeLexicalDeclaration$0(state) || TypeLexicalDeclaration$1(state) || TypeLexicalDeclaration$2(state) || TypeLexicalDeclaration$3(state) || TypeLexicalDeclaration$4(state) || TypeLexicalDeclaration$5(state);
          if (state.events)
            state.events.exit?.("TypeLexicalDeclaration", state, result, eventData);
          return result;
        }
      }
      var TypeDeclarationBinding$0 = $S($C(BindingPattern, BindingIdentifier), $E(TypeSuffix));
      function TypeDeclarationBinding(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeDeclarationBinding", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeDeclarationBinding", state, TypeDeclarationBinding$0(state));
          if (state.events)
            state.events.exit?.("TypeDeclarationBinding", state, result, eventData);
          return result;
        } else {
          const result = TypeDeclarationBinding$0(state);
          if (state.events)
            state.events.exit?.("TypeDeclarationBinding", state, result, eventData);
          return result;
        }
      }
      var InterfaceExtendsClause$0 = $S(ExtendsToken, InterfaceExtendsTarget, $Q($S(Comma, InterfaceExtendsTarget)));
      function InterfaceExtendsClause(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InterfaceExtendsClause", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InterfaceExtendsClause", state, InterfaceExtendsClause$0(state));
          if (state.events)
            state.events.exit?.("InterfaceExtendsClause", state, result, eventData);
          return result;
        } else {
          const result = InterfaceExtendsClause$0(state);
          if (state.events)
            state.events.exit?.("InterfaceExtendsClause", state, result, eventData);
          return result;
        }
      }
      var InterfaceExtendsTarget$0 = ImplementsTarget;
      function InterfaceExtendsTarget(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InterfaceExtendsTarget", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InterfaceExtendsTarget", state, InterfaceExtendsTarget$0(state));
          if (state.events)
            state.events.exit?.("InterfaceExtendsTarget", state, result, eventData);
          return result;
        } else {
          const result = InterfaceExtendsTarget$0(state);
          if (state.events)
            state.events.exit?.("InterfaceExtendsTarget", state, result, eventData);
          return result;
        }
      }
      var TypeKeyword$0 = $TS($S($EXPECT($L196, fail, 'TypeKeyword "type"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function TypeKeyword(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeKeyword", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeKeyword", state, TypeKeyword$0(state));
          if (state.events)
            state.events.exit?.("TypeKeyword", state, result, eventData);
          return result;
        } else {
          const result = TypeKeyword$0(state);
          if (state.events)
            state.events.exit?.("TypeKeyword", state, result, eventData);
          return result;
        }
      }
      var Enum$0 = $TS($S($EXPECT($L197, fail, 'Enum "enum"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Enum(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Enum", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Enum", state, Enum$0(state));
          if (state.events)
            state.events.exit?.("Enum", state, result, eventData);
          return result;
        } else {
          const result = Enum$0(state);
          if (state.events)
            state.events.exit?.("Enum", state, result, eventData);
          return result;
        }
      }
      var Interface$0 = $TS($S($EXPECT($L198, fail, 'Interface "interface"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Interface(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Interface", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Interface", state, Interface$0(state));
          if (state.events)
            state.events.exit?.("Interface", state, result, eventData);
          return result;
        } else {
          const result = Interface$0(state);
          if (state.events)
            state.events.exit?.("Interface", state, result, eventData);
          return result;
        }
      }
      var Global$0 = $TS($S($EXPECT($L199, fail, 'Global "global"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Global(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Global", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Global", state, Global$0(state));
          if (state.events)
            state.events.exit?.("Global", state, result, eventData);
          return result;
        } else {
          const result = Global$0(state);
          if (state.events)
            state.events.exit?.("Global", state, result, eventData);
          return result;
        }
      }
      var Module$0 = $TS($S($EXPECT($L200, fail, 'Module "module"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Module(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Module", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Module", state, Module$0(state));
          if (state.events)
            state.events.exit?.("Module", state, result, eventData);
          return result;
        } else {
          const result = Module$0(state);
          if (state.events)
            state.events.exit?.("Module", state, result, eventData);
          return result;
        }
      }
      var Namespace$0 = $TS($S($EXPECT($L201, fail, 'Namespace "namespace"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { $loc, token: $1 };
      });
      function Namespace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Namespace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Namespace", state, Namespace$0(state));
          if (state.events)
            state.events.exit?.("Namespace", state, result, eventData);
          return result;
        } else {
          const result = Namespace$0(state);
          if (state.events)
            state.events.exit?.("Namespace", state, result, eventData);
          return result;
        }
      }
      var InterfaceBlock$0 = $S(__, OpenBrace, NestedInterfaceProperties, __, CloseBrace);
      var InterfaceBlock$1 = $S(__, OpenBrace, $Q($S(__, InterfaceProperty)), __, CloseBrace);
      var InterfaceBlock$2 = $S(InsertOpenBrace, NestedInterfaceProperties, InsertNewline, InsertIndent, InsertCloseBrace);
      function InterfaceBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InterfaceBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InterfaceBlock", state, InterfaceBlock$0(state) || InterfaceBlock$1(state) || InterfaceBlock$2(state));
          if (state.events)
            state.events.exit?.("InterfaceBlock", state, result, eventData);
          return result;
        } else {
          const result = InterfaceBlock$0(state) || InterfaceBlock$1(state) || InterfaceBlock$2(state);
          if (state.events)
            state.events.exit?.("InterfaceBlock", state, result, eventData);
          return result;
        }
      }
      var NestedInterfaceProperties$0 = $TS($S(PushIndent, $Q(NestedInterfaceProperty), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var props = $2;
        if (props.length)
          return props;
        return $skip;
      });
      function NestedInterfaceProperties(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedInterfaceProperties", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedInterfaceProperties", state, NestedInterfaceProperties$0(state));
          if (state.events)
            state.events.exit?.("NestedInterfaceProperties", state, result, eventData);
          return result;
        } else {
          const result = NestedInterfaceProperties$0(state);
          if (state.events)
            state.events.exit?.("NestedInterfaceProperties", state, result, eventData);
          return result;
        }
      }
      var NestedInterfaceProperty$0 = $S(Nested, InterfaceProperty);
      function NestedInterfaceProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedInterfaceProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedInterfaceProperty", state, NestedInterfaceProperty$0(state));
          if (state.events)
            state.events.exit?.("NestedInterfaceProperty", state, result, eventData);
          return result;
        } else {
          const result = NestedInterfaceProperty$0(state);
          if (state.events)
            state.events.exit?.("NestedInterfaceProperty", state, result, eventData);
          return result;
        }
      }
      var InterfaceProperty$0 = BasicInterfaceProperty;
      var InterfaceProperty$1 = $S(NonEmptyParameters, TypeSuffix, InterfacePropertyDelimiter);
      var InterfaceProperty$2 = $S(MethodSignature, InterfacePropertyDelimiter);
      function InterfaceProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InterfaceProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InterfaceProperty", state, InterfaceProperty$0(state) || InterfaceProperty$1(state) || InterfaceProperty$2(state));
          if (state.events)
            state.events.exit?.("InterfaceProperty", state, result, eventData);
          return result;
        } else {
          const result = InterfaceProperty$0(state) || InterfaceProperty$1(state) || InterfaceProperty$2(state);
          if (state.events)
            state.events.exit?.("InterfaceProperty", state, result, eventData);
          return result;
        }
      }
      var BasicInterfaceProperty$0 = $S($C(TypeIndexSignature, TypeProperty), $E(_), TypeSuffix, InterfacePropertyDelimiter);
      function BasicInterfaceProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("BasicInterfaceProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("BasicInterfaceProperty", state, BasicInterfaceProperty$0(state));
          if (state.events)
            state.events.exit?.("BasicInterfaceProperty", state, result, eventData);
          return result;
        } else {
          const result = BasicInterfaceProperty$0(state);
          if (state.events)
            state.events.exit?.("BasicInterfaceProperty", state, result, eventData);
          return result;
        }
      }
      var InterfacePropertyDelimiter$0 = $S($E(_), $C(Semicolon, Comma));
      var InterfacePropertyDelimiter$1 = $Y($S(__, CloseBrace));
      var InterfacePropertyDelimiter$2 = $Y(EOS);
      function InterfacePropertyDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InterfacePropertyDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InterfacePropertyDelimiter", state, InterfacePropertyDelimiter$0(state) || InterfacePropertyDelimiter$1(state) || InterfacePropertyDelimiter$2(state));
          if (state.events)
            state.events.exit?.("InterfacePropertyDelimiter", state, result, eventData);
          return result;
        } else {
          const result = InterfacePropertyDelimiter$0(state) || InterfacePropertyDelimiter$1(state) || InterfacePropertyDelimiter$2(state);
          if (state.events)
            state.events.exit?.("InterfacePropertyDelimiter", state, result, eventData);
          return result;
        }
      }
      var ModuleBlock$0 = $S(__, OpenBrace, NestedModuleItems, __, CloseBrace);
      var ModuleBlock$1 = $S(InsertOpenBrace, NestedModuleItems, InsertNewline, InsertIndent, InsertCloseBrace);
      function ModuleBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ModuleBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ModuleBlock", state, ModuleBlock$0(state) || ModuleBlock$1(state));
          if (state.events)
            state.events.exit?.("ModuleBlock", state, result, eventData);
          return result;
        } else {
          const result = ModuleBlock$0(state) || ModuleBlock$1(state);
          if (state.events)
            state.events.exit?.("ModuleBlock", state, result, eventData);
          return result;
        }
      }
      var NestedModuleItems$0 = $TS($S(PushIndent, $Q(NestedModuleItem), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var items = $2;
        if (items.length)
          return items;
        return $skip;
      });
      function NestedModuleItems(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedModuleItems", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedModuleItems", state, NestedModuleItems$0(state));
          if (state.events)
            state.events.exit?.("NestedModuleItems", state, result, eventData);
          return result;
        } else {
          const result = NestedModuleItems$0(state);
          if (state.events)
            state.events.exit?.("NestedModuleItems", state, result, eventData);
          return result;
        }
      }
      var NestedModuleItem$0 = $S(Nested, ModuleItem, StatementDelimiter);
      function NestedModuleItem(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedModuleItem", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedModuleItem", state, NestedModuleItem$0(state));
          if (state.events)
            state.events.exit?.("NestedModuleItem", state, result, eventData);
          return result;
        } else {
          const result = NestedModuleItem$0(state);
          if (state.events)
            state.events.exit?.("NestedModuleItem", state, result, eventData);
          return result;
        }
      }
      var DeclareBlock$0 = $S(__, OpenBrace, NestedDeclareElements, __, CloseBrace);
      var DeclareBlock$1 = $S(__, OpenBrace, $Q($S(__, DeclareElement, InterfacePropertyDelimiter)), __, CloseBrace);
      var DeclareBlock$2 = $S(InsertOpenBrace, NestedDeclareElements, InsertNewline, InsertIndent, InsertCloseBrace);
      function DeclareBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DeclareBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DeclareBlock", state, DeclareBlock$0(state) || DeclareBlock$1(state) || DeclareBlock$2(state));
          if (state.events)
            state.events.exit?.("DeclareBlock", state, result, eventData);
          return result;
        } else {
          const result = DeclareBlock$0(state) || DeclareBlock$1(state) || DeclareBlock$2(state);
          if (state.events)
            state.events.exit?.("DeclareBlock", state, result, eventData);
          return result;
        }
      }
      var NestedDeclareElements$0 = $TS($S(PushIndent, $Q(NestedDeclareElement), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var decs = $2;
        if (decs.length)
          return decs;
        return $skip;
      });
      function NestedDeclareElements(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedDeclareElements", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedDeclareElements", state, NestedDeclareElements$0(state));
          if (state.events)
            state.events.exit?.("NestedDeclareElements", state, result, eventData);
          return result;
        } else {
          const result = NestedDeclareElements$0(state);
          if (state.events)
            state.events.exit?.("NestedDeclareElements", state, result, eventData);
          return result;
        }
      }
      var NestedDeclareElement$0 = $S(Nested, DeclareElement, InterfacePropertyDelimiter);
      function NestedDeclareElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedDeclareElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedDeclareElement", state, NestedDeclareElement$0(state));
          if (state.events)
            state.events.exit?.("NestedDeclareElement", state, result, eventData);
          return result;
        } else {
          const result = NestedDeclareElement$0(state);
          if (state.events)
            state.events.exit?.("NestedDeclareElement", state, result, eventData);
          return result;
        }
      }
      var DeclareElement$0 = $T($S($E(Decorators), $E($S(Export, $E(_))), TypeLexicalDeclaration), function(value) {
        return { "ts": true, "children": value };
      });
      var DeclareElement$1 = $T($S($E($S(Export, $E(_))), TypeDeclarationRest), function(value) {
        return { "ts": true, "children": value };
      });
      function DeclareElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DeclareElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DeclareElement", state, DeclareElement$0(state) || DeclareElement$1(state));
          if (state.events)
            state.events.exit?.("DeclareElement", state, result, eventData);
          return result;
        } else {
          const result = DeclareElement$0(state) || DeclareElement$1(state);
          if (state.events)
            state.events.exit?.("DeclareElement", state, result, eventData);
          return result;
        }
      }
      var EnumDeclaration$0 = $TS($S($E($S(Const, _)), Enum, $E(_), IdentifierName, EnumBlock), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var isConst = $1;
        var id = $4;
        var block = $5;
        const ts = {
          ts: true,
          children: $0
        };
        if (isConst)
          return ts;
        const names = new Set(block.properties.map((p) => p.name.name));
        return [
          ts,
          {
            js: true,
            children: [
              ["let ", id, " = {};\n"],
              ...block.properties.map((property, i) => {
                let init, isString;
                if (property.init) {
                  init = replaceNodes(
                    deepCopy(property.init),
                    (n) => n.type === "Identifier" && names.has(n.name),
                    (n) => [id, '["', n.name, '"]']
                  );
                  const value = init[init.length - 1];
                  isString = value.type === "TemplateLiteral" || value.type === "Literal" && value.subtype === "StringLiteral";
                } else {
                  init = i === 0 ? " = 0" : [" = ", id, '["', block.properties[i - 1].name, '"] + 1'];
                }
                if (isString) {
                  return [
                    id,
                    '["',
                    property.name,
                    '"]',
                    init,
                    ";\n"
                  ];
                } else {
                  return [
                    id,
                    "[",
                    id,
                    '["',
                    property.name,
                    '"]',
                    init,
                    '] = "',
                    property.name,
                    '";\n'
                  ];
                }
              })
            ]
          }
        ];
      });
      function EnumDeclaration(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EnumDeclaration", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EnumDeclaration", state, EnumDeclaration$0(state));
          if (state.events)
            state.events.exit?.("EnumDeclaration", state, result, eventData);
          return result;
        } else {
          const result = EnumDeclaration$0(state);
          if (state.events)
            state.events.exit?.("EnumDeclaration", state, result, eventData);
          return result;
        }
      }
      var EnumBlock$0 = $TS($S(__, OpenBrace, NestedEnumProperties, __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var props = $3;
        return {
          properties: props.properties,
          children: $0
        };
      });
      var EnumBlock$1 = $TS($S(__, OpenBrace, $Q($S(__, EnumProperty)), __, CloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var props = $3;
        return {
          properties: props.map((p) => p[1]),
          children: $0
        };
      });
      var EnumBlock$2 = $TS($S(InsertOpenBrace, NestedEnumProperties, InsertNewline, InsertIndent, InsertCloseBrace), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var props = $2;
        return {
          properties: props.properties,
          children: $0
        };
      });
      function EnumBlock(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EnumBlock", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EnumBlock", state, EnumBlock$0(state) || EnumBlock$1(state) || EnumBlock$2(state));
          if (state.events)
            state.events.exit?.("EnumBlock", state, result, eventData);
          return result;
        } else {
          const result = EnumBlock$0(state) || EnumBlock$1(state) || EnumBlock$2(state);
          if (state.events)
            state.events.exit?.("EnumBlock", state, result, eventData);
          return result;
        }
      }
      var NestedEnumProperties$0 = $TS($S(PushIndent, $Q(NestedEnumProperty), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var props = $2;
        if (!props.length)
          return $skip;
        return {
          properties: props.map((p) => p.property),
          children: $0
        };
      });
      function NestedEnumProperties(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedEnumProperties", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedEnumProperties", state, NestedEnumProperties$0(state));
          if (state.events)
            state.events.exit?.("NestedEnumProperties", state, result, eventData);
          return result;
        } else {
          const result = NestedEnumProperties$0(state);
          if (state.events)
            state.events.exit?.("NestedEnumProperties", state, result, eventData);
          return result;
        }
      }
      var NestedEnumProperty$0 = $TS($S(Nested, EnumProperty), function($skip, $loc, $0, $1, $2) {
        return {
          property: $2,
          children: $0
        };
      });
      function NestedEnumProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedEnumProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedEnumProperty", state, NestedEnumProperty$0(state));
          if (state.events)
            state.events.exit?.("NestedEnumProperty", state, result, eventData);
          return result;
        } else {
          const result = NestedEnumProperty$0(state);
          if (state.events)
            state.events.exit?.("NestedEnumProperty", state, result, eventData);
          return result;
        }
      }
      var EnumProperty$0 = $TS($S(Identifier, $E($S(__, Equals, ExtendedExpression)), ObjectPropertyDelimiter), function($skip, $loc, $0, $1, $2, $3) {
        var name = $1;
        var init = $2;
        return {
          type: "EnumProperty",
          name,
          init,
          children: $0
        };
      });
      function EnumProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EnumProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EnumProperty", state, EnumProperty$0(state));
          if (state.events)
            state.events.exit?.("EnumProperty", state, result, eventData);
          return result;
        } else {
          const result = EnumProperty$0(state);
          if (state.events)
            state.events.exit?.("EnumProperty", state, result, eventData);
          return result;
        }
      }
      var TypeProperty$0 = $S($E($S(Readonly, NotDedented)), PropertyName);
      function TypeProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeProperty", state, TypeProperty$0(state));
          if (state.events)
            state.events.exit?.("TypeProperty", state, result, eventData);
          return result;
        } else {
          const result = TypeProperty$0(state);
          if (state.events)
            state.events.exit?.("TypeProperty", state, result, eventData);
          return result;
        }
      }
      var TypeIndexSignature$0 = $S($E($S($R$0($EXPECT($R58, fail, "TypeIndexSignature /[+-]?/")), Readonly, NotDedented)), OpenBracket, TypeIndex, CloseBracket, $E($S(__, $R$0($EXPECT($R59, fail, "TypeIndexSignature /[+-]/")), $Y($S($E(_), QuestionMark)))));
      function TypeIndexSignature(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeIndexSignature", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeIndexSignature", state, TypeIndexSignature$0(state));
          if (state.events)
            state.events.exit?.("TypeIndexSignature", state, result, eventData);
          return result;
        } else {
          const result = TypeIndexSignature$0(state);
          if (state.events)
            state.events.exit?.("TypeIndexSignature", state, result, eventData);
          return result;
        }
      }
      var TypeIndex$0 = $S(__, Identifier, TypeSuffix);
      var TypeIndex$1 = $S(__, PropertyName, __, In, Type, $E($S(__, As, Type)));
      function TypeIndex(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeIndex", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeIndex", state, TypeIndex$0(state) || TypeIndex$1(state));
          if (state.events)
            state.events.exit?.("TypeIndex", state, result, eventData);
          return result;
        } else {
          const result = TypeIndex$0(state) || TypeIndex$1(state);
          if (state.events)
            state.events.exit?.("TypeIndex", state, result, eventData);
          return result;
        }
      }
      var TypeSuffix$0 = $T($S($E(QuestionMark), $E(_), Colon, Type), function(value) {
        return { "type": "TypeSuffix", "ts": true, "children": value };
      });
      var TypeSuffix$1 = $T($S(QuestionMark, $E(_)), function(value) {
        return { "type": "TypeSuffix", "ts": true, "children": value };
      });
      var TypeSuffix$2 = $T($S(NonNullAssertion, $E(_), $E($S(Colon, Type))), function(value) {
        return { "type": "TypeSuffix", "ts": true, "children": value };
      });
      function TypeSuffix(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeSuffix", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeSuffix", state, TypeSuffix$0(state) || TypeSuffix$1(state) || TypeSuffix$2(state));
          if (state.events)
            state.events.exit?.("TypeSuffix", state, result, eventData);
          return result;
        } else {
          const result = TypeSuffix$0(state) || TypeSuffix$1(state) || TypeSuffix$2(state);
          if (state.events)
            state.events.exit?.("TypeSuffix", state, result, eventData);
          return result;
        }
      }
      var ReturnTypeSuffix$0 = $TS($S($E(_), Colon, $E($S(__, $EXPECT($L202, fail, 'ReturnTypeSuffix "asserts"'), NonIdContinue)), TypePredicate), function($skip, $loc, $0, $1, $2, $3, $4) {
        var asserts = $3;
        var t = $4;
        if (asserts) {
          t = {
            type: "AssertsType",
            t,
            children: [asserts[0], asserts[1], t]
          };
        }
        return {
          type: "ReturnTypeAnnotation",
          children: [$1, $2, t],
          t,
          ts: true
        };
      });
      function ReturnTypeSuffix(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ReturnTypeSuffix", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ReturnTypeSuffix", state, ReturnTypeSuffix$0(state));
          if (state.events)
            state.events.exit?.("ReturnTypeSuffix", state, result, eventData);
          return result;
        } else {
          const result = ReturnTypeSuffix$0(state);
          if (state.events)
            state.events.exit?.("ReturnTypeSuffix", state, result, eventData);
          return result;
        }
      }
      var TypePredicate$0 = $TS($S(Type, $E($S(__, $EXPECT($L150, fail, 'TypePredicate "is"'), NonIdContinue, Type))), function($skip, $loc, $0, $1, $2) {
        var lhs = $1;
        var rhs = $2;
        if (!rhs)
          return lhs;
        return {
          type: "TypePredicate",
          lhs,
          rhs: rhs[3],
          children: [lhs, ...rhs]
        };
      });
      function TypePredicate(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypePredicate", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypePredicate", state, TypePredicate$0(state));
          if (state.events)
            state.events.exit?.("TypePredicate", state, result, eventData);
          return result;
        } else {
          const result = TypePredicate$0(state);
          if (state.events)
            state.events.exit?.("TypePredicate", state, result, eventData);
          return result;
        }
      }
      var Type$0 = TypeConditional;
      function Type(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Type", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Type", state, Type$0(state));
          if (state.events)
            state.events.exit?.("Type", state, result, eventData);
          return result;
        } else {
          const result = Type$0(state);
          if (state.events)
            state.events.exit?.("Type", state, result, eventData);
          return result;
        }
      }
      var TypeBinary$0 = $TS($S($E($S(__, TypeBinaryOp, __)), TypeUnary, $Q($S(__, TypeBinaryOp, __, TypeUnary))), function($skip, $loc, $0, $1, $2, $3) {
        var optionalPrefix = $1;
        var t = $2;
        var ops = $3;
        if (!ops.length && !optionalPrefix)
          return t;
        if (!ops.length)
          return [optionalPrefix, t];
        if (!optionalPrefix)
          return [t, ...ops];
        return [optionalPrefix, t, ops];
      });
      function TypeBinary(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeBinary", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeBinary", state, TypeBinary$0(state));
          if (state.events)
            state.events.exit?.("TypeBinary", state, result, eventData);
          return result;
        } else {
          const result = TypeBinary$0(state);
          if (state.events)
            state.events.exit?.("TypeBinary", state, result, eventData);
          return result;
        }
      }
      var TypeUnary$0 = $TS($S($Q($S(__, TypeUnaryOp, NonIdContinue)), TypePrimary, $Q(TypeUnarySuffix)), function($skip, $loc, $0, $1, $2, $3) {
        if (!$1.length && !$3.length)
          return $2;
        return [...$1, $2, ...$3];
      });
      function TypeUnary(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeUnary", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeUnary", state, TypeUnary$0(state));
          if (state.events)
            state.events.exit?.("TypeUnary", state, result, eventData);
          return result;
        } else {
          const result = TypeUnary$0(state);
          if (state.events)
            state.events.exit?.("TypeUnary", state, result, eventData);
          return result;
        }
      }
      var TypeUnarySuffix$0 = TypeIndexedAccess;
      var TypeUnarySuffix$1 = QuestionMark;
      function TypeUnarySuffix(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeUnarySuffix", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeUnarySuffix", state, TypeUnarySuffix$0(state) || TypeUnarySuffix$1(state));
          if (state.events)
            state.events.exit?.("TypeUnarySuffix", state, result, eventData);
          return result;
        } else {
          const result = TypeUnarySuffix$0(state) || TypeUnarySuffix$1(state);
          if (state.events)
            state.events.exit?.("TypeUnarySuffix", state, result, eventData);
          return result;
        }
      }
      var TypeUnaryOp$0 = $S($EXPECT($L203, fail, 'TypeUnaryOp "keyof"'), NonIdContinue);
      var TypeUnaryOp$1 = $S($EXPECT($L182, fail, 'TypeUnaryOp "typeof"'), NonIdContinue);
      var TypeUnaryOp$2 = $S($EXPECT($L204, fail, 'TypeUnaryOp "infer"'), NonIdContinue);
      var TypeUnaryOp$3 = $S($EXPECT($L166, fail, 'TypeUnaryOp "readonly"'), NonIdContinue);
      function TypeUnaryOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeUnaryOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeUnaryOp", state, TypeUnaryOp$0(state) || TypeUnaryOp$1(state) || TypeUnaryOp$2(state) || TypeUnaryOp$3(state));
          if (state.events)
            state.events.exit?.("TypeUnaryOp", state, result, eventData);
          return result;
        } else {
          const result = TypeUnaryOp$0(state) || TypeUnaryOp$1(state) || TypeUnaryOp$2(state) || TypeUnaryOp$3(state);
          if (state.events)
            state.events.exit?.("TypeUnaryOp", state, result, eventData);
          return result;
        }
      }
      var TypeIndexedAccess$0 = $S(OpenBracket, $E(Type), __, CloseBracket);
      function TypeIndexedAccess(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeIndexedAccess", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeIndexedAccess", state, TypeIndexedAccess$0(state));
          if (state.events)
            state.events.exit?.("TypeIndexedAccess", state, result, eventData);
          return result;
        } else {
          const result = TypeIndexedAccess$0(state);
          if (state.events)
            state.events.exit?.("TypeIndexedAccess", state, result, eventData);
          return result;
        }
      }
      var TypePrimary$0 = InterfaceBlock;
      var TypePrimary$1 = $S($E(_), FunctionType);
      var TypePrimary$2 = $S($E(_), InlineInterfaceLiteral);
      var TypePrimary$3 = $S($E(_), TypeTuple);
      var TypePrimary$4 = $S($E(_), ImportType);
      var TypePrimary$5 = $TS($S($E(_), TypeLiteral), function($skip, $loc, $0, $1, $2) {
        var t = $2;
        return {
          type: "LiteralType",
          t,
          children: $0
        };
      });
      var TypePrimary$6 = $TS($S($E(_), IdentifierName, $Q($S(Dot, IdentifierName)), $E(TypeArguments)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var args = $4;
        return {
          type: "IdentifierType",
          children: $0,
          raw: [$2.name, ...$3.map(([dot, id]) => dot.token + id.name)].join(""),
          args
        };
      });
      var TypePrimary$7 = $S(__, OpenParen, $C(Type, $S(EOS, Type)), __, CloseParen);
      function TypePrimary(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypePrimary", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypePrimary", state, TypePrimary$0(state) || TypePrimary$1(state) || TypePrimary$2(state) || TypePrimary$3(state) || TypePrimary$4(state) || TypePrimary$5(state) || TypePrimary$6(state) || TypePrimary$7(state));
          if (state.events)
            state.events.exit?.("TypePrimary", state, result, eventData);
          return result;
        } else {
          const result = TypePrimary$0(state) || TypePrimary$1(state) || TypePrimary$2(state) || TypePrimary$3(state) || TypePrimary$4(state) || TypePrimary$5(state) || TypePrimary$6(state) || TypePrimary$7(state);
          if (state.events)
            state.events.exit?.("TypePrimary", state, result, eventData);
          return result;
        }
      }
      var ImportType$0 = $S($EXPECT($L16, fail, 'ImportType "import"'), OpenParen, __, StringLiteral, __, CloseParen, $E($S(Dot, IdentifierName)), $E(TypeArguments));
      var ImportType$1 = $S($EXPECT($L16, fail, 'ImportType "import"'), InsertOpenParen, Trimmed_, StringLiteral, InsertCloseParen);
      function ImportType(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ImportType", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ImportType", state, ImportType$0(state) || ImportType$1(state));
          if (state.events)
            state.events.exit?.("ImportType", state, result, eventData);
          return result;
        } else {
          const result = ImportType$0(state) || ImportType$1(state);
          if (state.events)
            state.events.exit?.("ImportType", state, result, eventData);
          return result;
        }
      }
      var TypeTuple$0 = $S(OpenBracket, NestedTypeList, __, CloseBracket);
      var TypeTuple$1 = $S(OpenBracket, $E(TypeList), __, CloseBracket);
      function TypeTuple(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeTuple", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeTuple", state, TypeTuple$0(state) || TypeTuple$1(state));
          if (state.events)
            state.events.exit?.("TypeTuple", state, result, eventData);
          return result;
        } else {
          const result = TypeTuple$0(state) || TypeTuple$1(state);
          if (state.events)
            state.events.exit?.("TypeTuple", state, result, eventData);
          return result;
        }
      }
      var TypeList$0 = $S(TypeElement, $Q($S(__, Comma, TypeElement)));
      function TypeList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeList", state, TypeList$0(state));
          if (state.events)
            state.events.exit?.("TypeList", state, result, eventData);
          return result;
        } else {
          const result = TypeList$0(state);
          if (state.events)
            state.events.exit?.("TypeList", state, result, eventData);
          return result;
        }
      }
      var TypeElement$0 = $S($S(__, DotDotDot, __), Type);
      var TypeElement$1 = $TS($S(Type, $E($S($E(_), DotDotDot))), function($skip, $loc, $0, $1, $2) {
        var type = $1;
        var dots = $2;
        if (!dots)
          return type;
        const ws = getTrimmingSpace(type);
        if (!ws)
          return [dots[1], dots[0], type];
        return [ws, dots[1], dots[0], insertTrimmingSpace(type, "")];
      });
      function TypeElement(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeElement", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeElement", state, TypeElement$0(state) || TypeElement$1(state));
          if (state.events)
            state.events.exit?.("TypeElement", state, result, eventData);
          return result;
        } else {
          const result = TypeElement$0(state) || TypeElement$1(state);
          if (state.events)
            state.events.exit?.("TypeElement", state, result, eventData);
          return result;
        }
      }
      var NestedTypeList$0 = $TS($S(PushIndent, $Q(NestedType), PopIndent), function($skip, $loc, $0, $1, $2, $3) {
        var types = $2;
        if (types.length)
          return types;
        return $skip;
      });
      function NestedTypeList(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedTypeList", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedTypeList", state, NestedTypeList$0(state));
          if (state.events)
            state.events.exit?.("NestedTypeList", state, result, eventData);
          return result;
        } else {
          const result = NestedTypeList$0(state);
          if (state.events)
            state.events.exit?.("NestedTypeList", state, result, eventData);
          return result;
        }
      }
      var NestedType$0 = $S(Nested, Type, ArrayElementDelimiter);
      function NestedType(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NestedType", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NestedType", state, NestedType$0(state));
          if (state.events)
            state.events.exit?.("NestedType", state, result, eventData);
          return result;
        } else {
          const result = NestedType$0(state);
          if (state.events)
            state.events.exit?.("NestedType", state, result, eventData);
          return result;
        }
      }
      var TypeConditional$0 = $TS($S(TypeBinary, $E($S(__, $EXPECT($L139, fail, 'TypeConditional "extends"'), NonIdContinue, Type, $E($S(__, QuestionMark, Type, __, Colon, Type))))), function($skip, $loc, $0, $1, $2) {
        if ($2)
          return $0;
        return $1;
      });
      function TypeConditional(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeConditional", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeConditional", state, TypeConditional$0(state));
          if (state.events)
            state.events.exit?.("TypeConditional", state, result, eventData);
          return result;
        } else {
          const result = TypeConditional$0(state);
          if (state.events)
            state.events.exit?.("TypeConditional", state, result, eventData);
          return result;
        }
      }
      var TypeTemplateSubstitution$0 = $S(SubstitutionStart, Type, __, CloseBrace);
      function TypeTemplateSubstitution(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeTemplateSubstitution", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeTemplateSubstitution", state, TypeTemplateSubstitution$0(state));
          if (state.events)
            state.events.exit?.("TypeTemplateSubstitution", state, result, eventData);
          return result;
        } else {
          const result = TypeTemplateSubstitution$0(state);
          if (state.events)
            state.events.exit?.("TypeTemplateSubstitution", state, result, eventData);
          return result;
        }
      }
      var TypeTemplateLiteral$0 = $TS($S(Backtick, $Q($C(TemplateCharacters, TypeTemplateSubstitution)), Backtick), function($skip, $loc, $0, $1, $2, $3) {
        return {
          type: "TemplateLiteral",
          children: $0
        };
      });
      var TypeTemplateLiteral$1 = CoffeeInterpolatedDoubleQuotedTypeLiteral;
      function TypeTemplateLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeTemplateLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeTemplateLiteral", state, TypeTemplateLiteral$0(state) || TypeTemplateLiteral$1(state));
          if (state.events)
            state.events.exit?.("TypeTemplateLiteral", state, result, eventData);
          return result;
        } else {
          const result = TypeTemplateLiteral$0(state) || TypeTemplateLiteral$1(state);
          if (state.events)
            state.events.exit?.("TypeTemplateLiteral", state, result, eventData);
          return result;
        }
      }
      var CoffeeStringTypeSubstitution$0 = $S(CoffeeSubstitutionStart, Type, __, CloseBrace);
      function CoffeeStringTypeSubstitution(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeStringTypeSubstitution", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeStringTypeSubstitution", state, CoffeeStringTypeSubstitution$0(state));
          if (state.events)
            state.events.exit?.("CoffeeStringTypeSubstitution", state, result, eventData);
          return result;
        } else {
          const result = CoffeeStringTypeSubstitution$0(state);
          if (state.events)
            state.events.exit?.("CoffeeStringTypeSubstitution", state, result, eventData);
          return result;
        }
      }
      var CoffeeInterpolatedDoubleQuotedTypeLiteral$0 = $TS($S(CoffeeInterpolationEnabled, DoubleQuote, $Q($C(CoffeeDoubleQuotedStringCharacters, CoffeeStringTypeSubstitution)), DoubleQuote), function($skip, $loc, $0, $1, $2, $3, $4) {
        var s = $2;
        var parts = $3;
        var e = $4;
        return processCoffeeInterpolation(s, parts, e, $loc);
      });
      function CoffeeInterpolatedDoubleQuotedTypeLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeInterpolatedDoubleQuotedTypeLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeInterpolatedDoubleQuotedTypeLiteral", state, CoffeeInterpolatedDoubleQuotedTypeLiteral$0(state));
          if (state.events)
            state.events.exit?.("CoffeeInterpolatedDoubleQuotedTypeLiteral", state, result, eventData);
          return result;
        } else {
          const result = CoffeeInterpolatedDoubleQuotedTypeLiteral$0(state);
          if (state.events)
            state.events.exit?.("CoffeeInterpolatedDoubleQuotedTypeLiteral", state, result, eventData);
          return result;
        }
      }
      var TypeLiteral$0 = TypeTemplateLiteral;
      var TypeLiteral$1 = Literal;
      var TypeLiteral$2 = $TS($S($EXPECT($L186, fail, 'TypeLiteral "void"'), NonIdContinue), function($skip, $loc, $0, $1, $2) {
        return { type: "VoidType", $loc, token: $1 };
      });
      var TypeLiteral$3 = $TV($EXPECT($L205, fail, 'TypeLiteral "[]"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "[]" };
      });
      function TypeLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeLiteral", state, TypeLiteral$0(state) || TypeLiteral$1(state) || TypeLiteral$2(state) || TypeLiteral$3(state));
          if (state.events)
            state.events.exit?.("TypeLiteral", state, result, eventData);
          return result;
        } else {
          const result = TypeLiteral$0(state) || TypeLiteral$1(state) || TypeLiteral$2(state) || TypeLiteral$3(state);
          if (state.events)
            state.events.exit?.("TypeLiteral", state, result, eventData);
          return result;
        }
      }
      var InlineInterfaceLiteral$0 = $S(InsertInlineOpenBrace, InlineBasicInterfaceProperty, $Q($S($C(IndentedFurther, $E(_)), InlineBasicInterfaceProperty)), InsertCloseBrace);
      function InlineInterfaceLiteral(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineInterfaceLiteral", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineInterfaceLiteral", state, InlineInterfaceLiteral$0(state));
          if (state.events)
            state.events.exit?.("InlineInterfaceLiteral", state, result, eventData);
          return result;
        } else {
          const result = InlineInterfaceLiteral$0(state);
          if (state.events)
            state.events.exit?.("InlineInterfaceLiteral", state, result, eventData);
          return result;
        }
      }
      var InlineBasicInterfaceProperty$0 = $S($C(TypeIndexSignature, TypeProperty), $E(QuestionMark), Colon, Type, InlineInterfacePropertyDelimiter);
      function InlineBasicInterfaceProperty(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineBasicInterfaceProperty", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineBasicInterfaceProperty", state, InlineBasicInterfaceProperty$0(state));
          if (state.events)
            state.events.exit?.("InlineBasicInterfaceProperty", state, result, eventData);
          return result;
        } else {
          const result = InlineBasicInterfaceProperty$0(state);
          if (state.events)
            state.events.exit?.("InlineBasicInterfaceProperty", state, result, eventData);
          return result;
        }
      }
      var InlineInterfacePropertyDelimiter$0 = $C($S($E(_), Semicolon), CommaDelimiter);
      var InlineInterfacePropertyDelimiter$1 = $T($S($Y($S($C(IndentedFurther, $E(_)), InlineBasicInterfaceProperty)), InsertComma), function(value) {
        return value[1];
      });
      var InlineInterfacePropertyDelimiter$2 = $Y($S(__, $C($EXPECT($L11, fail, 'InlineInterfacePropertyDelimiter ":"'), $EXPECT($L125, fail, 'InlineInterfacePropertyDelimiter ")"'), $EXPECT($L34, fail, 'InlineInterfacePropertyDelimiter "]"'), $EXPECT($L25, fail, 'InlineInterfacePropertyDelimiter "}"'))));
      var InlineInterfacePropertyDelimiter$3 = $Y(EOS);
      function InlineInterfacePropertyDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InlineInterfacePropertyDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InlineInterfacePropertyDelimiter", state, InlineInterfacePropertyDelimiter$0(state) || InlineInterfacePropertyDelimiter$1(state) || InlineInterfacePropertyDelimiter$2(state) || InlineInterfacePropertyDelimiter$3(state));
          if (state.events)
            state.events.exit?.("InlineInterfacePropertyDelimiter", state, result, eventData);
          return result;
        } else {
          const result = InlineInterfacePropertyDelimiter$0(state) || InlineInterfacePropertyDelimiter$1(state) || InlineInterfacePropertyDelimiter$2(state) || InlineInterfacePropertyDelimiter$3(state);
          if (state.events)
            state.events.exit?.("InlineInterfacePropertyDelimiter", state, result, eventData);
          return result;
        }
      }
      var TypeBinaryOp$0 = $TV($EXPECT($L99, fail, 'TypeBinaryOp "|"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "|" };
      });
      var TypeBinaryOp$1 = $TV($EXPECT($L98, fail, 'TypeBinaryOp "&"'), function($skip, $loc, $0, $1) {
        return { $loc, token: "&" };
      });
      function TypeBinaryOp(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeBinaryOp", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeBinaryOp", state, TypeBinaryOp$0(state) || TypeBinaryOp$1(state));
          if (state.events)
            state.events.exit?.("TypeBinaryOp", state, result, eventData);
          return result;
        } else {
          const result = TypeBinaryOp$0(state) || TypeBinaryOp$1(state);
          if (state.events)
            state.events.exit?.("TypeBinaryOp", state, result, eventData);
          return result;
        }
      }
      var FunctionType$0 = $TS($S(Parameters, __, TypeArrowFunction, $E(Type)), function($skip, $loc, $0, $1, $2, $3, $4) {
        var type = $4;
        if (type) {
          return $0;
        }
        return [...$0, "void"];
      });
      function FunctionType(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("FunctionType", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("FunctionType", state, FunctionType$0(state));
          if (state.events)
            state.events.exit?.("FunctionType", state, result, eventData);
          return result;
        } else {
          const result = FunctionType$0(state);
          if (state.events)
            state.events.exit?.("FunctionType", state, result, eventData);
          return result;
        }
      }
      var TypeArrowFunction$0 = $TV($C($EXPECT($L8, fail, 'TypeArrowFunction "=>"'), $EXPECT($L9, fail, 'TypeArrowFunction "\u21D2"'), $EXPECT($L23, fail, 'TypeArrowFunction "->"'), $EXPECT($L24, fail, 'TypeArrowFunction "\u2192"')), function($skip, $loc, $0, $1) {
        return { $loc, token: "=>" };
      });
      function TypeArrowFunction(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeArrowFunction", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeArrowFunction", state, TypeArrowFunction$0(state));
          if (state.events)
            state.events.exit?.("TypeArrowFunction", state, result, eventData);
          return result;
        } else {
          const result = TypeArrowFunction$0(state);
          if (state.events)
            state.events.exit?.("TypeArrowFunction", state, result, eventData);
          return result;
        }
      }
      var TypeArguments$0 = $TS($S($EXPECT($L154, fail, 'TypeArguments "<"'), $P(TypeArgument), __, $EXPECT($L33, fail, 'TypeArguments ">"')), function($skip, $loc, $0, $1, $2, $3, $4) {
        return { ts: true, children: $0 };
      });
      function TypeArguments(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeArguments", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeArguments", state, TypeArguments$0(state));
          if (state.events)
            state.events.exit?.("TypeArguments", state, result, eventData);
          return result;
        } else {
          const result = TypeArguments$0(state);
          if (state.events)
            state.events.exit?.("TypeArguments", state, result, eventData);
          return result;
        }
      }
      var TypeArgument$0 = $S(__, Type, TypeArgumentDelimiter);
      function TypeArgument(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeArgument", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeArgument", state, TypeArgument$0(state));
          if (state.events)
            state.events.exit?.("TypeArgument", state, result, eventData);
          return result;
        } else {
          const result = TypeArgument$0(state);
          if (state.events)
            state.events.exit?.("TypeArgument", state, result, eventData);
          return result;
        }
      }
      var TypeArgumentDelimiter$0 = TypeParameterDelimiter;
      function TypeArgumentDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeArgumentDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeArgumentDelimiter", state, TypeArgumentDelimiter$0(state));
          if (state.events)
            state.events.exit?.("TypeArgumentDelimiter", state, result, eventData);
          return result;
        } else {
          const result = TypeArgumentDelimiter$0(state);
          if (state.events)
            state.events.exit?.("TypeArgumentDelimiter", state, result, eventData);
          return result;
        }
      }
      var TypeParameters$0 = $TS($S($E(_), $EXPECT($L154, fail, 'TypeParameters "<"'), $P(TypeParameter), __, $EXPECT($L33, fail, 'TypeParameters ">"')), function($skip, $loc, $0, $1, $2, $3, $4, $5) {
        var parameters = $3;
        return {
          type: "TypeParameters",
          parameters,
          ts: true,
          children: $0
        };
      });
      function TypeParameters(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeParameters", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeParameters", state, TypeParameters$0(state));
          if (state.events)
            state.events.exit?.("TypeParameters", state, result, eventData);
          return result;
        } else {
          const result = TypeParameters$0(state);
          if (state.events)
            state.events.exit?.("TypeParameters", state, result, eventData);
          return result;
        }
      }
      var TypeParameter$0 = $S(__, $E($S($EXPECT($L149, fail, 'TypeParameter "const"'), $E(_))), Identifier, $E(TypeConstraint), $E(TypeInitializer), TypeParameterDelimiter);
      function TypeParameter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeParameter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeParameter", state, TypeParameter$0(state));
          if (state.events)
            state.events.exit?.("TypeParameter", state, result, eventData);
          return result;
        } else {
          const result = TypeParameter$0(state);
          if (state.events)
            state.events.exit?.("TypeParameter", state, result, eventData);
          return result;
        }
      }
      var TypeConstraint$0 = $S(__, $EXPECT($L139, fail, 'TypeConstraint "extends"'), NonIdContinue, Type);
      function TypeConstraint(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeConstraint", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeConstraint", state, TypeConstraint$0(state));
          if (state.events)
            state.events.exit?.("TypeConstraint", state, result, eventData);
          return result;
        } else {
          const result = TypeConstraint$0(state);
          if (state.events)
            state.events.exit?.("TypeConstraint", state, result, eventData);
          return result;
        }
      }
      var TypeInitializer$0 = $S(__, $EXPECT($L2, fail, 'TypeInitializer "="'), Type);
      function TypeInitializer(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeInitializer", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeInitializer", state, TypeInitializer$0(state));
          if (state.events)
            state.events.exit?.("TypeInitializer", state, result, eventData);
          return result;
        } else {
          const result = TypeInitializer$0(state);
          if (state.events)
            state.events.exit?.("TypeInitializer", state, result, eventData);
          return result;
        }
      }
      var TypeParameterDelimiter$0 = $S($Q(_), Comma);
      var TypeParameterDelimiter$1 = $Y($S(__, $EXPECT($L33, fail, 'TypeParameterDelimiter ">"')));
      var TypeParameterDelimiter$2 = $T($S($Y(EOS), InsertComma), function(value) {
        return value[1];
      });
      function TypeParameterDelimiter(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TypeParameterDelimiter", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TypeParameterDelimiter", state, TypeParameterDelimiter$0(state) || TypeParameterDelimiter$1(state) || TypeParameterDelimiter$2(state));
          if (state.events)
            state.events.exit?.("TypeParameterDelimiter", state, result, eventData);
          return result;
        } else {
          const result = TypeParameterDelimiter$0(state) || TypeParameterDelimiter$1(state) || TypeParameterDelimiter$2(state);
          if (state.events)
            state.events.exit?.("TypeParameterDelimiter", state, result, eventData);
          return result;
        }
      }
      var ThisType$0 = $T($S($C(This, AtThis), Colon, Type, ParameterElementDelimiter), function(value) {
        return { "type": "ThisType", "ts": true, "children": value };
      });
      function ThisType(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ThisType", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ThisType", state, ThisType$0(state));
          if (state.events)
            state.events.exit?.("ThisType", state, result, eventData);
          return result;
        } else {
          const result = ThisType$0(state);
          if (state.events)
            state.events.exit?.("ThisType", state, result, eventData);
          return result;
        }
      }
      var Shebang$0 = $S($R$0($EXPECT($R60, fail, "Shebang /#![^\\r\\n]*/")), EOL);
      function Shebang(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Shebang", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Shebang", state, Shebang$0(state));
          if (state.events)
            state.events.exit?.("Shebang", state, result, eventData);
          return result;
        } else {
          const result = Shebang$0(state);
          if (state.events)
            state.events.exit?.("Shebang", state, result, eventData);
          return result;
        }
      }
      var CivetPrologue$0 = $T($S($EXPECT($R61, fail, "CivetPrologue /[\\t ]*/"), DoubleQuote, CivetPrologueContent, DoubleQuote, $TEXT(SimpleStatementDelimiter), $E(EOS)), function(value) {
        var content = value[2];
        return content;
      });
      var CivetPrologue$1 = $T($S($EXPECT($R61, fail, "CivetPrologue /[\\t ]*/"), SingleQuote, CivetPrologueContent, SingleQuote, $TEXT(SimpleStatementDelimiter), $E(EOS)), function(value) {
        var content = value[2];
        return content;
      });
      function CivetPrologue(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CivetPrologue", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CivetPrologue", state, CivetPrologue$0(state) || CivetPrologue$1(state));
          if (state.events)
            state.events.exit?.("CivetPrologue", state, result, eventData);
          return result;
        } else {
          const result = CivetPrologue$0(state) || CivetPrologue$1(state);
          if (state.events)
            state.events.exit?.("CivetPrologue", state, result, eventData);
          return result;
        }
      }
      var CivetPrologueContent$0 = $TS($S($EXPECT($L206, fail, 'CivetPrologueContent "civet"'), NonIdContinue, $Q(CivetOption), $EXPECT($R62, fail, "CivetPrologueContent /[\\s]*/")), function($skip, $loc, $0, $1, $2, $3, $4) {
        var options = $3;
        return {
          type: "CivetPrologue",
          children: [],
          config: Object.fromEntries(options)
        };
      });
      function CivetPrologueContent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CivetPrologueContent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CivetPrologueContent", state, CivetPrologueContent$0(state));
          if (state.events)
            state.events.exit?.("CivetPrologueContent", state, result, eventData);
          return result;
        } else {
          const result = CivetPrologueContent$0(state);
          if (state.events)
            state.events.exit?.("CivetPrologueContent", state, result, eventData);
          return result;
        }
      }
      var CivetOption$0 = $TR($EXPECT($R63, fail, "CivetOption /\\s+([+-]?)([a-zA-Z0-9-]+)(\\s*=\\s*([a-zA-Z0-9.+-]*))?/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        const optionName = $2.replace(/-+([a-z]?)/g, (_2, l) => {
          if (l)
            return l.toUpperCase();
          return "";
        });
        let value = $3 ? $4 : $1 === "-" ? false : true;
        if (optionName === "tab") {
          value = parseFloat(value);
          if (isNaN(value))
            value = 0;
        }
        return [optionName, value];
      });
      function CivetOption(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CivetOption", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CivetOption", state, CivetOption$0(state));
          if (state.events)
            state.events.exit?.("CivetOption", state, result, eventData);
          return result;
        } else {
          const result = CivetOption$0(state);
          if (state.events)
            state.events.exit?.("CivetOption", state, result, eventData);
          return result;
        }
      }
      var UnknownPrologue$0 = $S($R$0($EXPECT($R61, fail, "UnknownPrologue /[\\t ]*/")), StringLiteral, $TEXT(SimpleStatementDelimiter), EOS);
      function UnknownPrologue(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("UnknownPrologue", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("UnknownPrologue", state, UnknownPrologue$0(state));
          if (state.events)
            state.events.exit?.("UnknownPrologue", state, result, eventData);
          return result;
        } else {
          const result = UnknownPrologue$0(state);
          if (state.events)
            state.events.exit?.("UnknownPrologue", state, result, eventData);
          return result;
        }
      }
      var DirectivePrologue$0 = CivetPrologue;
      var DirectivePrologue$1 = UnknownPrologue;
      function DirectivePrologue(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DirectivePrologue", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DirectivePrologue", state, DirectivePrologue$0(state) || DirectivePrologue$1(state));
          if (state.events)
            state.events.exit?.("DirectivePrologue", state, result, eventData);
          return result;
        } else {
          const result = DirectivePrologue$0(state) || DirectivePrologue$1(state);
          if (state.events)
            state.events.exit?.("DirectivePrologue", state, result, eventData);
          return result;
        }
      }
      var EOS$0 = $P(RestOfLine);
      function EOS(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EOS", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EOS", state, EOS$0(state));
          if (state.events)
            state.events.exit?.("EOS", state, result, eventData);
          return result;
        } else {
          const result = EOS$0(state);
          if (state.events)
            state.events.exit?.("EOS", state, result, eventData);
          return result;
        }
      }
      var EOL$0 = $TR($EXPECT($R64, fail, "EOL /\\r\\n|\\n|\\r|$/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        return { $loc, token: $0 };
      });
      function EOL(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("EOL", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("EOL", state, EOL$0(state));
          if (state.events)
            state.events.exit?.("EOL", state, result, eventData);
          return result;
        } else {
          const result = EOL$0(state);
          if (state.events)
            state.events.exit?.("EOL", state, result, eventData);
          return result;
        }
      }
      var DebugHere$0 = $TV($EXPECT($L0, fail, 'DebugHere ""'), function($skip, $loc, $0, $1) {
        debugger;
      });
      function DebugHere(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("DebugHere", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("DebugHere", state, DebugHere$0(state));
          if (state.events)
            state.events.exit?.("DebugHere", state, result, eventData);
          return result;
        } else {
          const result = DebugHere$0(state);
          if (state.events)
            state.events.exit?.("DebugHere", state, result, eventData);
          return result;
        }
      }
      var InsertSemicolon$0 = $TV($EXPECT($L0, fail, 'InsertSemicolon ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: ";" };
      });
      function InsertSemicolon(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertSemicolon", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertSemicolon", state, InsertSemicolon$0(state));
          if (state.events)
            state.events.exit?.("InsertSemicolon", state, result, eventData);
          return result;
        } else {
          const result = InsertSemicolon$0(state);
          if (state.events)
            state.events.exit?.("InsertSemicolon", state, result, eventData);
          return result;
        }
      }
      var InsertOpenParen$0 = $TV($EXPECT($L0, fail, 'InsertOpenParen ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "(" };
      });
      function InsertOpenParen(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertOpenParen", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertOpenParen", state, InsertOpenParen$0(state));
          if (state.events)
            state.events.exit?.("InsertOpenParen", state, result, eventData);
          return result;
        } else {
          const result = InsertOpenParen$0(state);
          if (state.events)
            state.events.exit?.("InsertOpenParen", state, result, eventData);
          return result;
        }
      }
      var InsertCloseParen$0 = $TV($EXPECT($L0, fail, 'InsertCloseParen ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: ")" };
      });
      function InsertCloseParen(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertCloseParen", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertCloseParen", state, InsertCloseParen$0(state));
          if (state.events)
            state.events.exit?.("InsertCloseParen", state, result, eventData);
          return result;
        } else {
          const result = InsertCloseParen$0(state);
          if (state.events)
            state.events.exit?.("InsertCloseParen", state, result, eventData);
          return result;
        }
      }
      var InsertOpenBrace$0 = $TV($EXPECT($L0, fail, 'InsertOpenBrace ""'), function($skip, $loc, $0, $1) {
        return [{ $loc, token: " " }, { $loc, token: "{" }];
      });
      function InsertOpenBrace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertOpenBrace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertOpenBrace", state, InsertOpenBrace$0(state));
          if (state.events)
            state.events.exit?.("InsertOpenBrace", state, result, eventData);
          return result;
        } else {
          const result = InsertOpenBrace$0(state);
          if (state.events)
            state.events.exit?.("InsertOpenBrace", state, result, eventData);
          return result;
        }
      }
      var InsertInlineOpenBrace$0 = $TV($EXPECT($L0, fail, 'InsertInlineOpenBrace ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "{" };
      });
      function InsertInlineOpenBrace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertInlineOpenBrace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertInlineOpenBrace", state, InsertInlineOpenBrace$0(state));
          if (state.events)
            state.events.exit?.("InsertInlineOpenBrace", state, result, eventData);
          return result;
        } else {
          const result = InsertInlineOpenBrace$0(state);
          if (state.events)
            state.events.exit?.("InsertInlineOpenBrace", state, result, eventData);
          return result;
        }
      }
      var InsertCloseBrace$0 = $TV($EXPECT($L0, fail, 'InsertCloseBrace ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "}" };
      });
      function InsertCloseBrace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertCloseBrace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertCloseBrace", state, InsertCloseBrace$0(state));
          if (state.events)
            state.events.exit?.("InsertCloseBrace", state, result, eventData);
          return result;
        } else {
          const result = InsertCloseBrace$0(state);
          if (state.events)
            state.events.exit?.("InsertCloseBrace", state, result, eventData);
          return result;
        }
      }
      var InsertOpenBracket$0 = $TV($EXPECT($L0, fail, 'InsertOpenBracket ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "[" };
      });
      function InsertOpenBracket(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertOpenBracket", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertOpenBracket", state, InsertOpenBracket$0(state));
          if (state.events)
            state.events.exit?.("InsertOpenBracket", state, result, eventData);
          return result;
        } else {
          const result = InsertOpenBracket$0(state);
          if (state.events)
            state.events.exit?.("InsertOpenBracket", state, result, eventData);
          return result;
        }
      }
      var InsertCloseBracket$0 = $TV($EXPECT($L0, fail, 'InsertCloseBracket ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "]" };
      });
      function InsertCloseBracket(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertCloseBracket", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertCloseBracket", state, InsertCloseBracket$0(state));
          if (state.events)
            state.events.exit?.("InsertCloseBracket", state, result, eventData);
          return result;
        } else {
          const result = InsertCloseBracket$0(state);
          if (state.events)
            state.events.exit?.("InsertCloseBracket", state, result, eventData);
          return result;
        }
      }
      var InsertComma$0 = $TV($EXPECT($L0, fail, 'InsertComma ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "," };
      });
      function InsertComma(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertComma", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertComma", state, InsertComma$0(state));
          if (state.events)
            state.events.exit?.("InsertComma", state, result, eventData);
          return result;
        } else {
          const result = InsertComma$0(state);
          if (state.events)
            state.events.exit?.("InsertComma", state, result, eventData);
          return result;
        }
      }
      var InsertConst$0 = $TV($EXPECT($L0, fail, 'InsertConst ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "const " };
      });
      function InsertConst(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertConst", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertConst", state, InsertConst$0(state));
          if (state.events)
            state.events.exit?.("InsertConst", state, result, eventData);
          return result;
        } else {
          const result = InsertConst$0(state);
          if (state.events)
            state.events.exit?.("InsertConst", state, result, eventData);
          return result;
        }
      }
      var InsertLet$0 = $TV($EXPECT($L0, fail, 'InsertLet ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "let " };
      });
      function InsertLet(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertLet", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertLet", state, InsertLet$0(state));
          if (state.events)
            state.events.exit?.("InsertLet", state, result, eventData);
          return result;
        } else {
          const result = InsertLet$0(state);
          if (state.events)
            state.events.exit?.("InsertLet", state, result, eventData);
          return result;
        }
      }
      var InsertReadonly$0 = $TV($EXPECT($L0, fail, 'InsertReadonly ""'), function($skip, $loc, $0, $1) {
        return { ts: true, children: [{ $loc, token: "readonly " }] };
      });
      function InsertReadonly(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertReadonly", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertReadonly", state, InsertReadonly$0(state));
          if (state.events)
            state.events.exit?.("InsertReadonly", state, result, eventData);
          return result;
        } else {
          const result = InsertReadonly$0(state);
          if (state.events)
            state.events.exit?.("InsertReadonly", state, result, eventData);
          return result;
        }
      }
      var InsertNewline$0 = $TV($EXPECT($L0, fail, 'InsertNewline ""'), function($skip, $loc, $0, $1) {
        return "\n";
      });
      function InsertNewline(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertNewline", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertNewline", state, InsertNewline$0(state));
          if (state.events)
            state.events.exit?.("InsertNewline", state, result, eventData);
          return result;
        } else {
          const result = InsertNewline$0(state);
          if (state.events)
            state.events.exit?.("InsertNewline", state, result, eventData);
          return result;
        }
      }
      var InsertIndent$0 = $TV($EXPECT($L0, fail, 'InsertIndent ""'), function($skip, $loc, $0, $1) {
        return module.currentIndent.token;
      });
      function InsertIndent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertIndent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertIndent", state, InsertIndent$0(state));
          if (state.events)
            state.events.exit?.("InsertIndent", state, result, eventData);
          return result;
        } else {
          const result = InsertIndent$0(state);
          if (state.events)
            state.events.exit?.("InsertIndent", state, result, eventData);
          return result;
        }
      }
      var InsertSpace$0 = $TV($EXPECT($L0, fail, 'InsertSpace ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: " " };
      });
      function InsertSpace(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertSpace", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertSpace", state, InsertSpace$0(state));
          if (state.events)
            state.events.exit?.("InsertSpace", state, result, eventData);
          return result;
        } else {
          const result = InsertSpace$0(state);
          if (state.events)
            state.events.exit?.("InsertSpace", state, result, eventData);
          return result;
        }
      }
      var InsertDot$0 = $TV($EXPECT($L0, fail, 'InsertDot ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "." };
      });
      function InsertDot(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertDot", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertDot", state, InsertDot$0(state));
          if (state.events)
            state.events.exit?.("InsertDot", state, result, eventData);
          return result;
        } else {
          const result = InsertDot$0(state);
          if (state.events)
            state.events.exit?.("InsertDot", state, result, eventData);
          return result;
        }
      }
      var InsertBreak$0 = $TV($EXPECT($L0, fail, 'InsertBreak ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: ";break;" };
      });
      function InsertBreak(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertBreak", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertBreak", state, InsertBreak$0(state));
          if (state.events)
            state.events.exit?.("InsertBreak", state, result, eventData);
          return result;
        } else {
          const result = InsertBreak$0(state);
          if (state.events)
            state.events.exit?.("InsertBreak", state, result, eventData);
          return result;
        }
      }
      var InsertVar$0 = $TV($EXPECT($L0, fail, 'InsertVar ""'), function($skip, $loc, $0, $1) {
        return { $loc, token: "var " };
      });
      function InsertVar(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("InsertVar", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("InsertVar", state, InsertVar$0(state));
          if (state.events)
            state.events.exit?.("InsertVar", state, result, eventData);
          return result;
        } else {
          const result = InsertVar$0(state);
          if (state.events)
            state.events.exit?.("InsertVar", state, result, eventData);
          return result;
        }
      }
      var CoffeeBinaryExistentialEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeBinaryExistentialEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeBinaryExistential)
          return;
        return $skip;
      });
      function CoffeeBinaryExistentialEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeBinaryExistentialEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeBinaryExistentialEnabled", state, CoffeeBinaryExistentialEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeBinaryExistentialEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeBinaryExistentialEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeBinaryExistentialEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeBooleansEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeBooleansEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeBooleans)
          return;
        return $skip;
      });
      function CoffeeBooleansEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeBooleansEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeBooleansEnabled", state, CoffeeBooleansEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeBooleansEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeBooleansEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeBooleansEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeClassesEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeClassesEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeClasses)
          return;
        return $skip;
      });
      function CoffeeClassesEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeClassesEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeClassesEnabled", state, CoffeeClassesEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeClassesEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeClassesEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeClassesEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeCommentEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeCommentEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeComment)
          return;
        return $skip;
      });
      function CoffeeCommentEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeCommentEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeCommentEnabled", state, CoffeeCommentEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeCommentEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeCommentEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeCommentEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeDoEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeDoEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeDo)
          return;
        return $skip;
      });
      function CoffeeDoEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeDoEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeDoEnabled", state, CoffeeDoEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeDoEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeDoEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeDoEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeForLoopsEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeForLoopsEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeForLoops)
          return;
        return $skip;
      });
      function CoffeeForLoopsEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeForLoopsEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeForLoopsEnabled", state, CoffeeForLoopsEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeForLoopsEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeForLoopsEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeForLoopsEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeInterpolationEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeInterpolationEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeInterpolation)
          return;
        return $skip;
      });
      function CoffeeInterpolationEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeInterpolationEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeInterpolationEnabled", state, CoffeeInterpolationEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeInterpolationEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeInterpolationEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeInterpolationEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeIsntEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeIsntEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeIsnt)
          return;
        return $skip;
      });
      function CoffeeIsntEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeIsntEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeIsntEnabled", state, CoffeeIsntEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeIsntEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeIsntEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeIsntEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeJSXEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeJSXEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeJSX)
          return;
        return $skip;
      });
      function CoffeeJSXEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeJSXEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeJSXEnabled", state, CoffeeJSXEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeJSXEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeJSXEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeJSXEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeLineContinuationEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeLineContinuationEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeLineContinuation)
          return;
        return $skip;
      });
      function CoffeeLineContinuationEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeLineContinuationEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeLineContinuationEnabled", state, CoffeeLineContinuationEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeLineContinuationEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeLineContinuationEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeLineContinuationEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeNotEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeNotEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeNot)
          return;
        return $skip;
      });
      function CoffeeNotEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeNotEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeNotEnabled", state, CoffeeNotEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeNotEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeNotEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeNotEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeeOfEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeeOfEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeeOf)
          return;
        return $skip;
      });
      function CoffeeOfEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeeOfEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeeOfEnabled", state, CoffeeOfEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeeOfEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeeOfEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeeOfEnabled", state, result, eventData);
          return result;
        }
      }
      var CoffeePrototypeEnabled$0 = $TV($EXPECT($L0, fail, 'CoffeePrototypeEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.coffeePrototype)
          return;
        return $skip;
      });
      function CoffeePrototypeEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("CoffeePrototypeEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("CoffeePrototypeEnabled", state, CoffeePrototypeEnabled$0(state));
          if (state.events)
            state.events.exit?.("CoffeePrototypeEnabled", state, result, eventData);
          return result;
        } else {
          const result = CoffeePrototypeEnabled$0(state);
          if (state.events)
            state.events.exit?.("CoffeePrototypeEnabled", state, result, eventData);
          return result;
        }
      }
      var ObjectIsEnabled$0 = $TV($EXPECT($L0, fail, 'ObjectIsEnabled ""'), function($skip, $loc, $0, $1) {
        if (module.config.objectIs)
          return;
        return $skip;
      });
      function ObjectIsEnabled(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("ObjectIsEnabled", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("ObjectIsEnabled", state, ObjectIsEnabled$0(state));
          if (state.events)
            state.events.exit?.("ObjectIsEnabled", state, result, eventData);
          return result;
        } else {
          const result = ObjectIsEnabled$0(state);
          if (state.events)
            state.events.exit?.("ObjectIsEnabled", state, result, eventData);
          return result;
        }
      }
      var Reset$0 = $TV($EXPECT($L0, fail, 'Reset ""'), function($skip, $loc, $0, $1) {
        module.indentLevels = [{
          level: 0,
          token: ""
        }];
        module.forbidClassImplicitCall = [false];
        module.forbidIndentedApplication = [false];
        module.forbidTrailingMemberProperty = [false];
        module.forbidMultiLineImplicitObjectLiteral = [false];
        module.forbidNewlineBinaryOp = [false];
        module.JSXTagStack = [];
        module.operators = /* @__PURE__ */ new Set();
        if (!module._init) {
          module._init = true;
          Object.defineProperties(module, {
            currentIndent: {
              get() {
                const { indentLevels: l } = module;
                return l[l.length - 1];
              }
            },
            classImplicitCallForbidden: {
              get() {
                const { forbidClassImplicitCall: s } = module;
                return s[s.length - 1];
              }
            },
            indentedApplicationForbidden: {
              get() {
                const { forbidIndentedApplication: s } = module;
                return s[s.length - 1];
              }
            },
            trailingMemberPropertyForbidden: {
              get() {
                const { forbidTrailingMemberProperty: s } = module;
                return s[s.length - 1];
              }
            },
            multiLineImplicitObjectLiteralForbidden: {
              get() {
                const { forbidMultiLineImplicitObjectLiteral: s } = module;
                return s[s.length - 1];
              }
            },
            newlineBinaryOpForbidden: {
              get() {
                const { forbidNewlineBinaryOp: s } = module;
                return s[s.length - 1];
              }
            },
            currentJSXTag: {
              get() {
                const { JSXTagStack: s } = module;
                return s[s.length - 1];
              }
            }
          });
        }
        module.config = {
          autoVar: false,
          autoLet: false,
          coffeeBinaryExistential: false,
          coffeeBooleans: false,
          coffeeClasses: false,
          coffeeComment: false,
          coffeeDo: false,
          coffeeEq: false,
          coffeeForLoops: false,
          coffeeInterpolation: false,
          coffeeIsnt: false,
          coffeeJSX: false,
          coffeeLineContinuation: false,
          coffeeNot: false,
          coffeeOf: false,
          coffeePrototype: false,
          defaultElement: "div",
          implicitReturns: true,
          objectIs: false,
          react: false,
          solid: false,
          client: false,
          rewriteTsImports: true,
          server: false,
          tab: void 0,
          verbose: false
        };
        const asAny = {
          ts: true,
          children: [" as any"]
        };
        module.prelude = [];
        const preludeVar = "var ";
        const declareRef = {
          indexOf(indexOfRef) {
            const typeSuffix = {
              ts: true,
              children: [": <T>(this: T[], searchElement: T) => boolean"]
            };
            module.prelude.push(["", [preludeVar, indexOfRef, typeSuffix, " = [].indexOf", asAny, ";\n"]]);
          },
          hasProp(hasPropRef) {
            const typeSuffix = {
              ts: true,
              children: [": <T>(this: T, prop: keyof T) => boolean"]
            };
            module.prelude.push(["", [preludeVar, hasPropRef, typeSuffix, " = {}.hasOwnProperty", asAny, ";\n"]]);
          },
          is(isRef) {
            const typeSuffix = {
              ts: true,
              children: [": { <B, A extends B> (a: A, b: B): b is A, <A, B> (a: A, b: B): a is A & B }"]
            };
            module.prelude.push(["", [preludeVar, isRef, typeSuffix, " = Object.is", asAny, ";\n"]]);
          },
          modulo(moduloRef) {
            const typeSuffix = {
              ts: true,
              children: [": (a: number, b: number) => number"]
            };
            module.prelude.push(["", [preludeVar, moduloRef, typeSuffix, " = (a, b) => (a % b + b) % b;", "\n"]]);
          },
          xor(xorRef) {
            const typeSuffix = {
              ts: true,
              children: [": (a: unknown, b: unknown) => boolean"]
            };
            module.prelude.push(["", [preludeVar, xorRef, typeSuffix, " = (a, b) => a ? !b && a : b;", "\n"]]);
          },
          xnor(xnorRef) {
            const typeSuffix = {
              ts: true,
              children: [": (a: unknown, b: unknown) => boolean"]
            };
            module.prelude.push(["", [preludeVar, xnorRef, typeSuffix, " = (a, b) => a ? b : !b || a;", "\n"]]);
          },
          returnSymbol(ref) {
            module.prelude.push({
              children: [
                preludeVar,
                ref,
                ` = Symbol("return")';
`
              ]
            });
          },
          JSX(jsxRef) {
            module.prelude.push({
              ts: true,
              children: [
                "import type { JSX as ",
                jsxRef,
                " } from 'solid-js';\n"
              ]
            });
          },
          IntrinsicElements(intrinsicElementsRef) {
            const JSX = module.getRef("JSX");
            module.prelude.push({
              ts: true,
              children: [
                "type ",
                intrinsicElementsRef,
                "<K extends keyof ",
                JSX,
                ".IntrinsicElements> =\n",
                "  ",
                JSX,
                ".IntrinsicElements[K] extends ",
                JSX,
                ".DOMAttributes<infer T> ? T : unknown;\n"
              ]
            });
          }
        };
        const refs = {};
        module.getRef = function(base) {
          if (refs.hasOwnProperty(base))
            return refs[base];
          const ref = {
            type: "Ref",
            base,
            id: base
          };
          if (declareRef.hasOwnProperty(base))
            declareRef[base](ref);
          return refs[base] = ref;
        };
        Object.defineProperty(module.config, "deno", {
          set(b) {
            module.config.rewriteTsImports = !b;
          }
        });
        module.config.deno = typeof Deno !== "undefined";
        Object.defineProperty(module.config, "coffeeCompat", {
          set(b) {
            for (const option of [
              "autoVar",
              "coffeeBinaryExistential",
              "coffeeBooleans",
              "coffeeClasses",
              "coffeeComment",
              "coffeeDo",
              "coffeeEq",
              "coffeeForLoops",
              "coffeeInterpolation",
              "coffeeIsnt",
              "coffeeJSX",
              "coffeeLineContinuation",
              "coffeeNot",
              "coffeeOf",
              "coffeePrototype"
            ]) {
              module.config[option] = b;
            }
            if (b) {
              module.config.objectIs = false;
            }
          }
        });
        Object.assign(module.config, parse2.config);
        parse2.config = module.config;
      });
      function Reset(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Reset", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Reset", state, Reset$0(state));
          if (state.events)
            state.events.exit?.("Reset", state, result, eventData);
          return result;
        } else {
          const result = Reset$0(state);
          if (state.events)
            state.events.exit?.("Reset", state, result, eventData);
          return result;
        }
      }
      var Init$0 = $TS($S($E(Shebang), $Q(DirectivePrologue), $EXPECT($L0, fail, 'Init ""')), function($skip, $loc, $0, $1, $2, $3) {
        var directives = $2;
        directives.forEach((directive) => {
          if (directive.type === "CivetPrologue") {
            Object.assign(module.config, directive.config);
          }
        });
        return $0;
      });
      function Init(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Init", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Init", state, Init$0(state));
          if (state.events)
            state.events.exit?.("Init", state, result, eventData);
          return result;
        } else {
          const result = Init$0(state);
          if (state.events)
            state.events.exit?.("Init", state, result, eventData);
          return result;
        }
      }
      var Indent$0 = $TR($EXPECT($R65, fail, "Indent /[ \\t]*/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
        let level;
        if (module.config.tab) {
          const tabs = $0.match(/\t/g);
          const numTabs = tabs ? tabs.length : 0;
          level = numTabs * module.config.tab + ($0.length - numTabs);
        } else {
          level = $0.length;
        }
        return {
          $loc,
          token: $0,
          level
        };
      });
      function Indent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Indent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Indent", state, Indent$0(state));
          if (state.events)
            state.events.exit?.("Indent", state, result, eventData);
          return result;
        } else {
          const result = Indent$0(state);
          if (state.events)
            state.events.exit?.("Indent", state, result, eventData);
          return result;
        }
      }
      var TrackIndented$0 = $TV(Indent, function($skip, $loc, $0, $1) {
        var indent = $0;
        const { level } = indent;
        if (level <= module.currentIndent.level) {
          return $skip;
        }
        if (module.config.verbose) {
          console.log("pushing indent", indent);
        }
        module.indentLevels.push(indent);
        return $1;
      });
      function TrackIndented(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("TrackIndented", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("TrackIndented", state, TrackIndented$0(state));
          if (state.events)
            state.events.exit?.("TrackIndented", state, result, eventData);
          return result;
        } else {
          const result = TrackIndented$0(state);
          if (state.events)
            state.events.exit?.("TrackIndented", state, result, eventData);
          return result;
        }
      }
      var Samedent$0 = $TS($S(EOS, Indent), function($skip, $loc, $0, $1, $2) {
        var indent = $2;
        const { level } = indent;
        const currentIndentLevel = module.currentIndent.level;
        if (level === currentIndentLevel) {
          return $0;
        }
        return $skip;
      });
      function Samedent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Samedent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Samedent", state, Samedent$0(state));
          if (state.events)
            state.events.exit?.("Samedent", state, result, eventData);
          return result;
        } else {
          const result = Samedent$0(state);
          if (state.events)
            state.events.exit?.("Samedent", state, result, eventData);
          return result;
        }
      }
      var IndentedFurther$0 = $TS($S(EOS, Indent), function($skip, $loc, $0, $1, $2) {
        var indent = $2;
        const { level } = indent;
        const currentIndentLevel = module.currentIndent.level;
        if (level > currentIndentLevel) {
          return $0;
        }
        return $skip;
      });
      function IndentedFurther(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("IndentedFurther", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("IndentedFurther", state, IndentedFurther$0(state));
          if (state.events)
            state.events.exit?.("IndentedFurther", state, result, eventData);
          return result;
        } else {
          const result = IndentedFurther$0(state);
          if (state.events)
            state.events.exit?.("IndentedFurther", state, result, eventData);
          return result;
        }
      }
      var NotDedented$0 = $TS($S($E($C(Samedent, IndentedFurther)), $E(_)), function($skip, $loc, $0, $1, $2) {
        const ws = [];
        if ($1)
          ws.push(...$1);
        if ($2)
          ws.push(...$2);
        return ws.flat(Infinity).filter(Boolean);
      });
      function NotDedented(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("NotDedented", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("NotDedented", state, NotDedented$0(state));
          if (state.events)
            state.events.exit?.("NotDedented", state, result, eventData);
          return result;
        } else {
          const result = NotDedented$0(state);
          if (state.events)
            state.events.exit?.("NotDedented", state, result, eventData);
          return result;
        }
      }
      var Dedented$0 = $T($S($N($C(Samedent, IndentedFurther)), EOS), function(value) {
        return value[1];
      });
      function Dedented(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Dedented", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Dedented", state, Dedented$0(state));
          if (state.events)
            state.events.exit?.("Dedented", state, result, eventData);
          return result;
        } else {
          const result = Dedented$0(state);
          if (state.events)
            state.events.exit?.("Dedented", state, result, eventData);
          return result;
        }
      }
      var PushIndent$0 = $Y($S(EOS, TrackIndented));
      function PushIndent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PushIndent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PushIndent", state, PushIndent$0(state));
          if (state.events)
            state.events.exit?.("PushIndent", state, result, eventData);
          return result;
        } else {
          const result = PushIndent$0(state);
          if (state.events)
            state.events.exit?.("PushIndent", state, result, eventData);
          return result;
        }
      }
      var PopIndent$0 = $TV($EXPECT($L0, fail, 'PopIndent ""'), function($skip, $loc, $0, $1) {
        if (module.config.verbose) {
          console.log("popping indent", module.indentLevels[module.indentLevels.length - 1], "->", module.indentLevels[module.indentLevels.length - 2]);
        }
        module.indentLevels.pop();
      });
      function PopIndent(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("PopIndent", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("PopIndent", state, PopIndent$0(state));
          if (state.events)
            state.events.exit?.("PopIndent", state, result, eventData);
          return result;
        } else {
          const result = PopIndent$0(state);
          if (state.events)
            state.events.exit?.("PopIndent", state, result, eventData);
          return result;
        }
      }
      var Nested$0 = $TS($S(EOS, Indent), function($skip, $loc, $0, $1, $2) {
        var eos = $1;
        var indent = $2;
        const { level } = indent;
        const currentIndent = module.currentIndent;
        if (module.config.verbose) {
          console.log("Indented", level, currentIndent);
        }
        if (level !== currentIndent.level) {
          if (module.config.verbose) {
            console.log("skipped nested");
          }
          return $skip;
        }
        return $0;
      });
      function Nested(state) {
        let eventData;
        if (state.events) {
          const result = state.events.enter?.("Nested", state);
          if (result) {
            if (result.cache)
              return result.cache;
            eventData = result.data;
          }
        }
        if (state.tokenize) {
          const result = $TOKEN("Nested", state, Nested$0(state));
          if (state.events)
            state.events.exit?.("Nested", state, result, eventData);
          return result;
        } else {
          const result = Nested$0(state);
          if (state.events)
            state.events.exit?.("Nested", state, result, eventData);
          return result;
        }
      }
      exports.parse = parse2;
      exports.default = { parse: parse2 };
      var {
        addPostfixStatement,
        adjustBindingElements,
        attachPostfixStatementAsExpression,
        blockWithPrefix,
        convertObjectToJSXAttributes,
        deepCopy,
        dedentBlockString,
        dedentBlockSubstitutions,
        expressionizeIfClause,
        forRange,
        gatherBindingCode,
        getTrimmingSpace,
        hasAwait,
        hasYield,
        insertTrimmingSpace,
        isEmptyBareBlock,
        isWhitespaceOrEmpty,
        lastAccessInCallExpression,
        literalValue,
        makeEmptyBlock,
        makeLeftHandSideExpression,
        maybeRef,
        modifyString,
        processBinaryOpExpression,
        processCallMemberExpression,
        processCoffeeInterpolation,
        processConstAssignmentDeclaration,
        processLetAssignmentDeclaration,
        processProgram,
        processUnaryExpression,
        quoteString,
        reorderBindingRestProperty,
        replaceNodes,
        typeOfJSX,
        wrapIIFE
      } = require_lib();
    }
  });

  // source/main.coffee
  var main_exports = {};
  __export(main_exports, {
    compile: () => compile,
    default: () => main_default,
    generate: () => generate_default,
    isCompileError: () => isCompileError,
    parse: () => parse,
    util: () => util_exports
  });
  var import_parser = __toESM(require_parser());

  // source/generate.coffee
  "civet coffeeCompat";
  var gen;
  var generate_default = gen = function(node, options) {
    var $loc, token;
    if (node === null || node === void 0) {
      return "";
    }
    if (typeof node === "string") {
      if (options != null) {
        if (typeof options.updateSourceMap === "function") {
          options.updateSourceMap(node);
        }
      }
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(function(child) {
        return gen(child, options);
      }).join("");
    }
    if (typeof node === "object") {
      if (node.type === "Error") {
        if (options.errors == null) {
          options.errors = [];
        }
        options.errors.push(node);
        return "";
      }
      if (options.js && node.ts) {
        return "";
      }
      if (!options.js && node.js) {
        return "";
      }
      if (node.$loc != null) {
        ({ token, $loc } = node);
        if (options != null) {
          if (typeof options.updateSourceMap === "function") {
            options.updateSourceMap(token, $loc.pos);
          }
        }
        return token;
      }
      if (!node.children) {
        switch (node.type) {
          case "Ref":
            throw new Error(`Unpopulated ref ${JSON.stringify(node)}`);
        }
        debugger;
        throw new Error(`Unknown node ${JSON.stringify(node)}`);
      }
      return gen(node.children, options);
    }
    debugger;
    throw new Error(`Unknown node ${JSON.stringify(node)}`);
  };
  var prune = function(node) {
    var a;
    if (node === null || node === void 0) {
      return;
    }
    if (node.length === 0) {
      return;
    }
    if (node.parent != null) {
      delete node.parent;
    }
    if (Array.isArray(node)) {
      a = node.map(function(n) {
        return prune(n);
      }).filter(function(n) {
        return !!n;
      });
      if (a.length > 1) {
        return a;
      }
      if (a.length === 1) {
        return a[0];
      }
      return;
    }
    if (node.children != null) {
      node.children = prune(node.children) || [];
      return node;
    }
    return node;
  };

  // source/util.coffee
  var util_exports = {};
  __export(util_exports, {
    SourceMap: () => SourceMap,
    base64Encode: () => base64Encode,
    locationTable: () => locationTable,
    lookupLineColumn: () => lookupLineColumn
  });
  "civet coffeeCompat";
  var BASE64_CHARS;
  var VLQ_CONTINUATION_BIT;
  var VLQ_SHIFT;
  var VLQ_VALUE_MASK;
  var decodeError;
  var decodeVLQ;
  var encodeBase64;
  var encodeVlq;
  var prettySourceExcerpt;
  var remapPosition;
  var smRegexp;
  var vlqChars;
  var vlqTable;
  var locationTable = function(input) {
    var line, lines, linesRe, pos, result;
    linesRe = /([^\r\n]*)(\r\n|\r|\n|$)/y;
    lines = [];
    line = 0;
    pos = 0;
    while (result = linesRe.exec(input)) {
      pos += result[0].length;
      lines[line++] = pos;
      if (pos === input.length) {
        break;
      }
    }
    return lines;
  };
  var lookupLineColumn = function(table, pos) {
    var l, prevEnd;
    l = 0;
    prevEnd = 0;
    while (table[l] <= pos) {
      prevEnd = table[l++];
    }
    return [l, pos - prevEnd];
  };
  var SourceMap = function(sourceString) {
    var EOL, sm, srcTable;
    srcTable = locationTable(sourceString);
    sm = {
      lines: [[]],
      lineNum: 0,
      colOffset: 0,
      srcTable
    };
    EOL = /\r?\n|\r/;
    return {
      data: sm,
      source: function() {
        return sourceString;
      },
      renderMappings: function() {
        var lastSourceColumn, lastSourceLine;
        lastSourceLine = 0;
        lastSourceColumn = 0;
        return sm.lines.map(function(line) {
          return line.map(function(entry) {
            var colDelta, lineDelta, sourceFileIndex, srcCol, srcLine;
            if (entry.length === 4) {
              [colDelta, sourceFileIndex, srcLine, srcCol] = entry;
              lineDelta = srcLine - lastSourceLine;
              colDelta = srcCol - lastSourceColumn;
              lastSourceLine = srcLine;
              lastSourceColumn = srcCol;
              return `${encodeVlq(entry[0])}${encodeVlq(sourceFileIndex)}${encodeVlq(lineDelta)}${encodeVlq(colDelta)}`;
            } else {
              return encodeVlq(entry[0]);
            }
          }).join(",");
        }).join(";");
      },
      json: function(srcFileName, outFileName) {
        return {
          version: 3,
          file: outFileName,
          sources: [srcFileName],
          mappings: this.renderMappings(),
          names: [],
          sourcesContent: [sourceString]
        };
      },
      updateSourceMap: function(outputStr, inputPos) {
        var outLines, srcCol, srcLine;
        outLines = outputStr.split(EOL);
        if (inputPos != null) {
          [srcLine, srcCol] = lookupLineColumn(srcTable, inputPos);
        }
        outLines.forEach(function(line, i) {
          var l;
          if (i > 0) {
            sm.lineNum++;
            sm.colOffset = 0;
            sm.lines[sm.lineNum] = [];
            srcCol = 0;
          }
          l = sm.colOffset;
          sm.colOffset = line.length;
          if (inputPos != null) {
            return sm.lines[sm.lineNum].push([l, 0, srcLine + i, srcCol]);
          } else if (l !== 0) {
            return sm.lines[sm.lineNum].push([l]);
          }
        });
      }
    };
  };
  SourceMap.parseWithLines = function(base64encodedJSONstr) {
    var json, lines, sourceColumn, sourceLine;
    json = JSON.parse(Buffer.from(base64encodedJSONstr, "base64").toString("utf8"));
    sourceLine = 0;
    sourceColumn = 0;
    lines = json.mappings.split(";").map(function(line) {
      if (line.length === 0) {
        return [];
      }
      return line.split(",").map(function(entry) {
        var result;
        result = decodeVLQ(entry);
        switch (result.length) {
          case 1:
            return [result[0]];
          case 4:
            return [result[0], result[1], sourceLine += result[2], sourceColumn += result[3]];
          case 5:
            return [result[0], result[1], sourceLine += result[2], sourceColumn += result[3], result[4]];
          default:
            throw new Error("Unknown source map entry", result);
        }
      });
    });
    json.lines = lines;
    return json;
  };
  smRegexp = /\n\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,([+a-zA-Z0-9\/]*=?=?)$/;
  SourceMap.remap = function(codeWithSourceMap, upstreamMap, sourcePath, targetPath) {
    var codeWithoutSourceMap, composedLines, newSourceMap, parsed, remappedCodeWithSourceMap, remappedSourceMapJSON, sourceMapText;
    sourceMapText = null;
    codeWithoutSourceMap = codeWithSourceMap.replace(smRegexp, (match, sm) => {
      sourceMapText = sm;
      return "";
    });
    if (sourceMapText) {
      parsed = SourceMap.parseWithLines(sourceMapText);
      composedLines = SourceMap.composeLines(upstreamMap.data.lines, parsed.lines);
      upstreamMap.data.lines = composedLines;
    }
    remappedSourceMapJSON = upstreamMap.json(sourcePath, targetPath);
    newSourceMap = `${"sourceMapping"}URL=data:application/json;charset=utf-8;base64,${base64Encode(JSON.stringify(remappedSourceMapJSON))}`;
    remappedCodeWithSourceMap = `${codeWithoutSourceMap}
//# ${newSourceMap}`;
    return remappedCodeWithSourceMap;
  };
  SourceMap.composeLines = function(upstreamMapping, lines) {
    return lines.map(function(line, l) {
      return line.map(function(entry) {
        var colDelta, sourceFileIndex, srcCol, srcLine, srcPos, upstreamCol, upstreamLine;
        if (entry.length === 1) {
          return entry;
        }
        [colDelta, sourceFileIndex, srcLine, srcCol] = entry;
        srcPos = remapPosition([srcLine, srcCol], upstreamMapping);
        if (!srcPos) {
          return [entry[0]];
        }
        [upstreamLine, upstreamCol] = srcPos;
        if (entry.length === 4) {
          return [colDelta, sourceFileIndex, upstreamLine, upstreamCol];
        }
        return [colDelta, sourceFileIndex, upstreamLine, upstreamCol, entry[4]];
      });
    });
  };
  prettySourceExcerpt = function(source, location, length) {
    var colNum, i, j, line, lineNum, lineNumStr, lines, ref, ref1;
    lines = source.split(/\r?\n|\r/);
    lineNum = location.line;
    colNum = location.column;
    for (i = j = ref = lineNum - 2, ref1 = lineNum + 2; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
      if (i < 0 || i >= lines.length) {
        continue;
      }
      line = lines[i];
      lineNumStr = (i + 1).toString();
      while (lineNumStr.length < 4) {
        lineNumStr = " " + lineNumStr;
      }
      if (i === lineNum) {
        console.log(`${lineNumStr}: ${line}`);
        console.log(" ".repeat(lineNumStr.length + 2 + colNum) + "^".repeat(length));
      } else {
        console.log(`${lineNumStr}: ${line}`);
      }
    }
  };
  VLQ_SHIFT = 5;
  VLQ_CONTINUATION_BIT = 1 << VLQ_SHIFT;
  VLQ_VALUE_MASK = VLQ_CONTINUATION_BIT - 1;
  encodeVlq = function(value) {
    var answer, nextChunk, signBit, valueToEncode;
    answer = "";
    signBit = value < 0 ? 1 : 0;
    valueToEncode = (Math.abs(value) << 1) + signBit;
    while (valueToEncode || !answer) {
      nextChunk = valueToEncode & VLQ_VALUE_MASK;
      valueToEncode = valueToEncode >> VLQ_SHIFT;
      if (valueToEncode) {
        nextChunk |= VLQ_CONTINUATION_BIT;
      }
      answer += encodeBase64(nextChunk);
    }
    return answer;
  };
  BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  encodeBase64 = function(value) {
    return BASE64_CHARS[value] || function() {
      throw new Error(`Cannot Base64 encode value: ${value}`);
    }();
  };
  var base64Encode = function(src) {
    return Buffer.from(src).toString("base64");
  };
  vlqTable = new Uint8Array(128);
  vlqChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  (function() {
    var i, l, results;
    i = 0;
    l = vlqTable.length;
    while (i < l) {
      vlqTable[i] = 255;
      i++;
    }
    i = 0;
    l = vlqChars.length;
    results = [];
    while (i < l) {
      vlqTable[vlqChars.charCodeAt(i)] = i;
      results.push(i++);
    }
    return results;
  })();
  decodeError = function(message) {
    throw new Error(message);
  };
  decodeVLQ = function(mapping) {
    var c, i, index, l, result, shift, v, vlq;
    i = 0;
    l = mapping.length;
    result = [];
    while (i < l) {
      shift = 0;
      vlq = 0;
      while (true) {
        if (i >= l) {
          decodeError("Unexpected early end of mapping data");
        }
        c = mapping.charCodeAt(i);
        if ((c & 127) !== c) {
          decodeError(`Invalid mapping character: ${JSON.stringify(String.fromCharCode(c))}`);
        }
        index = vlqTable[c & 127];
        if (index === 255) {
          decodeError(`Invalid mapping character: ${JSON.stringify(String.fromCharCode(c))}`);
        }
        i++;
        vlq |= (index & 31) << shift;
        shift += 5;
        if ((index & 32) === 0) {
          break;
        }
      }
      if (vlq & 1) {
        v = -(vlq >> 1);
      } else {
        v = vlq >> 1;
      }
      result.push(v);
    }
    return result;
  };
  remapPosition = function(position, sourcemapLines) {
    var character, i, l, lastMapping, lastMappingPosition, line, mapping, p, textLine;
    [line, character] = position;
    textLine = sourcemapLines[line];
    if (!(textLine != null ? textLine.length : void 0)) {
      return void 0;
    }
    i = 0;
    p = 0;
    l = textLine.length;
    lastMapping = void 0;
    lastMappingPosition = 0;
    while (i < l) {
      mapping = textLine[i];
      p += mapping[0];
      if (mapping.length === 4) {
        lastMapping = mapping;
        lastMappingPosition = p;
      }
      if (p >= character) {
        break;
      }
      i++;
    }
    if (character - lastMappingPosition !== 0) {
      return void 0;
    }
    if (lastMapping) {
      return [lastMapping[2], lastMapping[3]];
    } else {
      return void 0;
    }
  };

  // source/main.coffee
  "civet coffeeCompat";
  var SourceMap2;
  var makeCache;
  var parse;
  var uncacheable;
  ({ parse } = import_parser.default);
  ({ SourceMap: SourceMap2 } = util_exports);
  uncacheable = /* @__PURE__ */ new Set(["ActualAssignment", "AllowAll", "AllowClassImplicitCall", "AllowIndentedApplication", "AllowMultiLineImplicitObjectLiteral", "AllowNewlineBinaryOp", "AllowTrailingMemberProperty", "AllowedTrailingMemberExpressions", "ApplicationStart", "Arguments", "ArgumentsWithTrailingMemberExpressions", "ArrowFunction", "ArrowFunctionTail", "AssignmentExpression", "AssignmentExpressionTail", "BinaryOpExpression", "BinaryOpRHS", "BracedBlock", "BracedObjectLiteralContent", "BracedOrEmptyBlock", "CallExpression", "CallExpressionRest", "ClassImplicitCallForbidden", "CoffeeCommentEnabled", "CommaDelimiter", "ConditionalExpression", "ConditionFragment", "Declaration", "Debugger", "Dedented", "ElementListWithIndentedApplicationForbidden", "ElseClause", "Expression", "ExpressionStatement", "ExpressionWithIndentedApplicationForbidden", "ExtendedExpression", "FatArrowBody", "ForbidClassImplicitCall", "ForbidIndentedApplication", "ForbidMultiLineImplicitObjectLiteral", "ForbidNewlineBinaryOp", "ForbidTrailingMemberProperty", "FunctionDeclaration", "FunctionExpression", "HoistableDeclaration", "ImplicitArguments", "ImplicitInlineObjectPropertyDelimiter", "ImplicitNestedBlock", "IndentedApplicationAllowed", "IndentedFurther", "IndentedJSXChildExpression", "InlineObjectLiteral", "InsertIndent", "JSXChild", "JSXChildren", "JSXElement", "JSXFragment", "JSXImplicitFragment", "JSXMixedChildren", "JSXNested", "JSXNestedChildren", "JSXOptionalClosingElement", "JSXOptionalClosingFragment", "JSXTag", "LeftHandSideExpression", "MemberExpression", "MemberExpressionRest", "Nested", "NestedBindingElement", "NestedBindingElements", "NestedBlockExpression", "NestedBlockExpression", "NestedBlockStatement", "NestedBlockStatements", "NestedClassSignatureElement", "NestedClassSignatureElements", "NestedDeclareElement", "NestedDeclareElements", "NestedElement", "NestedElementList", "NestedImplicitObjectLiteral", "NestedImplicitPropertyDefinition", "NestedImplicitPropertyDefinitions", "NestedInterfaceProperty", "NestedJSXChildExpression", "NestedModuleItem", "NestedModuleItems", "NestedNonAssignmentExtendedExpression", "NestedObject", "NestedPropertyDefinitions", "NewlineBinaryOpAllowed", "NonSingleBracedBlock", "NotDedented", "ObjectLiteral", "PatternExpressionList", "PopIndent", "PopJSXStack", "PostfixedExpression", "PostfixedStatement", "PrimaryExpression", "PushIndent", "PushJSXOpeningElement", "PushJSXOpeningFragment", "RestoreAll", "RestoreClassImplicitCall", "RestoreMultiLineImplicitObjectLiteral", "RestoreIndentedApplication", "RestoreTrailingMemberProperty", "RestoreNewlineBinaryOp", "RHS", "Samedent", "ShortCircuitExpression", "SingleLineAssignmentExpression", "SingleLineBinaryOpRHS", "SingleLineComment", "SingleLineStatements", "SnugNamedProperty", "Statement", "StatementListItem", "SuffixedExpression", "SuffixedStatement", "ThinArrowFunction", "TrackIndented", "TrailingMemberExpressions", "TrailingMemberPropertyAllowed", "TypedJSXElement", "TypedJSXFragment", "UnaryExpression", "UpdateExpression"]);
  var compile = function(src, options) {
    var ast, code, events, filename, ref, result, sm;
    if (!options) {
      options = {};
    } else {
      options = { ...options };
    }
    if (options.parseOptions == null) {
      options.parseOptions = {};
    }
    filename = options.filename || "unknown";
    if (filename.endsWith(".coffee") && !/^(#![^\r\n]*(\r\n|\n|\r))?\s*['"]civet/.test(src)) {
      options.parseOptions.coffeeCompat = true;
    }
    if (!options.noCache) {
      events = makeCache();
    }
    parse.config = options.parseOptions || {};
    ast = prune(parse(src, { filename, events }));
    if (options.ast) {
      return ast;
    }
    if (options.sourceMap || options.inlineMap) {
      sm = SourceMap2(src);
      options.updateSourceMap = sm.updateSourceMap;
      code = generate_default(ast, options);
      if (options.inlineMap) {
        return SourceMap2.remap(code, sm, filename, filename + ".tsx");
      } else {
        return {
          code,
          sourceMap: sm
        };
      }
    }
    result = generate_default(ast, options);
    if ((ref = options.errors) != null ? ref.length : void 0) {
      throw new Error(`Parse errors: ${options.errors.map(function(e) {
        return e.message;
      }).join("\n")} `);
    }
    return result;
  };
  makeCache = function() {
    var caches, events;
    caches = /* @__PURE__ */ new Map();
    events = {
      enter: function(ruleName, state) {
        var cache, result;
        cache = caches.get(ruleName);
        if (cache) {
          if (cache.has(state.pos)) {
            result = cache.get(state.pos);
            return {
              cache: result ? { ...result } : void 0
            };
          }
        }
      },
      exit: function(ruleName, state, result) {
        var cache;
        cache = caches.get(ruleName);
        if (!cache && !uncacheable.has(ruleName)) {
          cache = /* @__PURE__ */ new Map();
          caches.set(ruleName, cache);
        }
        if (cache) {
          if (result) {
            cache.set(state.pos, { ...result });
          } else {
            cache.set(state.pos, result);
          }
        }
        if (parse.config.verbose && result) {
          console.log(`Parsed ${JSON.stringify(state.input.slice(state.pos, result.pos))} [pos ${state.pos}-${result.pos}] as ${ruleName}`);
        }
      }
    };
    return events;
  };
  var isCompileError = function(err) {
    return err instanceof Error && [err.message, err.name, err.filename, err.line, err.column, err.offset].every(function(value) {
      return value !== void 0;
    });
  };
  var main_default = { parse, generate: generate_default, util: util_exports, compile, isCompileError };
  return __toCommonJS(main_exports);
})();

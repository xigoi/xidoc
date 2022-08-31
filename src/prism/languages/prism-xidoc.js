const CommandArgs = function (name) {
  this.name = name;
  this.pattern = new RegExp("\\[(" + name + ")\\s");
};
CommandArgs.prototype.exec = function (str) {
  const match = this.pattern.exec(str);
  if (match === null) {
    return null;
  }
  const start = match.index + match[0].length;
  var i = start;
  for (var unclosedCount = 1; unclosedCount > 0 && i < str.length; i++) {
    if (str[i] == "[") {
      unclosedCount++;
    }
    if (str[i] == "]") {
      unclosedCount--;
    }
  }
  if (unclosedCount == 0) {
    i--;
  }
  const end = i;
  const result = [str.slice(start, end)];
  result.index = start;
  return result;
};
Prism.languages.xidoc = {
  string: { pattern: new CommandArgs("raw|[^\\[\\]\\s]*-raw") },
  comment: { pattern: new CommandArgs("#") },
  tag: { pattern: /(\[)[^\s\]]+/, lookbehind: true },
  punctuation: /[[;\]]/,
};

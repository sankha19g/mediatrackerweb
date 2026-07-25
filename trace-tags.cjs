const fs = require('fs');

const code = fs.readFileSync('src/components/CustomLists.jsx', 'utf8');
const lines = code.split('\n');

const targetLines = lines.slice(1187, 1566);
const text = targetLines.join('\n');

const tagRegex = /<\/?([a-zA-Z0-9]+)(?:\s+[^>]*?)?>/g;
const stack = [];
let match;

console.log('Scanning JSX tags from line 1188 to 1566...');
while ((match = tagRegex.exec(text)) !== null) {
  const fullTag = match[0];
  const tagName = match[1].toLowerCase();
  const isClosing = fullTag.startsWith('</');
  const isSelfClosing = fullTag.endsWith('/>') || ['input', 'img', 'br', 'hr'].includes(tagName);

  if (isSelfClosing) continue;

  const currentLineNum = 1188 + text.substring(0, match.index).split('\n').length - 1;

  if (isClosing) {
    if (stack.length === 0) {
      console.log(`[Line ${currentLineNum}] Extra closing tag </${tagName}>`);
    } else {
      const top = stack.pop();
      console.log(`[Line ${currentLineNum}] Popped </${tagName}> (matched <${top.name}> from line ${top.line})`);
      if (top.name !== tagName) {
        console.log(`  ERROR: tag name mismatch!`);
        stack.push(top); // restore
      }
    }
  } else {
    stack.push({ name: tagName, line: currentLineNum });
    console.log(`[Line ${currentLineNum}] Pushed <${tagName}>`);
  }
}

if (stack.length > 0) {
  console.log('Unclosed tags in stack:');
  stack.forEach(t => console.log(`  <${t.name}> opened at line ${t.line}`));
} else {
  console.log('All JSX tags are balanced!');
}

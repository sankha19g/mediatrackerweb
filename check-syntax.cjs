const fs = require('fs');
const { Parser } = require('acorn');
const jsx = require('acorn-jsx');

const JSXParser = Parser.extend(jsx());

try {
  const code = fs.readFileSync('src/components/CustomLists.jsx', 'utf8');
  JSXParser.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
  console.log('No syntax errors found!');
} catch (err) {
  console.error('Syntax error details:', err.message);
  if (err.loc) {
    console.error(`Line: ${err.loc.line}, Column: ${err.loc.column}`);
  }
}

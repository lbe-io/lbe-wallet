import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve('src');
const TOKENS_FILE = path.resolve('src/styles/tokens.css');

const COLOR_LITERAL_PATTERN = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|\btransparent\b|\bwhite\b|\bblack\b|\bcurrentColor\b/g;

// Keep this allowlist intentionally small and explicit.
// Any newly introduced literal color should be reviewed and ideally migrated to tokens.
const ALLOWED_COLOR_LITERALS = new Set([
  'transparent',
  'white',
  'black',
  'currentcolor',
  '#fff',
  '#ffffff',
  '#cc2828',
  '#f53f3f',
  '#b3b3b3',
  '#0067fd',
  '#0067fd14',
  'rgba(0,0,0,0.44)',
  'rgba(15,23,42,0.08)',
  'rgba(17,24,39,0.5)',
  'rgba(34,40,52,0.62)',
  'rgba(37,99,235,0.15)',
  'rgba(255,255,255,0.88)',
]);

const normalize = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')');

const walkCssFiles = (dir, result = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.wxt' || entry.name === '.output') {
        continue;
      }
      walkCssFiles(fullPath, result);
      continue;
    }
    if (path.extname(entry.name).toLowerCase() === '.css') {
      result.push(fullPath);
    }
  }
  return result;
};

const toLineColumn = (text, index) => {
  let line = 1;
  let column = 1;
  for (let i = 0; i < index; i += 1) {
    if (text[i] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
};

const cssFiles = walkCssFiles(ROOT_DIR).filter((filePath) => path.resolve(filePath) !== TOKENS_FILE);
const violations = [];

for (const filePath of cssFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const matches = withoutComments.matchAll(COLOR_LITERAL_PATTERN);
  for (const match of matches) {
    const raw = match[0];
    const normalized = normalize(raw);
    if (ALLOWED_COLOR_LITERALS.has(normalized)) {
      continue;
    }
    const absoluteIndex = match.index ?? 0;
    const { line, column } = toLineColumn(withoutComments, absoluteIndex);
    violations.push({
      file: filePath.replace(/\\/g, '/'),
      line,
      column,
      literal: raw,
    });
  }
}

if (violations.length > 0) {
  console.error('verify-css-colors: found disallowed literal colors. Please use tokens from src/styles/tokens.css.');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line}:${violation.column} -> ${violation.literal}`);
  }
  process.exit(1);
}

console.log(`verify-css-colors: passed (${cssFiles.length} css files checked).`);

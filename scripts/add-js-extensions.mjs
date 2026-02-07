import fs from 'fs';
import path from 'path';

/**
 * For a relative import path, decide the correct ESM path:
 * - If the resolved path in dist is a directory with index.js → use "path/index.js"
 * - Otherwise → use "path.js"
 */
function resolveImportPath(importPath, currentFilePath) {
  if (/\.(js|json)$/.test(importPath)) {
    return importPath;
  }
  const currentDir = path.dirname(currentFilePath);
  const resolvedPath = path.resolve(currentDir, importPath);
  const indexPath = path.join(resolvedPath, 'index.js');
  if (fs.existsSync(resolvedPath)) {
    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory() && fs.existsSync(indexPath)) {
      return importPath + '/index.js';
    }
  }
  return importPath + '.js';
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Add .js (or /index.js for directories) to relative imports that don't have extensions
  content = content.replace(
    /from (['"])(\.[^'"]*?)\1;/g,
    (match, quote, importPath) => {
      if (/\.(js|json)$/.test(importPath)) {
        return match;
      }
      const resolved = resolveImportPath(importPath, filePath);
      return `from ${quote}${resolved}${quote};`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js')) {
      processFile(filePath);
    }
  }
}

walkDir('./dist');

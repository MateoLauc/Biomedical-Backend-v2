import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Add .js to imports that don't have extensions
  content = content.replace(
    /from ['"](\.[^'"]*?)['"];/g,
    (match, importPath) => {
      if (/\.(js|json)$/.test(importPath)) {
        return match;
      }
      return `from '${importPath}.js';`;
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

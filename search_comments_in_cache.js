const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules') {
        results = results.concat(searchDir(filePath, pattern));
      }
    } else {
      if (file.endsWith('.js')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes(pattern)) {
            results.push(filePath);
          }
        } catch(e) {}
      }
    }
  });
  return results;
}

const cacheDir = path.join(__dirname, '.next');
if (fs.existsSync(cacheDir)) {
  console.log('Searching for comment in .next...');
  const matches = searchDir(cacheDir, 'ADD ORDERS MODAL');
  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => {
    console.log(`- ${m}`);
  });
}

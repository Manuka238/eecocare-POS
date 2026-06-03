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
      try {
        const content = fs.readFileSync(filePath);
        if (content.includes(pattern)) {
          results.push({
            path: filePath,
            size: content.length
          });
        }
      } catch(e) {}
    }
  });
  return results;
}

const cacheDir = path.join(__dirname, '.next', 'cache');
if (fs.existsSync(cacheDir)) {
  console.log('Searching .next/cache...');
  const matches = searchDir(cacheDir, Buffer.from('isAddModalOpen'));
  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => {
    console.log(`- ${m.path} (${m.size} bytes)`);
  });
} else {
  console.log('.next/cache directory does not exist.');
}

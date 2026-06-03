const fs = require('fs');

const fileContent = fs.readFileSync('c:\\Users\\Manuka\\Desktop\\eeco-care-pos\\src\\components\\sri-lanka-map-data.ts', 'utf8');

// Parse out locations
const matches = fileContent.match(/name:\s*"([^"]+)",\s*id:\s*"([^"]+)",\s*path:\s*"([^"]+)"/g);

const width = 450;
const height = 793;

console.log("Calibrated District Coordinates (Centroids as Percentages):");
console.log("----------------------------------------------------------");

const districts = [];

for (const match of matches) {
  const nameMatch = match.match(/name:\s*"([^"]+)"/);
  const idMatch = match.match(/id:\s*"([^"]+)"/);
  const pathMatch = match.match(/path:\s*"([^"]+)"/);
  
  if (nameMatch && idMatch && pathMatch) {
    const name = nameMatch[1];
    const id = idMatch[1];
    const path = pathMatch[1];
    
    // We will parse the SVG path tokens properly using a regex that extracts commands and numbers
    const tokens = [];
    const tokenRegex = /([a-df-z])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
    let tokenMatch;
    while ((tokenMatch = tokenRegex.exec(path)) !== null) {
      tokens.push(tokenMatch[0]);
    }
    
    let xCoords = [];
    let yCoords = [];
    
    let currentX = 0;
    let currentY = 0;
    let isFirstMove = true;
    
    let subpathStartX = 0;
    let subpathStartY = 0;
    
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      
      if (token.toLowerCase() === 'm') {
        const isRelative = (token === 'm');
        const xVal = parseFloat(tokens[i+1]);
        const yVal = parseFloat(tokens[i+2]);
        
        if (isFirstMove) {
          // The first move command is always absolute in practice
          currentX = xVal;
          currentY = yVal;
          isFirstMove = false;
        } else {
          if (isRelative) {
            currentX += xVal;
            currentY += yVal;
          } else {
            currentX = xVal;
            currentY = yVal;
          }
        }
        
        subpathStartX = currentX;
        subpathStartY = currentY;
        
        xCoords.push(currentX);
        yCoords.push(currentY);
        
        i += 3;
        
        // Subsequent pairs after an 'm' are treated as implicit relative/absolute line-to commands
        while (i < tokens.length && !isNaN(parseFloat(tokens[i])) && !isNaN(parseFloat(tokens[i+1]))) {
          const px = parseFloat(tokens[i]);
          const py = parseFloat(tokens[i+1]);
          if (isRelative) {
            currentX += px;
            currentY += py;
          } else {
            currentX = px;
            currentY = py;
          }
          xCoords.push(currentX);
          yCoords.push(currentY);
          i += 2;
        }
      } else if (token.toLowerCase() === 'z') {
        // Close path resets current point to start of subpath
        currentX = subpathStartX;
        currentY = subpathStartY;
        i += 1;
      } else {
        // Skip unknown command or just increment
        i += 1;
      }
    }
    
    if (xCoords.length > 0) {
      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      const mapX = Math.round((centerX / width) * 100);
      const mapY = Math.round((centerY / height) * 100);
      
      districts.push({ name, id, mapX, mapY, centerX, centerY });
    }
  }
}

// Print them nicely
console.log(JSON.stringify(districts, null, 2));

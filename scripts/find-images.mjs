import fs from "fs";
import path from "path";

function scanDir(dir, depth = 0) {
  if (depth > 4) return [];
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (file === "node_modules" || file === ".next" || file === ".git") continue;
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file.toLowerCase().includes("image") || file.toLowerCase().includes("cap") || file.toLowerCase().includes("fila")) {
            results.push({ type: "dir", path: fullPath, count: fs.readdirSync(fullPath).length });
          }
          results = results.concat(scanDir(fullPath, depth + 1));
        } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(file)) {
          results.push({ type: "file", path: fullPath, size: stat.size });
        }
      } catch {}
    }
  } catch {}
  return results;
}

console.log("Scanning workspace root:", process.cwd());
const items = scanDir(process.cwd());
console.log("Found items:", items);

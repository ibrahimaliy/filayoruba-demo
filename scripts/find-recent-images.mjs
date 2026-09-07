import fs from "fs";
import path from "path";

function findRecentImages(dir, depth = 0) {
  if (depth > 5) return [];
  let list = [];
  try {
    const entries = fs.readdirSync(dir);
    for (const e of entries) {
      if (e === "node_modules" || e === ".next" || e === ".git") continue;
      const full = path.join(dir, e);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          list = list.concat(findRecentImages(full, depth + 1));
        } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(e)) {
          // Check if modified in the last 2 hours
          const ageMs = Date.now() - stat.mtimeMs;
          if (ageMs < 2 * 60 * 60 * 1000) {
            list.push({ file: full, size: stat.size, mtime: stat.mtime });
          }
        }
      } catch {}
    }
  } catch {}
  return list;
}

const found = findRecentImages("C:\\Users\\ALIY\\Desktop\\New Dev");
console.log(`Found ${found.length} recent images in New Dev:`, found);

const desktopFound = findRecentImages("C:\\Users\\ALIY\\Desktop", 1);
console.log(`Found ${desktopFound.length} recent images directly on Desktop:`, desktopFound);

import fs from "fs";
import path from "path";

function findAnyNewDir(dir, depth = 0) {
  if (depth > 3) return [];
  let list = [];
  try {
    const entries = fs.readdirSync(dir);
    for (const e of entries) {
      if (e === "node_modules" || e === ".next" || e === ".git") continue;
      const full = path.join(dir, e);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          list.push({ dir: full, mtime: stat.mtime, count: fs.readdirSync(full).length });
          list = list.concat(findAnyNewDir(full, depth + 1));
        }
      } catch {}
    }
  } catch {}
  return list;
}

const dirs = findAnyNewDir(process.cwd());
console.log("All current project directories:", dirs);

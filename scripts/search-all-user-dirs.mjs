import fs from "fs";
import path from "path";

const searchRoots = [
  "C:\\Users\\ALIY\\Desktop",
  "C:\\Users\\ALIY\\Downloads",
  "C:\\Users\\ALIY\\Documents",
  "C:\\Users\\ALIY\\Pictures",
  "C:\\Users\\ALIY",
];

console.log("Searching user profile for folders named 'images' or containing cap photos...");

for (const root of searchRoots) {
  try {
    if (!fs.existsSync(root)) continue;
    const entries = fs.readdirSync(root);
    for (const e of entries) {
      if (e === "AppData" || e === "node_modules" || e === ".gemini" || e === ".vscode" || e === "Local Settings") continue;
      const full = path.join(root, e);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (e.toLowerCase() === "images" || e.toLowerCase().includes("cap") || e.toLowerCase().includes("fila")) {
            const files = fs.readdirSync(full);
            console.log(`FOUND matching folder: ${full} (${files.length} files) ->`, files.slice(0, 12));
          }
        }
      } catch {}
    }
  } catch {}
}

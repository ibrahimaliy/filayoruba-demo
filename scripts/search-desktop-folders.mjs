import fs from "fs";
import path from "path";

const candidates = [
  "C:\\Users\\ALIY\\Desktop",
  "C:\\Users\\ALIY\\Downloads",
  "C:\\Users\\ALIY\\Pictures",
  "C:\\Users\\ALIY\\Desktop\\New Dev",
];

for (const base of candidates) {
  try {
    if (fs.existsSync(base)) {
      const items = fs.readdirSync(base);
      for (const item of items) {
        if (item.toLowerCase().includes("image") || item.toLowerCase().includes("cap") || item.toLowerCase().includes("fila")) {
          const p = path.join(base, item);
          console.log(`Matched path: ${p} (isDir: ${fs.statSync(p).isDirectory()})`);
          if (fs.statSync(p).isDirectory()) {
            console.log("Contents:", fs.readdirSync(p));
          }
        }
      }
    }
  } catch (err) {
    console.log(`Error checking ${base}: ${err.message}`);
  }
}

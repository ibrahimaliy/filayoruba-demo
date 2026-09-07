import fs from "fs";
import path from "path";

const possibleDirs = [
  path.resolve(process.cwd(), ".."),
  path.resolve(process.cwd(), "../images"),
  path.resolve(process.cwd(), "images"),
  "C:\\Users\\ALIY\\Desktop\\New Dev\\images",
  "C:\\Users\\ALIY\\Desktop\\images",
  "C:\\Users\\ALIY\\Downloads\\images",
];

for (const dir of possibleDirs) {
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      console.log(`Found directory: ${dir} with ${files.length} items:`, files.slice(0, 15));
    }
  } catch (err) {
    console.log(`Could not read ${dir}: ${err.message}`);
  }
}

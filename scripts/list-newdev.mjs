import fs from "fs";

try {
  const items = fs.readdirSync("C:\\Users\\ALIY\\Desktop\\New Dev");
  console.log("Items in C:\\Users\\ALIY\\Desktop\\New Dev:", items);
} catch (e) {
  console.log("Error:", e.message);
}

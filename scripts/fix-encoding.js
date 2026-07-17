const fs = require("fs");
const path = "src/lib/actions.ts";
let t = fs.readFileSync(path, "latin1");
t = t
  .replace(/\u00B7/g, "-")
  .replace(/\u2014/g, "-")
  .replace(/\u2013/g, "-")
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/\u2026/g, "...")
  .replace(/\u00A0/g, " ")
  .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
fs.writeFileSync(path, t, "utf8");
const b = fs.readFileSync(path);
let bad = 0;
for (let i = 0; i < b.length; i++) if (b[i] > 127) bad++;
console.log("done nonascii=", bad);

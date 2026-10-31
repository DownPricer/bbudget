import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(dir, { recursive: true });

function svg(size) {
  const r = Math.round(size * 0.22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#FCE4EC"/>
      <stop offset="1" stop-color="#F4A4B8"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="${r}" fill="url(#g)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.18}" fill="#fff" opacity="0.9"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.1}" fill="#D4849A"/>
</svg>`;
}

const jobs = [
  [192, "icon-192.png"],
  [512, "icon-512.png"],
  [180, "apple-touch-icon.png"],
];

for (const [size, file] of jobs) {
  await sharp(Buffer.from(svg(size))).png().toFile(path.join(dir, file));
}
console.log("Icons générées dans public/icons");

import sharp from "sharp";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const standardSvg = path.join(root, "scripts/icon-source.svg");
const maskableSvg = path.join(root, "scripts/icon-maskable-source.svg");

async function render(svgPath, size, outPath) {
  await sharp(svgPath).resize(size, size).png().toFile(outPath);
  console.log("wrote", outPath);
}

async function main() {
  await render(standardSvg, 192, path.join(root, "public/icons/icon-192.png"));
  await render(standardSvg, 512, path.join(root, "public/icons/icon-512.png"));
  await render(maskableSvg, 192, path.join(root, "public/icons/icon-maskable-192.png"));
  await render(maskableSvg, 512, path.join(root, "public/icons/icon-maskable-512.png"));
  await render(standardSvg, 180, path.join(root, "src/app/apple-icon.png"));
}

main();

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Hjemskjerm-ikon for iOS (som ikke bruker SVG). Samme juletre som app/icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const svg = await readFile(join(process.cwd(), "app/icon.svg"), "utf8");
// iOS runder hjørnene selv, så vi fjerner avrundingen og lar bakgrunnen gå helt ut.
const square = svg.replace('rx="8"', 'rx="0"');
const src = `data:image/svg+xml;base64,${Buffer.from(square).toString("base64")}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <img src={src} width={180} height={180} alt="" />
    ),
    size,
  );
}

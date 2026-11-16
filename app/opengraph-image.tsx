import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { wishList } from "@/lib/wishes";

// Etter design/Delingsbilde.dc.html (1200×630).
export const alt = "Andreas ønsker seg – bursdag 2. desember og jul";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
const [bricolage800, bricolage600, caveat700] = await Promise.all([
  font("BricolageGrotesque-800.woff"),
  font("BricolageGrotesque-600.woff"),
  font("Caveat-700.woff"),
]);

const BULBS: [string, string][] = [
  ["#FF5A5F", "255, 90, 95"],
  ["#FFC53D", "255, 197, 61"],
  ["#5BD27A", "91, 210, 122"],
  ["#6CC4FF", "108, 196, 255"],
];
const FLAKES = [
  [140, 210, 6], [980, 160, 8], [1080, 330, 5], [860, 420, 6], [1140, 220, 4], [700, 140, 5],
];
const WIRE = "M0 6 " + Array.from({ length: 10 }, (_, i) => `Q${i * 120 + 60} 50 ${(i + 1) * 120} 6`).join(" ");

// Strikkemønster som SVG (Satori støtter ikke gjentatte gradient-bakgrunner godt).
const W = 1200;
const DOTS = Array.from({ length: Math.ceil(W / 18) }, (_, i) => i * 18 + 9);
const ZIG = Array.from({ length: Math.ceil(W / 28) + 1 }, (_, i) => i * 28);

function KnitDots() {
  return (
    <svg width={W} height={12} viewBox={`0 0 ${W} 12`}>
      {DOTS.map((x) => (
        <circle key={x} cx={x} cy={6} r={3} fill="#13294B" />
      ))}
    </svg>
  );
}

function Knit() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <KnitDots />
      <svg width={W} height={28} viewBox={`0 0 ${W} 28`}>
        {ZIG.map((x) => (
          <path key={x} d={`M${x} 0 L${x + 28} 0 L${x + 14} 14 Z M${x - 14} 28 L${x + 14} 28 L${x} 14 Z`} fill="#A3211A" />
        ))}
      </svg>
      <KnitDots />
    </div>
  );
}

export default function Image() {
  const occasion = wishList.occasion.charAt(0).toLocaleLowerCase("nb") + wishList.occasion.slice(1);
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#13294B",
          color: "#FFFFFF",
          fontFamily: "Bricolage",
        }}
      >
        <svg width="1200" height="70" viewBox="0 0 1200 70" style={{ position: "absolute", top: 0, left: 0 }}>
          <path d={WIRE} fill="none" stroke="#4A6587" strokeWidth="3" />
        </svg>
        {Array.from({ length: 10 }, (_, i) => {
          const [hex, rgb] = BULBS[i % 4];
          const left = 60 + i * 120;
          return (
            <div key={i} style={{ position: "absolute", top: 23, left: left - 9, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Sokkel */}
              <div style={{ width: 10, height: 9, borderRadius: 2, background: "#2B3A55" }} />
              <div
                style={{
                  width: 18,
                  height: 27,
                  marginTop: -2,
                  borderRadius: "9px 9px 9px 9px / 11px 11px 16px 16px",
                  background: hex,
                  boxShadow: `0 0 22px 6px rgba(${rgb}, 0.65)`,
                }}
              />
            </div>
          );
        })}
        {FLAKES.map(([x, y, s]) => (
          <div key={`${x}-${y}`} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: s, background: "#FFFFFF", opacity: 0.8 }} />
        ))}

        <div style={{ position: "absolute", left: 80, right: 80, top: 140, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 18, fontFamily: "Caveat", fontWeight: 700, fontSize: 46, color: "#CFE3F5" }}>{occasion}</div>
          <div style={{ fontSize: 128, lineHeight: 0.9, fontWeight: 800, letterSpacing: "-0.04em" }}>Andreas ønsker seg</div>
          <div style={{ marginTop: 26, fontSize: 30, fontWeight: 600, color: "#DCE8F4" }}>Se lista og reserver anonymt</div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", padding: "18px 0 22px", background: "#F6F9FC" }}>
          <Knit />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: bricolage800, weight: 800, style: "normal" },
        { name: "Bricolage", data: bricolage600, weight: 600, style: "normal" },
        { name: "Caveat", data: caveat700, weight: 700, style: "normal" },
      ],
    },
  );
}

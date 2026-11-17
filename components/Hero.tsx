import { getWishList } from "@/lib/wishes";

const BULB_COLORS: [string, string][] = [
  ["#FF5A5F", "255, 90, 95"],
  ["#FFC53D", "255, 197, 61"],
  ["#5BD27A", "91, 210, 122"],
  ["#6CC4FF", "108, 196, 255"],
];
// Rekkefølge og forsinkelser fra designet (14 lys).
const BULB_DELAYS = [0, -0.6, -1.2, -1.8, -0.3, -0.9, -1.5, -2.1, -0.45, -1.05, -1.65, -0.15, -0.75, -1.35];

const FLAKES = [
  { left: 6, size: 5, dur: 10, delay: -3 },
  { left: 16, size: 3, dur: 8, delay: -6 },
  { left: 26, size: 6, dur: 12, delay: -1 },
  { left: 36, size: 4, dur: 9, delay: -7 },
  { left: 48, size: 5, dur: 11, delay: -9 },
  { left: 58, size: 3, dur: 8, delay: -4 },
  { left: 68, size: 6, dur: 13, delay: -2 },
  { left: 78, size: 4, dur: 9, delay: -5 },
  { left: 88, size: 5, dur: 12, delay: -8 },
  { left: 95, size: 3, dur: 10, delay: -1 },
];

const WIRE = Array.from({ length: 14 }, (_, i) => `Q${i * 100 + 50} 30 ${(i + 1) * 100} 4`).join(" ");

function lowerFirst(s: string) {
  return s.charAt(0).toLocaleLowerCase("nb") + s.slice(1);
}

export async function Hero() {
  const wishList = await getWishList();
  return (
    <header className="hero">
      <div className="lights" aria-hidden="true">
        <svg width="100%" height="44" viewBox="0 0 1400 44" preserveAspectRatio="none">
          <path d={`M0 4 ${WIRE}`} fill="none" stroke="#4A6587" strokeWidth="2" />
        </svg>
        {BULB_DELAYS.map((delay, i) => {
          const [hex, rgb] = BULB_COLORS[i % 4];
          return (
            <span
              key={i}
              className="bulb"
              style={{
                left: `${((i + 0.5) / 14) * 100}%`,
                background: hex,
                boxShadow: `0 0 14px 3px rgba(${rgb}, 0.7)`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
      <div aria-hidden="true">
        {FLAKES.map((f, i) => (
          <span
            key={i}
            className="flake"
            style={{
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              animationDuration: `${f.dur}s`,
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="hero-inner">
        <p className="hero-occasion hand">{lowerFirst(wishList.occasion)}</p>
        <h1>Andreas ønsker seg</h1>
        <p className="hero-sub hand">mest varme ting, litt kaffe og et par dingser</p>
      </div>
      <div className="drift" aria-hidden="true" />
    </header>
  );
}

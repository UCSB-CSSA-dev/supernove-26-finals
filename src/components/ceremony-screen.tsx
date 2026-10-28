import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CeremonyVariant = "opening" | "ending";
type Phase = "ready" | "show" | "settled";

/** Length of the full-screen show; everything after it is the gentle floating loop. */
const SHOW = 15;
const GOLD = "oklch(0.87 0.15 88)";
const ORANGE = "oklch(0.75 0.18 55)";
const PURPLE = "oklch(0.66 0.22 305)";
const PALETTE = [GOLD, ORANGE, PURPLE];
const ASPECT = 16 / 9;

const COPY: Record<
  CeremonyVariant,
  { label: { zh: string; en: string }; eyebrow: string; subtitle: string; finale: { zh: string; en: string } }
> = {
  opening: {
    label: { zh: "开场", en: "Opening" },
    eyebrow: "UCSB CSSA presents",
    subtitle: "2026 决赛之夜 · Grand Final",
    finale: { zh: "决赛之夜 · 正式开始", en: "Let the Grand Final begin!" },
  },
  ending: {
    label: { zh: "闭幕", en: "Closing" },
    eyebrow: "Thank you for tonight",
    subtitle: "2026 决赛之夜 · Grand Final",
    finale: { zh: "圆满落幕 · 明年再见", en: "That's a wrap. See you next year!" },
  },
};

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Angle that points a top-mounted beam at x (vw) toward the stage centre. */
function aimAtCentre(x: number): number {
  return (-Math.atan(((50 - x) * ASPECT) / 58) * 180) / Math.PI;
}

const BEAMS = [8, 22, 36, 64, 78, 92].map((x, i) => {
  const side = x < 50 ? 1 : -1;
  return {
    x,
    color: [GOLD, PURPLE, ORANGE, ORANGE, PURPLE, GOLD][i],
    rest: side * (10 + (i % 3) * 6),
    out: side * 62,
    cross: -side * (30 + (i % 3) * 8),
    aim: aimAtCentre(x),
    sway: 6 + i,
  };
});

const NOTES = (() => {
  const random = seeded(26);
  return Array.from({ length: 20 }, (_, i) => {
    const angle = i * 2.39996 + 0.4;
    const radius = 30 + random() * 17;
    const left = Math.min(92, Math.max(6, 50 + Math.cos(angle) * radius * 1.05));
    const top = Math.min(84, Math.max(8, 46 + Math.sin(angle) * radius * 0.85));
    return {
      left,
      top,
      glyph: i % 3,
      color: PALETTE[i % 3],
      size: 3.2 + random() * 3.6,
      tilt: (random() - 0.5) * 40,
      spin: (random() > 0.5 ? 1 : -1) * (180 + random() * 180),
      at: 0.14 + i * 0.013,
      float: 3.5 + random() * 3,
      drift: 1 + random() * 2,
    };
  });
})();

const CONFETTI = (() => {
  const random = seeded(2026);
  return Array.from({ length: 46 }, (_, i) => {
    const angle = random() * Math.PI * 2;
    const distance = 28 + random() * 42;
    return {
      dx: Math.cos(angle) * distance * 1.4,
      dy: Math.sin(angle) * distance * 0.8 - 8,
      fall: 18 + random() * 22,
      spin: (random() - 0.5) * 900,
      color: PALETTE[i % 3],
      star: i % 4 === 0,
      size: 0.9 + random() * 1.4,
    };
  });
})();

function wavePath(amplitude: number, period: number, phase: number, y: number): string {
  let d = "";
  for (let x = 0; x <= 2400; x += 8) {
    const value = y + amplitude * Math.sin((x / period) * Math.PI * 2 + phase);
    d += `${x === 0 ? "M" : " L"}${x} ${value.toFixed(1)}`;
  }
  return d;
}

const STAFF = Array.from({ length: 5 }, (_, i) => wavePath(34, 600, 0, 110 + i * 15));
const MELODY = [wavePath(72, 400, 1.3, 140), wavePath(52, 300, 2.6, 160)];

export function CeremonyScreen({ variant }: { variant: CeremonyVariant }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [run, setRun] = useState(0);
  const copy = COPY[variant];

  useEffect(() => {
    if (phase !== "show") return;
    const timer = window.setTimeout(() => setPhase("settled"), SHOW * 1000);
    return () => window.clearTimeout(timer);
  }, [phase, run]);

  function play() {
    setRun((count) => count + 1);
    setPhase("show");
  }

  return (
    <div className="relative size-full overflow-hidden">
      <motion.div key={run} className="absolute inset-0" initial="ready" animate={phase} aria-hidden>
        <Scene />
      </motion.div>

      <motion.div
        key={`title-${run}`}
        className="absolute inset-0 flex flex-col items-center justify-center pb-[12vh] text-center"
        initial="ready"
        animate={phase}
      >
        <Title copy={copy} />
      </motion.div>

      <AnimatePresence>
        {phase === "ready" ? (
          <motion.div
            key="ready"
            className="absolute inset-0 flex flex-col items-center justify-center pb-[10vh] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.4, filter: "blur(16px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-[clamp(0.8rem,1.4vw,1.1rem)] tracking-[0.5em] text-primary/80 uppercase">
              2026 · Supernova
            </p>
            <h2 className="sn-title mt-3 font-heading text-[clamp(2.5rem,6vw,5rem)] leading-none font-bold">
              {copy.label.zh} · {copy.label.en}
            </h2>
            <PlayButton onClick={play} />
            <p className="mt-8 text-sm tracking-[0.3em] text-foreground/50 uppercase">点击播放 · Press play</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "settled" ? (
          <motion.div
            key="replay"
            className="absolute right-6 bottom-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-foreground/30 hover:text-foreground"
              onClick={play}
            >
              <RotateCcw /> 重播 Replay
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="播放 · Play"
      className="group relative mt-12 grid size-[clamp(7rem,13vw,10rem)] place-items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary/60"
    >
      {[0, 1].map((ring) => (
        <motion.span
          key={ring}
          className="absolute inset-0 rounded-full border-2 border-primary/60"
          animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: ring * 1.2, ease: "easeOut" }}
        />
      ))}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${GOLD}, ${ORANGE}, ${PURPLE}, ${GOLD})` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      <span className="absolute inset-[6%] rounded-full bg-linear-to-br from-amber-200 via-amber-400 to-orange-500 shadow-[0_0_80px_oklch(0.75_0.18_55/0.7),inset_0_-10px_30px_oklch(0.55_0.2_300/0.5)] transition-transform duration-300 group-hover:scale-105" />
      <Play className="relative size-[38%] translate-x-[6%] fill-[oklch(0.25_0.06_300)] text-[oklch(0.25_0.06_300)]" />
    </button>
  );
}

function Scene() {
  return (
    <>
      <motion.div
        className="absolute inset-0 bg-[oklch(0.09_0.03_290)]"
        variants={{
          ready: { opacity: 0.55 },
          show: {
            opacity: [0.55, 0.92, 0.92, 0.62, 0.5],
            transition: { duration: SHOW, times: [0, 0.05, 0.4, 0.55, 1] },
          },
          settled: { opacity: 0.5, transition: { duration: 1 } },
        }}
      />
      <CentreGlow />
      <div className="absolute inset-x-0 bottom-0 h-[38vh] bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,oklch(0.55_0.2_300/0.45),transparent_70%)]" />
      {BEAMS.map((beam, i) => (
        <Beam key={i} beam={beam} index={i} />
      ))}
      <MelodyWaves />
      {NOTES.map((note, i) => (
        <Note key={i} note={note} />
      ))}
      <Microphone side={1} />
      <Microphone side={-1} />
      <Rings />
      <Flash />
      <Confetti />
    </>
  );
}

function CentreGlow() {
  return (
    <motion.div
      className="absolute top-[42%] left-1/2 size-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.85_0.15_80/0.55),oklch(0.6_0.2_300/0.25)_45%,transparent_70%)] blur-2xl"
      variants={{
        ready: { opacity: 0.25, scale: 0.8 },
        show: {
          opacity: [0.25, 0, 0, 1, 0.5, 0.45],
          scale: [0.8, 0.6, 0.6, 1.3, 1, 1],
          transition: { duration: SHOW, times: [0, 0.06, 0.46, 0.52, 0.64, 1] },
        },
        settled: {
          opacity: [null, 0.3],
          scale: [null, 1.08],
          transition: { duration: 4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        },
      }}
    />
  );
}

function Beam({ beam, index }: { beam: (typeof BEAMS)[number]; index: number }) {
  const variants: Variants = {
    ready: {
      rotate: [beam.rest - 6, beam.rest + 6],
      opacity: 0.22,
      transition: {
        rotate: { duration: beam.sway, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        opacity: { duration: 1 },
      },
    },
    show: {
      rotate: [beam.out, beam.out, beam.cross, beam.rest, beam.aim, beam.aim, beam.rest * 0.7, beam.rest * 0.7],
      opacity: [0, 0, 0.95, 0.75, 1, 1, 0.55, 0.5],
      transition: {
        duration: SHOW,
        times: [0, 0.03 + index * 0.012, 0.22, 0.36, 0.48, 0.6, 0.85, 1],
        ease: "easeInOut",
      },
    },
    settled: {
      rotate: [null, beam.rest * 0.7 + (index % 2 ? 5 : -5)],
      opacity: 0.5,
      transition: {
        rotate: { duration: beam.sway, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
        opacity: { duration: 1 },
      },
    },
  };

  return (
    <motion.div
      className="absolute top-[-3vh] flex flex-col items-center mix-blend-screen"
      style={{ left: `${beam.x}%`, x: "-50%", originY: 0 }}
      variants={variants}
    >
      <div className="relative h-[3.4vmin] w-[5.5vmin] rounded-b-[1.4vmin] bg-linear-to-b from-zinc-600 to-zinc-900 shadow-[0_4px_12px_black]">
        <div
          className="absolute -bottom-[0.6vmin] left-1/2 h-[1.2vmin] w-[4vmin] -translate-x-1/2 rounded-full"
          style={{ background: beam.color, boxShadow: `0 0 3vmin 1vmin ${beam.color}` }}
        />
      </div>
      <div
        className="-mt-[0.4vmin] h-[135vh] w-[36vmin] blur-[3px]"
        style={{
          clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0 100%)",
          background: `linear-gradient(to bottom, ${beam.color}, color-mix(in oklch, ${beam.color} 30%, transparent) 45%, transparent 85%)`,
        }}
      />
    </motion.div>
  );
}

function MelodyWaves() {
  const id = useId();
  const draw: Variants = {
    ready: { pathLength: 1, opacity: 0.22 },
    show: {
      pathLength: [0, 0, 1, 1],
      opacity: [0, 0.9, 0.9, 0.6],
      transition: { duration: SHOW, times: [0, 0.1, 0.42, 1], ease: "easeInOut" },
    },
    settled: { pathLength: 1, opacity: 0.55, transition: { duration: 1 } },
  };

  return (
    <svg
      className="absolute inset-x-0 bottom-[10vh] h-[34vh] w-full drop-shadow-[0_0_10px_oklch(0.75_0.18_55/0.6)]"
      viewBox="0 0 1200 300"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${id}-staff`} x1="0" x2="1200" gradientUnits="userSpaceOnUse" spreadMethod="repeat">
          <stop offset="0" stopColor={GOLD} />
          <stop offset="0.33" stopColor={ORANGE} />
          <stop offset="0.66" stopColor={PURPLE} />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <motion.g animate={{ x: [0, -1200] }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }}>
        {STAFF.map((d, i) => (
          <motion.path
            key={`staff-${i}`}
            d={d}
            fill="none"
            stroke={`url(#${id}-staff)`}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            variants={draw}
          />
        ))}
        {MELODY.map((d, i) => (
          <motion.path
            key={`melody-${i}`}
            d={d}
            fill="none"
            stroke={i ? PURPLE : GOLD}
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            variants={draw}
          />
        ))}
      </motion.g>
    </svg>
  );
}

function NoteGlyph({ glyph, color }: { glyph: number; color: string }) {
  return (
    <svg viewBox="0 0 64 60" className="size-full overflow-visible" fill={color}>
      {glyph === 0 ? (
        <>
          <ellipse cx="22" cy="48" rx="12" ry="8.5" transform="rotate(-20 22 48)" />
          <rect x="30" y="6" width="4.5" height="42" rx="2" />
          <path d="M34.5 6c6 9 18 12 14 28-2-9-8-13-14-14z" />
        </>
      ) : glyph === 1 ? (
        <>
          <ellipse cx="13" cy="50" rx="10.5" ry="7.5" transform="rotate(-20 13 50)" />
          <ellipse cx="49" cy="43" rx="10.5" ry="7.5" transform="rotate(-20 49 43)" />
          <rect x="19.5" y="12" width="4.5" height="38" rx="2" />
          <rect x="55.5" y="5" width="4.5" height="38" rx="2" />
          <path d="M19.5 12 60 5v9l-40.5 7z" />
        </>
      ) : (
        <path d="M32 2c2.5 19 11 27.5 30 30-19 2.5-27.5 11-30 30-2.5-19-11-27.5-30-30 19-2.5 27.5-11 30-30z" />
      )}
    </svg>
  );
}

function Note({ note }: { note: (typeof NOTES)[number] }) {
  const dx = `${50 - note.left}vw`;
  const dy = `${44 - note.top}vh`;
  const variants: Variants = {
    ready: { opacity: 0.22, x: 0, y: 0, scale: 0.8, rotate: note.tilt, transition: { duration: 1 } },
    show: {
      opacity: [0, 0, 1, 0.8],
      x: [dx, dx, "0vw", "0vw"],
      y: [dy, dy, "0vh", "0vh"],
      scale: [0.1, 0.1, 1.35, 1],
      rotate: [0, 0, note.tilt + note.spin, note.tilt],
      transition: { duration: SHOW, times: [0, note.at, note.at + 0.12, 0.42 + note.at * 0.3], ease: "easeOut" },
    },
    settled: { opacity: 0.75, x: 0, y: 0, scale: 1, rotate: note.tilt, transition: { duration: 1.2 } },
  };

  return (
    <motion.div
      className="absolute"
      style={{ left: `${note.left}%`, top: `${note.top}%`, width: `${note.size}vmin`, height: `${note.size}vmin` }}
      variants={variants}
    >
      <motion.div
        className="size-full"
        style={{ filter: `drop-shadow(0 0 1.2vmin ${note.color})` }}
        animate={{ y: ["0vmin", `-${note.drift}vmin`, "0vmin"], rotate: [-6, 6, -6] }}
        transition={{ duration: note.float, repeat: Infinity, ease: "easeInOut" }}
      >
        <NoteGlyph glyph={note.glyph} color={note.color} />
      </motion.div>
    </motion.div>
  );
}

function Microphone({ side }: { side: 1 | -1 }) {
  const id = useId();
  const rest = side * 16;
  const offscreen = `${-side * 40}vw`;
  const variants: Variants = {
    ready: { opacity: 0, x: offscreen, y: "30vh", rotate: rest - side * 40, scale: 0.7 },
    show: {
      opacity: [0, 0, 1, 1, 1],
      x: [offscreen, offscreen, `${side * 2}vw`, "0vw", "0vw"],
      y: ["40vh", "40vh", "-4vh", "0vh", "0vh"],
      rotate: [rest - side * 50, rest - side * 50, rest + side * 10, rest, rest],
      scale: [0.6, 0.6, 1.08, 1, 1],
      transition: { duration: SHOW, times: [0, 0.26, 0.42, 0.5, 1], ease: "easeInOut" },
    },
    settled: { opacity: 1, x: 0, y: 0, rotate: rest, scale: 1, transition: { duration: 1 } },
  };

  return (
    <motion.div
      className="absolute bottom-[3vh] h-[42vh]"
      style={side === 1 ? { left: "5vw" } : { right: "5vw" }}
      variants={variants}
    >
      <motion.svg
        viewBox="0 0 120 320"
        className="h-full w-auto drop-shadow-[0_0_3vmin_oklch(0.75_0.18_55/0.55)]"
        animate={{ y: ["0vh", "-1.6vh", "0vh"], rotate: [-2, 2, -2] }}
        transition={{ duration: 5 + (side === 1 ? 0 : 0.8), repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id={`${id}-metal`} x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.5 0.13 55)" />
            <stop offset="0.45" stopColor="oklch(0.93 0.12 90)" />
            <stop offset="1" stopColor="oklch(0.48 0.13 50)" />
          </linearGradient>
          <radialGradient id={`${id}-head`} cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor="oklch(0.85 0.1 305)" />
            <stop offset="0.55" stopColor="oklch(0.45 0.2 300)" />
            <stop offset="1" stopColor="oklch(0.22 0.12 290)" />
          </radialGradient>
          <pattern id={`${id}-mesh`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0H7M0 0V7" stroke="oklch(1 0 0 / 0.35)" strokeWidth="1.1" />
          </pattern>
        </defs>
        <circle cx="60" cy="58" r="50" fill={`url(#${id}-head)`} />
        <circle cx="60" cy="58" r="50" fill={`url(#${id}-mesh)`} />
        <path d="M12 58h96" stroke={`url(#${id}-metal)`} strokeWidth="5" />
        <circle cx="60" cy="58" r="50" fill="none" stroke={`url(#${id}-metal)`} strokeWidth="6" />
        <ellipse cx="40" cy="34" rx="17" ry="9" fill="white" opacity="0.3" transform="rotate(-35 40 34)" />
        <rect x="32" y="104" width="56" height="18" rx="7" fill={`url(#${id}-metal)`} />
        <path d="M37 122h46l-10 178q-13 16-26 0z" fill={`url(#${id}-metal)`} />
        <rect x="54" y="152" width="12" height="28" rx="6" fill={PURPLE} />
        <path d="M49 280h22" stroke="oklch(0.3 0.06 60 / 0.5)" strokeWidth="3" strokeLinecap="round" />
      </motion.svg>
    </motion.div>
  );
}

function Rings() {
  return (
    <>
      {[0.5, 0.74, 0.86].map((at, i) => (
        <motion.div
          key={at}
          className="absolute top-[42%] left-1/2 size-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.6vmin]"
          style={{ borderColor: PALETTE[i], boxShadow: `0 0 4vmin ${PALETTE[i]}, inset 0 0 4vmin ${PALETTE[i]}` }}
          variants={{
            ready: { opacity: 0, scale: 0.2 },
            show: {
              opacity: [0, 0, 0.9, 0, 0],
              scale: [0.2, 0.2, 0.2, 3.4, 3.4],
              transition: { duration: SHOW, times: [0, at - 0.001, at, at + 0.13, 1], ease: "easeOut" },
            },
            settled: { opacity: 0 },
          }}
        />
      ))}
    </>
  );
}

function Flash() {
  return (
    <motion.div
      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,oklch(0.95_0.08_90),oklch(0.75_0.18_55/0.6)_30%,transparent_65%)]"
      variants={{
        ready: { opacity: 0 },
        show: { opacity: [0, 0.85, 0, 0], transition: { duration: SHOW, times: [0, 0.025, 0.12, 1] } },
        settled: { opacity: 0 },
      }}
    />
  );
}

function Confetti() {
  const at = 0.74;
  return (
    <div className="absolute top-[42%] left-1/2">
      {CONFETTI.map((piece, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: `${piece.size}vmin`,
            height: `${piece.star ? piece.size : piece.size * 2}vmin`,
            background: piece.color,
            borderRadius: piece.star ? "50%" : "0.2vmin",
            boxShadow: `0 0 1.5vmin ${piece.color}`,
          }}
          variants={{
            ready: { opacity: 0 },
            show: {
              opacity: [0, 0, 1, 1, 0],
              x: ["0vmin", "0vmin", "0vmin", `${piece.dx}vmin`, `${piece.dx * 1.15}vmin`],
              y: ["0vmin", "0vmin", "0vmin", `${piece.dy}vmin`, `${piece.dy + piece.fall}vmin`],
              rotate: [0, 0, 0, piece.spin, piece.spin * 1.6],
              transition: { duration: SHOW, times: [0, at - 0.001, at, at + 0.08, 1], ease: "easeOut" },
            },
            settled: { opacity: 0 },
          }}
        />
      ))}
    </div>
  );
}

function Title({ copy }: { copy: (typeof COPY)[CeremonyVariant] }) {
  const reveal = (delay: number, duration = 1.1): Variants => ({
    ready: { opacity: 0, y: 24, filter: "blur(12px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { delay, duration, ease: "easeOut" } },
    settled: { opacity: 1, y: 0, filter: "blur(0px)" },
  });

  return (
    <>
      <motion.div
        className="h-[clamp(3.5rem,11vh,7rem)] overflow-hidden mix-blend-screen"
        style={{ aspectRatio: "362 / 193" }}
        variants={{
          ready: { opacity: 0, scale: 0.5, filter: "blur(16px)" },
          show: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { delay: 7.2, duration: 1.3, ease: "backOut" } },
          settled: { opacity: 1, scale: 1, filter: "blur(0px)" },
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.webp`}
          alt=""
          className="h-full max-w-none drop-shadow-[0_0_24px_oklch(0.75_0.17_55/0.7)]"
        />
      </motion.div>
      <motion.p
        className="mt-[2vh] text-[clamp(0.85rem,1.6vw,1.4rem)] tracking-[0.6em] text-primary uppercase"
        variants={reveal(8.1)}
      >
        {copy.eyebrow}
      </motion.p>
      <motion.h2
        className="sn-title mt-[1vh] font-heading text-[clamp(3.5rem,min(10vw,18vh),12rem)] leading-[0.95] font-extrabold drop-shadow-[0_0_40px_oklch(0.75_0.18_55/0.45)]"
        variants={{
          ready: { opacity: 0, scale: 1.15, letterSpacing: "0.22em", filter: "blur(24px)" },
          show: {
            opacity: 1,
            scale: 1,
            letterSpacing: "0.01em",
            filter: "blur(0px)",
            transition: { delay: 8.7, duration: 2.2, ease: [0.16, 1, 0.3, 1] },
          },
          settled: { opacity: 1, scale: 1, letterSpacing: "0.01em", filter: "blur(0px)" },
        }}
      >
        Supernova
      </motion.h2>
      <motion.p
        className="mt-[1.5vh] font-heading text-[clamp(1.25rem,3vw,2.6rem)] font-semibold text-foreground/90"
        variants={reveal(10.6)}
      >
        {copy.subtitle}
      </motion.p>
      <motion.div
        className="mt-[4vh] flex flex-col items-center"
        variants={{
          ready: { opacity: 0, scale: 0.7 },
          show: { opacity: 1, scale: 1, transition: { delay: 12.4, type: "spring", stiffness: 120, damping: 12 } },
          settled: { opacity: 1, scale: 1 },
        }}
      >
        <p className="rounded-full border border-primary/40 bg-[linear-gradient(90deg,oklch(0.75_0.18_55/0.25),oklch(0.55_0.2_300/0.3))] px-[2.5vw] py-[1vh] font-heading text-[clamp(1.25rem,2.6vw,2.4rem)] font-bold text-primary shadow-[0_0_40px_oklch(0.75_0.18_55/0.35)]">
          {copy.finale.zh}
        </p>
        <p className="mt-[1.2vh] text-[clamp(0.9rem,1.6vw,1.4rem)] tracking-wide text-foreground/75">
          {copy.finale.en}
        </p>
      </motion.div>
    </>
  );
}

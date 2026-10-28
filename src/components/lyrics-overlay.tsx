import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { lineAt, type LyricLine } from "@/lib/lyrics";
import { cn } from "cn";

/** Seconds a line stays highlighted after its cue ends, unless the next line starts first. */
const HOLD = 1.2;

type Cursor = { index: number; active: boolean };

export function LyricsOverlay({ lines, position }: { lines: LyricLine[]; position: () => number }) {
  const [cursor, setCursor] = useState<Cursor>({ index: -1, active: false });

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const time = position();
      const index = lineAt(lines, time);
      const active = index >= 0 && time <= lines[index].end + HOLD;
      setCursor((prev) => (prev.index === index && prev.active === active ? prev : { index, active }));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [lines, position]);

  const { index, active } = cursor;
  const previous = active ? index - 1 : index;
  const current = active ? index : -1;
  const next = index + 1;

  return (
    <div className="flex flex-col items-center bg-linear-to-t from-black/90 via-black/70 to-transparent px-[5cqw] pt-[12cqh] pb-[5cqh] text-center">
      <Slot line={lines[previous]} lineKey={previous} className="text-[clamp(1rem,4.5cqh,2.75rem)] text-white/50" />
      <Slot
        line={lines[current]}
        lineKey={current}
        className="my-[1.5cqh] min-h-[1.15em] font-heading text-[clamp(1.75rem,9.5cqh,6rem)] font-bold text-white drop-shadow-[0_0_28px_oklch(0.84_0.14_85/0.65)]"
      />
      <Slot line={lines[next]} lineKey={next} className="text-[clamp(1rem,4.5cqh,2.75rem)] text-white/50" />
    </div>
  );
}

function Slot({ line, lineKey, className }: { line?: LyricLine; lineKey: number; className: string }) {
  return (
    <div className={cn("relative w-full leading-[1.15] text-balance", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {line ? (
          <motion.p
            key={lineKey}
            initial={{ opacity: 0, y: "60%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-60%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {line.text}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

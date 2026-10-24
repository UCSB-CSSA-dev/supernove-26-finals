import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Gavel, ScrollText, Star, Trophy, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "cn";

const CRITERIA = [
  { zh: "节奏", en: "Rhythm", weight: 30, color: "oklch(0.84 0.14 85)" },
  { zh: "音准", en: "Pitch", weight: 30, color: "oklch(0.7 0.18 295)" },
  { zh: "气息", en: "Breath control", weight: 20, color: "oklch(0.75 0.13 235)" },
  { zh: "音乐表现", en: "Musical expression", weight: 15, color: "oklch(0.75 0.18 330)" },
  { zh: "舞台表现", en: "Stage presence", weight: 5, color: "oklch(0.75 0.15 50)" },
];

// Fixed so the "selected" dots look random but never change between renders.
const SEMIFINALISTS = new Set([0, 3, 5, 6, 9, 12, 14, 15, 18, 20, 23, 24, 26, 29, 30, 33, 34, 36, 38, 39]);
const FINALISTS = new Set([1, 2, 6, 7, 9, 10, 13, 15, 16, 18]);

const PAGES: { kicker: string; title: string; visual: () => ReactNode; body: () => ReactNode }[] = [
  {
    kicker: "Last week · 上周回顾",
    title: "40 → 20",
    visual: () => <FortyToTwenty />,
    body: () => (
      <>
        <Bilingual
          en="Last week, 20 winners were selected from 40 contestants."
          zh="上周的初赛中，我们从 40 位选手中选出了 20 位晋级者。"
        />
        <Bilingual
          en="All 20 of them are on stage tonight."
          zh="今晚，这 20 位选手将依次登台演唱。"
        />
      </>
    ),
  },
  {
    kicker: "This week · 本周评分",
    title: "3 位专业评委",
    visual: () => <Judging />,
    body: () => (
      <>
        <Bilingual
          en="This week, we have invited 3 professional judges to score every contestant on five criteria."
          zh="本周我们邀请了 3 位专业评委，从以下五个维度为每位选手打分。"
        />
        <ul className="mt-1 space-y-2.5">
          {CRITERIA.map((item, index) => (
            <li key={item.zh} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3">
              <span className="leading-tight">
                <span className="block font-medium">{item.zh}</span>
                <span className="block text-xs text-muted-foreground">{item.en}</span>
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-white/8">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.weight / 30) * 100}%` }}
                  transition={{ delay: 0.3 + index * 0.12, duration: 0.8, ease: "easeOut" }}
                />
              </span>
              <span className="text-right font-heading font-semibold tabular-nums" style={{ color: item.color }}>
                {item.weight}%
              </span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    kicker: "Today · 今日赛制",
    title: "20 进 10",
    visual: () => <TwentyToTen />,
    body: () => (
      <>
        <Bilingual
          en="Today is the elimination round: 20 contestants become 10."
          zh="今天是淘汰赛，20 位选手中只有 10 位能够晋级。"
        />
        <Bilingual
          en="The 10 winners advance to the Finals next Friday, competing in front of a huge audience."
          zh="晋级的 10 位选手将于下周五登上决赛舞台，在众多观众面前一决高下。"
        />
      </>
    ),
  },
];

export function RulesDialog() {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const current = PAGES[page];
  const last = page === PAGES.length - 1;

  function go(target: number) {
    setDirection(target > page ? 1 : -1);
    setPage(target);
  }

  return (
    <Dialog onOpenChange={(open) => open && go(0)}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="size-10 rounded-full border-primary/40 hover:border-primary"
            title="规则 · Rules"
            aria-label="规则 · Rules"
          >
            <ScrollText className="size-4.5 text-primary" />
          </Button>
        }
      />
      <DialogContent className="overflow-hidden border border-white/10 bg-[oklch(0.17_0.035_285/0.96)] p-0 backdrop-blur-xl sm:max-w-4xl">
        <div className="flex items-center gap-3 border-b border-white/8 px-7 pt-6 pb-4">
          <DialogTitle className="font-heading text-xl">比赛规则 · Competition Rules</DialogTitle>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {String(page + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
          </span>
        </div>
        <DialogDescription className="sr-only">Supernova 2026 semifinal rules</DialogDescription>

        <div className="relative min-h-[26rem] overflow-hidden px-7 py-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]"
            >
              <div className="flex h-[22rem] items-center justify-center rounded-2xl border border-white/8 bg-black/30">
                {current.visual()}
              </div>
              <div className="space-y-4">
                <p className="text-xs tracking-[0.35em] text-primary uppercase">{current.kicker}</p>
                <h3 className="sn-title font-heading text-4xl font-bold">{current.title}</h3>
                {current.body()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-white/8 bg-black/20 px-7 py-4">
          <div className="flex gap-2">
            {PAGES.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Page ${index + 1}`}
                onClick={() => go(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === page ? "w-8 bg-primary" : "w-2 bg-white/25 hover:bg-white/40",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page === 0} onClick={() => go(page - 1)}>
              <ChevronLeft /> 上一页 Back
            </Button>
            {last ? (
              <DialogClose render={<Button className="px-4" />}>
                开始比赛 Let's go <ArrowRight />
              </DialogClose>
            ) : (
              <Button className="px-4" onClick={() => go(page + 1)}>
                下一页 Next <ChevronRight />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Bilingual({ en, zh }: { en: string; zh: string }) {
  return (
    <div className="border-l-2 border-primary/40 pl-3">
      <p className="text-lg leading-snug">{zh}</p>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{en}</p>
    </div>
  );
}

// One elimination cycle: everyone lit → cut → hold the winners → everyone back → repeat.
const ENTRANCE = 0.8;
// Shifts the finals stage's fade-in to start right as the winners finish turning gold.
const STAGE_LAG = 0.9;
const DOT = "oklch(0.75 0.03 285 / 0.55)";
const GOLD = "oklch(0.84 0.14 85)";

function cycle(delay = 0): Transition {
  return { duration: 6, times: [0, 0.15, 0.3, 0.85, 1], repeat: Infinity, ease: "easeInOut", delay: ENTRANCE + delay };
}

function DotField({ count, columns, chosen }: { count: number; columns: number; chosen: Set<number> }) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }, (_, index) => {
        const kept = chosen.has(index);
        const stagger = index * 0.012;
        return (
          <motion.span
            key={index}
            className="relative block size-7"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: stagger, type: "spring", stiffness: 300, damping: 18 }}
          >
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: DOT }}
              animate={
                kept
                  ? {
                      scale: [1, 1, 1.15, 1.15, 1],
                      backgroundColor: [DOT, DOT, GOLD, GOLD, DOT],
                      boxShadow: [
                        "0 0 0px oklch(0.84 0.14 85 / 0)",
                        "0 0 0px oklch(0.84 0.14 85 / 0)",
                        "0 0 18px oklch(0.84 0.14 85 / 0.8)",
                        "0 0 18px oklch(0.84 0.14 85 / 0.8)",
                        "0 0 0px oklch(0.84 0.14 85 / 0)",
                      ],
                    }
                  : { scale: [1, 1, 0.7, 0.7, 1], opacity: [1, 1, 0.15, 0.15, 1] }
              }
              transition={cycle(stagger)}
            />
          </motion.span>
        );
      })}
    </div>
  );
}

function Countdown({ from, to }: { from: number; to: number }) {
  return (
    <div className="flex items-center gap-4 font-heading text-3xl font-bold tabular-nums">
      <span className="text-muted-foreground">{from}</span>
      <motion.span animate={{ x: [-8, -8, 0, 0, -8], opacity: [0, 0, 1, 1, 0] }} transition={cycle(0.2)}>
        <ArrowRight className="size-7 text-primary" />
      </motion.span>
      <motion.span
        className="text-primary"
        animate={{ scale: [0.5, 0.5, 1, 1, 0.5], opacity: [0, 0, 1, 1, 0] }}
        transition={cycle(0.35)}
      >
        {to}
      </motion.span>
    </div>
  );
}

function FortyToTwenty() {
  return (
    <div className="flex flex-col items-center gap-6">
      <DotField count={40} columns={8} chosen={SEMIFINALISTS} />
      <Countdown from={40} to={20} />
    </div>
  );
}

function Judging() {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6">
        {[0, 1, 2].map((judge) => (
          <motion.div
            key={judge}
            className="flex flex-col items-center gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: judge * 0.15, type: "spring", stiffness: 220, damping: 18 }}
          >
            <div className="relative flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
              <UserRound className="size-7 text-primary" />
              <motion.span
                className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                animate={{ rotate: [0, -25, 0] }}
                transition={{ delay: 0.8 + judge * 0.25, duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
              >
                <Gavel className="size-3.5" />
              </motion.span>
            </div>
            <span className="text-xs text-muted-foreground">评委 Judge {judge + 1}</span>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <svg viewBox="0 0 160 160" className="size-44 -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="18" />
          {CRITERIA.map((item, index) => {
            const length = (item.weight / 100) * circumference;
            const start = offset;
            offset += length;
            return (
              <motion.circle
                key={item.zh}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="18"
                strokeDashoffset={-start}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${Math.max(0, length - 2)} ${circumference}` }}
                transition={{ delay: 0.4 + index * 0.18, duration: 0.6, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-bold">100</span>
          <span className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase">points</span>
        </div>
      </div>
    </div>
  );
}

function TwentyToTen() {
  return (
    <div className="flex w-full flex-col items-center gap-5 px-6">
      <DotField count={20} columns={10} chosen={FINALISTS} />
      <Countdown from={20} to={10} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, 10] }}
        transition={cycle(STAGE_LAG)}
        className="relative h-44 w-full overflow-hidden rounded-xl border border-white/8 bg-[linear-gradient(to_bottom,oklch(0.12_0.03_285),oklch(0.2_0.06_295))]"
      >
        <motion.div
          className="absolute -top-6 left-[18%] h-56 w-24 origin-top bg-[linear-gradient(to_bottom,oklch(0.95_0.1_85/0.55),transparent)] blur-sm [clip-path:polygon(45%_0,55%_0,100%_100%,0_100%)]"
          animate={{ rotate: [-18, 14, -18] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-6 right-[18%] h-56 w-24 origin-top bg-[linear-gradient(to_bottom,oklch(0.85_0.12_300/0.55),transparent)] blur-sm [clip-path:polygon(45%_0,55%_0,100%_100%,0_100%)]"
          animate={{ rotate: [16, -16, 16] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute inset-x-[12%] top-12 flex justify-between">
          {Array.from({ length: 10 }, (_, index) => (
            <motion.span
              key={index}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: [-30, -30, 0, 0, -30], opacity: [0, 0, 1, 1, 0] }}
              transition={cycle(STAGE_LAG + 0.6 + index * 0.05)}
            >
              <motion.span
                className="block"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
              >
                <Star className="size-5 fill-amber-300 text-amber-300 drop-shadow-[0_0_6px_oklch(0.84_0.14_85)]" />
              </motion.span>
            </motion.span>
          ))}
        </div>
        <div className="absolute inset-x-[8%] top-[5.5rem] h-3 rounded-[50%] bg-amber-200/25 blur-[2px]" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 pb-2">
          {[18, 22].map((count, row) => (
            <div key={row} className="flex gap-1.5">
              {Array.from({ length: count }, (_, index) => (
                <motion.span
                  key={index}
                  className="block size-2.5 rounded-t-full bg-white/30"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: ((index * 7 + row * 3) % 10) * 0.07 }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="absolute top-2 left-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] tracking-[0.15em] text-amber-200 uppercase">
          <Trophy className="size-3.5" /> Finals · 下周五 Next Friday
        </div>
      </motion.div>
    </div>
  );
}

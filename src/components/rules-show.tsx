import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gavel,
  Heart,
  Medal,
  Repeat,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "cn";

const GOLD = "oklch(0.84 0.14 85)";
const PINK = "oklch(0.75 0.18 330)";

const JUDGES = 3;
const AUTOPLAY_SECONDS = 7;

const SCORE_SPLIT = [
  { zh: "评委评分", en: "Judges' score", short: "评委 Judges", weight: 70, color: GOLD },
  { zh: "观众投票", en: "Audience vote", short: "观众 Audience", weight: 30, color: PINK },
];

const CRITERIA = [
  { zh: "节奏", en: "Rhythm", weight: 30, color: "oklch(0.84 0.14 85)" },
  { zh: "音准", en: "Pitch", weight: 30, color: "oklch(0.7 0.18 295)" },
  { zh: "气息", en: "Breath control", weight: 20, color: "oklch(0.75 0.13 235)" },
  { zh: "音乐表现", en: "Musical expression", weight: 15, color: "oklch(0.75 0.14 165)" },
  { zh: "舞台表现", en: "Stage presence", weight: 5, color: "oklch(0.75 0.15 50)" },
];

// Semifinal running-order positions (0-based) of the 10 contestants who made the Finals.
const FINALISTS = new Set([4, 5, 9, 10, 12, 13, 14, 15, 16, 18]);
// Fixed so the "selected" dots look random but never change between renders.
const TOP_THREE = new Set([1, 4, 8]);
const FAVORITE = 6;

const PAGES: { kicker: string; title: string; visual: () => ReactNode; body: () => ReactNode }[] = [
  {
    kicker: "Last week · 上周回顾",
    title: "20 → 10",
    visual: () => <TwentyToTen />,
    body: () => (
      <>
        <Bilingual
          en="Last week, 10 finalists were selected from 20 contestants."
          zh="上周的复赛中，我们从 20 位选手中选出了 10 位晋级者。"
        />
        <Bilingual
          en="All 10 of them are on stage tonight for the Finals."
          zh="今晚，这 10 位决赛选手将依次登台演唱。"
        />
      </>
    ),
  },
  {
    kicker: "This week · 本周评分",
    title: "评委 + 观众投票",
    visual: () => <ScoreSplit />,
    body: () => (
      <>
        <Bilingual
          en="This week, the final score combines the professional judges' score with the audience vote."
          zh="本周的最终得分由专业评委评分与观众投票共同决定。"
        />
        <ul className="mt-1 space-y-3">
          <ScoreRow
            item={SCORE_SPLIT[0]}
            caption={
              <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                {CRITERIA.map((criterion) => (
                  <li key={criterion.zh} className="flex items-center gap-1 whitespace-nowrap">
                    <span className="size-1.5 rounded-full" style={{ background: criterion.color }} />
                    {criterion.zh}
                    <span className="tabular-nums" style={{ color: criterion.color }}>
                      {criterion.weight}%
                    </span>
                  </li>
                ))}
              </ul>
            }
          >
            <span className="block h-2.5 overflow-hidden rounded-full bg-white/8">
              <motion.span
                className="flex h-full gap-px overflow-hidden rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              >
                {CRITERIA.map((criterion) => (
                  <span
                    key={criterion.zh}
                    className="h-full"
                    style={{ flex: `${criterion.weight} 1 0`, background: criterion.color }}
                  />
                ))}
              </motion.span>
            </span>
          </ScoreRow>
          <ScoreRow
            item={SCORE_SPLIT[1]}
            caption={
              <>
                <span className="block">每位观众从 10 位选手中选 1 位</span>
                <span className="block">Each audience member picks 1 of the 10 singers</span>
              </>
            }
          >
            <span className="flex gap-1.5">
              {Array.from({ length: FINALISTS.size }, (_, singer) =>
                singer === FAVORITE ? (
                  <motion.span
                    key={singer}
                    className="size-2.5 rounded-full"
                    style={{ background: PINK }}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ delay: 1.3, duration: 0.6, repeat: Infinity, repeatDelay: 1.8 }}
                  />
                ) : (
                  <span key={singer} className="size-2.5 rounded-full bg-white/15" />
                ),
              )}
            </span>
          </ScoreRow>
        </ul>
      </>
    ),
  },
  {
    kicker: "Today · 今日赛制",
    title: "前三名 + 最佳人气",
    visual: () => <Finale />,
    body: () => (
      <>
        <Bilingual
          en="Tonight, the final score decides the champion, the runner-up and third place."
          zh="今晚将根据最终得分，决出冠军、亚军和季军。"
        />
        <Bilingual
          en="Outside the top 3, the contestant with the most audience votes wins the Audience Choice award."
          zh="前三名之外，获得观众投票最多的选手将赢得「最佳人气奖」。"
        />
      </>
    ),
  },
];

function RulesSlide({ page, direction }: { page: number; direction: number }) {
  const current = PAGES[page];
  return (
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
  );
}

// Natural size of the slide card; RulesShow scales it to fill whatever space it gets.
const SLIDE_WIDTH = 896;
const SLIDE_HEIGHT = 540;

export function RulesShow() {
  const frame = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplay, setAutoplay] = useState(true);
  const [scale, setScale] = useState(1);

  function go(target: number, forward: boolean) {
    setDirection(forward ? 1 : -1);
    setPage((target + PAGES.length) % PAGES.length);
  }

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => go(page + 1, true), AUTOPLAY_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [autoplay, page]);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / SLIDE_WIDTH, height / SLIDE_HEIGHT));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frame} className="flex size-full items-center justify-center overflow-hidden">
      <div
        className="flex shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.17_0.035_285/0.85)] shadow-[0_0_80px_oklch(0.45_0.2_295/0.35)] backdrop-blur-xl"
        style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${scale})` }}
      >
        <div className="flex min-h-0 flex-1 items-center overflow-hidden px-7 py-6">
          <div className="w-full">
            <RulesSlide page={page} direction={direction} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/8 bg-black/20 px-7 py-3">
          <div className="flex gap-2">
            {PAGES.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Page ${index + 1}`}
                onClick={() => go(index, index > page)}
                className={cn(
                  "relative h-2 overflow-hidden rounded-full transition-all",
                  index === page
                    ? cn("w-8", autoplay ? "bg-white/25" : "bg-primary")
                    : "w-2 bg-white/25 hover:bg-white/40",
                )}
              >
                {autoplay && index === page ? (
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: AUTOPLAY_SECONDS, ease: "linear" }}
                  />
                ) : null}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
              <Repeat className={cn("size-4", autoplay && "text-primary")} />
              自动轮播 Autoplay
              <Switch checked={autoplay} onCheckedChange={setAutoplay} />
            </label>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => go(page - 1, false)} aria-label="上一页 · Previous page">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => go(page + 1, true)} aria-label="下一页 · Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
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

function ScoreRow({
  item,
  caption,
  children,
}: {
  item: (typeof SCORE_SPLIT)[number];
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[6.5rem_1fr] items-center gap-x-3 gap-y-1.5">
      <span className="leading-tight">
        <span className="block font-medium" style={{ color: item.color }}>
          {item.zh}
        </span>
        <span className="block text-xs text-muted-foreground">{item.en}</span>
      </span>
      {children}
      <div className="col-start-2 text-[11px] text-muted-foreground">{caption}</div>
    </li>
  );
}

// One elimination cycle: everyone lit → cut → hold the winners → everyone back → repeat.
const ENTRANCE = 0.8;
// Shifts the finals stage's fade-in to start right as the winners finish lighting up.
const STAGE_LAG = 0.9;
const DOT = "oklch(0.75 0.03 285 / 0.55)";

function cycle(delay = 0): Transition {
  return { duration: 6, times: [0, 0.15, 0.3, 0.85, 1], repeat: Infinity, ease: "easeInOut", delay: ENTRANCE + delay };
}

function glow(color: string, alpha: number) {
  return `0 0 ${alpha ? 18 : 0}px ${color.replace(")", ` / ${alpha})`)}`;
}

function DotField({
  count,
  columns,
  chosen,
  favorite,
}: {
  count: number;
  columns: number;
  chosen: Set<number>;
  favorite?: number;
}) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }, (_, index) => {
        const color = chosen.has(index) ? GOLD : index === favorite ? PINK : null;
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
                color
                  ? {
                      scale: [1, 1, 1.15, 1.15, 1],
                      backgroundColor: [DOT, DOT, color, color, DOT],
                      boxShadow: [glow(color, 0), glow(color, 0), glow(color, 0.8), glow(color, 0.8), glow(color, 0)],
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

function Countdown({ from, to }: { from: number; to: ReactNode }) {
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

function TwentyToTen() {
  return (
    <div className="flex flex-col items-center gap-6">
      <DotField count={20} columns={5} chosen={FINALISTS} />
      <Countdown from={20} to={10} />
    </div>
  );
}

function ScoreSplit() {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-start gap-5">
        {Array.from({ length: JUDGES }, (_, judge) => (
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
            <span className="text-center text-xs leading-tight text-muted-foreground">
              评委
              <br />
              Judge {judge + 1}
            </span>
          </motion.div>
        ))}

        <span className="mt-3.5 font-heading text-2xl text-muted-foreground">+</span>

        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: JUDGES * 0.15, type: "spring", stiffness: 220, damping: 18 }}
        >
          <div
            className="relative flex size-14 items-center justify-center rounded-full border"
            style={{ borderColor: `color-mix(in oklch, ${PINK} 40%, transparent)`, background: `color-mix(in oklch, ${PINK} 10%, transparent)` }}
          >
            <Users className="size-7" style={{ color: PINK }} />
            <motion.span
              className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full text-primary-foreground"
              style={{ background: PINK }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ delay: 1.2, duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
            >
              <Heart className="size-3.5 fill-current" />
            </motion.span>
          </div>
          <span className="text-center text-xs leading-tight text-muted-foreground">
            观众
            <br />
            Audience
          </span>
        </motion.div>
      </div>

      <div className="relative">
        <svg viewBox="0 0 160 160" className="size-44 -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="18" />
          {SCORE_SPLIT.map((item, index) => {
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
                transition={{ delay: 0.4 + index * 0.5, duration: 0.6, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          {SCORE_SPLIT.map((item) => (
            <span key={item.zh} className="flex flex-col items-center leading-none">
              <span className="font-heading text-xl font-bold tabular-nums" style={{ color: item.color }}>
                {item.weight}%
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">{item.short}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const PODIUM = [
  { place: 2, height: "h-12", color: "text-slate-200", reveal: 1 },
  { place: 1, height: "h-16", color: "text-amber-300", reveal: 2 },
  { place: 3, height: "h-9", color: "text-orange-300", reveal: 0 },
];

function Finale() {
  return (
    <div className="flex w-full flex-col items-center gap-5 px-6">
      <DotField count={10} columns={5} chosen={TOP_THREE} favorite={FAVORITE} />
      <Countdown from={10} to="3 + 1" />

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

        <div className="absolute inset-x-[15%] bottom-9 h-2 rounded-[50%] bg-amber-200/25 blur-[2px]" />
        <div className="absolute inset-x-0 bottom-10 flex items-end justify-center gap-1.5">
          {PODIUM.map((step) => (
            <div key={step.place} className="flex w-12 flex-col items-center gap-1">
              <motion.span
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: [-20, -20, 0, 0, -20], opacity: [0, 0, 1, 1, 0] }}
                transition={cycle(STAGE_LAG + 0.7 + step.reveal * 0.2)}
              >
                <motion.span
                  className={cn("block", step.color)}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: step.reveal * 0.2 }}
                >
                  {step.place === 1 ? (
                    <Crown className="size-5 fill-current drop-shadow-[0_0_6px_oklch(0.84_0.14_85)]" />
                  ) : (
                    <Medal className="size-5" />
                  )}
                </motion.span>
              </motion.span>
              <motion.div
                className={cn(
                  "flex w-full origin-bottom justify-center rounded-t-md border border-white/15 bg-white/10 pt-1 font-heading text-sm font-bold",
                  step.height,
                  step.color,
                )}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: [0, 0, 1, 1, 0] }}
                transition={cycle(STAGE_LAG + 0.4 + step.reveal * 0.2)}
              >
                {step.place}
              </motion.div>
            </div>
          ))}

          <div className="ml-5 flex w-12 flex-col items-center gap-1">
            <motion.span
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: [-20, -20, 0, 0, -20], opacity: [0, 0, 1, 1, 0] }}
              transition={cycle(STAGE_LAG + 1.4)}
            >
              <motion.span
                className="block"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="size-5 fill-current drop-shadow-[0_0_6px_oklch(0.75_0.18_330)]" style={{ color: PINK }} />
              </motion.span>
            </motion.span>
            <motion.div
              className="flex h-5 w-full origin-bottom items-center justify-center rounded-t-md border text-[10px]"
              style={{ color: PINK, borderColor: `color-mix(in oklch, ${PINK} 35%, transparent)`, background: `color-mix(in oklch, ${PINK} 15%, transparent)` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 0, 1, 1, 0] }}
              transition={cycle(STAGE_LAG + 1.1)}
            >
              人气
            </motion.div>
          </div>
        </div>

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
          <Trophy className="size-3.5" /> Finals · 今晚 Tonight
        </div>
      </motion.div>
    </div>
  );
}

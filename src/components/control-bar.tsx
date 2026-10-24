import { useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { HardDriveDownload, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { Player } from "@/hooks/use-player";
import { formatTime } from "@/lib/playlist";
import { cn } from "cn";

export function ControlBar({ player, total }: { player: Player; total: number }) {
  const { song, playing, time, volume, source, backupAvailable } = player;
  const [jumpValue, setJumpValue] = useState("");
  const [jumpInvalid, setJumpInvalid] = useState(0);
  const progress = time.duration > 0 ? Math.min(100, (time.current / time.duration) * 100) : 0;
  const mp3 = source === "mp3";
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  function onJumpKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const order = Number.parseInt(jumpValue, 10);
    if (Number.isFinite(order) && player.jump(order)) {
      setJumpValue("");
      event.currentTarget.blur();
    } else {
      setJumpInvalid((count) => count + 1);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl shrink-0">
      <div className="mb-2 flex items-baseline gap-4 px-2">
        <span className="font-heading text-2xl font-bold text-primary tabular-nums">
          #{song ? String(song.order).padStart(2, "0") : "--"}
          <span className="text-base font-medium text-muted-foreground">/{total}</span>
        </span>
        <motion.div
          key={song?.order}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-w-0 items-baseline gap-4"
        >
          <h2 className="truncate font-heading text-2xl font-semibold">《{song?.title ?? "—"}》</h2>
          <p className="truncate text-lg text-foreground/75">歌手 · {song?.singer ?? "—"}</p>
        </motion.div>
        {mp3 ? (
          <span className="ml-auto shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-0.5 text-xs tracking-[0.2em] text-amber-200 uppercase">
            Backup MP3
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-[0_10px_40px_rgb(0_0_0/0.35)] backdrop-blur">
        <div className="relative h-1 bg-white/8">
          <div
            className="absolute inset-y-0 left-0 bg-linear-to-r from-violet-500 via-fuchsia-300 to-amber-200 shadow-[0_0_12px_oklch(0.84_0.14_85/0.6)] transition-[width] duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-5 px-5 py-3">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon-lg" className="rounded-full" onClick={player.back} title="上一首 / 重头播放 · Back">
              <SkipBack />
            </Button>
            <Button
              size="icon-lg"
              className="size-12 rounded-full shadow-[0_0_24px_oklch(0.84_0.14_85/0.45)]"
              onClick={player.toggle}
              title={playing ? "暂停 · Pause" : "播放 · Play"}
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
            </Button>
            <Button
              variant="secondary"
              size="icon-lg"
              className="rounded-full"
              onClick={player.next}
              disabled={!player.canNext}
              title="下一首 · Next"
            >
              <SkipForward />
            </Button>
          </div>
  
          <span className="font-mono text-lg whitespace-nowrap text-foreground/85 tabular-nums">
            {formatTime(time.current)}
            <span className="text-muted-foreground"> / {time.duration > 0 ? formatTime(time.duration) : "--:--"}</span>
          </span>
  
          <div className="flex-1" />
  
          <div className="flex w-36 items-center gap-2">
            <VolumeIcon className="size-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[volume]}
              min={0}
              max={100}
              onValueChange={(value) => player.setVolume(Array.isArray(value) ? value[0] : value)}
              aria-label="音量 Volume"
            />
          </div>
  
          <motion.div
            key={jumpInvalid}
            animate={jumpInvalid ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
            transition={{ duration: 0.35 }}
          >
            <Input
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value.replace(/\D/g, ""))}
              onKeyDown={onJumpKey}
              inputMode="numeric"
              placeholder="#"
              title={`输入 1–${total} 后按回车跳转 · Type a number and press Enter`}
              aria-label="跳转到第几首 Jump to song"
              className="h-8 w-14 shrink-0 border-white/10 bg-white/5 text-center font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/50"
            />
          </motion.div>
  
          <Button
            variant="outline"
            size="icon-lg"
            onClick={player.toggleBackup}
            aria-label={mp3 ? "切换回 YouTube · Back to YouTube" : "备用 MP3 · Backup MP3"}
            disabled={!mp3 && backupAvailable === false}
            title={mp3 ? "切换回 YouTube · Back to YouTube" : "YouTube 出问题时使用 · Use if YouTube fails"}
            className={cn(
              "rounded-full",
              mp3 && "border-amber-300/50 bg-amber-300/15 text-amber-100 hover:bg-amber-300/25 dark:bg-amber-300/15",
            )}
          >
            {mp3 ? <MonitorPlay /> : <HardDriveDownload />}
          </Button>
        </div>
      </div>
    </section>
  );
}

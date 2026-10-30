import { useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Captions, CaptionsOff, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { Player } from "@/hooks/use-player";
import { KIND_NAMES, formatTime } from "@/lib/playlist";
import { cn } from "cn";

function JumpInput({ jump }: { jump: Player["jump"] }) {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(0);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    if (value && jump(value)) {
      setValue("");
      event.currentTarget.blur();
    } else {
      setInvalid((count) => count + 1);
    }
  }

  return (
    <motion.div key={invalid} animate={invalid ? { x: [0, -6, 6, -4, 4, 0] } : undefined} transition={{ duration: 0.35 }}>
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value.replace(/[^0-9a-z]/gi, "").toUpperCase())}
        onKeyDown={onKeyDown}
        placeholder="#"
        title="输入编号（如 3、D1、G2）后按回车跳转 · Type a code like 3, D1 or G2 and press Enter"
        aria-label="跳转到第几首 Jump to song"
        className="h-8 w-14 shrink-0 border-white/10 bg-white/5 text-center font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/50"
      />
    </motion.div>
  );
}

export function ControlBar({ player }: { player: Player }) {
  const { song, playing, time, volume, source, total } = player;
  const progress = time.duration > 0 ? Math.min(100, (time.current / time.duration) * 100) : 0;
  const mp3 = source === "mp3";
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const kindName = song ? KIND_NAMES[song.kind] : null;

  if (song && !player.media) {
    return (
      <section className="mx-auto flex shrink-0 items-center gap-3 opacity-30 transition-opacity focus-within:opacity-100 hover:opacity-100">
        <Button variant="secondary" size="icon-lg" className="rounded-full" onClick={player.back} title="上一项 · Back">
          <SkipBack />
        </Button>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {song.label} · {song.index + 1}/{total}
        </span>
        <Button
          variant="secondary"
          size="icon-lg"
          className="rounded-full"
          onClick={player.next}
          disabled={!player.canNext}
          title="下一项 · Next"
        >
          <SkipForward />
        </Button>
        <JumpInput jump={player.jump} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl shrink-0">
      <div className="mb-2 flex items-baseline gap-4 px-2">
        <span className="font-heading text-2xl font-bold whitespace-nowrap text-primary tabular-nums">
          {song ? (song.kind === "song" ? `#${song.label}` : song.label) : "--"}
          <span className="ml-1.5 text-base font-medium text-muted-foreground">
            {song ? song.index + 1 : "-"}/{total}
          </span>
        </span>
        <motion.div
          key={song?.index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-w-0 items-baseline gap-4"
        >
          <h2 className="truncate font-heading text-2xl font-semibold">
            {song?.title ? `《${song.title}》` : (song?.singer ?? "—")}
          </h2>
          <p className="truncate text-lg text-foreground/75">
            {kindName
              ? song?.title && song.singer !== kindName.zh
                ? `${kindName.zh} · ${song.singer}`
                : `${kindName.zh} · ${kindName.en}`
              : null}
          </p>
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
  
          <div className="flex w-44 items-center gap-2">
            <VolumeIcon className="size-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[volume]}
              min={0}
              max={100}
              onValueChange={(value) => player.setVolume(Array.isArray(value) ? value[0] : value)}
              aria-label="音量 Volume"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-full text-muted-foreground"
              onClick={player.resetVolume}
              disabled={player.volumeIsDefault}
              title="重置本曲音量 · Reset this song's volume"
              aria-label="重置本曲音量 · Reset this song's volume"
            >
              <RotateCcw />
            </Button>
          </div>
  
          <JumpInput jump={player.jump} />

          {player.lyrics.length > 0 ? (
            <Button
              variant="outline"
              size="icon-lg"
              onClick={player.toggleLyrics}
              aria-pressed={player.showLyrics}
              title={player.showLyrics ? "隐藏歌词 · Hide lyrics" : "显示歌词 · Show lyrics"}
              aria-label="歌词 · Lyrics"
              className={cn(
                "rounded-full",
                player.showLyrics && "border-primary/50 bg-primary/15 text-primary hover:bg-primary/25 dark:bg-primary/15",
              )}
            >
              {player.showLyrics ? <Captions /> : <CaptionsOff />}
            </Button>
          ) : null}

          {/* <Button
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
          </Button> */}
        </div>
      </div>
    </section>
  );
}

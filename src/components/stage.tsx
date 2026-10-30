import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Disc3, Music2 } from "lucide-react";
import { LyricsOverlay } from "@/components/lyrics-overlay";
import type { Player } from "@/hooks/use-player";
import { KIND_NAMES, thumbnail, type Song } from "@/lib/playlist";
import { cn } from "cn";

export function Stage({ player }: { player: Player }) {
  const { song, source, started, ended, ytError, ytHost, videoHost, playing, backupAvailable, lyrics, showLyrics } = player;
  const mp3 = source === "mp3";
  const localVideo = source === "video";

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center" style={{ containerType: "size" }}>
      <div
        className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_80px_oklch(0.45_0.2_295/0.45)]"
        style={{ width: "min(100cqw, 100cqh * 16 / 9)" }}
      >
        {/* pointer-events instead of a covering div: YouTube pauses embeds it detects as obscured. */}
        <div
          ref={ytHost}
          className={cn("absolute inset-0 [&_iframe]:pointer-events-none [&_iframe]:size-full", (mp3 || localVideo) && "invisible")}
        />
        <video
          ref={videoHost}
          aria-label={song ? `${song.title || song.singer} performance video` : "Performance video"}
          playsInline
          preload="metadata"
          className={cn("absolute inset-0 size-full object-contain", !localVideo && "invisible")}
        />

        <AnimatePresence initial={false}>
          {song && mp3 ? (
            <Overlay key={`mp3-${song.index}`}>
              <BackupCard song={song} playing={playing} available={backupAvailable} reason={ytError} />
            </Overlay>
          ) : song && ytError ? (
            <Overlay key={`error-${song.index}`}>
              <Poster song={song}>
                <div className="flex items-center gap-3 rounded-full border border-destructive/40 bg-black/60 px-5 py-2 text-destructive">
                  <AlertTriangle className="size-5" />
                  <span>{ytError}</span>
                </div>
                {/* <div className="mt-5 flex gap-3">
                  <Button
                    variant="outline"
                    className="h-10 rounded-full px-4"
                    disabled={!song.link}
                    onClick={() => window.open(song.link, "_blank", "noopener")}
                  >
                    <ExternalLink /> 在浏览器打开 · Open on YouTube
                  </Button>
                  <Button
                    className="h-10 rounded-full px-4"
                    disabled={backupAvailable === false}
                    onClick={player.backupThisSongOnly}
                  >
                    <HardDriveDownload /> 使用备用 MP3 · Use backup MP3
                  </Button>
                </div> */}
                {/* {backupAvailable === false ? (
                  <p className="mt-3 text-sm text-muted-foreground">该曲目没有备用 MP3 · No backup file for this song</p>
                ) : null} */}
              </Poster>
            </Overlay>
          ) : song && ended ? (
            <Overlay key={`ended-${song.index}`}>
              <Poster song={song}>
                <p className="font-heading text-2xl text-primary">演唱结束 · Performance complete</p>
                <p className="mt-2 text-sm text-muted-foreground">点击「下一首」继续 · Press Next to continue</p>
              </Poster>
            </Overlay>
          ) : song && !started ? (
            <Overlay key={`ready-${song.index}`}>
              <Poster song={song}>
                <p className="text-sm tracking-[0.35em] text-primary uppercase">Up next · 准备演唱</p>
              </Poster>
            </Overlay>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {song && showLyrics && lyrics.length > 0 && started && !ended && (mp3 || !ytError) ? (
            <motion.div
              key={`lyrics-${song.index}`}
              className="pointer-events-none absolute inset-x-0 bottom-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <LyricsOverlay lines={lyrics} position={player.position} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

function Poster({ song, children }: { song: Song; children?: ReactNode }) {
  const image = thumbnail(song);
  return (
    <div className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-[oklch(0.12_0.03_285)] text-center">
      {image ? (
        <img src={image} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-45 blur-2xl" />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,oklch(0.45_0.2_295/0.35),oklch(0.12_0.03_285/0.9)_70%)]" />
      <div className="relative flex flex-col items-center px-8">
        <motion.p
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="font-heading text-[clamp(3rem,12cqh,8rem)] leading-none font-bold text-primary drop-shadow-[0_0_30px_oklch(0.84_0.14_85/0.5)] tabular-nums"
        >
          {song.label}
        </motion.p>
        <h2 className="sn-title mt-4 font-heading text-[clamp(2rem,8cqh,5rem)] leading-tight font-bold">
          {song.title || song.singer}
        </h2>
        <p className="mt-2 text-[clamp(1.1rem,4cqh,2.5rem)] text-foreground/85">
          {song.title ? song.singer : `${KIND_NAMES[song.kind].zh} · ${KIND_NAMES[song.kind].en}`}
        </p>
        <div className="mt-6 flex flex-col items-center">{children}</div>
      </div>
    </div>
  );
}

function BackupCard({
  song,
  playing,
  available,
  reason,
}: {
  song: Song;
  playing: boolean;
  available?: boolean;
  reason: string | null;
}) {
  return (
    <Poster song={song}>
      {reason && available !== false ? (
        <p className="mb-4 text-sm text-muted-foreground">YouTube：{reason} — 正在使用备用 MP3 · Playing backup</p>
      ) : null}
      {available === false ? (
        <div className="flex items-center gap-3 rounded-full border border-destructive/40 bg-black/60 px-5 py-2 text-destructive">
          <AlertTriangle className="size-5" />
          <span>该曲目没有备用 MP3 · No backup file for this song</span>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <Disc3
            className={cn("size-12 text-primary/80", playing && "animate-spin")}
            style={{ animationDuration: "3s" }}
          />
          <div aria-hidden className={cn("sn-eq flex h-12 items-end gap-1.5", !playing && "sn-eq-paused")}>
            {Array.from({ length: 14 }, (_, bar) => (
              <span
                key={bar}
                className="block h-full w-2 rounded-full bg-linear-to-t from-violet-500 via-fuchsia-300 to-amber-200"
                style={{ animationDelay: `${-((bar * 0.37) % 1.1)}s`, animationDuration: `${0.8 + ((bar * 0.29) % 0.7)}s` }}
              />
            ))}
          </div>
          <span className="flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs tracking-[0.2em] text-amber-200 uppercase">
            <Music2 className="size-3.5" /> 备用 MP3 · Backup
          </span>
        </div>
      )}
    </Poster>
  );
}

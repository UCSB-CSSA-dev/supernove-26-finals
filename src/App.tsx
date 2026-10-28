import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Backdrop } from "@/components/backdrop";
import { CeremonyScreen } from "@/components/ceremony-screen";
import { ControlBar } from "@/components/control-bar";
import { FullscreenButton } from "@/components/fullscreen-button";
import { RulesShow } from "@/components/rules-show";
import { BlankScreen, LinkScreen } from "@/components/segment-screens";
import { Stage } from "@/components/stage";
import { cn } from "cn";
import { usePlayer } from "@/hooks/use-player";
import { loadPlaylist, type Song } from "@/lib/playlist";

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const player = usePlayer(songs);
  const song = player.song;
  const ceremony = song?.kind === "opening" || song?.kind === "ending";

  useEffect(() => {
    loadPlaylist()
      .then(setSongs)
      .catch((caught: Error) => setError(caught.message));
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate flex h-dvh flex-col overflow-hidden">
        <Backdrop />
        <AnimatePresence>
          {song?.kind === "blank" ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {song && ceremony ? (
            <motion.div
              key={song.index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <CeremonyScreen variant={song.kind === "opening" ? "opening" : "ending"} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <header className="pointer-events-none relative z-10 flex shrink-0 items-center justify-between gap-6 px-6 pt-3 pb-2 [&>*]:pointer-events-auto">
          <div className={cn("flex min-w-0 items-center gap-5 transition-opacity duration-700", ceremony && "opacity-0")}>
            {/* Only the phoenix + wordmark half of the logo; its black caption is unreadable on the dark theme. */}
            <div className="h-14 shrink-0 overflow-hidden" style={{ aspectRatio: "362 / 193" }}>
              <img
                src={`${import.meta.env.BASE_URL}logo.webp`}
                alt="UCSB CSSA"
                className="h-full max-w-none drop-shadow-[0_0_16px_oklch(0.75_0.17_55/0.45)]"
              />
            </div>
            <div className="h-12 w-px shrink-0 bg-linear-to-b from-transparent via-primary/60 to-transparent" />
            <div className="whitespace-nowrap">
              <p className="text-xs tracking-[0.4em] text-primary uppercase">2026 · Finals</p>
              <h1 className="font-heading text-4xl leading-none font-bold">
                <span className="sn-title">Supernova</span> <span className="text-primary">决赛</span>
              </h1>
            </div>
          </div>
          <FullscreenButton />
        </header>

        <main className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col gap-3 px-6 pb-4 [&>*]:pointer-events-auto">
          {error ? (
            <p className="m-auto max-w-xl text-center text-lg text-destructive">
              无法加载歌单 · Could not load the playlist ({error})
            </p>
          ) : (
            <>
              <div className={cn("relative flex min-h-0 flex-1 flex-col", ceremony && "pointer-events-none!")}>
                {/* Stays mounted even when hidden: the YouTube player lives inside it. */}
                <div className={cn("flex min-h-0 flex-1 flex-col", !player.media && "invisible")}>
                  <Stage player={player} />
                </div>
                <AnimatePresence>
                  {song && !player.media && !ceremony ? (
                    <motion.div
                      key={song.index}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {song.kind === "blank" ? (
                        <BlankScreen song={song} />
                      ) : song.kind === "rules" ? (
                        <RulesShow />
                      ) : (
                        <LinkScreen song={song} />
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
              <ControlBar player={player} />
            </>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}

import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { Backdrop } from "@/components/backdrop";
import { ControlBar } from "@/components/control-bar";
import { FullscreenButton } from "@/components/fullscreen-button";
import { RulesDialog } from "@/components/rules-dialog";
import { Stage } from "@/components/stage";
import { usePlayer } from "@/hooks/use-player";
import { loadPlaylist, type Song } from "@/lib/playlist";

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const player = usePlayer(songs);

  useEffect(() => {
    loadPlaylist()
      .then(setSongs)
      .catch((caught: Error) => setError(caught.message));
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate flex h-dvh flex-col overflow-hidden">
        <Backdrop />

        <header className="flex shrink-0 items-center justify-between gap-6 px-6 pt-3 pb-2">
          <div className="flex min-w-0 items-center gap-5">
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
              <p className="text-xs tracking-[0.4em] text-primary uppercase">2026 · Semifinals</p>
              <h1 className="font-heading text-4xl leading-none font-bold">
                <span className="sn-title">Supernova</span> <span className="text-primary">复赛</span>
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <RulesDialog />
            <FullscreenButton />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-3 px-6 pb-4">
          {error ? (
            <p className="m-auto max-w-xl text-center text-lg text-destructive">
              无法加载歌单 · Could not load the playlist ({error})
            </p>
          ) : (
            <>
              <Stage player={player} />
              <ControlBar player={player} total={songs.length} />
            </>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}

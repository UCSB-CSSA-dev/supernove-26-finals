import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Song } from "@/lib/playlist";

export function BlankScreen({ song }: { song: Song }) {
  return (
    <div className="flex size-full flex-col items-center justify-end pb-2 text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <h2 className="sn-title font-heading text-[clamp(1.5rem,3.5vw,3rem)] leading-tight font-bold">
          {song.title || song.singer}
        </h2>
        {song.title ? <p className="mt-1 text-[clamp(1rem,1.75vw,1.5rem)] text-foreground/80">{song.singer}</p> : null}
      </motion.div>
    </div>
  );
}

export function LinkScreen({ song }: { song: Song }) {
  return (
    <div className="flex size-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <Button
          className="h-auto gap-4 rounded-full px-12 py-6 font-heading text-[clamp(1.75rem,4vw,3rem)] font-bold shadow-[0_0_60px_oklch(0.84_0.14_85/0.5)] [&_svg:not([class*='size-'])]:size-[0.8em]"
          disabled={!song.link}
          onClick={() => window.open(song.link, "_blank", "noopener")}
        >
          {song.singer}
          <ExternalLink />
        </Button>
      </motion.div>
    </div>
  );
}

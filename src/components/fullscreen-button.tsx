import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FullscreenButton() {
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggle() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  }

  return (
    <Button
      variant="outline"
      className="size-10 rounded-full border-primary/40 hover:border-primary"
      onClick={toggle}
      title={fullscreen ? "退出全屏 · Exit full screen" : "全屏 · Full screen"}
      aria-label={fullscreen ? "退出全屏 · Exit full screen" : "全屏 · Full screen"}
    >
      {fullscreen ? <Minimize className="size-4.5 text-primary" /> : <Maximize className="size-4.5 text-primary" />}
    </Button>
  );
}

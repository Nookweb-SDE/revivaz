/* Vídeo mudo que toca sozinho quando chega na tela e pausa quando sai, para
   não gastar bateria nem dado fora da vista. Sem `loop`, toca uma vez e para
   no último quadro. Movimento reduzido: não toca, mostra só o pôster. */
import { useEffect, useRef, type CSSProperties } from "react";

type Props = {
  src: string;
  poster: string;
  /** pôster mostrado com movimento reduzido (ex.: o quadro final) */
  posterParado?: string;
  loop?: boolean;
  preload?: "auto" | "metadata" | "none";
  label?: string;
  style?: CSSProperties;
};

export function VideoAoVer({ src, poster, posterParado, loop = false, preload = "metadata", label, style }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const parado = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const v = ref.current;
    if (!v || parado) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!loop && v.ended) return;
        // play() rejeita se o navegador barrar autoplay: fica o pôster, sem erro no console
        v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    }, { threshold: 0.45 });
    io.observe(v);
    return () => io.disconnect();
  }, [loop, parado]);

  return (
    <video
      ref={ref}
      src={parado ? undefined : src}
      poster={parado && posterParado ? posterParado : poster}
      muted playsInline loop={loop} preload={parado ? "none" : preload}
      disablePictureInPicture
      aria-label={label} aria-hidden={label ? undefined : true}
      style={style}
    />
  );
}

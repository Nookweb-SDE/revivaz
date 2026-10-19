import React from "react";
import { Composition } from "remotion";
import { HeroSequence, FPS, TOTAL } from "./HeroSequence";
import { HeroMobile, FPS_M, TOTAL_M } from "./HeroMobile";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HeroSequence"
      component={HeroSequence}
      durationInFrames={TOTAL}
      fps={FPS}
      width={2560}
      height={1440}
    />
    <Composition
      id="HeroMobile"
      component={HeroMobile}
      durationInFrames={TOTAL_M}
      fps={FPS_M}
      width={720}
      height={1280}
    />
  </>
);

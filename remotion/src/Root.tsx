import React from "react";
import { Composition } from "remotion";
import { HeroSequence, FPS, TOTAL } from "./HeroSequence";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="HeroSequence"
    component={HeroSequence}
    durationInFrames={TOTAL}
    fps={FPS}
    width={2560}
    height={1440}
  />
);

import React from 'react';

interface SilkBackgroundProps {
  speed?: number;
  scale?: number;
  noiseIntensity?: number;
  rotation?: number;
  color?: string;
  accentColor?: string;
  style?: React.CSSProperties;
}

const SilkBackground: React.FC<SilkBackgroundProps> = ({
  speed = 1.0,
  scale = 0.5,
  noiseIntensity = 0.7,
  rotation = 0,
  color = 'rgb(80, 149, 140)',
  accentColor = 'rgb(255, 213, 183)',
  style = {}
}) => {
  return (
    <div
      className="silk-background"
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style
      }}
    />
  );
};

export default SilkBackground;

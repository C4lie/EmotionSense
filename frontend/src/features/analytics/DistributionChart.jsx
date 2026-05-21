import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export const DistributionChart = ({ distribution }) => {
  if (!distribution) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No distribution metrics available.
      </div>
    );
  }

  // Map 7 emotions to Chart structure
  const data = [
    { name: "Happy", score: distribution.happy || 0 },
    { name: "Surprise", score: distribution.surprise || 0 },
    { name: "Disgust", score: distribution.disgust || 0 },
    { name: "Angry", score: distribution.angry || 0 },
    { name: "Sad", score: distribution.sad || 0 },
    { name: "Fear", score: distribution.fear || 0 },
    { name: "Neutral", score: distribution.neutral || 0 },
  ];

  // Custom tooltips to match glassmorphism aesthetics
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="rounded-lg border border-white/10 bg-black/85 p-2.5 shadow-xl backdrop-blur-md text-xs">
          <span className="font-semibold text-muted-foreground capitalize">{entry.name}: </span>
          <span className="font-bold text-primary">{Math.round(entry.value)}%</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" radius="70%" data={data}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 8 }}
            stroke="transparent"
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Expression Probability"
            dataKey="score"
            stroke="var(--color-primary, #6366f1)"
            fill="var(--color-primary, #6366f1)"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default DistributionChart;

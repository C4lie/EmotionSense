import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const MoodTimeline = ({ data }) => {
  // Format the dates for the XAxis labels (e.g. "May 21")
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    } catch (e) {
      return dateStr;
    }
  };

  // Custom tooltips to match glassmorphism aesthetics
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="rounded-lg border border-white/10 bg-black/80 p-3 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-muted-foreground">{formatDate(label)}</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-4 justify-between text-sm">
              <span className="text-white">Dominant expression:</span>
              <span className="font-bold text-primary capitalize">{pointData.dominant_emotion}</span>
            </div>
            <div className="flex items-center gap-4 justify-between text-xs text-muted-foreground">
              <span>Avg confidence:</span>
              <span className="font-semibold text-white">{Math.round(pointData.average_confidence)}%</span>
            </div>
            <div className="flex items-center gap-4 justify-between text-xs text-muted-foreground">
              <span>Sessions recorded:</span>
              <span className="font-semibold text-white">{pointData.session_count}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No timeline data available for the selected range.
      </div>
    );
  }

  // Pre-process timeline points for rendering
  // We want to map dominant_emotion into a numerical value for visual progression:
  // Happy (100), Surprise (70), Neutral (50), Sad (20), Fear/Other (10)
  const emotionWeights = {
    happy: 100,
    surprise: 70,
    neutral: 50,
    sad: 20,
    fear: 10,
    angry: 5,
    disgust: 5,
  };

  const chartData = data.map((point) => ({
    ...point,
    moodVal: emotionWeights[point.dominant_emotion.toLowerCase()] || 50,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={10}
            dy={10}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 50, 70, 100]}
            tickFormatter={(val) => {
              if (val === 100) return "HAPPY";
              if (val === 70) return "SURPRISE";
              if (val === 50) return "NEUTRAL";
              if (val === 20) return "SAD";
              return "";
            }}
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={9}
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
          <Area
            type="monotone"
            dataKey="moodVal"
            stroke="var(--color-primary, #6366f1)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMood)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default MoodTimeline;

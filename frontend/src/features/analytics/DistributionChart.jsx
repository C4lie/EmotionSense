import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const EMOTION_COLORS = {
  Happy: "#10b981",    // emerald-500
  Surprise: "#f59e0b", // amber-500
  Disgust: "#ec4899",  // pink-500
  Angry: "#ef4444",    // red-500
  Sad: "#3b82f6",      // blue-500
  Fear: "#8b5cf6",     // violet-500
  Neutral: "#71717a",  // zinc-500
};

export const DistributionChart = ({ distribution }) => {
  if (!distribution) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No distribution metrics available.
      </div>
    );
  }

  const rawData = [
    { name: "Happy", value: distribution.happy || 0 },
    { name: "Surprise", value: distribution.surprise || 0 },
    { name: "Disgust", value: distribution.disgust || 0 },
    { name: "Angry", value: distribution.angry || 0 },
    { name: "Sad", value: distribution.sad || 0 },
    { name: "Fear", value: distribution.fear || 0 },
    { name: "Neutral", value: distribution.neutral || 0 },
  ];

  // Filter out emotions with 0% probability to keep chart clean
  const chartData = rawData.filter(item => item.value > 0);

  // If no data points are present at all (all 0), show a default Neutral representation
  const hasData = chartData.length > 0;
  const finalData = hasData ? chartData : [{ name: "No Data", value: 100 }];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 shadow-md text-xs">
          <span className="font-semibold text-muted-foreground capitalize">{entry.name}: </span>
          <span className="font-bold text-zinc-200">{hasData ? `${Math.round(entry.value)}%` : "0%"}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full flex flex-col items-center justify-center">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={finalData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={hasData ? 4 : 0}
              dataKey="value"
            >
              {finalData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={hasData ? EMOTION_COLORS[entry.name] : "#27272a"} 
                  stroke="rgba(24, 24, 27, 0.8)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Container */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2 max-w-sm text-xs">
        {hasData ? (
          chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5 bg-zinc-900/60 px-2 py-1 rounded border border-zinc-850">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: EMOTION_COLORS[entry.name] }}
              />
              <span className="text-zinc-300 font-medium text-[11px]">{entry.name} ({Math.round(entry.value)}%)</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            <span className="text-zinc-500 font-medium">No recorded emotional active states.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributionChart;

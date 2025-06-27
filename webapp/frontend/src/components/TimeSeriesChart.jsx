// src/components/TimeSeriesChart.jsx
import React from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

/* Helper : transforme features → {date:count}; décale +1 an si shift=true */
const toCounts = (features = [], shiftYear) => {
  const out = {};
  features.forEach(f => {
    const raw = f.properties?.CMPLNT_FR_DT;
    if (!raw) return;
    const d = new Date(raw);
    if (shiftYear) d.setFullYear(d.getFullYear() + 1);    // aligne la série -1 an
    const key = d.toISOString().slice(0, 10);
    out[key] = (out[key] || 0) + 1;
  });
  return out;
};

export default function TimeSeriesChart({ data }) {
  const curFeatures  = data.current?.features   || [];
  const prevFeatures = data.previous?.features  || [];

  const countsCur  = toCounts(curFeatures,  false);
  const hasPrev    = prevFeatures.length > 0;            // ← courbe 2 uniquement si data
  const countsPrev = hasPrev ? toCounts(prevFeatures, true) : {};

  const allDates = Array.from(new Set([
    ...Object.keys(countsCur),
    ...Object.keys(countsPrev)
  ])).sort();

  const series = allDates.map(d => ({
    date: d,
    current:  countsCur[d]  || 0,
    previous: countsPrev[d] || 0
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={series}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        {/* courbe année courante */}
        <Line
          dataKey="current"
          type="monotone"
          strokeWidth={2}
          dot={false}
        />
        {/* courbe année précédente, seulement si comparePrev est activé */}
        {hasPrev && (
          <Line
            dataKey="previous"
            type="monotone"
            stroke="#ff9800"     /* orange */
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

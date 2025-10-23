import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function OvertimeChart({ data }) {
  const chartData = Object.keys(data).map((name) => ({ name, overtime: data[name] }));
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="overtime" fill="#4f46e5">
          {chartData.map((entry, index) => (
            <Cell key={index} fill="#4f46e5" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
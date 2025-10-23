import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import dynamic from "next/dynamic";

const OvertimeChart = dynamic(() => import("../components/OvertimeChart"), { ssr: false });

export default function Dashboard() {
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [data, setData] = useState({});

  const parseAttendance = (text) => {
    const lines = text.split("\n").slice(1);
    const result = {};
    lines.forEach((line) => {
      const match = line.match(/\d+\.(.+)\/(.+)/);
      if (match) {
        const name = match[1].trim();
        const time = match[2].trim();
        if (!["休", "事假", "年假"].includes(time)) result[name] = time;
      }
    });
    return result;
  };

  const calculateOvertime = (startTimes, endTimes) => {
    const result = {};
    Object.keys(startTimes).forEach((name) => {
      const start = startTimes[name];
      const end = endTimes[name];
      if (!end) return;
      const startH = parseInt(start.split(":")[0]);
      const endH = parseInt(end.split(":")[0]);
      let ot = 0;
      if (endH > 16) ot += endH - 16;
      result[name] = ot;
    });
    return result;
  };

  const handleParse = () => {
    const startTimes = parseAttendance(startText);
    const endTimes = parseAttendance(endText);
    const overtime = calculateOvertime(startTimes, endTimes);
    setData(overtime);
  };

  const handleSave = async () => {
    const monthId = "2025-10";
    const monthRef = doc(db, "overtime", monthId);
    const docSnap = await getDoc(monthRef);
    const monthData = docSnap.exists() ? docSnap.data() : {};
    for (const name in data) {
      if (!monthData[name]) monthData[name] = { total: 0, overtime: {} };
      monthData[name].overtime["2025-10-23"] = data[name];
      monthData[name].total = Object.values(monthData[name].overtime).reduce((a, b) => a + b, 0);
    }
    await setDoc(monthRef, monthData);
    alert("Đã lưu dữ liệu lên Firebase");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Quản lý tăng ca</h1>
      <textarea
        rows={6}
        className="w-full border p-2 mb-2"
        placeholder="Dán dữ liệu lên ca"
        value={startText}
        onChange={(e) => setStartText(e.target.value)}
      />
      <textarea
        rows={6}
        className="w-full border p-2 mb-2"
        placeholder="Dán dữ liệu xuống ca"
        value={endText}
        onChange={(e) => setEndText(e.target.value)}
      />
      <button
        onClick={handleParse}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Kiểm tra
      </button>
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 ml-2"
      >
        Lưu
      </button>
      <div className="mt-8">
        <OvertimeChart data={data} />
      </div>
    </div>
  );
}
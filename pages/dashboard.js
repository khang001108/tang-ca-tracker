import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import dynamic from "next/dynamic";

const OvertimeChart = dynamic(() => import("../components/OvertimeChart"), {
  ssr: false,
});

export default function Dashboard() {
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [data, setData] = useState({});
  const [showModal, setShowModal] = useState(false);

  // 🔹 Cấm cuộn nền khi popup mở
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
  }, [showModal]);

  // ====== Tách dữ liệu chấm công (không bỏ dòng đầu, bỏ dòng rỗng, xử lý khoảng trắng) ======
  const parseAttendance = (text) => {
    if (!text) return {};
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const result = {};
    const re = /^\s*\d+\.\s*([^\/]+)\/\s*([\d]{1,2}:[\d]{2})/;

    lines.forEach((line) => {
      const match = line.match(re);
      if (match) {
        const name = match[1].trim();
        const time = match[2].trim();
        if (!["休", "事假", "年假"].includes(time)) result[name] = time;
      }
    });
    return result;
  };

  // ====== Tính giờ tăng ca (chuẩn theo ca sớm / muộn) ======
  const calculateOvertime = (startTimes, endTimes) => {
    const result = {};
    Object.keys(startTimes).forEach((name) => {
      const start = startTimes[name];
      const end = endTimes[name];
      if (!start || !end) return;

      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);

      // 🔹 Ca sớm: vào < 7:45 → 7–16
      // 🔹 Ca muộn: vào ≥ 7:45 → 8–17
      const isEarlyShift = startH < 7 || (startH === 7 && startM < 45);
      const workStartH = isEarlyShift ? 7 : 8;
      const workEndH = workStartH + 9;

      const endWorkMin = workEndH * 60;
      const endMin = endH * 60 + endM;

      let overtime = 0;
      if (endMin > endWorkMin) {
        overtime = (endMin - endWorkMin) / 60;
        overtime = Math.floor(overtime * 4) / 4; // làm tròn 0.25h
      }

      result[name] = overtime;
    });

    return result;
  };

  // ====== Khi bấm “Kiểm tra” ======
  const handleParse = (e) => {
    e.preventDefault();
    const startTimes = parseAttendance(startText);
    const endTimes = parseAttendance(endText);
    const overtime = calculateOvertime(startTimes, endTimes);
    setData(overtime);
    setShowModal(true);
  };

  // ====== Lưu dữ liệu lên Firebase ======
  const handleSave = async () => {
    const monthId = "2025-10";
    const monthRef = doc(db, "overtime", monthId);
    const docSnap = await getDoc(monthRef);
    const monthData = docSnap.exists() ? docSnap.data() : {};

    for (const name in data) {
      if (!monthData[name]) monthData[name] = { total: 0, overtime: {} };
      monthData[name].overtime["2025-10-23"] = data[name];
      monthData[name].total = Object.values(monthData[name].overtime).reduce(
        (a, b) => a + b,
        0
      );
    }

    await setDoc(monthRef, monthData);
    setShowModal(false);
    alert("✅ Đã lưu dữ liệu lên Firebase!");
  };

  // ====== Cho phép sửa tên hoặc giờ trong popup ======
  const handleEdit = (oldName, field, newValue) => {
    setData((prev) => {
      const updated = { ...prev };

      if (field === "name") {
        if (!oldName || !(oldName in updated)) return prev;
        const value = updated[oldName];
        delete updated[oldName];
        updated[newValue.trim()] = value;
      } else if (field === "hour") {
        const num = parseFloat(newValue);
        if (!isNaN(num) && num >= 0) updated[oldName] = num;
      }

      return updated;
    });
  };

  // ====== JSX ======
  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center py-8 transition-all">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
          📊 Quản lý tăng ca
        </h1>

        <h2 className="text-xl font-semibold mb-4 text-left text-orange-700">
          Nhập dữ liệu lên ca
        </h2>
        <textarea
          rows={5}
          className="w-full border rounded p-2 mb-3"
          placeholder="Dán dữ liệu LÊN CA..."
          value={startText}
          onChange={(e) => setStartText(e.target.value)}
        />

        <h2 className="text-xl font-semibold mb-4 text-left text-orange-700">
          Nhập dữ liệu xuống ca
        </h2>
        <textarea
          rows={5}
          className="w-full border rounded p-2 mb-4"
          placeholder="Dán dữ liệu XUỐNG CA..."
          value={endText}
          onChange={(e) => setEndText(e.target.value)}
        />

        <div className="flex justify-center">
          <button
            onClick={handleParse}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow"
          >
            Kiểm tra
          </button>
        </div>

        <div className="mt-10">
          <OvertimeChart data={data} />
        </div>
      </div>

      {/* ===== POPUP ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 scale-100 animate-slideUp">
            <h2 className="text-2xl font-semibold mb-4 text-center text-orange-700">
              ✅ Kết quả tăng ca
            </h2>

            <div className="max-h-60 overflow-y-auto border rounded">
              <table className="w-full text-center border-collapse">
                <thead className="bg-orange-200 sticky top-0">
                  <tr>
                    <th className="border p-2">Tên nhân viên</th>
                    <th className="border p-2">Giờ tăng ca</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data).map(([name, hour]) => (
                    <tr key={name} className="hover:bg-orange-50">
                      <td
                        contentEditable
                        suppressContentEditableWarning
                        className="border p-2 focus:bg-yellow-100"
                        onBlur={(e) =>
                          handleEdit(name, "name", e.target.textContent)
                        }
                      >
                        {name}
                      </td>
                      <td
                        contentEditable
                        suppressContentEditableWarning
                        className="border p-2 focus:bg-yellow-100"
                        onBlur={(e) =>
                          handleEdit(name, "hour", e.target.textContent)
                        }
                      >
                        {hour}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center mt-6 space-x-4">
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow"
              >
                Xác nhận lưu
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg shadow"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

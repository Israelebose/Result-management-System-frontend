import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useApi, useDetails } from "../context/ContextProvider";
import { useNavigate } from "react-router-dom";

const gradeToPoint = (grade) => {
  if (!grade) return 0;
  if (grade === "A") return 5;
  if (grade === "B") return 4;
  if (grade === "C") return 3;
  if (grade === "D") return 2;
  return 0;
};

// ✅ Helper: Calculate TCF, TCP, TCR for a semester
const calcSemesterStats = (courseRows) => {
  let totalReg = 0; // TCR
  let totalPassed = 0; // TCP
  let totalFailed = 0; // TCF

  courseRows.forEach((c) => {
    const unit = Number(c.credits) || 1;
    totalReg += unit;
    const pt = gradeToPoint(c.Grade);
    if (pt === 0) totalFailed += unit;
    else totalPassed += unit;
  });

  return { TCF: totalFailed, TCP: totalPassed, TCR: totalReg };
};

const CaResultManagement = () => {
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("both");
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [coursesFirst, setCoursesFirst] = useState([]);
  const [coursesSecond, setCoursesSecond] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const navigate = useNavigate();
  const { userData, setSuccess, setErrors } = useDetails();

  useEffect(() => {
    if (!userData.role || userData.role !== "course_adviser") {
      setErrors("Unauthorized. Please log in again.");
      navigate("/login");
      return;
    }
    const fetchSessions = async () => {
      try {
        const res = await api.get("/get/adviser/sessions");
        const sess = res.data.sessions || [];
        setSessions(sess);
        if (sess.length > 0) setSelectedSection(sess[0]);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await api.get("/get/adviser/results", {
          params: { session: selectedSection },
        });
        const payload = res.data || {};
        setCoursesFirst(payload.courses?.first || []);
        setCoursesSecond(payload.courses?.second || []);
        setStudents(payload.students || []);
      } catch (err) {
        console.error("Error fetching adviser results:", err);
        setStudents([]);
        setCoursesFirst([]);
        setCoursesSecond([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [selectedSection]);

  const calcCGPA = (student) => {
    const all = [...(student.firstSem || []), ...(student.secondSem || [])];
    let totalPoints = 0;
    let totalUnits = 0;
    all.forEach((c) => {
      const unit = Number(c.credits) || 1;
      const pt = gradeToPoint(c.Grade);
      totalPoints += pt * unit;
      totalUnits += unit;
    });
    return totalUnits ? (totalPoints / totalUnits).toFixed(2) : "-";
  };

  const calcGeneralStats = (student) => {
    const all = [...(student.firstSem || []), ...(student.secondSem || [])];
    return calcSemesterStats(all);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF("l", "pt", "a4");
    doc.setFontSize(12);
    doc.text(
      `University of Benin - Examination Record Sheet (${selectedSection})`,
      40,
      30
    );

    const firstCols = coursesFirst.map((c) => c.courseCode);
    const secondCols = coursesSecond.map((c) => c.courseCode);

    const headers = [
      "S/N",
      "Matric No",
      "Repeat Courses",
      "Repeat Grades",
      ...firstCols,
      "TCF(1st)",
      "TCP(1st)",
      "TCR(1st)",
      ...secondCols,
      "TCF(2nd)",
      "TCP(2nd)",
      "TCR(2nd)",
      "General TCF",
      "General TCP",
      "General TCR",
      "Carried Courses",
      "CGPA",
    ];

    const body = students.map((s, i) => {
      const repeatsStr = (s.repeats || []).map((r) => r.courseCode).join(", ");
      const repeatsGradesStr = (s.repeats || []).map((r) => r.Grade).join(", ");
      const rowFirst = coursesFirst.map((c) => {
        const found = (s.firstSem || []).find(
          (x) => x.courseCode === c.courseCode
        );
        return found ? found.Grade || "-" : "-";
      });
      const rowSecond = coursesSecond.map((c) => {
        const found = (s.secondSem || []).find(
          (x) => x.courseCode === c.courseCode
        );
        return found ? found.Grade || "-" : "-";
      });
      const carried = (s.carried || []).join(", ");
      const firstStats = calcSemesterStats(s.firstSem || []);
      const secondStats = calcSemesterStats(s.secondSem || []);
      return [
        i + 1,
        s.matricNo,
        repeatsStr,
        repeatsGradesStr,
        ...rowFirst,
        firstStats.TCF,
        firstStats.TCP,
        firstStats.TCR,
        ...rowSecond,
        secondStats.TCF,
        secondStats.TCP,
        secondStats.TCR,
        carried,
        calcCGPA(s),
      ];
    });

    autoTable(doc, {
      head: [headers],
      body,
      startY: 50,
      styles: { fontSize: 8, halign: "center" },
      headStyles: { fillColor: [41, 128, 185] },
      theme: "striped",
    });

    doc.save(`results_${selectedSection}.pdf`);
  };

  const handleExportCSV = () => {
    const firstCols = coursesFirst.map((c) => c.courseCode);
    const secondCols = coursesSecond.map((c) => c.courseCode);

    const headers = [
      "S/N",
      "Matric No",
      "Repeat Courses",
      "Repeat Grades",
      ...firstCols,
      "TCF(1st)",
      "TCP(1st)",
      "TCR(1st)",
      ...secondCols,
      "TCF(2nd)",
      "TCP(2nd)",
      "TCR(2nd)",
      "Carried Courses",
      "CGPA",
    ];

    const rows = students.map((s, i) => {
      const repeatsStr = (s.repeats || []).map((r) => r.courseCode).join(", ");
      const repeatsGradesStr = (s.repeats || []).map((r) => r.Grade).join(", ");
      const rowFirst = coursesFirst.map((c) => {
        const found = (s.firstSem || []).find(
          (x) => x.courseCode === c.courseCode
        );
        return found ? found.Grade || "-" : "-";
      });
      const rowSecond = coursesSecond.map((c) => {
        const found = (s.secondSem || []).find(
          (x) => x.courseCode === c.courseCode
        );
        return found ? found.Grade || "-" : "-";
      });
      const carried = (s.carried || []).join(", ");
      const firstStats = calcSemesterStats(s.firstSem || []);
      const secondStats = calcSemesterStats(s.secondSem || []);
      const generalStats = calcGeneralStats(s);
      return [
        i + 1,
        s.matricNo,
        repeatsStr,
        repeatsGradesStr,
        ...rowFirst,
        firstStats.TCF,
        firstStats.TCP,
        firstStats.TCR,
        ...rowSecond,
        secondStats.TCF,
        secondStats.TCP,
        secondStats.TCR,
        generalStats.TCF,
        generalStats.TCP,
        generalStats.TCR,
        carried,
        calcCGPA(s),
      ].join(",");
    });

    const csv =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `results_${selectedSection}.csv`;
    link.click();
  };

  const handlePublish = async () => {
    try {
      let semesterParam;
      if (selectedSemester === "first") semesterParam = 1;
      if (selectedSemester === "second") semesterParam = "both";
      if (selectedSemester === "both") semesterParam = "both";

      await api.post("/post/results/publish", {
        session: selectedSection,
        semester: semesterParam,
      });

      setSuccess("Results published successfully");
    } catch (err) {
      console.error("Publish error:", err);
      setErrors("Publish failed");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto pt-5 relative">
        <div className="print-section mb-6 text-center">
          <h1 className="text-2xl font-bold">
            COMPUTER ENGINEERING FACULTY OF ENGINEERING
          </h1>
          <p>UNIVERSITY OF BENIN EXAMINATION RECORD SHEET</p>
          <p className="font-semibold">
            SESSION: {selectedSection || "-"} Academic Session
          </p>
        </div>

        <div className="flex justify-between mb-4 print:hidden max-sm:flex-col">
          <div className="flex gap-4">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Select session</option>
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="first">First Semester</option>
              <option value="second">Second Semester</option>
              <option value="both">Both Semesters</option>
            </select>
          </div>

          <div className="flex gap-2 max-sm:flex-col max-sm:mt-5 max-sm:gap-4">
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md"
            >
              Publish Result
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              Download PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="print-section overflow-x-auto bg-white dark:bg-gray-800 p-4 rounded-lg">
          {loading ? (
            <p className="text-center text-gray-500">Loading results...</p>
          ) : students.length === 0 ? (
            <p className="text-center text-gray-500">
              No results found for this session
            </p>
          ) : (
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700 text-center">
                  <th rowSpan="2" className="border px-2 py-1">
                    S/N
                  </th>
                  <th rowSpan="2" className="border px-2 py-1">
                    Matric No
                  </th>
                  <th rowSpan="2" className="border px-2 py-1">
                    Repeat Courses
                  </th>
                  <th rowSpan="2" className="border px-2 py-1">
                    Repeat Grades
                  </th>

                  {selectedSemester !== "second" && (
                    <th
                      colSpan={coursesFirst.length + 3}
                      className="border px-2 py-1"
                    >
                      First Semester Courses
                    </th>
                  )}
                  {selectedSemester !== "first" && (
                    <th
                      colSpan={coursesSecond.length + 3}
                      className="border px-2 py-1"
                    >
                      Second Semester Courses
                    </th>
                  )}
                  {selectedSemester === "both" && (
                    <th colSpan="3" className="border px-2 py-1">
                      General Totals
                    </th>
                  )}

                  <th rowSpan="2" className="border px-2 py-1">
                    Carried Courses
                  </th>
                  <th rowSpan="2" className="border px-2 py-1">
                    CGPA
                  </th>
                </tr>

                <tr className="bg-gray-100 dark:bg-gray-600 text-center">
                  {selectedSemester !== "second" && (
                    <>
                      {coursesFirst.map((c) => (
                        <th key={c.courseCode} className="border px-2 py-1">
                          {c.courseCode}
                        </th>
                      ))}
                      <th className="border px-2 py-1">TCF(1st)</th>
                      <th className="border px-2 py-1">TCP(1st)</th>
                      <th className="border px-2 py-1">TCR(1st)</th>
                    </>
                  )}

                  {selectedSemester !== "first" && (
                    <>
                      {coursesSecond.map((c) => (
                        <th key={c.courseCode} className="border px-2 py-1">
                          {c.courseCode}
                        </th>
                      ))}
                      <th className="border px-2 py-1">TCF(2nd)</th>
                      <th className="border px-2 py-1">TCP(2nd)</th>
                      <th className="border px-2 py-1">TCR(2nd)</th>
                    </>
                  )}
                  {selectedSemester === "both" && (
                    <>
                      <th className="border px-2 py-1">General TCF</th>
                      <th className="border px-2 py-1">General TCP</th>
                      <th className="border px-2 py-1">General TCR</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {students.map((s, i) => {
                  const repeats = s.repeats || [];
                  const carried = (s.carried || []).join(", ");
                  const firstStats = calcSemesterStats(s.firstSem || []);
                  const secondStats = calcSemesterStats(s.secondSem || []);
                  const generalStats = calcGeneralStats(s);

                  return (
                    <tr
                      key={s.studentUniqueId}
                      className="text-center hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="border px-2 py-1">{i + 1}</td>
                      <td className="border px-2 py-1">{s.matricNo}</td>
                      <td className="border px-2 py-1">
                        {repeats.map((r) => r.courseCode).join(", ")}
                      </td>
                      <td className="border px-2 py-1">
                        {repeats.map((r) => r.Grade).join(", ")}
                      </td>

                      {selectedSemester !== "second" && (
                        <>
                          {coursesFirst.map((c) => {
                            const found = (s.firstSem || []).find(
                              (x) => x.courseCode === c.courseCode
                            );
                            return (
                              <td
                                key={c.courseCode}
                                className="border px-2 py-1"
                              >
                                {found ? found.Grade : "-"}
                              </td>
                            );
                          })}
                          <td className="border px-2 py-1">{firstStats.TCF}</td>
                          <td className="border px-2 py-1">{firstStats.TCP}</td>
                          <td className="border px-2 py-1">{firstStats.TCR}</td>
                        </>
                      )}

                      {selectedSemester !== "first" && (
                        <>
                          {coursesSecond.map((c) => {
                            const found = (s.secondSem || []).find(
                              (x) => x.courseCode === c.courseCode
                            );
                            return (
                              <td
                                key={c.courseCode}
                                className="border px-2 py-1"
                              >
                                {found ? found.Grade : "-"}
                              </td>
                            );
                          })}
                          <td className="border px-2 py-1">
                            {secondStats.TCF}
                          </td>
                          <td className="border px-2 py-1">
                            {secondStats.TCP}
                          </td>
                          <td className="border px-2 py-1">
                            {secondStats.TCR}
                          </td>
                        </>
                      )}
                      {selectedSemester === "both" && (
                        <>
                          <td className="border px-2 py-1">
                            {generalStats.TCF}
                          </td>
                          <td className="border px-2 py-1">
                            {generalStats.TCP}
                          </td>
                          <td className="border px-2 py-1">
                            {generalStats.TCR}
                          </td>
                        </>
                      )}

                      <td className="border px-2 py-1">{carried}</td>
                      <td className="border px-2 py-1">{calcCGPA(s)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="print-section mt-10 flex justify-between print:block">
          <div className="text-right text-xs text-gray-600 dark:text-gray-400">
            <p>Prepared by: {localStorage.getItem("userName") || "Adviser"}</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaResultManagement;

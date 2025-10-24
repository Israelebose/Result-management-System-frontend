import React, { useEffect, useState } from "react";
import { useApi, useDetails } from "../context/ContextProvider";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Printer, Download } from "lucide-react";

export const ViewResult = () => {
  const api = useApi();
  const { userData, setErrors, setSuccess } = useDetails();

  const [sessions, setSessions] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("first");
  const [selectedSession, setSelectedSession] = useState("");
  const [allResults, setAllResults] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch sessions
  useEffect(() => {
    if (userData.role && userData.role !== "student") {
      setErrors("Unauthorized. Please log in again.");
      navigate("/login");
      return;
    }
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/get/sessions`);
      setSessions(res.data);
    } catch (err) {
      setErrors("Error fetching sessions");
    }
  };

  useEffect(() => {
    if (selectedSession) fetchResults(selectedSession);
  }, [selectedSession]);

  const fetchResults = async (session) => {
    setLoading(true);
    try {
      const res = await api.get(`/get/results/student`, {
        params: { session },
      });
      setAllResults(res.data.results);
      setSuccess("Results fetched successfully");
    } catch (err) {
      console.error("Error fetching results:", err);
      setErrors("Error fetching results");
    } finally {
      setLoading(false);
    }
  };

  // Calculate GPA for a semester
  const calculateGPA = (courses) => {
    if (!courses || courses.length === 0) return 0;
    let totalPoints = 0;
    let totalUnits = 0;
    courses.forEach((r) => {
      totalPoints += r.point * r.unit;
      totalUnits += r.unit;
    });
    return totalUnits ? (totalPoints / totalUnits).toFixed(2) : 0;
  };

  //Calculate CGPA across all sessions and semesters
  const calculateCGPA = () => {
    let totalPoints = 0;
    let totalUnits = 0;
    Object.values(allResults).forEach((sessionData) => {
      Object.values(sessionData).forEach((semesterCourses) => {
        semesterCourses.forEach((r) => {
          totalPoints += r.point * r.unit;
          totalUnits += r.unit;
        });
      });
    });
    return totalUnits ? (totalPoints / totalUnits).toFixed(2) : 0;
  };

  const cgpa = calculateCGPA();
  const currentSessionResults = allResults[selectedSession] || {};
  const firstSemesterResults = currentSessionResults.first || [];
  const secondSemesterResults = currentSessionResults.second || [];

  const gpa =
    selectedSemester === "first"
      ? calculateGPA(firstSemesterResults)
      : calculateGPA(secondSemesterResults);

  const handleSessionChange = (e) => {
    setSelectedSession(e.target.value);
  };

  const gradeRemark = (score) => {
    if (score >= 70) return "Excellent";
    if (score >= 60) return "Very Good";
    if (score >= 50) return "Good";
    if (score >= 45) return "Fair";
    return "Poor";
  };

  const printResultSlip = () => {
  const printWindow = window.open("", "", "height=800, width=600");
  printWindow.document.write("<html><head><title>Result Slip</title>");
  printWindow.document.write(
    "<style>body { font-family: Arial, sans-serif; font-size: 12px; } .header { background: #1e3a8a; color: white; padding: 10px; text-align: center; } .content { padding: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #1e3a8a; color: white; } .gpa { display: inline-block; padding: 5px 10px; font-weight: bold; } .yellow { background-color: #facc15; } .blue { background-color: #1e3a8a; color: white; } .footer { font-size: 10px; text-align: center; margin-top: 20px; } .signature { margin-top: 20px; } .sig-line { border-bottom: 1px solid black; width: 200px; display: inline-block; }</style>"
  );
  printWindow.document.write("</head><body>");
  printWindow.document.write(
    '<div class="header"><img src="https://via.placeholder.com/30" alt="Logo" style="vertical-align: middle;"> University of Benin <br> Computer Engineering Department</div>'
  );
  printWindow.document.write('<div class="content">');
  printWindow.document.write(
    '<h2 style="text-align: center; color: #1e3a8a;">UNIVERSITY OF BENIN</h2>'
  );
  printWindow.document.write(
    '<h3 style="text-align: center; color: #1e3a8a;">Faculty of Engineering</h3>'
  );
  printWindow.document.write(
    '<h3 style="text-align: center; color: #1e3a8a;">Computer Engineering Department</h3>'
  );
  printWindow.document.write(
    '<h2 style="text-align: center; color: #facc15;">STUDENT RESULT SLIP</h2>'
  );
  printWindow.document.write(
    `<p>Student Name: ${userData.firstName} ${userData.lastName}</p>`
  );
  printWindow.document.write(`<p>Matric No: ${userData.matNumber}</p>`);
  printWindow.document.write(`<p>Level: ${userData.Level} Level</p>`);
  printWindow.document.write("<p>Department: Computer Engineering</p>");
  printWindow.document.write(`<p>Session: ${selectedSession}</p>`);
  printWindow.document.write(`<p>Semester: ${selectedSemester}</p>`);

  const resultData = allResults[selectedSession];
  const semesters = selectedSemester === "all"
    ? ["first", "second"]
    : [selectedSemester];

  semesters.forEach((sem) => {
    const semCourses = resultData?.[sem] || [];
    printWindow.document.write(
      `<h3>${sem === "first" ? "First" : "Second"} Semester Course Results</h3>`
    );

    if (semCourses.length === 0) {
      printWindow.document.write("<p>Pending...</p>");
      return;
    }

    printWindow.document.write(
      "<table><thead><tr><th>S/N</th><th>Course Code</th><th>Course Title</th><th>Unit</th><th>Score</th><th>Grade</th><th>Point</th><th>Remark</th></tr></thead><tbody>"
    );

    semCourses.forEach((course, index) => {
      const remark =
        course.Total >= 70
          ? "Excellent"
          : course.Total >= 60
          ? "Very Good"
          : course.Total >= 50
          ? "Good"
          : course.Total >= 45
          ? "Fair"
          : "Poor";
      printWindow.document.write(
        `<tr><td>${index + 1}</td><td>${course.courseCode}</td><td>${course.courseTitle}</td><td>${course.credits}</td><td>${course.Total}</td><td>${course.Grade}</td><td>${course.point}</td><td>${remark}</td></tr>`
      );
    });

    printWindow.document.write("</tbody></table>");
    printWindow.document.write(
      `<div class="gpa yellow">Semester GPA <br> ${calculateGPA(semCourses)}</div>`
    );
  });

  printWindow.document.write(
    `<div class="gpa blue">Cumulative GPA <br> ${calculateCGPA()}</div>`
  );

  printWindow.document.write(
    '<div class="signature">Course Adviser: ' +
      (userData.courseAdvisorName || "________________") +
      ' <span class="sig-line"></span></div>'
  );
  printWindow.document.write(
    `<p class="footer">Generated on: ${new Date().toLocaleDateString()}<br>This is a computer-generated result slip</p>`
  );
  printWindow.document.write(
    '<div class="footer">Official Seal <span style="border: 1px solid #ddd; padding: 10px; display: inline-block;">Seal</span> Registrar\'s Office</div>'
  );
  printWindow.document.write("</div></body></html>");
  printWindow.document.close();
  printWindow.print();
};


const downloadResultPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 20;
  let y = 10;

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("University of Benin", leftMargin, y + 5);
  doc.text("Computer Engineering Department", leftMargin, y + 15);
  doc.setTextColor(0, 0, 0);
  y += 30;

  // Title Section
  doc.setFontSize(18);
  doc.text("STUDENT RESULT SLIP", pageWidth / 2, y, { align: "center" });
  y += 15;
  doc.setFontSize(12);
  doc.text(`Student Name: ${userData.firstName} ${userData.lastName}`, leftMargin, y);
  y += 7;
  doc.text(`Matric No: ${userData.matNumber}`, leftMargin, y);
  y += 7;
  doc.text(`Level: ${userData.Level} Level`, leftMargin, y);
  y += 7;
  doc.text(`Session: ${selectedSession}`, leftMargin, y);
  y += 7;
  doc.text(`Semester: ${selectedSemester}`, leftMargin, y);
  y += 15;

  const resultData = allResults[selectedSession];
  const semesters = selectedSemester === "all"
    ? ["first", "second"]
    : [selectedSemester];

  semesters.forEach((sem) => {
    const semCourses = resultData?.[sem] || [];
    doc.text(`${sem === "first" ? "First" : "Second"} Semester Results`, leftMargin, y);
    y += 8;

    if (semCourses.length === 0) {
      doc.text("Pending...", leftMargin, y);
      y += 10;
      return;
    }

    doc.autoTable({
      startY: y,
      head: [["S/N", "Course Code", "Course Title", "Unit", "Score", "Grade", "Point", "Remark"]],
      body: semCourses.map((course, i) => [
        i + 1,
        course.courseCode,
        course.courseTitle,
        course.credits,
        course.Total,
        course.Grade,
        course.point,
        course.Total >= 70
          ? "Excellent"
          : course.Total >= 60
          ? "Very Good"
          : course.Total >= 50
          ? "Good"
          : course.Total >= 45
          ? "Fair"
          : "Poor",
      ]),
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    });

    y = doc.autoTable.previous.finalY + 10;
    doc.setFillColor(250, 204, 21);
    doc.rect(leftMargin, y, 60, 10, "F");
    doc.text(`Semester GPA: ${calculateGPA(semCourses)}`, leftMargin + 5, y + 7);
    y += 20;
  });

  // CGPA Box
  doc.setFillColor(30, 58, 138);
  doc.rect(leftMargin, y, 70, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(`Cumulative GPA (CGPA): ${calculateCGPA()}`, leftMargin + 5, y + 8);
  y += 25;

  // Footer
  doc.setTextColor(0, 0, 0);
  doc.text(`Course Adviser: ${userData.courseAdvisorName || "________________"}`, leftMargin, y);
  y += 8;
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, leftMargin, y);
  y += 5;
  doc.setFontSize(8);
  doc.text("This is a computer-generated result slip", leftMargin, y + 3);
  doc.text("Official Seal [Seal] Registrar's Office", leftMargin, y + 8);

  doc.save("result_slip.pdf");
};

  return (
    <div className="min-h-screen ">
       <div className="mx-auto ">
       {userData.is_approved ? ((
        <>
        <div className="flex flex-col justify-between items-center mb-6 ">
        <div className="flex max-sm:flex-col max-sm:gap-2 max-sm:w-full max-sm:mb-5 gap-4">
          <div className="flex flex-col">
            <label className="font-medium">Select Session:</label>
            <select
              value={selectedSession}
              onChange={handleSessionChange}
              className="border rounded px-2 py-1"
            >
              <option value="">Select session</option>
              {sessions.map((s, i) => (
                <option key={i} value={s.sessionName}>
                  {s.sessionName} {s.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="font-medium">Select Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="first">First Semester</option>
              <option value="second">Second Semester</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div className="flex max-sm:justify-between max-sm:w-full gap-3">
          <button
            onClick={printResultSlip}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </button>
          <button
            onClick={downloadResultPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading results...</p>
      ) : selectedSession ? (
        <div className="">
          <h2 className="text-lg font-semibold mb-4">Course Results </h2>
          {(selectedSemester === "first" || selectedSemester === "all") && (
            <div className="overflow-x-scroll">
              <h3 className="font-semibold mb-2 ">
                First Semester
              </h3>
              {firstSemesterResults.length === 0 ? (
                <p>No results available.</p>
              ) : (
                <table className="w-full text-sm max-sm:table-auto text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">S/N</th>
                      <th className="px-6 py-3">Course Code</th>
                      <th className="px-6 py-3">Course Title</th>
                      <th className="px-6 py-3">Unit</th>           
                      <th className="px-6 py-3">Grade</th>
                      <th className="px-6 py-3">Point</th>
                      <th className="px-6 py-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firstSemesterResults.map((c, i) => (
                      <tr key={i} className="bg-white border-b text-sm">
                        <td className="px-6 py-3 ">{i + 1}</td>
                        <td className="px-6 py-3">{c.courseCode}</td>
                        <td className="px-6 py-3">{c.courseTitle}</td>
                        <td className="px-6 py-3">{c.unit}</td>
                        <td className="px-6 py-3">{c.Grade}</td>
                        <td className="px-6 py-3">{c.point}</td>
                        <td className="px-6 py-3">{gradeRemark(c.Total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="mt-3 bg-yellow-300 inline-block px-4 py-2 rounded">
                Semester GPA: {calculateGPA(firstSemesterResults)}
              </div>
            </div>
          )}

          {(selectedSemester === "second" || selectedSemester === "all") && (
            <div className="mt-8  overflow-x-auto">
              <h3 className="font-semibold mb-2 ">
                Second Semester
              </h3>
              {secondSemesterResults.length === 0 ? (
                <p>No results available.</p>
              ) : (
                <table className="w-full text-sm table-auto  text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">S/N</th>
                      <th className="px-6 py-3">Course Code</th>
                      <th className="px-6 py-3">Course Title</th>
                      <th className="px-6 py-3">Unit</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Grade</th>
                      <th className="px-6 py-3">Point</th>
                      <th className="px-6 py-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secondSemesterResults.map((c, i) => (
                      <tr key={i} className="bg-white border-b">
                        <td className="px-6 py-3">{i + 1}</td>
                        <td className="px-6 py-3">{c.courseCode}</td>
                        <td className="px-6 py-3">{c.courseTitle}</td>
                        <td className="px-6 py-3">{c.unit}</td>
                        <td className="px-6 py-3">{c.Total}</td>
                        <td className="px-6 py-3">{c.Grade}</td>
                        <td className="px-6 py-3">{c.point}</td>
                        <td className="px-6 py-3">{gradeRemark(c.Total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="mt-3 bg-yellow-300 inline-block px-4 py-2 rounded">
                Semester GPA: {calculateGPA(secondSemesterResults)}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 bg-blue-900 text-white px-4 py-2 rounded">
            <div>Cumulative GPA (CGPA): {cgpa}</div>
            <div>Signed: Admin</div>
          </div>
        </div>
      ) : (
        <p>Select a session to view results</p>
      )}
        </>
      )) :(
        <div className="flex flex-col items-center pt-10 min-h-screen">
          <h2 className="text-2xl font-semibold mb-2">
            Account Pending Approval
          </h2>
        </div>
      )}
      </div>
    </div>
  );
};

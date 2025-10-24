import React, { useEffect, useMemo, useState } from "react";
import { useApi, useDetails } from "./context/ContextProvider";

const UploadGrades = () => {
  const api = useApi();
  const { userData, setErrors, setSuccess } = useDetails();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Fetch courses assigned to this lecturer
  useEffect(() => {
    if (!userData.role || !userData.is_staff ) {
      setErrors("Session expired. Please log in again.");
      navigate("/login");
      return;
    }
    const fetchCourses = async () => {
      try {
        const res = await api.get(`/get/lecturer-courses`);
        const data = res.data; // Axios uses `res.data` instead of `res.json()`
        setCourses(data.courses || []);
        if (data.courses?.length > 0) {
          setSelectedCourse(data.courses[0].id);
        } else {
          setSelectedCourse("no courses found");
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // Fetch students registered for selected course
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;
      setLoading(true);
      try {
        const res = await api.get(
          `/get/course-registrations/${selectedCourse}`
        );
        const data = res.data;
        setStudents(data.students || []);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedCourse]);

  // helper: calculate grade
  const calculateGrade = (total) => {
    if (total >= 70) return "A";
    if (total >= 60) return "B";
    if (total >= 50) return "C";
    if (total >= 45) return "D";
    return "F";
  };

  // Field change handler
  const handleFieldChange = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = Number(value);
    updated[index].Total = updated[index].CA + updated[index].Exam;
    updated[index].Grade = calculateGrade(updated[index].Total);
    setStudents(updated);

    const updatedRow = updated[index];
    setPendingUpdates((prev) => {
      const exists = prev.find(
        (s) => s.matricNumber === updatedRow.matricNumber
      );
      return exists
        ? prev.map((s) =>
            s.matricNumber === updatedRow.matricNumber ? updatedRow : s
          )
        : [...prev, updatedRow];
    });
  };

  // Save all grades
  const handleSaveAll = async () => {
    if (pendingUpdates.length === 0) return;
    const payload = {
       courseId: selectedCourse,
        session: userData.currentSession,
        grades: pendingUpdates,
    }
    try {
      const res = await api.post("/post/upload-grades", 
       payload
      );
      console.log(payload);
      
      setSuccess("Grades uploaded successfully!");
      setPendingUpdates([]);
    } catch (err) {
      setErrors("Error uploading grades");
      console.error("Upload error:", err);
    }
  };

  return (
    <div className="min-h-screen ">
      <div className=" mx-auto ">
        {/* Course Selector */}
        <div className=" mt-5 flex mb-4 flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ">
          {/* Course Select */}
          <div className="">
            <label className="block mt-10  mb-2 font-medium">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
             className="w-full sm:w-64 p-2 rounded bg-secondary_bg border border-gray-600 text-textColor1"
            >
              {courses.length <= 0 ? (
                <option>No courses found</option>
              ) : (
                courses.map((c) => (
                  <option key={c.courseCode} value={c.id}>
                    {c.courseCode} - {c.courseTitle}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-4">
            {/* Save */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveAll}
                disabled={pendingUpdates.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Save Grades
              </button>
            </div>
            {editingIndex ? (
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="w-30 px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white text-base font-medium disabled:opacity-50"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditingIndex(true)}
                className="w-30 px-4 py-2 rounded bg-primary-blue hover:bg-primary-blue-hover text-base text-white font-medium disabled:opacity-50"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Student Table */}
        {loading ? (
          <p>Loading students...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200 max-sm:text-md">
                  <th className="p-2 text-left">S/N</th>
                  <th className="p-2 text-left">Matric No</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-center">CA (30)</th>
                  <th className="p-2 text-center">Exam (70)</th>
                  <th className="p-2 text-center">Total</th>
                  <th className="p-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-4 text-center">
                      {" "}
                      No students registered
                    </td>
                  </tr>
                ) : (
                  students.map((s, i) => (
                    <tr key={s.matricNumber} className="border-b max-sm:text-md">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{s.matricNumber}</td>
                      <td className="p-2">{s.name}</td>
                      <td className="p-2 text-center">
                        {editingIndex ? (
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={s.CA || 0}
                            onChange={(e) =>
                              handleFieldChange(i, "CA", e.target.value)
                            }
                            className="rounded-md px-2 py-2 text-center focus:outline-none ring-2 ring-gray-300 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
                          />
                        ) : (
                          s.CA
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {editingIndex ? (
                          <input
                            type="number"
                            min="0"
                            max="70"
                            value={s.Exam || 0}
                            onChange={(e) =>
                              handleFieldChange(i, "Exam", e.target.value)
                            }
                           className="rounded-md px-2 py-2 text-center focus:outline-none ring-2 ring-gray-300 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
                          />
                        ) : (
                          s.Exam
                        )}
                      </td>
                      <td className="p-2 text-center">{s.Total || 0}</td>
                      <td className="p-2 text-center">{s.Grade || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Save */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSaveAll}
            disabled={pendingUpdates.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Save Grades
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadGrades;

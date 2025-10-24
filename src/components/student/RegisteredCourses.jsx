import React, { useEffect, useState } from "react";
import { useDetails, useApi } from "../context/ContextProvider";

const RegisteredCourses = () => {
    const { userData, setErrors, setSuccess } = useDetails();
  const api = useApi();
  const [sessions, setSessions] = useState([]); // unique sessions registered
  const [regSession, setRegSession] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    if (userData.role && userData.role !== "student") {
      setErrors && setErrors("Unauthorized. Please log in again.");
      navigate("/login");
      return;
    }
    fetchRegistrations(selectedSession);
    fetchSessions();
  }, []);
 
  const fetchSessions = async () => {
    try {
      const res = await api.get(`/get/sessions`);
      setSessions(res.data);
      setSuccess("Sessions fetched successfully");
    } catch (err) {
      setErrors("Error fetching sessions");
    }
  };
  const fetchRegistrations = async (sessionParam) => {
    try {
      const res = await api.get(
        `/get/student-registrations/${userData.unique_id}`,
        {
          params: {
            // <--- This tells Axios to attach it as a query parameter
            session: sessionParam,
          },
        }
      );

      const data = res.data.registrations || [];
      setRegistrations(data);
      // collect all sessions
      const sess = [...new Set(data.map((r) => r.regSession))];
      setRegSession(sess);
      if (!sessionParam && sess.length) {
        setSelectedSession(sess[0]);
      }
    } catch (err) {
      console.error("Error fetching student regs:", err);
    }
  };

  // When session selection changes
  const handleSessionChange = (evt) => {
    const s = evt.target.value;
    setSelectedSession(s);
    fetchRegistrations(s);
  };


  return (
     <div className=" min-h-screen  ">
        <div className=" mx-auto">
      <div className="mb-10 mt-10 flex items-center gap-2">
        <label className="font-medium">Select Session:</label>
        <select
          value={selectedSession}
          onChange={handleSessionChange}
          className="border rounded px-2 py-1"
        >
          {sessions.map((s, i) => (
            <option key={i} value={s.sessionName}>
              {s.sessionName} {s.isCurrent ? "(Current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {registrations.length === 0 ? (
        <p>No registrations found for {selectedSession}.</p>
      ) : (
        registrations.map((reg, idx) => {
          // Separate courses by semester
          const firstSemester = reg.courses.filter((c) => c.semester === 1 || c.semester === "First");
          const secondSemester = reg.courses.filter((c) => c.semester === 2 || c.semester === "Second");

          return (
            <div key={idx} className="mb-6 ">
              <h3 className="font-semibold text-lg mb-2">
                Session: {reg.session} 
              </h3>
              <p className="text-md text-gray-600 mb-4">
                Total Credit: {reg.totalCredit}
              </p>

              {/* FIRST SEMESTER */}
              {firstSemester.length > 0 && (
                <>
                  <h4 className="font-medium mb-4 text-xl">First Semester</h4>
                  <table className="bg-secondary_bg mb-8 text-center rounded-xl w-full  shadow-lg">
                    <thead className="">
                      <tr>
                        <th className="p-2">Code</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firstSemester.map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{c.courseCode}</td>
                          <td className="p-2">{c.courseTitle}</td>
                          <td className="p-2">{c.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* SECOND SEMESTER */}
              {secondSemester.length > 0 && (
                <>
                  <h4 className="font-medium mb-4 text-xl">Second Semester</h4>
                  <table className="bg-secondary_bg mb-8 text-center rounded-xl w-full  shadow-lg">
                    <thead className="">
                      <tr>
                        <th className="p-2">Code</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {secondSemester.map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{c.courseCode}</td>
                          <td className="p-2">{c.courseTitle}</td>
                          <td className="p-2">{c.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          );
        })
      )}
      </div>
    </div>
  );
};

export default RegisteredCourses;

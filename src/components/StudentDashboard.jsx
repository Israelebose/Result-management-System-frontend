// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi, useDetails } from "./context/ContextProvider";
import {
  User,
  Book,
  Check,
  AlertCircle,
  Send,
  BarChart,
  BookOpen,
  CheckCheck,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  FileEdit,
} from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import moment from "moment";

/**
 * StudentDashboard
 *
 * - Merges your profile/announcement logic with the student UI I built earlier.
 * - Uses dummy currentCourses & stats (per your request).
 * - Replace dummy data or wire API responses where noted.
 */

const announcementSchema = Yup.object({
  title: Yup.string().max(100).required("Title is required"),
  message: Yup.string().max(1000).required("Message is required"),
});

const calculateGrade = (score) => {
  if (score === null || score === undefined) return { grade: null };
  if (score >= 70) return { grade: "A" };
  if (score >= 60) return { grade: "B" };
  if (score >= 50) return { grade: "C" };
  if (score >= 45) return { grade: "D" };
  if (score >= 40) return { grade: "E" };
  return { grade: "F" };
};

const StudentDashboard = () => {
  const { userData, setErrors, setSuccess } = useDetails();

  const [announcements, setAnnouncements] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [coursesByLevel, setCoursesByLevel] = useState([]);
  const [makeComplain, setMakeComplain] = useState(null);
  const [dateRange] = useState("6m");
  const navigate = useNavigate();
  const api = useApi();

  useEffect(() => {
        // role check — if you don't want to force redirect in local dev, comment out
        if (userData.role && userData.role !== "student") {
          setErrors && setErrors("Unauthorized. Please log in again.");
          navigate("/login");
          return;
        }
       
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

  // Dummy user/profile fallback (if API not wired)
  const dummyProfile = {
    firstName: "John",
    lastName: "Doe",
    matricNumber: "ENG1905018",
    year: 3,
    department: "Computer Engineering",
    currentSession: "2023/2024",
    is_approved: true,
  };

  // Dummy stats & courses (the version you asked for)
  const dummyStats = {
    cgpa: 3.65,
    currentGPA: 3.42,
    totalCredits: 68,
    completedCourses: 28,
  };

  const currentCourses = [
    {
      code: "CPE 321",
      title: "Digital System Design",
      credits: 3,
      score: 78,
      status: "graded",
    },
    {
      code: "CPE 311",
      title: "Microprocessor Systems",
      credits: 3,
      score: 65,
      status: "graded",
    },
    {
      code: "CPE 341",
      title: "Control Systems",
      credits: 3,
      score: null,
      status: "pending",
    },
    {
      code: "CPE 351",
      title: "Computer Networks",
      credits: 3,
      score: 72,
      status: "graded",
    },
    {
      code: "CPE 361",
      title: "Software Engineering",
      credits: 2,
      score: 85,
      status: "graded",
    },
  ];

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      // If your API is not ready, fallback to dummy announcements
      if (!api) {
        setAnnouncements([
          {
            id: 1,
            title: "Semester registration begins",
            message: "Course registration for next semester begins on Monday.",
            createdAt: new Date().toISOString(),
            user: { firstName: "Admin", lastName: "Office", role: "admin" },
          },
          {
            id: 2,
            title: "Result release",
            message:
              "First-semester results have been published. Check your dashboard.",
            createdAt: new Date().toISOString(),
            user: { firstName: "Exams", lastName: "Office", role: "admin" },
          },
        ]);
        return;
      }
      const res = await api.get(`/announcements`);
      setAnnouncements(res.data || []);
    } catch (err) {
      setErrors &&
        setErrors(err.response?.data?.error || "Failed to fetch announcements");
    }
  };

  useEffect(() => {
    // role check — if you don't want to force redirect in local dev, comment out
    if (userData.role && userData.role !== "student") {
      setErrors && setErrors("Unauthorized. Please log in again.");
      navigate("/login");
      return;
    }
    fetchAnnouncements();
    setProfile(userData);
    fetchCoursesByLevel(userData.level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.role]);

  const fetchCoursesByLevel = async (level) => {
    try {
      const res = await api.get(`/get/courses/level/${level}`);
      setCoursesByLevel(res.data);
      setSuccess("Courses fetched successfully");
    } catch (err) {
      console.log({ error: err });
      setErrors(err.response?.data?.error);
    }
  };

  // Announcement submit handler
  const handleAnnouncementSubmit = async (
    values,
    { setSubmitting, resetForm }
  ) => {
    try {
      if (!api) {
        // local push for demo
        setAnnouncements((prev) => [
          {
            id: Date.now(),
            title: values.title,
            message: values.message,
            createdAt: new Date().toISOString(),
            user: {
              firstName: profile?.firstName || "You",
              lastName: profile?.lastName || "",
            },
          },
          ...prev,
        ]);
        setSuccess && setSuccess("Announcement posted (demo)");
        resetForm();
        return;
      }
      await api.post(`/announcements`, values);
      setSuccess && setSuccess("Announcement posted successfully");
      fetchAnnouncements();
      resetForm();
    } catch (err) {
      setErrors &&
        setErrors(err.response?.data?.error || "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  // Complaint form handled with Formik below (local demo + will be wired to API)
  const complaintSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!api) {
        alert("Complaint submitted (demo): " + values.complaint);
        resetForm();
      } else {
        await api.post("/complaints", values);
        setSuccess && setSuccess("Complaint submitted");
        resetForm();
      }
    } catch (err) {
      setErrors &&
        setErrors(err.response?.data?.error || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to render grade badges
  const GradeBadge = ({ score }) => {
    if (score === null || score === undefined) {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
          Pending
        </span>
      );
    }
    const { grade } = calculateGrade(score);
    const map = {
      A: "bg-green-500 text-white",
      B: "bg-blue-600 text-white",
      C: "bg-yellow-500 text-white",
      D: "bg-orange-500 text-white",
      E: "bg-orange-400 text-white",
      F: "bg-red-500 text-white",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          map[grade] || "bg-gray-200"
        }`}
      >
        {grade}
      </span>
    );
  };

  if (!profile) {
    // show nothing until profile loads, or show placeholder
    return null;
  }

  const studentStats = [
    {
      icon: TrendingIcon,
      color: "green",
      title: "Current GPA",
      stats: userData.currentSession,
      text: "Academic session",
    },
    {
      icon: Book,
      color: "blue",
      title: "Status",
      stats: userData.is_approved ? "Active" : "Pending",
      text: "Student status",
    },
    {
      icon: CheckCheck,
      color: "indigo",
      title: "Current GPA",
      stats: dummyStats.currentGPA,
      text: "This semester",
    },
    {
      icon: BookOpen,
      color: "orange",
      title: "Course",
      stats: coursesByLevel.length,
      text: `${profile.level} Year Course`,
    },
  ];

  const adminQl = [
    {
      icon: FileText,
      color: "green",
      label: "View Results",
      path: "/home/view-result",
    },
    {
      icon: User,
      color: "pink",
      label: "My Profile",
      path: "/home/profile",
    },
    {
      icon: FileEdit,
      color: "blue",
      label: "Course Registration",
      path: "/home/Course-Registration",
    },
    {
      icon: User,
      color: "indigo",
      label: "Check Complains",
      path: "/home/404",
    },
    {
      icon: User,
      color: "orange",
      label: "View Transcript",
      path: "/home/404",
    },
  ];

  return (
    <div className="pt-4 sm:pt-6 lg:pt-8 ">
      <div className="mx-auto ">
        {/* notice
        <div className="mb-6 p-3 rounded border border-yellow-200 bg-yellow-50 text-yellow-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-700 mt-0.5" />
          <div className="text-sm">
            <strong>Notice:</strong> Results for {profile.currentSession} First Semester have been published. Check your grades below.
          </div>
        </div> */}

        {/* stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {studentStats.map((content, index) => {
            const Icon = content.icon;
            return (
              <div
                key={index}
                className=" bg-secondary_bg  dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4"
              >
                <div className={`p-3 rounded-lg bg-${content.color}-100`}>
                  <Icon
                    className={`sm:h-7  sm:w-7 text-${content.color}-500 `}
                  />
                </div>

                <div>
                  <p className="text-balance text-sm  font-medium text-gray-500 dark:text-gray-400">
                    {content.title}
                  </p>
                  <p className="sm:text-xl text-lg  font-bold text-gray-800 dark:text-gray-100">
                    {content.stats}
                  </p>
                  <p className="text-xs text-gray-400">{content.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* main content two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column (large) - courses & announcements */}
          

          <div className="space-y-3 lg:col-span-12">
            {/* Announcements */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Recent Announcements</h3>
                <p className="text-sm text-gray-500">
                  {announcements.length} found
                </p>
              </div>

              {announcements.length ? (
                <div className="space-y-3 max-h-64 overflow-auto no-scrollbar">
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 border rounded-lg flex gap-4 hover:shadow cursor-pointer"
                      onClick={() => setSelectedAnnouncement(a)}
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-700 text-white flex items-center justify-center font-semibold">
                        {a.user?.firstName?.[0]?.toUpperCase() || "U"}
                        {a.user?.lastName?.[0]?.toUpperCase() || "N"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{a.title}</p>
                          <small className="text-xs text-gray-400">
                            {moment(a.createdAt).format("MMM D, YYYY")}
                          </small>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {a.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No announcements found.</p>
              )}
            </div>

            {/* Selected announcement modal */}
            {selectedAnnouncement && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full p-6 overflow-auto">
                  <h2 className="text-xl font-bold mb-3">
                    {selectedAnnouncement.title}
                  </h2>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
                    {selectedAnnouncement.message}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Posted by {selectedAnnouncement.user?.firstName}{" "}
                    {selectedAnnouncement.user?.lastName} •{" "}
                    {moment(selectedAnnouncement.createdAt).format(
                      "MMM D, YYYY h:mm A"
                    )}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedAnnouncement(null)}
                      className="px-4 py-2 rounded bg-blue-600 text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* right column - quick actions, progress, complaint form */}
          <div className="space-y-6 lg:col-span-12 gap-6 grid grid-cols-1 lg:grid-cols-2 ">
            {/* Quick actions */}

            <div className="bg-secondary_bg h-full text-textColor1 rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminQl.map((content, index) => {
                  const Icon = content.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(content.path)}
                      className={`flex flex-col items-center text-white  shadow-md justify-center text-sm gap-3 cursor-pointer bg-${content.color}-500 rounded-lg p-3 hover:bg-${content.color}-600  transition`}
                    >
                      <Icon className={`sm:h-6 sm:w-6  `} />
                      {content.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* academic progress */}
            <div className="bg-white   dark:bg-gray-800 rounded-xl shadow p-4">
              <h3 className="font-semibold text-xl">Academic Progress</h3>
              <p className="text-sm  mb-2">Your journey through the program</p>
              <div className="space-y-3">
                {[100, 200, 300, 400, 500].map((year) => (
                  <div key={year} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        year < userData.level
                          ? "bg-green-500 text-white"
                          : year === userData.level
                          ? "bg-green-300 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {year <= userData.level ? "✓" : ""}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Year {year}</p>
                      <p className="text-xs text-gray-500">
                        {year < userData.level
                          ? "Completed"
                          : year === userData.level
                          ? "Current"
                          : "Upcoming"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* complaint form (Formik)
            {makeComplain && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <h3 className="font-semibold mb-2">Submit Complaint</h3>
                <Formik
                  initialValues={{ complaint: "" }}
                  onSubmit={complaintSubmit}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-3">
                      <Field
                        as="textarea"
                        name="complaint"
                        placeholder="Type your complaint..."
                        className="w-full border rounded p-2 text-sm"
                        rows="4"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Submit
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

/* small helper icons (keeps look consistent) */
const TrendingIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    className="text-green-600"
  >
    <path
      d="M3 17l6-6 4 4 8-8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GradeBadge = ({ score }) => {
  if (score === null || score === undefined) {
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
        Pending
      </span>
    );
  }
  const g = calculateGrade(score).grade;
  const map = {
    A: "bg-green-500 text-white",
    B: "bg-blue-600 text-white",
    C: "bg-yellow-500 text-white",
    D: "bg-orange-500 text-white",
    E: "bg-orange-400 text-white",
    F: "bg-red-500 text-white",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        map[g] || "bg-gray-200"
      }`}
    >
      {g}
    </span>
  );
};

export default StudentDashboard;

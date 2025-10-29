import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi, useDetails } from "./context/ContextProvider";
import {
  User,
  Book,
  Check,
  AlertCircle,
  Send,
  Users,
  FileText,
  BarChart,
  BookOpen,
  Award,
  UserLock,
  Plus,
  BookMarked,
  UserPen,
} from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import moment from "moment";

// Register chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const announcementSchema = Yup.object({
  title: Yup.string().max(100).required("Title is required"),
  message: Yup.string().max(1000).required("Message is required"),
});

const StaffDashboard = () => {
  const { userData, setErrors, setSuccess, setWarning, setUpdate } =
    useDetails();
  const [stats, setStats] = useState({
    totalUsers: 0,
    roles: {
      student: 0,
      admin: 0,
      lecturer: 0,
      course_adviser: 0,
    },
    currentSession: "",
    pendingApprovals: 0,
    totalCourses: 0,
    recentRegistrations: 0,
  });
  const [caStats, setCaStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    currentSession: "",
    course: 0,
  });
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [coursesByLevel, setCoursesByLevel] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedRole, setSelectedRole] = useState("student");
  const [dateRange, setDateRange] = useState("6m");
  const navigate = useNavigate();
  const api = useApi();
  const courseAdviserLevel = userData.courseAdviserLevel;
  // check role
  useEffect(() => {
    if (!userData.role || userData.role === "student") {
      setErrors("Unauthorized. Please log in again.");
      navigate("/login");
      return;
    }

    userData.role === "admin" ? (fetchAdminStats(), fetchAllCourses()) : null;
    userData.role === "course_adviser"
      ? (fetchCaStats(courseAdviserLevel),
        fetchCoursesByLevel(courseAdviserLevel))
      : null;
    fetchAssignedCourses();
  }, [userData.role, navigate]);

  const fetchAssignedCourses = async () => {
    try {
      const res = await api.get(`/get/my-courses`, {});

      setCourses(res.data.courses);
      console.log(courses);
    } catch (err) {
      setErrors(
        err.response?.data?.error || "Failed to fetch assigned courses"
      );
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await api.get(`/auth/users/stats`);
      setStats(res.data);
      setErrors(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors("Session expired. Please log in again.");
        navigate("/login");
      } else {
        setErrors(err.response?.data?.error || "Failed to fetch statistics");
      }
    }
  };
  const fetchCaStats = async (level) => {
    try {
      const res = await api.get(`/auth/ca/stats/${level}`);
      setCaStats(res.data);
    } catch (error) {}
  };

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
  const fetchAllCourses = async () => {
    try {
      const res = await api.get(`/get/courses/all`);
      setCoursesByLevel(res.data);
      setSuccess("Courses fetched successfully");
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to fetch courses");
    }
  };
  const fetchAnnouncements = async () => {
    try {
      const res = await api.get(`/announcements`);
      setAnnouncements(res.data);
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to fetch announcements");
    }
  };

  const handleAnnouncementSubmit = async (
    values,
    { setSubmitting, resetForm }
  ) => {
    try {
      await api.post(`/announcements`, values);
      setSuccess("Announcement posted successfully");
      fetchAnnouncements();
      resetForm();
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const openNewSession = async () => {
    const newSession = prompt("Enter the new session (e.g., 2024/2025):");
    if (newSession) {
      try {
        await api.post(`/auth/new-session`, { newSession });
        setSuccess("New session opened successfully");
        fetchStats();
      } catch (err) {
        setErrors(err.response?.data?.error);
      }
    }
  };
  const updateNewSession = async () => {
    const newSession = prompt("Enter the new session (e.g., 2024/2025):");
    if (!newSession) {
      setWarning("Please input a valid new session.");
      return;
    }
    const payload = {
      newSession: newSession,
    };

    try {
      // Send the payload object
      const req = await api.post("/auth/update/new-session", payload);
      setUpdate(req.data.message);
    } catch (error) {
      console.log(error);
      setErrors(error.response?.data?.error || "Failed to update session.");
    }
  };
  // Mock chart data (role aware)
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "User Growth",
        data: [10, 20, 30, 40, 50, 60],
        backgroundColor: "rgba(59,130,246,0.7)",
      },
    ],
  };

  const chartOptions = { responsive: true };
  const AdminStats = [
    {
      icon: User,
      color: "blue",
      title: "Total Users",
      stats: stats.totalUsers,
    },
    {
      icon: User,
      color: "green",
      title: "Students",
      stats: stats.roles.student,
    },
    {
      icon: User,
      color: "purple",
      title: "Admins",
      stats: stats.roles.admin,
    },
    {
      icon: User,
      color: "orange",
      title: "Lecturers",
      stats: stats.roles.lecturer,
    },
    {
      icon: User,
      color: "teal",
      title: " Course Advisers",
      stats: stats.roles.course_adviser,
    },
    {
      icon: BarChart,
      color: "red",
      title: "Current Session",
      stats: stats.currentSession,
    },
    {
      icon: Check,
      color: "yellow",
      title: "Pending Approvals",
      stats: stats.pendingApprovals,
    },
    {
      icon: BookOpen,
      color: "indigo",
      title: "Total Courses",
      stats: coursesByLevel.length,
    },
  ];

  const Ca_Stats = [
    {
      icon: User,
      color: "green",
      title: "Students",
      stats: caStats.totalUsers,
    },
    {
      icon: BookOpen,
      color: "blue",
      title: "Courses",
      stats: coursesByLevel.length,
    },

    {
      icon: BarChart,
      color: "red",
      title: "Current Session",
      stats: userData.currentSession,
    },
    {
      icon: Check,
      color: "yellow",
      title: "Pending Approvals",
      stats: caStats.pendingApprovals,
    },
  ];

  const adminQl = [
    {
      icon: Users,
      color: "green",
      label: "Manage Users",
      path: "/home/manage-users",
    },

    {
      icon: FileText,
      color: "red",
      label: "Veiw Results",
      path: "/home/result-management",
    },
  ];
  return (
    <div className="pt-4 sm:pt-6 lg:pt-8 ">
      <div className="mx-auto ">
        {/* Stats (only admins/super admins see global stats) */}
        {userData.role === "admin" && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 gap-3 p-1.5 mb-8">
            {AdminStats.map((content, index) => {
              const Icon = content.icon;
              return (
                <div
                  key={index}
                  className=" bg-secondary_bg rounded-xl shadow-lg p-6 flex items-center"
                >
                  <Icon
                    className={`sm:h-10 sm:w-10 text-${content.color}-500 mr-4`}
                  />
                  <div>
                    <p className="text-balance text-sm  font-medium text-gray-500 dark:text-gray-400">
                      {content.title}
                    </p>
                    <p className="sm:text-xl text-balance text-lg  font-bold text-gray-800 dark:text-gray-100">
                      {content.stats}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {userData.role === "course_adviser" && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 gap-3 p-1.5 mb-8">
            {Ca_Stats.map((content) => {
              const Icon = content.icon;
              return (
                <div className="bg-secondary_bg rounded-xl shadow-lg p-6 flex items-center">
                  <Icon
                    className={`sm:h-10 sm:w-10 text-${content.color}-500 mr-4`}
                  />
                  <div>
                    <p className="text-balance text-sm  font-medium text-gray-500 dark:text-gray-400">
                      {content.title}
                    </p>
                    <p className="sm:text-xl text-balance text-lg  font-bold text-gray-800 dark:text-gray-100">
                      {content.stats}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Chart */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <Bar data={chartData} options={chartOptions} />
        </div> */}

        {userData.role === "lecturer" && (
          <div>
            {["admin", "course_adviser", "lecturer"].includes(
              userData.role
            ) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl mb-10 shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Assigned Courses
                </h3>
                {courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div
                        key={course.courseCode}
                        className="p-4 border-b border-gray-200 rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition space-y-1.5"
                      >
                        <p className="text-gray-700 dark:text-gray-300">
                          {course.courseCode} - {course.courseTitle}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          Credit - {course.credits}{" "}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          semester -{" "}
                          {course.semester === 1 ? "first" : "second"}{" "}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Role: Instructor
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No courses assigned.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Links (role specific) */}
          <div className="bg-secondary_bg text-textColor1 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.role === "admin" && (
                <>
                  {adminQl.map((content) => {
                    const Icon = content.icon;
                    return (
                      <button
                        onClick={() => navigate(content.path)}
                        className={`flex flex-col items-center text-white  shadow-md justify-center text-sm gap-3 cursor-pointer bg-${content.color}-500 rounded-lg p-3 hover:bg-${content.color}-600  transition`}
                      >
                        <Icon className={`sm:h-6 sm:w-6  `} />
                        {content.label}
                      </button>
                    );
                  })}
                  <div className="relative group inline-block">
                    <button
                      onClick={openNewSession}
                      className={`flex flex-col items-center text-white shadow-md justify-center text-sm gap-3 cursor-pointer bg-indigo-500 rounded-lg p-2 hover:bg-indigo-600 transition w-full`}
                    >
                      <Plus className="sm:h-6 sm:w-6 " />
                      Open New Session
                    </button>

                    {/* Tooltip Content */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 p-2 whitespace-nowrap  bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 z-10">
                      OPEN NEW SESSION AND PROMOTE STUDENT AND COURSE ADVISERS.
                      {/* Tooltip Arrow */}
                      <div
                        className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] 
                     w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"
                      ></div>
                    </div>
                  </div>

                  <div className="relative group inline-block">
                    <button
                      onClick={() => updateNewSession()}
                      className={`flex flex-col items-center text-white shadow-md justify-center text-sm gap-3 cursor-pointer bg-orange-500 rounded-lg p-2 hover:bg-orange-600 transition w-full`}
                    >
                      <Plus className="sm:h-6 sm:w-6 " />
                      Update Current Session
                    </button>

                    {/* Tooltip Content */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 p-2 whitespace-nowrap  bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 z-10">
                      Update the Current Session For All Users !important.
                      {/* Tooltip Arrow */}
                      <div
                        className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] 
                     w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"
                      ></div>
                    </div>
                  </div>
                </>
              )}

              {userData.role === "course_adviser" && (
                <button
                  onClick={() => navigate("/home/manage-student")}
                  className={`flex flex-col items-center text-white shadow-md justify-center text-sm gap-3 cursor-pointer bg-orange-500 rounded-lg p-2 hover:bg-orange-600 transition w-full`}
                >
                  <Users className="sm:h-6 sm:w-6 " />
                  Manage Students
                </button>
              )}

              <button
                onClick={() => navigate("/home/profile")}
                className={`flex flex-col items-center text-white shadow-md  justify-center text-sm gap-3 cursor-pointer bg-pink-500 rounded-lg p-3 hover:bg-pink-600  transition`}
              >
                <UserPen className="sm:h-6 sm:w-6 " />
                My Profile
              </button>
            </div>
          </div>

          {/* Announcements Section */}
          <div className="bg-secondary_bg rounded-xl shadow-lg p-6 ml-2 mr-2 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-textColor1">
              Recent Announcements
            </h3>
            {announcements.length ? (
              <div className="space-y-3 overflow-y-auto no-scrollbar  h-[45vh] sm:h-[18vh]">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 border border-gray-400 rounded-lg  dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 cursor-pointer"
                    onClick={() => setSelectedAnnouncement(a)}
                  >
                    <div className="flex items-center sm:w-3/12 text-textColor1 dark:text-textColor1 whitespace-nowrap">
                      <h2
                        className={`content-center text-center text-xl bg-gray-700 circle w-10 h-10 font-medium text-white transition-opacity duration-300 flex-shrink-0`}
                      >
                        {a.user?.firstName?.slice(0, 1).toUpperCase() || "U"}
                        {a.user?.lastName?.slice(0, 1).toUpperCase() || "N"}
                      </h2>
                      <div className="flex flex-col ml-3 transition-opacity duration-300 whitespace-nowrap">
                        <span className="">
                          {a.user?.firstName || "Unknown"}{" "}
                          {a.user?.lastName || "User"}
                        </span>
                        <small>{a.user?.role || "Admin"}</small>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-center justify-around sm:flex-row sm:w-10/12 gap-2">
                      <div className="space-y-1.5">
                        <p className="font-semibold">{a.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {a.message.substring(0, 100)}...{" "}
                          {/* Preview truncate */}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mt-1">
                          {moment(a.createdAt).format("MMM D, YYYY h:mm A")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-textColor1">No announcements found.</p>
            )}
          </div>
        </div>

        {/* Announcement Modal */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              <h2 className="text-2xl font-bold mb-4 text-textColor1">
                {selectedAnnouncement.title}
              </h2>
              <p className="text-gray-800 dark:text-gray-100 mb-4">
                {selectedAnnouncement.message}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Posted by {selectedAnnouncement.user?.firstName || "Unknown"}{" "}
                {selectedAnnouncement.user?.lastName || "User"} (
                {selectedAnnouncement.user?.role || "Admin"}) on{" "}
                {moment(selectedAnnouncement.createdAt).format(
                  "MMM D, YYYY h:mm A"
                )}
              </p>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Announcement form (admins only) */}
        {["admin", "super_admin"].includes(userData.role) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4">Make Announcement</h3>
            <Formik
              initialValues={{ audience: "", title: "", message: "" }}
              validationSchema={announcementSchema}
              onSubmit={handleAnnouncementSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4 mt-3">
                  <div>
                    <Field
                      as="select"
                      name="audience"
                      className=" p-5 sm:p-2 w-full border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border-none  focus:outline-none bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                    >
                      <option value="">Select Audience</option>
                      <option value="staff">Staffs Only</option>
                      <option value="everyone">EveryBody</option>
                    </Field>
                  </div>
                  <div>
                    <Field
                      name="title"
                      placeholder="Title"
                      className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <ErrorMessage
                      name="title"
                      component="p"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div className="">
                    <Field
                      as="textarea"
                      name="message"
                      rows="4"
                      cols="90"
                      placeholder="Message"
                      className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <ErrorMessage
                      name="message"
                      component="p"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn bg-blue-500"
                  >
                    <Send size={16} className="mr-2" /> Post
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi, useDetails } from "./context/ContextProvider";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Save,
  Book,
  Calendar,
  AlertCircle,
  Check,
  Edit,
  HelpCircle,
  X,
  Trash2,
  Undo2,
} from "lucide-react";
import NotifyModel from "./global/NotifyModel";

// Validation schema for profile form
const profileSchema = Yup.object({
  role: Yup.string().required("Role is required"),
  firstName: Yup.string().optional(),
  lastName: Yup.string().optional(),
  email: Yup.string().email("Invalid email format").optional(),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  // .matches(
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  //   'Password must contain at least one uppercase, one lowercase, one number, and one special character'
  // )
});

const Profile = () => {
  const { userData, adminId, fetchUser, setErrors, setSuccess, setWarning } =
    useDetails();

  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const api = useApi();

  useEffect(() => {
    if (!userData.role) {
      setErrors("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    // if (role === 'student') {
    //   fetchEnrolledCourses();
    //   fetchAttendance();
    // } else if (['admin', 'course_adviser', 'lecturer'].includes(role)) {
    // }
  }, [userData.role, navigate]);

  const fetchEnrolledCourses = async () => {
    // try {
    //   const res = await axios.get(`${import.meta.env.VITE_API_URL}/courses/enrolled`, {
    //   });
    //   setCourses(res.data);
    // } catch (err) {
    //   setErrors(err.response?.data?.error || 'Failed to fetch enrolled courses');
    // }
  };

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

  const fetchAttendance = async () => {
    // try {
    //   const res = await axios.get(`${import.meta.env.VITE_API_URL}/attendance`, {
    //   });
    //   setAttendance(res.data);
    // } catch (err) {
    //   setErrors(err.response?.data?.error || 'Failed to fetch attendance');
    // }
  };

  const handleProfileUpdate = async (values, { setSubmitting }) => {
    const payload = {
      role: values.role,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email.toLowerCase(),
      password: values.password ? values.password : null,
      matnumber:
        userData.role === "student" ? values.matnumber.toUpperCase() : "N/A",
      uniqueId: values.uniqueId,
    };

    if (!payload.password) delete payload.password;
    if (userData.role !== "student") delete payload.matnumber;

    console.table(payload);
    try {
      await api.patch(`/auth/profile/update`, payload);

      setSuccess("Profile updated successfully");
      setErrors(null);
      setIsEditing(false);
      fetchUser();
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors("Session expired. Please log in again.");
        navigate("/login");
      } else {
        setErrors(err.response?.data?.error || "Failed to update profile");
      }
      setSuccess(null);
    }

    setSubmitting(false);
  };

  // const handleCourseRegistration = async (courseId) => {
  //   if (!role ) {
  //     setErrors('User session not found. Please log in again.');
  //     navigate('/login');
  //     return;
  //   }
  //   try {
  //     await axios.post(
  //       `${import.meta.env.VITE_API_URL}/courses/register`,
  //       { courseId },
  //
  //     );
  //     setSuccess('Course registered successfully');
  //     setErrors(null);
  //     fetchEnrolledCourses();
  //   } catch (err) {
  //     if (err.response?.status === 401) {
  //       setErrors('Session expired. Please log in again.');
  //       navigate('/login');
  //     } else {
  //       setErrors(err.response?.data?.error || 'Failed to register course');
  //     }
  //     setSuccess(null);
  //   }
  // };

  const deleteProfile = async () => {
    try {
      if (userData.unique_id === adminId) {
        setWarning("Cannot delete this profile");
      } else {
        const req = await api.delete(`/auth/delete/${userData.unique_id}`);
        setIsDeleting(false);
        fetchUser();
        setSuccess(req.data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const undoDelete = async () => {
    try {
      if (userData.unique_id === adminId) {
        setWarning("Cannot perform action");
      } else {
        const req = await api.delete(`/auth/undo-delete/${userData.unique_id}`);
        setIsDeleting(false);
        fetchUser();
        setSuccess(req.data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const [stdCourses, setStdCourses] = useState([]);
   const [searchTerm, setSearchTerm] = useState("");

  const fetchStdCourses = async () => {
    try {
      const res = await api.get("/get/courses");
      setStdCourses(res.data);
      setSuccess("Courses fetched successfully");
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to fetch courses");
    }
  };

    // Filter + group courses by level
  const filteredCourses = stdCourses.filter((c) =>
    [c.courseTitle, c.courseCode].some((f) =>
      f?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const coursesByLevel = filteredCourses.reduce((acc, c) => {
    if (!acc[c.level]) acc[c.level] = [];
    acc[c.level].push(c);
    return acc;
  }, {});
  const sortedLevels = Object.keys(coursesByLevel).sort(
    (a, b) => Number(a) - Number(b)
  );


  return (
    <>
      {isDeleting && (
        <div className="bg-black/30 overflow-hidden fixed w-full h-full left-0 top-0 flex justify-center items-center ">
          <div
            className={`relative bg-gray-800 dark:bg-white text-white dark:text-black w-sm rounded-lg flex flex-col text-wrap text-sm
        gap-y-3 h-fit p-4 shadow-lg `}
          >
            <X
              className="absolute right-3 top-3"
              onClick={() => setIsDeleting(!isDeleting)}
            />
            <h2 className="font-bold">Warning !</h2>
            <div className="pt-1 space-y-1">
              <p>Are Sure You want to delete your profile ? </p>
              <small className="text-sm">All record will be deleted </small>
              <p>
                Account will be on pending delete for 1 Month Before Permanent
                delete
              </p>
            </div>
            <div className="flex justify-center mt-1">
              <button
                className="bg-secondary_bg p-2 hover:bg-shadow-textColor1 rounded-lg min-w-20 text-textColor1"
                onClick={deleteProfile}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      <div className=" min-h-screen  ">
        <div className=" mx-auto">
          {/* Tabs */}
          <div className="flex mt-5 sm:flex-row gap-5 mb-6 w-full">
            <button
              className={`px-4 py-2 text-lg font-medium ${
                activeTab === "profile"
                  ? " bg-primary-blue text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              } rounded-lg transition`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            {userData.role === "student" && (
              <>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "courses"
                      ? " bg-primary-blue text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  } rounded-lg transition`}
                  onClick={() => {setActiveTab("courses"); fetchStdCourses();}}
                >
                  Courses
                </button>
              </>
            )}
            {["admin", "course_adviser", "lecturer"].includes(
              userData.role
            ) && (
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "courses"
                    ? " bg-primary-blue text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                } rounded-lg transition`}
                onClick={() => {
                  setActiveTab("courses");
                  fetchAssignedCourses();
                }}
              >
                Assigned Courses
              </button>
            )}
          </div>

          {/* Profile Section */}
          {activeTab === "profile" && (
            <div className="bg-secondary_bg rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Profile Details
                </h3>

                {!isEditing && (
                  <div className="flex md:gap-x-5 gap-x-2 mt-4 md:m-0 ">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center text-sm md:text-md  px-4 py-2 text-white rounded-lg  hover:bg-primary-blue-hover bg-primary-blue transition"
                    >
                      <Edit size={16} className="mr-2" /> Edit Profile
                    </button>
                    {userData.unique_id !== adminId && (
                      <>
                        {!userData.is_deleted ? (
                          <button
                            onClick={() => setIsDeleting(!isDeleting)}
                            className="flex items-center px-4 py-2  text-white rounded-lg hover:bg-primary-blue-hover bg-primary-blue transition"
                          >
                            <Trash2 size={16} className="mr-2" /> Delete Profile
                          </button>
                        ) : (
                          <button
                            onClick={undoDelete}
                            className="flex items-center px-4 py-2  text-white rounded-lg hover:bg-primary-blue-hover bg-primary-blue transition"
                          >
                            <Undo2 size={16} className="mr-2" /> Undo Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Full Name
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{`${userData.firstName} ${userData.lastName}`}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {userData.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Role
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {userData.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Role ID
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {userData.unique_id}
                    </p>
                  </div>
                  {userData.role === "student" && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Matnumber
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {userData.matNumber || "N/A"}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <Formik
                  initialValues={{
                    role: userData.role,
                    firstName: userData.firstName || "",
                    lastName: userData.lastName || "",
                    email: userData.email || "",
                    password: "",
                    matnumber: userData.matNumber || "",
                    uniqueId: userData.unique_id,
                  }}
                  validationSchema={profileSchema}
                  onSubmit={handleProfileUpdate}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            First Name
                          </label>
                          <Field
                            name="firstName"
                            type="text"
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <ErrorMessage
                            name="firstName"
                            component="p"
                            className="text-red-500 dark:text-red-400 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Last Name
                          </label>
                          <Field
                            name="lastName"
                            type="text"
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <ErrorMessage
                            name="lastName"
                            component="p"
                            className="text-red-500 dark:text-red-400 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                          </label>
                          <Field
                            name="email"
                            type="email"
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <ErrorMessage
                            name="email"
                            component="p"
                            className="text-red-500 dark:text-red-400 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password (leave blank to keep unchanged)
                          </label>
                          <Field
                            name="password"
                            type="password"
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <ErrorMessage
                            name="password"
                            component="p"
                            className="text-red-500 dark:text-red-400 text-sm"
                          />
                        </div>
                        {userData.role === "student" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Matnumber
                            </label>
                            <Field
                              name="matnumber"
                              type="text"
                              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <ErrorMessage
                              name="matnumber"
                              component="p"
                              className="text-red-500 dark:text-red-400 text-sm"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-4 mt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting || !userData.role}
                          className="flex items-center px-4 py-2 hover:bg-primary-blue-hover bg-primary-blue text-white rounded-lg transition disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center">
                              <svg
                                className="animate-spin h-4 sm:h-5 w-4 sm:w-5 mr-2 text-white"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8z"
                                />
                              </svg>
                              Updating...
                            </span>
                          ) : (
                            <>
                              <Save size={16} className="mr-2" /> Save Changes
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              )}
            </div>
          )}

          {/* Student: Enrolled Courses and Registration */}
          {userData.role === "student" && activeTab === "courses" && (
            <div className="">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Enrolled Courses
              </h3>
              {!stdCourses.length ? (
                <p className="p-6 text-gray-500">No courses available.</p>
              ) : (
                sortedLevels.map((level) => (
                  <div
                    key={level}
                    className="bg-secondary_bg mb-8 rounded-xl  shadow-lg"
                  >
                    <div className="p-4 ">
                      <h3 className="text-lg font-semibold">
                        {level} Level Courses
                      </h3>
                      <p className="text-sm text-gray-400">
                        {coursesByLevel[level].length} course(s)
                      </p>
                    </div>

                    <div className="overflow-x-auto p-2">
                      <table className="w-full table-auto text-wrap sm:table-fixed overflow-x-auto">
                        <thead>
                          <tr>
                            <th className="text-left p-3">Code</th>
                            <th className="text-left p-3">Title</th>
                            <th className="text-left p-3">Credits</th>
                            <th className="text-left p-3">Semester</th>
                            <th className="text-left p-3">Lecturer(s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coursesByLevel[level].map((course) => (
                            <tr
                              key={course.id}
                              className="border-t border-gray-200 hover:bg-gray-100"
                            >
                              <td className="p-2 text-sm sm:text-base">
                                {course.courseCode}
                              </td>
                              <td className="p-2 text-sm sm:text-base">
                                {course.courseTitle}
                              </td>
                              <td className="p-2 text-sm sm:text-base">
                                {course.credits}
                              </td>
                              <td className="p-2 text-sm sm:text-base">
                                Semester {course.semester}
                              </td>
                              <td className="p-2">
                                {course.lecturers?.length > 0 ? (
                                  <div>
                                    {course.lecturers.map((lec) => (
                                      <div key={lec.unique_id}>
                                        {lec.firstName} {lec.lastName}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="italic text-gray-400">
                                    No lecturer assigned
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Student: Attendance */}
          {/* {role === 'student' && activeTab === 'attendance' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Attendance</h3>
            {attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Course</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr
                        key={record.id}
                        className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm">{record.course_code}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm">{record.date}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm">
                          {record.status === 'present' ? (
                            <span className="text-green-500">Present</span>
                          ) : (
                            <span className="text-red-500">Absent</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No attendance records found.</p>
            )}
          </div>
        )} */}

          {/* Staff: Assigned Courses */}
          {["admin", "course_adviser", "lecturer"].includes(userData.role) &&
            activeTab === "courses" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
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
      </div>
    </>
  );
};

export default Profile;

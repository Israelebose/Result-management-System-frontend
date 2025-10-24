import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDetails } from "../context/ContextProvider";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Save, Book, Calendar, AlertCircle, Check, Edit } from "lucide-react";

const AdminProfileEditor = () => {
  // Validation schema for profile form
  const profileSchema = Yup.object({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase, one lowercase, one number, and one special character"
      )
      .optional(),
    matnumber: Yup.string()
      .matches(/^ENG\d{7}$/, "Matnumber must be in format ENG1234567")
      .optional(),
    department: Yup.string().optional(),
  });

  const { role, adminId, adminMail, checkToken } = useDetails();
  const { userId } = useParams(); // Get userId from URL
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const isAdminView =
    userId && ["admin", "super-admin"].includes(role) && userId !== adminId;
  const targetUserId = isAdminView ? userId : adminId;

  useEffect(() => {
    if (!role) {
      setError("Session expired. Please log in again.");
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [role, checkToken, navigate, targetUserId, isAdminView]);

  const fetchProfile = async () => {
    try {
      const url = isAdminView
        ? `${import.meta.env.VITE_API_URL}/auth/users/${targetUserId}`
        : `${import.meta.env.VITE_API_URL}/auth/profile`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${checkToken}` },
      });
      setProfile(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        navigate("/login");
      } else {
        setError(err.response?.data?.error || "Failed to fetch profile");
      }
    }
  };

  const handleProfileUpdate = async (values, { setSubmitting }) => {
    try {
      const updateData = { ...values };
      if (!updateData.password) delete updateData.password;
      if (profile.role !== "student") delete updateData.matnumber;
      if (!["admin", "course_adviser", "lecturer"].includes(profile.role))
        delete updateData.department;

      const url = isAdminView
        ? `${import.meta.env.VITE_API_URL}/auth/users/${targetUserId}`
        : `${import.meta.env.VITE_API_URL}/auth/profile`;
      await axios.patch(url, updateData, {
        headers: { Authorization: `Bearer ${checkToken}` },
      });
      setSuccess("Profile updated successfully");
      setError(null);
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        navigate("/login");
      } else {
        setError(err.response?.data?.error || "Failed to update profile");
      }
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className=" bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 flex justify-center items-center">
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className=" bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          {isAdminView
            ? `${profile.firstName} ${profile.lastName}'s Profile`
            : "My Profile"}
        </h2>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "profile"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            } rounded-lg transition`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <p className="text-red-500 dark:text-red-400 mb-4 flex items-center">
            <AlertCircle size={16} className="mr-2" /> {error}
          </p>
        )}
        {success && (
          <p className="text-green-500 dark:text-green-400 mb-4 flex items-center">
            <Check size={16} className="mr-2" /> {success}
          </p>
        )}

        {/* Profile Section */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Profile Details
              </h3>
              {!isEditing && (isAdminView || !isAdminView) && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-400 transition"
                >
                  <Edit size={16} className="mr-2" />{" "}
                  {isAdminView ? "Edit User Profile" : "Edit Profile"}
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Full Name
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{`${profile.firstName} ${profile.lastName}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {profile.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {profile.role}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role ID
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {profile.role_id}
                  </p>
                </div>
                {profile.role === "student" && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Matnumber
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {profile.matnumber || "N/A"}
                    </p>
                  </div>
                )}
                {["admin", "course_adviser", "lecturer"].includes(
                  profile.role
                ) && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Department
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {profile.department || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Formik
                initialValues={{
                  firstName: profile.firstName || "",
                  lastName: profile.lastName || "",
                  email: profile.email || "",
                  password: "",
                  matnumber: profile.matnumber || "",
                  department: profile.department || "",
                }}
                validationSchema={profileSchema}
                onSubmit={handleProfileUpdate}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      {profile.role === "student" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      {["admin", "course_adviser", "lecturer"].includes(
                        profile.role
                      ) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Department
                          </label>
                          <Field
                            name="department"
                            type="text"
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <ErrorMessage
                            name="department"
                            component="p"
                            className="text-red-500 dark:text-red-400 text-sm"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-4 mt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting || !role || !checkToken}
                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-400 transition disabled:opacity-50"
                      >
                        <Save size={16} className="mr-2" /> Save Changes
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
      </div>
    </div>
  );
};

export default AdminProfileEditor;

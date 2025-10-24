import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useApi, useDetails } from "./context/ContextProvider";
import { GraduationCap, Lock } from "lucide-react";
import ModeToggle from "./ModeToggle";

const LoginSchema = (isStaff) =>
  Yup.object().shape({
    email: isStaff
      ? Yup.string().required("Email is required").email("Invalid email format")
      : Yup.string().notRequired(),

    matnumber: !isStaff
      ? Yup.string()
          .required("Matriculation number is required")
          .matches(
            /^[E-N]{3}[0-9]{7}$/i,
            "Matriculation number must start with 'ENG'"
          )
      : Yup.string().notRequired(),

    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

const Login = () => {
  const { fetchUser, setSuccess, success, setErrors, error, role, userData } =
    useDetails();
  const api = useApi();
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();
  const [rol, setRol] = useState();
  const [isStaff, setIsStaff] = useState(false);

  //Auto-redirect if already logged in
  useEffect(() => {
    if (rol) {
      navigate("/home");
    }
  }, [rol]);

// Inside the Login component
const submit = async (values, { setSubmitting }) => {
  try {
    const payload = {
      email: isStaff ? values.email.toLowerCase() : null,
      matnumber: !isStaff ? values.matnumber.toUpperCase() : null,
      password: values.password,
    };
    // 1. Send Login Request
    const req = await api.post("/auth/login", payload);
    const currentRole = req.data.role; // Get the role from the immediate response
    const refreshResult = fetchUser(); 
    
    setSuccess(req.data.message);
    setErrors(null); 

    // 4. Perform Navigation Check
    // We confirm the context update worked (if fetchUser returns a truthy value)
    // AND that we received a role.
    if (refreshResult && currentRole) {
        setRol(currentRole);  
        navigate("/home", { replace: true });
    } else {
        // If the refresh failed or role was missing (shouldn't happen on success)
        setErrors("Login successful, but user details failed to load.");
        navigate("/login", { replace: true });
    }
  } catch (err) {
    const errorMsg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      "Unexpected error occurred";

    setErrors(errorMsg);
    setSuccess(null); // Clear success message on error
  }

  setSubmitting(false);
};

  return (
    <>
      {/* <div className="fixed sm:right-10 sm:top-5 top-2 right-5 ">
        <ModeToggle />
      </div> */}
      <div className="flex items-center justify-center min-h-screen bg-primary_bg  px-4 sm:px-6 lg:px-8 ">
        <div className="bg-secondary_bg p-4 sm:p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm sm:max-w-md md:max-w-lg">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 text-textColor1">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full  flex items-center justify-center bg-gray-100 dark:bg-gray-700  ">
              <GraduationCap className="h-10 w-10 text-textColor1" />
            </div>
            <h5 className="text-2xl">University of Benin</h5>
            <p className="text-sm font-normal mt-2 text-gray-500 dark:text-gray-400">
              Department of Computer Engineering
              <br />
              Grade Management System
            </p>
            <div className="gap-5 mb-10 flex justify-center">
              <button
                className={`text-center  p-3 rounded-lg    mt-4 text-xs sm:text-base   ${
                  !isActive
                    ? " bg-primary-blue text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                } `}
                onClick={() => {
                  setIsStaff(false);
                  setIsActive(false);
                }}
              >
                Login as Student
              </button>
              <button
                className={`text-center p-3 rounded-lg mt-4 text-xs sm:text-base text-textColor1 ${
                  isActive
                    ? " bg-primary-blue text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                } `}
                onClick={() => {
                  setIsStaff(true);
                  setIsActive(true);
                }}
              >
                Login as Staff
              </button>
            </div>
          </div>
          <Formik
            initialValues={{
              matnumber: "",
              email: "",
              password: "",
            }}
            validationSchema={LoginSchema(isStaff)}
            onSubmit={submit}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-4 sm:space-y-6">
                {/* <div>
                  <label
                    htmlFor="role"
                    className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    Role
                  </label>
                  <Field
                    as="select"
                    name="role"
                    className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500 "
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="course_adviser">Course Adviser</option>
                  </Field>
                  <ErrorMessage
                    name="role"
                    component="p"
                    className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                  />
                </div> */}

                {isStaff ? (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email
                    </label>
                    <Field
                      type="email"
                      name="email"
                      className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Enter your email"
                    />
                    <ErrorMessage
                      name="email"
                      component="p"
                      className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                    />
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="matnumber"
                      className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                    >
                      Matriculation Number
                    </label>
                    <Field
                      type="text"
                      name="matnumber"
                      className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Enter your matriculation number"
                    />
                    <ErrorMessage
                      name="matnumber"
                      component="p"
                      className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    Password
                  </label>
                  <Field
                    type="password"
                    name="password"
                    className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your password"
                  />
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full  text-white p-2 sm:p-3 rounded-md hover:bg-primary-blue-hover bg-primary-blue disabled:bg-blue-300 dark:disabled:bg-blue-900 transition duration-200 text-sm sm:text-base"
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
                      Logging in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>
              </Form>
            )}
          </Formik>
          {/* <div className="flex justify-center">
            {!isStaff ? (
              <button
                className="text-center p-3 rounded-lg mt-4 text-xs sm:text-base text-textColor1 bg-gray-200 dark:bg-gray-700 "
                onClick={() => setIsStaff(true)}
              >
                Login as Staff
              </button>
            ) : (
              <button
                className="text-center  p-3 rounded-lg    mt-4 text-xs sm:text-base text-textColor1 bg-gray-200 dark:bg-gray-700 "
                onClick={() => setIsStaff(false)}
              >
                Login as Student
              </button>
            )}
          </div> */}
          <p className="text-center mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            forgot password?{" "}
            <Link
              to="/forgot-password"
              className="text-blue-500 dark:text-blue-400 hover:underline"
            >
              Reset Password
            </Link>
          </p>
          <p className="text-center mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-500 dark:text-blue-400 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;

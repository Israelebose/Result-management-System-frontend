import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApi, useDetails } from "./context/ContextProvider";
import { GraduationCap } from "lucide-react";
import ModeToggle from "./ModeToggle";

const Register = () => {
  const { error, setErrors, success, setSuccess } = useDetails();
  const [isStaff, setIsStaff] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();
  const api = useApi();

  const RegisterSchema = (isStaff) =>
    Yup.object().shape({
      email: Yup.string()
        .required("Email is required")
        .email("Invalid email format"),

      matnumber: !isStaff
        ? Yup.string().required("Matriculation number is required")
        : // .matches(/^[E-N]{3}[0-9]{7}$/i, 'Matriculation number must start with \'ENG\''),
          Yup.string().notRequired(),

      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),

      firstName: Yup.string()
        .min(2, "Name must be at least 2 characters")
        .matches(/^[a-zA-Z\s'-]+$/, "Please Check Your Name")
        .required("Name is required"),

      lastName: Yup.string()
        .min(2, "Name must be at least 2 characters")
        .matches(/^[a-zA-Z\s'-]+$/, "Please Check Your Name")
        .required("Name is required"),

      level: !isStaff
        ? Yup.number().required("level is required")
        : Yup.number().notRequired(),

      gender: !isStaff
        ? Yup.string().required("gender is required")
        : Yup.string().notRequired(),
      entryMode: !isStaff
        ? Yup.string().required("Please select an entry mode")
        : Yup.string().notRequired(),

      session: !isStaff
        ? Yup.string()
            .required("Session is required")
            .matches(/^\d{4}\/\d{4}$/, "Session must be in the format Above")
        : Yup.string().notRequired(),

      currentSession: !isStaff
        ? Yup.string()
            .required("Current Session is required")
            .matches(/^\d{4}\/\d{4}$/, "Session must be in the format Above")
        : Yup.string().notRequired(),
    });

  const submitForm = async (values, { setSubmitting }) => {
    try {
      const payload = {
        role: isStaff ? "lecturer" : "student",
        matnumber: values.matnumber ? values.matnumber.toUpperCase() : null,
        level: values.level ? Number(values.level) : null,
        gender: values.gender ? values.gender : null,
        password: values.password,
        email: values.email.toLowerCase(),
        firstName: values.firstName,
        lastName: values.lastName,
        entryMode: values.entryMode ? values.entryMode : null,
        session: values.session ? values.session : null,
        currentSession: values.currentSession ? values.currentSession : null,
      };
      console.table(payload);

      const req = await api.post(`/auth/register`, payload);
      setSuccess(req.data.message);
      console.log(req.data.message);

      navigate("/login");
    } catch (err) {
      setErrors(err.response.data.error);
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* <div className="fixed right-10 top-5">
        <ModeToggle />
      </div> */}
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 pt-20">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm sm:max-w-md md:max-w-lg">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 text-textColor1">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gray-300/10 bg-primary/10 flex items-center justify-center ">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <h5 className="text-2xl">University of Benin</h5>
            <p className="text-sm font-normal mt-2 text-gray-500 dark:text-gray-400">
              Department of Computer Engineering
              <br />
              Result Management System
            </p>
          </div>
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
              Register as Student
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
              Register as Staff
            </button>
          </div>
          <Formik
            initialValues={{
              role: " ",
              matnumber: "",
              email: "",
              password: "",
              firstName: "",
              lastName: "",
              session: "",
              level: 0,
              currentSession: "",
              gender: "",
              entryMode: "",
            }}
            validationSchema={RegisterSchema(isStaff)}
            onSubmit={submitForm}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4 sm:space-y-6">
                {/* NAMEEE */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    First Name
                  </label>
                  <Field
                    type="text"
                    name="firstName"
                    className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your First name"
                  />
                  <ErrorMessage
                    name="firstName"
                    component="p"
                    className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    Last Name
                  </label>
                  <Field
                    type="text"
                    name="lastName"
                    className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your Last name"
                  />
                  <ErrorMessage
                    name="lastName"
                    component="p"
                    className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                  />
                </div>
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
                {/* //////////////////// */}
                {!isStaff && (
                  <>
                    {/* Matriculation Number */}
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

                    {/* level  */}
                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                      >
                        Level
                      </label>
                      <Field
                        as="select"
                        name="level"
                        className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                      >
                        <option value={0}>select Your level</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={300}>300</option>
                        <option value={400}>400</option>
                        <option value={500}>500</option>
                      </Field>
                      <ErrorMessage
                        name="level"
                        component="p"
                        className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                      />
                    </div>

                    {/* gender  */}
                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                      >
                        Gender
                      </label>
                      <Field
                        as="select"
                        name="gender"
                        className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                      >
                        <option value="">select Your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </Field>
                      <ErrorMessage
                        name="gender"
                        component="p"
                        className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                      />
                    </div>

                    {/* entrymode  */}
                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                      >
                        Gender
                      </label>
                      <Field
                        as="select"
                        name="entryMode"
                        className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                      >
                        <option value="">Entry Mode</option>
                        <option value="Regular">Regular</option>
                        <option value="Transfer">Transfer</option>
                        <option value="DirectEntry">Direct Entry</option>
                      </Field>
                      <ErrorMessage
                        name="entryMode"
                        component="p"
                        className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                      />
                    </div>

                    {/* session */}
                    <div>
                      <label
                        htmlFor="session"
                        className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                      >
                        Session (e.g., 2019/2020)
                      </label>
                      <Field
                        type="text"
                        name="session"
                        className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Enter your Session "
                      />
                      <ErrorMessage
                        name="session"
                        component="p"
                        className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                      />
                    </div>
                    {/* current session */}
                    <div>
                      <label
                        htmlFor="currentSession"
                        className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
                      >
                        Current Session (e.g., 2019/2020)
                      </label>
                      <Field
                        type="text"
                        name="currentSession"
                        className="mt-1 p-2 sm:p-3 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-500 dark:text-gray-400 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Enter the Current Session "
                      />
                      <ErrorMessage
                        name="currentSession"
                        component="p"
                        className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1"
                      />
                    </div>
                  </>
                )}

                {/* PASSWORD */}
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
                      Registering...
                    </span>
                  ) : (
                    "Register"
                  )}
                </button>
              </Form>
            )}
          </Formik>

          <p className="text-center mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-500 dark:text-blue-400 hover:underline"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;

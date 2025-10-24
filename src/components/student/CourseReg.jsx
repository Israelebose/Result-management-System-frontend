import React, { useEffect, useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import { CheckCircle, Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import * as Yup from "yup";
import Select, { components } from "react-select";
import { useApi, useDetails } from "../context/ContextProvider";

const CourseReg = () => {
  // declare state variables
  const { userData, setErrors, success, setSuccess } = useDetails();
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("Not Registered");
  const [currentMaxCredits, setCurrentMaxCredits] = useState({
    first: "--",
    second: "--",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      // role check — if you don't want to force redirect in local dev, comment out
      if (userData.role && userData.role !== "student") {
        setErrors && setErrors("Unauthorized. Please log in again.");
        navigate("/login");
        return;
      }
     
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  // Level-specific credit limits for each semester
  const levelCredits = {
    100: { first: 24, second: 20 },
    200: { first: 26, second: 22 },
    300: { first: 28, second: 24 },
    400: { first: 30, second: 26 },
    500: { first: 30, second: 28 },
  };

  // Utility to get current date/time for the form footer
  const currentDate = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Fetch courses from API
  const loadCourses = async () => {
    setLoading(true);

    // Original API call
    await api
      .get("/get/courses/all")
      .then((response) => {
        setCourses(response.data);
        setSuccess(response.data.message || "Courses loaded successfully");
      })
      .catch((err) => {
        setErrors(err.error || "Failed to load courses.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Separate courses by semester
  const firstSemesterCourses = courses.filter(
    (course) => course.semester === 1
  );
  const secondSemesterCourses = courses.filter(
    (course) => course.semester === 2
  );

  // Get a structured list of selected courses (code and credits)
  const getSelectedCourseDetails = (courseIds, allSemesterCourses) => {
    return courseIds
      .map((id) => allSemesterCourses.find((c) => c.id === id))
      .filter(Boolean)
      .map((course) => ({
        code: course.courseCode,
        credits: course.credits,
      }));
  };

  // Calculate total credits for selected courses in a semester
  const calculateTotalCredits = (selectedCourseIds, semesterCourses) => {
    if (!selectedCourseIds) return 0;
    return selectedCourseIds.reduce((total, courseId) => {
      const course = semesterCourses.find((c) => c.id === courseId);
      return total + (course ? course.credits : 0);
    }, 0);
  };

  // Get course details by ID
  const getCourseDetails = (courseId) => {
    return courses.find((course) => course.id === courseId);
  };

  // Formik configuration and validation
  const formik = useFormik({
    initialValues: {
      // Use userData for initial values
      firstName: userData.firstName,
      lastName: userData.lastName,
      studentId: userData.matNumber,
      studentLevel: userData.level, // Default to 500 for the image context
      firstSemesterCourses: [],
      secondSemesterCourses: [],
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required("Required"),
      lastName: Yup.string().required("Required"),
      studentId: Yup.string().required("Required"),
      studentLevel: Yup.number()
        .required("Required")
        .oneOf([100, 200, 300, 400, 500], "Invalid level"),
      firstSemesterCourses: Yup.array().test(
        "credit-limit",
        "First semester credits exceeded",
        function (value) {
          if (!this.parent.studentLevel) return true; // Skip validation if no level selected
          const max = levelCredits[this.parent.studentLevel]?.first;
          return calculateTotalCredits(value, firstSemesterCourses) <= max;
        }
      ),
      secondSemesterCourses: Yup.array().test(
        "credit-limit",
        "Second semester credits exceeded",
        function (value) {
          if (!this.parent.studentLevel) return true; // Skip validation if no level selected
          const max = levelCredits[this.parent.studentLevel]?.second;
          return calculateTotalCredits(value, secondSemesterCourses) <= max;
        }
      ),
    }),

    onSubmit: (values, { setSubmitting }) => {
      // Prepare data for submission
      const submissionData = {
        session: userData.currentSession,
        firstSemesterCourses: values.firstSemesterCourses,
        secondSemesterCourses: values.secondSemesterCourses,
        totalCredit: firstSemesterCredits + secondSemesterCredits, // Use calculated credits
      };

      if (
        submissionData.firstSemesterCourses.length === 0 &&
        submissionData.secondSemesterCourses.length === 0
      ) {
        setErrors("Please select at least 1 courses to register.");
        setSubmitting(false);
        return;
      }

      if (
        submissionData.firstSemesterCourses.length > currentMaxCredits.first &&
        submissionData.secondSemesterCourses.length > currentMaxCredits.second
      ) {
        setErrors("it exceeds the credit load .");
        setSubmitting(false);
        return;
      }
      // post or send student data to backend
      api
        .post("post/register-courses", submissionData)
        .then((response) => {
          setSuccess(response.data.message || "Registration successful!");
          setSubmitting(false);
        })
        .catch((err) => {
          setErrors(err.message || "Registration failed.");
          setSubmitting(false);
        });

      console.log(submissionData);
    },
  });

  // Calculate current credit totals (outside formik for component display)
  const firstSemesterCredits = calculateTotalCredits(
    formik.values.firstSemesterCourses,
    firstSemesterCourses
  );

  const secondSemesterCredits = calculateTotalCredits(
    formik.values.secondSemesterCourses,
    secondSemesterCourses
  );

  const selectedCoursesFirst = getSelectedCourseDetails(
    formik.values.firstSemesterCourses,
    firstSemesterCourses
  );

  const selectedCoursesSecond = getSelectedCourseDetails(
    formik.values.secondSemesterCourses,
    secondSemesterCourses
  );

  // Update max credits when level changes
  useEffect(() => {
    // Use the level from Formik's state to allow the user to change it,
    // otherwise default to the level from userData.
    const currentLevel = formik.values.studentLevel || userData.level;

    if (currentLevel && levelCredits[currentLevel]) {
      setCurrentMaxCredits(levelCredits[currentLevel]);
    } else {
      setCurrentMaxCredits({ first: "--", second: "--" });
    }
    fetchRegistrationStatus();
  }, [formik.values.studentLevel, userData.level, success]);

  const fetchRegistrationStatus = async () => {
    try {
      const response = await api.get("/get/registration/status");
      setStatus(response.data.message);
    } catch (error) {
      setErrors("Failed to fetch registration status.");
    }
  };
  // Format options for React-Select for course selection
  const formatOptions = (courseList) => {
    return courseList.map((course) => ({
      value: course.id,
      label: `${course.courseCode} - ${course.courseTitle} (${course.credits} credits) - ${course.level}`,
      credits: course.credits,
    }));
  };

  // Handle Course Deletion
  const handleDeleteCourse = (courseId, semester) => {
    if (semester === "first") {
      const updatedCourses = formik.values.firstSemesterCourses.filter(
        (id) => id !== courseId
      );
      formik.setFieldValue("firstSemesterCourses", updatedCourses);
    } else {
      const updatedCourses = formik.values.secondSemesterCourses.filter(
        (id) => id !== courseId
      );
      formik.setFieldValue("secondSemesterCourses", updatedCourses);
    }
  };

  const regDetails = [
    {
      title: "Name",
      value: `${userData.firstName} ${userData.lastName}`,
    },
    {
      title: "Level",
      value: `${userData.level}`,
    },
    {
      title: "Current Session",
      value: `${userData.currentSession} `,
    },
    {
      title: "Entry Session",
      value: `${userData.session} `,
    },
    {
      title: "Gender",
      value: `${userData.gender} `,
    },
  ];

  const printForm = () => {
    const printWindow = window.open("", "", "height=800, width=600");
    printWindow.document.write(
      "<html><head><title>Course Registration Form</title>"
    );
    printWindow.document.write(
      "<style>body { font-family: Arial, sans-serif; font-size: 12px; } .label { display: inline-block; width: 120px; font-weight: bold; } .value { display: inline-block; } table { border-collapse: collapse; width: 100%; margin-top: 20px;} th, td { border: 1px solid #ddd; padding: 8px; } .signature-area { margin-top: 50px; display: flex; justify-content: space-around; width: 100%; } .sig-item { text-align: center; } .sig-line { border-bottom: 1px solid black; width: 150px; display: block; margin-top: 5px; } .header { text-align: center; margin-bottom: 20px;} .header h1, .header h2 { margin: 5px 0; } </style>"
    );
    printWindow.document.write("</head><body>");

    // Header
    printWindow.document.write('<div class="header">');
    printWindow.document.write("<h1>COURSE REGISTRATION FORM</h1>");
    printWindow.document.write(
      "<h2>UNIVERSITY OF BENIN, FACULTY OF ENGINEERING</h2>"
    );
    printWindow.document.write(
      "<h2>EXAMINATION COURSE REGISTRATION FORM 2024/2025</h2>"
    );
    printWindow.document.write("</div>");

    // Student Details
    printWindow.document.write(
      `<p><span class="label">MAT. NO.:</span><span class="value">${
        userData.matNumber || "ENG2102765"
      }</span></p>`
    );
    printWindow.document.write(
      `<p><span class="label">SURNAME:</span><span class="value">${
        userData.lastName || "ESESE"
      }</span></p>`
    );
    printWindow.document.write(
      `<p><span class="label">FIRST NAME:</span><span class="value">${
        userData.firstName || "Israel"
      }</span></p>`
    );
    printWindow.document.write(
      `<p><span class="label">OTHER NAMES:</span><span class="value">${
        userData.otherNames || "Ebose"
      }</span></p>`
    );
    printWindow.document.write(
      `<p><span class="label">DEPARTMENT:</span><span class="value">${
        userData.dept || "1. Computer Engineering"
      }</span></p>`
    );
    printWindow.document.write(
      `<p><span class="label">MODE OF ENTRY:</span><span class="value">${
        userData.mode || "DE"
      }</span></p>`
    );
    printWindow.document.write(
      `<p><span class="label">PHONE NO.:</span><span class="value">${
        userData.phone || "08084560596"
      }</span></p>`
    );
    printWindow.document.write(
      `<p style="display: inline-block; margin-right: 50px;"><span class="label">GENDER:</span><span class="value">${
        userData.gender || "male"
      }</span> </p>`
    );
    printWindow.document.write(
      `<p style="display: inline-block;"><span class="label">LEVEL:</span><span class="value">${
        userData.level || "500"
      }</span></p>`
    );

    // Course Table
    printWindow.document.write(
      "<table><thead><tr><th>FIRST SEMESTER</th><th>SECOND SEMESTER</th></tr></thead><tbody>"
    );
    const maxLen = Math.max(
      selectedCoursesFirst.length,
      selectedCoursesSecond.length
    );
    for (let i = 0; i < maxLen; i++) {
      printWindow.document.write("<tr>");
      printWindow.document.write(
        i < selectedCoursesFirst.length
          ? `<td>${selectedCoursesFirst[i].code} - ${selectedCoursesFirst[i].credits}</td>`
          : "<td></td>"
      );
      printWindow.document.write(
        i < selectedCoursesSecond.length
          ? `<td>${selectedCoursesSecond[i].code} - ${selectedCoursesSecond[i].credits}</td>`
          : "<td></td>"
      );
      printWindow.document.write("</tr>");
    }
    printWindow.document.write(
      `<tr><td><strong>Total - ${firstSemesterCredits}</strong></td><td><strong>Total - ${secondSemesterCredits}</strong></td></tr>`
    );
    printWindow.document.write("</tbody></table>");

    // Signatures
    printWindow.document.write('<div class="signature-area">');
    printWindow.document.write(
      '<div class="sig-item">Course Adviser\'s Sign <span class="sig-line"></span></div>'
    );
    printWindow.document.write(
      '<div class="sig-item">Dean\'s Sign <span class="sig-line"></span></div>'
    );
    printWindow.document.write(
      '<div class="sig-item">Student\'s Sign <span class="sig-line"></span></div>'
    );
    printWindow.document.write("</div>");

    // Footer
    printWindow.document.write(
      `<p style="font-size: 10px; margin-top: 40px; text-align: right;">RTPS Online Registration Software (eddie.olaye@gmail.com) ${currentDate}</p>`
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  const downloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.width;
    const leftMargin = 20;
    const lineHeight = 5;
    let y = 10;

    // Header
    doc.setFontSize(14);
    doc.text("COURSE REGISTRATION FORM", pageWidth / 2, y, { align: "center" });
    y += lineHeight * 2;
    doc.text("UNIVERSITY OF BENIN, FACULTY OF ENGINEERING", pageWidth / 2, y, {
      align: "center",
    });
    y += lineHeight * 2;
    doc.text(
      "EXAMINATION COURSE REGISTRATION FORM 2024/2025",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += lineHeight * 3;

    // Student Details
    doc.setFontSize(10);
    // Use || for fallbacks to match the image data if userData is incomplete
    const matNo = userData.matNumber || "ENG2102765";
    const surname = userData.lastName || "ESESE";
    const firstName = userData.firstName || "Israel";
    const otherNames = userData.otherNames || "Ebose";
    const dept = userData.dept || "1. Computer Engineering";
    const mode = userData.mode || "DE";
    const phone = userData.phone || "08084560596";
    const gender = userData.gender || "male";
    const level = userData.level || "500";

    doc.text(`MAT. NO.: ${matNo}`, leftMargin, y);
    y += lineHeight;
    doc.text(`SURNAME: ${surname}`, leftMargin, y);
    y += lineHeight;
    doc.text(`FIRST NAME: ${firstName}`, leftMargin, y);
    y += lineHeight;
    doc.text(`OTHER NAMES: ${otherNames}`, leftMargin, y);
    y += lineHeight;
    doc.text(`DEPARTMENT: ${dept}`, leftMargin, y);
    y += lineHeight;
    doc.text(`MODE OF ENTRY: ${mode}`, leftMargin, y);
    y += lineHeight;
    doc.text(`PHONE NO.: ${phone}`, leftMargin, y);
    y += lineHeight;
    doc.text(`GENDER: ${gender}`, leftMargin, y);
    doc.text(`LEVEL: ${level}`, pageWidth / 2, y - lineHeight);
    y += lineHeight * 2;

    // Course Table Header
    doc.text("FIRST SEMESTER", leftMargin, y);
    doc.text("SECOND SEMESTER", pageWidth / 2, y);
    doc.line(leftMargin, y + 1, pageWidth - 20, y + 1); // Separator line
    y += lineHeight;

    // Course List
    const maxLen = Math.max(
      selectedCoursesFirst.length,
      selectedCoursesSecond.length
    );
    for (let i = 0; i < maxLen; i++) {
      if (i < selectedCoursesFirst.length) {
        doc.text(
          `${selectedCoursesFirst[i].code} - ${selectedCoursesFirst[i].credits}`,
          leftMargin,
          y
        );
      }
      if (i < selectedCoursesSecond.length) {
        doc.text(
          `${selectedCoursesSecond[i].code} - ${selectedCoursesSecond[i].credits}`,
          pageWidth / 2,
          y
        );
      }
      y += lineHeight;
    }

    // Totals
    doc.line(leftMargin, y - 4, pageWidth - 20, y - 4); // Separator line for totals
    doc.text(`Total - ${firstSemesterCredits}`, leftMargin, y);
    doc.text(`Total - ${secondSemesterCredits}`, pageWidth / 2, y);
    doc.line(leftMargin, y + 1, pageWidth - 20, y + 1); // Separator line
    y += lineHeight * 3;

    // Signatures
    doc.text("Course Adviser's Sign", leftMargin, y);
    doc.text("_______________________", leftMargin, y + 1);

    doc.text("Dean's Sign", leftMargin + 65, y);
    doc.text("_______________________", leftMargin + 65, y + 1);

    doc.text("Student's Sign", leftMargin + 130, y);
    doc.text("_______________________", leftMargin + 130, y + 1);
    y += lineHeight * 2;

    // Footer
    doc.setFontSize(8);
    doc.text(
      `RTPS Online Registration Software (eddie.olaye@gmail.com) ${currentDate}`,
      leftMargin,
      doc.internal.pageSize.height - 10
    );

    doc.save("course_registration.pdf");
  };

  if (loading) return <div>Loading courses...</div>;

  return (
    <div className="min-h-screen ">
      <div className=" mx-auto ">
        {/* Button UI for Print and Download */}
        <div className="flex justify-between flex-col mt-5 sm:mt-10 md:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6 w-full">
          <div className="mb-5 md:mb-0">
            <p className="text-sm text-gray-500">
              Register for your courses for the upcoming semester
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="md:mr-4 ">
              <h2 className="text-lg font-semibold mb-1">Status: {status} </h2>
            </div>
            <button
              onClick={printForm}
              className="bg-gray-600 text-white p-4 md:px-4 md:py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center shadow-lg transition-colors duration-200"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Form
            </button>
            <button
              onClick={downloadPDF}
              className="bg-green-600 text-white p-4 md:px-4 md:py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center shadow-lg transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </button>
            <button
              onClick={formik.handleSubmit}
              type="button"
              className="bg-indigo-600 text-white p-4 md:px-4 md:py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center shadow-lg transition-colors duration-200"
              disabled={formik.isSubmitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {formik.isSubmitting ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </div>
        {/* --- */}

        <div className=" grid md:grid-cols-3 gap-4 text-sm ">
          <div className=" ring-1 ring-gray-300 rounded-lg p-2 flex-col items-start">
            {regDetails.map((value, index) => (
              <span key={index} className="flex gap-1 items-center">
                <h2 className="font-bold mt-0.5">{value.title}:</h2>
                <p>{value.value} </p>
              </span>
            ))}
          </div>
          <div className="flex ring-1 justify-between ring-gray-300 rounded-lg p-4 flex-col items-start">
            <h2>First Semester Credits</h2>
            <p className="font-bold text-lg my-1">{firstSemesterCredits}</p>
            <span className={`py-1 text-center `}>
              Max: {currentMaxCredits.first}
            </span>
          </div>
          <div className="flex ring-1 justify-between ring-gray-300 rounded-lg p-4 flex-col items-start">
            <h2>Second Semester Credits</h2>
            <p className="font-bold text-lg my-1">{secondSemesterCredits}</p>
            <span className={`py-1 text-center `}>
              Max: {currentMaxCredits.second}
            </span>
          </div>
        </div>
        <form onSubmit={formik.handleSubmit}>
          {/* to get courses */}
          <div className="mb-4 mt-10 flex flex-col ">
            <button
              onClick={loadCourses}
              className="bg-blue-500 w-fit text-white rounded-md p-2 hover:bg-blue-600 transition-colors"
              type="button"
            >
              Load Course
            </button>
            {/* Displaying formik level for user context */}
            <span className="mt-2 text-gray-600">
              Current Level for Credit Limit:{" "}
              <span className="font-bold">
                {currentMaxCredits.first + currentMaxCredits.second}
              </span>
            </span>
          </div>

          <div className="flex justify-between md:gap-6 gap-15 flex-col md:flex-row pb-3 mt-10">
            {/* -------------------------------------- */}
            {/* first semester course selection (UPDATED ORDER) */}
            {/* -------------------------------------- */}
            <div className="form-section w-full">
              <h2 className="text-2xl pb-3">First Semester Courses</h2>
              {/* Course Selection Input (Now on Top) */}
              <Select
                id="firstSemesterCourses"
                name="firstSemesterCourses"
                options={formatOptions(firstSemesterCourses)}
                isMulti
                value={formatOptions(firstSemesterCourses).filter((option) =>
                  formik.values.firstSemesterCourses.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  formik.setFieldValue(
                    "firstSemesterCourses",
                    selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : []
                  );
                }}
                onBlur={formik.handleBlur}
                components={{
                  MultiValue: ({ index, ...props }) => {
                    // Show only the last selected item
                    const selectedCount =
                      formik.values.firstSemesterCourses.length;
                    return index === selectedCount - 1 ? (
                      <components.MultiValue {...props} />
                    ) : null;
                  },
                }}
                isClearable={false}
                placeholder="Select courses..."
                className="select-input"
                classNamePrefix="select"
              />
              {formik.touched.firstSemesterCourses &&
              formik.errors.firstSemesterCourses ? (
                <div className="error text-red-500 text-sm mt-1 mb-4">
                  {formik.errors.firstSemesterCourses}
                </div>
              ) : null}{" "}
              {/* Add space if no error */}
              {/* Selected Courses Display (Now Below Input) */}
              <div className="mt-5 mb-4">
                <h3 className="text-lg font-semibold mb-3">
                  Selected Courses ({firstSemesterCredits} credits)
                </h3>
                {formik.values.firstSemesterCourses.length > 0 ? (
                  <ul className="">
                    {formik.values.firstSemesterCourses.map((courseId) => {
                      const course = getCourseDetails(courseId);
                      if (!course) return null; // Defensive check
                      return (
                        <li
                          key={courseId}
                          className="flex justify-between items-center bg-blue-50 p-2 mb-2 rounded"
                        >
                          <p>
                            {course.courseCode} : {course.courseTitle} (
                            {course.credits} credit)
                          </p>
                          <button
                            type="button"
                            className="p-1.5 pl-3 pr-3 rounded-lg text-white bg-red-400 text-lg hover:bg-red-600 hover:text-white transition-colors"
                            onClick={() =>
                              handleDeleteCourse(courseId, "first")
                            }
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>No courses selected for first semester</p>
                )}
              </div>
            </div>

            {/* -------------------------------------- */}
            {/* second semester course selection (UPDATED ORDER) */}
            {/* -------------------------------------- */}
            <div className="form-section w-full">
              <h2 className="text-2xl pb-3">Second Semester Courses</h2>
              {/* Course Selection Input (Now on Top) */}
              <Select
                id="secondSemesterCourses"
                name="secondSemesterCourses"
                options={formatOptions(secondSemesterCourses)}
                isMulti
                value={formatOptions(secondSemesterCourses).filter((option) =>
                  formik.values.secondSemesterCourses.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  formik.setFieldValue(
                    "secondSemesterCourses",
                    selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : []
                  );
                }}
                onBlur={formik.handleBlur}
                isClearable={false}
                components={{
                  MultiValue: ({ index, ...props }) => {
                    // Show only the last selected item
                    const selectedCount =
                      formik.values.secondSemesterCourses.length;
                    return index === selectedCount - 1 ? (
                      <components.MultiValue {...props} />
                    ) : null;
                  },
                }}
                placeholder="Select courses..."
                className="select-input"
                classNamePrefix="select"
              />
              {formik.touched.secondSemesterCourses &&
              formik.errors.secondSemesterCourses ? (
                <div className="error text-red-500 text-sm mt-1 mb-4">
                  {formik.errors.secondSemesterCourses}
                </div>
              ) : null}
              {/* Add space if no error */}

              {/* Selected Courses Display (Now Below Input) */}
              <div className="mt-5 mb-4">
                <h3 className="text-lg font-semibold mb-3">
                  Selected Courses ({secondSemesterCredits} credits)
                </h3>
                {formik.values.secondSemesterCourses.length > 0 ? (
                  <ul>
                    {formik.values.secondSemesterCourses.map((courseId) => {
                      const course = getCourseDetails(courseId);
                      if (!course) return null; // Defensive check
                      return (
                        <li
                          key={courseId}
                          className="flex justify-between items-center bg-blue-50 p-2 mb-2 rounded"
                        >
                          <p>
                            {course.courseCode} : {course.courseTitle} (
                            {course.credits} credit)
                          </p>
                          <button
                            type="button"
                            className="p-1.5 pl-3 pr-3 rounded-lg text-white bg-red-400 text-lg hover:bg-red-600 hover:text-white transition-colors"
                            onClick={() =>
                              handleDeleteCourse(courseId, "second")
                            }
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>No courses selected for second semester</p>
                )}
              </div>
            </div>
          </div>
          <input
            name="totalCredit"
            className="hidden"
            id="totalCredit"
            readOnly
            value={firstSemesterCredits + secondSemesterCredits}
          />

          <button
            type="submit"
            className="mt-5 bg-indigo-600 text-white rounded-md p-2 hover:bg-indigo-700 transition-colors"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting
              ? "Submitting..."
              : "Finalize and Submit Registration"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseReg;

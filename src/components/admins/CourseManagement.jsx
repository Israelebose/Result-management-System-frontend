import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Plus, Search, X } from "lucide-react";
import { useApi, useDetails } from "../context/ContextProvider";

// Validation schema
const addSchema = Yup.object({
  courseCode: Yup.string()
    .min(3, "Course code must be at least 3 characters")
    .required("Required"),
  courseTitle: Yup.string()
    .min(5, "Course title must be at least 5 characters")
    .required("Required"),
  credits: Yup.number()
    .positive("Credits must be a positive number")
    .required("Required"),
  level: Yup.number().oneOf([100, 200, 300, 400, 500]).required("Required"),
  semester: Yup.string().oneOf(["1", "2"]).required("Required"),
});

const CourseManagement = () => {
  const api = useApi();
  const { setErrors, setSuccess } = useDetails();

  // Local state
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignLecturer, setAssignLecturer] = useState(false);

  // Fetch courses when component mounts
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const res = await api.get("/get/courses");
      setCourses(res.data);
      setSuccess("Courses fetched successfully");
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to fetch courses");
    }
  };

  // Fetch all lecturers
  const fetchLecturers = async () => {
    try {
      const res = await api.get("/get/lecturers");
      setLecturers(res.data);
      setAssignLecturer(true);
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to fetch lecturers");
    }
  };

  //  Add a new course
  const handleAddCourse = async (values, { resetForm }) => {
    const payload = {
      ...values,
      credits: Number(values.credits),
      level: Number(values.level),
      semester: Number(values.semester),
    };

    try {
      await api.post("/post/create-course", payload);
      setSuccess("Course added successfully");
      setIsAddDialogOpen(false);
      fetchCourses();
      resetForm();
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to add course");
    }
  };

  // Edit an existing course
  const handleEditCourse = async (values) => {
    const payload = {
      ...values,
      credits: Number(values.credits),
      level: Number(values.level),
      semester: Number(values.semester),
    };
    console.log(payload);
    const courseCode = values.courseCode;

    try {
      const req = await api.put(`/put/edit-course/${courseCode}`, payload);
      setSuccess(req.data.message || "Course updated successfully");
      setIsEditDialogOpen(false);
      fetchCourses();
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to update course");
      console.log(err);
    }
  };

  // Delete a course
  const handleDeleteCourse = async () => {
    console.log(selectedCourse.courseCode);
    const courseCode = selectedCourse.courseCode;
    try {
      await api.delete(`/delete/delete-course/${courseCode}`);
      setSuccess("Course deleted successfully");
      setIsDeleting(false);
      fetchCourses();
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to delete course");
    }
  };

  // Open edit dialog and prefill values
  const openEditDialog = (course) => {
    setSelectedCourse({
      id: course.id,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      credits: course.credits,
      level: course.level,
      semester: course.semester,
      lecturerIds: course.lecturers?.map((l) => l.unique_id) || [],
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation
  const openDeleteDialog = (course) => {
    setSelectedCourse(course);
    setIsDeleting(true);
  };

  // Filter + group courses by level
  const filteredCourses = courses.filter((c) =>
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
      {/* Delete confirmation prompt */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <div className="bg-gray-800 text-white dark:bg-white dark:text-black w-sm rounded-lg p-5 relative shadow-lg">
            <X
              className="absolute right-3 top-3 cursor-pointer"
              onClick={() => setIsDeleting(false)}
            />
            <h2 className="font-bold text-lg">Confirm Delete</h2>
            <p className="mt-2">
              Are you sure you want to delete:
              <br />
              <strong>{selectedCourse.courseTitle}</strong> (
              {selectedCourse.courseCode})
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 rounded-md bg-gray-400 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Section */}
      <div className="pt-6">
        <div className="flex sm:flex-row flex-col mb-5 justify-between sm:items-center items-start gap-4">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 pr-4 border rounded-lg bg-secondary_bg text-gray-700 focus:ring-2 focus:ring-blue-500"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={20}
            />
          </div>

          {/* Add course button */}
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="mr-2" size={16} />
            Add Course
          </button>
        </div>

        {/* Courses List */}
        {!courses.length ? (
          <p className="p-6 text-gray-500">No courses available.</p>
        ) : (
          sortedLevels.map((level) => (
            <div
              key={level}
              className="bg-secondary_bg mb-8 rounded-xl  shadow-lg"
            >
              <div className="p-4 ">
                <h3 className="text-lg font-semibold">{level} Level Courses</h3>
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
                      <th className="text-right p-3">Actions</th>
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
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openEditDialog(course)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteDialog(course)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                          >
                            Delete
                          </button>
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

      {/*  Add & Edit Dialogs */}
      {(isAddDialogOpen || isEditDialogOpen) && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setAssignLecturer(false);
            }}
          ></div>

          <div className="bg-secondary_bg p-6 rounded-2xl shadow-2xl w-11/12 sm:w-8/12 md:w-6/12 lg:w-4/12 relative z-50">
            <h2 className="text-xl font-bold mb-3">
              {isAddDialogOpen ? "Add New Course" : "Edit Course"}
            </h2>

            <Formik
              initialValues={
                isAddDialogOpen
                  ? {
                      courseCode: "",
                      courseTitle: "",
                      credits: "",
                      level: "",
                      semester: "1",
                      lecturerIds: [],
                    }
                  : selectedCourse
              }
              validationSchema={addSchema}
              onSubmit={isAddDialogOpen ? handleAddCourse : handleEditCourse}
              enableReinitialize
            >
              {({ values, setFieldValue, isSubmitting }) => (
                <Form className="space-y-4">
                  {/* Course Code */}
                  <div>
                    <label>Course Code</label>
                    <Field
                      name="courseCode"
                      placeholder="e.g., CPE111"
                      className="w-full mt-1 p-2 border rounded-md"
                    />
                    <ErrorMessage
                      name="courseCode"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {/* Course Title */}
                  <div>
                    <label>Course Title</label>
                    <Field
                      name="courseTitle"
                      placeholder="e.g., Computer Engineering"
                      className="w-full mt-1 p-2 border rounded-md"
                    />
                    <ErrorMessage
                      name="courseTitle"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {/* Credits */}
                  <div>
                    <label>Credits</label>
                    <Field
                      name="credits"
                      type="number"
                      placeholder="e.g., 3"
                      className="w-full mt-1 p-2 border rounded-md"
                    />
                    <ErrorMessage
                      name="credits"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {/* Assign Lecturers */}
                  {assignLecturer && (
                    <div>
                      <label>Assign Lecturers</label>
                      <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                        {lecturers.map((lecturer) => (
                          <label
                            key={lecturer.unique_id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              value={lecturer.unique_id}
                              checked={values.lecturerIds.includes(
                                lecturer.unique_id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFieldValue("lecturerIds", [
                                    ...values.lecturerIds,
                                    lecturer.unique_id,
                                  ]);
                                } else {
                                  setFieldValue(
                                    "lecturerIds",
                                    values.lecturerIds.filter(
                                      (id) => id !== lecturer.unique_id
                                    )
                                  );
                                }
                              }}
                            />
                            <span>
                              {lecturer.firstName} {lecturer.lastName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Level & Semester */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>Year</label>
                      <Field
                        as="select"
                        name="level"
                        className="w-full mt-1 p-2 border rounded-md"
                      >
                        <option value="">Select</option>
                        {[100, 200, 300, 400, 500].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            Year {lvl / 100}
                          </option>
                        ))}
                      </Field>
                    </div>
                    <div>
                      <label>Semester</label>
                      <Field
                        as="select"
                        name="semester"
                        className="w-full mt-1 p-2 border rounded-md"
                      >
                        <option value="1">First</option>
                        <option value="2">Second</option>
                      </Field>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => fetchLecturers()}
                      className="bg-gray-200 px-3 py-2 rounded-md"
                    >
                      Assign Lecturer
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      {isSubmitting
                        ? isAddDialogOpen
                          ? "Adding..."
                          : "Updating..."
                        : isAddDialogOpen
                        ? "Add Course"
                        : "Update"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseManagement;

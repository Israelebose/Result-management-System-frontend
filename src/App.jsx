import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  ResultManagement,
  ManageUsers,
  CourseManagement,
} from "./components/admins/index";

import {
  UploadGrades,
  Dashboard,
  Profile,
  ProtectedRoute,
  Register,
  Login,
  ForgottenPassword,
  StudentDashboard,
} from "./components";

import { ViewResult } from "./components/student/ViewResult";
import  CaResultManagement from "./components/course_adviser/CaResultManagement";

import { useDetails } from "./components/context/ContextProvider";

import CaStudentManagement from "./components/course_adviser/CaStudentManagement";
import CourseReg from "./components/student/CourseReg";
import RegisteredCourses from "./components/student/RegisteredCourses";
import NotFound from "./NotFound";


function App() {
  const { role } = useDetails();
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e) => e.preventDefault();
    // Disable DevTools shortcuts
    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgottenPassword />} />
      <Route path="/" element={<Login />} />
     
      <Route
        path="/home"
        element={
          <ProtectedRoute
            allowedRoles={["admin", "lecturer", "student", "course_adviser"]}
          />
        }
      > 
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        {/* all staff*/}
        <Route path="Upload-grade" element={<UploadGrades />} />

        {/* admin */}
        <Route path="manage-users" element={<ManageUsers />} />
        <Route path="result-management" element={<ResultManagement />} />
        <Route path="course-management" element={<CourseManagement />} />
        <Route path="profile" element={<Profile />} />

        {/* course_adviser */}
        <Route path="manage-student" element={<CaStudentManagement />} />
        <Route path="ca-result-management" element={<CaResultManagement />} />

        {/* student */}
        <Route path="view-result" element={<ViewResult />} />
        <Route path="profile" element={<Profile />} />
        <Route path="Course-Registration" element={<CourseReg/>} />
        <Route path="Registered-courses" element={<RegisteredCourses/>} />

        <Route path="404" element={<NotFound/>}/>
      </Route>

      {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
    </Routes>
  );
}

export default App;

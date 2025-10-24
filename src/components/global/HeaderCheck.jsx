import React from "react";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApi, useDetails } from "../context/ContextProvider";
import { LogOut, Menu } from "lucide-react";
import ModeToggle from "../ModeToggle";
import { allowedPaths } from "../";

const HeaderCheck = () => {
  const { toggleMobileSidebar, role } = useDetails();
  const location = useLocation();
  const lastPath = "/" + location.pathname.split("/").filter(Boolean).pop();

  const { firstName, lastName } = useDetails();

  return (
    <div>
      <div className="flex justify-between items-center relative">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-textColor1">
          {lastPath === "/home" && "Dashboard"}
          {lastPath === "/dashboard" && "Dashboard"}
          {lastPath === "/manage-users" && "Manage Users"}
          {lastPath === "/profile" && "My Profile"}
          {lastPath === "/result-management" && "Result Management"}
          {lastPath === "/ca-result-management" && "Result Management"}
          {lastPath === "/course-management" && "Course Management"}
          {lastPath === "/Upload-grade" && "Upload Result"}
          {lastPath === "/grade-settings" && "Grade Settings"}
          {lastPath === "/view-result" && "View Result"}
          {lastPath === "/Course-Registration" && "Course Registration"}
          {lastPath === "/manage-student" && "Manage Student"}
          {lastPath === "/Registered-courses" && "My Registered Courses"}
        </h2>

        <button
          onClick={toggleMobileSidebar}
          className="text-textColor1 hover:bg-secondary_bg shadow-2xl transition-colors duration-200 md:hidden"
        >
          <Menu className="w-12 h-11" />
        </button>
        {/* <div className="right-0 absolute max-sm:hidden ">
          <ModeToggle />
        </div> */}
      </div>

      {allowedPaths.includes(location.pathname) && (
        <p className="text-textColor1/80  text-sm max-sm:text-xs pt-4 sm:pt-6">
          {role === "student" &&
            `Welcome, ${firstName} ${lastName}! View your results and register for courses here.`}
          {(role === "admin" || role === "super_admin") &&
            "Welcome, Admin! Manage users, courses, and results here."}
          {role === "lecturer" &&
            "Welcome, Lecturer! Manage your courses and submit grades here."}
          {role === "course_adviser" &&
            "Welcome, Course Adviser! Approve student registrations and advise here."}
        </p>
      )}
      {lastPath === "/course-management" && (
        <p className="text-textColor1/80  text-sm max-sm:text-xs pt-4 sm:pt-6">
          Manage all courses in the Computer Engineering department
        </p>
      )}
    </div>
  );
};

export default HeaderCheck;

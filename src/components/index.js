import UploadGrades from "./UploadGrades";
  import Dashboard from "./Dashboard";
import Profile from "./Profile"; 
import ProtectedRoute from "./ProtectedRoute";
import Register from "./Register";
import Login from "./Login";
import ForgottenPassword from "./ForgottenPassword";
import ModeToggle from "./ModeToggle";
import StudentDashboard from "./StaffDashboard";



export{
  UploadGrades,
  Dashboard,
  ProtectedRoute,
  Profile,
  Register,
  Login,
  ForgottenPassword,
  ModeToggle,
  StudentDashboard
}

import {
  Users,
  FileText,
  UserPlus,
  HomeIcon,
  ViewIcon,
  BookText,
  UserPen,
  UserIcon,
  FileEdit,
  Users2Icon,
  Upload,
} from "lucide-react";

export const allowedPaths = [
  "/home",
  "/home/dashboard",

];

export const Admin_naviLink = [
  
  {
    path: "/home/manage-users",
    text: "  Manage Users",
    icon: Users,
  },
  {
    path: "/home/result-management",
    text: " Result Management",
    icon: FileText,
  },
  {
    path: "/home/course-management",
    text: " Course Management",
    icon: BookText,
  },
];
export const Stud_naviLink = [
  {
    path: "/home/dashboard",
    text: "Dashboard",
    icon: HomeIcon,
  },
  {
    path: "/home/view-result",
    text: "View Result",
    icon: ViewIcon,
  },
  {
    path: "/home/Registered-courses",
    text: "Registered Courses",
    icon: BookText,
  },
  {
    path: "/home/profile",
    text: "Profile",
    icon: UserIcon,
  },
];
export const Lect_naviLink = [
  {
    path: "/home/dashboard",
    text: "Dashboard",
    icon: HomeIcon,
  },
  {
    path: "/home/Upload-grade",
    text: "Upload Result",
    icon: FileEdit,
  },
  {
    path: "/home/profile",
    text: "Profile",
    icon: UserIcon,
  },
];
export const ca_naviLink = [
  {
    path: "/home/manage-student",
    text: "Manage Student",
    icon: Users2Icon,
  },
  {
    path: "/home/ca-result-management",
    text: "Result Management",
    icon: FileText,
  },
];

export {};

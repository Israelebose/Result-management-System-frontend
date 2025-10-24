import React from "react";
import { useApi, useDetails } from "./context/ContextProvider";
import { useNavigate } from "react-router-dom";
import StudentDashboard from "./StudentDashboard";
import StaffDashboard from "./StaffDashboard";

const Dashboard = () => {
  const { userData } = useDetails();

if (!userData.role) {
      setErrors("Session expired. Please log in again.");
      navigate("/login");
      return;
    }
  return (
    <div className="">
      {userData.role === "student" ? <StudentDashboard /> : <StaffDashboard />}
    </div>
  );
};

export default Dashboard;

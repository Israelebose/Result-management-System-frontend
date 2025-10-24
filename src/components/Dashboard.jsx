import React from "react";
import { useApi, useDetails } from "./context/ContextProvider";
import { useNavigate } from "react-router-dom";
import StudentDashboard from "./StudentDashboard";
import StaffDashboard from "./StaffDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const api = useApi();
  const { userData } = useDetails();


  return (
    <div className="">
      {userData.role === "student" ? <StudentDashboard /> : <StaffDashboard />}
    </div>
  );
};

export default Dashboard;

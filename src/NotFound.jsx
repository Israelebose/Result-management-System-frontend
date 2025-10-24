import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  useEffect(()=>{
    if (!userData.role) {
      setErrors("Session expired. Please log in again.");
      navigate("/login");
      return;
    }
  }, [])
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          Oops! The page you’re looking for doesn’t exist or has been moved.
          Please check the URL or return to dashboard.
        </p>
        <Link
          to="/home"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-300"
        >
          Back to  Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
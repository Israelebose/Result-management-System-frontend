import { useEffect } from "react";
import { useDetails } from "../context/ContextProvider";

export const ResultManagement = () => {
  const {userData} = useDetails()
  useEffect(() => {
    if (!userData.role || userData.role !== "admin") {
      setErrors("Session expired. Please log in again.");
      navigate("/login");
      return;
    }
  }, []);
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-6">
        Result Management
      </h2>
      <p className="text-text-light dark:text-text-dark">
        Result management features coming soon...
      </p>
    </div>
  );
};

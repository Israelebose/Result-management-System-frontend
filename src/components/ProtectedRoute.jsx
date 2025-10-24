import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApi, useDetails } from "./context/ContextProvider";
import Sidebar from "./global/Sidebar";
import ModeToggle from "./ModeToggle";
import { allowedPaths } from "./";
import HeaderCheck from "./global/HeaderCheck";


const ProtectedRoute = ({ allowedRoles, children }) => {
  const { role, toggleMobileSidebar, setErrors, setSuccess } = useDetails();
  const api = useApi();
  const [user, setUser] = useState(null);
  const location = useLocation();
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Auth error:", err);
        setErrors("Session expired or unauthorized. Please log in.");
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    setErrors("ProtectedRoute: No user found");
    return <Navigate to="/login" replace />;
  }

  const currentTime = Math.floor(Date.now() / 1000);

  if (user.exp && user.exp < currentTime) {
    console.warn("ProtectedRoute: Token expired");
   setErrors("Session expired. Please log in again.");
    api.post("/auth/logout");
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.warn(`Unauthorized role ${user.role}`);
    setErrors("You do not have permission to access this page.");
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-primary_bg min-h-screen w-full scroll-smooth ">' 
  
      {/* <div className=" max-lg:hidden">
        <ModeToggle />
      </div> */}
      {/* Sidebar: Visible on all screens, width adjusts responsively */}
      <div className="xl:sticky 2xl:fixed xl:pt-2 2xl:pt-6 pl-2 mobile_sidebar_parent z-50">
        <Sidebar />
      </div>

      {/* Main Content: Adjusts margin and padding based on screen size */}
      <div className="flex-1 p-1 sm:p-4 lg:pt-6 max-sm:ml-0 md:ml-2 2xl:ml-7  overflow-hidden">
        <div className=" mx-auto 2xl:w-[73.5%] min-h-[calc(100vh-64px)] ">
          {/* Header Section */}
          <div className="bg-secondary_bg rounded-xl sticky top-1 sm:top-0 shadow-lg p-4 m-1 sm:p-6 ">
            <HeaderCheck />
            
          </div>
         

          {/* Outlet */}
          <div className="pl-2 pr-1.5 ">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;

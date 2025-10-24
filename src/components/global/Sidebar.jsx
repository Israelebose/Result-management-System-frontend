import React, { useEffect, useState } from "react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import { X, Menu, LogOut } from "lucide-react";
import { Admin_naviLink, ca_naviLink, Lect_naviLink, Stud_naviLink } from "..";
import { useApi, useDetails } from "../context/ContextProvider";
import ModeToggle from "../ModeToggle";

const Sidebar = () => {
  const navigate = useNavigate();
  const { userData, toggleMobileSidebar, isMobileOpen, setSuccess, setErrors } =
    useDetails();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const api = useApi();

  const handleLogout = async () => {
    try {
      const response = await api.post("/auth/logout"); // ✅ await the API call
      setSuccess(response.data.message); // ✅ safe to log
      toggleMobileSidebar(); // close sidebar after success
      navigate("/login"); // redirect
    } catch (error) {
      setErrors("Logout failed");
      console.error("Logout failed", error.response?.data || error.message);
    }
  };

  return (
    <>
      <div
        className={`group h-[95vh] overflow-hidden rounded-xl sm:top-6  inset-y-0  z-30 w-16 bg-secondary_bg shadow-2xl  transition-all 
          duration-300 ease-in-out sm:justify-between  flex flex-col hover:w-64
          ${isSidebarOpen ? " w-64" : " "} ${
          isMobileOpen ? "max-sm:visible " : "max-sm:hidden"
        }   sticky monbile_sidebar_com_1  `}
      >
        <div className="flex  justify-between p-2 items-center h-17 border-b border-gray-200 sm:hidden">
          {/* <div className=" ">
            <ModeToggle />
          </div> */}

          <button
            className="flex justify-end text-textColor1  transition-colors duration-300 "
            onClick={toggleMobileSidebar}
          >
            <X className="w-12 h-13" />
          </button>
        </div>

        <nav className="mt-10 sm:mt-0">
          {userData.role !== "student" ? (
            <div className="flex-col p-4 pt-0 sm:pt-4 space-y-2 sm:space-y-6  sm:mt-3">
              {Lect_naviLink.map((agr, index) => {
                const Icon = agr.icon;
                return (
                  <NavLink
                    to={agr.path}
                    key={index}
                    className={({ isActive }) =>
                      `flex w-full z-20 text-md items-center p-1.5 max-sm:p-3 rounded-md text-textColor1 hover:bg-primary-blue hover:text-white ${
                        isActive ? "text-white bg-primary-blue" : ""
                      } `
                    }
                    onClick={() => {
                      setIsSidebarOpen(false);
                      toggleMobileSidebar();
                    }}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span
                      className={`ml-3 transition-opacity duration-300  group-hover:opacity-100 max-sm:opacity-100 opacity-0 group-hover:w-full w-0 whitespace-nowrap  ${
                        isSidebarOpen ? " opacity-100  w-full " : ""
                      }`}
                    >
                      {agr.text}
                    </span>
                  </NavLink>
                );
              })}

              {userData.role === "admin" && (
                <div className="flex-col pt-0  space-y-2 sm:space-y-6  sm:mt-3">
                  <div className="w-full max-sm:p-3">
                    <div className="flex-1  p-0 -ml-1">
                      <div className="flex w-full items-center jsutify-center    whitespace-nowrap">
                        <h2
                          className={` content-center text-center text-base  text-gray-500 transition-opacity duration-300 flex-shrink-0  `}
                        >
                          Admin
                        </h2>
                        <div className=" ml-1 transition-opacity duration-300  group-hover:opacity-100 max-sm:opacity-100 opacity-0 text-gray-500 whitespace-nowrap">
                          <span className="">Navigation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {Admin_naviLink.map((agr, index) => {
                    const Icon = agr.icon;
                    return (
                      <NavLink
                        to={agr.path}
                        key={index}
                        className={({ isActive }) =>
                          `flex w-full z-20 text-md items-center p-1.5 max-sm:p-3 rounded-md text-textColor1 hover:bg-primary-blue hover:text-white ${
                            isActive ? "text-white bg-primary-blue" : ""
                          } `
                        }
                        onClick={() => {
                          setIsSidebarOpen(false);
                          toggleMobileSidebar();
                        }}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        <span
                          className={`ml-3 transition-opacity duration-300  group-hover:opacity-100 max-sm:opacity-100 opacity-0 group-hover:w-full w-0 whitespace-nowrap  ${
                            isSidebarOpen ? " opacity-100  w-full " : ""
                          }`}
                        >
                          {agr.text}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
              {userData.role === "course_adviser" && (
                <div className="flex-col pt-0  space-y-2 sm:space-y-6  sm:mt-3">
                  <div className="w-full max-sm:p-3">
                    <div className="flex-1 p-0 -ml-1">
                      <div className="flex w-full items-center jsutify-center    whitespace-nowrap">
                        <h2
                          className={` content-center text-center text-base  text-gray-500 transition-opacity duration-300 flex-shrink-0  `}
                        >
                          Course
                        </h2>
                        <div className=" ml-1 transition-opacity duration-300  group-hover:opacity-100 max-sm:opacity-100 opacity-0 text-gray-500 whitespace-nowrap">
                          <span className="">Adviser Navigation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {ca_naviLink.map((agr, index) => {
                    const Icon = agr.icon;
                    return (
                      <NavLink
                        to={agr.path}
                        key={index}
                        className={({ isActive }) =>
                          `flex w-full z-20 text-md items-center p-1.5 max-sm:p-3 rounded-md text-textColor1 hover:bg-primary-blue hover:text-white ${
                            isActive ? "text-white bg-primary-blue" : ""
                          } `
                        }
                        onClick={() => {
                          setIsSidebarOpen(false);
                          toggleMobileSidebar();
                        }}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        <span
                          className={`ml-3 transition-opacity duration-300  group-hover:opacity-100 max-sm:opacity-100 opacity-0 group-hover:w-full w-0 whitespace-nowrap  ${
                            isSidebarOpen ? " opacity-100  w-full " : ""
                          }`}
                        >
                          {agr.text}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            Stud_naviLink.map((agr, index) => {
              const Icon = agr.icon;
              return (
                <div
                  key={index}
                  className="flex-col p-4 pt-0 sm:pt-2 space-y-2 sm:space-y-6  sm:mt-2"
                >
                  <NavLink
                    to={agr.path}
                    className={({ isActive }) =>
                      `flex w-full z-20 text-md items-center p-1.5 max-sm:p-3 rounded-md text-textColor1 hover:bg-primary-blue hover:text-white ${
                        isActive ? "text-white bg-primary-blue" : ""
                      } `
                    }
                    onClick={() => {
                      setIsSidebarOpen(false);
                      toggleMobileSidebar();
                    }}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span
                      className={`ml-3 transition-opacity duration-300  group-hover:opacity-100 max-sm:opacity-100 opacity-0 group-hover:w-full w-0 whitespace-nowrap  ${
                        isSidebarOpen ? " opacity-100  w-full " : ""
                      }`}
                    >
                      {agr.text}
                    </span>
                  </NavLink>
                </div>
              );
            })
          )}
        </nav>

        <div className="w-full h-full flex items-end-safe  max-sm:p-3 msx-sm:pb-1">
          <div className="w-full">
            <div className="flex-1 p-3 mb-3 space-y-2  ">
              <div className="flex w-full items-center  text-textColor1 dark:text-textColor1  whitespace-nowrap">
                <h2
                  className={`content-center text-center text-md bg-primary-blue circle w-10 h-10 max-sm:w-12 max-sm:h-12 font-medium text-white transition-opacity duration-300 flex-shrink-0  `}
                >
                  {/* Safe access: If firstName exists, slice the first char, else use 'G' as a default */}
                  {(userData.firstName?.[0] ?? "G").toLocaleUpperCase()}

                  {/* Safe access: If lastName exists, slice the first char, else use an empty string */}
                  {(userData.lastName?.[0] ?? "").toLocaleUpperCase()}
                </h2>
                <div className="flex flex-col ml-3 transition-opacity duration-300  group-hover:opacity-100 max-sm:opacity-100 opacity-0 group-hover:w-full w-0 whitespace-nowrap">
                  <span className="">
                    {userData.firstName} {userData.lastName}
                  </span>
                  <small>ID: {userData.unique_id}</small>
                </div>
              </div>
            </div>
            <div className="p-4 pb-1 sm:pb-4  flex w-full justify-center  items-center border-t relative border-gray-300 dark:border-gray-600">
              <button
                onClick={handleLogout}
                className="flex items-center p-2 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900 w-full"
              >
                <LogOut size={20} className="flex-shrink-0" />
                <span
                  className={`ml-2 transition-opacity duration-300 md:group-hover:block max-sm:block  ${
                    isSidebarOpen ? "visible" : "hidden"
                  }`}
                >
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

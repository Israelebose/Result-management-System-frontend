import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import NotifyModel from "../global/NotifyModel";

// =======================
// AXIOS CONTEXT
// =======================
const axiosProvider = createContext();
export function useApi() {
  return useContext(axiosProvider);
}

// =======================
// THEME CONTEXT
// =======================
const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });
export function useTheme() {
  return useContext(ThemeContext);
}

// =======================
// USER DETAILS CONTEXT
// =======================
const tokenContext = createContext({
  userData : "",
  adminId   : "000000",
  fetchUser: () => {},
  toggleMobileSidebar: () => {},
  isMobileOpen: false,

  // Notifications
  error: "",
  setErrors: () => {},
  success: "",
  setSuccess: () => {},
  warning: "",
  setWarning: () => {},
  update: "",
  setUpdate: () => {},
});

// Export useDetails for accessing user details
export function useDetails() {
  return useContext(tokenContext);
}

// =======================
// CONTEXT PROVIDER COMPONENT
// =======================
export function ContextProvider({ children }) {
  const navigate = useNavigate();

  // ---------------------
  // THEME STATE
  // ---------------------
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // ---------------------
  // USER STATE
  // ---------------------
  const [userData, setUserData] = useState({})
  const adminId  = ''

  // Notification states
  const [error, setErrors] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [update, setUpdate] = useState("");
  // ---------------------
  // AXIOS INSTANCE
  // ---------------------
  const axiosRequest = axios.create({
    baseURL: "/api",
    // baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // important for cookies
    headers: { "Content-Type": "application/json" },
  });

  // =======================
  // APPLY THEME EFFECT
  // =======================
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // =======================
  // FETCH USER INFO FROM COOKIE
  // =======================
  const fetchUser = async () => {
    try {
      const res = await axiosRequest.get("/auth/profile"); // backend reads cookie
      const tokenData = res.data;
      if(!tokenData){
         setErrors("Invalid token structure");
        return false;
        return <Navigate to="/login" replace />;
      }

      setUserData(tokenData)
      
      
    } catch (err) {
      console.log(err)
      setErrors("Authentication error");
      return false;
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);

  // ////////////////////
  // MOBILE NAVIGATION BUTTON
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  // =======================
  // PROVIDE CONTEXTS
  // =======================
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <tokenContext.Provider
        value={{
          userData,
          adminId,
          fetchUser,
          toggleMobileSidebar,
          isMobileOpen,
          error,
          setErrors,
          update,
          setUpdate,
          warning,
          setWarning,
          success,
          setSuccess,
        }}
      >
        <axiosProvider.Provider value={axiosRequest}>
          {children}
          <NotifyModel /> {/* Add the Toast component here for global access */}
        </axiosProvider.Provider>
      </tokenContext.Provider>
    </ThemeContext.Provider>
  );
}

import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const getInitialAuth = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("auth")) || { user: null, token: "" }
    );
  } catch {
    return { user: null, token: "" }; // fallback if JSON is invalid
  }
};

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getInitialAuth());

  //default axios
  axios.defaults.headers.common["Authorization"] = auth?.token;

  useEffect(() => {
    const data = localStorage.getItem("auth");
    if (data) {
      try {
        const parseData = JSON.parse(data);
        setAuth({
          ...auth,
          user: parseData.user || null,
          token: parseData.token || "",
        });
        if (parseData.token) {
          axios.defaults.headers.common.Authorization = parseData.token;
        }
      } catch (err) {
        console.warn(
          "Invalid auth JSON in localStorage, falling back to default",
        );
        setAuth({ user: null, token: "" });
      }
    }
    //eslint-disable-next-line
  }, []);
  return (
    <AuthContext.Provider value={[auth, setAuth]}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };

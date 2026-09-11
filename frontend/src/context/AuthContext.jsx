// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("eldercare_token") || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("eldercare_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    try {
      const savedRole = localStorage.getItem("eldercare_role");
      return savedRole ? JSON.parse(savedRole) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch current user details on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          if (res.data?.data) {
            setUser(res.data.data);
            setRole(res.data.data.roleId || null);
            localStorage.setItem("eldercare_user", JSON.stringify(res.data.data));
            if (res.data.data.roleId) {
              localStorage.setItem("eldercare_role", JSON.stringify(res.data.data.roleId));
            }
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token: newToken, data } = res.data;

      setToken(newToken);
      setUser(data.user);
      setRole(data.role);

      localStorage.setItem("eldercare_token", newToken);
      localStorage.setItem("eldercare_user", JSON.stringify(data.user));
      localStorage.setItem("eldercare_role", JSON.stringify(data.role));

      toast.success(`Welcome back, ${data.user.firstName}!`);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials";
      toast.error(msg);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem("eldercare_token");
    localStorage.removeItem("eldercare_user");
    localStorage.removeItem("eldercare_role");
    toast.success("Logged out successfully");
  };

  const hasPermission = (permissionName) => {
    if (!role) return false;
    if (role.name === "Executive") return true; // Executive has super-user access
    // If permissions are populated on role
    if (Array.isArray(role.permissionIds)) {
      return role.permissionIds.some(
        (p) => (typeof p === "string" ? p === permissionName : p.name === permissionName)
      );
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        roleName: role?.name || "Executive",
        loading,
        login,
        logout,
        hasPermission,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

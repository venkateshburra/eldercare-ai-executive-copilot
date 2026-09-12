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
  const [permissions, setPermissions] = useState(() => {
    try {
      const savedPerms = localStorage.getItem("eldercare_permissions");
      return savedPerms ? JSON.parse(savedPerms) : [];
    } catch {
      return [];
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
            const userData = res.data.data;
            setUser(userData);
            const userRole = userData.roleId || null;
            setRole(userRole);

            const userPerms =
              userData.permissions ||
              userRole?.permissions ||
              (Array.isArray(userRole?.permissionIds)
                ? userRole.permissionIds.map((p) => (typeof p === "object" ? p.name : p))
                : []);

            setPermissions(userPerms);

            localStorage.setItem("eldercare_user", JSON.stringify(userData));
            if (userRole) {
              localStorage.setItem("eldercare_role", JSON.stringify(userRole));
            }
            localStorage.setItem("eldercare_permissions", JSON.stringify(userPerms));
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

      const userPerms = data.role?.permissions || [];
      setPermissions(userPerms);

      localStorage.setItem("eldercare_token", newToken);
      localStorage.setItem("eldercare_user", JSON.stringify(data.user));
      localStorage.setItem("eldercare_role", JSON.stringify(data.role));
      localStorage.setItem("eldercare_permissions", JSON.stringify(userPerms));

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
    setPermissions([]);
    localStorage.removeItem("eldercare_token");
    localStorage.removeItem("eldercare_user");
    localStorage.removeItem("eldercare_role");
    localStorage.removeItem("eldercare_permissions");
    toast.success("Logged out successfully");
  };

  /**
   * Check if current user has permission to access a feature or page.
   * Executive role has full organizational oversight across all features.
   */
  const hasPermission = (permissionName) => {
    if (!role) return false;
    if (role.name === "Executive") return true; // Executive has super-user access
    if (!permissionName) return true; // Public to all authenticated users

    // Direct permission match
    if (Array.isArray(permissions) && permissions.includes(permissionName)) {
      return true;
    }

    // Role permissionIds fallback
    if (Array.isArray(role.permissionIds)) {
      return role.permissionIds.some(
        (p) => (typeof p === "string" ? p === permissionName : p.name === permissionName)
      );
    }

    return false;
  };

  const hasAnyPermission = (permissionList) => {
    if (!role) return false;
    if (role.name === "Executive") return true;
    if (!permissionList || permissionList.length === 0) return true;
    return permissionList.some((p) => hasPermission(p));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        roleName: role?.name || "Executive",
        permissions,
        loading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
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

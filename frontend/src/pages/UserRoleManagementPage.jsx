// src/pages/UserRoleManagementPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  FiUsers,
  FiShield,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const UserRoleManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New User Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password@123");
  const [roleId, setRoleId] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);
      setUsers(usersRes.data?.data || []);
      const roleList = rolesRes.data?.data || [];
      setRoles(roleList);
      if (roleList.length > 0) setRoleId(roleList[0]._id);
    } catch {
      toast.error("Failed to fetch users and role directories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !roleId) {
      toast.error("All user fields are required");
      return;
    }

    setCreatingUser(true);
    try {
      await api.post("/users", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        roleId,
      });

      toast.success("User provisioned successfully");
      setShowCreateModal(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      fetchUsersAndRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            User Access & Role Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC) and enterprise account provisioning
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary self-start"
        >
          <FiPlus className="w-4 h-4" /> Add User Account
        </button>
      </div>

      {/* Role Definitions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => (
          <div key={r._id} className="card-panel p-4 bg-white border-l-4 border-l-blue-700 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <FiShield className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs font-bold text-slate-900">{r.name}</h4>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
              {r.description || "Operational access privileges"}
            </p>
            <div className="mt-2 text-[11px] text-blue-700 font-semibold">
              {(r.permissions || []).length} Granular Permissions
            </div>
          </div>
        ))}
      </div>

      {/* Users Directory Table */}
      <div className="card-panel bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Provisioned Accounts</h3>
            <p className="text-xs text-slate-500">Active personnel within SilverCare Senior Living</p>
          </div>
          <Badge variant="primary" size="xs">
            {users.length} Users
          </Badge>
        </div>

        {loading ? (
          <LoadingSpinner text="Retrieving personnel accounts..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">User</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Role Scope</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Last Login</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-[11px] border border-blue-200">
                          {u.firstName ? u.firstName[0] : "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.firstName} {u.lastName}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="primary" size="xs">
                        {u.roleId?.name || "Standard Staff"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.status === "active" ? "primary" : "default"} size="xs">
                        {u.status || "active"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Provision New User
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add authorized personnel with tenant-scoped role permissions.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@silvercare.org"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role *</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="form-input text-xs"
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="btn-primary text-xs"
                >
                  {creatingUser ? "Provisioning..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleManagementPage;

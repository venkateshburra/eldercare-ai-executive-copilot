// src/pages/UserRoleManagementPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  FiUsers,
  FiShield,
  FiPlus,
  FiSearch,
  FiKey,
  FiCheck,
  FiX,
  FiLayers,
  FiGlobe,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const UserRoleManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'organizations'
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password@123");
  const [roleId, setRoleId] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  // Create Organization Modal State
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Role Permissions Modal State
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState(new Set());
  const [permSearch, setPermSearch] = useState("");
  const [savingPermissions, setSavingPermissions] = useState(false);

  // ── Initial Fetch ────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, orgsRes, permsRes] = await Promise.all([
        api.get("/users?all=true"),
        api.get("/roles"),
        api.get("/organizations"),
        api.get("/permissions"),
      ]);

      setUsers(usersRes.data?.data || []);
      const roleList = rolesRes.data?.data || [];
      setRoles(roleList);
      if (roleList.length > 0 && !roleId) {
        setRoleId(roleList[0]._id);
      }
      setOrganizations(orgsRes.data?.data || []);
      setAvailablePermissions(permsRes.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load directory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── User Creation ────────────────────────────────────────────────────────────
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
      setShowCreateUserModal(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  // ── User Status Toggle ───────────────────────────────────────────────────────
  const handleToggleStatus = async (targetUser) => {
    const newStatus = targetUser.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/users/${targetUser._id}`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, status: newStatus } : u))
      );
      toast.success(`${targetUser.firstName}'s status set to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    }
  };

  // ── Organization Creation ────────────────────────────────────────────────────
  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setCreatingOrg(true);
    try {
      const res = await api.post("/organizations", {
        name: newOrgName.trim(),
        slug: newOrgSlug.trim() || undefined,
      });

      toast.success("Organization created with 4 standard roles and 17 permissions!");
      setShowCreateOrgModal(false);
      setNewOrgName("");
      setNewOrgSlug("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create organization");
    } finally {
      setCreatingOrg(false);
    }
  };

  // ── Open Permission Matrix Modal ─────────────────────────────────────────────
  const handleOpenPermissionsModal = (role) => {
    setEditingRole(role);
    // Extract existing permission IDs for this role
    const existingIds = new Set();
    (role.permissionIds || []).forEach((p) => {
      const id = typeof p === "object" && p !== null ? p._id : p;
      if (id) existingIds.add(String(id));
    });
    setSelectedPermIds(existingIds);
    setPermSearch("");
  };

  // ── Toggle Individual Permission Checkbox ────────────────────────────────────
  const handleTogglePermission = (permId) => {
    const next = new Set(selectedPermIds);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedPermIds(next);
  };

  // ── Select / Deselect All Permissions ────────────────────────────────────────
  const handleSelectAll = (select) => {
    if (select) {
      const allIds = new Set(availablePermissions.map((p) => String(p._id)));
      setSelectedPermIds(allIds);
    } else {
      setSelectedPermIds(new Set());
    }
  };

  // ── Save Role Permissions ────────────────────────────────────────────────────
  const handleSaveRolePermissions = async () => {
    if (!editingRole) return;
    setSavingPermissions(true);
    try {
      const permArray = Array.from(selectedPermIds);
      await api.patch(`/roles/${editingRole._id}/permissions`, {
        permissionIds: permArray,
      });

      toast.success(`Updated permissions for ${editingRole.name}`);
      setEditingRole(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  // ── Categorized Permissions for Clear Enterprise Matrix ──────────────────────
  const categorizedPermissions = useMemo(() => {
    const categories = {
      "Residents & Clinical Care": [],
      "Staffing & Incident Safety": [],
      "Strategy, AI & Reports": [],
      "System & Access Governance": [],
    };

    availablePermissions.forEach((p) => {
      const name = p.name || "";
      if (
        name.startsWith("residents.") ||
        name.startsWith("carePlans.") ||
        name.startsWith("medications.") ||
        name.startsWith("activities.")
      ) {
        categories["Residents & Clinical Care"].push(p);
      } else if (
        name.startsWith("staff.") ||
        name.startsWith("shifts.") ||
        name.startsWith("incidents.") ||
        name.startsWith("alerts.")
      ) {
        categories["Staffing & Incident Safety"].push(p);
      } else if (
        name.startsWith("decisions.") ||
        name.startsWith("scenarios.") ||
        name.startsWith("reports.") ||
        name.startsWith("ai.")
      ) {
        categories["Strategy, AI & Reports"].push(p);
      } else {
        categories["System & Access Governance"].push(p);
      }
    });

    return categories;
  }, [availablePermissions]);

  // ── Filtered Users List ──────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Organization filter
      if (selectedOrgFilter !== "all") {
        const uOrgId =
          typeof u.organizationId === "object" && u.organizationId !== null
            ? u.organizationId._id
            : u.organizationId;
        if (String(uOrgId) !== String(selectedOrgFilter)) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const role = (u.roleId?.name || "").toLowerCase();
        const orgName = (u.organizationId?.name || "").toLowerCase();
        return (
          fullName.includes(query) ||
          email.includes(query) ||
          role.includes(query) ||
          orgName.includes(query)
        );
      }

      return true;
    });
  }, [users, selectedOrgFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            User Access & Organization Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-tenant communities, user provisioning, and granular RBAC role permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateOrgModal(true)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <FiGlobe className="w-3.5 h-3.5 text-blue-700" /> New Organization
          </button>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <FiPlus className="w-3.5 h-3.5" /> Provision User
          </button>
        </div>
      </div>

      {/* Role Definitions & Permission Customization Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FiShield className="w-3.5 h-3.5 text-blue-700" />
            Configured Roles & Permission Sets
          </h2>
          <span className="text-[11px] text-slate-500">
            Click "Edit Permissions" to add or remove access privileges
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r) => {
            const permCount = (r.permissionIds || []).length;
            return (
              <div
                key={r._id}
                className="card-panel p-4 bg-white border-t-4 border-t-blue-700 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <FiShield className="w-4 h-4 text-blue-700 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-900">{r.name}</h4>
                    </div>
                    <Badge variant={permCount > 15 ? "primary" : "default"} size="xs">
                      {permCount} perms
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {r.description || "Enterprise operational access scope"}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">RBAC Security</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPermissionsModal(r)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
                  >
                    <FiKey className="w-3 h-3" /> Edit Permissions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="card-panel bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented View Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "users"
                  ? "bg-blue-700 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FiUsers className="w-3.5 h-3.5" /> All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("organizations")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "organizations"
                  ? "bg-blue-700 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FiGlobe className="w-3.5 h-3.5" /> Organizations ({organizations.length})
            </button>
          </div>

          {/* Filters for Users Tab */}
          {activeTab === "users" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Organization Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                  Filter Tenant:
                </span>
                <select
                  value={selectedOrgFilter}
                  onChange={(e) => setSelectedOrgFilter(e.target.value)}
                  className="form-input text-xs py-1 px-2.5 bg-white"
                >
                  <option value="all">All Organizations ({users.length} Users)</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.userCount ?? 0} users)
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search user, email, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input text-xs pl-8 pr-3 py-1"
                />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <LoadingSpinner text="Retrieving access control and user directories..." />
        ) : activeTab === "users" ? (
          /* Users Directory Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Personnel</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Organization Tenant</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Assigned Role</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Account Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Last Login</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      No user accounts found matching current tenant filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const orgName = u.organizationId?.name || "Unassigned Tenant";
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-[11px] border border-blue-200">
                              {u.firstName ? u.firstName[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-[11px] text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <FiGlobe className="w-3 h-3 text-slate-400" />
                            {orgName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="primary" size="xs">
                            {u.roleId?.name || "Standard Staff"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            title="Click to toggle status"
                            className="cursor-pointer inline-flex"
                          >
                            <Badge variant={u.status === "active" ? "primary" : "default"} size="xs">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === "active" ? "bg-blue-700" : "bg-slate-400"
                                }`}
                              />
                              {u.status || "active"}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                              u.status === "active"
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {u.status === "active" ? "Set Inactive" : "Set Active"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Organizations Directory Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Organization Name</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Tenant Slug</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Total Users</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Created</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Quick Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                          {org.name ? org.name[0].toUpperCase() : "O"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{org.name}</p>
                          <p className="text-[11px] text-slate-400">ID: {org._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{org.slug}</td>
                    <td className="py-3 px-4">
                      <Badge variant="primary" size="xs">
                        {org.userCount ?? 0} Accounts
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={org.status === "active" ? "primary" : "default"} size="xs">
                        {org.status || "active"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrgFilter(org._id);
                          setActiveTab("users");
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
                      >
                        View Users ({org.userCount ?? 0})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ROLE PERMISSION MATRIX MODAL ────────────────────────────────────────── */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FiKey className="w-4 h-4 text-blue-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Permissions: {editingRole.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grant or revoke granular access permissions for users assigned this role.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Search */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  Deselect All
                </button>
                <span className="text-xs text-slate-500 font-medium ml-2">
                  {selectedPermIds.size} of {availablePermissions.length} enabled
                </span>
              </div>

              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="form-input text-xs pl-7 pr-2.5 py-1 bg-white"
                />
              </div>
            </div>

            {/* Permissions List Grouped by Domain */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {Object.entries(categorizedPermissions).map(([category, perms]) => {
                const filteredCategoryPerms = perms.filter(
                  (p) =>
                    !permSearch.trim() ||
                    p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
                    (p.description || "").toLowerCase().includes(permSearch.toLowerCase())
                );

                if (filteredCategoryPerms.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
                      <span>{category}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {filteredCategoryPerms.length} permissions
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredCategoryPerms.map((p) => {
                        const isChecked = selectedPermIds.has(String(p._id));
                        return (
                          <label
                            key={p._id}
                            className={`flex items-start gap-2.5 p-2 rounded border transition-colors cursor-pointer ${
                              isChecked
                                ? "bg-blue-50/50 border-blue-300 text-slate-900"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(String(p._id))}
                              className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                            />
                            <div className="text-xs leading-tight">
                              <p className="font-semibold text-slate-800 font-mono text-[11px]">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {p.description || `Grants access to ${p.name}`}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRolePermissions}
                disabled={savingPermissions}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <FiCheck className="w-3.5 h-3.5" />
                {savingPermissions ? "Saving Changes..." : "Save Role Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ─────────────────────────────────────────────────── */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Provision New User</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add authorized personnel with tenant-scoped role permissions.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email *
                </label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Role *
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="form-input text-xs"
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({(r.permissionIds || []).length} permissions)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
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

      {/* ── CREATE ORGANIZATION MODAL ─────────────────────────────────────────── */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Create New Senior Living Organization
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Spawns an isolated multi-tenant community pre-initialized with 4 standard roles, 17 permissions, and clinical thresholds.
            </p>

            <form onSubmit={handleCreateOrganization} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization Community Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oakwood Manor Senior Living"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug) {
                      setNewOrgSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-+|-+$/g, "")
                      );
                    }
                  }}
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenant Identifier (Slug)
                </label>
                <input
                  type="text"
                  placeholder="e.g. oakwood-manor"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="form-input text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Unique URI identifier used for tenant isolation.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrg}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <FiGlobe className="w-3.5 h-3.5" />
                  {creatingOrg ? "Initializing Community..." : "Create Organization"}
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

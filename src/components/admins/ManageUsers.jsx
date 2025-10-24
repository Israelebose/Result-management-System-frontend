import { useEffect, useState, useRef, useCallback } from "react";
import { Trash2, Check, X, Search, MoreVertical, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApi, useDetails } from "../context/ContextProvider";
import { Field, Form, Formik } from "formik";

const ManageUsers = () => {
  const api = useApi();
  const { userData, adminId, setErrors, setSuccess, setWarning, setUpdate } =
    useDetails();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // <-- NEW
  const [selectedIds, setSelectedIds] = useState([]); // <-- NEW
  const [isPrompting, setIsPrompting] = useState(false);
  const [selectedConfirm, setSelectedConfirm] = useState();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [approving, setApproving] = useState(false);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState(null);
  const navigate = useNavigate();

  const dropdownRefs = useRef({});

  // --- Handle outside click
  const handleClickOutside = useCallback((event) => {
    const clickedInsideDropdown = Object.values(dropdownRefs.current).some(
      (ref) => ref?.contains(event.target)
    );
    if (!clickedInsideDropdown) {
      setOpenActionDropdown(null);
      setOpenRoleDropdown(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (!userData.role || (userData.role !== "admin" )) {
      setErrors("Session expired. Please log in again.");
      navigate("/login");
      return;
    }
    fetchUsers();
   
    
  }, [userData.role, navigate]);

  // fetch all users
  const fetchUsers = async () => {
    try {
      const res = await api.get(`/auth/users`);
      setUsers(res.data);
      setErrors(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors("Session expired. Please log in again.");
        navigate("/login");
      } else {
        setErrors(err.response?.data?.error || "Failed to fetch users");
      }
    }
  };

  const changeCourseAdviserLevel = async (values, id) => {
    const payload = { courseAdviserLevel: values.courseAdviserLevel };
    try {
      const req = await api.patch(`/auth/update-ca-level/${id}`, payload);
      setUpdate(req.data.message);
      fetchUsers();
    } catch (err) {
      setErrors(err.response?.data?.error);
    }
  };

  // batch delete users
  const deleteManyUsers = async () => {
    if (selectedIds.length === 1) {
      setWarning("please use The Menu icon by the side");
      return;
    }
    if (selectedIds.includes(1)) {
      setWarning("You Cannot delete Default Admin. Please uncheck id: 1");
      return;
    }

    try {
      const res = await api.delete(`/auth/delete-many`, {
        data: { ids: selectedIds },
      });
      setSuccess(res.data.message);
      setErrors(res.data.error);
      fetchUsers();
      setSelectedIds([]);
    } catch (err) {
      setErrors(err.response?.data?.error);
    }
  };

  // filter + search
  const filteredUsers = users
    .filter((userObj) =>
      [userObj.fullName, userObj.role_id].some(
        (field) =>
          field && field.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .filter((u) => (filterRole === "all" ? true : u.role === filterRole)); // <-- NEW

  // toggle select
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // select all
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map((u) => u.id));
    }
  };
  const id = 1

  // to approve users
  const approveUser = async (userRole, roleId) => {
    if (!userData.role) return;
    if (userData.role !== "admin") {
      setWarning("Only super_admin can approve admins");
      return;
    }
    try {
      await api.patch(`/auth/approve/${userRole}/${roleId}`);
      setSuccess(`${userRole} approved successfully`);
      fetchUsers();
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to approve user");
    }
  };

  // to delete users
  const deleteUser = async (id, userRole, roleId) => {
    if (!userData.role) return;
    if (roleId === adminId) {
      setWarning("Default super_admin cannot be deleted");
      return;
    }
    if (userData.role !== "admin") {
      // alert("Only susuper_adminper_admin can delete admins");
      setWarning("Only admin can deny admins");
      return;
    }

    try {
      const req = await api.delete(`/auth/delete/${userRole}/${roleId}`);
      // alert("User deleted successfully");
      setSuccess(req.data.message);
      fetchUsers();
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to delete user");
    }
  };

  const upgradeRole = async (id, currentRole, roleId, newRole) => {
    if (!userData.role) return;
    if (roleId === adminId) {
      setWarning("Default super_admin role cannot be modified");
      return;
    }
    if (userData.role !== "admin") {
      setWarning("Only admins can upgrade to admin");
      return;
    }
    try {
      await api.patch(`/auth/update-role/${id}/${roleId}`, { newRole });
      setSuccess("User role updated successfully");
      fetchUsers();
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to update user role");
    }
  };

  const waiveAndGraduate = async (roleId) => {
    if (window.confirm("Waive F's and graduate this student?")) {
      try {
        await api.post(`/auth/waive-and-graduate/${roleId}`);
        setWarning("Student waived and graduated successfully");
        fetchUsers();
      } catch (err) {
        setErrors(
          err.response?.data?.error || "Failed to waive and graduate student"
        );
      }
    }
  };

  const confirmChange = () => {
    if (selectedConfirm && updating) {
      upgradeRole(
        selectedConfirm.id,
        selectedConfirm.role,
        selectedConfirm.unique_id,
        selectedConfirm.newRole
      );
    }
    if (selectedConfirm && approving) {
      approveUser(selectedConfirm.role, selectedConfirm.unique_id);
    }
    if (selectedConfirm && deleting) {
      deleteUser(
        selectedConfirm.id,
        selectedConfirm.role,
        selectedConfirm.unique_id
      );
    }
    if (selectedConfirm && isBulkDelete) {
      deleteManyUsers();
    }
    setIsPrompting(false);
    setApproving(false);
    setDeleting(false);
    setUpdating(false);
    setIsBulkDelete(false);
  };
  // (rest of your functions unchanged e.g. approveUser, deleteUser, upgradeRole, etc.)

  return (
    <div className="pt-4 sm:pt-6 lg:pt-8">
      {/* Confirm Modal (unchanged) */}
      {isPrompting && (
        <div className="bg-black/30 z-50 fixed w-full h-full left-0 top-0 flex justify-center items-center ">
          <div
            className={`relative bg-gray-800 dark:bg-white text-white dark:text-black w-sm rounded-lg flex flex-col text-wrap text-sm
        gap-y-4 h-fit p-4 shadow-lg `}
          >
            <X
              className="absolute right-3 top-3"
              onClick={() => {
                setSelectedConfirm(false);
                setIsPrompting(false);
                setApproving(false);
                setDeleting(false);
                setUpdating(false);
                setIsBulkDelete(false);
              }}
            />
            <h2 className="font-bold">Warning!</h2>
            <div className="pt-1">
              {updating && (
                <p>
                  Are Sure You want to change "{selectedConfirm?.name}" to{" "}
                  {selectedConfirm?.newRole} ?{" "}
                </p>
              )}
              {approving && (
                <p>
                  Are Sure You want to approve this user "
                  {selectedConfirm?.name}" as {selectedConfirm?.role} ?{" "}
                </p>
              )}
              {deleting && (
                <p>
                  Are Sure You want to delete this user info <br />
                  name:{" "}{selectedConfirm?.name} <br />
                  id: {selectedConfirm.id} <br />
                  role: {selectedConfirm?.role} <br />
                  matNumber: {selectedConfirm?.matnumber} ?
                </p>
              )}
              {isBulkDelete && (
                <p>
                  Are You Sure U want to Perform This action ?
                  <br />
                  seleted IDs
                  {selectedIds.map((u) => (
                    <p>id: {u}</p>
                  ))}
                </p>
              )}
            </div>
            <div className="flex justify-center mt-1">
              <button
                className="bg-secondary_bg p-2 hover:bg-shadow-textColor1 rounded-lg min-w-20 text-textColor1 "
                onClick={confirmChange}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto pt-5 relative">
        {/* Search + Filter */}
        <div className="flex justify-between gap-4 mb-6 items-center">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name or role ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 pr-4 border rounded-lg bg-secondary_bg dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue  transition"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              size={20}
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="p-2 border rounded-lg bg-secondary_bg dark:border-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All</option>
            <option value="admin">Admins</option>
            <option value="lecturer">Lecturers</option>
            <option value="student">Students</option>
            <option value="course_adviser">Course Advisers</option>
          </select>
          {/* bulk delete */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                setSelectedConfirm({ ids: selectedIds });
                setIsBulkDelete(true);
                setIsPrompting(true);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Delete Selected
            </button>
          )}
        </div>

        {/* Table */}
        <div className=" h-fit bg-secondary_bg rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full table-auto text-wrap min-w-[800px]">
            <thead>
              <tr className=" text-gray-800 dark:text-gray-200">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 pl-6 text-left text-base font-semibold">
                  id
                </th>
                <th className="px-6 py-6 text-left text-base font-semibold">
                  Full Name
                </th>
                <th className="px-6 py-6 text-left text-base font-semibold">
                  gender
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  Role ID
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  MatNumber
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  CA Level
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  Session
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  Current Session
                </th>
                <th className="px-4 py-3 text-left text-base font-semibold">
                  Status
                </th>
                <th className="px-4 max-md:bg-gray-100/75 py-3 text-left text-base font-semibold sticky lg:relative right-0 ">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers
                .sort(function (a, b) {
                  return a.id - b.id;
                })
                .map((userObj, index) => (
                  <tr
                    key={userObj.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-4 py-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(userObj.id)}
                        onChange={() => toggleSelect(userObj.id)}
                      />
                    </td>

                    {/* keep your existing <td> cells untouched here */}
                    <td className="px-6 py-8 text-sm text-wrap text-gray-700 dark:text-gray-300">
                      {index }
                    </td>
                    <td className="px-6 py-8 text-sm text-wrap  text-gray-700 dark:text-gray-300">
                      {userObj.fullName}
                    </td>
                     <td className="px-6 py-8 text-sm text-wrap  text-gray-700 dark:text-gray-300">
                      {userObj.gender || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-wrap whitespace-nowrap overflow-hidden text-ellipsis text-gray-700 dark:text-gray-300">
                      {userObj.email || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-wrap text-gray-700 dark:text-gray-300">
                      {userObj.role}
                    </td>
                    <td className="px-4 py-8 text-sm text-wrap text-gray-700 dark:text-gray-300">
                      {userObj.role_id}
                    </td>
                    <td className="px-4 py-8 text-sm text-gray-700 dark:text-gray-300">
                      {userObj.matNumber}
                    </td>
                    <td className="px-4 py-8 text-sm text-wrap text-gray-700 dark:text-gray-300">
                      {userObj.courseAdviserLevel || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-wrap text-gray-700 dark:text-gray-300">
                      {userObj.level || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-wrap text-gray-700 dark:text-gray-300">
                      {userObj.session || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-wrap text-gray-700 dark:text-gray-300">
                      {userObj.currentSession || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm  text-gray-700 dark:text-gray-300">
                      {userObj.role !== "student"
                        ? userObj.is_approved
                          ? "Approved"
                          : "Pending"
                        : userObj.is_approved
                        ? "Active"
                        : "Pending"}
                    </td>
                    <td className=" max-md:bg-gray-100/75 text-sm sticky lg:relative right-0  z-10 ">
                      <div
                        className=""
                        ref={(el) => (dropdownRefs.current[userObj.id] = el)}
                      >
                        <div className="flex max-sm:justify-center max-md:gap-1 gap-2 pr-1 pl-1 ">
                          {/* the approve, decline, and delete button section */}
                          {userObj.role_id !== adminId && userObj.id !== id && (
                            <button
                              onClick={() => {
                                setOpenActionDropdown(
                                  openActionDropdown === userObj.id
                                    ? null
                                    : userObj.id
                                );
                                setOpenRoleDropdown(null);
                              }}
                              className={`p-3.5 circle hover:bg-primary-blue-hover dark:hover:bg-primary-blue-hover transition focus:outline-none"
                                 ${
                                  openActionDropdown === userObj.id
                                    ? "bg-gray-200 dark:bg-gray-600"
                                    : null
                                } `}
                                data-title="More actions"
                            >
                              <MoreVertical className="sm:h-5 sm:w-5 h-4.5 w-4.5 text-gray-600 dark:text-gray-300" />
                            </button>
                          )}
                          {/* the change user role button section */}
                          {userObj.role_id !== adminId &&
                            userObj.role !== "student" && userObj.id !== id && (
                              <button
                                onClick={() => {
                                  setOpenRoleDropdown(
                                    openRoleDropdown === userObj.id
                                      ? null
                                      : userObj.id
                                  );
                                  setOpenActionDropdown(null);
                                }}
                                className={`p-3.5 max-sm:hidden sm:visible circle hover:bg-primary-blue-hover dark:hover:bg-primary-blue-hover transition focus:outline-none" ${
                                  openRoleDropdown === userObj.id
                                    ? "bg-gray-200 dark:bg-gray-600"
                                    : null
                                }`}
                                 data-title="Change Role"
                              >
                                <User className="sm:h-5 sm:w-5 h-4.5 w-4.5  text-gray-600 dark:text-gray-300" />
                              </button>
                            )}
                        </div>

                        {/* Action Dropdown */}
                        {openActionDropdown === userObj.id && (
                          <div
                            className={`absolute sm:-top-0.5 md:right-32 right-18 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border dark:border-gray-700 ${
                              !userObj.is_approved && userObj.role !== "student"
                                ? "-top-18 sm:-top-10"
                                : "top-1"
                            } `}
                          >
                            {/* the change user role button section */}
                            {userObj.role_id !== adminId &&
                              userObj.role !== "student" && (
                                <Formik
                                  initialValues={{ role: "" }}
                                  onSubmit={(values) => {
                                    setSelectedConfirm({
                                      name: userObj.fullName,
                                      id: userObj.id,
                                      role: userObj.role,
                                      unique_id: userObj.role_id,
                                      newRole: values.role,
                                    });
                                    setUpdating(true);
                                    setIsPrompting(true);
                                  }}
                                >
                                  {({ setFieldValue, submitForm }) => (
                                    <Form>
                                      <Field
                                        as="select"
                                        name="role"
                                        className=" sm:hidden p-3 sm:p-2 w-full border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border-none  focus:outline-none bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                                        onChange={(e) => {
                                          setFieldValue("role", e.target.value);
                                          submitForm();
                                        }}
                                      >
                                        <option value="">Change Role</option>
                                        <option value="admin">Admin</option>
                                        <option value="lecturer">
                                          Lecturer
                                        </option>
                                        <option value="course_adviser">
                                          Course adviser
                                        </option>
                                      </Field>
                                    </Form>
                                  )}
                                </Formik>
                              )}
                              {/* the change user role button section */}
                            {userObj.role === "course_adviser" && (
                              <Formik
                                initialValues={{ courseAdviserLevel: 0 }}
                                onSubmit={(values) =>
                                  changeCourseAdviserLevel(
                                    values,
                                    userObj.role_id
                                  )
                                }
                              >
                                {({ setFieldValue, submitForm }) => (
                                  <Form>
                                    <Field
                                      as="select"
                                      name="courseAdviserLevel"
                                      className=" p-3.5 sm:p-2 w-full border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border-none  focus:outline-none bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                                      onChange={(e) => {
                                        setFieldValue(
                                          "courseAdviserLevel",
                                          e.target.value
                                        );
                                        submitForm();
                                      }}
                                    >
                                      <option value={0}>Select level</option>
                                      <option value={100}>100</option>
                                      <option value={200}>200</option>
                                      <option value={300}>300</option>
                                      <option value={400}>400</option>
                                      <option value={500}>500</option>
                                    </Field>
                                  </Form>
                                )}
                              </Formik>
                            )}
                            {/* <button
                            onClick={() => {
                              navigate(`/profile/${userObj.id}`);
                              toggleActionDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          >
                            <UserCircle size={16} className="mr-2" /> View
                            Profile
                          </button> */}
                            {!userObj.is_approved && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedConfirm({
                                      name: userObj.fullName,
                                      id: userObj.id,
                                      role: userObj.role,
                                      unique_id: userObj.role_id,
                                    });
                                    setApproving(true);
                                    setIsPrompting(true);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                  <Check size={16} className="mr-2" /> Approve
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => {
                                setSelectedConfirm({
                                  name: userObj.fullName,
                                  id: index,
                                  role: userObj.role,
                                  unique_id: userObj.role_id,
                                  matnumber: userObj.matNumber,
                                });
                                setDeleting(true);
                                setIsPrompting(true);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                              <Trash2 size={16} className="mr-2" /> Delete
                            </button>
                          </div>
                        )}

                        {/* Role Dropdown */}
                        {openRoleDropdown === userObj.id && (
                          <div className="absolute -top-10 2xl:right-[4.3rem]  lg:right-[6.5rem]  sm:right-[6.5rem]  right-[3.5rem]    mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border dark:border-gray-700">
                            <button
                              onClick={() => {
                                setSelectedConfirm({
                                  name: userObj.fullName,
                                  id: userObj.id,
                                  role: userObj.role,
                                  unique_id: userObj.role_id,
                                  newRole: "admin",
                                });
                                setUpdating(true);
                                setIsPrompting(true);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              Admin
                            </button>

                            <button
                              onClick={() => {
                                setSelectedConfirm({
                                  id: userObj.id,
                                  name: userObj.fullName,
                                  role: userObj.role,
                                  unique_id: userObj.role_id,
                                  newRole: "lecturer",
                                });
                                setUpdating(true);
                                setIsPrompting(true);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              Lecturer
                            </button>
                            <button
                              onClick={() => {
                                setSelectedConfirm({
                                  name: userObj.fullName,
                                  id: userObj.id,
                                  role: userObj.role,
                                  unique_id: userObj.role_id,
                                  newRole: "course_adviser",
                                });
                                setUpdating(true);
                                setIsPrompting(true);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              Course Adviser
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* ... */}
                  </tr>
                ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-4 p-4">
              No users found matching your search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;

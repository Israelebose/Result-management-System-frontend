import { useEffect, useState, useRef, useCallback } from "react";
import { Trash2, Check, X, Search, MoreVertical, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApi, useDetails } from "../context/ContextProvider";
import { Field, Form, Formik } from "formik";
import { number } from "yup";

const CaStudentManagement = () => {
  const api = useApi();
  const {
    userData,
    adminId,
    setErrors,
    setSuccess,
    setWarning,
    setUpdate,
  } = useDetails();
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
    if (!userData.role || userData.role !== "course_adviser") {
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

  const probateStudent = async (values, id) => {
    const payload = { level: values.level };
    try {
      const req = await api.patch(`/auth/probate-student/${id}`, payload);
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
    .filter((number) => number.level === userData.courseAdviserLevel)
    .filter((u) =>
      filterRole === "all"
        ? true
        : filterRole === "pending"
        ? u.is_approved === false
        : u.is_approved === true
    );

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

  // to approve users
  const approveUser = async (userRole, roleId) => {
    if (!userData.role) return;
    if (userData.role !== "course_adviser") {
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
    if (userData.role !== "course_adviser") {
      // alert("Only susuper_adminper_admin can delete admins");
      setWarning("Only admin can deny admins");
      return;
    }

    try {
      await api.delete(`/auth/delete/${userRole}/${roleId}`);
      // alert("User deleted successfully");
      setSuccess("User Delected Successfully");
      fetchUsers();
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to delete user");
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
    <div className="min-h-screen lg:pt-6">
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
                  Are Sure You want to delete this user info <br /> name:{" "}
                  {selectedConfirm?.name} <br />
                  id: {selectedConfirm?.id} <br />
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
              className="w-full p-2 pl-10 pr-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              size={20}
            />
          </div>
          <div className="space-x-5">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
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
        </div>

        {/* Table */}
        <div className="bg-white h-fit dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full table-auto min-w-[800px]">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
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
                <th className="px-6 pl-6 text-left text-sm font-semibold">
                  id
                </th>
                <th className="px-6 pl-6 text-left text-sm font-semibold">
                  Full Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                 Gender
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Role ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  MatNumber
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Session
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Current Session
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold sticky right-0 bg-gray-200 dark:bg-gray-700">
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
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-4 py-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(userObj.id)}
                        onChange={() => toggleSelect(userObj.id)}
                      />
                    </td>

                    {/* keep your existing <td> cells untouched here */}
                    <td className="px-6 py-8 text-sm  text-gray-700 dark:text-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-8 text-sm  text-gray-700 dark:text-gray-300">
                      {userObj.fullName}
                    </td>
                    <td className="px-4 py-8 text-sm whitespace-nowrap overflow-hidden text-ellipsis text-gray-700 dark:text-gray-300">
                      {userObj.email || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-gray-700 dark:text-gray-300">
                      {userObj.gender}
                    </td>
                    <td className="px-4 py-8 text-sm text-gray-700 dark:text-gray-300">
                      {userObj.role_id}
                    </td>
                    <td className="px-4 py-8 text-sm text-gray-700 dark:text-gray-300">
                      {userObj.matNumber}
                    </td>

                    <td className="px-4 py-8 text-sm text-gray-700 dark:text-gray-300">
                      {userObj.level || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-gray-700 dark:text-gray-300">
                      {userObj.session || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-gray-700 dark:text-gray-300">
                      {userObj.currentSession || "-"}
                    </td>
                    <td className="px-4 py-8 text-sm text-gray-700 dark:text-gray-300">
                      {userObj.role !== "student"
                        ? userObj.is_approved
                          ? "Approved"
                          : "Pending"
                        : userObj.is_approved
                        ? "Active"
                        : "Pending"}
                    </td>
                    <td className=" max-md:bg-gray-200/75 bg-white  text-sm sticky right-0  dark:bg-gray-800 z-10 ">
                      <div
                        className=""
                        ref={(el) => (dropdownRefs.current[userObj.id] = el)}
                      >
                        <div className="flex justify-center max-md:gap-1 gap-2 ">
                          {/* the approve, decline, and delete button section */}
                          {userObj.role_id !== adminId && (
                            <button
                              onClick={() => {
                                setOpenActionDropdown(
                                  openActionDropdown === userObj.id
                                    ? null
                                    : userObj.id
                                );
                                setOpenRoleDropdown(null);
                              }}
                              className={`p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition focus:outline-none"
                                title="More actions ${
                                  openActionDropdown === userObj.id
                                    ? "bg-gray-200 dark:bg-gray-600"
                                    : null
                                } `}
                            >
                              <MoreVertical
                                size={20}
                                className="text-gray-600 dark:text-gray-300"
                              />
                            </button>
                          )}
                        </div>

                        {/* Action Dropdown */}
                        {openActionDropdown === userObj.id && (
                          <div
                            className={`absolute  md:right-20 2xl:right-32 right-22 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border dark:border-gray-700 ${
                              userObj.is_approved ? "-top-1" : "-top-8"
                            }`}
                          >
                            <Formik
                              initialValues={{ level: 0 }}
                              onSubmit={(values) =>
                                probateStudent(values, userObj.role_id)
                              }
                            >
                              {({ setFieldValue, submitForm }) => (
                                <Form>
                                  <Field
                                    as="select"
                                    name="level"
                                    className=" p-3 sm:p-2 w-full border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border-none  focus:outline-none bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
                                    onChange={(e) => {
                                      setFieldValue("level", e.target.value);
                                      submitForm();
                                    }}
                                  >
                                    <option value={0}>Probate Student</option>
                                    <option value={100}>100</option>
                                    <option value={200}>200</option>
                                    <option value={300}>300</option>
                                    <option value={400}>400</option>
                                    <option value={500}>500</option>
                                  </Field>
                                </Form>
                              )}
                            </Formik>

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
                                  id: index + 1,
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
                      </div>
                    </td>
                    {/* ... */}
                  </tr>
                ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-4 p-4">
              No Registerd {userData.courseAdviserLevel} level student
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaStudentManagement;

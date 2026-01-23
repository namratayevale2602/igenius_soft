import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, UserPlus, UserCog } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../lib/axios";

const UserFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "user",
  });

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/admin/users/${id}`);
      const user = response.data.user;

      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        password_confirmation: "",
        role: user.role,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      alert(error.response?.data?.message || "Failed to load user");
      navigate("/admin");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        // Update user
        const { password, password_confirmation, ...updateData } = formData;
        const payload = { ...updateData };

        // Only include password if provided
        if (formData.password) {
          payload.password = formData.password;
          payload.password_confirmation = formData.password_confirmation;
        }

        await api.put(`/admin/users/${id}`, payload);
        alert("User updated successfully!");
      } else {
        // Create user
        await api.post("/admin/users", formData);
        alert("User created successfully!");
      }

      navigate("/admin");
    } catch (error) {
      console.error("Error saving user:", error);
      alert(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto bg-white p-5"
    >
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Admin
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {id ? (
                <div className="flex items-center">
                  <UserCog className="w-8 h-8 mr-3 text-purple-600" />
                  Edit User
                </div>
              ) : (
                <div className="flex items-center">
                  <UserPlus className="w-8 h-8 mr-3 text-primary-600" />
                  Create New User
                </div>
              )}
            </h1>
            <p className="text-gray-600 mt-2">
              {id
                ? "Update user information and permissions"
                : "Add a new user to the system"}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Password
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {id ? "New Password" : "Password *"}
                    {id && (
                      <span className="text-gray-500 text-xs ml-2 font-normal">
                        (Leave blank to keep current)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="••••••••"
                  />
                  {id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 8 characters with letters and numbers
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {id ? "Confirm New Password" : "Confirm Password *"}
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required={!id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Permissions
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Role *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="radio"
                      id="role-user"
                      name="role"
                      value="user"
                      checked={formData.role === "user"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="role-user"
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.role === "user"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded-full border mr-3 ${
                            formData.role === "user"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {formData.role === "user" && (
                            <div className="w-2 h-2 bg-white rounded-full m-1"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Regular User</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Can access basic features
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="radio"
                      id="role-admin"
                      name="role"
                      value="admin"
                      checked={formData.role === "admin"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="role-admin"
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.role === "admin"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded-full border mr-3 ${
                            formData.role === "admin"
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300"
                          }`}
                        >
                          {formData.role === "admin" && (
                            <div className="w-2 h-2 bg-white rounded-full m-1"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Administrator</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Full access to all features
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-500">
                Fields marked with * are required
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : id ? "Update User" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default UserFormPage;

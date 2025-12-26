import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  Globe,
  Palette,
  Moon,
  Sun,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const UserSettings = () => {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    weeklyDigest: true,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showActivity: true,
    dataSharing: false,
  });

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    theme: "light",
    fontSize: "medium",
    reduceMotion: false,
    highContrast: false,
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
    twoFactorEnabled: false,
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleNotificationChange = (setting) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleThemeChange = (setting, value) => {
    setThemeSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSecurityInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess("Notification settings saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save notification settings");
    } finally {
      setLoading(false);
    }
  };

  const savePrivacy = async () => {
    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess("Privacy settings saved successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save privacy settings");
    } finally {
      setLoading(false);
    }
  };

  const saveTheme = async () => {
    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess("Theme settings saved successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save theme settings");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords
    if (securityData.new_password !== securityData.new_password_confirmation) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (securityData.new_password && securityData.new_password.length < 6) {
      setError("New password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // Here you would make an API call to update password
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Password updated successfully!");
      setSecurityData({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
        twoFactorEnabled: securityData.twoFactorEnabled,
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const toggleTwoFactor = async () => {
    setLoading(true);
    setError("");

    try {
      // Simulate API call to toggle 2FA
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSecurityData((prev) => ({
        ...prev,
        twoFactorEnabled: !prev.twoFactorEnabled,
      }));

      setSuccess(
        securityData.twoFactorEnabled
          ? "Two-factor authentication disabled"
          : "Two-factor authentication enabled"
      );

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update two-factor authentication");
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(clearMessages, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Customize your account preferences and security settings
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security Settings */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center mb-2">
                  <Shield className="w-6 h-6 text-gray-700 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Security</h2>
                </div>
                <p className="text-gray-600">
                  Manage your password and security preferences
                </p>
              </div>
            </div>

            <form onSubmit={updatePassword} className="space-y-6">
              {/* Password Change */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Password
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="current_password"
                      value={securityData.current_password}
                      onChange={handleSecurityInputChange}
                      className="input-field pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="new_password"
                        value={securityData.new_password}
                        onChange={handleSecurityInputChange}
                        className="input-field pr-10"
                        placeholder="Enter new password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="new_password_confirmation"
                        value={securityData.new_password_confirmation}
                        onChange={handleSecurityInputChange}
                        className="input-field pr-10"
                        placeholder="Confirm new password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Update Password
                    </>
                  )}
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTwoFactor}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      securityData.twoFactorEnabled
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {securityData.twoFactorEnabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Notification Settings */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center mb-2">
                  <Bell className="w-6 h-6 text-gray-700 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Notifications
                  </h2>
                </div>
                <p className="text-gray-600">
                  Choose what notifications you want to receive
                </p>
              </div>
              <button
                onClick={saveNotifications}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {key === "emailNotifications" &&
                        "Receive email notifications about your account"}
                      {key === "pushNotifications" &&
                        "Receive push notifications in your browser"}
                      {key === "marketingEmails" &&
                        "Receive marketing and promotional emails"}
                      {key === "securityAlerts" &&
                        "Receive alerts about security events"}
                      {key === "weeklyDigest" &&
                        "Receive weekly summary emails"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange(key)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      value ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full transform transition-transform ${
                        value ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Additional Settings */}
        <div className="space-y-6">
          {/* Privacy Settings */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-700 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>
              </div>
              <button
                onClick={savePrivacy}
                disabled={loading}
                className="text-sm btn-primary"
              >
                Save
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={privacySettings.profileVisibility}
                  onChange={(e) =>
                    handlePrivacyChange("profileVisibility", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="public">Public</option>
                  <option value="connections">Connections Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="space-y-3">
                {Object.entries(privacySettings)
                  .filter(([key]) => key !== "profileVisibility")
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <button
                        onClick={() => handlePrivacyChange(key, !value)}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          value ? "bg-primary-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full transform transition-transform ${
                            value ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Palette className="w-5 h-5 text-gray-700 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Appearance
                </h3>
              </div>
              <button
                onClick={saveTheme}
                disabled={loading}
                className="text-sm btn-primary"
              >
                Save
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleThemeChange("theme", "light")}
                    className={`flex-1 flex items-center justify-center p-3 rounded-lg border ${
                      themeSettings.theme === "light"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Sun className="w-5 h-5 mr-2" />
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange("theme", "dark")}
                    className={`flex-1 flex items-center justify-center p-3 rounded-lg border ${
                      themeSettings.theme === "dark"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Moon className="w-5 h-5 mr-2" />
                    Dark
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select
                  value={themeSettings.fontSize}
                  onChange={(e) =>
                    handleThemeChange("fontSize", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="space-y-3">
                {Object.entries(themeSettings)
                  .filter(([key]) => key !== "theme" && key !== "fontSize")
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <button
                        onClick={() => handleThemeChange(key, !value)}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          value ? "bg-primary-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full transform transition-transform ${
                            value ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  /* Implement export data */
                }}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-gray-900">Export My Data</p>
                <p className="text-sm text-gray-600">
                  Download all your personal data
                </p>
              </button>

              <button
                onClick={() => {
                  /* Implement delete account */
                }}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-sm text-gray-600">
                  Permanently delete your account
                </p>
              </button>

              <button
                onClick={logout}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-gray-900">Logout</p>
                <p className="text-sm text-gray-600">
                  Sign out from all devices
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserSettings;

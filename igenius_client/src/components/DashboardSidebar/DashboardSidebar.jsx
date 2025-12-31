// src/components/DashboardSidebar/DashboardSidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  BarChart3,
  Target,
  Calendar,
  Award,
  BookOpen,
  Settings,
  Users,
  Folder,
  Activity,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export const DashboardSidebar = ({ showInPlayer = false }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const location = useLocation();
  const { user } = useAuthStore();

  // Don't show sidebar in QuestionPlayer unless explicitly allowed
  if (!showInPlayer && location.pathname.includes("/play/")) {
    return null;
  }

  const isAdmin = user?.role === "admin";

  const navigationItems = [
    {
      name: "Overview",
      path: "/dashboard",
      icon: <Home className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      name: "Practice",
      path: "/levels",
      icon: <BookOpen className="w-5 h-5" />,
      adminOnly: false,
    },
    // {
    //   name: "Progress",
    //   path: "/dashboard/progress",
    //   icon: <Activity className="w-5 h-5" />,
    //   adminOnly: false,
    // },
    // {
    //   name: "Goals",
    //   path: "/dashboard/goals",
    //   icon: <Target className="w-5 h-5" />,
    //   adminOnly: false,
    // },
    // {
    //   name: "Schedule",
    //   path: "/dashboard/schedule",
    //   icon: <Calendar className="w-5 h-5" />,
    //   adminOnly: false,
    // },
    // {
    //   name: "Achievements",
    //   path: "/dashboard/achievements",
    //   icon: <Award className="w-5 h-5" />,
    //   adminOnly: false,
    // },
    // {
    //   name: "Analytics",
    //   path: "/dashboard/analytics",
    //   icon: <BarChart3 className="w-5 h-5" />,
    //   adminOnly: isAdmin,
    // },
    {
      name: "User Management",
      path: "/admin/users",
      icon: <Users className="w-5 h-5" />,
      adminOnly: isAdmin,
    },
    // {
    //   name: "Content",
    //   path: "/admin/content",
    //   icon: <Folder className="w-5 h-5" />,
    //   adminOnly: isAdmin,
    // },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="w-5 h-5" />,
      adminOnly: false,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden lg:block fixed z-1">
      <div className="p-6 border-b border-gray-200">
        <div className="items-center">
          <div>
            <h2 className="font-bold text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-500">
              {isAdmin ? "Admin Panel" : "Learning Center"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <nav className="space-y-1">
          {navigationItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors group ${
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/")
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      location.pathname === item.path ||
                      location.pathname.startsWith(item.path + "/")
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-600"
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                </div>
                {(location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/")) && (
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                )}
              </Link>
            ))}
        </nav>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-800">
                {user?.name || "User"}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role === "admin" ? "Administrator" : "Student"}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

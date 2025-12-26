// src/components/DashboardSidebar/DashboardSidebar.jsx
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export const DashboardSidebar = ({ showInPlayer = false }) => {
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
    {
      name: "Progress",
      path: "/dashboard/progress",
      icon: <Activity className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      name: "Goals",
      path: "/dashboard/goals",
      icon: <Target className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      name: "Schedule",
      path: "/dashboard/schedule",
      icon: <Calendar className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      name: "Achievements",
      path: "/dashboard/achievements",
      icon: <Award className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      name: "Analytics",
      path: "/dashboard/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      adminOnly: isAdmin,
    },
    {
      name: "User Management",
      path: "/admin/users",
      icon: <Users className="w-5 h-5" />,
      adminOnly: isAdmin,
    },
    {
      name: "Content",
      path: "/admin/content",
      icon: <Folder className="w-5 h-5" />,
      adminOnly: isAdmin,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="w-5 h-5" />,
      adminOnly: false,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden lg:block">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">AP</span>
          </div>
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

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today's Practice</span>
              <span className="font-bold text-blue-600">45 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Weekly Goal</span>
              <span className="font-bold text-green-600">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Streak</span>
              <span className="font-bold text-purple-600">7 days</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// src/components/DashboardSidebar/DashboardSidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  Home,
  BookOpen,
  Users,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export const DashboardSidebar = ({
  showInPlayer = false,
  mobileOpen = false,
  setMobileOpen = () => {},
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      name: "User Management",
      path: "/admin/users",
      icon: <Users className="w-5 h-5" />,
      adminOnly: true,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 lg:p-6 border-b border-gray-200">
        {/* Mobile close button */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Dashboard</h2>
              <p className="text-sm text-gray-500">
                {isAdmin ? "Admin Panel" : "Learning Center"}
              </p>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Desktop header */}
        {!isMobile && (
          <div className="items-center">
            <div>
              <h2 className="font-bold text-gray-800 text-lg lg:text-xl">
                Dashboard
              </h2>
              <p className="text-sm text-gray-500">
                {isAdmin ? "Admin Panel" : "Learning Center"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <nav className="space-y-1 mb-6">
          {navigationItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center justify-between px-3 lg:px-4 py-3 rounded-lg transition-colors group ${
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
                  <span className="font-medium text-sm lg:text-base">
                    {item.name}
                  </span>
                </div>
                {(location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/")) && (
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                )}
              </Link>
            ))}
        </nav>

        {/* User Menu */}
        <div className="relative mt-8" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {user?.name || "User"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.role === "admin" ? "Administrator" : "Student"}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${showUserMenu ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div
              className={`absolute ${isMobile ? "bottom-full left-0 right-0 mb-2" : "top-full left-0 right-0 mt-2"} bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50`}
            >
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                onClick={() => {
                  setShowUserMenu(false);
                  handleNavClick();
                }}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Mobile sidebar
  if (isMobile) {
    return (
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full bg-white shadow-xl overflow-y-auto">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden lg:block fixed z-10">
      {sidebarContent}
    </aside>
  );
};

// Mobile header component
export const MobileHeader = ({ setMobileOpen }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path === "/levels") return "Practice Levels";
    if (path.startsWith("/admin")) return "Admin";
    if (path === "/profile") return "Profile";
    return "Dashboard";
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {getPageTitle()}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium shrink-0">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-800 truncate max-w-[100px]">
              {user?.name || "User"}
            </div>
            <div className="text-xs text-gray-500">
              {user?.role === "admin" ? "Admin" : "Student"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

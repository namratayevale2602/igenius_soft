// src/layout/Layout.jsx
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  DashboardSidebar,
  MobileHeader,
} from "../components/DashboardSidebar/DashboardSidebar";
import { Navbar } from "../components/Navbar/Navbar";

const Layout = () => {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're in the QuestionPlayer route
  const isQuestionPlayer = location.pathname.includes("/play/");

  // Check screen size for mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileSidebarOpen, isMobile]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - hidden in QuestionPlayer */}
      {/* {!isQuestionPlayer && <Navbar />} */}

      {/* Mobile Header - only shown on mobile when not in QuestionPlayer */}
      {!isQuestionPlayer && isMobile && (
        <MobileHeader setMobileOpen={setMobileSidebarOpen} />
      )}

      {/* Sidebar - hidden in QuestionPlayer */}
      {!isQuestionPlayer && (
        <DashboardSidebar
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />
      )}

      {/* Main content */}
      <main
        className={`
        ${!isQuestionPlayer && !isMobile ? "lg:ml-64" : ""}
        ${!isQuestionPlayer && isMobile ? "pt-16" : ""}
        min-h-screen transition-all duration-300
      `}
      >
        <div
          className={`${!isQuestionPlayer ? "p-4 lg:p-6" : ""} min-h-screen`}
        >
          <Outlet />
        </div>
      </main>

      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

// src/layout/Layout.jsx
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar/Navbar";
import { DashboardSidebar } from "../components/DashboardSidebar/DashboardSidebar";
import { useLocation } from "react-router-dom";

const Layout = () => {
  const location = useLocation();

  // Check if we're in the QuestionPlayer route
  const isQuestionPlayer = location.pathname.includes("/play/");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - hidden in QuestionPlayer */}
      {/* {!isQuestionPlayer && <Navbar />} */}

      <div className="flex">
        {/* Sidebar - hidden in QuestionPlayer */}
        {!isQuestionPlayer && <DashboardSidebar />}

        {/* Main content */}
        <main className={`flex-1 ${!isQuestionPlayer ? "p-6" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

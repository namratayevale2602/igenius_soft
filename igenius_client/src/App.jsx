import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import Layout from "./layout/Layout";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
// import Register from "./pages/Register/Register";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import UserProfile from "./pages/User/UserProfile";
import UserSettings from "./pages/User/UserSettings";
import UserFormPage from "./pages/User/UserForm";
import Dashboard from "./pages/Dashboard/Dashboard";
import { LevelSelection } from "./components/LevelSelection/LevelSelection";
import { WeekSelection } from "./components/WeekSelection/WeekSelection";
import { QuestionSetSelection } from "./components/QuestionSetSelection/QuestionSetSelection";
import { QuestionPlayer } from "./components/QuestionPlayer/QuestionPlayer";
import { AnswersPage } from "./components/QuestionPlayer/AnswersPage";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}

        {/* Protected routes */}
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />
          {/* Admin routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users/create"
            element={
              <ProtectedRoute requireAdmin>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users/:id/edit"
            element={
              <ProtectedRoute requireAdmin>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/settings"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          {/* Practice Flow */}
          <Route path="/levels" element={<LevelSelection />} />
          <Route path="/levels/:levelSlug" element={<WeekSelection />} />
          <Route
            path="/levels/:levelSlug/weeks/:weekNumber"
            element={<QuestionSetSelection />}
          />
          <Route
            path="/play/:levelSlug/:weekNumber/:questionSetId"
            element={<QuestionPlayer />}
          />{" "}
          <Route
            path="/play/:levelSlug/:weekNumber/multiple"
            element={<QuestionPlayer />}
          />
          <Route
            path="/play/:levelSlug/:weekNumber/:questionSetId"
            element={<QuestionPlayer />}
          />
          <Route
            path="/levels/:levelSlug/:weekNumber"
            element={<QuestionSetSelection />}
          />
          <Route path="/answers" element={<AnswersPage />} />
          {/* Fallback redirect */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Route>
      </>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;

// src/App.jsx
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { LevelSelection } from "./components/LevelSelection/LevelSelection";
// import { WeekSelection } from "./components/WeekSelection/WeekSelection";
// import { QuestionSetSelection } from "./components/QuestionSetSelection/QuestionSetSelection";
// import { QuestionPlayer } from "./components/QuestionPlayer/QuestionPlayer";

// function App() {
//   return (
//     <Router>
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//         <Routes>
//           <Route path="/" element={<LevelSelection />} />
//           <Route path="/levels/:levelSlug" element={<WeekSelection />} />
//           <Route
//             path="/levels/:levelSlug/weeks/:weekNumber"
//             element={<QuestionSetSelection />}
//           />
//           <Route path="/play" element={<QuestionPlayer />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;


import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
// import AdminUsersPage from "./pages/AdminUsersPage";
import AdminPage from "@/pages/AdminPage";
import AdminNotesPage from "@/pages/AdminNotePage";
import AdminInterestsPage from "@/pages/AdminInterestPage";
import PostsPage from "@/pages/PostsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("accessToken");

  // return token ? <DashboardPage /> : <Navigate to="/login" replace />;
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        {/* <Route path="/admin" element={<AdminUsersPage />} /> */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/notes" element={<AdminNotesPage />} />
        <Route path="/admin/interests" element={<AdminInterestsPage />} />
        <Route path="/posts" element={<PostsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

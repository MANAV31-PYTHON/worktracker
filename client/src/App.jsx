import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import UsersPage from "./pages/UsersPage";
import NotificationsPage from "./pages/NotificationsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import "./App.css";
import { DialogProvider } from "./components/Dialog";

function App() {
  return (
    <DialogProvider>
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
    </DialogProvider>
  );
}

export default App;

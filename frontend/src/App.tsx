import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Toast, ToastMessage } from './components/Toast';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { CoachDashboard } from './pages/CoachDashboard';

import { StudentProfile } from './pages/StudentProfile';
import { AuditLogs } from './pages/AuditLogs';
import { ClassesPage } from './pages/ClassesPage';

const AppRoutes: React.FC<{
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => void;
}> = ({ showToast }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing Success Coach Portal...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Routes>
            {user.role === 'admin' && (
              <>
                <Route path="/admin" element={<AdminDashboard showToast={showToast} />} />
                <Route path="/admin/classes" element={<ClassesPage showToast={showToast} />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
                <Route path="/student-profile/:studentId" element={<StudentProfile showToast={showToast} />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            )}

            {user.role === 'coach' && (
              <>
                <Route path="/coach" element={<CoachDashboard showToast={showToast} />} />
                <Route path="/student-profile/:studentId" element={<StudentProfile showToast={showToast} />} />
                <Route path="*" element={<Navigate to="/coach" replace />} />
              </>
            )}


          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    description?: string
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes showToast={showToast} />
        <Toast toasts={toasts} onDismiss={handleDismiss} />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

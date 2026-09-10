import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SidebarProvider } from './context/SidebarContext';
import { ToastProvider } from './context/ToastContext';
import { LiveSyncProvider } from './context/LiveSyncContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Donations from './pages/Donations';
import Donors from './pages/Donors';
import Committee from './pages/Committee';
import Expenses from './pages/Expenses';
import Planning from './pages/Planning';
import Reports from './pages/Reports';
import Festivals from './pages/Festivals';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import PublicPortal from './pages/PublicPortal';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <LiveSyncProvider>
          <SidebarProvider>
            <ToastProvider>
              <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/public" element={<PublicPortal />} />

                {/* Authenticated Application Shell */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="donations" element={<Donations />} />
                  <Route path="donors" element={<Donors />} />
                  <Route path="committee" element={<Committee />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="planning" element={<Planning />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="festivals" element={<Festivals />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </SidebarProvider>
      </LiveSyncProvider>
    </AuthProvider>
  </LanguageProvider>
  );
}

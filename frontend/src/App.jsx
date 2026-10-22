import React from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ClientApplicationsPage from './pages/ClientApplicationsPage';
import FreelancerDashboardPage from './pages/FreelancerDashboardPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import ApplyProjectPage from './pages/ApplyProjectPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageProjectsPage from './pages/ManageProjectsPage';
import ManageApplicationsPage from './pages/ManageApplicationsPage';

// Helper component to redirect legacy query parameter routes like /project-details.html?id=1 to /projects/1
function LegacyProjectDetailsRedirect() {
  const [params] = useSearchParams();
  const id = params.get('id');
  if (id) {
    return <Navigate to={`/projects/${id}`} replace />;
  }
  return <Navigate to="/projects" replace />;
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/index.html" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login.html" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register.html" element={<RegisterPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects.html" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailsPage />} />
          <Route path="/project-details.html" element={<LegacyProjectDetailsRedirect />} />

          {/* Client Routes */}
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <ClientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-dashboard.html"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <ClientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-project"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <CreateProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-project.html"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <CreateProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-applications"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <ClientApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-applications.html"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <ClientApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Freelancer Routes */}
          <Route
            path="/freelancer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['FREELANCER']}>
                <FreelancerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer-dashboard.html"
            element={
              <ProtectedRoute allowedRoles={['FREELANCER']}>
                <FreelancerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-applications"
            element={
              <ProtectedRoute allowedRoles={['FREELANCER']}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-applications.html"
            element={
              <ProtectedRoute allowedRoles={['FREELANCER']}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply-project"
            element={
              <ProtectedRoute allowedRoles={['FREELANCER']}>
                <ApplyProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply-project.html"
            element={
              <ProtectedRoute allowedRoles={['FREELANCER']}>
                <ApplyProjectPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard.html"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManageUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-users.html"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManageUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-projects"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManageProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-projects.html"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManageProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-applications"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManageApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-applications.html"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManageApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}


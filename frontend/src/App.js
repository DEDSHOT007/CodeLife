import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import CoursesListPage from './components/LearningHub/CoursesListPage';
import CourseDetailsPage from './components/LearningHub/CourseDetailsPage';
import ProgressTrackingPage from './components/LearningHub/ProgressTrackingPage';
import EnrolledCoursesDashboard from './components/LearningHub/EnrolledCoursesDashboard';
import PentestingToolkit from './components/PentestingToolkit';

function PrivateRoute({ children }) {
  const { currentUser, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="bg-gradient-dark min-vh-100 d-flex align-items-center justify-content-center">
        <div>Loading...</div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/learning-hub"
            element={
              <PrivateRoute>
                <CoursesListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/learning-hub/course/:courseId"
            element={
              <PrivateRoute>
                <CourseDetailsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <PrivateRoute>
                <ProgressTrackingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-courses"
            element={
              <PrivateRoute>
                <EnrolledCoursesDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/pentesting"
            element={
              <PrivateRoute>
                <PentestingToolkit />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { TrainingPlan } from './pages/TrainingPlan';
import { Nutrition } from './pages/Nutrition';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/AdminDashboard';
import { ActiveBreaks } from './pages/ActiveBreaks';
import { Plans } from './pages/Plans';
import { Landing } from './pages/Landing';
import { Meditation } from './pages/Meditation';
import { Profile } from './pages/Profile';
import { Navigation } from './components/Navigation';
import { useAuth } from './hooks/useAuth';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-foreground text-lg sm:text-xl text-center">Verificando permisos...</div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-foreground text-lg sm:text-xl text-center">Cargando...</div>
      </div>
    );
  }

  // For public routes (landing), we don't require authentication
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pb-safe">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public landing page */}
        <Route 
          path="/landing" 
          element={
            <ProtectedRoute>
              <Landing />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected app routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/training" element={
          <ProtectedRoute>
            <AppLayout>
              <TrainingPlan />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/nutrition" element={
          <ProtectedRoute>
            <AppLayout>
              <Nutrition />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/breaks" element={
          <ProtectedRoute>
            <AppLayout>
              <ActiveBreaks />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/meditation" element={
          <ProtectedRoute>
            <AppLayout>
              <Meditation />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/plans" element={
          <ProtectedRoute>
            <AppLayout>
              <Plans />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedAdminRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
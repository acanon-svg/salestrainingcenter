import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { PasswordChangeDialog } from "@/components/auth/PasswordChangeDialog";
import { InactivityWarningDialog } from "@/components/auth/InactivityWarningDialog";
import { ChatbotBubble } from "@/components/chatbot/ChatbotBubble";
import { AITrainingBot } from "@/components/AITrainingBot";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Ranking from "@/pages/Ranking";
import Badges from "@/pages/Badges";
import Notifications from "@/pages/Notifications";
import Feedback from "@/pages/Feedback";
import CreateCourse from "@/pages/CreateCourse";
import EditCourse from "@/pages/EditCourse";
import MyCourses from "@/pages/MyCourses";
import Reports from "@/pages/Reports";
import UserManagement from "@/pages/UserManagement";
import NotFound from "@/pages/NotFound";
import TrainingMaterials from "@/pages/TrainingMaterials";
import Team from "@/pages/Team";
import Announcements from "@/pages/Announcements";
import Tools from "@/pages/Tools";
import TeamFeedbackForms from "@/pages/TeamFeedbackForms";
import TeamFeedbackView from "@/pages/TeamFeedbackView";
import Results from "@/pages/Results";
import Followups from "@/pages/Followups";
import ResetPassword from "@/pages/ResetPassword";
import PersonalizedTraining from "@/pages/PersonalizedTraining";
import AICourseReview from "@/pages/AICourseReview";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Inactivity Monitor Component
const InactivityMonitor: React.FC = () => {
  const { signOut } = useAuth();
  const { showWarning, remainingSeconds, resetTimer } = useInactivityTimeout();

  return (
    <InactivityWarningDialog
      open={showWarning}
      remainingSeconds={remainingSeconds}
      onContinue={resetTimer}
      onLogout={signOut}
    />
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, requiresPasswordChange, markPasswordChanged } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Show password change dialog if required
  if (requiresPasswordChange) {
    return (
      <>
        {children}
        <PasswordChangeDialog
          open={true}
          onPasswordChanged={markPasswordChanged}
          userId={user.id}
        />
      </>
    );
  }

  return <>{children}</>;
};

// Role-based Route Component
const RoleRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: ("student" | "creator" | "admin" | "lider" | "analista" | "qa")[];
}> = ({ children, allowedRoles }) => {
  const { user, roles, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const hasAllowedRole = allowedRoles.some(role => hasRole(role));
  if (!hasAllowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected Routes - All Users */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ranking"
        element={
          <ProtectedRoute>
            <Ranking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/badges"
        element={
          <ProtectedRoute>
            <Badges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materials"
        element={
          <ProtectedRoute>
            <TrainingMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materials/:id"
        element={
          <ProtectedRoute>
            <TrainingMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalized-training"
        element={
          <ProtectedRoute>
            <PersonalizedTraining />
          </ProtectedRoute>
        }
      />
      
      {/* Creator/Admin Routes */}
      <Route
        path="/ai-courses"
        element={
          <RoleRoute allowedRoles={["creator", "admin"]}>
            <AICourseReview />
          </RoleRoute>
        }
      />
      <Route
        path="/courses/create"
        element={
          <RoleRoute allowedRoles={["creator", "admin"]}>
            <CreateCourse />
          </RoleRoute>
        }
      />
      <Route
        path="/my-courses"
        element={
          <RoleRoute allowedRoles={["creator", "admin"]}>
            <MyCourses />
          </RoleRoute>
        }
      />
      <Route
        path="/courses/:id/edit"
        element={
          <RoleRoute allowedRoles={["creator", "admin"]}>
            <EditCourse />
          </RoleRoute>
        }
      />
      <Route
        path="/announcements"
        element={
          <RoleRoute allowedRoles={["creator", "admin"]}>
            <Announcements />
          </RoleRoute>
        }
      />
      <Route
        path="/tools"
        element={
          <ProtectedRoute>
            <Tools />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />
      <Route
        path="/followups"
        element={
          <ProtectedRoute>
            <Followups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-feedback-forms"
        element={
          <RoleRoute allowedRoles={["creator", "admin"]}>
            <TeamFeedbackForms />
          </RoleRoute>
        }
      />
      
      {/* Leader Routes */}
      <Route
        path="/team"
        element={
          <RoleRoute allowedRoles={["lider"]}>
            <Team />
          </RoleRoute>
        }
      />
      <Route
        path="/team-feedback"
        element={
          <RoleRoute allowedRoles={["lider"]}>
            <TeamFeedbackView />
          </RoleRoute>
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/reports"
        element={
          <RoleRoute allowedRoles={["admin", "lider", "analista"]}>
            <Reports />
          </RoleRoute>
        }
      />
      <Route
        path="/users"
        element={
          <RoleRoute allowedRoles={["admin"]}>
            <UserManagement />
          </RoleRoute>
        }
      />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary fallbackTitle="No pudimos cargar la plataforma">
            <AppRoutes />
          </ErrorBoundary>

          {/* Inactivity timeout monitor */}
          <InactivityMonitor />

          {/* The chatbot is optional; if it crashes it should not break the whole app */}
          <ErrorBoundary fallbackTitle="No pudimos cargar el chatbot">
            <ChatbotBubble />
          </ErrorBoundary>

          {/* AI Training Bot */}
          <ErrorBoundary fallbackTitle="No pudimos cargar el asistente IA">
            <AITrainingBot />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

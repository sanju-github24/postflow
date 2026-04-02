import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

import LoginPage     from "@/pages/LoginPage";
import SignupPage    from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import ComposePage   from "@/pages/ComposePage";
import ScheduledPage from "@/pages/ScheduledPage";
import AccountsPage  from "@/pages/AccountsPage";
import DataDeletionPage from "./pages/DataDeletionPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Navigate to="/login" replace />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/signup"    element={<SignupPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/compose"   element={<ProtectedRoute><ComposePage /></ProtectedRoute>} />
          <Route path="/scheduled" element={<ProtectedRoute><ScheduledPage /></ProtectedRoute>} />
          <Route path="/accounts"  element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
          <Route path="/data-deletion" element={<ProtectedRoute><DataDeletionPage /></ProtectedRoute>} />
          <Route path="/privacy"       element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
          <Route path="/terms"         element={<ProtectedRoute><TermsPage /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
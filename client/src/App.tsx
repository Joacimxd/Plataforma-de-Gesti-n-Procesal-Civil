import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import CaseDetail from "@/pages/CaseDetail";
import NewCase from "@/pages/NewCase";
import Profile from "@/pages/Profile";
import Landing from "@/pages/Landing";
import type { ReactNode } from "react";
import type { Role } from "@/types";
import Nav from "@/components/ui/navbar";
function PrivateRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: Role[];
}) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && !requireRole.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/cases/new"
            element={
              <PrivateRoute requireRole={["JUDGE"]}>
                <NewCase />
              </PrivateRoute>
            }
          />
          <Route
            path="/cases/:id"
            element={
              <PrivateRoute>
                <CaseDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </>
  );
}

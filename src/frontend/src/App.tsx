// src/frontend/src/App.tsx
import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import VisitsPage from "./pages/VisitsPage";
import VisitHistoryPage from "./pages/VisitHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import InmatesPage from "./pages/InmatesPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

// Admin pages
import AdminInmatesPage from "./pages/AdminInmatesPage";

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.body.classList.remove("app-dark", "app-light");
    const lightRoutes = [
      "/login", "/register", "/forgot", "/reset",
      "/dashboard", "/visits", "/history", "/notifications",
      "/inmates", "/admin/inmates"
    ];
    if (lightRoutes.some((r) => pathname.startsWith(r))) {
      document.body.classList.add("app-light");
    } else {
      document.body.classList.add("app-dark");
    }
  }, [pathname]);

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/reset" element={<ResetPasswordPage />} />

      {/* Privadas (cualquier usuario autenticado) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/visits" element={<VisitsPage />} />
        <Route path="/history" element={<VisitHistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/inmates" element={<InmatesPage />} />
      </Route>

      {/* Solo ADMIN */}
      <Route element={<AdminRoute />}>
        <Route path="/admin/inmates" element={<AdminInmatesPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}


// // src/frontend/src/App.tsx
// import { useEffect } from "react";
// import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// import LoginPage from "./pages/LoginPage";
// import RegisterPage from "./pages/RegisterPage";
// import ForgotPasswordPage from "./pages/ForgotPasswordPage";
// import ResetPasswordPage from "./pages/ResetPasswordPage";
// import DashboardPage from "./pages/DashboardPage";
// import VisitsPage from "./pages/VisitsPage";
// import ProtectedRoute from "./routes/ProtectedRoute";
// import VisitHistoryPage from "./pages/VisitHistoryPage";
// import ProfilePage from "./pages/ProfilePage";
// import NotificationsPage from "./pages/NotificationsPage";
// import InmatesPage from "./pages/InmatesPage";



// export default function App() {
//   const { pathname } = useLocation();

//   // Cambia clases del body según ruta
//   useEffect(() => {
//     document.body.classList.remove("app-dark", "app-light");
//     const lightRoutes = ["/login", "/register", "/forgot", "/reset", "/dashboard", "/visits", "/history", "/notifications"];
//     if (lightRoutes.some((r) => pathname.startsWith(r))) {
//       document.body.classList.add("app-light");
//     } else {
//       document.body.classList.add("app-dark");
//     }
//   }, [pathname]);

//   return (
//     <Routes>
//       {/* Públicas */}
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/register" element={<RegisterPage />} />
//       <Route path="/forgot" element={<ForgotPasswordPage />} />
//       <Route path="/reset" element={<ResetPasswordPage />} />

//       {/* Privadas */}
//       <Route element={<ProtectedRoute />}>
//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
//         <Route path="/dashboard" element={<DashboardPage />} />
//         <Route path="/visits" element={<VisitsPage />} />
//         <Route path="/history" element={<VisitHistoryPage />} />
//         <Route path="/profile" element={<ProfilePage />} />
//         <Route path="/notifications" element={<NotificationsPage />} /> 
//         <Route path="/inmates" element={<InmatesPage />} />



//       </Route>

//       {/* Fallback */}
//       <Route path="*" element={<Navigate to="/login" replace />} />
//     </Routes>
//   );
// }

import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("access_token");
  const expiresAt = sessionStorage.getItem("expires_at");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (
    !expiresAt ||
    !Number.isFinite(Date.parse(expiresAt)) ||
    Date.parse(expiresAt) <= Date.now()
  ) {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("session_id");
    sessionStorage.removeItem("expires_at");

    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
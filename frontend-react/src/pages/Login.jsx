import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Login failed. Please check your credentials."
        );
        return;
      }

      sessionStorage.setItem(
        "access_token",
        data.access_token
      );

      sessionStorage.setItem(
        "session_id",
        data.session_id
      );

      sessionStorage.setItem(
        "expires_at",
        data.expires_at
      );

      const profileResponse = await fetch(
        `${API_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      if (profileResponse.status === 404) {
        navigate("/profile");
        return;
      }

      if (!profileResponse.ok) {
        throw new Error("Unable to retrieve profile");
      }

      const profileData = await profileResponse.json();

      if (
        profileData.full_name &&
        profileData.phone_number &&
        profileData.date_of_birth &&
        profileData.gender &&
        profileData.address
      ) {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    } catch (error) {
      console.error(error);

      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("session_id");
      sessionStorage.removeItem("expires_at");

      setMessage(
        "Unable to connect or retrieve profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Product Management System</h1>

      <p className="subtitle">
        Welcome! Please login to continue.
      </p>

      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p className="error-message">{message}</p>
        )}

        <p className="auth-link">
          Don't have an account?{" "}
          <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
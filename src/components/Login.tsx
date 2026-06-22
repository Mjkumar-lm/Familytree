import { useState } from "react";
import { LogIn, ShieldCheck, X } from "lucide-react";

export type Role = "admin" | "user";

export interface AuthUser {
  name: string;
  role: Role;
}

interface LoginProps {
  onLogin: (user: AuthUser) => void;
  onClose?: () => void;
}

const ADMIN = { username: "admin", password: "admin", display: "Administrator" };

export const Login = ({ onLogin, onClose }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() !== ADMIN.username || password !== ADMIN.password) {
      setError("Invalid admin credentials.");
      return;
    }
    onLogin({ name: ADMIN.display, role: "admin" });
  };

  const fillDemo = () => {
    setUsername(ADMIN.username);
    setPassword(ADMIN.password);
    setError("");
  };

  return (
    <div className="login-overlay" role="dialog" aria-modal="true" aria-label="Admin sign in">
      <div className="login-backdrop" onClick={onClose} aria-hidden="true" />
      <section className="login-card">
        {onClose && (
          <button type="button" className="login-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        )}

        <div className="login-brand">
          <span className="login-om" aria-hidden="true">&#x0950;</span>
          <span className="login-brand-text">Keshwani's Lineage</span>
        </div>

        <h1 className="login-title">Admin Sign In</h1>
        <p className="login-subtitle">Enter administrator credentials to manage the archive.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Username</span>
            <input
              className="simple-input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              placeholder="admin"
              autoFocus
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              className="simple-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••"
            />
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="primary-button login-submit">
            <LogIn size={16} /> Sign in
          </button>
        </form>

        <div className="login-divider"><span>Demo</span></div>

        <button type="button" className="login-demo login-demo--single" onClick={fillDemo}>
          <ShieldCheck size={16} />
          <div>
            <strong>Admin</strong>
            <span>admin / admin</span>
          </div>
        </button>
      </section>
    </div>
  );
};

import React, { useState } from "react";
import { post } from "../services/api";
import "../styles/login.css";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotMessage("");
        if (!forgotEmail) return;

        try {
            setForgotLoading(true);
            const res = await post("/auth/forgot-password/", { email: forgotEmail });
            setForgotMessage(res.message || "Reset link sent.");
            setForgotEmail("");
        } catch (err) {
            console.error(err);
            setForgotMessage("Failed to send reset link.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            setLoading(true);
            const data = await post("/auth/login/", { email, password });

            // Expected backend response: { token, role, email, name }
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role || "");
                localStorage.setItem("email", data.email || email);
                localStorage.setItem("name", data.name || "");

                // Redirect based on role
                const userRole = data.role?.toLowerCase() || "employee";

                switch (userRole) {
                    case "admin":
                    case "super_admin":
                        window.location.href = "/admin";
                        break;
                    case "manager":
                        window.location.href = "/manager";
                        break;
                    case "team_leader":
                        window.location.href = "/team-leader";
                        break;
                    case "employee":
                    default:
                        window.location.href = "/employee";
                        break;
                }
            } else {
                setError("Login failed. No token received.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "Invalid credentials or server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <a href="/" className="back-home-btn">
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back to Home</span>
            </a>
            <div className="login-card">
                <div className="login-logo">
                    Shnoor HRM
                </div>

                <h2 className="login-title">
                    Welcome Back
                </h2>

                <p className="login-subtitle">
                    Sign in to your account to continue
                </p>

                {error && (
                    <div style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="admin@shnoor.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); setForgotMessage(""); }} style={{ color: 'var(--primary-color, #6366f1)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            Forgot Password?
                        </a>
                    </div>

                    <button className="login-btn" type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>

            {showForgotModal && (
                <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '2rem', position: 'relative', borderRadius: '16px', background: 'var(--bg-main, #0f172a)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main, #f8fafc)' }}>Reset Password</h3>
                            <button onClick={() => setShowForgotModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontSize: '1.25rem' }}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        {forgotMessage && (
                            <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                {forgotMessage}
                            </div>
                        )}
                        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '0.25rem', display: 'block' }}>Enter your email address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={forgotEmail} 
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', background: 'rgba(0,0,0,0.2)', color: 'var(--text-main, #f8fafc)' }}
                                />
                            </div>
                            <button type="submit" className="login-btn" disabled={forgotLoading} style={{ marginTop: '0.5rem' }}>
                                {forgotLoading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoginPage;
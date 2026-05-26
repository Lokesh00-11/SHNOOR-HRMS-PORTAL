import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { post } from "../services/api";
import "../styles/login.css";

function ResetPasswordPage() {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        try {
            setLoading(true);
            const res = await post("/auth/reset-password-confirm/", {
                uidb64,
                token,
                password
            });

            setMessage(res.message || "Password has been reset successfully.");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            console.error(err);
            setError(err.message || "Reset link is invalid or has expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-logo">
                    Shnoor HRM
                </div>

                <h2 className="login-title">
                    Set New Password
                </h2>

                <p className="login-subtitle">
                    Enter your new password below.
                </p>

                {error && (
                    <div style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        {message}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            New Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || message}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading || message}
                        />
                    </div>

                    <button className="login-btn" type="submit" disabled={loading || message}>
                        {loading ? "Saving..." : "Save Password"}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <a href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            Back to Login
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordPage;

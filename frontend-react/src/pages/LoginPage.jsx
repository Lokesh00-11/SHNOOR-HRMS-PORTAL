import React, { useState } from "react";
import { post } from "../services/api";
import "../styles/login.css";
import hrIllustration from "../assets/hr-illustration.png";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
            
            // backend token, role, email, name }
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
            <div className="login-split-container">
                <div className="login-right-panel">
                    <div className="login-right-overlay"></div>
                    <div className="login-right-content">
                        <div className="login-right-badge">
                            <span>Shnoor HRMS Enterprise</span>
                        </div>
                        <h1 className="login-right-title">
                            Smart Workforce <br />
                            <span className="login-right-highlight">Management</span>
                        </h1>
                        <p className="login-right-subtitle">
                            Manage Teams. Organize Work. Scale Faster.
                        </p>
                        
                        <div className="login-artwork">
                            <img src={hrIllustration} alt="Workforce Illustration" className="hr-vector-illustration" />
                        </div>
                    </div>
                </div>

                <div className="login-left-panel">
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

                            <button className="login-btn" type="submit" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
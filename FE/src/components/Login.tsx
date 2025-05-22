import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../hooks/useLogin";
import "../styles/Login.css";

const LoginPage: React.FC = () =>
{
    // router helper
    const navigate = useNavigate();

    // login hook
    const { login, loading, error } = useLogin();

    // form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // on form submit
    const handleSubmit = async (e: React.FormEvent) =>
    {
        // prevent reload
        e.preventDefault();

        // attempt login, then redirect
        if (await login(username, password))
        {
            navigate("/");
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
                <label>
                    Username
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? "Logging in…" : "Login"}
                </button>
            </form>
            <p>
                Don’t have an account?{" "}
                <span className="auth-link" onClick={() => navigate("/signup")}>
                    Sign up
                </span>
            </p>
        </div>
    );
};

export default LoginPage;

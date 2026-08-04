import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "../hooks/useLogin";
import { startRobloxOAuth } from "../hooks/useTeamRegistrations";
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
    const [oauthError, setOauthError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("roblox") === "error") {
            setOauthError(params.get("message") || "Roblox login failed");
        }
        if (params.get("roblox") === "need_signup") {
            setOauthError("No account linked to that Roblox user. Sign up with Roblox instead.");
        }
    }, []);

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
            {(error || oauthError) && <div className="auth-error">{error || oauthError}</div>}
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
            <button
                type="button"
                className="auth-sso-btn"
                onClick={() => void startRobloxOAuth("login").catch((e) => setOauthError(String(e.message || e)))}
            >
                Log in with Roblox
            </button>
            <p>
                Don’t have an account?{" "}
                <Link className="auth-link" to="/signup">
                    Sign up
                </Link>
            </p>
        </div>
    );
};

export default LoginPage;

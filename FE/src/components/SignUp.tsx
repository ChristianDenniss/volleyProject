// src/pages/SignupPage.tsx
import React, { useState } from "react";
import { useNavigate }        from "react-router-dom";
import { useSignup }          from "../hooks/useSignUp";
import "../styles/Login.css";

const SignupPage: React.FC = () =>
{
    // router helper
    const navigate = useNavigate();

    // signup hook
    const { signup, loading, error, clearError } = useSignup();

    // form state
    const [username, setUsername] = useState("");
    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [confirm,  setConfirm]  = useState("");
    const [success,  setSuccess]  = useState<string | null>(null);

    // form submit handler
    const handleSubmit = async (e: React.FormEvent) =>
    {
        // prevent reload
        e.preventDefault();

        // basic password confirmation
        if (password !== confirm)
        {
            alert("Passwords do not match");
            return;
        }

        // clear previous messages
        clearError();
        setSuccess(null);

        // attempt signup
        if (await signup(username, password, email))
        {
            // show success and redirect
            setSuccess("Account created successfully! Redirecting to login…");
            setTimeout(() => navigate("/login"), 2000);
        }
    };

    return (
        <div className="auth-container">
            <h2>Sign Up</h2>

            {/* display error or success */}
            {error   && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

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
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
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
                        minLength={6}
                    />
                </label>
                <label>
                    Confirm Password
                    <input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? "Signing up…" : "Sign Up"}
                </button>
            </form>

            <p>
                Already have an account?{' '}
                <span
                    className="auth-link"
                    onClick={() => navigate("/login")}
                >
                    Log in
                </span>
            </p>
        </div>
    );
};

export default SignupPage;

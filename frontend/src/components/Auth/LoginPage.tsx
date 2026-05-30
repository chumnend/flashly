import { useState, type ChangeEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../providers/AuthProvider';

import './AuthPage.css';

interface FormData {
    email: string;
    password: string;
}

const LoginPage = () => {
    const { login } = useAuth();
    const location = useLocation();
    const redirectedFrom = location.state?.from?.pathname as string | undefined;

    const [form, setForm] = useState<FormData>({ email: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e: ChangeEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await login(form.email, form.password);
        if (result) setError(result.error);

        setLoading(false);
    };

    return (
        <div className="auth">
            <div className="auth__card">
                <div className="auth__header">
                    <div className="auth__logo">Flashly</div>
                    <h1 className="auth__title">Welcome back</h1>
                    <p className="auth__subtitle">
                        {redirectedFrom
                            ? 'Log in to continue.'
                            : 'Log in to your Flashly account.'}
                    </p>
                </div>

                <form className="auth__form" onSubmit={handleSubmit} noValidate>
                    <div className="auth__field">
                        <label className="auth__label" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="auth__input"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="jane@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="auth__input"
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Your password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && <p className="auth__error">{error}</p>}

                    <button
                        className="auth__submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in…' : 'Log in'}
                    </button>
                </form>

                <p className="auth__switch">
                    Don't have an account?{' '}
                    <Link to="/register" className="auth__switch-link">
                        Sign up free
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;

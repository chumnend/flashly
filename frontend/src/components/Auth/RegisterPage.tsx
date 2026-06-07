import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

import './AuthPage.css';

interface FormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
}

const RegisterPage = () => {
    const { register } = useAuth();

    const [form, setForm] = useState<FormData>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
    });
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

        const result = await register(form);
        if (result) setError(result.error);

        setLoading(false);
    };

    return (
        <div className="auth">
            <div className="auth__card">
                <div className="auth__header">
                    <div className="auth__logo">Flashly</div>
                    <h1 className="auth__title">Create your account</h1>
                    <p className="auth__subtitle">
                        Start building and sharing flashcard decks today.
                    </p>
                </div>

                <form className="auth__form" onSubmit={handleSubmit} noValidate>
                    <div className="auth__row">
                        <div className="auth__field">
                            <label className="auth__label" htmlFor="firstName">
                                First name
                            </label>
                            <input
                                className="auth__input"
                                id="firstName"
                                name="firstName"
                                type="text"
                                placeholder="Jane"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                                autoComplete="given-name"
                            />
                        </div>
                        <div className="auth__field">
                            <label className="auth__label" htmlFor="lastName">
                                Last name
                            </label>
                            <input
                                className="auth__input"
                                id="lastName"
                                name="lastName"
                                type="text"
                                placeholder="Doe"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                                autoComplete="family-name"
                            />
                        </div>
                    </div>

                    <div className="auth__field">
                        <label className="auth__label" htmlFor="username">
                            Username
                        </label>
                        <input
                            className="auth__input"
                            id="username"
                            name="username"
                            type="text"
                            placeholder="janedoe"
                            value={form.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                    </div>

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
                            placeholder="At least 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {error && <p className="auth__error">{error}</p>}

                    <button
                        className="auth__submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <p className="auth__switch">
                    Already have an account?{' '}
                    <Link to="/login" className="auth__switch-link">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;

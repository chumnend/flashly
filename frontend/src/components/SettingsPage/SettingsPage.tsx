import { useState } from 'react'

import { updateUser, changePassword } from '../../services/flashly'
import type { UpdateUserRequest } from '../../services/flashly'
import { useAuth } from '../../providers/AuthProvider'
import './SettingsPage.css'

type Section = 'profile' | 'email' | 'password'
type SaveState = 'idle' | 'saving' | 'success' | 'error'

const SettingsPage = () => {
    const { user, token, logout } = useAuth()

    const [activeSection, setActiveSection] = useState<Section>('profile')

    // ── Profile ───────────────────────────────────────────
    const [profileForm, setProfileForm] = useState<UpdateUserRequest>({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        username: user?.username ?? '',
        aboutMe: '',
    })
    const [profileState, setProfileState] = useState<SaveState>('idle')
    const [profileError, setProfileError] = useState<string | null>(null)

    // ── Email ─────────────────────────────────────────────
    const [emailForm, setEmailForm] = useState({
        newEmail: '',
        confirmEmail: '',
        currentPassword: '',
    })
    const [emailState, setEmailState] = useState<SaveState>('idle')
    const [emailError, setEmailError] = useState<string | null>(null)

    // ── Password ──────────────────────────────────────────
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [passwordState, setPasswordState] = useState<SaveState>('idle')
    const [passwordError, setPasswordError] = useState<string | null>(null)

    // ── Handlers ──────────────────────────────────────────
    const handleSaveProfile = async () => {
        if (!user || !token) return
        setProfileState('saving')
        setProfileError(null)
        const result = await updateUser(user.id, token, profileForm)
        if ('error' in result) {
            setProfileError(result.error)
            setProfileState('error')
        } else {
            setProfileState('success')
            setTimeout(() => setProfileState('idle'), 3000)
        }
    }

    const handleSaveEmail = async () => {
        if (!user || !token) return
        if (!emailForm.newEmail.trim()) {
            setEmailError('Email is required.')
            setEmailState('error')
            return
        }
        if (emailForm.newEmail !== emailForm.confirmEmail) {
            setEmailError('Email addresses do not match.')
            setEmailState('error')
            return
        }
        setEmailState('saving')
        setEmailError(null)
        const result = await updateUser(user.id, token, {
            email: emailForm.newEmail,
        })
        if ('error' in result) {
            setEmailError(result.error)
            setEmailState('error')
        } else {
            setEmailState('success')
            setEmailForm({
                newEmail: '',
                confirmEmail: '',
                currentPassword: '',
            })
            setTimeout(() => setEmailState('idle'), 3000)
        }
    }

    const handleChangePassword = async () => {
        if (!token) return
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match.')
            setPasswordState('error')
            return
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters.')
            setPasswordState('error')
            return
        }
        setPasswordState('saving')
        setPasswordError(null)
        const result = await changePassword(token, {
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
        })
        if ('error' in result) {
            setPasswordError(result.error)
            setPasswordState('error')
        } else {
            setPasswordState('success')
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
            setTimeout(() => setPasswordState('idle'), 3000)
        }
    }

    const initials = user
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : '?'

    const navItems: { id: Section; label: string; sub: string }[] = [
        { id: 'profile', label: 'Profile', sub: 'Name, username, bio' },
        { id: 'email', label: 'Email', sub: user?.email ?? '' },
        { id: 'password', label: 'Password', sub: 'Change your password' },
    ]

    return (
        <div className="sp">
            <div className="sp__layout">
                {/* ── Sidebar ── */}
                <aside className="sp__sidebar">
                    <div className="sp__sidebar-user">
                        <div className="sp__avatar">{initials}</div>
                        <div className="sp__sidebar-info">
                            <span className="sp__sidebar-name">
                                {user?.firstName} {user?.lastName}
                            </span>
                            <span className="sp__sidebar-handle">
                                @{user?.username}
                            </span>
                        </div>
                    </div>

                    <nav className="sp__nav">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                className={`sp__nav-item ${activeSection === item.id ? 'sp__nav-item--active' : ''}`}
                                onClick={() => setActiveSection(item.id)}
                            >
                                <div className="sp__nav-item-text">
                                    <span className="sp__nav-label">
                                        {item.label}
                                    </span>
                                    <span className="sp__nav-sub">
                                        {item.sub}
                                    </span>
                                </div>
                                <span className="sp__nav-chevron">›</span>
                            </button>
                        ))}
                    </nav>

                    <button className="sp__signout" onClick={logout}>
                        Sign out
                    </button>
                </aside>

                {/* ── Content ── */}
                <main className="sp__main">
                    {/* ── Profile ── */}
                    {activeSection === 'profile' && (
                        <div className="sp__section">
                            <div className="sp__section-head">
                                <h1 className="sp__title">Profile</h1>
                                <p className="sp__subtitle">
                                    Update your name, username, and bio.
                                </p>
                            </div>

                            <div className="sp__card">
                                <div className="sp__form-row">
                                    <div className="sp__field">
                                        <label className="sp__label">
                                            First name
                                        </label>
                                        <input
                                            className="sp__input"
                                            value={profileForm.firstName ?? ''}
                                            onChange={(e) =>
                                                setProfileForm((f) => ({
                                                    ...f,
                                                    firstName: e.target.value,
                                                }))
                                            }
                                            autoFocus
                                        />
                                    </div>
                                    <div className="sp__field">
                                        <label className="sp__label">
                                            Last name
                                        </label>
                                        <input
                                            className="sp__input"
                                            value={profileForm.lastName ?? ''}
                                            onChange={(e) =>
                                                setProfileForm((f) => ({
                                                    ...f,
                                                    lastName: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="sp__field">
                                    <label className="sp__label">
                                        Username
                                    </label>
                                    <div className="sp__prefix-wrap">
                                        <span className="sp__prefix">@</span>
                                        <input
                                            className="sp__input sp__input--prefixed"
                                            value={profileForm.username ?? ''}
                                            onChange={(e) =>
                                                setProfileForm((f) => ({
                                                    ...f,
                                                    username: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="sp__field">
                                    <label className="sp__label">Bio</label>
                                    <textarea
                                        className="sp__input sp__textarea"
                                        value={profileForm.aboutMe ?? ''}
                                        onChange={(e) =>
                                            setProfileForm((f) => ({
                                                ...f,
                                                aboutMe: e.target.value,
                                            }))
                                        }
                                        placeholder="Tell people a bit about yourself…"
                                        rows={4}
                                    />
                                </div>

                                {profileError && (
                                    <p className="sp__error">{profileError}</p>
                                )}
                                <div className="sp__card-footer">
                                    {profileState === 'success' && (
                                        <span className="sp__success">
                                            ✓ Saved
                                        </span>
                                    )}
                                    <button
                                        className="sp__save-btn"
                                        onClick={handleSaveProfile}
                                        disabled={profileState === 'saving'}
                                    >
                                        {profileState === 'saving'
                                            ? 'Saving…'
                                            : 'Save changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Email ── */}
                    {activeSection === 'email' && (
                        <div className="sp__section">
                            <div className="sp__section-head">
                                <h1 className="sp__title">Email address</h1>
                                <p className="sp__subtitle">
                                    Your current email is{' '}
                                    <strong>{user?.email}</strong>.
                                </p>
                            </div>

                            <div className="sp__card">
                                <div className="sp__field">
                                    <label className="sp__label">
                                        New email
                                    </label>
                                    <input
                                        className="sp__input"
                                        type="email"
                                        value={emailForm.newEmail}
                                        onChange={(e) =>
                                            setEmailForm((f) => ({
                                                ...f,
                                                newEmail: e.target.value,
                                            }))
                                        }
                                        placeholder="new@example.com"
                                        autoFocus
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="sp__field">
                                    <label className="sp__label">
                                        Confirm new email
                                    </label>
                                    <input
                                        className={`sp__input ${
                                            emailForm.confirmEmail &&
                                            emailForm.newEmail !==
                                                emailForm.confirmEmail
                                                ? 'sp__input--mismatch'
                                                : ''
                                        }`}
                                        type="email"
                                        value={emailForm.confirmEmail}
                                        onChange={(e) =>
                                            setEmailForm((f) => ({
                                                ...f,
                                                confirmEmail: e.target.value,
                                            }))
                                        }
                                        placeholder="Repeat new email"
                                        autoComplete="email"
                                    />
                                    {emailForm.confirmEmail &&
                                        emailForm.newEmail !==
                                            emailForm.confirmEmail && (
                                            <span className="sp__field-error">
                                                Emails don't match
                                            </span>
                                        )}
                                </div>

                                {emailError && (
                                    <p className="sp__error">{emailError}</p>
                                )}
                                <div className="sp__card-footer">
                                    {emailState === 'success' && (
                                        <span className="sp__success">
                                            ✓ Email updated
                                        </span>
                                    )}
                                    <button
                                        className="sp__save-btn"
                                        onClick={handleSaveEmail}
                                        disabled={emailState === 'saving'}
                                    >
                                        {emailState === 'saving'
                                            ? 'Updating…'
                                            : 'Update email'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Password ── */}
                    {activeSection === 'password' && (
                        <div className="sp__section">
                            <div className="sp__section-head">
                                <h1 className="sp__title">Password</h1>
                                <p className="sp__subtitle">
                                    Choose a strong password of at least 6
                                    characters.
                                </p>
                            </div>

                            <div className="sp__card">
                                <div className="sp__field">
                                    <label className="sp__label">
                                        Current password
                                    </label>
                                    <input
                                        className="sp__input"
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) =>
                                            setPasswordForm((f) => ({
                                                ...f,
                                                currentPassword: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter current password"
                                        autoFocus
                                        autoComplete="current-password"
                                    />
                                </div>

                                <div className="sp__rule" />

                                <div className="sp__field">
                                    <label className="sp__label">
                                        New password
                                    </label>
                                    <input
                                        className="sp__input"
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            setPasswordForm((f) => ({
                                                ...f,
                                                newPassword: e.target.value,
                                            }))
                                        }
                                        placeholder="At least 6 characters"
                                        autoComplete="new-password"
                                    />
                                    {/* Strength bar */}
                                    {passwordForm.newPassword && (
                                        <div className="sp__strength">
                                            {[1, 2, 3, 4].map((n) => (
                                                <div
                                                    key={n}
                                                    className={`sp__strength-bar ${
                                                        passwordForm.newPassword
                                                            .length >=
                                                        n * 3
                                                            ? passwordForm
                                                                  .newPassword
                                                                  .length >= 12
                                                                ? 'sp__strength-bar--strong'
                                                                : 'sp__strength-bar--ok'
                                                            : ''
                                                    }`}
                                                />
                                            ))}
                                            <span className="sp__strength-label">
                                                {passwordForm.newPassword
                                                    .length < 6
                                                    ? 'Too short'
                                                    : passwordForm.newPassword
                                                            .length < 9
                                                      ? 'Weak'
                                                      : passwordForm.newPassword
                                                              .length < 12
                                                        ? 'Good'
                                                        : 'Strong'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="sp__field">
                                    <label className="sp__label">
                                        Confirm new password
                                    </label>
                                    <input
                                        className={`sp__input ${
                                            passwordForm.confirmPassword &&
                                            passwordForm.newPassword !==
                                                passwordForm.confirmPassword
                                                ? 'sp__input--mismatch'
                                                : ''
                                        }`}
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordForm((f) => ({
                                                ...f,
                                                confirmPassword: e.target.value,
                                            }))
                                        }
                                        placeholder="Repeat new password"
                                        autoComplete="new-password"
                                    />
                                    {passwordForm.confirmPassword &&
                                        passwordForm.newPassword !==
                                            passwordForm.confirmPassword && (
                                            <span className="sp__field-error">
                                                Passwords don't match
                                            </span>
                                        )}
                                </div>

                                {passwordError && (
                                    <p className="sp__error">{passwordError}</p>
                                )}
                                <div className="sp__card-footer">
                                    {passwordState === 'success' && (
                                        <span className="sp__success">
                                            ✓ Password updated
                                        </span>
                                    )}
                                    <button
                                        className="sp__save-btn"
                                        onClick={handleChangePassword}
                                        disabled={passwordState === 'saving'}
                                    >
                                        {passwordState === 'saving'
                                            ? 'Updating…'
                                            : 'Update password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default SettingsPage

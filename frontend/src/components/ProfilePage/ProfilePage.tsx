import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import {
    getProfile,
    updateUser,
    follow,
    unfollow,
} from '../../services/flashly';
import type {
    GetProfileResponse,
    UpdateUserRequest,
} from '../../services/flashly';

import DeckCard from '../DeckCard';
import './ProfilePage.css';

type Tab = 'decks' | 'about';

const ProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: authUser, token } = useAuth();

    const [profile, setProfile] = useState<GetProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [tab, setTab] = useState<Tab>('decks');

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<UpdateUserRequest>({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Follow
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const isOwnProfile = authUser?.id === userId;

    useEffect(() => {
        if (!userId) return;

        const fetchProfile = async () => {
            setLoading(true);
            const result = await getProfile(userId);
            if ('error' in result) {
                setError(result.error);
            } else {
                setProfile(result);
                setEditForm({
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    username: result.user.username,
                    email: result.user.email,
                    aboutMe: result.userDetails.aboutMe,
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, [userId]);

    const openEdit = () => {
        setSaveError(null);
        setEditing(true);
    };

    const handleSave = async () => {
        if (!userId || !token) return;
        setSaving(true);
        setSaveError(null);
        const result = await updateUser(userId, token, editForm);
        if ('error' in result) {
            setSaveError(result.error);
        } else {
            setProfile((prev) =>
                prev
                    ? {
                          ...prev,
                          user: { ...prev.user, ...result.user },
                          userDetails: {
                              aboutMe:
                                  editForm.aboutMe ?? prev.userDetails.aboutMe,
                          },
                      }
                    : prev,
            );
            setEditing(false);
        }
        setSaving(false);
    };

    const handleFollow = async () => {
        if (!token || !userId) return;
        setFollowLoading(true);
        const result = following
            ? await unfollow(userId, token)
            : await follow(userId, token);
        if (!('error' in result)) {
            setFollowing((f) => !f);
            setProfile((prev) =>
                prev
                    ? {
                          ...prev,
                          statistics: {
                              ...prev.statistics,
                              followersCount:
                                  prev.statistics.followersCount +
                                  (following ? -1 : 1),
                          },
                      }
                    : prev,
            );
        }
        setFollowLoading(false);
    };

    if (loading) {
        return (
            <div className="pp__loading">
                <div className="pp__spinner" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="pp__loading">
                <p className="pp__error-text">⚠ {error ?? 'User not found'}</p>
                <Link to="/explore" className="pp__text-link">
                    ← Explore
                </Link>
            </div>
        );
    }

    const { user, userDetails, decks, statistics } = profile;
    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    const publicDecks = decks.filter(
        (d) => d.publishStatus === 'public' || isOwnProfile,
    );

    return (
        <div className="pp">
            {/* ── Hero banner ── */}
            <div className="pp__banner">
                <div className="pp__banner-pattern" aria-hidden="true" />
                <div className="pp__banner-content">
                    <div className="pp__avatar">{initials}</div>
                    <div className="pp__identity">
                        <h1 className="pp__name">
                            {user.firstName} {user.lastName}
                        </h1>
                        <span className="pp__username">@{user.username}</span>
                    </div>
                    <div className="pp__header-actions">
                        {isOwnProfile ? (
                            <button className="pp__edit-btn" onClick={openEdit}>
                                Edit profile
                            </button>
                        ) : (
                            <button
                                className={`pp__follow-btn ${following ? 'pp__follow-btn--following' : ''}`}
                                onClick={handleFollow}
                                disabled={followLoading}
                            >
                                {followLoading
                                    ? '…'
                                    : following
                                      ? 'Following'
                                      : 'Follow'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats bar ── */}
            <div className="pp__stats-bar">
                <div className="pp__stat">
                    <span className="pp__stat-value">
                        {statistics.decksCount}
                    </span>
                    <span className="pp__stat-label">Decks</span>
                </div>
                <div className="pp__stat-divider" />
                <div className="pp__stat">
                    <span className="pp__stat-value">
                        {statistics.followersCount}
                    </span>
                    <span className="pp__stat-label">Followers</span>
                </div>
                <div className="pp__stat-divider" />
                <div className="pp__stat">
                    <span className="pp__stat-value">
                        {statistics.followingCount}
                    </span>
                    <span className="pp__stat-label">Following</span>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="pp__tabs">
                <button
                    className={`pp__tab ${tab === 'decks' ? 'pp__tab--active' : ''}`}
                    onClick={() => setTab('decks')}
                >
                    Decks
                </button>
                <button
                    className={`pp__tab ${tab === 'about' ? 'pp__tab--active' : ''}`}
                    onClick={() => setTab('about')}
                >
                    About
                </button>
            </div>

            {/* ── Tab content ── */}
            <div className="pp__body">
                {tab === 'decks' && (
                    <div className="pp__decks">
                        {publicDecks.length === 0 ? (
                            <div className="pp__empty">
                                <p className="pp__empty-title">No decks yet</p>
                                <p className="pp__empty-sub">
                                    {isOwnProfile
                                        ? 'Create your first deck to get started.'
                                        : "This user hasn't shared any decks."}
                                </p>
                                {isOwnProfile && (
                                    <Link
                                        to="/decks"
                                        className="pp__primary-btn"
                                    >
                                        Go to My Decks
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="pp__deck-grid">
                                {publicDecks.map((deck, i) => (
                                    <div
                                        key={deck.id}
                                        style={{
                                            animationDelay: `${i * 0.04}s`,
                                        }}
                                    >
                                        <DeckCard deck={deck} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'about' && (
                    <div className="pp__about">
                        <div className="pp__about-card">
                            <h3 className="pp__about-heading">About</h3>
                            <p className="pp__about-text">
                                {userDetails.aboutMe || (
                                    <span className="pp__about-empty">
                                        {isOwnProfile
                                            ? 'Add a bio in Edit profile.'
                                            : 'No bio yet.'}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="pp__about-card">
                            <h3 className="pp__about-heading">Details</h3>
                            <div className="pp__details">
                                <div className="pp__detail-row">
                                    <span className="pp__detail-key">
                                        Email
                                    </span>
                                    <span className="pp__detail-val">
                                        {user.email}
                                    </span>
                                </div>
                                <div className="pp__detail-row">
                                    <span className="pp__detail-key">
                                        Member since
                                    </span>
                                    <span className="pp__detail-val">
                                        {new Date(
                                            user.createdAt,
                                        ).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Edit profile modal ── */}
            {editing && (
                <div className="pp__overlay" onClick={() => setEditing(false)}>
                    <div
                        className="pp__modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="pp__modal-header">
                            <h2 className="pp__modal-title">Edit profile</h2>
                            <button
                                className="pp__modal-close"
                                onClick={() => setEditing(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="pp__modal-body">
                            <div className="pp__form-row">
                                <div className="pp__field">
                                    <label className="pp__label">
                                        First name
                                    </label>
                                    <input
                                        className="pp__input"
                                        value={editForm.firstName ?? ''}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                firstName: e.target.value,
                                            }))
                                        }
                                        placeholder="First name"
                                    />
                                </div>
                                <div className="pp__field">
                                    <label className="pp__label">
                                        Last name
                                    </label>
                                    <input
                                        className="pp__input"
                                        value={editForm.lastName ?? ''}
                                        onChange={(e) =>
                                            setEditForm((f) => ({
                                                ...f,
                                                lastName: e.target.value,
                                            }))
                                        }
                                        placeholder="Last name"
                                    />
                                </div>
                            </div>
                            <div className="pp__field">
                                <label className="pp__label">Username</label>
                                <input
                                    className="pp__input"
                                    value={editForm.username ?? ''}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            username: e.target.value,
                                        }))
                                    }
                                    placeholder="Username"
                                />
                            </div>
                            <div className="pp__field">
                                <label className="pp__label">Email</label>
                                <input
                                    className="pp__input"
                                    type="email"
                                    value={editForm.email ?? ''}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="Email"
                                />
                            </div>
                            <div className="pp__field">
                                <label className="pp__label">Bio</label>
                                <textarea
                                    className="pp__input pp__textarea"
                                    value={editForm.aboutMe ?? ''}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            aboutMe: e.target.value,
                                        }))
                                    }
                                    placeholder="Tell people a bit about yourself…"
                                    rows={4}
                                />
                            </div>
                            {saveError && (
                                <p className="pp__form-error">{saveError}</p>
                            )}
                        </div>

                        <div className="pp__modal-footer">
                            <button
                                className="pp__ghost-btn"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="pp__primary-btn"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import * as Flashly from '../../services/flashly';
import type { Deck, CreateDeckRequest } from '../../services/flashly';
import { useAuth } from '..//../providers/AuthProvider';
import DeckCard from '../DeckCard';

import './DecksPage.css';

const DecksPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<CreateDeckRequest>({
        name: '',
        description: '',
        publishStatus: 'private',
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!token) return;
            setLoading(true);

            const result = await Flashly.getDecks(token);
            if ('error' in result) {
                setError(result.error);
            } else {
                setDecks(result.decks);
            }

            setLoading(false);
        };

        load();
    }, [token]);

    const openModal = () => {
        setForm({ name: '', description: '', publishStatus: 'private' });
        setFormError(null);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const handleCreate = async () => {
        if (!token) return;

        if (!form.name.trim()) {
            setFormError('Deck name is required.');
            return;
        }
        setCreating(true);
        setFormError(null);
        const result = await Flashly.createDeck(token, form);
        setCreating(false);
        if ('error' in result) {
            setFormError(result.error);
        } else {
            closeModal();
            navigate(`/decks/${result.deck.id}/manage`);
        }
    };

    return (
        <div className="decks">
            <div className="decks__hero">
                <div className="decks__hero-text">
                    <h1 className="decks__title">My Decks</h1>
                    <p className="decks__subtitle">
                        {decks.length > 0
                            ? `${decks.length} ${decks.length === 1 ? 'deck' : 'decks'} created`
                            : 'All your flashcard decks in one place.'}
                    </p>
                </div>
                <button className="decks__new-btn" onClick={openModal}>
                    + New deck
                </button>
            </div>

            <div className="decks__body">
                {loading && (
                    <div className="decks__state">
                        <div className="decks__spinner" />
                        <p>Loading your decks…</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="decks__state decks__state--error">
                        <p>⚠ {error}</p>
                    </div>
                )}

                {!loading && !error && decks.length === 0 && (
                    <div className="decks__empty">
                        <div className="decks__empty-icon">▭</div>
                        <h2 className="decks__empty-title">No decks yet</h2>
                        <p className="decks__empty-sub">
                            Create your first deck and start adding flashcards.
                        </p>
                        <button
                            className="decks__empty-btn"
                            onClick={openModal}
                        >
                            Create a deck
                        </button>
                    </div>
                )}

                {!loading && !error && decks.length > 0 && (
                    <div className="decks__grid">
                        {decks.map((deck, i) => (
                            <div
                                key={deck.id}
                                className="decks__card-wrap"
                                style={{ animationDelay: `${i * 0.04}s` }}
                            >
                                <DeckCard deck={deck} />
                                <Link
                                    to={`/decks/${deck.id}/manage`}
                                    className="decks__manage-btn"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Manage
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create deck modal */}
            {showModal && (
                <div className="decks__overlay" onClick={closeModal}>
                    <div
                        className="decks__modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="decks__modal-header">
                            <h2 className="decks__modal-title">New deck</h2>
                            <button
                                className="decks__modal-close"
                                onClick={closeModal}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="decks__modal-body">
                            <div className="decks__field">
                                <label
                                    className="decks__label"
                                    htmlFor="deck-name"
                                >
                                    Name
                                </label>
                                <input
                                    className="decks__input"
                                    id="deck-name"
                                    type="text"
                                    placeholder="e.g. Spanish Vocabulary"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            name: e.target.value,
                                        }))
                                    }
                                    autoFocus
                                />
                            </div>

                            <div className="decks__field">
                                <label
                                    className="decks__label"
                                    htmlFor="deck-desc"
                                >
                                    Description
                                </label>
                                <textarea
                                    className="decks__input decks__textarea"
                                    id="deck-desc"
                                    placeholder="What is this deck about?"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                />
                            </div>

                            <div className="decks__field">
                                <label className="decks__label">
                                    Visibility
                                </label>
                                <div className="decks__toggle">
                                    <button
                                        className={`decks__toggle-btn ${form.publishStatus === 'private' ? 'decks__toggle-btn--active' : ''}`}
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                publishStatus: 'private',
                                            }))
                                        }
                                        type="button"
                                    >
                                        Private
                                    </button>
                                    <button
                                        className={`decks__toggle-btn ${form.publishStatus === 'public' ? 'decks__toggle-btn--active' : ''}`}
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                publishStatus: 'public',
                                            }))
                                        }
                                        type="button"
                                    >
                                        Public
                                    </button>
                                </div>
                            </div>

                            {formError && (
                                <p className="decks__form-error">{formError}</p>
                            )}
                        </div>

                        <div className="decks__modal-footer">
                            <button
                                className="decks__cancel-btn"
                                onClick={closeModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="decks__create-btn"
                                onClick={handleCreate}
                                disabled={creating}
                            >
                                {creating ? 'Creating…' : 'Create deck'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecksPage;

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../../providers/AuthProvider';
import * as Flashly from '../../services/flashly';
import type { Deck, Card, UpdateDeckRequest } from '../../services/flashly';

import './DeckManagerPage.css';

type CardModalMode = 'add' | 'edit';

type CardForm = {
    frontText: string;
    backText: string;
    difficulty: 'easy' | 'medium' | 'hard';
};

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const DeckManagerPage = () => {
    const { deckId } = useParams<{ deckId: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();

    // Deck
    const [deck, setDeck] = useState<Deck | null>(null);
    const [deckLoading, setDeckLoading] = useState(true);
    const [deckError, setDeckError] = useState<string | null>(null);

    const [deckEditing, setDeckEditing] = useState(false);
    const [deckForm, setDeckForm] = useState<UpdateDeckRequest>({});
    const [deckSaving, setDeckSaving] = useState(false);
    const [deckSaveError, setDeckSaveError] = useState<string | null>(null);

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Cards
    const [cards, setCards] = useState<Card[]>([]);
    const [cardsLoading, setCardsLoading] = useState(true);
    const [cardsError, setCardsError] = useState<string | null>(null);

    // Card modal
    const [cardModal, setCardModal] = useState(false);
    const [cardModalMode, setCardModalMode] = useState<CardModalMode>('add');
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [cardForm, setCardForm] = useState<CardForm>({
        frontText: '',
        backText: '',
        difficulty: 'easy',
    });
    const [cardSaving, setCardSaving] = useState(false);
    const [cardFormError, setCardFormError] = useState<string | null>(null);
    const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

    useEffect(() => {
        if (!deckId) return;

        Flashly.getDeck(deckId).then((result) => {
            if ('error' in result) {
                setDeckError(result.error);
            } else {
                setDeck(result.deck);
                setDeckForm({
                    name: result.deck.name,
                    description: result.deck.description,
                    publishStatus: result.deck.publishStatus,
                });
            }
            setDeckLoading(false);
        });
    }, [deckId]);

    useEffect(() => {
        if (!deckId || !token) return;

        Flashly.getCards(deckId, token).then((result) => {
            if ('error' in result) {
                setCardsError(result.error);
            } else {
                setCards(result.cards ?? []);
            }
            setCardsLoading(false);
        });
    }, [deckId, token]);

    // Deck actions
    const handleSaveDeck = async () => {
        if (!deckId || !token) return;
        setDeckSaving(true);
        setDeckSaveError(null);
        const result = await Flashly.updateDeck(deckId, token, deckForm);
        if ('error' in result) {
            setDeckSaveError(result.error);
        } else {
            setDeck(result.deck);
            setDeckEditing(false);
        }
        setDeckSaving(false);
    };

    const handleDeleteDeck = async () => {
        if (!deckId || !token) return;
        setDeleting(true);
        const result = await Flashly.deleteDeck(deckId, token);
        if ('error' in result) {
            setDeleting(false);
        } else {
            navigate('/decks');
        }
    };

    //  Card modal helpers
    const openAddCard = () => {
        setCardForm({ frontText: '', backText: '', difficulty: 'easy' });
        setCardFormError(null);
        setCardModalMode('add');
        setEditingCardId(null);
        setCardModal(true);
    };

    const openEditCard = (card: Card) => {
        setCardForm({
            frontText: card.frontText,
            backText: card.backText,
            difficulty: card.difficulty,
        });
        setCardFormError(null);
        setCardModalMode('edit');
        setEditingCardId(card.id);
        setCardModal(true);
    };

    const closeCardModal = () => {
        setCardModal(false);
        setEditingCardId(null);
        setCardFormError(null);
    };

    //  Card actions
    const handleSaveCard = async () => {
        if (!deckId || !token) return;
        if (!cardForm.frontText.trim() || !cardForm.backText.trim()) {
            setCardFormError('Both front and back are required.');
            return;
        }
        setCardSaving(true);
        setCardFormError(null);

        if (cardModalMode === 'add') {
            const result = await Flashly.createCard(deckId, token, cardForm);
            if ('error' in result) {
                setCardFormError(result.error);
            } else {
                setCards((prev) => [...prev, result.card]);
                closeCardModal();
            }
        } else if (editingCardId) {
            const result = await Flashly.updateCard(
                deckId,
                editingCardId,
                token,
                cardForm,
            );
            if ('error' in result) {
                setCardFormError(result.error);
            } else {
                setCards((prev) =>
                    prev.map((c) =>
                        c.id === result.card.id ? result.card : c,
                    ),
                );
                closeCardModal();
            }
        }
        setCardSaving(false);
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!deckId || !token) return;
        setDeletingCardId(cardId);

        const result = await Flashly.deleteCard(deckId, cardId, token);
        if (!('error' in result)) {
            setCards((prev) => prev.filter((c) => c.id !== cardId));
        }
        setDeletingCardId(null);
    };

    if (deckLoading) {
        return (
            <div className="dm__loading">
                <div className="dm__spinner" />
            </div>
        );
    }

    if (deckError || !deck) {
        return (
            <div className="dm__loading">
                <p className="dm__error-text">
                    ⚠ {deckError ?? 'Deck not found'}
                </p>
                <Link to="/decks" className="dm__back-link">
                    ← Back to decks
                </Link>
            </div>
        );
    }

    return (
        <div className="dm">
            {/* Top bar  */}
            <div className="dm__topbar">
                <Link to="/decks" className="dm__back-link">
                    ← My Decks
                </Link>
                <div className="dm__topbar-actions">
                    <Link to={`/decks/${deckId}`} className="dm__preview-link">
                        Preview →
                    </Link>
                    <button
                        className="dm__danger-btn"
                        onClick={() => setConfirmDelete(true)}
                    >
                        Delete deck
                    </button>
                </div>
            </div>

            <div className="dm__body">
                {/*  Deck info */}
                <section className="dm__section">
                    <div className="dm__section-head">
                        <h2 className="dm__section-title">Deck info</h2>
                        {!deckEditing && (
                            <button
                                className="dm__ghost-btn"
                                onClick={() => setDeckEditing(true)}
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {deckEditing ? (
                        <div className="dm__form">
                            <div className="dm__field">
                                <label className="dm__label">Name</label>
                                <input
                                    className="dm__input"
                                    value={deckForm.name ?? ''}
                                    onChange={(e) =>
                                        setDeckForm((f) => ({
                                            ...f,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Deck name"
                                    autoFocus
                                />
                            </div>
                            <div className="dm__field">
                                <label className="dm__label">Description</label>
                                <textarea
                                    className="dm__input dm__textarea"
                                    value={deckForm.description ?? ''}
                                    onChange={(e) =>
                                        setDeckForm((f) => ({
                                            ...f,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="What is this deck about?"
                                    rows={3}
                                />
                            </div>
                            <div className="dm__field">
                                <label className="dm__label">Visibility</label>
                                <div className="dm__toggle">
                                    {(['private', 'public'] as const).map(
                                        (s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                className={`dm__toggle-btn ${deckForm.publishStatus === s ? 'dm__toggle-btn--on' : ''}`}
                                                onClick={() =>
                                                    setDeckForm((f) => ({
                                                        ...f,
                                                        publishStatus: s,
                                                    }))
                                                }
                                            >
                                                {s.charAt(0).toUpperCase() +
                                                    s.slice(1)}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                            {deckSaveError && (
                                <p className="dm__form-error">
                                    {deckSaveError}
                                </p>
                            )}
                            <div className="dm__form-actions">
                                <button
                                    className="dm__ghost-btn"
                                    onClick={() => setDeckEditing(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="dm__primary-btn"
                                    onClick={handleSaveDeck}
                                    disabled={deckSaving}
                                >
                                    {deckSaving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="dm__deck-display">
                            <h1 className="dm__deck-name">{deck.name}</h1>
                            {deck.description && (
                                <p className="dm__deck-desc">
                                    {deck.description}
                                </p>
                            )}
                            <span
                                className={`dm__badge dm__badge--${deck.publishStatus}`}
                            >
                                {deck.publishStatus}
                            </span>
                        </div>
                    )}
                </section>

                {/*  Cards  */}
                <section className="dm__section">
                    <div className="dm__section-head">
                        <h2 className="dm__section-title">
                            Cards
                            <span className="dm__count-pill">
                                {cards.length}
                            </span>
                        </h2>
                        <button
                            className="dm__primary-btn"
                            onClick={openAddCard}
                        >
                            + Add card
                        </button>
                    </div>

                    {cardsLoading && (
                        <div className="dm__cards-loading">
                            <div className="dm__spinner" />
                        </div>
                    )}

                    {!cardsLoading && cardsError && (
                        <p className="dm__form-error">{cardsError}</p>
                    )}

                    {!cardsLoading && !cardsError && cards.length === 0 && (
                        <div className="dm__empty-cards">
                            <p className="dm__empty-title">No cards yet</p>
                            <p className="dm__empty-sub">
                                Hit "Add card" to build your deck.
                            </p>
                        </div>
                    )}

                    {!cardsLoading && cards.length > 0 && (
                        <ul className="dm__card-list">
                            {cards.map((card, i) => (
                                <li
                                    key={card.id}
                                    className="dm__card-row"
                                    style={{ animationDelay: `${i * 0.035}s` }}
                                >
                                    <div className="dm__card-sides">
                                        <div className="dm__card-side">
                                            <span className="dm__side-label">
                                                Front
                                            </span>
                                            <p className="dm__side-text">
                                                {card.frontText}
                                            </p>
                                        </div>
                                        <div className="dm__card-divider" />
                                        <div className="dm__card-side">
                                            <span className="dm__side-label">
                                                Back
                                            </span>
                                            <p className="dm__side-text">
                                                {card.backText}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="dm__card-footer">
                                        <span
                                            className={`dm__diff dm__diff--${card.difficulty}`}
                                        >
                                            {card.difficulty}
                                        </span>
                                        <div className="dm__card-btns">
                                            <button
                                                className="dm__card-btn"
                                                onClick={() =>
                                                    openEditCard(card)
                                                }
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="dm__card-btn dm__card-btn--danger"
                                                onClick={() =>
                                                    handleDeleteCard(card.id)
                                                }
                                                disabled={
                                                    deletingCardId === card.id
                                                }
                                            >
                                                {deletingCardId === card.id
                                                    ? '…'
                                                    : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {/*  Card modal  */}
            {cardModal && (
                <div className="dm__overlay" onClick={closeCardModal}>
                    <div
                        className="dm__modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dm__modal-header">
                            <h2 className="dm__modal-title">
                                {cardModalMode === 'add'
                                    ? 'Add card'
                                    : 'Edit card'}
                            </h2>
                            <button
                                className="dm__modal-close"
                                onClick={closeCardModal}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="dm__modal-body">
                            <div className="dm__field">
                                <label className="dm__label">Front</label>
                                <textarea
                                    className="dm__input dm__textarea"
                                    placeholder="Question or term…"
                                    value={cardForm.frontText}
                                    onChange={(e) =>
                                        setCardForm((f) => ({
                                            ...f,
                                            frontText: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    autoFocus
                                />
                            </div>
                            <div className="dm__field">
                                <label className="dm__label">Back</label>
                                <textarea
                                    className="dm__input dm__textarea"
                                    placeholder="Answer or definition…"
                                    value={cardForm.backText}
                                    onChange={(e) =>
                                        setCardForm((f) => ({
                                            ...f,
                                            backText: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                />
                            </div>
                            <div className="dm__field">
                                <label className="dm__label">Difficulty</label>
                                <div className="dm__toggle">
                                    {DIFFICULTIES.map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            className={`dm__toggle-btn ${cardForm.difficulty === d ? 'dm__toggle-btn--on' : ''}`}
                                            onClick={() =>
                                                setCardForm((f) => ({
                                                    ...f,
                                                    difficulty: d,
                                                }))
                                            }
                                        >
                                            {d.charAt(0).toUpperCase() +
                                                d.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {cardFormError && (
                                <p className="dm__form-error">
                                    {cardFormError}
                                </p>
                            )}
                        </div>

                        <div className="dm__modal-footer">
                            <button
                                className="dm__ghost-btn"
                                onClick={closeCardModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="dm__primary-btn"
                                onClick={handleSaveCard}
                                disabled={cardSaving}
                            >
                                {cardSaving
                                    ? 'Saving…'
                                    : cardModalMode === 'add'
                                      ? 'Add card'
                                      : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*  Delete deck confirm  */}
            {confirmDelete && (
                <div
                    className="dm__overlay"
                    onClick={() => setConfirmDelete(false)}
                >
                    <div
                        className="dm__modal dm__modal--sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dm__modal-header">
                            <h2 className="dm__modal-title">Delete deck?</h2>
                            <button
                                className="dm__modal-close"
                                onClick={() => setConfirmDelete(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="dm__modal-body">
                            <p className="dm__modal-warn">
                                <strong>{deck.name}</strong> and all its cards
                                will be permanently deleted. This cannot be
                                undone.
                            </p>
                        </div>
                        <div className="dm__modal-footer">
                            <button
                                className="dm__ghost-btn"
                                onClick={() => setConfirmDelete(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="dm__danger-btn"
                                onClick={handleDeleteDeck}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting…' : 'Yes, delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeckManagerPage;

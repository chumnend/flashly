import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

import { getDeck, getCards } from '../../services/flashly';
import type { Deck, Card } from '../../services/flashly';
import { useAuth } from '../../hooks/useAuth';
import './DeckPage.css';

type StudyState = 'idle' | 'studying' | 'complete';

const DeckPage = () => {
    const { deckId } = useParams<{ deckId: string }>();
    const { token, user } = useAuth();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Study state
    const [studyState, setStudyState] = useState<StudyState>('idle');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [shuffled, setShuffled] = useState<Card[]>([]);

    const isOwner = user && deck && (deck as Deck).ownerId === user.id;

    useEffect(() => {
        if (!deckId) return;
        const load = async () => {
            const [deckResult, cardsResult] = await Promise.all([
                getDeck(deckId),
                getCards(deckId, token ?? undefined),
            ]);
            if ('error' in deckResult) {
                setError(deckResult.error);
            } else {
                setDeck(deckResult.deck);
            }
            if (!('error' in cardsResult)) {
                setCards(cardsResult.cards ?? []);
            }
            setLoading(false);
        };
        load();
    }, [deckId, token]);

    const startStudy = useCallback(() => {
        const s = [...cards].sort(() => Math.random() - 0.5);
        setShuffled(s);
        setCurrentIndex(0);
        setFlipped(false);
        setStudyState('studying');
    }, [cards]);

    const handleNext = () => {
        if (currentIndex + 1 >= shuffled.length) {
            setStudyState('complete');
        } else {
            setFlipped(false);
            setTimeout(() => setCurrentIndex((i) => i + 1), 120);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setFlipped(false);
            setTimeout(() => setCurrentIndex((i) => i - 1), 120);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (studyState !== 'studying') return;
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setFlipped((f) => !f);
            }
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [studyState, currentIndex, shuffled.length]);

    if (loading) {
        return (
            <div className="dp__loading">
                <div className="dp__spinner" />
            </div>
        );
    }

    if (error || !deck) {
        return (
            <div className="dp__loading">
                <p className="dp__error-text">⚠ {error ?? 'Deck not found'}</p>
                <Link to="/explore" className="dp__text-link">
                    ← Back to explore
                </Link>
            </div>
        );
    }

    const currentCard = shuffled[currentIndex];
    const progress =
        shuffled.length > 0 ? ((currentIndex + 1) / shuffled.length) * 100 : 0;

    // ── Study mode ────────────────────────────────────────
    if (studyState === 'studying' && currentCard) {
        return (
            <div className="dp dp--study">
                <div className="dp__study-header">
                    <button
                        className="dp__text-link"
                        onClick={() => setStudyState('idle')}
                    >
                        ← Exit
                    </button>
                    <span className="dp__study-counter">
                        {currentIndex + 1} / {shuffled.length}
                    </span>
                    <div className="dp__diff-badge dp__diff-badge--sm">
                        <span
                            className={`dp__diff dp__diff--${currentCard.difficulty}`}
                        >
                            {currentCard.difficulty}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="dp__progress-track">
                    <div
                        className="dp__progress-bar"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Flip card */}
                <div
                    className="dp__card-scene"
                    onClick={() => setFlipped((f) => !f)}
                >
                    <div
                        className={`dp__card-3d ${flipped ? 'dp__card-3d--flipped' : ''}`}
                    >
                        <div className="dp__card-face dp__card-face--front">
                            <span className="dp__face-label">Front</span>
                            <p className="dp__card-text">
                                {currentCard.frontText}
                            </p>
                            <span className="dp__flip-hint">click to flip</span>
                        </div>
                        <div className="dp__card-face dp__card-face--back">
                            <span className="dp__face-label">Back</span>
                            <p className="dp__card-text">
                                {currentCard.backText}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="dp__study-nav">
                    <button
                        className="dp__nav-btn"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                    >
                        ← Prev
                    </button>
                    <div className="dp__key-hints">
                        <span>Space to flip</span>
                        <span>← → to navigate</span>
                    </div>
                    <button
                        className="dp__nav-btn dp__nav-btn--next"
                        onClick={handleNext}
                    >
                        {currentIndex + 1 === shuffled.length
                            ? 'Finish'
                            : 'Next →'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Complete ──────────────────────────────────────────
    if (studyState === 'complete') {
        return (
            <div className="dp dp--complete">
                <div className="dp__complete-card">
                    <div className="dp__complete-icon">✦</div>
                    <h2 className="dp__complete-title">Session complete</h2>
                    <p className="dp__complete-sub">
                        You reviewed all {shuffled.length} cards.
                    </p>
                    <div className="dp__complete-actions">
                        <button
                            className="dp__primary-btn"
                            onClick={startStudy}
                        >
                            Study again
                        </button>
                        <button
                            className="dp__ghost-btn"
                            onClick={() => setStudyState('idle')}
                        >
                            Back to deck
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Idle / deck overview ───────────────────────────────
    return (
        <div className="dp">
            {/* Header */}
            <div className="dp__header">
                <Link to="/explore" className="dp__text-link">
                    ← Explore
                </Link>
                {isOwner && (
                    <Link
                        to={`/decks/${deckId}/manage`}
                        className="dp__manage-link"
                    >
                        Manage deck →
                    </Link>
                )}
            </div>

            <div className="dp__body">
                {/* Deck hero */}
                <div className="dp__hero">
                    <div className="dp__hero-meta">
                        <span
                            className={`dp__badge dp__badge--${deck.publishStatus}`}
                        >
                            {deck.publishStatus}
                        </span>
                        {deck.categories && deck.categories.length > 0 && (
                            <div className="dp__tags">
                                {deck.categories.map((c) => (
                                    <span key={c.id} className="dp__tag">
                                        {c.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <h1 className="dp__title">{deck.name}</h1>
                    {deck.description && (
                        <p className="dp__desc">{deck.description}</p>
                    )}

                    <div className="dp__stats">
                        <div className="dp__stat">
                            <span className="dp__stat-value">
                                {cards.length}
                            </span>
                            <span className="dp__stat-label">cards</span>
                        </div>
                        {deck.rating > 0 && (
                            <div className="dp__stat">
                                <span className="dp__stat-value">
                                    {deck.rating.toFixed(1)}
                                </span>
                                <span className="dp__stat-label">rating</span>
                            </div>
                        )}
                        <div className="dp__stat">
                            <span className="dp__stat-value">
                                {
                                    cards.filter((c) => c.difficulty === 'easy')
                                        .length
                                }
                            </span>
                            <span className="dp__stat-label">easy</span>
                        </div>
                        <div className="dp__stat">
                            <span className="dp__stat-value">
                                {
                                    cards.filter(
                                        (c) => c.difficulty === 'medium',
                                    ).length
                                }
                            </span>
                            <span className="dp__stat-label">medium</span>
                        </div>
                        <div className="dp__stat">
                            <span className="dp__stat-value">
                                {
                                    cards.filter((c) => c.difficulty === 'hard')
                                        .length
                                }
                            </span>
                            <span className="dp__stat-label">hard</span>
                        </div>
                    </div>

                    {cards.length > 0 && (
                        <button className="dp__start-btn" onClick={startStudy}>
                            Start studying
                        </button>
                    )}
                </div>

                {/* Card preview list */}
                {cards.length > 0 && (
                    <div className="dp__card-list">
                        <h2 className="dp__list-title">All cards</h2>
                        <ul className="dp__list">
                            {cards.map((card, i) => (
                                <li
                                    key={card.id}
                                    className="dp__list-row"
                                    style={{ animationDelay: `${i * 0.03}s` }}
                                >
                                    <div className="dp__list-sides">
                                        <div className="dp__list-side">
                                            <span className="dp__side-label">
                                                Front
                                            </span>
                                            <p className="dp__side-text">
                                                {card.frontText}
                                            </p>
                                        </div>
                                        <div className="dp__list-divider" />
                                        <div className="dp__list-side">
                                            <span className="dp__side-label">
                                                Back
                                            </span>
                                            <p className="dp__side-text">
                                                {card.backText}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`dp__diff dp__diff--${card.difficulty}`}
                                    >
                                        {card.difficulty}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {cards.length === 0 && (
                    <div className="dp__empty">
                        <p className="dp__empty-title">
                            No cards in this deck yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeckPage;

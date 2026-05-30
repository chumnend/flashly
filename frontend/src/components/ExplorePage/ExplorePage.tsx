import { useEffect, useState } from 'react';

import * as Flashly from '../../services/flashly';
import { type Deck } from '../../services/flashly';
import DeckCard from '../DeckCard';

import './ExplorePage.css';

const ExplorePage = () => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            const result = await Flashly.exploreDecks();
            if ('error' in result) {
                setError(result.error);
            } else {
                setDecks(result.decks);
            }

            setLoading(false);
        };

        load();
    }, []);

    const filtered = decks.filter(
        (deck) =>
            deck.name.toLowerCase().includes(search.toLowerCase()) ||
            deck.description?.toLowerCase().includes(search.toLowerCase()) ||
            (deck.categories ?? []).some((c) =>
                c.name.toLowerCase().includes(search.toLowerCase()),
            ),
    );

    return (
        <div className="explore">
            <div className="explore__hero">
                <h1 className="explore__title">Explore decks</h1>
                <p className="explore__subtitle">
                    Browse flashcard decks shared by the community.
                </p>
                <div className="explore__search-wrap">
                    <span className="explore__search-icon">⌕</span>
                    <input
                        className="explore__search"
                        type="text"
                        placeholder="Search by name, description or category…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            className="explore__search-clear"
                            onClick={() => setSearch('')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="explore__body">
                {loading && (
                    <div className="explore__state">
                        <div className="explore__spinner" />
                        <p>Loading decks…</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="explore__state explore__state--error">
                        <p>⚠ {error}</p>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="explore__state">
                        <p className="explore__empty-title">No decks found</p>
                        <p className="explore__empty-sub">
                            {search
                                ? `No results for "${search}"`
                                : 'No public decks yet — be the first to share one.'}
                        </p>
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <>
                        <p className="explore__count">
                            {filtered.length}{' '}
                            {filtered.length === 1 ? 'deck' : 'decks'}
                            {search && ` matching "${search}"`}
                        </p>
                        <div className="explore__grid">
                            {filtered.map((deck, i) => (
                                <div
                                    key={deck.id}
                                    style={{ animationDelay: `${i * 0.04}s` }}
                                >
                                    <DeckCard deck={deck} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ExplorePage;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import * as Flashly from '../../services/flashly';
import { type Deck } from '../../services/flashly';
import { useAuth } from '../../providers/AuthProvider';
import DeckCard from '../DeckCard';

import './FeedPage.css';

const FeedPage = () => {
  const { token } = useAuth();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!token) return;

            setLoading(true);

            const result = await Flashly.getFeed(token);
            if ('error' in result) {
                setError(result.error);
            } else {
                setDecks(result.decks);
            }

            setLoading(false);
        };

        load();
    }, [token]);

  return (
    <div className="feed">
        <div className="feed__hero">
            <div className="feed__hero-text">
                <h1 className="feed__title">Your feed</h1>
                <p className="feed__subtitle">
                    Decks from people you follow.
                </p>
            </div>
            <Link to="/explore" className="feed__explore-btn">
                Explore decks →
            </Link>
        </div>

        <div className="feed__body">
            {loading && (
                <div className="feed__state">
                    <div className="feed__spinner" />
                    <p>Loading your feed…</p>
                </div>
            )}

            {!loading && error && (
                <div className="feed__state feed__state--error">
                    <p>⚠ {error}</p>
                </div>
            )}

            {!loading && !error && decks.length === 0 && (
                <div className="feed__empty">
                    <div className="feed__empty-icon">◎</div>
                    <h2 className="feed__empty-title">Your feed is empty</h2>
                    <p className="feed__empty-sub">
                        Follow people to see their decks here. Start by exploring what's out there.
                    </p>
                    <Link to="/explore" className="feed__empty-btn">
                        Browse the explore page
                    </Link>
                </div>
            )}

            {!loading && !error && decks.length > 0 && (
                <>
                    <p className="feed__count">
                        {decks.length} {decks.length === 1 ? 'deck' : 'decks'} in your feed
                    </p>
                    <div className="feed__grid">
                        {decks.map((deck, i) => (
                        <div key={deck.id} style={{ animationDelay: `${i * 0.04}s` }}>
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

export default FeedPage;

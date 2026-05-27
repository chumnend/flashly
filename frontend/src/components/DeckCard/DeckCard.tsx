import { Link } from 'react-router-dom'

import type { Deck } from '../../services/flashly'
import './DeckCard.css'

interface DeckCardProps {
    deck: Deck
}

const DeckCard = ({ deck }: DeckCardProps) => {
    const stars = Math.round(deck.rating)

    return (
        <Link to={`/decks/${deck.id}`} className="deck-card">
            <div className="deck-card__header">
                <h3 className="deck-card__name">{deck.name}</h3>
                {deck.rating > 0 && (
                    <div className="deck-card__rating">
                        {'★'.repeat(stars)}
                        {'☆'.repeat(5 - stars)}
                    </div>
                )}
            </div>

            {deck.description && (
                <p className="deck-card__desc">{deck.description}</p>
            )}

            <div className="deck-card__footer">
                <span className="deck-card__stat">{deck.cardsCount} cards</span>
                {(deck.categories ?? []).length > 0 && (
                    <div className="deck-card__tags">
                        {(deck.categories ?? []).slice(0, 3).map((cat) => (
                            <span key={cat.id} className="deck-card__tag">
                                {cat.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    )
}

export default DeckCard

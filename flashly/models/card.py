from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class CardModel:
    __tablename__ = "cards"

    id: UUID
    front_text: str
    back_text: str
    difficulty: str
    times_reviewed: int
    success_rate: float
    deck_id: UUID
    created_at: datetime
    updated_at: datetime

    def save(self, db_conn):
        with db_conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO cards (id, front_text, back_text, difficulty, times_reviewed, success_rate, deck_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.id,
                    self.front_text,
                    self.back_text,
                    self.difficulty,
                    self.times_reviewed,
                    self.success_rate,
                    self.deck_id,
                ),
            )
            db_conn.commit()

    def update(self, db_conn):
        with db_conn.cursor() as cur:
            cur.execute(
                """
                UPDATE cards
                SET front_text = %s, back_text = %s, difficulty = %s, times_reviewed = %s, success_rate = %s, updated_at = %s
                WHERE id = %s
                """,
                (
                    self.front_text,
                    self.back_text,
                    self.difficulty,
                    self.times_reviewed,
                    self.success_rate,
                    self.updated_at,
                    self.id,
                ),
            )
            db_conn.commit()

    def delete(self, db_conn):
        with db_conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM cards WHERE id = %s
                """,
                (self.id,),
            )
            db_conn.commit()

    @classmethod
    def find_cards_by_deck_id(cls, db_conn, deck_id: str):
        try:
            with db_conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, front_text, back_text, difficulty, times_reviewed, success_rate, deck_id, created_at, updated_at
                    FROM cards
                    WHERE deck_id = %s
                    ORDER BY created_at ASC
                    """,
                    (deck_id,),
                )
                cards = cur.fetchall()
                return cards
        except Exception as e:
            print(f"Error in find_cards_by_deck_id: {e}")
            return None

    @classmethod
    def find_card_by_id(cls, db_conn, card_id: str):
        try:
            with db_conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, front_text, back_text, difficulty, times_reviewed, success_rate, deck_id, created_at, updated_at
                    FROM cards
                    WHERE id = %s
                    """,
                    (card_id,),
                )
                card = cur.fetchone()
                return card
        except Exception as e:
            print(f"Error in find_card_by_id: {e}")
            return None


def serialize_single_card_tuple(card_tuple):
    """
    Sérialise un tuple de données de carte en format JSON.
    """
    if len(card_tuple) == 9:
        # Format standard pour les cartes
        return {
            "id": str(card_tuple[0]),
            "frontText": card_tuple[1],
            "backText": card_tuple[2],
            "difficulty": card_tuple[3],
            "timesReviewed": int(card_tuple[4]),
            "successRate": float(card_tuple[5]),
            "deckId": str(card_tuple[6]),
            "createdAt": card_tuple[7].isoformat() if card_tuple[7] else None,
            "updatedAt": card_tuple[8].isoformat() if card_tuple[8] else None,
        }
    else:
        # Fallback pour des formats non reconnus
        return card_tuple


def serialize_card_data(card_data):
    """
    Sérialise les données de carte(s) en format JSON avec les champs comme clés.
    Peut accepter une seule carte ou une liste de cartes.
    """
    if isinstance(card_data, CardModel):
        # Si c'est une instance de CardModel
        return {
            "id": str(card_data.id),
            "frontText": card_data.front_text,
            "backText": card_data.back_text,
            "difficulty": card_data.difficulty,
            "timesReviewed": card_data.times_reviewed,
            "successRate": card_data.success_rate,
            "deckId": str(card_data.deck_id),
            "createdAt": (card_data.created_at.isoformat() if card_data.created_at else None),
            "updatedAt": (card_data.updated_at.isoformat() if card_data.updated_at else None),
        }
    elif isinstance(card_data, (list, tuple)) and card_data:
        if isinstance(card_data[0], (list, tuple)):
            # Liste de tuples (résultats de requêtes SQL)
            return [serialize_single_card_tuple(card) for card in card_data]
        else:
            # Tuple unique (résultat d'une requête SQL)
            return serialize_single_card_tuple(card_data)
    else:
        return card_data

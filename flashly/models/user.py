from dataclasses import dataclass
from datetime import datetime
from typing import Any
from typing import Dict
from typing import Optional
from uuid import UUID

import bcrypt


@dataclass
class UserModel:
    __tablename__ = "users"

    id: UUID
    first_name: str
    last_name: str
    username: str
    email: str
    password_hash: str
    created_at: datetime
    updated_at: datetime

    def set_password(self, password: str):
        password_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password_bytes, salt)

        self.password_hash = hashed_password.decode("utf-8")

    def check_password(self, password: str) -> bool:
        if self.password_hash is not None:
            expected_hash = self.password_hash.encode("utf-8")
            return bcrypt.checkpw(password.encode("utf-8"), expected_hash)
        return False

    def save(self, db_conn):
        with db_conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (id, first_name, last_name, username, email, password_hash)
                   VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    self.id,
                    self.first_name,
                    self.last_name,
                    self.username,
                    self.email,
                    self.password_hash,
                ),
            )
            db_conn.commit()

    @classmethod
    def find_by_email(cls, db_conn, email: str) -> Optional["UserModel"]:
        with db_conn.cursor() as cur:
            cur.execute(
                "SELECT id, first_name, last_name, username, email, password_hash, created_at, updated_at FROM users WHERE email = %s",
                (email,),
            )
            record = cur.fetchone()
            if record:
                return cls(
                    id=UUID(record[0]),
                    first_name=record[1],
                    last_name=record[2],
                    username=record[3],
                    email=record[4],
                    password_hash=record[5],
                    created_at=record[6],
                    updated_at=record[7],
                )
        return None

    @classmethod
    def find_by_username(cls, db_conn, username: str):
        with db_conn.cursor() as cur:
            cur.execute(
                "SELECT id, first_name, last_name, username, email, password_hash, created_at, updated_at FROM users WHERE username = %s",
                (username,),
            )
            record = cur.fetchone()
            if record:
                return cls(
                    id=UUID(record[0]),
                    first_name=record[1],
                    last_name=record[2],
                    username=record[3],
                    email=record[4],
                    password_hash=record[5],
                    created_at=record[6],
                    updated_at=record[7],
                )
        return None

    @classmethod
    def get_profile_with_details(cls, db_conn, user_id: str) -> Optional[Dict[str, Any]]:
        with db_conn.cursor() as cur:
            # Single comprehensive query to get all user profile data
            cur.execute(
                """
                SELECT
                    u.id, u.first_name, u.last_name, u.username, u.email, u.created_at, u.updated_at,
                    ud.about_me,
                    COALESCE(following.following_count, 0) as following_count,
                    COALESCE(followers.followers_count, 0) as followers_count,
                    d.id as deck_id, d.name as deck_name, d.description as deck_description,
                    d.publish_status, d.rating as deck_rating, d.created_at as deck_created_at,
                    d.updated_at as deck_updated_at,
                    c.id as card_id, c.front_text, c.back_text, c.difficulty, c.times_reviewed,
                    c.success_rate as card_success_rate, c.created_at as card_created_at,
                    c.updated_at as card_updated_at,
                    cat.id as category_id, cat.name as category_name,
                    cat.created_at as category_created_at, cat.updated_at as category_updated_at
                FROM users u
                LEFT JOIN user_details ud ON u.id = ud.user_id
                LEFT JOIN (
                    SELECT follower_id, COUNT(*) as following_count
                    FROM followers
                    GROUP BY follower_id
                ) following ON u.id = following.follower_id
                LEFT JOIN (
                    SELECT following_id, COUNT(*) as followers_count
                    FROM followers
                    GROUP BY following_id
                ) followers ON u.id = followers.following_id
                LEFT JOIN decks d ON u.id = d.owner_id
                LEFT JOIN cards c ON d.id = c.deck_id
                LEFT JOIN deck_categories dc ON d.id = dc.deck_id
                LEFT JOIN categories cat ON dc.category_id = cat.id
                WHERE u.id = %s
                ORDER BY d.id, c.id, cat.id
                """,
                (user_id,),
            )

            results = cur.fetchall()

            if not results or not results[0][0]:  # Check if user exists
                return None

            # Process the results to build the profile structure
            user_data = results[0]
            profile = {
                "id": user_data[0],
                "first_name": user_data[1],
                "last_name": user_data[2],
                "username": user_data[3],
                "email": user_data[4],
                "created_at": user_data[5].isoformat() if user_data[5] else None,
                "updated_at": user_data[6].isoformat() if user_data[6] else None,
                "about_me": user_data[7],
                "following_count": user_data[8],
                "followers_count": user_data[9],
                "decks": [],
            }

            # Group results by deck
            decks_dict = {}
            for row in results:
                deck_id = row[10]  # deck_id
                if deck_id and deck_id not in decks_dict:
                    decks_dict[deck_id] = {
                        "id": deck_id,
                        "name": row[11],  # deck_name
                        "description": row[12],  # deck_description
                        "publish_status": row[13],
                        "rating": float(row[14]) if row[14] else 0.0,
                        "created_at": row[15].isoformat() if row[15] else None,
                        "updated_at": row[16].isoformat() if row[16] else None,
                        "cards": {},
                        "categories": {},
                    }

                if deck_id:
                    # Add cards
                    card_id = row[17]  # card_id
                    if card_id and card_id not in decks_dict[deck_id]["cards"]:
                        decks_dict[deck_id]["cards"][card_id] = {
                            "id": card_id,
                            "front_text": row[18],
                            "back_text": row[19],
                            "difficulty": row[20],
                            "times_reviewed": row[21],
                            "success_rate": float(row[22]) if row[22] else 0.0,
                            "created_at": row[23].isoformat() if row[23] else None,
                            "updated_at": row[24].isoformat() if row[24] else None,
                        }

                    # Add categories
                    category_id = row[25]  # category_id
                    if category_id and category_id not in decks_dict[deck_id]["categories"]:
                        decks_dict[deck_id]["categories"][category_id] = {
                            "id": category_id,
                            "name": row[26],
                            "created_at": row[27].isoformat() if row[27] else None,
                            "updated_at": row[28].isoformat() if row[28] else None,
                        }

            # Convert dictionaries to lists
            for deck in decks_dict.values():
                deck["cards"] = list(deck["cards"].values())
                deck["categories"] = list(deck["categories"].values())

            profile["decks"] = list(decks_dict.values())

            return profile

    @classmethod
    def find_by_id(cls, db_conn, user_id: str) -> Optional["UserModel"]:
        with db_conn.cursor() as cur:
            cur.execute(
                "SELECT id, first_name, last_name, username, email, password_hash, created_at, updated_at FROM users WHERE id = %s",
                (user_id,),
            )
            record = cur.fetchone()
            if record:
                return cls(
                    id=UUID(record[0]),
                    first_name=record[1],
                    last_name=record[2],
                    username=record[3],
                    email=record[4],
                    password_hash=record[5],
                    created_at=record[6],
                    updated_at=record[7],
                )
        return None

    @classmethod
    def follow_user(cls, db_conn, user_id: str, target_user_id: str) -> bool:
        # Check if already following
        with db_conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM followers WHERE follower_id = %s AND following_id = %s",
                (user_id, target_user_id),
            )
            if cur.fetchone():
                return False  # Already following

            # Insert new follow relationship
            cur.execute(
                "INSERT INTO followers (follower_id, following_id) VALUES (%s, %s)",
                (user_id, target_user_id),
            )
            db_conn.commit()
        return True

    @classmethod
    def unfollow_user(cls, db_conn, user_id: str, target_user_id: str) -> bool:
        # Check if following
        with db_conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM followers WHERE follower_id = %s AND following_id = %s",
                (user_id, target_user_id),
            )
            if not cur.fetchone():
                return False  # Not following

            # Delete follow relationship
            cur.execute(
                "DELETE FROM followers WHERE follower_id = %s AND following_id = %s",
                (user_id, target_user_id),
            )
            db_conn.commit()
        return True

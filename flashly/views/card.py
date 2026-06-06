import uuid
from datetime import datetime

from pyramid.request import Request
from pyramid.view import view_config

from flashly.models.deck import DeckModel
from flashly.models.card import CardModel, serialize_card_data


@view_config(route_name="get_cards", request_method="GET", renderer="json")
def get_cards(request: Request):
    deck_id = request.matchdict["deck_id"]

    # Fetch database connector
    db_conn = request.db_conn

    # Verify that the deck exists
    deck = DeckModel.find_deck_by_id(db_conn, deck_id)
    if deck is None:
        request.response.status_code = 404
        return {
            "error": "Deck not found",
        }

    # Get token from request (optional for public decks)
    token = request.params.get("token")

    # Check if deck is private and user has access
    deck_publish_status = deck[3]  # publish_status is at index 3
    deck_owner_id = deck[4]  # owner_id is at index 4

    if deck_publish_status == "private":
        if not token or str(deck_owner_id) != token:
            request.response.status_code = 403
            return {
                "error": "Access denied. This is a private deck.",
            }

    # Fetch cards for this deck
    cards = CardModel.find_cards_by_deck_id(db_conn, deck_id)
    if cards is None:
        request.response.status_code = 500
        return {
            "error": "Unable to load cards",
        }

    return {
        "message": f"Cards for deck {deck_id} loaded successfully",
        "cards": serialize_card_data(cards),
        "deck_info": {"id": str(deck[0]), "name": deck[1], "card_count": len(cards)},
    }


@view_config(route_name="create_card", request_method="POST", renderer="json")
def create_card(request: Request):
    deck_id = request.matchdict["deck_id"]

    # Get JSON request
    try:
        data = request.json_body
    except (ValueError, UnicodeDecodeError):
        request.response.status_code = 400
        return {"error": "Invalid JSON"}

    # Get token from request
    token = request.params.get("token")
    if not token:
        request.response.status_code = 400
        return {"error": "Token is required"}

    # Fetch database connector
    db_conn = request.db_conn

    # Verify that the deck exists
    deck = DeckModel.find_deck_by_id(db_conn, deck_id)
    if deck is None:
        request.response.status_code = 404
        return {"error": "Deck not found"}

    # Check if the user owns this deck
    deck_owner_id = deck[4]  # owner_id is at index 4
    if str(deck_owner_id) != token:
        request.response.status_code = 403
        return {"error": "You can only add cards to your own decks"}

    # Validate that all required fields are present
    required_fields = ["frontText", "backText"]
    missing_fields = [field for field in required_fields if field not in data or not data[field].strip()]
    if missing_fields:
        request.response.status_code = 400
        return {"error": f"Missing required fields: {', '.join(missing_fields)}"}

    # Extract data
    front_text = data["frontText"].strip()
    back_text = data["backText"].strip()
    difficulty = data.get("difficulty", "easy").strip()

    # Validate difficulty
    valid_difficulties = ["easy", "medium", "hard"]
    if difficulty not in valid_difficulties:
        request.response.status_code = 400
        return {"error": f"Invalid difficulty. Must be one of: {', '.join(valid_difficulties)}"}

    try:
        # Create new card
        new_card = CardModel(
            id=str(uuid.uuid4()),
            front_text=front_text,
            back_text=back_text,
            difficulty=difficulty,
            times_reviewed=0,
            success_rate=0.0,
            deck_id=deck_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        new_card.save(db_conn)

        # Update the deck's updated_at timestamp
        # First get the deck as a DeckModel instance
        updated_deck = DeckModel(
            id=deck[0],
            name=deck[1],
            description=deck[2],
            publish_status=deck[3],
            owner_id=deck[4],
            rating=deck[5],
            created_at=deck[6],
            updated_at=datetime.now(),
        )
        updated_deck.update(db_conn)

        return {
            "message": "Card successfully created",
            "card": serialize_card_data(new_card),
        }

    except Exception as e:
        print(f"Error creating card: {e}")
        request.response.status_code = 500
        return {"error": "Failed to create card"}


@view_config(route_name="get_card", request_method="GET", renderer="json")
def get_card(request: Request):
    deck_id = request.matchdict["deck_id"]
    card_id = request.matchdict["card_id"]

    # Fetch database connector
    db_conn = request.db_conn

    # Verify that the deck exists
    deck = DeckModel.find_deck_by_id(db_conn, deck_id)
    if deck is None:
        request.response.status_code = 404
        return {"error": "Deck not found"}

    # Get token from request (optional for public decks)
    token = request.params.get("token")

    # Check if deck is private and user has access
    deck_publish_status = deck[3]  # publish_status is at index 3
    deck_owner_id = deck[4]  # owner_id is at index 4

    if deck_publish_status == "private":
        if not token or str(deck_owner_id) != token:
            request.response.status_code = 403
            return {"error": "Access denied. This is a private deck."}

    # Find the specific card
    card = CardModel.find_card_by_id(db_conn, card_id)
    if card is None:
        request.response.status_code = 404
        return {"error": "Card not found"}

    # Verify that the card belongs to the specified deck
    card_deck_id = str(card[6])  # deck_id is at index 6
    if card_deck_id != deck_id:
        request.response.status_code = 400
        return {"error": "Card does not belong to the specified deck"}

    return {
        "message": "Card loaded successfully",
        "card": serialize_card_data(card),
        "deck_info": {"id": str(deck[0]), "name": deck[1]},
    }


@view_config(route_name="update_card", request_method="PUT", renderer="json")
def update_card(request: Request):
    deck_id = request.matchdict["deck_id"]
    card_id = request.matchdict["card_id"]

    # Get JSON request
    try:
        data = request.json_body
    except (ValueError, UnicodeDecodeError):
        request.response.status_code = 400
        return {"error": "Invalid JSON"}

    # Get token from request
    token = request.params.get("token")
    if not token:
        request.response.status_code = 400
        return {"error": "Token is required"}

    # Fetch database connector
    db_conn = request.db_conn

    # Verify that the deck exists
    deck = DeckModel.find_deck_by_id(db_conn, deck_id)
    if deck is None:
        request.response.status_code = 404
        return {"error": "Deck not found"}

    # Check if the user owns this deck
    deck_owner_id = deck[4]  # owner_id is at index 4
    if str(deck_owner_id) != token:
        request.response.status_code = 403
        return {"error": "You can only modify cards in your own decks"}

    # Find the existing card
    existing_card = CardModel.find_card_by_id(db_conn, card_id)
    if existing_card is None:
        request.response.status_code = 404
        return {"error": "Card not found"}

    # Verify that the card belongs to the specified deck
    card_deck_id = str(existing_card[6])  # deck_id is at index 6
    if card_deck_id != deck_id:
        request.response.status_code = 400
        return {"error": "Card does not belong to the specified deck"}

    # Extract and validate data (allow partial updates)
    front_text = data.get("frontText", existing_card[1]).strip() if data.get("frontText") else existing_card[1]
    back_text = data.get("backText", existing_card[2]).strip() if data.get("backText") else existing_card[2]
    difficulty = data.get("difficulty", existing_card[3]).strip() if data.get("difficulty") else existing_card[3]

    # Validate required fields are not empty
    if not front_text or not back_text:
        request.response.status_code = 400
        return {"error": "Front text and back text cannot be empty"}

    # Validate difficulty
    valid_difficulties = ["easy", "medium", "hard"]
    if difficulty not in valid_difficulties:
        request.response.status_code = 400
        return {"error": f"Invalid difficulty. Must be one of: {', '.join(valid_difficulties)}"}

    try:
        # Create updated card model
        updated_card = CardModel(
            id=existing_card[0],  # id
            front_text=front_text,
            back_text=back_text,
            difficulty=difficulty,
            times_reviewed=existing_card[4],  # keep existing times_reviewed
            success_rate=existing_card[5],  # keep existing success_rate
            deck_id=existing_card[6],  # deck_id
            created_at=existing_card[7],  # keep existing created_at
            updated_at=datetime.now(),
        )

        # Save the updated card
        updated_card.update(db_conn)

        # Update the deck's updated_at timestamp
        updated_deck = DeckModel(
            id=deck[0],
            name=deck[1],
            description=deck[2],
            publish_status=deck[3],
            owner_id=deck[4],
            rating=deck[5],
            created_at=deck[6],
            updated_at=datetime.now(),
        )
        updated_deck.update(db_conn)

        # Fetch the updated card to return complete data
        updated_card_data = CardModel.find_card_by_id(db_conn, card_id)

        return {
            "message": "Card updated successfully",
            "card": serialize_card_data(updated_card_data),
        }
    except Exception as e:
        print(f"Error updating card: {e}")
        request.response.status_code = 500
        return {"error": "Failed to update card"}


@view_config(route_name="delete_card", request_method="DELETE", renderer="json")
def delete_card(request: Request):
    deck_id = request.matchdict["deck_id"]
    card_id = request.matchdict["card_id"]

    # Get token from request
    token = request.params.get("token")
    if not token:
        request.response.status_code = 400
        return {"error": "Token is required"}

    # Fetch database connector
    db_conn = request.db_conn

    # Verify that the deck exists
    deck = DeckModel.find_deck_by_id(db_conn, deck_id)
    if deck is None:
        request.response.status_code = 404
        return {"error": "Deck not found"}

    # Check if the user owns this deck
    deck_owner_id = deck[4]  # owner_id is at index 4
    if str(deck_owner_id) != token:
        request.response.status_code = 403
        return {"error": "You can only delete cards from your own decks"}

    # Find the existing card
    existing_card = CardModel.find_card_by_id(db_conn, card_id)
    if existing_card is None:
        request.response.status_code = 404
        return {"error": "Card not found"}

    # Verify that the card belongs to the specified deck
    card_deck_id = str(existing_card[6])  # deck_id is at index 6
    if card_deck_id != deck_id:
        request.response.status_code = 400
        return {"error": "Card does not belong to the specified deck"}

    try:
        # Create CardModel instance for deletion
        card_to_delete = CardModel(
            id=existing_card[0],  # id
            front_text=existing_card[1],  # front_text
            back_text=existing_card[2],  # back_text
            difficulty=existing_card[3],  # difficulty
            times_reviewed=existing_card[4],  # times_reviewed
            success_rate=existing_card[5],  # success_rate
            deck_id=existing_card[6],  # deck_id
            created_at=existing_card[7],  # created_at
            updated_at=existing_card[8],  # updated_at
        )

        # Delete the card
        card_to_delete.delete(db_conn)

        # Update the deck's updated_at timestamp
        updated_deck = DeckModel(
            id=deck[0],
            name=deck[1],
            description=deck[2],
            publish_status=deck[3],
            owner_id=deck[4],
            rating=deck[5],
            created_at=deck[6],
            updated_at=datetime.now(),
        )
        updated_deck.update(db_conn)

        return {"message": "Card successfully deleted"}

    except Exception as e:
        print(f"Error deleting card: {e}")
        request.response.status_code = 500
        return {"error": "Failed to delete card"}

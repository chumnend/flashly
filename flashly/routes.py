def includeme(config):
    # API Routes with /api prefix
    config.add_route("status", "/api/status", request_method="GET")

    # Authentication/Authorization Routes
    config.add_route("register", "/api/register", request_method="POST")
    config.add_route("login", "/api/login", request_method="POST")
    config.add_route("logout", "/api/logout", request_method="POST")

    # User Routes
    config.add_route("get_profile", "/api/users/{user_id}", request_method="GET")
    config.add_route("update_user", "/api/users/{user_id}", request_method="PUT")
    config.add_route("change_password", "/api/change_password", request_method="PUT")
    config.add_route("follow", "/api/users/{user_id}/follow", request_method="POST")
    config.add_route("unfollow", "/api/users/{user_id}/unfollow", request_method="DELETE")
    config.add_route("get_followers", "/api/users/{user_id}/followers", request_method="GET")
    config.add_route("get_following", "/api/users/{user_id}/following", request_method="GET")

    # Deck Routes
    config.add_route("explore_decks", "/api/decks/explore", request_method="GET")
    config.add_route("feed", "/api/decks/feed", request_method="GET")
    config.add_route("get_decks", "/api/decks", request_method="GET")
    config.add_route("create_deck", "/api/decks", request_method="POST")
    config.add_route("get_deck", "/api/decks/{deck_id}", request_method="GET")
    config.add_route("update_deck", "/api/decks/{deck_id}", request_method="PUT")
    config.add_route("delete_deck", "/api/decks/{deck_id}", request_method="DELETE")

    # Card Routes
    config.add_route("get_cards", "/api/decks/{deck_id}/cards", request_method="GET")
    config.add_route("create_card", "/api/decks/{deck_id}/cards", request_method="POST")
    config.add_route("get_card", "/api/decks/{deck_id}/cards/{card_id}", request_method="GET")
    config.add_route("update_card", "/api/decks/{deck_id}/cards/{card_id}", request_method="PUT")
    config.add_route("delete_card", "/api/decks/{deck_id}/cards/{card_id}", request_method="DELETE")

    # Catch-all route for React SPA (must be last)
    config.add_route("frontend", "/*path")

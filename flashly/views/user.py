import uuid
from datetime import datetime

from pyramid.request import Request
from pyramid.view import view_config

from flashly.models.user import UserModel


@view_config(route_name="get_profile", request_method="GET", renderer="json")
def get_profile(request: Request):
    user_id = request.matchdict["user_id"]

    # Fetch database connector
    db_conn = request.db_conn

    # Use the model method to get the profile data
    profile = UserModel.get_profile_with_details(db_conn, user_id)

    if profile is None:
        request.response.status_code = 404
        return {
            "error": "User not found",
        }

    return {
        "message": "Profile loaded successfully",
        "user": {
            "id": profile["id"],
            "firstName": profile["first_name"],
            "lastName": profile["last_name"],
            "username": profile["username"],
            "email": profile["email"],
            "createdAt": profile["created_at"],
            "updatedAt": profile["updated_at"],
        },
        "userDetails": {"aboutMe": profile["about_me"]},
        "decks": [
            {
                "id": deck["id"],
                "name": deck["name"],
                "description": deck["description"],
                "publishStatus": deck["publish_status"],
                "rating": deck["rating"],
                "createdAt": deck["created_at"],
                "updatedAt": deck["updated_at"],
                "cardsCount": len(deck["cards"]),
                "cards": [
                    {
                        "id": card["id"],
                        "frontText": card["front_text"],
                        "backText": card["back_text"],
                        "difficulty": card["difficulty"],
                        "timesReviewed": card["times_reviewed"],
                        "successRate": card["success_rate"],
                        "createdAt": card["created_at"],
                        "updatedAt": card["updated_at"],
                    }
                    for card in deck["cards"]
                ],
                "categories": [
                    {
                        "id": category["id"],
                        "name": category["name"],
                        "createdAt": category["created_at"],
                        "updatedAt": category["updated_at"],
                    }
                    for category in deck["categories"]
                ],
            }
            for deck in profile["decks"]
        ],
        "statistics": {
            "followingCount": profile["following_count"],
            "followersCount": profile["followers_count"],
            "decksCount": len(profile["decks"]),
        },
    }


@view_config(route_name="update_user", request_method="PUT", renderer="json")
def update_user(request: Request):
    user_id = request.matchdict["user_id"]

    # Get JSON request
    try:
        data = request.json_body
    except (ValueError, UnicodeDecodeError):
        request.response.status_code = 400
        return {"error": "Invalid JSON"}

    # Get token from request
    token = request.params.get("token")
    if not token or token != user_id:
        request.response.status_code = 403
        return {"error": "You can only update your own profile"}

    # Fetch database connector
    db_conn = request.db_conn

    # Find the existing user
    user = UserModel.find_by_id(db_conn, user_id)
    if not user:
        request.response.status_code = 404
        return {"error": "User not found"}

    # Extract and validate data (allow partial updates)
    first_name = data.get("firstName", user.first_name).strip().title() if "firstName" in data else user.first_name
    last_name = data.get("lastName", user.last_name).strip().title() if "lastName" in data else user.last_name
    username = data.get("username", user.username).strip() if "username" in data else user.username
    email = data.get("email", user.email).strip().lower() if "email" in data else user.email
    about_me = data.get("aboutMe", "").strip() if "aboutMe" in data else None

    # Validate email format if provided
    if data.get("email") and ("@" not in email or "." not in email):
        request.response.status_code = 400
        return {"error": "Invalid email format"}

    # Check if email or username already exists (but not for current user)
    if data.get("email") and data["email"] != user.email:
        existing_user = UserModel.find_by_email(db_conn, email)
        if existing_user and str(existing_user.id) != user_id:
            request.response.status_code = 400
            return {"error": "Email already taken"}

    if data.get("username") and data["username"] != user.username:
        existing_user = UserModel.find_by_username(db_conn, username)
        if existing_user and str(existing_user.id) != user_id:
            request.response.status_code = 400
            return {"error": "Username already taken"}

    try:
        # Update user information
        with db_conn.cursor() as cur:
            cur.execute(
                """
                UPDATE users
                SET first_name = %s, last_name = %s, username = %s, email = %s, updated_at = %s
                WHERE id = %s
                """,
                (first_name, last_name, username, email, datetime.now(), user_id),
            )

        # Update user details if aboutMe is provided
        if about_me is not None:
            with db_conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE user_details
                    SET about_me = %s, updated_at = %s
                    WHERE user_id = %s
                    """,
                    (about_me, datetime.now(), user_id),
                )

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user_id,
                "firstName": first_name,
                "lastName": last_name,
                "username": username,
                "email": email,
            },
        }

    except (ValueError, UnicodeDecodeError):
        request.response.status_code = 400
        return {"error": "Invalid JSON"}

@view_config(route_name="change_password", request_method="PUT", renderer="json")
def change_password(request: Request):
    user_id_from_route = request.matchdict["user_id"]

    # Get JSON request
    try:
        data = request.json_body
    except (ValueError, UnicodeDecodeError):
        request.response.status_code = 400
        return {"error": "Invalid JSON"}

    # Get token from request
    token = request.params.get("token")
    if not token or token != user_id_from_route:
        request.response.status_code = 403
        return {"error": "You can only change your own password"}

    # Validate required fields
    required_fields = ["currentPassword", "newPassword"]
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        request.response.status_code = 400
        return {"error": f"Missing required fields: {', '.join(missing_fields)}"}

    current_password = data["currentPassword"]
    new_password = data["newPassword"]

    # Validate new password
    if len(new_password) < 8:
        request.response.status_code = 400
        return {"error": "Password must be at least 8 characters long."}
    if not any(c.isdigit() for c in new_password):
        request.response.status_code = 400
        return {"error": "Password must contain at least one digit."}
    if not any(c.isupper() for c in new_password):
        request.response.status_code = 400
        return {"error": "Password must contain at least one uppercase letter."}
    if not any(c.islower() for c in new_password):
        request.response.status_code = 400
        return {"error": "Password must contain at least one lowercase letter."}

    # Fetch database connector
    db_conn = request.db_conn

    # Find user by ID
    user = UserModel.find_by_id(db_conn, user_id_from_route)
    if not user:
        request.response.status_code = 404
        return {"error": "User not found"}

    # Verify current password
    if not user.check_password(current_password):
        request.response.status_code = 400
        return {"error": "Invalid old password"}

    # Set new password
    user.set_password(new_password)

    try:
        # Update password in database
        with db_conn.cursor() as cur:
            cur.execute(
                """
                UPDATE users
                SET password_hash = %s, updated_at = %s
                WHERE id = %s
                """,
                (user.password_hash, datetime.now(), token),
            )
        db_conn.commit()

        return {"message": "Password changed successfully"}

    except Exception as e:
        print(f"Error changing password: {e}")
        request.response.status_code = 500
        return {"error": "Failed to change password"}


@view_config(route_name="follow", request_method="POST", renderer="json")
def follow(request: Request):
    user_to_follow_id = request.matchdict["user_id"]

    # Get token from request
    token = request.params.get("token")
    if not token:
        request.response.status_code = 400
        return {"error": "Token is required"}

    # Can't follow yourself
    if token == user_to_follow_id:
        request.response.status_code = 400
        return {"error": "You can only follow/unfollow as yourself"}

    # Fetch database connector
    db_conn = request.db_conn

    # Verify both users exist
    current_user = UserModel.find_by_id(db_conn, token)
    if not current_user:
        request.response.status_code = 404
        return {"error": "Current user not found"}

    target_user = UserModel.find_by_id(db_conn, user_to_follow_id)
    if not target_user:
        request.response.status_code = 404
        return {"error": "User to follow not found"}

    try:
        if not UserModel.follow_user(db_conn, token, user_to_follow_id):
            request.response.status_code = 400
            return {"error": "Already following this user", "message": "Already following this user"}

        return {"message": "Successfully followed user"}

    except Exception as e:
        print(f"Error following user: {e}")
        request.response.status_code = 500
        return {"error": "Failed to follow user"}


@view_config(route_name="unfollow", request_method="DELETE", renderer="json")
def unfollow(request: Request):
    user_to_unfollow_id = request.matchdict["user_id"]

    # Get token from request
    token = request.params.get("token")
    if not token:
        request.response.status_code = 400
        return {"error": "Token is required"}

    # Can't unfollow yourself
    if token == user_to_unfollow_id:
        request.response.status_code = 400
        return {"error": "You cannot unfollow yourself"}

    # Fetch database connector
    db_conn = request.db_conn

    # Verify both users exist
    current_user = UserModel.find_by_id(db_conn, token)
    if not current_user:
        request.response.status_code = 404
        return {"error": "Current user not found"}

    target_user = UserModel.find_by_id(db_conn, user_to_unfollow_id)
    if not target_user:
        request.response.status_code = 404
        return {"error": "User to unfollow not found"}

    try:
        if not UserModel.unfollow_user(db_conn, token, user_to_unfollow_id):
            request.response.status_code = 404
            return {"error": "Not following this user"}

        return {"message": "Successfully unfollowed user"}

    except Exception as e:
        print(f"Error unfollowing user: {e}")
        request.response.status_code = 500
        return {"error": "Failed to unfollow user"}


@view_config(route_name="get_followers", request_method="GET", renderer="json")
def get_followers(request: Request):
    user_id = request.matchdict["user_id"]

    # Fetch database connector
    db_conn = request.db_conn

    # Verify user exists
    user = UserModel.find_by_id(db_conn, user_id)
    if not user:
        request.response.status_code = 404
        return {"error": "User not found"}

    # Get followers
    try:
        with db_conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.id, u.first_name, u.last_name, u.username, u.email, f.created_at
                FROM users u
                JOIN followers f ON u.id = f.follower_id
                WHERE f.following_id = %s
                ORDER BY f.created_at DESC
                """,
                (user_id,),
            )
            followers = cur.fetchall()

        followers_list = [
            {
                "id": str(follower[0]),
                "firstName": follower[1],
                "lastName": follower[2],
                "username": follower[3],
                "email": follower[4],
                "followed_at": follower[5].isoformat() if follower[5] else None,
            }
            for follower in followers
        ]

        return {
            "message": f"Followers for user {user_id} loaded successfully",
            "followers": followers_list,
            "count": len(followers_list),
        }

    except Exception as e:
        print(f"Error getting followers: {e}")
        request.response.status_code = 500
        return {"error": "Failed to load followers"}


@view_config(route_name="get_following", request_method="GET", renderer="json")
def get_following(request: Request):
    user_id = request.matchdict["user_id"]

    # Fetch database connector
    db_conn = request.db_conn

    # Verify user exists
    user = UserModel.find_by_id(db_conn, user_id)
    if not user:
        request.response.status_code = 404
        return {"error": "User not found"}

    # Get following
    try:
        with db_conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.id, u.first_name, u.last_name, u.username, u.email, f.created_at
                FROM users u
                JOIN followers f ON u.id = f.following_id
                WHERE f.follower_id = %s
                ORDER BY f.created_at DESC
                """,
                (user_id,),
            )
            following = cur.fetchall()

        following_list = [
            {
                "id": str(followed[0]),
                "firstName": followed[1],
                "lastName": followed[2],
                "username": followed[3],
                "email": followed[4],
                "followed_at": followed[5].isoformat() if followed[5] else None,
            }
            for followed in following
        ]

        return {
            "message": f"Following for user {user_id} loaded successfully",
            "following": following_list,
            "count": len(following_list),
        }

    except Exception as e:
        print(f"Error getting following: {e}")
        request.response.status_code = 500
        return {"error": "Failed to load following"}

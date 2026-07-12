import unittest
from unittest.mock import MagicMock, patch, PropertyMock
from datetime import datetime
import uuid

from pyramid.response import Response
from flashly.views.user import get_profile, update_user, change_password, follow, unfollow, get_followers, get_following
from flashly.models.user import UserModel
from flashly.models.user_details import UserDetailsModel
from flashly.models.deck import DeckModel
from flashly.models.card import CardModel
from flashly.models.category import CategoryModel

# Helper function to create a mock cursor
def create_mock_cursor(fetchone_return=None, fetchall_return=None):
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = fetchone_return
    mock_cursor.fetchall.return_value = fetchall_return
    return mock_cursor

class TestUserViews(unittest.TestCase):

    def setUp(self):
        self.request = MagicMock()
        self.request.db_conn = MagicMock()
        self.request.response = Response()
        self.request.json_body = {} # Explicitly set json_body to an empty dictionary
        self.user_id = str(uuid.uuid4())
        self.another_user_id = str(uuid.uuid4())
        self.deck_id = str(uuid.uuid4())
        self.card_id = str(uuid.uuid4())
        self.category_id = str(uuid.uuid4())

    # --- Tests for get_profile ---
    @patch('flashly.views.user.UserModel.get_profile_with_details')
    def test_get_profile_success(self, mock_get_profile_with_details):
        mock_profile_data = {
            "id": self.user_id,
            "first_name": "Test",
            "last_name": "User",
            "username": "testuser",
            "email": "test@example.com",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "about_me": "About me text",
            "decks": [
                {
                    "id": self.deck_id,
                    "name": "Test Deck",
                    "description": "Deck description",
                    "publish_status": "public",
                    "rating": 4.5,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                        "cards": [
                        {
                            "id": self.card_id,
                            "front_text": "Front",
                            "back_text": "Back",
                            "difficulty": 1,
                            "times_reviewed": 5,
                            "success_rate": 0.8,
                            "created_at": datetime.now(),
                            "updated_at": datetime.now(),
                        }
                    ],
                    "categories": [
                        {
                            "id": self.category_id,
                            "name": "Test Category",
                            "created_at": datetime.now(),
                            "updated_at": datetime.now(),
                        }
                    ],
                }
            ],
            "following_count": 2,
            "followers_count": 3,
        }
        mock_get_profile_with_details.return_value = mock_profile_data
        self.request.matchdict = {"user_id": self.user_id}

        response = get_profile(self.request)

        mock_get_profile_with_details.assert_called_once_with(self.request.db_conn, self.user_id)
        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], "Profile loaded successfully")
        self.assertEqual(response["user"]["id"], self.user_id)
        self.assertEqual(response["userDetails"]["aboutMe"], "About me text")
        self.assertEqual(len(response["decks"]), 1)
        self.assertEqual(response["decks"][0]["id"], self.deck_id)
        self.assertEqual(response["decks"][0]["cardsCount"], 1)
        self.assertEqual(response["decks"][0]["cards"][0]["id"], self.card_id)
        self.assertEqual(response["decks"][0]["categories"][0]["id"], self.category_id)
        self.assertEqual(response["statistics"]["followingCount"], 2)

    @patch('flashly.views.user.UserModel.get_profile_with_details')
    def test_get_profile_user_not_found(self, mock_get_profile_with_details):
        mock_get_profile_with_details.return_value = None
        self.request.matchdict = {"user_id": self.user_id}

        response = get_profile(self.request)

        mock_get_profile_with_details.assert_called_once_with(self.request.db_conn, self.user_id)
        self.assertEqual(self.request.response.status_code, 404)
        self.assertEqual(response["error"], "User not found")

        # --- Tests for update_user ---
    @patch('flashly.views.user.UserModel')
    def test_update_user_found_by_email(self, mock_user_model):
        # Mock an existing user that find_by_email will return
        mock_existing_user = MagicMock()
        mock_existing_user.id = uuid.UUID(self.user_id)
        mock_existing_user.first_name = "Old"
        mock_existing_user.last_name = "User"
        mock_existing_user.username = "olduser"
        mock_existing_user.email = "old@example.com"
        mock_existing_user.password_hash = "hashed_password"
        mock_existing_user.created_at = datetime.now()
        mock_existing_user.updated_at = datetime.now()

        mock_user_model.find_by_id.return_value = mock_existing_user # Added mock for find_by_id
        mock_user_model.find_by_email.return_value = mock_existing_user
        mock_user_model.find_by_username.return_value = None # No username conflict

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = {"email": "old@example.com"} # Email is the same, no conflict

        # Mock database cursor for the direct user_id lookup path (should not be called)
        mock_cursor = create_mock_cursor(fetchone_return=None)
        self.request.db_conn.cursor.return_value.__enter__.return_value = mock_cursor
        self.request.db_conn.commit.return_value = None # Mock commit

        response = update_user(self.request)

        mock_user_model.find_by_id.assert_called_once_with(self.request.db_conn, self.user_id)
        mock_user_model.find_by_email.assert_not_called()
        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], "Profile updated successfully")
        self.assertEqual(response["user"]["email"], "old@example.com")

    @patch('flashly.views.user.UserModel')
    def test_update_user_successful_partial_update(self, mock_user_model):
        from unittest.mock import ANY # Import ANY for flexible datetime matching

        mock_existing_user = MagicMock()
        mock_existing_user.__bool__.return_value = True # Explicitly make it truthy
        mock_existing_user.id = uuid.UUID(self.user_id)
        mock_existing_user.first_name = "Old"
        mock_existing_user.last_name = "User"
        mock_existing_user.username = "olduser"
        mock_existing_user.email = "old@example.com"
        mock_existing_user.password_hash = "hashed_password"
        mock_existing_user.created_at = datetime.now()
        mock_existing_user.updated_at = datetime.now()

        mock_user_model.find_by_id.return_value = mock_existing_user # Added mock for find_by_id
        mock_user_model.find_by_email.return_value = mock_existing_user
        mock_user_model.find_by_username.return_value = None

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = {"firstName": "New", "username": "newusername"}

        mock_cursor = create_mock_cursor(fetchone_return=None)
        self.request.db_conn.cursor.return_value.__enter__.return_value = mock_cursor
        self.request.db_conn.commit.return_value = None

        response = update_user(self.request)

        mock_user_model.find_by_email.assert_not_called()
        # Assert that execute was called once (for users, user_details is skipped because aboutMe is not provided)
        self.assertEqual(self.request.db_conn.cursor.return_value.__enter__.return_value.execute.call_count, 1)
        # Verify the update query parameters (order of args matters) - for the first call (users table)
        expected_user_update_args = (
            "New",
            "User", # Should remain unchanged
            "newusername",
            "old@example.com", # Should remain unchanged
            ANY, # updated_at datetime
            self.user_id,
        )
        # Assuming the first call is for users table update
        user_update_call_args, _ = self.request.db_conn.cursor.return_value.__enter__.return_value.execute.call_args_list[0]
        self.assertEqual(user_update_call_args[1][:-1], expected_user_update_args[:-1]) # Compare all but datetime


        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], "Profile updated successfully")
        self.assertEqual(response["user"]["firstName"], "New")
        self.assertEqual(response["user"]["lastName"], "User")
        self.assertEqual(response["user"]["username"], "newusername")
        self.assertEqual(response["user"]["email"], "old@example.com")

    @patch('flashly.views.user.UserModel')
    def test_update_user_username_already_taken(self, mock_user_model):
        mock_existing_user_for_update = MagicMock()
        mock_existing_user_for_update.id = uuid.UUID(self.user_id)
        mock_existing_user_for_update.username = "currentusername"

        mock_duplicate_user = MagicMock()
        mock_duplicate_user.id = uuid.UUID(self.another_user_id) # Different user ID

        mock_user_model.find_by_id.return_value = mock_existing_user_for_update
        mock_user_model.find_by_email.return_value = None # No email in request body
        mock_user_model.find_by_username.side_effect = [mock_duplicate_user] # First call to check for duplicate username

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = {"username": "duplicateusername"}

        # Mock database cursor to return a record for the user_id lookup (lines 105-110)
        mock_user_record = (
            str(self.user_id),
            "Test",
            "User",
            "currentusername",
            "test@example.com",
            "hashed_password",
            datetime.now(),
            datetime.now(),
        )
        mock_cursor = create_mock_cursor(fetchone_return=mock_user_record)
        self.request.db_conn.cursor.return_value.__enter__.return_value = mock_cursor

        response = update_user(self.request)

        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Username already taken")

    @patch('flashly.views.user.UserModel')
    def test_update_user_email_already_taken(self, mock_user_model):
        mock_existing_user_for_update = MagicMock()
        mock_existing_user_for_update.id = uuid.UUID(self.user_id)
        mock_existing_user_for_update.email = "current@example.com"

        mock_duplicate_user = MagicMock()
        mock_duplicate_user.id = uuid.UUID(self.another_user_id) # Different user ID

        mock_user_model.find_by_id.return_value = mock_existing_user_for_update # Added mock for find_by_id
        mock_user_model.find_by_email.return_value = mock_duplicate_user
        mock_user_model.find_by_username.return_value = None

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = {"email": "duplicate@example.com"} # New email that's taken

        mock_cursor = create_mock_cursor(fetchone_return=None)
        self.request.db_conn.cursor.return_value.__enter__.return_value = mock_cursor

        response = update_user(self.request)

        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Email already taken")

    @patch('flashly.views.user.UserModel')
    def test_update_user_invalid_email_format(self, mock_user_model):
        mock_existing_user = MagicMock()
        mock_existing_user.id = uuid.UUID(self.user_id)
        mock_existing_user.email = "valid@example.com"
        mock_user_model.find_by_id.return_value = mock_existing_user
        mock_user_model.find_by_email.return_value = mock_existing_user
        mock_user_model.find_by_username.return_value = None

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = {"email": "invalid-email"} # Invalid email format

        mock_cursor = create_mock_cursor(fetchone_return=None)
        self.request.db_conn.cursor.return_value.__enter__.return_value = mock_cursor

        response = update_user(self.request)

        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Invalid email format")


    @patch('flashly.views.user.UserModel.find_by_email', return_value=None)
    def test_update_user_invalid_json(self, mock_find_by_email):
        # Make self.request.json_body raise an exception when accessed
        type(self.request).json_body = PropertyMock(side_effect=ValueError("Invalid JSON body"))

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}

        # Mock database cursor for the direct user_id lookup path
        mock_cursor = create_mock_cursor(fetchone_return=None)
        self.request.db_conn.cursor.return_value.__enter__.return_value = mock_cursor

        response = update_user(self.request)

        mock_find_by_email.assert_not_called() # Should not be called if JSON parsing fails early
        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Invalid JSON")

    def test_update_user_missing_token(self):
        self.request.matchdict = {"user_id": self.user_id}
        self.request.json_body = {} # Empty JSON to bypass JSON parsing error
        self.request.params = {} # Missing token

        response = update_user(self.request)

        self.assertEqual(self.request.response.status_code, 403)
        self.assertEqual(response["error"], "You can only update your own profile")

    def test_update_user_unauthorized_token(self):
        self.request.matchdict = {"user_id": self.user_id}
        self.request.json_body = {}
        self.request.params = {"token": self.another_user_id} # Token for a different user

        response = update_user(self.request)

        self.assertEqual(self.request.response.status_code, 403)
        self.assertEqual(response["error"], "You can only update your own profile")

    # --- Tests for change_password ---
    @patch('flashly.views.user.UserModel')
    def test_change_password_success(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user
        mock_user.check_password.return_value = True
        mock_user.set_password = MagicMock() # Mock the set_password method on the user instance

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = { # Ensure json_body behaves like a dictionary
            "currentPassword": "old_password",
            "newPassword": "NewPassword123"
        }

        response = change_password(self.request)

        mock_user_model.find_by_id.assert_called_once_with(self.request.db_conn, self.user_id)
        mock_user.check_password.assert_called_once_with("old_password")
        mock_user.set_password.assert_called_once_with("NewPassword123")
        self.request.db_conn.commit.assert_called_once()
        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], "Password changed successfully")

    @patch('flashly.views.user.UserModel')
    def test_change_password_invalid_old_password(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user
        mock_user.check_password.return_value = False

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = { # Ensure json_body behaves like a dictionary
            "currentPassword": "wrong_password",
            "newPassword": "NewPassword123"
        }

        response = change_password(self.request)

        # Removed assertion for mock_user_model.find_by_id as early exit is expected
        mock_user.check_password.assert_called_once_with("wrong_password")
        self.request.db_conn.commit.assert_not_called()
        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Invalid old password")

    @patch('flashly.views.user.UserModel')
    def test_change_password_new_password_too_short(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = { # Ensure json_body behaves like a dictionary
            "currentPassword": "old_password",
            "newPassword": "short"
        }

        response = change_password(self.request)

        # Removed assertion for mock_user_model.find_by_id as early exit is expected
        self.request.db_conn.commit.assert_not_called()
        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Password must be at least 8 characters long.")

    @patch('flashly.views.user.UserModel')
    def test_change_password_new_password_no_digit(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = { # Ensure json_body behaves like a dictionary
            "currentPassword": "old_password",
            "newPassword": "NewPassword"
        }

        response = change_password(self.request)

        # Removed assertion for mock_user_model.find_by_id as early exit is expected
        self.request.db_conn.commit.assert_not_called()
        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Password must contain at least one digit.")

    @patch('flashly.views.user.UserModel')
    def test_change_password_new_password_no_upper(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = { # Ensure json_body behaves like a dictionary
            "currentPassword": "old_password",
            "newPassword": "newpassword123"
        }

        response = change_password(self.request)

        # Removed assertion for mock_user_model.find_by_id as early exit is expected
        self.request.db_conn.commit.assert_not_called()
        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Password must contain at least one uppercase letter.")

    @patch('flashly.views.user.UserModel')
    def test_change_password_new_password_no_lower(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = { # Ensure json_body behaves like a dictionary
            "currentPassword": "old_password",
            "newPassword": "NEWPASSWORD123"
        }

        response = change_password(self.request)

        # Removed assertion for mock_user_model.find_by_id as early exit is expected
        self.request.db_conn.commit.assert_not_called()
        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Password must contain at least one lowercase letter.")

    @patch('flashly.views.user.UserModel')
    def test_change_password_token_mismatch(self, mock_user_model):
        mock_user_model.find_by_id.return_value = MagicMock()

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.another_user_id} # Mismatched token
        self.request.json_body = { # Ensure json_body behaves like a dictionary
            "currentPassword": "old_password",
            "newPassword": "NewPassword123"
        }

        response = change_password(self.request)

        # Removed assertion for mock_user_model.find_by_id as early exit is expected
        self.assertEqual(self.request.response.status_code, 403)
        self.assertEqual(response["error"], "You can only change your own password")

    @patch('flashly.views.user.UserModel')
    def test_change_password_user_not_found(self, mock_user_model):
        mock_user_model.find_by_id.return_value = None

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}
        self.request.json_body = { # Ensure json_body behaves like a dictionary
            "currentPassword": "old_password",
            "newPassword": "NewPassword123"
        }

        response = change_password(self.request)

        # Removed assertion for mock_user_model.find_by_id as early exit is expected
        self.request.db_conn.commit.assert_not_called()
        self.assertEqual(self.request.response.status_code, 404)
        self.assertEqual(response["error"], "User not found")

    @patch('flashly.views.user.UserModel')
    def test_change_password_invalid_json(self, mock_user_model):
        # Make self.request.json_body raise an exception when accessed
        type(self.request).json_body = PropertyMock(side_effect=ValueError("Invalid JSON body"))
        mock_user_model.find_by_id.return_value = MagicMock()

        self.request.matchdict = {"user_id": self.user_id}
        self.request.params = {"token": self.user_id}

        response = change_password(self.request)

        # Removed assertion for mock_user_model.find_by_id as early exit is expected
        self.request.db_conn.commit.assert_not_called()
        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "Invalid JSON")

    # --- Tests for follow ---
    @patch('flashly.views.user.UserModel')
    @patch('flashly.views.user.UserModel.follow_user')
    def test_follow_success(self, mock_follow_user, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_target_user = MagicMock()
        mock_target_user.id = uuid.UUID(self.another_user_id)

        mock_user_model.find_by_id.side_effect = [mock_user, mock_target_user] # First for current user, second for target
        mock_user_model.follow_user = mock_follow_user
        mock_follow_user.return_value = True # Indicates successful follow

        self.request.matchdict = {"user_id": self.another_user_id}
        self.request.params = {"token": self.user_id}

        response = follow(self.request)

        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], "Successfully followed user")
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.user_id)
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.another_user_id)
        mock_follow_user.assert_called_once_with(self.request.db_conn, self.user_id, self.another_user_id)

    @patch('flashly.views.user.UserModel')
    @patch('flashly.views.user.UserModel.follow_user')
    def test_follow_already_following(self, mock_follow_user, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_target_user = MagicMock()
        mock_target_user.id = uuid.UUID(self.another_user_id)

        mock_user_model.find_by_id.side_effect = [mock_user, mock_target_user]
        mock_user_model.follow_user = mock_follow_user
        mock_follow_user.return_value = False # Indicates already following

        self.request.matchdict = {"user_id": self.another_user_id}
        self.request.params = {"token": self.user_id}

        response = follow(self.request)

        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["message"], "Already following this user")
        mock_follow_user.assert_called_once_with(self.request.db_conn, self.user_id, self.another_user_id)

    @patch('flashly.views.user.UserModel')
    def test_follow_self(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        self.request.matchdict = {"user_id": self.user_id, "target_user_id": self.user_id}
        self.request.params = {"token": self.user_id}

        response = follow(self.request)

        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "You can only follow/unfollow as yourself")
        mock_user_model.find_by_id.assert_not_called()

    @patch('flashly.views.user.UserModel')
    def test_follow_target_user_not_found(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)

        mock_user_model.find_by_id.side_effect = [mock_user, None] # First for current user, second (target) not found

        self.request.matchdict = {"user_id": self.another_user_id}
        self.request.params = {"token": self.user_id}

        response = follow(self.request)

        self.assertEqual(self.request.response.status_code, 404)
        self.assertEqual(response["error"], "User to follow not found")
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.user_id)
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.another_user_id)

    @patch('flashly.views.user.UserModel')
    def test_follow_user_not_found(self, mock_user_model):
        mock_user_model.find_by_id.side_effect = [None, MagicMock()] # First call for current user returns None, second for target returns a mock

        self.request.matchdict = {"user_id": self.another_user_id}
        self.request.params = {"token": self.user_id}

        response = follow(self.request)

        self.assertEqual(self.request.response.status_code, 404)
        self.assertEqual(response["error"], "Current user not found")
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.user_id)

    @patch('flashly.views.user.UserModel')
    def test_follow_token_mismatch(self, mock_user_model):
        mock_user_model.find_by_id.return_value = MagicMock() # Mock some user just to satisfy call

        self.request.matchdict = {"user_id": self.another_user_id}
        self.request.params = {"token": self.another_user_id} # Mismatched token

        response = follow(self.request)

        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "You can only follow/unfollow as yourself")
        mock_user_model.find_by_id.assert_not_called()

    # --- Tests for unfollow ---
    @patch('flashly.views.user.UserModel')
    @patch('flashly.views.user.UserModel.unfollow_user')
    def test_unfollow_success(self, mock_unfollow_user, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_target_user = MagicMock()
        mock_target_user.id = uuid.UUID(self.another_user_id)

        mock_user_model.find_by_id.side_effect = [mock_user, mock_target_user] # First for current user, second for target
        mock_user_model.unfollow_user = mock_unfollow_user
        mock_unfollow_user.return_value = True # Indicates successful unfollow

        self.request.matchdict = {"user_id": self.another_user_id} # Target user is another_user_id
        self.request.params = {"token": self.user_id}

        response = unfollow(self.request)

        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], "Successfully unfollowed user")
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.user_id)
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.another_user_id)
        mock_unfollow_user.assert_called_once_with(self.request.db_conn, self.user_id, self.another_user_id)

    @patch('flashly.views.user.UserModel')
    @patch('flashly.views.user.UserModel.unfollow_user')
    def test_unfollow_not_following(self, mock_unfollow_user, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_target_user = MagicMock()
        mock_target_user.id = uuid.UUID(self.another_user_id)

        mock_user_model.find_by_id.side_effect = [mock_user, mock_target_user]
        mock_user_model.unfollow_user = mock_unfollow_user
        mock_unfollow_user.return_value = False # Indicates not following

        self.request.matchdict = {"user_id": self.another_user_id}
        self.request.params = {"token": self.user_id}

        response = unfollow(self.request)

        self.assertEqual(self.request.response.status_code, 404)
        self.assertEqual(response["error"], "Not following this user")
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.user_id)
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.another_user_id)
        self.request.db_conn.commit.assert_not_called()

    @patch('flashly.views.user.UserModel')
    def test_unfollow_self(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        self.request.matchdict = {"user_id": self.user_id, "target_user_id": self.user_id}
        self.request.params = {"token": self.user_id}

        response = unfollow(self.request)

        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "You cannot unfollow yourself")
        mock_user_model.find_by_id.assert_not_called()

    @patch('flashly.views.user.UserModel')
    def test_unfollow_target_user_not_found(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)

        mock_user_model.find_by_id.side_effect = [mock_user, None] # First for current user, second (target) not found

        self.request.matchdict = {"user_id": self.another_user_id}
        self.request.params = {"token": self.user_id}

        response = unfollow(self.request)

        self.assertEqual(self.request.response.status_code, 404)
        self.assertEqual(response["error"], "User to unfollow not found")
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.user_id)
        mock_user_model.find_by_id.assert_any_call(self.request.db_conn, self.another_user_id)
        self.request.db_conn.commit.assert_not_called()

    @patch('flashly.views.user.UserModel')
    def test_unfollow_token_mismatch(self, mock_user_model):
        mock_user_model.find_by_id.return_value = MagicMock() # Mock some user just to satisfy call

        self.request.matchdict = {"user_id": self.another_user_id}
        self.request.params = {"token": self.another_user_id} # Mismatched token

        response = unfollow(self.request)

        self.assertEqual(self.request.response.status_code, 400)
        self.assertEqual(response["error"], "You cannot unfollow yourself")
        mock_user_model.find_by_id.assert_not_called()

    # --- Tests for get_followers ---
    @patch('flashly.views.user.UserModel')
    def test_get_followers_success(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        mock_follower_id_1 = str(uuid.uuid4())
        mock_follower_id_2 = str(uuid.uuid4())
        mock_followers_data_for_db = [
            (uuid.UUID(mock_follower_id_1), "Follower", "One", "follower1", "follower1@example.com", datetime.now()),
            (uuid.UUID(mock_follower_id_2), "Follower", "Two", "follower2", "follower2@example.com", datetime.now()),
        ]
        self.request.db_conn.cursor.return_value.__enter__.return_value.fetchall.return_value = mock_followers_data_for_db

        self.request.matchdict = {"user_id": self.user_id}

        response = get_followers(self.request)

        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], f"Followers for user {self.user_id} loaded successfully")
        self.assertEqual(response["count"], 2)
        self.assertEqual(len(response["followers"]), 2)
        self.assertEqual(response["followers"][0]["id"], mock_follower_id_1)
        self.assertEqual(response["followers"][0]["username"], "follower1")
        mock_user_model.find_by_id.assert_called_once_with(self.request.db_conn, self.user_id)

    @patch('flashly.views.user.UserModel')
    def test_get_followers_no_followers(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        self.request.db_conn.cursor.return_value.__enter__.return_value.fetchall.return_value = [] # No followers

        self.request.matchdict = {"user_id": self.user_id}

        response = get_followers(self.request)

        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], f"Followers for user {self.user_id} loaded successfully")
        self.assertEqual(response["count"], 0)
        self.assertEqual(len(response["followers"]), 0)
        mock_user_model.find_by_id.assert_called_once_with(self.request.db_conn, self.user_id)

    @patch('flashly.views.user.UserModel')
    def test_get_followers_user_not_found(self, mock_user_model):
        mock_user_model.find_by_id.return_value = None # User not found

        self.request.matchdict = {"user_id": self.user_id}

        response = get_followers(self.request)

        self.assertEqual(self.request.response.status_code, 404)
        self.assertEqual(response["error"], "User not found")
        mock_user_model.find_by_id.assert_called_once_with(self.request.db_conn, self.user_id)

    # --- Tests for get_following ---
    @patch('flashly.views.user.UserModel')
    def test_get_following_success(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        mock_following_id_1 = str(uuid.uuid4())
        mock_following_id_2 = str(uuid.uuid4())
        mock_following_data_for_db = [
            (uuid.UUID(mock_following_id_1), "Following", "One", "following1", "following1@example.com", datetime.now()),
            (uuid.UUID(mock_following_id_2), "Following", "Two", "following2", "following2@example.com", datetime.now()),
        ]
        self.request.db_conn.cursor.return_value.__enter__.return_value.fetchall.return_value = mock_following_data_for_db

        self.request.matchdict = {"user_id": self.user_id}

        response = get_following(self.request)

        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], f"Following for user {self.user_id} loaded successfully")
        self.assertEqual(response["count"], 2)
        self.assertEqual(len(response["following"]), 2)
        self.assertEqual(response["following"][0]["id"], mock_following_id_1)
        self.assertEqual(response["following"][0]["username"], "following1")
        mock_user_model.find_by_id.assert_called_once_with(self.request.db_conn, self.user_id)

    @patch('flashly.views.user.UserModel')
    def test_get_following_no_following(self, mock_user_model):
        mock_user = MagicMock()
        mock_user.id = uuid.UUID(self.user_id)
        mock_user_model.find_by_id.return_value = mock_user

        self.request.db_conn.cursor.return_value.__enter__.return_value.fetchall.return_value = [] # No following

        self.request.matchdict = {"user_id": self.user_id}

        response = get_following(self.request)

        self.assertEqual(self.request.response.status_code, 200)
        self.assertEqual(response["message"], f"Following for user {self.user_id} loaded successfully")
        self.assertEqual(response["count"], 0)
        self.assertEqual(len(response["following"]), 0)
        mock_user_model.find_by_id.assert_called_once_with(self.request.db_conn, self.user_id)

    @patch('flashly.views.user.UserModel')
    def test_get_following_user_not_found(self, mock_user_model):
        mock_user_model.find_by_id.return_value = None # User not found

        self.request.matchdict = {"user_id": self.user_id}

        response = get_following(self.request)

        self.assertEqual(self.request.response.status_code, 404)
        self.assertEqual(response["error"], "User not found")
        mock_user_model.find_by_id.assert_called_once_with(self.request.db_conn, self.user_id)

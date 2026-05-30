const BASE_URL = '/api';

// Shared

export interface ApiError {
    error: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
}

export interface Category {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface Card {
    id: string;
    frontText: string;
    backText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timesReviewed: number;
    successRate: number;
    createdAt: string;
    updatedAt: string;
}

export interface Deck {
    id: string;
    name: string;
    description: string;
    publishStatus: 'public' | 'private';
    rating: number;
    owner: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    cardsCount: number;
    cards: Card[] | undefined;
    categories: Category[] | undefined;
}

export interface UserDetails {
    aboutMe: string;
}

export interface ProfileStatistics {
    followingCount: number;
    followersCount: number;
    decksCount: number;
}

export interface FollowUser extends User {
    followed_at: string | null;
}

// Status

export interface StatusResponse {
    status: string;
    message: string;
    timestamp: string;
}

export const status = async (): Promise<AuthResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
};

// Authentication/Authorization

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export interface LogoutResponse {
    message: string;
}

export const register = async (
    data: RegisterRequest,
): Promise<AuthResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
};

export const login = async (data: {
    email: string;
    password: string;
}): Promise<AuthResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
};

export const logout = async (): Promise<LogoutResponse> => {
    const response = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
    });
    return response.json();
};

// User

export interface GetProfileResponse {
    message: string;
    user: User & { createdAt: string; updatedAt: string };
    userDetails: UserDetails;
    decks: Deck[];
    statistics: ProfileStatistics;
}

export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    aboutMe?: string;
}

export interface UpdateUserResponse {
    message: string;
    user: User;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface FollowersResponse {
    message: string;
    followers: FollowUser[];
    count: number;
}

export interface FollowingResponse {
    message: string;
    following: FollowUser[];
    count: number;
}

export const getProfile = async (
    userId: string,
): Promise<GetProfileResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/users/${userId}`);
    return response.json();
};

export const updateUser = async (
    userId: string,
    token: string,
    data: UpdateUserRequest,
): Promise<UpdateUserResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/users/${userId}?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
};

export const changePassword = async (
    token: string,
    data: ChangePasswordRequest,
): Promise<{ message: string } | ApiError> => {
    const response = await fetch(`${BASE_URL}/change_password?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
};

export const follow = async (
    userId: string,
    token: string,
): Promise<{ message: string } | ApiError> => {
    const response = await fetch(
        `${BASE_URL}/users/${userId}/follow?token=${token}`,
        {
            method: 'POST',
        },
    );
    return response.json();
};

export const unfollow = async (
    userId: string,
    token: string,
): Promise<{ message: string } | ApiError> => {
    const response = await fetch(
        `${BASE_URL}/users/${userId}/unfollow?token=${token}`,
        {
            method: 'DELETE',
        },
    );
    return response.json();
};

export const getFollowers = async (
    userId: string,
): Promise<FollowersResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/users/${userId}/followers`);
    return response.json();
};

export const getFollowing = async (
    userId: string,
): Promise<FollowingResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/users/${userId}/following`);
    return response.json();
};

// Deck

export interface DecksResponse {
    message: string;
    decks: Deck[];
}

export interface DeckResponse {
    message: string;
    deck: Deck;
}

export interface CreateDeckRequest {
    name: string;
    description: string;
    publishStatus?: 'public' | 'private';
}

export interface UpdateDeckRequest {
    name?: string;
    description?: string;
    publishStatus?: 'public' | 'private';
}

export const exploreDecks = async (): Promise<DecksResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/decks/explore`);
    return response.json();
};

export const getFeed = async (
    token: string,
): Promise<DecksResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/decks/feed?token=${token}`);
    return response.json();
};

export const getDecks = async (
    token: string,
): Promise<DecksResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/decks?token=${token}`);
    return response.json();
};

export const createDeck = async (
    token: string,
    data: CreateDeckRequest,
): Promise<DeckResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/decks?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
};

export const getDeck = async (
    deckId: string,
): Promise<DeckResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/decks/${deckId}`);
    return response.json();
};

export const updateDeck = async (
    deckId: string,
    token: string,
    data: UpdateDeckRequest,
): Promise<DeckResponse | ApiError> => {
    const response = await fetch(`${BASE_URL}/decks/${deckId}?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
};

export const deleteDeck = async (
    deckId: string,
    token: string,
): Promise<{ message: string } | ApiError> => {
    const response = await fetch(`${BASE_URL}/decks/${deckId}?token=${token}`, {
        method: 'DELETE',
    });
    return response.json();
};

// Card

export interface DeckInfo {
    id: string;
    name: string;
}

export interface CardsResponse {
    message: string;
    cards: Card[];
    deck_info: DeckInfo & { card_count: number };
}

export interface CardResponse {
    message: string;
    card: Card;
    deck_info?: DeckInfo;
}

export interface CreateCardRequest {
    frontText: string;
    backText: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface UpdateCardRequest {
    frontText?: string;
    backText?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export const getCards = async (
    deckId: string,
    token?: string,
): Promise<CardsResponse | ApiError> => {
    const params = token ? `?token=${token}` : '';
    const response = await fetch(`${BASE_URL}/decks/${deckId}/cards${params}`);
    return response.json();
};

export const createCard = async (
    deckId: string,
    token: string,
    data: CreateCardRequest,
): Promise<CardResponse | ApiError> => {
    const response = await fetch(
        `${BASE_URL}/decks/${deckId}/cards?token=${token}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        },
    );
    return response.json();
};

export const getCard = async (
    deckId: string,
    cardId: string,
    token?: string,
): Promise<CardResponse | ApiError> => {
    const params = token ? `?token=${token}` : '';
    const response = await fetch(
        `${BASE_URL}/decks/${deckId}/cards/${cardId}${params}`,
    );
    return response.json();
};

export const updateCard = async (
    deckId: string,
    cardId: string,
    token: string,
    data: UpdateCardRequest,
): Promise<CardResponse | ApiError> => {
    const response = await fetch(
        `${BASE_URL}/decks/${deckId}/cards/${cardId}?token=${token}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        },
    );
    return response.json();
};

export const deleteCard = async (
    deckId: string,
    cardId: string,
    token: string,
): Promise<{ message: string } | ApiError> => {
    const response = await fetch(
        `${BASE_URL}/decks/${deckId}/cards/${cardId}?token=${token}`,
        {
            method: 'DELETE',
        },
    );
    return response.json();
};

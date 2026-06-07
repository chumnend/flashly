import { createContext } from 'react';

import type { User, RegisterRequest, ApiError } from '../services/flashly';

export interface AuthContextType {
    user: User | null;
    token: string | null;
    register: (data: RegisterRequest) => Promise<ApiError | null>;
    login: (email: string, password: string) => Promise<ApiError | null>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    updateUserInContext: (newUser: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

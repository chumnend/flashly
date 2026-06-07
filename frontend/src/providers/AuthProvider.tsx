import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import * as Flashly from '../services/flashly';
import type { User, RegisterRequest, ApiError } from '../services/flashly';

import { AuthContext } from '../context/AuthContext';

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

// Provider

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();

    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem(TOKEN_KEY),
    );

    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? (JSON.parse(stored) as User) : null;
    });

    //  Keep localStorage in sync whenever state changes
    useEffect(() => {
        if (token && user) {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    }, [token, user]);

    const register = async (
        data: RegisterRequest,
    ): Promise<ApiError | null> => {
        const response = await Flashly.register(data);

        if ('error' in response) return response;

        setUser(response.user);
        setToken(response.token);
        navigate('/feed');
        return null;
    };

    const login = async (
        email: string,
        password: string,
    ): Promise<ApiError | null> => {
        const response = await Flashly.login({ email, password });

        if ('error' in response) return response;

        setUser(response.user);
        setToken(response.token);
        navigate('/feed');
        return null;
    };

    const logout = async (): Promise<void> => {
        await Flashly.logout();
        setUser(null);
        setToken(null);
        navigate('/login');
    };

    const value = {
        user,
        token,
        register,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        updateUserInContext: (newUser: User) => {
            setUser(newUser);
        },
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export default AuthProvider;

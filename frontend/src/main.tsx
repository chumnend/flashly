import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './components/App';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorPage from './components/ErrorPage';
import HomePage from './components/HomePage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import ExplorePage from './components/ExplorePage';
import DeckPage from './components/DeckPage';
import DeckManagerPage from './components/DeckManagerPage';
import FeedPage from './components/FeedPage';
import DecksPage from './components/DecksPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';

import './index.css';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'explore', element: <ExplorePage /> },
            { path: 'register', element: <RegisterPage /> },
            { path: 'login', element: <LoginPage /> },
            {
                path: 'feed',
                element: (
                    <ProtectedRoute>
                        <FeedPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'decks',
                element: (
                    <ProtectedRoute>
                        <DecksPage />
                    </ProtectedRoute>
                ),
            },
            { path: 'decks/:deckId', element: <DeckPage /> },
            {
                path: 'decks/:deckId/manage',
                element: (
                    <ProtectedRoute>
                        <DeckManagerPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile/:userId',
                element: (
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'settings',
                element: (
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                ),
            },
            { path: '*', element: <ErrorPage /> },
        ],
    },
]);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);

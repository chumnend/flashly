import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../providers/AuthProvider';

import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar__brand" onClick={() => navigate('/')}>
        Flashly
      </div>

      <div className="navbar__actions">
        {isAuthenticated ? (
          <>
            <NavLink to="/explore" className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}>
                Explore
            </NavLink>
            <NavLink to="/feed" className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}>
                Feed
            </NavLink>
            <NavLink to="/decks" className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}>
                My Decks
            </NavLink>
            <NavLink
              to={`/profile/${user?.id}`}
              className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}
            >
                {user?.firstName}
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}>
                Settings
            </NavLink>
            <button className="navbar__button navbar__button--ghost" onClick={handleLogout}>
                Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/explore" className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}>
                Explore
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}>
                Log in
            </NavLink>
            <NavLink to="/register" className="navbar__button navbar__button--primary">
                Sign up
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

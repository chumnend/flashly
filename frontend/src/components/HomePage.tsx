import { Link } from 'react-router-dom';

import { useAuth } from '../providers/AuthProvider'; 

import './HomePage.css';


const features = [
  {
    icon: '⚡',
    title: 'Build decks fast',
    description: 'Create flashcard decks in seconds. Front, back, done.',
  },
  {
    icon: '🌍',
    title: 'Share with anyone',
    description: 'Publish your decks publicly and let the world learn from them.',
  },
  {
    icon: '📈',
    title: 'Track your progress',
    description: 'See success rates and review counts grow as you study.',
  },
];

const HomePage = () => {
    const { isAuthenticated } = useAuth();
 
    return (
        <div className="home">
            {/* Background grid */}
            <div className="home__grid" aria-hidden="true" />

            {/* Hero */}
            <section className="home__hero">
                <div className="home__eyebrow">Flash. Learn. Repeat.</div>
                 <h1 className="home__headline">
                    The fastest way to<br />
                    <span className="home__headline--accent">learn anything.</span>
                </h1>
                    <p className="home__subheadline">
                        Flashly lets you create, organize, and share flashcard decks —
                        then study them until you actually know the material.
                    </p>
    
                {isAuthenticated ? (
                    <div className="home__cta-group">
                    <Link to="/decks" className="home__cta home__cta--primary">
                        My Decks
                    </Link>
                    <Link to="/explore" className="home__cta home__cta--ghost">
                        Explore decks →
                    </Link>
                    </div>
                ) : (
                    <div className="home__cta-group">
                    <Link to="/register" className="home__cta home__cta--primary">
                        Create a free account
                    </Link>
                    <Link to="/login" className="home__cta home__cta--ghost">
                        Already have one? Log in →
                    </Link>
                    </div>
                )}
            </section>

            {/* Features */}
            <section className="home__features">
                {features.map((f) => (
                    <div key={f.title} className="home__feature">
                    <div className="home__feature-icon">{f.icon}</div>
                    <h3 className="home__feature-title">{f.title}</h3>
                    <p className="home__feature-desc">{f.description}</p>
                    </div>
                ))}
            </section>

            {/* Bottom CTA — only for guests */}
            {!isAuthenticated && (
                <section className="home__bottom-cta">
                    <h2 className="home__bottom-cta-heading">
                    Ready to start learning?
                    </h2>
                    <p className="home__bottom-cta-sub">
                    Join Flashly for free. No credit card required.
                    </p>
                    <Link to="/register" className="home__cta home__cta--primary">
                    Get started
                    </Link>
                </section>
            )}
        </div>
    );
};

export default HomePage;

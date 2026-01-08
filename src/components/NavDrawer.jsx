import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, ChefHat, ShoppingBag, X } from 'lucide-react';

const NavDrawer = ({ isOpen, onClose }) => {
    const location = useLocation();

    // Helper to check active state
    const isActive = (path) => location.pathname === path;

    return (
        <>
            <div
                className={`nav-db-overlay ${isOpen ? 'open' : ''}`}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 1000,
                    display: isOpen ? 'block' : 'none',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.3s'
                }}
                onClick={onClose}
            ></div>

            <div className={`nav-drawer ${isOpen ? 'open' : ''}`}>
                <div className="nav-header">
                    <h2>Menu</h2>
                    <button className="icon-btn" onClick={onClose}>
                        <X />
                    </button>
                </div>

                <div className="nav-links">
                    <Link
                        to="/"
                        className={`nav-link ${isActive('/') ? 'active' : ''}`}
                        onClick={onClose}
                        style={{ color: isActive('/') ? 'var(--accent-green)' : 'inherit', background: isActive('/') ? '#f0f7f5' : 'transparent' }}
                    >
                        <Home size={20} />
                        <span>POS Terminal</span>
                    </Link>

                    <Link
                        to="/kitchen"
                        className={`nav-link ${isActive('/kitchen') ? 'active' : ''}`}
                        onClick={onClose}
                        style={{ color: isActive('/kitchen') ? 'var(--accent-green)' : 'inherit', background: isActive('/kitchen') ? '#f0f7f5' : 'transparent' }}
                    >
                        <ChefHat size={20} />
                        <span>Kitchen Display</span>
                    </Link>

                    <Link
                        to="/admin"
                        className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                        onClick={onClose}
                        style={{ color: isActive('/admin') ? 'var(--accent-green)' : 'inherit', background: isActive('/admin') ? '#f0f7f5' : 'transparent' }}
                    >
                        <Settings size={20} />
                        <span>Admin Panel</span>
                    </Link>
                </div>

                <div className="dev-credit" style={{ borderTop: 'none', paddingTop: '10px' }}>
                    Version 1.0.0
                </div>
            </div>
        </>
    );
};

export default NavDrawer;

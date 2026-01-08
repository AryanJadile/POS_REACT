import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const Header = ({ onMenuClick, onSearch }) => {
    const { toggleCart, cart } = useCart();
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchClick = () => {
        setIsSearchActive(!isSearchActive);
        if (isSearchActive) {
            setSearchTerm('');
            onSearch('');
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        onSearch(e.target.value);
    };

    const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

    return (
        <header className="sales-header">
            <button className="menu-btn" onClick={onMenuClick}>
                <i className="fas fa-bars"></i>
            </button>
            <h1>RestoFlow</h1>
            <div className="header-actions">
                <div className="search-wrapper">
                    <input
                        type="text"
                        id="search-input"
                        className={isSearchActive ? 'active' : ''}
                        placeholder="Search RestoFlow"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onBlur={() => !searchTerm && setIsSearchActive(false)}
                    />
                    <button className="icon-btn" id="search-btn" onClick={handleSearchClick}>
                        <i className="fas fa-search"></i>
                    </button>
                </div>

                <button className="icon-btn" id="cart-toggle" onClick={toggleCart}>
                    <i className="fas fa-shopping-cart"></i>
                    {cartCount > 0 && <span className="cart-badge" style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: '#ff4444',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        border: '2px solid white', // Adds a nice cutout effect
                        transform: 'translate(25%, -25%)' // Moves it slightly out to the corner
                    }}>{cartCount}</span>}
                </button>
            </div>
        </header>
    );
};

export default Header;

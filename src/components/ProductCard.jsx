import React from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();

    // Helper to fix relative paths from legacy DB
    const getSafeImage = (url) => {
        if (!url) return '/icons/icons8-no-image.png'; // Make sure this icon exists or use a placeholder
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return url;
        // If it comes as "img/food.jpg" -> "/img/food.jpg"
        return `/${url}`;
    };

    return (
        <div className="card" onClick={() => addToCart(product)}>
            <div className="prod-img">
                <img
                    src={getSafeImage(product.img)}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                />
            </div>
            <div className="prod-details">
                <h3>{product.name}</h3>
                <p className="price">₹{Number(product.price).toFixed(2)}</p>
            </div>
        </div>
    );
};

export default ProductCard;

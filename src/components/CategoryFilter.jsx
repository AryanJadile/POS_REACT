import React, { useState } from 'react';

const CategoryFilter = ({ onSelectCategory }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Using original icons from legacy_backup/icons which should be in public/icons now
    const categories = [
        { id: 'north', name: 'North', color: 'cat-orange', icon: 'https://img.icons8.com/color/96/naan.png' },
        { id: 'south', name: 'South', color: 'cat-red', icon: 'https://img.icons8.com/external-icongeek26-flat-icongeek26/64/external-masala-dosa-fine-dining-icongeek26-flat-icongeek26.png' },
        { id: 'chinese', name: 'Chinese', color: 'cat-purple', icon: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-chinese-food-food-delivery-flaticons-lineal-color-flat-icons.png' },
        { id: 'desserts', name: 'Desserts', color: 'cat-green', icon: 'https://img.icons8.com/color/48/doughnut.png' },
        { id: 'beverages', name: 'Beverages', color: 'cat-green', icon: 'https://img.icons8.com/dusk/64/tea--v1.png' },
    ];

    return (
        <div className="category-wrapper">
            <div className="category-card cat-blue" id="cat-trigger" onClick={() => setIsOpen(!isOpen)}>
                <div className="cat-icon">
                    <img height="48" width="48" src="/icons/icons8-category.gif" alt="Category" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '📂' }} />
                </div>
                <span>Category</span>
            </div>

            <div className={`category-drawer ${isOpen ? 'open' : ''}`} id="cat-drawer">
                <div className="category-card" onClick={() => onSelectCategory('all')} style={{ minWidth: '80px' }}>
                    {/* Using a generic 'All' icon or text */}
                    <span style={{ fontSize: '24px' }}>🍽️</span>
                    <span>All</span>
                </div>
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className={`category-card ${cat.color}`}
                        onClick={() => onSelectCategory(cat.id)}
                    >
                        <div className="cat-icon">
                            <img width="40" height="40" src={cat.icon} alt={cat.name} />
                        </div>
                        <span>{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryFilter;

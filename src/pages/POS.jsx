import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import CartSidebar from '../components/CartSidebar';
import NavDrawer from '../components/NavDrawer';
import { useCart } from '../context/CartContext';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [category, setCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const { cart } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (category === 'all') {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p => p.category === category));
        }
    }, [category, products]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*');

            if (error || !data) {
                console.warn('Supabase fetch failed/empty, using mock data:', error);
                setProducts([
                    { id: 1, name: 'Paneer Butter Masala', price: 250, category: 'north', image_url: 'https://img.icons8.com/color/96/naan.png' },
                    { id: 2, name: 'Masala Dosa', price: 120, category: 'south', image_url: 'https://img.icons8.com/external-icongeek26-flat-icongeek26/64/external-masala-dosa-fine-dining-icongeek26-flat-icongeek26.png' },
                    { id: 3, name: 'Veg Hakka Noodles', price: 180, category: 'chinese', image_url: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-chinese-food-food-delivery-flaticons-lineal-color-flat-icons.png' },
                    { id: 4, name: 'Chocolate Brownie', price: 150, category: 'desserts', image_url: 'https://img.icons8.com/color/48/doughnut.png' },
                    { id: 5, name: 'Iced Tea', price: 80, category: 'beverages', image_url: 'https://img.icons8.com/dusk/64/tea--v1.png' },
                ]);
            } else {
                setProducts(data);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setProducts([
                { id: 1, name: 'Paneer Butter Masala', price: 250, category: 'north', image_url: 'https://img.icons8.com/color/96/naan.png' },
                { id: 2, name: 'Masala Dosa', price: 120, category: 'south', image_url: 'https://img.icons8.com/external-icongeek26-flat-icongeek26/64/external-masala-dosa-fine-dining-icongeek26-flat-icongeek26.png' },
                { id: 3, name: 'Veg Hakka Noodles', price: 180, category: 'chinese', image_url: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-chinese-food-food-delivery-flaticons-lineal-color-flat-icons.png' },
                { id: 4, name: 'Chocolate Brownie', price: 150, category: 'desserts', image_url: 'https://img.icons8.com/color/48/doughnut.png' },
                { id: 5, name: 'Iced Tea', price: 80, category: 'beverages', image_url: 'https://img.icons8.com/dusk/64/tea--v1.png' },
            ]);
        }
        setIsLoading(false);
    };

    const handleSearch = (term) => {
        if (!term) {
            if (category === 'all') setFilteredProducts(products);
            else setFilteredProducts(products.filter(p => p.category === category));
            return;
        }
        const lowerTerm = term.toLowerCase();
        setFilteredProducts(products.filter(p =>
            p.name.toLowerCase().includes(lowerTerm)
        ));
    };

    return (
        <div className="app-container">
            <main className="main-sales">
                <Header onMenuClick={() => setIsNavOpen(true)} onSearch={handleSearch} />

                <CategoryFilter onSelectCategory={setCategory} />

                <div className="product-grid" id="product-container">
                    {isLoading ? (
                        <p>Loading products...</p>
                    ) : filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p>No products found.</p>
                    )}
                </div>
            </main>

            <CartSidebar />
            <NavDrawer isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
        </div>
    );
};

export default POS;

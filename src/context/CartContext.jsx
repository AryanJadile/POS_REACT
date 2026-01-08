import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prevCart, { ...product, qty: 1 }];
        });
        setIsCartOpen(true);
    };

    const updateQty = (id, change) => {
        setCart((prevCart) => {
            return prevCart.map((item) => {
                if (item.id === id) {
                    const newQty = item.qty + change;
                    if (newQty <= 0) return null;
                    return { ...item, qty: newQty };
                }
                return item;
            }).filter(Boolean);
        });
    };

    const removeFromCart = (id) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setCart([]);
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);
    const closeCart = () => setIsCartOpen(false);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            updateQty,
            removeFromCart,
            clearCart,
            subtotal,
            tax,
            total,
            isCartOpen,
            toggleCart,
            closeCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

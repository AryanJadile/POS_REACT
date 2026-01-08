import React from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartSidebar = () => {
    const {
        isCartOpen,
        closeCart,
        cart,
        updateQty,
        removeFromCart,
        subtotal,
        tax,
        total
    } = useCart();

    const navigate = useNavigate();

    return (
        <aside className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
            <div className="cart-header-row" style={{ padding: '20px' }}>
                <h2 className="cart-title">Cart</h2>
                <button className="icon-btn" onClick={closeCart}>
                    <X />
                </button>
            </div>

            <div className="cart-items-list" style={{ padding: '0 20px' }}>
                {cart.length === 0 ? (
                    <p className='empty-cart-msg'>Cart is empty</p>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="cart-item">
                            <img src={item.img || 'https://via.placeholder.com/50'} alt={item.name} />
                            <div className="item-details">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">₹{Number(item.price).toFixed(2)}</span>
                            </div>
                            <div className="qty-control">
                                <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                                <span className="qty-count">{item.qty}</span>
                                <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                            </div>
                            <div className="item-total">
                                ₹{(item.price * item.qty).toFixed(2)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="cart-footer" style={{ padding: '20px' }}>
                <div className="summary-line">
                    <span>Subtotal</span>
                    <span className="summary-val">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                    <span>Tax (5%)</span>
                    <span className="summary-val">₹{tax.toFixed(2)}</span>
                </div>
                <div className="summary-line" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <span>Total</span>
                    <span className="summary-val">₹{total.toFixed(2)}</span>
                </div>
                <button className="checkout-btn" onClick={() => {
                    closeCart();
                    navigate('/checkout');
                }}>Checkout</button>
            </div>
            <div className="dev-credit">
                Developed with ❤️ by <a href="https://github.com/AryanJadile" target="_blank" rel="noopener noreferrer"><b>Aryan Jadile</b></a>
            </div>
        </aside>
    );
};

export default CartSidebar;

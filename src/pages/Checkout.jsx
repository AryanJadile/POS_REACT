import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ArrowLeft, CreditCard, Banknote, Divide, Check, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Checkout = () => {
    const { cart, subtotal, tax, total, clearCart } = useCart();
    const navigate = useNavigate();
    const [orderType, setOrderType] = useState('Dine-In');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Modals
    const [showCashModal, setShowCashModal] = useState(false);
    const [cashGiven, setCashGiven] = useState('');
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitCashPart, setSplitCashPart] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);

    // Redirect if empty
    useEffect(() => {
        if (cart.length === 0 && !showSuccessModal) {
            navigate('/');
        }
    }, [cart, navigate, showSuccessModal]);

    const handlePaymentSelect = (method) => {
        setPaymentMethod(method);
        if (method === 'Cash') setShowCashModal(true);
        else if (method === 'Split') setShowSplitModal(true);
        else if (method === 'Online') processOnlinePayment(total);
    };

    const processCashPayment = async () => {
        console.log("Process Cash Payment Triggered");
        console.log("Cash Given Raw:", cashGiven);
        console.log("Total:", total);

        const cash = parseFloat(cashGiven);
        console.log("Parsed Cash:", cash);

        if (isNaN(cash) || cash < total) {
            console.warn("Validation Failed: Insufficient or Invalid Cash");
            alert("Insufficient Cash! Total is " + total);
            return;
        }

        console.log("Validation Passed, Saving Order...");
        await saveOrder('Cash', total, cash);
    };

    const processSplitPayment = () => {
        const cash = parseFloat(splitCashPart);
        if (isNaN(cash) || cash >= total || cash <= 0) {
            alert("Invalid Split Amount");
            return;
        }
        const onlinePart = total - cash;
        processOnlinePayment(onlinePart, true, cash);
    };

    const processOnlinePayment = (amount, isSplit = false, itemsCash = 0) => {
        const options = {
            key: "rzp_test_Ropeu4gvNGl6JJ",
            amount: Math.round(amount * 100),
            currency: "INR",
            name: "RestoFlow",
            description: "Bill Payment",
            handler: async function (response) {
                const method = isSplit ? 'Split' : 'Online';
                await saveOrder(method, total, itemsCash, 0, response.razorpay_payment_id);
            },
            prefill: { name: "Guest", contact: "9999999999" },
            theme: { color: "#378e7d" }
        };

        if (window.Razorpay) {
            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } else {
            alert("Razorpay SDK not loaded.");
        }
    };

    const saveOrder = async (method, totalAmount, cashPaid = 0, changeAmt = 0, txId = null) => {
        setIsProcessing(true);
        const change = method === 'Cash' ? cashPaid - totalAmount : 0;

        // 1. Insert Order (Header)
        const orderPayload = {
            order_type: orderType,
            payment_method: method,
            total_amount: totalAmount, // Matched with legacy 'total_amount'
            cash_given: cashPaid,
            change_returned: change,
            status: 'Completed', // Keeping this hoping it exists or is ignored, remove if fails
            created_at: new Date().toISOString()
        };

        // Remove status if it causes issues, but typically useful. 
        // Based on legacy, strict columns were: payment_method, total_amount, cash_given, change_returned, order_type.
        // I will stick to these + created_at.

        const { data, error } = await supabase.from('orders').insert([{
            order_type: orderType,
            payment_method: method,
            total_amount: totalAmount,
            cash_given: cashPaid,
            change_returned: change,
            // status: 'Completed', // Commenting out to be safe based on legacy
            created_at: new Date().toISOString()
        }]).select();

        if (error) {
            console.error("Order Save Failed", error);
            alert("Failed to save order: " + error.message);
            setIsProcessing(false);
            return;
        }

        const newOrder = data[0];

        // 2. Insert Order Items
        const orderItems = cart.map(item => ({
            order_id: newOrder.id,
            product_name: item.name,
            price: item.price,
            qty: item.qty
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
            console.error("Items Save Failed", itemsError);
            alert("Order saved but items failed: " + itemsError.message);
        }

        // Success
        setLastOrder({ ...newOrder, items: cart });
        setShowCashModal(false);
        setShowSplitModal(false);
        setShowSuccessModal(true);
        setIsProcessing(false);
        clearCart();
    };



    const handlePrintReceipt = () => {
        if (!lastOrder) return alert("No order to print!");

        const date = new Date().toLocaleString();
        let itemsHtml = '';

        const orderItems = lastOrder.items || cart;

        orderItems.forEach(item => {
            itemsHtml += `
                <tr>
                    <td class="item-name">${item.name}</td>
                    <td class="item-qty">${item.qty}</td>
                    <td class="item-price">₹${(item.price * item.qty).toFixed(2)}</td>
                </tr>
            `;
        });

        const receiptContent = `
            <html>
            <head>
                <title>Receipt - RestoFlow</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; width: 300px; padding: 20px; font-size: 13px; color: #333; line-height: 1.4; }
                    .center { text-align: center; }
                    .left { text-align: left; }
                    .right { text-align: right; }
                    .bold { font-weight: 700; }
                    .header-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
                    .header-info { font-size: 0.9rem; color: #666; margin-bottom: 2px; }
                    
                    .divider { border-top: 2px dashed #ddd; margin: 15px 0; }
                    .divider-heavy { border-top: 2px solid #333; margin: 15px 0; }
                    
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; font-size: 0.85rem; text-transform: uppercase; color: #777; padding-bottom: 8px; border-bottom: 1px solid #eee; }
                    td { padding: 8px 0; vertical-align: top; }
                    
                    .item-name { font-weight: 600; }
                    .item-qty { text-align: center; color: #777; }
                    .item-price { text-align: right; font-weight: 600; }
                    
                    .total-section { background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .grand-total { font-size: 1.2rem; font-weight: 800; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 5px; }
                    
                    .footer { margin-top: 30px; text-align: center; font-size: 0.85rem; color: #888; }
                    .footer-thank { font-weight: 600; font-size: 1rem; color: #333; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <div class="center">
                    <div class="header-title">RestoFlow</div>
                    <div class="header-info">123, Food Street, Kothrud</div>
                    <div class="header-info">Pune, MH - 411038</div>
                    <div class="header-info">Ph: +91 98765 43210</div>
                </div>

                <div class="divider"></div>

                <div class="center">
                    <div class="header-info">${date}</div>
                    <div class="bold" style="font-size: 1.1rem; margin-top:5px">ORDER #${String(lastOrder.id).slice(0, 8)}</div>
                    <div class="header-info" style="font-size: 0.85rem; margin-top:2px">Type: ${lastOrder.order_type}</div>
                </div>

                <div class="divider-heavy"></div>

                <table>
                    <thead>
                        <tr>
                            <th width="55%">ITEM</th>
                            <th width="15%" style="text-align:center">QTY</th>
                            <th width="30%" style="text-align:right">AMT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="divider"></div>

                <div class="total-section">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span class="bold">₹${(lastOrder.total_amount / 1.05).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Service Tax (5%)</span>
                        <span>₹${(lastOrder.total_amount - (lastOrder.total_amount / 1.05)).toFixed(2)}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>TOTAL</span>
                        <span>₹${lastOrder.total_amount.toFixed(2)}</span>
                    </div>
                    <div class="total-row" style="margin-top: 8px; font-size: 0.9rem; color: #555;">
                        <span>Paid via ${lastOrder.payment_method}</span>
                    </div>
                </div>

                <div class="footer">
                    <div class="footer-thank">Thank You for Dining!</div>
                    <div>Please visit again soon.</div>
                    <div style="margin-top: 10px; font-size: 0.7rem;">Powered by RestoFlow POS</div>
                </div>
                
                <script>
                    window.print();
                    setTimeout(() => window.close(), 1000);
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '', 'height=600,width=400');
        printWindow.document.write(receiptContent);
        printWindow.document.close();
    };

    return (
        <motion.div
            className="checkout-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="checkout-header">
                <button className="icon-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={28} />
                </button>
                <h1>Checkout & Payment</h1>
            </div>

            <div className="checkout-grid">
                {/* Left Column: Order Summary */}
                <div className="order-summary-card">
                    <h2 style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Order Summary</h2>

                    <div className="checkout-items-list">
                        {cart.map(item => (
                            <div key={item.id} className="order-card">
                                <img src={item.img || 'https://via.placeholder.com/60'} alt={item.name} />
                                <div className="order-card-info">
                                    <h3>{item.name}</h3>
                                    <p>Qty: {item.qty} &times; ₹{item.price}</p>
                                </div>
                                <div className="order-card-price">
                                    ₹{item.price * item.qty}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="checkout-totals">
                        <div className="total-row"><span>Subtotal (Items: {cart.length})</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <div className="total-row"><span>Service Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
                        <div className="total-row final"><span>Total Payable</span><span>₹{total.toFixed(2)}</span></div>
                    </div>
                </div>

                {/* Right Column: Payment & Details */}
                <div className="payment-section-card">

                    <div>
                        <h3 style={{ marginBottom: '10px', color: '#555' }}>Order Type</h3>
                        <div className="order-type-toggle">
                            {['Dine-In', 'Takeaway', 'Delivery'].map(type => (
                                <button
                                    key={type}
                                    className={`type-option ${orderType === type ? 'active' : ''}`}
                                    onClick={() => setOrderType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ marginBottom: '15px', color: '#555' }}>Select Payment Method</h3>
                        <div className="payment-methods-grid">
                            <div
                                className={`pay-card ${paymentMethod === 'Cash' ? 'active' : ''}`}
                                onClick={() => handlePaymentSelect('Cash')}
                            >
                                <div className="pay-icon-wrapper"><Banknote size={28} /></div>
                                <div className="pay-info">
                                    <h3>Cash Payment</h3>
                                    <p>Pay at counter, return change</p>
                                </div>
                                {paymentMethod === 'Cash' && <Check size={24} color="#378e7d" style={{ marginLeft: 'auto' }} />}
                            </div>

                            <div
                                className={`pay-card ${paymentMethod === 'Online' ? 'active' : ''}`}
                                onClick={() => handlePaymentSelect('Online')}
                            >
                                <div className="pay-icon-wrapper"><CreditCard size={28} /></div>
                                <div className="pay-info">
                                    <h3>Online / Card</h3>
                                    <p>UPI, Credit/Debit Cards</p>
                                </div>
                                {paymentMethod === 'Online' && <Check size={24} color="#378e7d" style={{ marginLeft: 'auto' }} />}
                            </div>

                            <div
                                className={`pay-card ${paymentMethod === 'Split' ? 'active' : ''}`}
                                onClick={() => handlePaymentSelect('Split')}
                            >
                                <div className="pay-icon-wrapper"><Divide size={28} /></div>
                                <div className="pay-info">
                                    <h3>Split Payment</h3>
                                    <p>Part Cash + Part Online</p>
                                </div>
                                {paymentMethod === 'Split' && <Check size={24} color="#378e7d" style={{ marginLeft: 'auto' }} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals with AnimatePresence */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-box"
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            style={{ textAlign: 'center', padding: '40px' }}
                        >
                            <div style={{ fontSize: '5rem', color: '#378e7d', marginBottom: '10px' }}>✓</div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Order Placed!</h2>
                            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '20px' }}>Order ID: #{lastOrder?.id}</p>

                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '25px' }}>
                                <p style={{ margin: 0, fontWeight: 600 }}>Total Paid: ₹{lastOrder?.total_amount?.toFixed(2)}</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#888' }}>Receipt is being printed...</p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-secondary" onClick={handlePrintReceipt} style={{ flex: 1, padding: '15px', fontSize: '1.1rem' }}>
                                    <Receipt size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    Print Bill
                                </button>
                                <button className="btn-primary" onClick={() => navigate('/')} style={{ flex: 1, padding: '15px', fontSize: '1.1rem' }}>
                                    Start New Order
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showCashModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-box"
                            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                            style={{ maxWidth: '400px' }}
                        >
                            <div className="payment-modal-header">
                                <div className="payment-icon-large">
                                    <Banknote size={36} />
                                </div>
                                <div className="bill-amount-label">Total Amount Payable</div>
                                <div className="bill-amount-value">₹{total.toFixed(2)}</div>
                            </div>

                            <div className="cash-input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#555', textAlign: 'left' }}>Cash Received</label>
                                <div style={{ position: 'relative' }}>
                                    <span className="currency-prefix">₹</span>
                                    <input
                                        className="cash-input"
                                        type="number"
                                        placeholder="0"
                                        value={cashGiven}
                                        onChange={e => setCashGiven(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="suggestion-chips">
                                {[
                                    Math.ceil(total / 10) * 10,
                                    Math.ceil(total / 100) * 100,
                                    500,
                                    2000
                                ]
                                    .reduce((acc, curr) => {
                                        if (!acc.includes(curr) && curr >= total) acc.push(curr);
                                        return acc;
                                    }, [])
                                    .sort((a, b) => a - b)
                                    .slice(0, 4)
                                    .map(amt => (
                                        <button
                                            key={amt}
                                            className="chip"
                                            onClick={() => setCashGiven(amt.toString())}
                                        >
                                            ₹{amt}
                                        </button>
                                    ))}
                            </div>

                            {cashGiven && parseFloat(cashGiven) >= total && (
                                <div className="change-display">
                                    <div className="change-label">Change to Return</div>
                                    <div className="change-value">₹{(parseFloat(cashGiven) - total).toFixed(2)}</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCashModal(false)}>Cancel</button>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={processCashPayment}>Place Order</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showSplitModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-box"
                            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                            style={{ maxWidth: '400px' }}
                        >
                            <div className="payment-modal-header">
                                <div className="payment-icon-large">
                                    <Divide size={36} />
                                </div>
                                <div className="bill-amount-label">Total Bill Amount</div>
                                <div className="bill-amount-value">₹{total.toFixed(2)}</div>
                            </div>

                            <div className="cash-input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#555', textAlign: 'left' }}>Cash Portion</label>
                                <div style={{ position: 'relative' }}>
                                    <span className="currency-prefix">₹</span>
                                    <input
                                        className="cash-input"
                                        type="number"
                                        placeholder="0"
                                        value={splitCashPart}
                                        onChange={e => setSplitCashPart(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="split-breakdown">
                                <div className="split-row">
                                    <span className="split-label">Cash Paid</span>
                                    <span className="split-value">₹ {splitCashPart || '0.00'}</span>
                                </div>
                                <div className="split-row">
                                    <span className="split-label">Online Balance</span>
                                    <span className="split-value highlight">
                                        ₹ {splitCashPart ? (total - parseFloat(splitCashPart || 0)).toFixed(2) : total.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowSplitModal(false)}>Cancel</button>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={processSplitPayment}>Proceed to Online Pay</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
};

export default Checkout;

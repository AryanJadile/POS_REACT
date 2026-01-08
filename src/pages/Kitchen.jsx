import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Volume2, CheckCircle, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Kitchen = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [orders, setOrders] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const audioRef = useRef(new Audio('/img/notification.mp3')); // Assuming path

    useEffect(() => {
        const storedAuth = localStorage.getItem('chef_auth');
        if (storedAuth) setIsAuthenticated(true);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRecentOrders();
            const channel = subscribeToOrders();
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isAuthenticated]);

    const handleLogin = () => {
        // Simple mock auth
        if (password === 'chef123' || password === 'admin123') {
            setIsAuthenticated(true);
            localStorage.setItem('chef_auth', 'true');
        } else {
            alert('Incorrect Password');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('chef_auth');
        navigate('/');
    };

    const fetchRecentOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .neq('status', 'done')
            .order('created_at', { ascending: true }); // Oldest first

        if (data) setOrders(data);
    };

    const subscribeToOrders = () => {
        const channel = supabase
            .channel('kitchen-orders')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                (payload) => {
                    console.log('New Order:', payload.new);
                    setOrders(prev => [...prev, payload.new]);
                    playSound();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setIsConnected(true);
            });
        return channel;
    };

    const playSound = () => {
        audioRef.current.play().catch(e => console.log("Audio require interaction", e));
    };

    const markDone = async (id) => {
        // Optimistic update
        setOrders(prev => prev.filter(o => o.id !== id));

        const { error } = await supabase
            .from('orders')
            .update({ status: 'done' })
            .eq('id', id);

        if (error) {
            console.error('Error completing order', error);
            fetchRecentOrders(); // Revert on error
        }
    };

    if (!isAuthenticated) {
        if (!isAuthenticated) {
            return (
                <div className="login-overlay">
                    <div className="login-box">
                        <div style={{ marginBottom: '20px', fontSize: '3rem' }}>👨‍🍳</div>
                        <h2>Kitchen Display</h2>
                        <p>Enter access PIN to continue</p>

                        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                            <input
                                type="password"
                                placeholder="Enter PIN"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '15px' }}>
                                Access Dashboard
                            </button>
                        </form>

                        <button
                            className="btn-secondary"
                            onClick={() => navigate('/')}
                            style={{
                                background: 'transparent',
                                color: '#757575',
                                border: '1px solid #ddd',
                                borderRadius: '10px',
                                padding: '12px',
                                width: '100%',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            ← Back to POS
                        </button>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="app-container" style={{ background: '#222', color: 'white', minHeight: '100vh', padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1>Kitchen Display</h1>
                    <span style={{
                        fontSize: '0.8rem',
                        background: isConnected ? '#4caf50' : '#f44336',
                        padding: '4px 8px',
                        borderRadius: '10px'
                    }}>
                        {isConnected ? '● LIVE' : '○ DISCONNECTED'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={playSound} className="icon-btn" style={{ color: 'white' }}><Volume2 /></button>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#ff4444',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'transform 0.1s, background 0.2s',
                            boxShadow: '0 2px 5px rgba(255, 68, 68, 0.3)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#cc0000'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#ff4444'}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <div className="kitchen-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px'
            }}>
                {orders.length === 0 ? (
                    <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center' }}>No active orders</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} style={{
                            background: '#333',
                            borderRadius: '10px',
                            padding: '15px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            borderLeft: `5px solid ${getTypeColor(order.order_type)}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>#{String(order.id).slice(-4)}</span>
                                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                <span style={{ background: '#444', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{order.order_type}</span>
                                <span style={{ background: '#444', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{order.payment_method}</span>
                            </div>

                            <div className="items-list" style={{ marginBottom: '15px', maxHeight: '200px', overflowY: 'auto' }}>
                                {(order.items || []).map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#4ade80' }}>{item.qty}x</span>
                                        <span>{item.name}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => markDone(order.id)}
                                style={{
                                    width: '100%',
                                    background: '#4ade80',
                                    color: 'black',
                                    border: 'none',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <CheckCircle size={16} /> DONE
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const getTypeColor = (type) => {
    if (type === 'Dine-In') return '#2196f3'; // Blue
    if (type === 'Takeaway') return '#ff9800'; // Orange
    return '#ccc';
};

export default Kitchen;

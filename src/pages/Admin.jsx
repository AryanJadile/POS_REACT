import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Trash2, Plus, Edit, FileText, RefreshCw, LogOut, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('menu'); // menu | orders

    // Data
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: '', category: 'north', img: '' });

    useEffect(() => {
        if (isAuthenticated) {
            if (activeTab === 'menu') fetchProducts();
            else fetchOrders();
        }
    }, [isAuthenticated, activeTab]);

    const handleLogin = () => {
        if (password === 'admin123') setIsAuthenticated(true);
        else alert('Invalid Password');
    };

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await supabase.from('products').select('*');
        setProducts(data || []);
        setLoading(false);
    };

    const fetchOrders = async () => {
        setLoading(true);
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        setOrders(data || []);
        setLoading(false);
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Delete this product?')) return;
        await supabase.from('products').delete().eq('id', id);
        fetchProducts();
    };

    const handleAddProduct = async () => {
        if (!formData.name || !formData.price || !formData.category) return;

        await supabase.from('products').insert([{
            name: formData.name,
            price: parseFloat(formData.price),
            category: formData.category,
            img: formData.img || null
        }]);

        setShowForm(false);
        setFormData({ name: '', price: '', category: 'north', img: '' });
        fetchProducts();
    };

    if (!isAuthenticated) {
        return (
            <div className="login-overlay">
                <div className="login-box">
                    <div style={{ marginBottom: '20px', fontSize: '3rem' }}>🛡️</div>
                    <h2>Admin Panel</h2>
                    <p>Enter secure password to continue</p>

                    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                        <input
                            type="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '15px' }}>
                            Login to Dashboard
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

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    return (
        <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar Navigation Drawer */}
            <aside style={{
                width: '260px',
                background: 'white',
                borderRight: '1px solid #eee',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                zIndex: 10
            }}>
                <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '1.5rem' }}>🛡️</div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Admin Panel</h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <button
                        onClick={() => setActiveTab('menu')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 15px',
                            borderRadius: '10px',
                            border: 'none',
                            background: activeTab === 'menu' ? 'var(--accent-green)' : 'transparent',
                            color: activeTab === 'menu' ? 'white' : '#555',
                            cursor: 'pointer',
                            fontWeight: '500',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FileText size={20} />
                        Menu Management
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 15px',
                            borderRadius: '10px',
                            border: 'none',
                            background: activeTab === 'orders' ? 'var(--accent-green)' : 'transparent',
                            color: activeTab === 'orders' ? 'white' : '#555',
                            cursor: 'pointer',
                            fontWeight: '500',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={20} />
                        Order History
                    </button>
                </nav>

                <div className="dev-credit" style={{ borderTop: 'none', textAlign: 'left', fontSize: '0.8rem' }}>
                    RestoFlow v1.0
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#f8f9fa', padding: '0' }}>
                <header style={{
                    background: 'white',
                    padding: '15px 30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #eee',
                    position: 'sticky',
                    top: 0,
                    zIndex: 5
                }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                        {activeTab === 'menu' ? 'Menu Management' : 'Order History'}
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="btn-ghost"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#ff4444',
                            fontWeight: '600',
                            padding: '8px 15px',
                            borderRadius: '8px'
                        }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </header>

                <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
                    {activeTab === 'menu' ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                                <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={18} /> Add New Item
                                </button>
                            </div>

                            {showForm && (
                                <div className="modal-overlay">
                                    <div className="modal-box">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h3 style={{ margin: 0 }}>Add New Product</h3>
                                            <button onClick={() => setShowForm(false)} className="icon-btn" style={{ padding: '5px' }}>✕</button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>Product Name</label>
                                                <input
                                                    placeholder="e.g. Butter Chicken"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}
                                                />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>Price (₹)</label>
                                                    <input
                                                        placeholder="0.00"
                                                        type="number"
                                                        value={formData.price}
                                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}
                                                    />
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>Category</label>
                                                    <div
                                                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #ddd',
                                                            background: 'white',
                                                            outline: 'none',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <span style={{ color: '#333' }}>
                                                            {formData.category === 'north' ? 'North Indian' :
                                                                formData.category === 'south' ? 'South Indian' :
                                                                    formData.category === 'chinese' ? 'Chinese' :
                                                                        formData.category === 'desserts' ? 'Desserts' : 'Beverages'}
                                                        </span>
                                                        <ChevronDown size={18} color="#999" />
                                                    </div>

                                                    {isCategoryOpen && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '110%',
                                                            left: 0,
                                                            width: '100%',
                                                            background: 'white',
                                                            borderRadius: '10px',
                                                            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                                                            border: '1px solid #eee',
                                                            zIndex: 100,
                                                            overflow: 'hidden',
                                                            animation: 'fadeIn 0.2s ease'
                                                        }}>
                                                            {[
                                                                { val: 'north', label: 'North Indian' },
                                                                { val: 'south', label: 'South Indian' },
                                                                { val: 'chinese', label: 'Chinese' },
                                                                { val: 'desserts', label: 'Desserts' },
                                                                { val: 'beverages', label: 'Beverages' }
                                                            ].map((opt) => (
                                                                <div
                                                                    key={opt.val}
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, category: opt.val });
                                                                        setIsCategoryOpen(false);
                                                                    }}
                                                                    style={{
                                                                        padding: '12px 15px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        background: formData.category === opt.val ? '#f0f9ff' : 'white',
                                                                        color: formData.category === opt.val ? 'var(--accent-green)' : '#333',
                                                                        transition: 'background 0.2s',
                                                                        borderBottom: '1px solid #f9f9f9'
                                                                    }}
                                                                    onMouseEnter={(e) => { if (formData.category !== opt.val) e.currentTarget.style.background = '#f8f9fa' }}
                                                                    onMouseLeave={(e) => { if (formData.category !== opt.val) e.currentTarget.style.background = 'white' }}
                                                                >
                                                                    {opt.label}
                                                                    {formData.category === opt.val && <Check size={16} />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>Image URL <span style={{ color: '#aaa', fontWeight: 400 }}>(Optional)</span></label>
                                                <input
                                                    placeholder="https://..."
                                                    value={formData.img}
                                                    onChange={e => setFormData({ ...formData, img: e.target.value })}
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ padding: '12px 20px' }}>Cancel</button>
                                            <button className="btn-primary" onClick={handleAddProduct} style={{ padding: '12px 20px' }}>Save Product</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="table-responsive" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f9fafb' }}>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600', fontSize: '0.9rem' }}>Product Name</th>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600', fontSize: '0.9rem' }}>Category</th>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600', fontSize: '0.9rem' }}>Price</th>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600', fontSize: '0.9rem', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '15px 20px', fontWeight: '500' }}>{p.name}</td>
                                                <td style={{ padding: '15px 20px' }}>
                                                    <span style={{
                                                        background: '#eef2ff', color: '#4f46e5',
                                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', textTransform: 'capitalize'
                                                    }}>
                                                        {p.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₹{Number(p.price).toFixed(2)}</td>
                                                <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                                    <button
                                                        className="icon-btn"
                                                        onClick={() => handleDeleteProduct(p.id)}
                                                        style={{
                                                            color: '#ef4444',
                                                            background: '#fee2e2',
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Order History Content */}
                            <div className="table-responsive" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f9fafb' }}>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600' }}>Order ID</th>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600' }}>Type</th>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600' }}>Items</th>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600' }}>Total</th>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600' }}>Payment</th>
                                            <th style={{ padding: '15px 20px', color: '#666', fontWeight: '600' }}>Date & Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '15px 20px', fontFamily: 'monospace', fontWeight: 'bold' }}>#{o.id}</td>
                                                <td style={{ padding: '15px 20px' }}>{o.order_type}</td>
                                                <td style={{ padding: '15px 20px' }}>{o.items?.length || 0}</td>
                                                <td style={{ padding: '15px 20px', fontWeight: 'bold', color: 'var(--accent-green)' }}>₹{Number(o.total).toFixed(2)}</td>
                                                <td style={{ padding: '15px 20px' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: '4px', background: '#f3f4f6', fontSize: '0.85rem' }}>{o.payment_method}</span>
                                                </td>
                                                <td style={{ padding: '15px 20px', fontSize: '0.9rem', color: '#666' }}>
                                                    {new Date(o.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Admin;

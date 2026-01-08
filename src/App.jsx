import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import POS from './pages/POS';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Kitchen from './pages/Kitchen';

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<POS />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/kitchen" element={<Kitchen />} />
      </Routes>
    </CartProvider>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import ReportItem from './pages/ReportItem';
import Marketplace from './pages/Marketplace';
import SellItem from './pages/SellItem';
import Profile from './pages/Profile';
import ClaimItem from './pages/ClaimItem';
import AdminDashboard from './pages/AdminDashboard';
import ChatSection from './pages/ChatSection';
import ItemDetails from './pages/ItemDetails';

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 font-sans text-slate-900">
                    <Navbar />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                        <Route path="/item/:itemId" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />
                        <Route path="/report" element={<ProtectedRoute><ReportItem /></ProtectedRoute>} />
                        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                        <Route path="/sell" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/claim/:itemId" element={<ProtectedRoute><ClaimItem /></ProtectedRoute>} />
                        <Route path="/chat" element={<ProtectedRoute><ChatSection /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/" element={<Navigate to="/feed" />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
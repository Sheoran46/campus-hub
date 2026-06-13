import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, ...userData } = response.data;
            login(token, userData);
            navigate('/feed');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl shadow-cyan-900/5 border border-cyan-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome back
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email address</label>
                            <input
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Password</label>
                            <input
                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all disabled:opacity-70"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <div className="text-center text-sm text-slate-500 mt-4">
                    Don't have an account? <Link to="/register" className="text-cyan-600 hover:text-blue-600 hover:underline font-medium transition-colors">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await api.post('/auth/register', { name, email, password });
            setSuccessMessage(response.data.message || 'Registration successful! Please check your email to verify your account.');
            // We don't navigate immediately so they can read the message to check their email
            setTimeout(() => {
                navigate('/login');
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-bold text-slate-900 tracking-tight">
                        Create an account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}
                    {successMessage && <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-md border border-emerald-200">{successMessage}</div>}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Full Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email address</label>
                            <input
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || successMessage}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>
                <div className="text-center text-sm text-slate-500 mt-4">
                    Already have an account? <Link to="/login" className="text-indigo-600 hover:underline font-medium">Log in</Link>
                </div>
            </div>
        </div>
    );
}
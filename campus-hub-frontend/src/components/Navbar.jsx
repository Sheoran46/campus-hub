import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path ? "text-cyan-600 border-b-2 border-cyan-600" : "text-slate-500 hover:text-cyan-600 transition-colors";
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-cyan-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-extrabold text-blue-600 tracking-tight">Campus<span className="text-cyan-500">Hub</span></span>
                        </Link>
                        {user && (
                            <div className="hidden md:ml-12 md:flex md:space-x-8 h-full">
                                <Link to="/feed" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/feed')}`}>
                                    Lost & Found
                                </Link>
                                <Link to="/marketplace" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/marketplace')}`}>
                                    Marketplace
                                </Link>
                                <Link to="/chat" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/chat')}`}>
                                    Messages
                                </Link>
                                {user.role === 'ADMIN' && (
                                    <Link to="/admin" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/admin')}`}>
                                        Admin Dashboard
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-6">
                        {user ? (
                            <>
                                <Link to="/report" className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all">
                                    Report Item
                                </Link>
                                <Link to="/sell" className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">
                                    Sell Item
                                </Link>
                                <div className="ml-4 flex items-center space-x-4 border-l border-slate-200 pl-4">
                                    <Link to="/profile" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
                                        Hi, {user.name.split(' ')[0]}
                                    </Link>
                                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-x-4 flex items-center">
                                <Link to="/login" className="text-slate-600 font-medium hover:text-cyan-600 transition-colors text-sm">Log in</Link>
                                <Link to="/register" className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Wallet } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null; // Don't show navbar if not logged in

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Wallet size={24} className="nav-icon" />
        <Link to="/">BudgetTracker</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-item">
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        {/* We will add Expenses and Budgets links here later */}
      </div>
      <div className="nav-user">
        <span className="user-greeting">Hi, {user.name}</span>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

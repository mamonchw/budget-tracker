import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Wallet, Receipt, Target, FileText } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  if (!user) return null; // Don't show navbar if not logged in

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Wallet size={24} className="nav-icon" />
        <Link to="/">BudgetTracker</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link to="/expenses" className={`nav-item ${isActive('/expenses')}`}>
          <Receipt size={18} />
          <span>Expenses</span>
        </Link>
        <Link to="/budgets" className={`nav-item ${isActive('/budgets')}`}>
          <Target size={18} />
          <span>Budgets</span>
        </Link>
        <Link to="/reports" className={`nav-item ${isActive('/reports')}`}>
          <FileText size={18} />
          <span>Reports</span>
        </Link>
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

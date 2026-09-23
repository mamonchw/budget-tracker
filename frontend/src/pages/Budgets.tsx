import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Target, Trash2 } from 'lucide-react';

interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

interface BudgetUtilization {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
}

export const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [utilization, setUtilization] = useState<BudgetUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [error, setError] = useState('');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchBudgets = async () => {
    try {
      // Fetch budget list
      const budgetRes = await api.get(`/budgets?month=${currentMonth}&year=${currentYear}`);
      setBudgets(budgetRes.data.data);

      // Fetch utilization from dashboard
      const dashRes = await api.get('/dashboard/summary');
      setUtilization(dashRes.data.data.budgetUtilization);
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post('/budgets', {
        amount: Number(amount),
        category,
        month: currentMonth,
        year: currentYear
      });
      setAmount('');
      fetchBudgets();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to set budget. You can only have one budget per category per month.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      console.error('Failed to delete budget', err);
    }
  };

  if (loading) return <div className="loading-screen">Loading budgets...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Monthly Budgets</h1>
        <p>Set limits for {new Date().toLocaleString('default', { month: 'long' })} {currentYear}.</p>
      </header>

      <div className="dashboard-grid">
        {/* Form Card */}
        <div className="card">
          <h2 className="card-title">
            <Target size={20} /> Set a Budget Limit
          </h2>
          
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleAddBudget} className="auth-form">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Housing">Housing</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Save Budget</button>
          </form>
        </div>

        {/* List Card */}
        <div className="card">
          <h2 className="card-title">Budget Utilization</h2>
          {utilization.length > 0 ? (
            <div className="budget-list">
              {utilization.map((util) => {
                const budgetObj = budgets.find(b => b.category === util.category);
                const isOverBudget = util.spent > util.budget;
                
                return (
                  <div key={util.category} className="budget-item" style={{ marginBottom: '1.5rem' }}>
                    <div className="budget-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="font-medium">{util.category}</span>
                      <span>₹{util.spent.toLocaleString()} / ₹{util.budget.toLocaleString()}</span>
                    </div>
                    
                    <div className="progress-bar-bg" style={{ width: '100%', backgroundColor: '#E2E8F0', height: '12px', borderRadius: '99px', overflow: 'hidden' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${Math.min(util.percentage, 100)}%`, 
                          backgroundColor: isOverBudget ? '#EF4444' : '#2563EB',
                          height: '100%' 
                        }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                      <span>{util.percentage}% Used</span>
                      {budgetObj && (
                        <button onClick={() => handleDelete(budgetObj.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Delete</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">No budgets set for this month.</div>
          )}
        </div>
      </div>
    </div>
  );
};

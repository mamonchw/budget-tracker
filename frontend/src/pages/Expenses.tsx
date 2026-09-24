import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Edit2, Filter, X } from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
}

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');

  const fetchExpenses = async () => {
    try {
      let query = '/expenses?limit=100';
      if (filterCategory) query += `&category=${filterCategory}`;
      if (filterFrom) query += `&from=${filterFrom}`;
      if (filterTo) query += `&to=${filterTo}`;
      if (filterMinAmount) query += `&minAmount=${filterMinAmount}`;
      if (filterMaxAmount) query += `&maxAmount=${filterMaxAmount}`;

      const response = await api.get(query);
      setExpenses(response.data.data.data);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory, filterFrom, filterTo, filterMinAmount, filterMaxAmount]);

  const handleEditClick = (exp: Expense) => {
    setEditingId(exp.id);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setDescription(exp.description || '');
    setDate(new Date(exp.expense_date).toISOString().split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setCategory('Food');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
  };

  const handleClearFilters = () => {
    setFilterCategory('');
    setFilterFrom('');
    setFilterTo('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const payload = {
        amount: Number(amount),
        category,
        description,
        expense_date: new Date(date).toISOString()
      };

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      
      handleCancelEdit();
      fetchExpenses(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save expense.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      if (editingId === id) handleCancelEdit();
      fetchExpenses();
    } catch (err) {
      console.error('Failed to delete expense', err);
    }
  };

  if (loading) return <div className="loading-screen">Loading expenses...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Expenses</h1>
        <p>Track and manage your spending.</p>
      </header>

      <div className="dashboard-grid">
        {/* Form Card */}
        <div className="card" style={{ alignSelf: 'flex-start' }}>
          <h2 className="card-title">
            {editingId ? <Edit2 size={20} /> : <Plus size={20} />} 
            {editingId ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
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

            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Coffee, Rent, etc." />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                {editingId ? 'Update Expense' : 'Add Expense'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="btn-primary" style={{ flex: 1, backgroundColor: '#64748B' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List & Filters Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Expense History</h2>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: showFilters ? '#1D4ED8' : '#2563EB' }}>
              <Filter size={16} /> Filters
            </button>
          </div>

          {showFilters && (
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Category</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-select" style={{ padding: '0.5rem' }}>
                    <option value="">All Categories</option>
                    <option value="Food">Food</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Housing">Housing</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>From Date</label>
                  <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={{ padding: '0.5rem' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>To Date</label>
                  <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={{ padding: '0.5rem' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Min Amount</label>
                  <input type="number" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} style={{ padding: '0.5rem' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Max Amount</label>
                  <input type="number" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} style={{ padding: '0.5rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={handleClearFilters} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                  <X size={14} /> Clear Filters
                </button>
              </div>
            </div>
          )}

          {expenses.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                      <td><span className="badge">{exp.category}</span></td>
                      <td>{exp.description || '-'}</td>
                      <td className="font-medium">₹{exp.amount.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEditClick(exp)} style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer' }}>
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(exp.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No expenses found matching your criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Trash2 } from 'lucide-react';

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
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.data.data);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post('/expenses', {
        amount: Number(amount),
        category,
        description,
        expense_date: new Date(date).toISOString()
      });
      // Reset form
      setAmount('');
      setDescription('');
      fetchExpenses(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add expense.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
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
        <p>Track every penny you spend.</p>
      </header>

      <div className="dashboard-grid">
        {/* Form Card */}
        <div className="card">
          <h2 className="card-title">
            <Plus size={20} /> Add New Expense
          </h2>
          
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleAddExpense} className="auth-form">
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

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Add Expense</button>
          </form>
        </div>

        {/* List Card */}
        <div className="card">
          <h2 className="card-title">Expense History</h2>
          {expenses.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Action</th>
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
                        <button onClick={() => handleDelete(exp.id)} className="btn-icon text-danger">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No expenses found. Start tracking!</div>
          )}
        </div>
      </div>
    </div>
  );
};

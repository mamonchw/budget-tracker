import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IndianRupee, PieChart as PieChartIcon, TrendingDown, Wallet } from 'lucide-react';

interface DashboardSummary {
  totalExpenses: number;
  monthlyExpenses: number;
  totalBudget: number;
  remainingBudget: number;
  categorySpending: { category: string; amount: number }[];
  recentExpenses: { id: string; amount: number; category: string; expense_date: string; description?: string }[];
}

const COLORS = ['#2563EB', '#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setSummary(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="alert-error">Failed to load dashboard data.</div>;
  }

  // Format data for Recharts PieChart
  const pieData = summary.categorySpending.map((item) => ({
    name: item.category,
    value: item.amount,
  }));

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}. Here's your financial overview.</p>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon bg-blue-100 text-blue-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="kpi-label">This Month's Expenses</p>
            <h3 className="kpi-value">₹{summary.monthlyExpenses.toLocaleString()}</h3>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon bg-green-100 text-green-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="kpi-label">Total Monthly Budget</p>
            <h3 className="kpi-value">₹{summary.totalBudget.toLocaleString()}</h3>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon bg-orange-100 text-orange-600">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="kpi-label">Remaining Budget</p>
            <h3 className="kpi-value" style={{ color: summary.remainingBudget < 0 ? '#EF4444' : 'inherit' }}>
              ₹{summary.remainingBudget.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart and Recent Expenses */}
      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">
            <PieChartIcon size={20} />
            Spending by Category
          </h2>
          {pieData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">No expenses found for this month.</div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Recent Expenses</h2>
          {summary.recentExpenses.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                      <td>
                        <span className="badge category-badge">{expense.category}</span>
                      </td>
                      <td className="font-medium">₹{expense.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No recent expenses to show.</div>
          )}
        </div>
      </div>
    </div>
  );
};

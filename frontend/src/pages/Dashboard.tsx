import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { IndianRupee, PieChart as PieChartIcon, TrendingDown, Wallet } from 'lucide-react';

interface DashboardSummary {
  totalExpenses: number;
  monthlyExpenses: number;
  totalBudget: number;
  remainingBudget: number;
  categorySpending: { category: string; amount: number }[];
  dailyTrend: any[];
  yearlyTrend: { month: number; amount: number }[];
  activeCategories: string[];
  recentExpenses: { id: string; amount: number; category: string; expense_date: string; description?: string }[];
}

const COLORS = ['#2563EB', '#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/dashboard/summary?month=${month}&year=${year}`);
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearlyData = summary.yearlyTrend?.map(item => ({
    name: monthNames[item.month - 1],
    amount: item.amount
  })) || [];

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}. Here's your financial overview.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="form-select" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="form-select" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}>
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={fetchDashboard} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            Filter
          </button>
        </div>
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
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
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

      {/* --- TREND CHARTS GRID --- */}
      <div className="dashboard-grid">
        {/* --- DAY-WISE TREND CHART BY CATEGORY --- */}
        <div className="card">
          <h2 className="card-title">
            <TrendingDown size={20} /> Daily Trend ({new Date(0, month - 1).toLocaleString('default', { month: 'long' })})
          </h2>
          <div style={{ height: '250px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.dailyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} tick={{fill: '#64748B', fontSize: 12}} width={60} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                <Tooltip 
                  formatter={(value: number, name: string) => [`₹${value.toLocaleString()}`, name]}
                  labelFormatter={(label) => `Day ${label}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="top" height={36}/>
                {summary.activeCategories && summary.activeCategories.map((category, index) => (
                  <Line 
                    key={category}
                    type="monotone" 
                    dataKey={category} 
                    stroke={COLORS[index % COLORS.length]} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS[index % COLORS.length] }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- YEARLY TREND CHART --- */}
        <div className="card">
          <h2 className="card-title">
            <TrendingDown size={20} /> Monthly Trend ({year})
          </h2>
          <div style={{ height: '250px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorYearly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} tick={{fill: '#64748B', fontSize: 12}} width={60} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spent']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorYearly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

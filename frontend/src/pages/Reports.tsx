import React, { useState } from 'react';
import api from '../api/axios';
import { Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportData {
  summary: {
    totalSpending: number;
    numberOfExpenses: number;
    averageExpense: number;
  };
  categoryBreakdown: Record<string, number>;
  budgetComparison: { category: string; budget: number; spent: number }[];
  expenses: any[];
}

export const Reports: React.FC = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/monthly?month=${month}&year=${year}`);
      setReport(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      // Securely fetch CSV with Auth Token
      const res = await api.get(`/reports/monthly?month=${month}&year=${year}&format=csv`, {
        responseType: 'blob'
      });
      
      // Create a temporary link to download the blob
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `budget-report-${year}-${month}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to download CSV');
    }
  };

  const barData = report ? Object.keys(report.categoryBreakdown).map(key => ({
    name: key,
    amount: report.categoryBreakdown[key]
  })) : [];

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Monthly Reports</h1>
        <p>Analyze your spending and export your data.</p>
      </header>

      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ margin: 0, flex: 1 }}>
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="form-select">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group" style={{ margin: 0, flex: 1 }}>
          <label>Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="form-select">
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button onClick={fetchReport} className="btn-primary" style={{ marginTop: '1.25rem', flex: 1 }}>
          Generate Report
        </button>
      </div>

      {loading && <div className="loading-screen">Generating report...</div>}
      {error && <div className="alert-error">{error}</div>}

      {report && !loading && (
        <div className="dashboard-grid">
          <div className="card">
            <h2 className="card-title">
              <FileText size={20} /> Report Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>Total Expenses:</span>
                <span className="font-medium">₹{report.summary.totalSpending.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>Average Expense:</span>
                <span className="font-medium">₹{report.summary.averageExpense.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>Number of Transactions:</span>
                <span className="font-medium">{report.summary.numberOfExpenses}</span>
              </div>
            </div>
            
            <button onClick={handleDownloadCSV} className="btn-primary" style={{ marginTop: '2rem', width: '100%', backgroundColor: '#10B981' }}>
              <Download size={18} /> Export as CSV
            </button>
          </div>

          <div className="card">
            <h2 className="card-title">Category Breakdown</h2>
            {barData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#38BDF8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">No data to display for this period.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

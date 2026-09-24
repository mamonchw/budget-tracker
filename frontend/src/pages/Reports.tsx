import React, { useState } from 'react';
import api from '../api/axios';
import { Download, FileText, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ReportData {
  summary: {
    totalSpending: number;
    numberOfExpenses: number;
    averageExpense: number;
  };
  categoryBreakdown: Record<string, number>;
  budgetComparison?: { category: string; budget: number; spent: number }[];
  monthlySpending?: { month: number; amount: number }[];
  expenses?: any[];
}

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    setReport(null);
    try {
      let endpoint = '';
      if (reportType === 'monthly') {
        endpoint = `/reports/monthly?month=${month}&year=${year}`;
      } else {
        endpoint = `/reports/yearly?year=${year}`;
      }
      
      const res = await api.get(endpoint);
      setReport(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      let endpoint = '';
      let filename = '';
      if (reportType === 'monthly') {
        endpoint = `/reports/monthly?month=${month}&year=${year}&format=csv`;
        filename = `monthly-report-${year}-${month}.csv`;
      } else {
        endpoint = `/reports/yearly?year=${year}&format=csv`;
        filename = `yearly-report-${year}.csv`;
      }

      const res = await api.get(endpoint, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
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

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearlyTrendData = report?.monthlySpending?.map(item => ({
    name: monthNames[item.month - 1],
    amount: item.amount
  })) || [];

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Analyze your spending patterns and export data.</p>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <button 
            className={`btn-primary ${reportType === 'monthly' ? '' : 'btn-outline'}`} 
            style={{ flex: 1, backgroundColor: reportType === 'monthly' ? '#2563EB' : 'transparent', color: reportType === 'monthly' ? 'white' : '#64748B' }}
            onClick={() => setReportType('monthly')}
          >
            Monthly Report
          </button>
          <button 
            className={`btn-primary ${reportType === 'yearly' ? '' : 'btn-outline'}`} 
            style={{ flex: 1, backgroundColor: reportType === 'yearly' ? '#2563EB' : 'transparent', color: reportType === 'yearly' ? 'white' : '#64748B' }}
            onClick={() => setReportType('yearly')}
          >
            Yearly Report
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {reportType === 'monthly' && (
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label>Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="form-select">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
          )}
          
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
      </div>

      {loading && <div className="loading-screen">Generating report...</div>}
      {error && <div className="alert-error">{error}</div>}

      {report && !loading && (
        <>
          <div className="dashboard-grid">
            <div className="card">
              <h2 className="card-title">
                <FileText size={20} /> Report Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B' }}>Total Expenses:</span>
                  <span className="font-medium text-lg">₹{report.summary.totalSpending.toLocaleString()}</span>
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
                      <YAxis type="category" dataKey="name" width={100} />
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

          {/* Yearly Trend Chart (Only visible in Yearly Report) */}
          {reportType === 'yearly' && report.monthlySpending && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h2 className="card-title">
                <BarChart2 size={20} /> Monthly Spending Trend
              </h2>
              <div style={{ height: '350px', width: '100%', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yearlyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorYearAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} tick={{fill: '#64748B', fontSize: 12}} />
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spent']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorYearAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

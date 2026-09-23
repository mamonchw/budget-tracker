import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}</p>
      </header>
      <div className="card">
        <p>Your dashboard statistics will appear here soon (Stage 11).</p>
      </div>
    </div>
  );
};

// src/pages/admin/AdminDashboard.tsx
import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">System Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stat Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium uppercase">System Status</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">Operational</p>
        </div>
        
        {/* Stat Card 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium uppercase">Database</h3>
          <p className="text-2xl font-bold text-slate-800 mt-2">Connected</p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium uppercase">Active Features</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">Newsroom Ready</p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm">
        <h3 className="text-lg font-semibold text-blue-800 mb-1">Welcome Admin</h3>
        <p className="text-blue-700">
          The Newsroom module is now live. Go to the <strong>Newsroom</strong> tab to manage articles, manually create news, or restore deleted items.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;

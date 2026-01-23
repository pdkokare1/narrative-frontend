// src/pages/admin/SystemConfig.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ISystemConfig } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import './Admin.css';

const SystemConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ISystemConfig[]>([]);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchConfigs = async () => {
    try {
      const res = await adminService.getSystemConfigs();
      setConfigs(res.data.data.configs);
    } catch (err) { alert('Error loading configs'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSave = async (key: string) => {
    if (editValue.trim().startsWith('[') || editValue.trim().startsWith('{')) {
       try { JSON.parse(editValue); } catch (e) { alert('Invalid JSON Syntax'); return; }
    }
    await adminService.updateSystemConfig(key, editValue).then(() => {
        setEditKey(null); fetchConfigs();
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <AdminPageHeader title="System Configuration" description="Global variables." />
      
      <div className="admin-alert alert-warning">
        <span className="alert-title">⚠️ Warning</span>
        <span className="alert-desc">Changing these values affects the live app immediately. Ensure arrays are valid JSON.</span>
      </div>

      <div style={{display:'grid', gap:'16px'}}>
        {configs.map((config) => (
          <AdminCard key={config._id}>
             <div className="flex-between" style={{marginBottom:'12px'}}>
                <div>
                   <h3 style={{fontSize:'1.1rem', fontWeight:'bold'}}>{config.key}</h3>
                   <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>Updated: {new Date(config.lastUpdated).toLocaleDateString()}</span>
                </div>
                {editKey !== config.key && (
                  <button onClick={() => {
                        setEditKey(config.key);
                        setEditValue(Array.isArray(config.value) ? JSON.stringify(config.value) : String(config.value));
                    }} className="btn btn-outline btn-sm">Edit</button>
                )}
             </div>
             
             {editKey === config.key ? (
               <div>
                 <textarea className="form-textarea font-mono" rows={3} value={editValue} onChange={e => setEditValue(e.target.value)} />
                 <div className="flex-end" style={{marginTop:'12px'}}>
                    <button onClick={() => setEditKey(null)} className="btn btn-outline btn-sm">Cancel</button>
                    <button onClick={() => handleSave(config.key)} className="btn btn-primary btn-sm">Save</button>
                 </div>
               </div>
             ) : (
               <div className="font-mono" style={{background:'#f8fafc', padding:'12px', borderRadius:'6px', wordBreak:'break-all'}}>
                  {Array.isArray(config.value) ? JSON.stringify(config.value) : config.value}
               </div>
             )}
          </AdminCard>
        ))}
      </div>
    </div>
  );
};

export default SystemConfig;

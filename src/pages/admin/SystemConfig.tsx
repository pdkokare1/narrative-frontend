// src/pages/admin/SystemConfig.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ISystemConfig } from '../../types';
import PageLoader from '../../components/PageLoader';

const SystemConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ISystemConfig[]>([]);
  
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSystemConfigs();
      setConfigs(res.data.data.configs);
    } catch (err) {
      alert('Error loading configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (key: string) => {
    try {
      // Parse value if it looks like JSON/Array, otherwise send as string
      // Note: Backend expects array for 'value', or we wrap it
      let payload = editValue;
      
      await adminService.updateSystemConfig(key, payload);
      setEditKey(null);
      fetchConfigs();
    } catch (err) {
      alert('Failed to save config');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">System Configuration</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Warning:</strong> Changing these values affects the live application immediately.
        </p>
      </div>

      <div className="grid gap-4">
        {configs.map((config) => (
          <div key={config._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="text-lg font-bold text-slate-800">{config.key}</h3>
                   <p className="text-xs text-slate-400">Last updated: {new Date(config.lastUpdated).toLocaleString()}</p>
                </div>
                {editKey !== config.key && (
                  <button 
                    onClick={() => {
                        setEditKey(config.key);
                        setEditValue(Array.isArray(config.value) ? config.value.join(', ') : String(config.value));
                    }}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit
                  </button>
                )}
             </div>
             
             {editKey === config.key ? (
               <div className="mt-2">
                 <textarea 
                    className="w-full p-2 border rounded font-mono text-sm bg-slate-50"
                    rows={3}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                 />
                 <div className="flex gap-2 mt-2 justify-end">
                    <button 
                      onClick={() => setEditKey(null)}
                      className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSave(config.key)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                 </div>
               </div>
             ) : (
               <div className="mt-2 bg-slate-50 p-3 rounded border border-slate-100 font-mono text-sm text-slate-700 break-all">
                  {Array.isArray(config.value) ? JSON.stringify(config.value) : config.value}
               </div>
             )}
          </div>
        ))}
        
        {/* Create New Config Block */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed border-slate-300 opacity-75 hover:opacity-100 transition-opacity">
           <h3 className="font-bold text-slate-500 mb-2">+ Add New Config Variable</h3>
           <div className="flex gap-2">
             <input type="text" placeholder="KEY_NAME" className="flex-1 p-2 border rounded uppercase" id="newKey"/>
             <input type="text" placeholder="Value" className="flex-1 p-2 border rounded" id="newValue"/>
             <button 
                onClick={() => {
                   const k = (document.getElementById('newKey') as HTMLInputElement).value;
                   const v = (document.getElementById('newValue') as HTMLInputElement).value;
                   if(k && v) adminService.updateSystemConfig(k, v).then(fetchConfigs);
                }}
                className="bg-slate-800 text-white px-4 rounded"
             >
               Add
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;

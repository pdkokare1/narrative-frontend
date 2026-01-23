// src/pages/admin/SystemConfig.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ISystemConfig } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';

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
      let payload = editValue;
      if (editValue.trim().startsWith('[') || editValue.trim().startsWith('{')) {
         try {
           JSON.parse(editValue);
         } catch (e) {
           alert('INVALID JSON: Please check your syntax (commas, quotes, brackets) before saving.');
           return;
         }
      }
      
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
      <AdminPageHeader title="System Configuration" description="Global variables and feature flags." />
      
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
        <div className="flex gap-3">
          <div className="text-amber-500 font-bold">⚠️</div>
          <div>
            <h4 className="font-bold text-amber-800">Warning</h4>
            <p className="text-sm text-amber-700 mt-1">
              Changing these values affects the live application immediately. 
              Ensure arrays are formatted as valid JSON: <code>["Item1", "Item2"]</code>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {configs.map((config) => (
          <AdminCard key={config._id}>
             <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="text-lg font-bold text-slate-800">{config.key}</h3>
                   <p className="text-xs text-slate-400">Last updated: {new Date(config.lastUpdated).toLocaleString()}</p>
                </div>
                {editKey !== config.key && (
                  <button 
                    onClick={() => {
                        setEditKey(config.key);
                        setEditValue(Array.isArray(config.value) ? JSON.stringify(config.value) : String(config.value));
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                )}
             </div>
             
             {editKey === config.key ? (
               <div className="mt-4">
                 <textarea 
                    className="w-full p-3 border border-slate-300 rounded-lg font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                 />
                 <div className="flex gap-3 mt-4 justify-end">
                    <button 
                      onClick={() => setEditKey(null)}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSave(config.key)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                      Save Changes
                    </button>
                 </div>
               </div>
             ) : (
               <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-sm text-slate-700 break-all">
                  {Array.isArray(config.value) ? JSON.stringify(config.value) : config.value}
               </div>
             )}
          </AdminCard>
        ))}
        
        {/* Create New Config Block */}
        <div className="border-2 border-dashed border-slate-300 p-6 rounded-xl hover:border-slate-400 transition-colors flex flex-col items-center justify-center text-center opacity-75 hover:opacity-100">
           <h3 className="font-bold text-slate-500 mb-4">+ Add New Config Variable</h3>
           <div className="flex flex-col md:flex-row gap-3 w-full max-w-2xl">
             <input type="text" placeholder="KEY_NAME" className="flex-1 p-2.5 border rounded-lg uppercase" id="newKey"/>
             <input type="text" placeholder="Value" className="flex-1 p-2.5 border rounded-lg" id="newValue"/>
             <button 
                onClick={() => {
                   const k = (document.getElementById('newKey') as HTMLInputElement).value;
                   const v = (document.getElementById('newValue') as HTMLInputElement).value;
                   if(k && v) adminService.updateSystemConfig(k, v).then(fetchConfigs);
                }}
                className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-900"
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

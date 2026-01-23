// src/pages/admin/Prompts.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IPrompt } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminBadge } from '../../components/admin/AdminBadge';

const Prompts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<IPrompt[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSystemPrompts();
      setPrompts(res.data.data.prompts);
    } catch (err) {
      alert('Error loading prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleSave = async (id: string) => {
    try {
      await adminService.updateSystemPrompt(id, { text: editText });
      setEditId(null);
      fetchPrompts();
      alert('Prompt updated. AI will use new version on next run.');
    } catch (err) {
      alert('Failed to update prompt');
    }
  };

  const toggleActive = async (prompt: IPrompt) => {
    try {
      await adminService.updateSystemPrompt(prompt._id, { active: !prompt.active });
      fetchPrompts();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <AdminPageHeader title="AI Brain (Prompts)" description="Manage system prompts and agent behaviors." />
      
      <div className="grid gap-6">
        {prompts.map((prompt) => (
          <AdminCard key={prompt._id} className={`border-l-4 ${prompt.active ? 'border-l-emerald-500' : 'border-l-slate-300'}`}>
             <div className="flex justify-between items-start mb-4">
                <div>
                   <div className="flex items-center gap-3">
                     <h2 className="text-xl font-bold text-slate-800">{prompt.type}</h2>
                     {prompt.active ? (
                        <AdminBadge variant="success">Active</AdminBadge>
                     ) : (
                        <AdminBadge variant="neutral">Inactive</AdminBadge>
                     )}
                   </div>
                   <p className="text-sm text-slate-500 mt-1">{prompt.description}</p>
                   <div className="mt-2">
                     <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">v{prompt.version}</span>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => toggleActive(prompt)}
                     className="text-xs text-slate-500 hover:text-slate-800 underline px-2"
                   >
                     {prompt.active ? 'Deactivate' : 'Activate'}
                   </button>
                   {editId !== prompt._id && (
                     <button 
                       onClick={() => {
                           setEditId(prompt._id);
                           setEditText(prompt.text);
                       }}
                       className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 shadow-sm font-medium"
                     >
                       Edit Prompt
                     </button>
                   )}
                </div>
             </div>

             {editId === prompt._id ? (
               <div className="space-y-4">
                  <textarea 
                    className="w-full h-96 p-4 border border-slate-300 rounded-lg font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setEditId(null)}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSave(prompt._id)}
                      className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm"
                    >
                      Save Version {prompt.version + 1}
                    </button>
                  </div>
               </div>
             ) : (
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap font-mono text-sm text-slate-700 max-h-60 overflow-y-auto">
                 {prompt.text}
               </div>
             )}
          </AdminCard>
        ))}
      </div>
    </div>
  );
};

export default Prompts;

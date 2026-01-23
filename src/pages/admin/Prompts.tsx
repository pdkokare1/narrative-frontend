// src/pages/admin/Prompts.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IPrompt } from '../../types';
import PageLoader from '../../components/PageLoader';

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
      fetchPrompts(); // Refresh to show new version
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
      <h1 className="text-3xl font-bold text-slate-800 mb-6">AI Brain (Prompts)</h1>
      
      <div className="grid gap-6">
        {prompts.map((prompt) => (
          <div key={prompt._id} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${prompt.active ? 'border-green-500' : 'border-slate-300'}`}>
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h2 className="text-xl font-bold text-slate-800">{prompt.type}</h2>
                   <p className="text-sm text-slate-500">{prompt.description}</p>
                   <div className="mt-1 flex gap-2">
                     <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">v{prompt.version}</span>
                     {prompt.active ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
                     ) : (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Inactive</span>
                     )}
                   </div>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => toggleActive(prompt)}
                     className="text-xs text-slate-500 hover:text-slate-800 underline"
                   >
                     {prompt.active ? 'Deactivate' : 'Activate'}
                   </button>
                   {editId !== prompt._id && (
                     <button 
                       onClick={() => {
                           setEditId(prompt._id);
                           setEditText(prompt.text);
                       }}
                       className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                     >
                       Edit Prompt
                     </button>
                   )}
                </div>
             </div>

             {editId === prompt._id ? (
               <div className="space-y-3">
                  <textarea 
                    className="w-full h-64 p-4 border rounded font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setEditId(null)}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSave(prompt._id)}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save Version {prompt.version + 1}
                    </button>
                  </div>
               </div>
             ) : (
               <div className="bg-slate-50 p-4 rounded border border-slate-100 whitespace-pre-wrap font-mono text-sm text-slate-700 max-h-40 overflow-y-auto">
                 {prompt.text}
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Prompts;

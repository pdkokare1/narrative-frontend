// src/pages/admin/Prompts.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IPrompt } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminBadge } from '../../components/admin/AdminBadge';
import './Admin.css';

const Prompts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<IPrompt[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const fetchPrompts = async () => {
    try {
      const res = await adminService.getSystemPrompts();
      setPrompts(res.data.data.prompts);
    } catch (err) { alert('Error loading prompts'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleSave = async (id: string) => {
    await adminService.updateSystemPrompt(id, { text: editText }).then(() => {
        setEditId(null); fetchPrompts(); alert('Prompt updated.');
    });
  };

  const toggleActive = async (prompt: IPrompt) => {
    await adminService.updateSystemPrompt(prompt._id, { active: !prompt.active }).then(fetchPrompts);
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <AdminPageHeader title="AI Brain" description="Manage system prompts." />
      
      <div style={{display:'grid', gap:'24px'}}>
        {prompts.map((prompt) => (
          <AdminCard key={prompt._id} className={prompt.active ? '' : 'opacity-75'}>
             <div className="flex-between" style={{marginBottom:'16px'}}>
                <div>
                   <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                     <h2 style={{fontSize:'1.2rem', fontWeight:'bold'}}>{prompt.type}</h2>
                     <AdminBadge variant={prompt.active ? 'success' : 'neutral'}>{prompt.active ? 'Active' : 'Inactive'}</AdminBadge>
                   </div>
                   <p style={{fontSize:'0.9rem', color:'#64748b', marginTop:'4px'}}>{prompt.description}</p>
                </div>
                <div className="flex-end">
                   <button onClick={() => toggleActive(prompt)} className="btn btn-outline btn-sm">
                     {prompt.active ? 'Deactivate' : 'Activate'}
                   </button>
                   {editId !== prompt._id && (
                     <button onClick={() => { setEditId(prompt._id); setEditText(prompt.text); }} className="btn btn-primary btn-sm">Edit</button>
                   )}
                </div>
             </div>

             {editId === prompt._id ? (
               <div>
                  <textarea className="form-textarea font-mono" style={{minHeight:'300px'}} value={editText} onChange={e => setEditText(e.target.value)} />
                  <div className="flex-end" style={{marginTop:'16px'}}>
                    <button onClick={() => setEditId(null)} className="btn btn-outline">Cancel</button>
                    <button onClick={() => handleSave(prompt._id)} className="btn btn-primary">Save New Version</button>
                  </div>
               </div>
             ) : (
               <div className="font-mono" style={{background:'#f8fafc', padding:'16px', borderRadius:'8px', maxHeight:'200px', overflowY:'auto', whiteSpace:'pre-wrap'}}>
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

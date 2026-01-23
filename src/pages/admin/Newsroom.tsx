// src/pages/admin/Newsroom.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IArticle } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable, AdminThead, AdminTbody, AdminTr, AdminTh, AdminTd } from '../../components/admin/AdminTable';
import { AdminBadge } from '../../components/admin/AdminBadge';
import { AdminCard } from '../../components/admin/AdminCard';
import './Admin.css'; // Ensure styles are loaded

const Newsroom: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [newArticle, setNewArticle] = useState({
    headline: '', summary: '', source: 'Narrative Editorial',
    category: 'General', politicalLean: 'Center', url: `https://narrative.news/manual/${Date.now()}`
  });

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = activeTab === 'active' 
        ? await adminService.getAllArticles(1, 50) 
        : await adminService.getArchivedArticles(1, 50);
      setArticles(res.data.data.articles);
    } catch (err) { alert('Error loading articles'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchArticles(); }, [activeTab]);

  const handleArchive = async (id: string) => {
    if(!window.confirm('Move to trash?')) return;
    await adminService.archiveArticle(id).then(fetchArticles);
  };

  const handleRestore = async (id: string) => {
    await adminService.restoreArticle(id).then(fetchArticles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      isEditing && editId 
        ? await adminService.updateArticle(editId, newArticle)
        : await adminService.createArticle(newArticle);
      resetForm();
      fetchArticles();
    } catch (err) { alert('Operation failed'); }
  };

  const handleEdit = (article: IArticle) => {
    setNewArticle({
      headline: article.headline, summary: article.summary, source: article.source,
      category: article.category, politicalLean: article.politicalLean || 'Center', url: article.url
    });
    setEditId(article._id); setIsEditing(true); setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setShowCreateForm(false); setIsEditing(false); setEditId(null);
    setNewArticle({ headline: '', summary: '', source: 'Narrative Editorial', category: 'General', politicalLean: 'Center', url: `https://narrative.news/manual/${Date.now()}` });
  };

  if (loading && !articles.length) return <PageLoader />;

  return (
    <div>
      <AdminPageHeader 
        title="Newsroom" 
        description="Manage and edit content."
        actions={activeTab === 'active' && (
          <button onClick={() => showCreateForm ? resetForm() : setShowCreateForm(true)} className="btn btn-primary">
            {showCreateForm ? 'Cancel' : '+ New Article'}
          </button>
        )}
      />

      <div className="admin-tabs">
        <button onClick={() => setActiveTab('active')} className={`admin-tab-btn ${activeTab === 'active' ? 'active' : ''}`}>Active Articles</button>
        <button onClick={() => setActiveTab('trash')} className={`admin-tab-btn ${activeTab === 'trash' ? 'active' : ''}`}>Trash (Archive)</button>
      </div>

      {showCreateForm && (
        <AdminCard title={isEditing ? 'Edit Article' : 'Create Article'}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Headline</label>
              <input type="text" className="form-input" required value={newArticle.headline} onChange={e => setNewArticle({...newArticle, headline: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Summary</label>
              <textarea className="form-textarea" rows={3} required value={newArticle.summary} onChange={e => setNewArticle({...newArticle, summary: e.target.value})} />
            </div>
            <div className="admin-grid-2">
               <div className="form-group">
                 <label className="form-label">Category</label>
                 <select className="form-select" value={newArticle.category} onChange={e => setNewArticle({...newArticle, category: e.target.value})}>
                   {['General','Politics','Technology','Business','Health','Science','Entertainment'].map(c => <option key={c}>{c}</option>)}
                 </select>
               </div>
               <div className="form-group">
                 <label className="form-label">Political Lean</label>
                 <select className="form-select" value={newArticle.politicalLean} onChange={e => setNewArticle({...newArticle, politicalLean: e.target.value})}>
                   {['Center','Left','Right'].map(l => <option key={l}>{l}</option>)}
                 </select>
               </div>
            </div>
            <div className="flex-end" style={{marginTop:'20px'}}>
              <button type="button" onClick={resetForm} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Publish'}</button>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminTable>
        <AdminThead>
          <tr>
            <AdminTh>Headline</AdminTh>
            <AdminTh>Source</AdminTh>
            <AdminTh>Date</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </tr>
        </AdminThead>
        <AdminTbody>
          {articles.map((article) => (
            <AdminTr key={article._id}>
              <AdminTd>
                <div style={{fontWeight:'600', marginBottom:'4px'}}>{article.headline}</div>
                <div style={{fontSize:'0.8rem', color:'#64748b'}}>{article.summary.substring(0, 80)}...</div>
              </AdminTd>
              <AdminTd><AdminBadge>{article.source}</AdminBadge></AdminTd>
              <AdminTd>{new Date(article.publishedAt).toLocaleDateString()}</AdminTd>
              <AdminTd className="text-right">
                <div className="flex-end">
                  {activeTab === 'active' ? (
                    <>
                      <button onClick={() => handleEdit(article)} className="btn btn-outline btn-sm">Edit</button>
                      <button onClick={() => handleArchive(article._id)} className="btn btn-danger btn-sm">Delete</button>
                    </>
                  ) : (
                    <button onClick={() => handleRestore(article._id)} className="btn btn-success btn-sm">Restore</button>
                  )}
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </AdminTbody>
      </AdminTable>
    </div>
  );
};

export default Newsroom;

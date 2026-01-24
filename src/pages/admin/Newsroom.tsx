// src/pages/admin/Newsroom.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IArticle } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable, TableColumn } from '../../components/admin/AdminTable';
import { AdminBadge } from '../../components/admin/AdminBadge';
import './Admin.css';

const Newsroom: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editArticle, setEditArticle] = useState<Partial<IArticle> | null>(null);

  // Archive View State
  const [showArchived, setShowArchived] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const apiCall = showArchived 
        ? adminService.getArchivedArticles(page) 
        : adminService.getAllArticles(page);

      const res = await apiCall;
      setArticles(res.data.data.articles);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, showArchived]);

  const handleEdit = (article: IArticle) => {
    setEditArticle({ ...article });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editArticle || !editArticle._id) return;
    try {
      await adminService.updateArticle(editArticle._id, editArticle);
      setIsEditing(false);
      fetchArticles(); // Refresh
      alert('Article updated successfully');
    } catch (err) {
      alert('Failed to update article');
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to move this to trash?')) return;
    try {
      await adminService.archiveArticle(id);
      fetchArticles();
    } catch (err) { alert('Error archiving article'); }
  };

  const handleRestore = async (id: string) => {
    try {
      await adminService.restoreArticle(id);
      fetchArticles();
    } catch (err) { alert('Error restoring article'); }
  };

  // FIX: Explicitly typed columns and cast string accessors
  const columns: TableColumn<IArticle>[] = [
    { 
        header: 'Thumb', 
        accessor: (row: IArticle) => (
            row.imageUrl ? <img src={row.imageUrl} alt="" style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px'}} /> : <span style={{fontSize:'0.8rem', color:'#999'}}>No Img</span>
        ) 
    },
    { header: 'Headline', accessor: 'headline' as keyof IArticle },
    { header: 'Source', accessor: 'source' as keyof IArticle },
    { header: 'Category', accessor: 'category' as keyof IArticle },
    { 
      header: 'Published', 
      accessor: (row: IArticle) => new Date(row.publishedAt).toLocaleDateString() 
    },
    {
      header: 'Status',
      accessor: (row: IArticle) => (
        <AdminBadge variant={row.isLatest ? 'success' : 'neutral'}>
          {row.isLatest ? 'Live' : 'Hidden'}
        </AdminBadge>
      )
    },
    {
      header: 'Actions',
      accessor: (row: IArticle) => (
        <div className="flex-end">
            {!showArchived ? (
                <>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(row)}>Edit</button>
                    <button className="btn btn-outline btn-sm text-red" onClick={() => handleArchive(row._id)}>Trash</button>
                </>
            ) : (
                <button className="btn btn-primary btn-sm" onClick={() => handleRestore(row._id)}>Restore</button>
            )}
        </div>
      )
    }
  ];

  if (loading && !articles.length) return <PageLoader />;

  return (
    <div>
      <AdminPageHeader 
        title={showArchived ? "Trash Bin" : "Newsroom"} 
        description={showArchived ? "Recover deleted articles." : "Manage and edit live articles."}
        actions={
            <button onClick={() => { setShowArchived(!showArchived); setPage(1); }} className="btn btn-outline">
                {showArchived ? "View Live Articles" : "View Trash"}
            </button>
        }
      />

      <AdminTable 
        data={articles} 
        columns={columns} 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* EDIT MODAL */}
      {isEditing && editArticle && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
             <h2>Edit Article</h2>
             
             <div className="admin-form-group">
                <label>Headline</label>
                <input 
                  value={editArticle.headline} 
                  onChange={e => setEditArticle({...editArticle, headline: e.target.value})} 
                  className="form-input"
                />
             </div>

             <div className="admin-form-group">
                <label>Summary</label>
                <textarea 
                  value={editArticle.summary} 
                  onChange={e => setEditArticle({...editArticle, summary: e.target.value})} 
                  className="form-textarea"
                />
             </div>

             <div className="admin-form-group">
                <label>Image URL</label>
                <input 
                  value={editArticle.imageUrl || ''} 
                  onChange={e => setEditArticle({...editArticle, imageUrl: e.target.value})} 
                  className="form-input"
                  placeholder="https://..."
                />
                {editArticle.imageUrl && <img src={editArticle.imageUrl} alt="Preview" style={{marginTop:'10px', maxHeight:'100px', borderRadius:'6px'}} />}
             </div>

             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                <div className="admin-form-group">
                    <label>Category</label>
                    <input value={editArticle.category} onChange={e => setEditArticle({...editArticle, category: e.target.value})} className="form-input" />
                </div>
                <div className="admin-form-group">
                    <label>Source</label>
                    <input value={editArticle.source} onChange={e => setEditArticle({...editArticle, source: e.target.value})} className="form-input" />
                </div>
             </div>

             {/* ADVANCED ANALYSIS SECTION */}
             <div style={{marginTop:'24px', borderTop:'1px solid #eee', paddingTop:'16px'}}>
                <h3 style={{fontSize:'1rem', marginBottom:'12px', color:'#334155'}}>Advanced Analysis</h3>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px'}}>
                    <div className="admin-form-group">
                        <label>Bias Score (0-100)</label>
                        <input 
                            type="number"
                            value={editArticle.biasScore || 0} 
                            onChange={e => setEditArticle({...editArticle, biasScore: Number(e.target.value)})} 
                            className="form-input" 
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Credibility Grade</label>
                        <input 
                            value={editArticle.credibilityGrade || ''} 
                            onChange={e => setEditArticle({...editArticle, credibilityGrade: e.target.value})} 
                            className="form-input" 
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Sentiment</label>
                        <select 
                            value={editArticle.sentiment || 'Neutral'}
                            onChange={e => setEditArticle({...editArticle, sentiment: e.target.value as any})}
                            className="form-select"
                        >
                            <option value="Positive">Positive</option>
                            <option value="Neutral">Neutral</option>
                            <option value="Negative">Negative</option>
                        </select>
                    </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'12px'}}>
                    <div className="admin-form-group">
                        <label>Trust Score</label>
                        <input 
                            type="number"
                            value={editArticle.trustScore || 0} 
                            onChange={e => setEditArticle({...editArticle, trustScore: Number(e.target.value)})} 
                            className="form-input" 
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Political Lean</label>
                        <input 
                            value={editArticle.politicalLean || ''} 
                            onChange={e => setEditArticle({...editArticle, politicalLean: e.target.value})} 
                            className="form-input" 
                        />
                    </div>
                </div>
             </div>

             <div className="flex-end" style={{marginTop:'24px'}}>
                <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Newsroom;

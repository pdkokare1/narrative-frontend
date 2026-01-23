// narrative-frontend/src/pages/admin/Newsroom.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IArticle } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable, AdminThead, AdminTbody, AdminTr, AdminTh, AdminTd } from '../../components/admin/AdminTable';
import { AdminBadge } from '../../components/admin/AdminBadge';
import { AdminCard } from '../../components/admin/AdminCard';

const Newsroom: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [newArticle, setNewArticle] = useState({
    headline: '',
    summary: '',
    source: 'Narrative Editorial',
    category: 'General',
    politicalLean: 'Center',
    url: `https://narrative.news/manual/${Date.now()}`
  });

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'active') {
        res = await adminService.getAllArticles(1, 50);
      } else {
        res = await adminService.getArchivedArticles(1, 50);
      }
      setArticles(res.data.data.articles);
    } catch (err) {
      console.error("Failed to fetch articles", err);
      alert('Error loading articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [activeTab]);

  const handleArchive = async (id: string) => {
    if(!window.confirm('Are you sure you want to move this to trash?')) return;
    try {
      await adminService.archiveArticle(id);
      fetchArticles();
    } catch (err) {
      alert('Failed to archive');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await adminService.restoreArticle(id);
      fetchArticles();
    } catch (err) {
      alert('Failed to restore');
    }
  };

  const handleEdit = (article: IArticle) => {
    setNewArticle({
      headline: article.headline,
      summary: article.summary,
      source: article.source,
      category: article.category,
      politicalLean: article.politicalLean || 'Center',
      url: article.url
    });
    setEditId(article._id);
    setIsEditing(true);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setIsEditing(false);
    setEditId(null);
    setNewArticle({
      headline: '',
      summary: '',
      source: 'Narrative Editorial',
      category: 'General',
      politicalLean: 'Center',
      url: `https://narrative.news/manual/${Date.now()}`
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editId) {
        await adminService.updateArticle(editId, newArticle);
        alert('Article updated successfully');
      } else {
        await adminService.createArticle(newArticle);
        alert('Article created successfully');
      }
      resetForm();
      fetchArticles();
    } catch (err) {
      alert(isEditing ? 'Failed to update article' : 'Failed to create article');
      console.error(err);
    }
  };

  if (loading && !articles.length) return <PageLoader />;

  return (
    <div>
      <AdminPageHeader 
        title="Newsroom" 
        description="Manage, edit, and publish content."
        actions={activeTab === 'active' && (
             <button 
               onClick={() => {
                 if (showCreateForm) resetForm();
                 else setShowCreateForm(true);
               }}
               className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-sm transition-all text-sm font-medium"
             >
               {showCreateForm ? 'Cancel' : '+ New Article'}
             </button>
        )}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Active Articles
        </button>
        <button 
          onClick={() => setActiveTab('trash')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'trash' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Trash (Archive)
        </button>
      </div>

      {/* Create / Edit Form */}
      {showCreateForm && (
        <AdminCard title={isEditing ? 'Edit Article' : 'Create Manual Article'} className="mb-8 border-l-4 border-l-blue-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
              <input 
                required
                type="text" 
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={newArticle.headline}
                onChange={e => setNewArticle({...newArticle, headline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
              <textarea 
                required
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={newArticle.summary}
                onChange={e => setNewArticle({...newArticle, summary: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                 <select 
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                    value={newArticle.category}
                    onChange={e => setNewArticle({...newArticle, category: e.target.value})}
                 >
                   {['General','Politics','Technology','Business','Health','Science','Entertainment'].map(c => <option key={c}>{c}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Political Lean</label>
                 <select 
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                    value={newArticle.politicalLean}
                    onChange={e => setNewArticle({...newArticle, politicalLean: e.target.value})}
                 >
                   {['Center','Left','Right'].map(l => <option key={l}>{l}</option>)}
                 </select>
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium">
                {isEditing ? 'Update Article' : 'Publish Article'}
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Table */}
      <AdminTable>
        <AdminThead>
          <tr>
            <AdminTh>Headline / Summary</AdminTh>
            <AdminTh>Source</AdminTh>
            <AdminTh>Date</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </tr>
        </AdminThead>
        <AdminTbody>
          {articles.map((article) => (
            <AdminTr key={article._id}>
              <AdminTd>
                <p className="font-semibold text-slate-800 line-clamp-1">{article.headline}</p>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{article.summary}</p>
              </AdminTd>
              <AdminTd>
                 <AdminBadge variant="neutral">{article.source}</AdminBadge>
              </AdminTd>
              <AdminTd>
                {new Date(article.publishedAt).toLocaleDateString()}
              </AdminTd>
              <AdminTd className="text-right">
                <div className="flex justify-end gap-2">
                  {activeTab === 'active' ? (
                    <>
                      <button 
                         onClick={() => handleEdit(article)}
                         className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                         onClick={() => handleArchive(article._id)}
                         className="text-xs bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-100 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button 
                       onClick={() => handleRestore(article._id)}
                       className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </AdminTd>
            </AdminTr>
          ))}
          {articles.length === 0 && (
            <tr>
              <td colSpan={4} className="p-12 text-center text-slate-400">
                No articles found in {activeTab}.
              </td>
            </tr>
          )}
        </AdminTbody>
      </AdminTable>
    </div>
  );
};

export default Newsroom;

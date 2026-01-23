// narrative-frontend/src/pages/admin/Newsroom.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IArticle } from '../../types';
import PageLoader from '../../components/PageLoader';

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
    url: `https://narrative.news/manual/${Date.now()}` // Default for new
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
      fetchArticles(); // Refresh
    } catch (err) {
      alert('Failed to archive');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await adminService.restoreArticle(id);
      fetchArticles(); // Refresh
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
        // UPDATE MODE
        await adminService.updateArticle(editId, newArticle);
        alert('Article updated successfully');
      } else {
        // CREATE MODE
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Newsroom</h1>
        <div className="space-x-4">
           {activeTab === 'active' && (
             <button 
               onClick={() => {
                 if (showCreateForm) resetForm();
                 else setShowCreateForm(true);
               }}
               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition"
             >
               {showCreateForm ? 'Cancel' : '+ New Article'}
             </button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-300 mb-6">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 font-medium transition-colors ${activeTab === 'active' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Active Articles
        </button>
        <button 
          onClick={() => setActiveTab('trash')}
          className={`px-6 py-2 font-medium transition-colors ${activeTab === 'trash' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Trash (Archive)
        </button>
      </div>

      {/* Create / Edit Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8 animate-fade-in">
          <h2 className="text-xl font-bold mb-4">
            {isEditing ? 'Edit Article' : 'Create Manual Article'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Headline</label>
              <input 
                required
                type="text" 
                className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                value={newArticle.headline}
                onChange={e => setNewArticle({...newArticle, headline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Summary</label>
              <textarea 
                required
                rows={3}
                className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                value={newArticle.summary}
                onChange={e => setNewArticle({...newArticle, summary: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700">Category</label>
                 <select 
                    className="w-full mt-1 p-2 border rounded"
                    value={newArticle.category}
                    onChange={e => setNewArticle({...newArticle, category: e.target.value})}
                 >
                   <option>General</option>
                   <option>Politics</option>
                   <option>Technology</option>
                   <option>Business</option>
                   <option>Health</option>
                   <option>Science</option>
                   <option>Entertainment</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700">Political Lean</label>
                 <select 
                    className="w-full mt-1 p-2 border rounded"
                    value={newArticle.politicalLean}
                    onChange={e => setNewArticle({...newArticle, politicalLean: e.target.value})}
                 >
                   <option>Center</option>
                   <option>Left</option>
                   <option>Right</option>
                 </select>
               </div>
            </div>
            <div className="flex justify-end pt-4 gap-2">
              <button 
                type="button" 
                onClick={resetForm}
                className="bg-slate-200 text-slate-700 px-6 py-2 rounded hover:bg-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                {isEditing ? 'Update Article' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600">Headline</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Source</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Date</th>
              <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {articles.map((article) => (
              <tr key={article._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <p className="font-medium text-slate-800 line-clamp-1">{article.headline}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{article.summary}</p>
                </td>
                <td className="p-4 text-sm text-slate-600">
                   <span className="px-2 py-1 bg-slate-100 rounded text-xs">{article.source}</span>
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right space-x-2">
                  {activeTab === 'active' ? (
                    <>
                      <button 
                         onClick={() => handleEdit(article)}
                         className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button 
                         onClick={() => handleArchive(article._id)}
                         className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button 
                       onClick={() => handleRestore(article._id)}
                       className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  No articles found in {activeTab}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Newsroom;

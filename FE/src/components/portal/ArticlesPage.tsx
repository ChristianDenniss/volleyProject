import React, { useState } from 'react';
import { useArticles } from '../../hooks/allFetch';
import { useArticleMutations } from '../../hooks/allPatch';
import { useDeleteArticles } from '../../hooks/allDelete';
import '../../styles/ArticlesPage.css';

const ArticlesPage: React.FC = () => {
    const { data: articles, loading, error } = useArticles();
    const { patchArticle } = useArticleMutations();
    const { deleteItem } = useDeleteArticles();
    const [filter, setFilter] = useState<'all' | 'pending'>('pending');

    const handleApprove = async (articleId: number) => {
        try {
            await patchArticle(articleId, { approved: true });
        } catch (error) {
            console.error('Error approving article:', error);
        }
    };

    const handleReject = async (articleId: number) => {
        try {
            await deleteItem(articleId.toString());
        } catch (error) {
            console.error('Error rejecting article:', error);
        }
    };

    const filteredArticles = articles?.filter(article => 
        filter === 'all' || article.approved === null
    ) || [];

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="articles-page">
            <div className="page-header">
                <h1>Article Management</h1>
                <div className="filter-controls">
                    <button 
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Articles
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending Approval
                    </button>
                </div>
            </div>

            <div className="articles-table">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredArticles.map(article => (
                            <tr key={article.id}>
                                <td>{article.title}</td>
                                <td>{article.author.username}</td>
                                <td>{new Date(article.createdAt).toLocaleDateString()}</td>
                                <td>
                                    {article.approved === null ? 'Pending' : 'Approved'}
                                </td>
                                <td>
                                    {article.approved === null && (
                                        <>
                                            <button 
                                                onClick={() => handleApprove(article.id)}
                                                className="approve-btn"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleReject(article.id)}
                                                className="reject-btn"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ArticlesPage;

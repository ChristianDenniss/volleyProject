import React, { useState } from 'react';
import { useArticles } from '../../hooks/allFetch';
import { useArticleMutations } from '../../hooks/allPatch';
import '../../styles/ArticlesPage.css';

const ArticlesPage: React.FC = () => {
    const { data: articles, loading, error } = useArticles();
    const { patchArticle } = useArticleMutations();
    const [filter, setFilter] = useState<'all' | 'pending'>('pending');
    const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null);

    const handleApprove = async (articleId: number) => {
        try {
            await patchArticle(articleId, { approved: true });
        } catch (error) {
            console.error('Error approving article:', error);
        }
    };

    const handleReject = async (articleId: number) => {
        try {
            await patchArticle(articleId, { approved: false });
        } catch (error) {
            console.error('Error rejecting article:', error);
        }
    };

    const toggleExpand = (articleId: number) => {
        setExpandedArticleId(expandedArticleId === articleId ? null : articleId);
    };

    // Only show pending articles by default, or all articles if filter is 'all'
    const filteredArticles = articles?.filter(article => 
        filter === 'all' ? true : article.approved === null
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
                            <React.Fragment key={article.id}>
                                <tr 
                                    className={`article-row ${expandedArticleId === article.id ? 'expanded' : ''}`}
                                    onClick={() => toggleExpand(article.id)}
                                >
                                    <td>{article.title}</td>
                                    <td>{article.author.username}</td>
                                    <td>{new Date(article.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {article.approved === null ? 'Pending' : 
                                         article.approved ? 'Approved' : 'Rejected'}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {article.approved !== true && (
                                                <button 
                                                    className="approve-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApprove(article.id);
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {article.approved !== false && (
                                                <button 
                                                    className="reject-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReject(article.id);
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {expandedArticleId === article.id && (
                                    <tr className="article-details">
                                        <td colSpan={5}>
                                            <div className="article-content">
                                                <div className="article-image">
                                                    <img src={article.imageUrl} alt={article.title} />
                                                </div>
                                                <div className="article-text">
                                                    <h3>Summary</h3>
                                                    <p>{article.summary}</p>
                                                    <h3>Content</h3>
                                                    <p>{article.content}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ArticlesPage;

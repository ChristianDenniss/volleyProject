import React, { useState, useEffect } from 'react';
import { useArticles } from '../../hooks/allFetch';
import { useArticleMutations } from '../../hooks/allPatch';
import Table, { type TableColumn } from '../ui/Table';
import Pagination from '../Pagination';
import type { Article } from '../../types/interfaces';
import '../../styles/ArticlesPage.css';

const ARTICLES_PER_PAGE = 10;

const ArticlesPage: React.FC = () => {
    const [filter, setFilter] = useState<'all' | 'pending'>('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null);

    const { data: fetchedArticles, totalPages, loading, error } = useArticles({
        page: currentPage,
        limit: ARTICLES_PER_PAGE,
        status: filter === 'pending' ? 'pending' : undefined,
    });
    const { patchArticle } = useArticleMutations();
    const [articles, setArticles] = useState<Article[]>([]);

    useEffect(() => {
        if (fetchedArticles) {
            setArticles(fetchedArticles);
        }
    }, [fetchedArticles]);

    const handleApprove = async (articleId: number) => {
        try {
            const updatedArticle = await patchArticle(articleId, { approved: true });
            if (updatedArticle) {
                // Pending view: drop the row once approved; all view: update in place
                setArticles(prevArticles =>
                    filter === 'pending'
                        ? prevArticles.filter(article => article.id !== articleId)
                        : prevArticles.map(article =>
                            article.id === articleId ? { ...article, approved: true } : article
                        )
                );
            }
        } catch (error) {
            console.error('Error approving article:', error);
        }
    };

    const handleReject = async (articleId: number) => {
        try {
            const updatedArticle = await patchArticle(articleId, { approved: false });
            if (updatedArticle) {
                setArticles(prevArticles =>
                    filter === 'pending'
                        ? prevArticles.filter(article => article.id !== articleId)
                        : prevArticles.map(article =>
                            article.id === articleId ? { ...article, approved: false } : article
                        )
                );
            }
        } catch (error) {
            console.error('Error rejecting article:', error);
        }
    };

    const toggleExpand = (articleId: number) => {
        setExpandedArticleId(expandedArticleId === articleId ? null : articleId);
    };

    const columns: TableColumn<Article>[] = [
        {
            key: 'title',
            header: 'Title',
            render: (article) => article.title,
        },
        {
            key: 'author',
            header: 'Author',
            render: (article) => article.author.username,
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (article) => new Date(article.createdAt).toLocaleDateString(),
        },
        {
            key: 'status',
            header: 'Status',
            render: (article) =>
                article.approved === null ? 'Pending' :
                article.approved ? 'Approved' : 'Rejected',
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (article) => (
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
            ),
        },
    ];

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="articles-page">
            <div className="page-header">
                <div className="filter-controls">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => {
                            setFilter('all');
                            setCurrentPage(1);
                        }}
                    >
                        All Articles
                    </button>
                    <button
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => {
                            setFilter('pending');
                            setCurrentPage(1);
                        }}
                    >
                        Pending Approval
                    </button>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            <div className="articles-table">
                <Table
                    columns={columns}
                    rows={articles}
                    rowKey={(article) => article.id}
                    rowClassName={(article) =>
                        `article-row${expandedArticleId === article.id ? ' expanded' : ''}`
                    }
                    onRowClick={(article) => toggleExpand(article.id)}
                    renderAfterRow={(article) =>
                        expandedArticleId === article.id ? (
                            <tr className="article-details" key={`details-${article.id}`}>
                                <td colSpan={columns.length}>
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
                        ) : null
                    }
                />
            </div>
        </div>
    );
};

export default ArticlesPage;

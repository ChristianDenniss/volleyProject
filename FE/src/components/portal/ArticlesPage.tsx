import React, { useState, useEffect } from 'react';
import { useArticles } from '../../hooks/allFetch';
import { useArticleMutations } from '../../hooks/allPatch';
import Table, { type TableColumn } from '../ui/Table';
import Pagination from '../Pagination';
import type { Article } from '../../types/interfaces';

const page = "p-[2rem] max-w-[1200px] my-0 mx-auto";

const header = "flex justify-between items-center mb-[2rem]";

const filterControls = "flex gap-[1rem]";

const filterBtn =
    "py-[0.5rem] px-[1rem] border border-solid border-brand-primary rounded-sm " +
    "cursor-pointer transition-all duration-200";

const filterBtnIdle = "bg-white text-brand-primary hover:bg-[#f8fafc]";

const filterBtnActive = "bg-brand-primary text-white border-brand-primary";

const tableWrap = "bg-white rounded-md shadow-sm overflow-hidden";

const articleRow =
    "cursor-pointer transition-colors duration-200 hover:bg-[#f8f9fa]";

const articleRowExpanded = "cursor-pointer transition-colors duration-200 bg-[#f0f7ff]";

const detailsRow = "bg-[#f8f9fa]";

const articleContent =
    "p-[1.5rem] flex gap-[2rem] items-start max-w-full overflow-hidden " +
    "upto-md:flex-col upto-576:p-[1rem]";

const articleImage =
    "flex-[0_0_300px] max-w-[300px] relative " +
    "upto-md:flex-none upto-md:w-full upto-md:max-w-full upto-md:mb-[1rem]";

const articleImg =
    "w-full h-auto max-h-[400px] object-contain rounded-md shadow-sm upto-md:max-h-[300px]";

const articleText =
    "flex-1 min-w-0 [overflow-wrap:break-word] [word-break:break-all]";

const articleTextH3 =
    "mt-0 mr-0 mb-[0.5rem] ml-0 text-[#333] text-[1.1rem] upto-576:text-[1rem]";

const articleTextP =
    "mt-0 mx-0 mb-[1.5rem] text-[#666] leading-[1.6] whitespace-pre-wrap " +
    "[word-wrap:break-word] [overflow-wrap:break-word] [word-break:break-all] " +
    "upto-576:text-[0.9rem]";

const actionButtons = "flex gap-[0.5rem] flex-wrap upto-md:justify-start";

const approveBtn =
    "py-[0.5rem] px-[1rem] border-none rounded-sm cursor-pointer font-medium " +
    "transition-all duration-200 whitespace-nowrap bg-[#28a745] text-white hover:bg-[#218838]";

const rejectBtn =
    "py-[0.5rem] px-[1rem] border-none rounded-sm cursor-pointer font-medium " +
    "transition-all duration-200 whitespace-nowrap bg-[#dc3545] text-white hover:bg-[#c82333]";

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
                <div className={actionButtons}>
                    {article.approved !== true && (
                        <button
                            className={approveBtn}
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
                            className={rejectBtn}
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
        <div className={page}>
            <div className={header}>
                <div className={filterControls}>
                    <button
                        className={`${filterBtn} ${filter === 'all' ? filterBtnActive : filterBtnIdle}`}
                        onClick={() => {
                            setFilter('all');
                            setCurrentPage(1);
                        }}
                    >
                        All Articles
                    </button>
                    <button
                        className={`${filterBtn} ${filter === 'pending' ? filterBtnActive : filterBtnIdle}`}
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

            <div className={tableWrap}>
                <Table
                    columns={columns}
                    rows={articles}
                    rowKey={(article) => article.id}
                    rowClassName={(article) =>
                        expandedArticleId === article.id ? articleRowExpanded : articleRow
                    }
                    onRowClick={(article) => toggleExpand(article.id)}
                    renderAfterRow={(article) =>
                        expandedArticleId === article.id ? (
                            <tr className={detailsRow} key={`details-${article.id}`}>
                                <td colSpan={columns.length}>
                                    <div className={articleContent}>
                                        <div className={articleImage}>
                                            <img src={article.imageUrl} alt={article.title} className={articleImg} />
                                        </div>
                                        <div className={articleText}>
                                            <h3 className={articleTextH3}>Summary</h3>
                                            <p className={articleTextP}>{article.summary}</p>
                                            <h3 className={articleTextH3}>Content</h3>
                                            <p className={articleTextP}>{article.content}</p>
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

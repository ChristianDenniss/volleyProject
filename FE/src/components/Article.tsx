// src/components/Article.tsx — the public articles index.
import { useMemo, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useArticles } from "@/hooks/allFetch";
import { useAuth } from "@/context/authContext";
import type { Article } from "@/types/interfaces";
import SEO from "@/components/SEO";

import PageContainer from "@/components/ui/layout/PageContainer";
import PageHeader from "@/components/ui/layout/PageHeader";
import Toolbar from "@/components/ui/layout/Toolbar";
import CardGrid from "@/components/ui/layout/CardGrid";
import SearchBar from "@/components/ui/filters/SearchBar";
import FilterSelect from "@/components/ui/filters/FilterSelect";
import ErrorNotice from "@/components/ui/feedback/ErrorNotice";
import Button from "@/components/ui/buttons/Button";
import Pill from "@/components/ui/pills/Pill";

type SortOrder = "new" | "old" | "likes" | "least-likes";

const SORT_OPTIONS = [
  { value: "new", label: "Newest" },
  { value: "old", label: "Oldest" },
  { value: "likes", label: "Most Liked" },
  { value: "least-likes", label: "Least Liked" },
];

/** Comparators keyed by sort order — adding a sort is one entry, not another branch. */
const SORT_COMPARATORS: Record<SortOrder, (a: Article, b: Article) => number> = {
  new: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  old: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  likes: (a, b) => (b.likes || 0) - (a.likes || 0),
  "least-likes": (a, b) => (a.likes || 0) - (b.likes || 0),
};

/** The badge shown beside the sort control for the two "interesting" orders. */
const SORT_HINTS: Partial<Record<SortOrder, string>> = {
  likes: "🔥 Most Popular",
  "least-likes": "💡 Hidden Gems",
};

const AUTHORS = ["user", "admin", "superadmin"];

export default function Articles() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("new");
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const { data, error, loading } = useArticles();

  const handleCreateClick = (event: MouseEvent) => {
    const canAuthor = isAuthenticated && user && AUTHORS.includes(user.role);
    if (canAuthor) {
      navigate("/articles/create");
      return;
    }

    event.preventDefault();
    setAuthMessage(
      !isAuthenticated
        ? "Please log in to create articles."
        : "You need to be a registered user, admin, or superadmin to create articles."
    );
    setTimeout(() => setAuthMessage(null), 3000);
  };

  const approved = useMemo(
    () => (data ?? []).filter((article) => article.approved === true),
    [data]
  );

  const visibleArticles = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return approved
      .filter((article) => article.title.toLowerCase().includes(query))
      .sort(SORT_COMPARATORS[sortOrder]);
  }, [approved, searchTerm, sortOrder]);

  return (
    <PageContainer width="wide">
      <SEO
        title="Articles"
        description="News, recaps, and community writing from the Roblox Volleyball League."
        url="https://volleyball4-2.com/articles"
      />

      <PageHeader
        title="Articles"
        count={approved.length}
        subtitle="News, recaps and community writing from around the league."
        actions={
          <Button onClick={handleCreateClick}>Create Article</Button>
        }
      />

      {authMessage && <ErrorNotice message={authMessage} tone="warning" />}

      <Toolbar
        filters={
          <>
            <FilterSelect
              label="Sort order"
              value={sortOrder}
              onChange={(value) => setSortOrder(value as SortOrder)}
              options={SORT_OPTIONS}
              placeholder=""
            />
            {SORT_HINTS[sortOrder] && (
              <Pill tone="warning" size="sm">{SORT_HINTS[sortOrder]}</Pill>
            )}
          </>
        }
        trailing={
          <SearchBar
            value={searchTerm}
            onSearch={setSearchTerm}
            placeholder="Search by title…"
            className="w-full sm:w-64"
          />
        }
      />

      <CardGrid
        loading={loading}
        error={error}
        loadingCount={6}
        loadingHeight="h-64"
        isEmpty={visibleArticles.length === 0}
        emptyLabel="No articles found."
      >
        {visibleArticles.map((article) => (
          <Link
            key={article.id}
            to={`/articles/${article.id}`}
            className="flex flex-col overflow-hidden rounded-card border border-border bg-surface no-underline transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-md)]"
          >
            <img
              src={article.imageUrl}
              alt={article.title}
              loading="lazy"
              className="h-40 w-full object-cover"
            />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h2 className="m-0 text-base font-semibold text-content">{article.title}</h2>
              <p className="m-0 line-clamp-3 flex-1 text-sm text-content-tertiary">
                {article.summary}
              </p>
              <div className="flex items-center justify-between gap-2 text-xs text-content-muted">
                <span>❤️ {article.likes || 0} likes</span>
                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </CardGrid>
    </PageContainer>
  );
}

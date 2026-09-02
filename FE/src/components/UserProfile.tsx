import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authFetch } from "../hooks/authFetch";
import { useAuth } from "../context/authContext";
import { BACKEND_URL } from "../constants/api";
import { startRobloxOAuth } from "../hooks/useTeamRegistrations";
import { getRobloxAvatarUrl } from "../utils/fetchAvatarRoblox";
import { isSafeExternalUrl } from "../utils/url";
import {
  GAME_STAFF_ROLES,
  GAME_STAFF_SECTION,
} from "../utils/gameStaff";
import type { Article, GameStaffRole, StaffedGame, User } from "../types/interfaces";

const page =
  "w-[min(100%,1100px)] mx-auto my-[2rem] px-[clamp(1rem,3vw,2rem)] box-border text-text " +
  "[font-family:'Inter',sans-serif]";

const status = `${page} text-center text-error py-[3rem]`;

const hero =
  "flex items-center gap-[1.5rem] mb-[2rem] p-[1.5rem] rounded-[1rem] border border-border " +
  "bg-bg-light upto-md:flex-col upto-md:text-center";

const avatarImg =
  "w-[96px] h-[96px] rounded-full object-cover border-2 border-brand-primary shrink-0 bg-bg";

const avatarFallback =
  `${avatarImg} flex items-center justify-center text-[1.75rem] font-bold text-brand-primary ` +
  "bg-[rgba(var(--color-brand-primary-rgb),0.1)]";

const displayName = "m-0 text-[2rem] font-bold text-brand-primary leading-tight";

const roleChip =
  "inline-block mt-[0.4rem] py-[0.15rem] px-[0.65rem] rounded-[999px] text-[0.75rem] font-bold " +
  "uppercase tracking-[0.04em] text-brand-primary bg-[rgba(var(--color-brand-primary-rgb),0.1)] " +
  "border border-brand-primary";

const robloxMeta = "m-0 mt-[0.35rem] text-text-muted text-[0.95rem]";

const settings =
  "flex flex-wrap items-center gap-[0.75rem] mt-[1.25rem] pt-[1.25rem] border-t border-border " +
  "text-[0.9rem] text-text-muted upto-md:justify-center";

const settingsBtn =
  "py-[0.4rem] px-[0.85rem] rounded-[6px] border border-brand-primary bg-brand-primary text-white " +
  "font-semibold cursor-pointer hover:bg-brand-primary-hover";

const settingsBtnGhost =
  "py-[0.4rem] px-[0.85rem] rounded-[6px] border border-border bg-bg text-text " +
  "font-semibold cursor-pointer hover:border-brand-primary";

const errorBanner = "m-0 mb-[1rem] py-[0.6rem] px-[0.9rem] rounded-[6px] bg-[var(--error-bg)] text-white text-[0.9rem]";

const sectionTitle = "m-0 mb-[0.85rem] text-[1.35rem] font-semibold text-brand-primary";

const tabs = "flex flex-wrap gap-[0.4rem] mb-[1rem]";

const tabBtn =
  "py-[0.35rem] px-[0.8rem] rounded-[999px] border border-border bg-bg text-[0.85rem] font-semibold " +
  "cursor-pointer text-text-muted hover:border-brand-primary";

const tabBtnOn = `${tabBtn} border-brand-primary bg-brand-primary text-white hover:bg-brand-primary`;

const cardGrid = "grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[0.85rem] mb-[2.25rem]";

const matchCard =
  "block no-underline text-inherit rounded-[0.85rem] border border-border bg-bg p-[1rem] " +
  "transition-[transform,box-shadow,border-color] duration-150 " +
  "hover:[transform:translateY(-3px)] hover:shadow-md hover:border-brand-primary";

const matchRole =
  "text-[0.7rem] font-bold uppercase tracking-[0.04em] text-brand-primary mb-[0.35rem]";

const matchName = "m-0 text-[1.05rem] font-bold leading-snug";

const matchMeta = "m-0 mt-[0.35rem] text-[0.85rem] text-text-muted";

const watchLink = "inline-block mt-[0.55rem] text-[0.85rem] font-semibold text-brand-primary no-underline hover:underline";

const empty = "m-0 mb-[2rem] text-text-muted";

const articleItem =
  "bg-accent-pale border border-solid border-accent-border rounded-md py-[0.75rem] px-[1rem] " +
  "mb-[0.75rem] shadow-sm transition-[transform,box-shadow,border-color] duration-200 " +
  "hover:[transform:translateY(-3px)] hover:shadow-md hover:border-brand-primary";

const articleLink = "no-underline text-text font-medium text-[0.95rem] hover:text-brand-primary";

type CrewFilter = "all" | GameStaffRole;

function gameTitle(credit: StaffedGame): string {
  if (credit.game.name) return credit.game.name;
  const teams = credit.game.teams ?? [];
  if (teams.length >= 2) return `${teams[0].name} vs ${teams[1].name}`;
  return `Game ${credit.game.id}`;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [crewFilter, setCrewFilter] = useState<CrewFilter>("all");
  const { isAuthenticated, loading: authLoading, logout, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await authFetch(
          `${BACKEND_URL}/api/users/profile`,
          { method: "GET" },
          token
        );

        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load profile");
        }

        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [authLoading, isAuthenticated, navigate, logout, token]);

  useEffect(() => {
    if (!profile?.robloxUsername) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    void getRobloxAvatarUrl(profile.robloxUsername).then((url) => {
      if (!cancelled) setAvatarUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.robloxUsername]);

  if (authLoading || loading) {
    return <div className={status}>Loading...</div>;
  }

  if (error) {
    return <div className={status}>{error}</div>;
  }

  if (!profile) {
    return null;
  }

  const articles = profile.articles ?? [];
  const staffedGames = profile.staffedGames ?? [];
  const visibleCredits =
    crewFilter === "all"
      ? staffedGames
      : staffedGames.filter((credit) => credit.role === crewFilter);

  const unlinkRoblox = async () => {
    setActionError(null);
    const res = await authFetch(
      `${BACKEND_URL}/api/auth/roblox/unlink`,
      { method: "POST" },
      token
    );
    if (res.ok) {
      const data = await res.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...data,
              staffedGames: prev.staffedGames,
              articles: prev.articles,
            }
          : prev
      );
      return;
    }
    const data = await res.json().catch(() => ({}));
    setActionError(data.error || "Failed to unlink Roblox");
  };

  return (
    <div className={page}>
      {actionError && <p className={errorBanner}>{actionError}</p>}

      <header className={hero}>
        {avatarUrl ? (
          <img className={avatarImg} src={avatarUrl} alt="" />
        ) : (
          <div className={avatarFallback} aria-hidden="true">
            {profile.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className={displayName}>{profile.username}</h1>
          <span className={roleChip}>{profile.role.replace(/_/g, " ")}</span>
          <p className={robloxMeta}>
            {profile.robloxUsername ? `@${profile.robloxUsername}` : "Roblox not connected"}
          </p>
        </div>
      </header>

      <div className={settings}>
        {profile.email && <span>{profile.email}</span>}
        {profile.createdAt && (
          <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
        )}
        {!profile.robloxUsername ? (
          <button type="button" className={settingsBtn} onClick={() => void startRobloxOAuth("connect")}>
            Connect Roblox
          </button>
        ) : (
          <button type="button" className={settingsBtnGhost} onClick={() => void unlinkRoblox()}>
            Disconnect Roblox
          </button>
        )}
      </div>

      <section className="mt-[2.25rem]" aria-labelledby="crew-heading">
        <h2 id="crew-heading" className={sectionTitle}>
          Match crew
        </h2>
        <div className={tabs} role="tablist" aria-label="Filter credited matches">
          <button
            type="button"
            className={crewFilter === "all" ? tabBtnOn : tabBtn}
            onClick={() => setCrewFilter("all")}
          >
            All
          </button>
          {GAME_STAFF_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className={crewFilter === role ? tabBtnOn : tabBtn}
              onClick={() => setCrewFilter(role)}
            >
              {GAME_STAFF_SECTION[role]}
            </button>
          ))}
        </div>

        {visibleCredits.length === 0 ? (
          <p className={empty}>
            {staffedGames.length === 0
              ? "Admins assign referee, streamer, and commentator credits when a match is logged. Nothing is credited to you yet."
              : "No matches in this role yet."}
          </p>
        ) : (
          <div className={cardGrid}>
            {visibleCredits.map((credit) => (
              <article key={`${credit.role}-${credit.game.id}`} className={matchCard}>
                <Link to={`/games/${credit.game.id}`} className="no-underline text-inherit block">
                  <div className={matchRole}>{GAME_STAFF_SECTION[credit.role]}</div>
                  <h3 className={matchName}>{gameTitle(credit)}</h3>
                  <p className={matchMeta}>
                    {new Date(credit.game.date).toLocaleDateString()}
                    {credit.game.stage ? ` · ${credit.game.stage}` : ""}
                  </p>
                </Link>
                {isSafeExternalUrl(credit.game.videoUrl) && (
                  <a
                    className={watchLink}
                    href={credit.game.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Watch
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="articles-heading">
        <h2 id="articles-heading" className={sectionTitle}>
          Your articles
        </h2>
        {articles.length > 0 ? (
          <ul className="list-none p-0 m-0">
            {articles.map((article: Article) => (
              <li key={article.id} className={articleItem}>
                <Link to={`/articles/${article.id}`} className={articleLink}>
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={empty}>You have not created any articles yet.</p>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;

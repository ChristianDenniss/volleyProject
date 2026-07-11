import React, { useEffect, useMemo, useState } from "react";
import { useApplications } from "../../hooks/allFetch";
import { useApplicationMutations } from "../../hooks/allPatch";
import type { Application } from "../../types/interfaces";
import "../../styles/PortalApplicationsPage.css";

type DraftState = Record<
    string,
    {
        url: string;
        status: Application["status"];
    }
>;

const PortalApplicationsPage: React.FC = () => {
    const { data: applications, loading, error } = useApplications();
    const { patchApplication } = useApplicationMutations();
    const [drafts, setDrafts] = useState<DraftState>({});
    const [savingSlug, setSavingSlug] = useState<string | null>(null);
    const [savedSlug, setSavedSlug] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (!applications) {
            return;
        }

        setDrafts(
            Object.fromEntries(
                applications.map((application: Application) => [
                    application.slug,
                    {
                        url: application.url ?? "",
                        status: application.status,
                    },
                ])
            )
        );
    }, [applications]);

    const sortedApplications = useMemo(() => {
        return [...(applications ?? [])].sort(
            (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
        );
    }, [applications]);

    const updateDraft = (
        slug: string,
        updates: Partial<DraftState[string]>
    ) => {
        setDrafts((current) => ({
            ...current,
            [slug]: {
                ...current[slug],
                ...updates,
            },
        }));
        setSavedSlug(null);
    };

    const handleSave = async (application: Application) => {
        const draft = drafts[application.slug];
        if (!draft) {
            return;
        }

        setSavingSlug(application.slug);
        setSaveError(null);

        try {
            await patchApplication(application.slug, {
                url: draft.url.trim() === "" ? null : draft.url.trim(),
                status: draft.status,
            });
            setSavedSlug(application.slug);
        } catch (err) {
            setSaveError(
                err instanceof Error
                    ? err.message
                    : "Failed to save application"
            );
        } finally {
            setSavingSlug(null);
        }
    };

    if (loading) {
        return <div className="portal-applications-page">Loading...</div>;
    }

    if (error) {
        return <div className="portal-applications-page">Error: {error}</div>;
    }

    return (
        <div className="portal-applications-page">
            <div className="page-header">
                <div>
                    <h1>Applications</h1>
                    <p>
                        Configure the external form URL and open/closed status
                        for each application type shown on the public page.
                    </p>
                </div>
            </div>

            {saveError && <div className="portal-applications-error">{saveError}</div>}

            <div className="portal-applications-list">
                {sortedApplications.map((application) => {
                    const draft = drafts[application.slug];
                    if (!draft) {
                        return null;
                    }

                    return (
                        <section key={application.slug} className="portal-application-card">
                            <div className="portal-application-card-header">
                                <div>
                                    <h2>{application.name}</h2>
                                    <p>{application.type}</p>
                                </div>
                                <span className={`status-pill ${draft.status}`}>
                                    {draft.status === "open" ? "Open" : "Closed"}
                                </span>
                            </div>

                            <p className="portal-application-description">
                                {application.description}
                            </p>

                            <div className="portal-application-fields">
                                <label htmlFor={`url-${application.slug}`}>
                                    Application URL
                                </label>
                                <input
                                    id={`url-${application.slug}`}
                                    type="url"
                                    value={draft.url}
                                    onChange={(event) =>
                                        updateDraft(application.slug, {
                                            url: event.target.value,
                                        })
                                    }
                                    placeholder="https://forms.gle/..."
                                />

                                <label htmlFor={`status-${application.slug}`}>
                                    Status
                                </label>
                                <select
                                    id={`status-${application.slug}`}
                                    value={draft.status}
                                    onChange={(event) =>
                                        updateDraft(application.slug, {
                                            status: event.target.value as Application["status"],
                                        })
                                    }
                                >
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div className="portal-application-actions">
                                <button
                                    type="button"
                                    className="save-btn"
                                    onClick={() => handleSave(application)}
                                    disabled={savingSlug === application.slug}
                                >
                                    {savingSlug === application.slug ? "Saving..." : "Save"}
                                </button>
                                {savedSlug === application.slug && (
                                    <span className="save-success">Saved</span>
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

export default PortalApplicationsPage;

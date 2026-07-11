import React, { useEffect, useMemo, useState } from "react";
import { useApplicationForms } from "../../hooks/allFetch";
import { useApplicationFormMutations } from "../../hooks/allPatch";
import type { ApplicationForm } from "../../types/interfaces";
import "../../styles/PortalApplicationsPage.css";

type DraftState = Record<
    string,
    {
        url: string;
        status: ApplicationForm["status"];
    }
>;

const PortalApplicationsPage: React.FC = () => {
    const { data: forms, loading, error } = useApplicationForms();
    const { patchApplicationForm } = useApplicationFormMutations();
    const [drafts, setDrafts] = useState<DraftState>({});
    const [savingSlug, setSavingSlug] = useState<string | null>(null);
    const [savedSlug, setSavedSlug] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (!forms) {
            return;
        }

        setDrafts(
            Object.fromEntries(
                forms.map((form) => [
                    form.slug,
                    {
                        url: form.url ?? "",
                        status: form.status,
                    },
                ])
            )
        );
    }, [forms]);

    const sortedForms = useMemo(() => {
        return [...(forms ?? [])].sort(
            (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
        );
    }, [forms]);

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

    const handleSave = async (form: ApplicationForm) => {
        const draft = drafts[form.slug];
        if (!draft) {
            return;
        }

        setSavingSlug(form.slug);
        setSaveError(null);

        try {
            await patchApplicationForm(form.slug, {
                url: draft.url.trim() === "" ? null : draft.url.trim(),
                status: draft.status,
            });
            setSavedSlug(form.slug);
        } catch (err) {
            setSaveError(
                err instanceof Error
                    ? err.message
                    : "Failed to save application form"
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
                {sortedForms.map((form) => {
                    const draft = drafts[form.slug];
                    if (!draft) {
                        return null;
                    }

                    return (
                        <section key={form.slug} className="portal-application-card">
                            <div className="portal-application-card-header">
                                <div>
                                    <h2>{form.name}</h2>
                                    <p>{form.type}</p>
                                </div>
                                <span className={`status-pill ${draft.status}`}>
                                    {draft.status === "open" ? "Open" : "Closed"}
                                </span>
                            </div>

                            <p className="portal-application-description">
                                {form.description}
                            </p>

                            <div className="portal-application-fields">
                                <label htmlFor={`url-${form.slug}`}>
                                    Application URL
                                </label>
                                <input
                                    id={`url-${form.slug}`}
                                    type="url"
                                    value={draft.url}
                                    onChange={(event) =>
                                        updateDraft(form.slug, {
                                            url: event.target.value,
                                        })
                                    }
                                    placeholder="https://forms.gle/..."
                                />

                                <label htmlFor={`status-${form.slug}`}>
                                    Status
                                </label>
                                <select
                                    id={`status-${form.slug}`}
                                    value={draft.status}
                                    onChange={(event) =>
                                        updateDraft(form.slug, {
                                            status: event.target.value as ApplicationForm["status"],
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
                                    onClick={() => handleSave(form)}
                                    disabled={savingSlug === form.slug}
                                >
                                    {savingSlug === form.slug ? "Saving..." : "Save"}
                                </button>
                                {savedSlug === form.slug && (
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

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

const page = "p-[1.5rem]";

const pageHeader = "mb-[1.5rem]";

const pageTitle = "m-0 mb-[0.5rem] text-brand-primary";

const pageLead = "m-0 text-text-muted-alt max-w-[720px]";

const errorBanner =
    "bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb] rounded-[6px] py-[0.75rem] px-[1rem] mb-[1rem]";

const list = "flex flex-col gap-[1rem]";

const card =
    "bg-white border border-border rounded-[8px] p-[1.25rem] shadow-sm";

const cardHeader = "flex justify-between items-start gap-[1rem] mb-[0.75rem]";

const cardTitle = "m-0 mb-[0.25rem] text-brand-primary text-[1.15rem]";

const cardType = "m-0 text-text-muted-alt text-[0.95rem]";

const description = "m-0 mb-[1rem] text-text-muted leading-[1.5]";

const fields = "portal-application-fields grid gap-[0.5rem] mb-[1rem]";

const fieldLabel = "font-semibold text-text";

const fieldInput =
    "w-full py-[0.65rem] px-[0.75rem] border border-border rounded-[6px] [font:inherit] box-border";

const pillBase =
    "py-[0.25rem] px-[0.75rem] rounded-[999px] text-[0.85rem] font-semibold whitespace-nowrap";

const actions = "flex items-center gap-[0.75rem]";

const saveBtn =
    "bg-brand-primary text-text-on-brand border-none rounded-[6px] py-[0.6rem] px-[1rem] " +
    "[font:inherit] font-semibold cursor-pointer " +
    "hover:enabled:bg-brand-primary-hover disabled:opacity-70 disabled:cursor-not-allowed";

const saveSuccess = "text-success font-semibold";

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
        return <div className={page}>Loading...</div>;
    }

    if (error) {
        return <div className={page}>Error: {error}</div>;
    }

    return (
        <div className={page}>
            <div className={pageHeader}>
                <div>
                    <h1 className={pageTitle}>Applications</h1>
                    <p className={pageLead}>
                        Configure the external form URL and open/closed status
                        for each application type shown on the public page.
                    </p>
                </div>
            </div>

            {saveError && <div className={errorBanner}>{saveError}</div>}

            <div className={list}>
                {sortedApplications.map((application) => {
                    const draft = drafts[application.slug];
                    if (!draft) {
                        return null;
                    }

                    return (
                        <section key={application.slug} className={card}>
                            <div className={cardHeader}>
                                <div>
                                    <h2 className={cardTitle}>{application.name}</h2>
                                    <p className={cardType}>{application.type}</p>
                                </div>
                                {/* Open/closed colour used to come from a second class
                                   the stylesheet read. The same flag now picks the
                                   pair directly. */}
                                <span
                                    className={`${pillBase} ${
                                        draft.status === "open"
                                            ? "bg-[#d4edda] text-[#155724]"
                                            : "bg-[#e2e8f0] text-[#475569]"
                                    }`}
                                >
                                    {draft.status === "open" ? "Open" : "Closed"}
                                </span>
                            </div>

                            <p className={description}>
                                {application.description}
                            </p>

                            <div className={fields}>
                                <label
                                    className={fieldLabel}
                                    htmlFor={`url-${application.slug}`}
                                >
                                    Application URL
                                </label>
                                <input
                                    id={`url-${application.slug}`}
                                    className={fieldInput}
                                    type="url"
                                    value={draft.url}
                                    onChange={(event) =>
                                        updateDraft(application.slug, {
                                            url: event.target.value,
                                        })
                                    }
                                    placeholder="https://forms.gle/..."
                                />

                                <label
                                    className={fieldLabel}
                                    htmlFor={`status-${application.slug}`}
                                >
                                    Status
                                </label>
                                <select
                                    id={`status-${application.slug}`}
                                    className="portal-application-status-select"
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

                            <div className={actions}>
                                <button
                                    type="button"
                                    className={saveBtn}
                                    onClick={() => handleSave(application)}
                                    disabled={savingSlug === application.slug}
                                >
                                    {savingSlug === application.slug ? "Saving..." : "Save"}
                                </button>
                                {savedSlug === application.slug && (
                                    <span className={saveSuccess}>Saved</span>
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

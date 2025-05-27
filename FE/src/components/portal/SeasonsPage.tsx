// src/pages/SeasonsPage.tsx
import React, { useState, useEffect } from "react";
import { useSeasons }                  from "../../hooks/allFetch";
import { useSeasonMutations }          from "../../hooks/allPatch";
import type { Season }                 from "../../types/interfaces";
import "../../styles/UsersPage.css";

type EditField = "theme" | "image" | "startDate" | "endDate";
interface EditingState {
  id: number;
  field: EditField;
  value: string; // "YYYY-MM-DD" for dates, text otherwise
}

const SeasonsPage: React.FC = () =>
{
  const { data: seasons, loading, error } = useSeasons();
  const { patchSeason }                   = useSeasonMutations();
  const [ localSeasons, setLocalSeasons ] = useState<Season[]>([]);
  const [ editing, setEditing ]           = useState<EditingState | null>(null);

  useEffect(() =>
  {
    if (seasons) setLocalSeasons(seasons);
  }, [seasons]);

  const commitEdit = async () =>
  {
    if (!editing) return;
    const { id, field, value } = editing;

    // ← Compare against localSeasons, not the original hook data
    const orig = localSeasons.find((s) => s.id === id);
    if (!orig)
    {
      setEditing(null);
      return;
    }

    // derive original string for compare/label
    let origValue: string;
    if (field === "theme")         origValue = orig.theme;
    else if (field === "image")     origValue = orig.image ?? "";
    else if (field === "startDate") origValue = new Date(orig.startDate).toISOString().slice(0, 10);
    else                            origValue = orig.endDate
                                          ? new Date(orig.endDate).toISOString().slice(0, 10)
                                          : "";

    // now if you revert back to the original local value, it'll recognize the change
    if (value === origValue)
    {
      setEditing(null);
      return;
    }

    const label =
      field === "theme"     ? "theme" :
      field === "image"     ? "image URL" :
      field === "startDate" ? "start date" : "end date";

    if (!window.confirm(`Change ${label} from "${origValue}" to "${value}"?`))
    {
      setEditing(null);
      return;
    }

    // build payload, omitting empty optional fields
    const payload: Partial<Season> = {};
    if (field === "theme")
    {
      payload.theme = value;
    }
    else if (field === "image")
    {
      payload.image = value !== "" ? value : undefined;
    }
    else if (field === "startDate")
    {
      payload.startDate = new Date(value);
    }
    else
    {
      payload.endDate = value !== "" ? new Date(value) : undefined;
    }

    try
    {
      const updated = await patchSeason(id, payload);

      // update local state from the returned Season
      setLocalSeasons((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                theme:     updated.theme,
                image:     updated.image,
                startDate: updated.startDate,
                endDate:   updated.endDate,
              }
            : s
        )
      );
    }
    catch (err: any)
    {
      console.error(err);
      alert("Failed to save changes:\n" + err.message);
    }
    finally
    {
      setEditing(null);
    }
  };

  if (loading) return <p>Loading seasons…</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Seasons</h1>
      <table className="users-table">
        <thead>
          <tr>
            <th>Season #</th>
            <th>Theme</th>
            <th>Image URL</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {localSeasons.map((s) =>
          {
            const startStr = new Date(s.startDate).toISOString().slice(0, 10);
            const endStr   = s.endDate
              ? new Date(s.endDate).toISOString().slice(0, 10)
              : "";

            return (
              <tr key={s.id}>
                <td>{s.seasonNumber}</td>

                {/* Theme */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({ id: s.id, field: "theme", value: s.theme })
                  }
                >
                  {editing?.id === s.id && editing.field === "theme" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) =>
                      {
                        if (e.key === "Enter")
                        {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape")
                        {
                          setEditing(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    s.theme
                  )}
                </td>

                {/* Image URL */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({ id: s.id, field: "image", value: s.image ?? "" })
                  }
                >
                  {editing?.id === s.id && editing.field === "image" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) =>
                      {
                        if (e.key === "Enter")
                        {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape")
                        {
                          setEditing(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : s.image ? (
                    s.image
                  ) : (
                    <span className="text-muted">None</span>
                  )}
                </td>

                {/* Start Date */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({ id: s.id, field: "startDate", value: startStr })
                  }
                >
                  {editing?.id === s.id && editing.field === "startDate" ? (
                    <input
                      type="date"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) =>
                      {
                        if (e.key === "Enter")
                        {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape")
                        {
                          setEditing(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    new Date(s.startDate).toLocaleDateString()
                  )}
                </td>

                {/* End Date */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({ id: s.id, field: "endDate", value: endStr })
                  }
                >
                  {editing?.id === s.id && editing.field === "endDate" ? (
                    <input
                      type="date"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) =>
                      {
                        if (e.key === "Enter")
                        {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape")
                        {
                          setEditing(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : s.endDate ? (
                    new Date(s.endDate).toLocaleDateString()
                  ) : (
                    "Ongoing"
                  )}
                </td>

                <td>
                  <span className="text-muted">No actions available</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SeasonsPage;

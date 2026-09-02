import React, { useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useUsers } from "../../hooks/useUsers";
import type { GameStaffRole } from "../../types/interfaces";
import {
  GAME_STAFF_LABELS,
  GAME_STAFF_ROLES,
  type StaffDraft,
} from "../../utils/gameStaff";

const fieldLabel = "block mb-[0.35rem] text-[0.85rem] font-semibold text-[#334155]";
const searchInput =
  "w-full py-[0.4rem] px-[0.6rem] border border-[#e2e8f0] rounded-[0.375rem] text-[0.9rem] " +
  "focus:outline-none focus:border-accent";
const chip =
  "inline-flex items-center gap-[0.35rem] py-[0.15rem] px-[0.5rem] rounded-[999px] " +
  "bg-[rgba(var(--color-brand-primary-rgb),0.1)] text-brand-primary text-[0.8rem] font-medium";
const chipRemove =
  "border-none bg-transparent text-brand-primary cursor-pointer p-0 leading-none text-[1rem]";
const suggestion =
  "w-full text-left py-[0.4rem] px-[0.6rem] border-none bg-transparent cursor-pointer text-[0.9rem] " +
  "hover:bg-[#f8fafc]";

type GameStaffEditorProps = {
  value: StaffDraft[];
  onChange: (next: StaffDraft[]) => void;
};

const GameStaffEditor: React.FC<GameStaffEditorProps> = ({ value, onChange }) => {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<GameStaffRole>("referee");
  const debouncedSearch = useDebouncedValue(search, 250);
  const { users, loading } = useUsers({
    page: 1,
    limit: 8,
    search: debouncedSearch || undefined,
  });

  const add = (userId: number, username: string, nextRole: GameStaffRole) => {
    if (value.some((entry) => entry.userId === userId && entry.role === nextRole)) return;
    onChange([...value, { userId, role: nextRole, username }]);
    setSearch("");
  };

  const remove = (userId: number, nextRole: GameStaffRole) => {
    onChange(value.filter((entry) => !(entry.userId === userId && entry.role === nextRole)));
  };

  return (
    <div className="flex flex-col gap-[0.85rem]">
      {GAME_STAFF_ROLES.map((staffRole) => {
        const assigned = value.filter((entry) => entry.role === staffRole);
        return (
          <div key={staffRole}>
            <span className={fieldLabel}>{GAME_STAFF_LABELS[staffRole]}s</span>
            {assigned.length === 0 ? (
              <p className="m-0 text-[0.8rem] text-[#6b7280]">None assigned</p>
            ) : (
              <div className="flex flex-wrap gap-[0.4rem]">
                {assigned.map((entry) => (
                  <span key={`${entry.role}-${entry.userId}`} className={chip}>
                    {entry.username}
                    <button
                      type="button"
                      className={chipRemove}
                      onClick={() => remove(entry.userId, entry.role)}
                      aria-label={`Remove ${entry.username} as ${GAME_STAFF_LABELS[entry.role]}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div>
        <label className={fieldLabel} htmlFor="game-staff-search">
          Add crew
        </label>
        <div className="flex gap-[0.5rem] mb-[0.4rem] upto-md:flex-col">
          <select
            className={searchInput}
            value={role}
            onChange={(e) => setRole(e.target.value as GameStaffRole)}
            aria-label="Crew role"
          >
            {GAME_STAFF_ROLES.map((staffRole) => (
              <option key={staffRole} value={staffRole}>
                {GAME_STAFF_LABELS[staffRole]}
              </option>
            ))}
          </select>
          <input
            id="game-staff-search"
            className={searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search site users…"
          />
        </div>
        {search.trim() && (
          <div className="border border-[#e2e8f0] rounded-[0.375rem] max-h-[10rem] overflow-y-auto">
            {loading ? (
              <p className="m-0 py-[0.5rem] px-[0.6rem] text-[0.85rem] text-[#6b7280]">Searching…</p>
            ) : (users ?? []).length === 0 ? (
              <p className="m-0 py-[0.5rem] px-[0.6rem] text-[0.85rem] text-[#6b7280]">
                No users match. They need a site account first.
              </p>
            ) : (
              (users ?? []).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={suggestion}
                  onClick={() => add(user.id, user.username, role)}
                >
                  {user.username}
                  {user.robloxUsername ? ` (@${user.robloxUsername})` : ""}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStaffEditor;

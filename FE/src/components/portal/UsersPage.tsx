/**
 * UsersPage — the admin portal's user management view: a paginated, searchable, role-filtered table where a superadmin can promote or demote any non-superadmin account.
 * The Actions cell states *why* an action is unavailable ("This is you", "Cannot moderate a user of the same role", "No actions available") rather than rendering an empty cell, and a role change confirms through `ConfirmModal` before it is applied.
 * Lives in `components/portal/`; mounted at /portal/users.
 */
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/authContext'
import type { User } from '@/types/interfaces'
import { useUsers } from '@/hooks/useUsers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import Toolbar from '@/components/ui/layout/Toolbar'
import ResultsCounter from '@/components/ui/layout/ResultsCounter'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import FilterBar from '@/components/ui/filters/FilterBar'
import FilterSelect from '@/components/ui/filters/FilterSelect'
import SearchBar from '@/components/ui/filters/SearchBar'
import Pagination from '@/components/ui/navigation/Pagination'
import Select from '@/components/ui/inputs/Select'
import ConfirmModal from '@/components/ui/modals/ConfirmModal'
import Pill, { type PillTone } from '@/components/ui/pills/Pill'

const USERS_PER_PAGE = 10

const ALL_ROLES: User['role'][] = [
  'user',
  'captain',
  'vice_captain',
  'court_captain',
  'admin',
  'superadmin',
]

/** Role → chip tone, so seniority reads at a glance instead of as plain text. */
const ROLE_TONES: Partial<Record<User['role'], PillTone>> = {
  superadmin: 'danger',
  admin: 'purple',
  captain: 'accent',
  vice_captain: 'info',
  court_captain: 'info',
}

/** "vice_captain" → "Vice Captain". */
function humanizeRole(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface PendingRoleChange {
  user: User
  role: User['role']
}

export default function UsersPage() {
  const { user: me } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null)

  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { users, total, totalPages, loading, error, changeRole } = useUsers({
    page: currentPage,
    limit: USERS_PER_PAGE,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  })

  const [localUsers, setLocalUsers] = useState<User[]>([])

  useEffect(() => {
    setLocalUsers(users)
  }, [users])

  /** Only a superadmin may change roles, and a superadmin account is never a target. */
  const promotableRoles = (target: User): User['role'][] => {
    if (me?.role !== 'superadmin') return []
    if (target.role === 'superadmin') return []
    return ALL_ROLES.filter((role) => role !== target.role)
  }

  const roleOptions = useMemo(
    () => ALL_ROLES.map((role) => ({ value: role, label: humanizeRole(role) })),
    []
  )

  const columns: DataTableColumn<User>[] = [
    { key: 'id', header: 'ID', width: 'w-16', render: (user) => user.id },
    {
      key: 'username',
      header: 'Name',
      render: (user) => <span className="font-medium text-content">{user.username}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Pill tone={ROLE_TONES[user.role] ?? 'neutral'} size="sm">
          {humanizeRole(user.role)}
        </Pill>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (user) => {
        if (user.id === me?.id) {
          return <span className="text-xs text-content-muted">This is you</span>
        }
        if (user.role === me?.role) {
          return (
            <span className="text-xs text-content-muted">
              Cannot moderate a user of the same role
            </span>
          )
        }

        const options = promotableRoles(user)
        if (options.length === 0) {
          return <span className="text-xs text-content-muted">No actions available</span>
        }

        return (
          <Select
            size="sm"
            aria-label={`Change role for ${user.username}`}
            value=""
            placeholder="Change role…"
            options={options.map((role) => ({ value: role, label: humanizeRole(role) }))}
            onChange={(e) => {
              const nextRole = e.target.value as User['role']
              if (nextRole) setPendingChange({ user, role: nextRole })
              e.currentTarget.value = ''
            }}
            className="w-auto min-w-[10rem]"
          />
        )
      },
    },
  ]

  const clearFilters = () => {
    setSearchQuery('')
    setRoleFilter('')
    setCurrentPage(1)
  }

  return (
    <PageContainer>
      <PageHeader title="Users" />

      <Toolbar
        filters={
          <FilterBar
            onReset={clearFilters}
            activeCount={[searchQuery, roleFilter].filter(Boolean).length}
          >
            <FilterSelect
              label="Role"
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value)
                setCurrentPage(1)
              }}
              options={roleOptions}
              placeholder="All Roles"
            />
          </FilterBar>
        }
        trailing={
          <>
            <SearchBar
              value={searchQuery}
              onSearch={(query) => {
                setSearchQuery(query)
                setCurrentPage(1)
              }}
              placeholder="Search users…"
              className="w-full sm:w-64"
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        }
      />

      <ResultsCounter page={currentPage} pageSize={USERS_PER_PAGE} total={total} noun="users" />

      <DataTable
        columns={columns}
        rows={localUsers}
        rowKey={(user) => user.id}
        loading={loading}
        error={error}
        emptyLabel="No users match your filters."
      />

      <ConfirmModal
        isOpen={pendingChange !== null}
        onClose={() => setPendingChange(null)}
        onConfirm={() => {
          if (pendingChange) changeRole(pendingChange.user.id, pendingChange.role)
          setPendingChange(null)
        }}
        tone="primary"
        title="Change role"
        confirmLabel="Change role"
        message={
          <>
            Change <strong>{pendingChange?.user.username}</strong>&rsquo;s role to{' '}
            <strong>{pendingChange ? humanizeRole(pendingChange.role) : ''}</strong>?
          </>
        }
      />
    </PageContainer>
  )
}

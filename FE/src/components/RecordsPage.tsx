/**
 * RecordsPage — the league record book: leaderboards for every tracked statistic, switchable between single-game and full-season records, with an admin-only recalculation trigger.
 * Record types are ordered by an explicit `RECORD_TYPE_ORDER` rather than alphabetically (kills before errors), and the spiking-percentage records sort to the end by their attempt threshold — a rule that reads as arbitrary unless it's stated in one place.
 * Lives in `components/`; routed at /records.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecords } from '@/hooks/allFetch'
import { useCalculateRecords } from '@/hooks/allCreate'
import { useRegion } from '@/context/regionContext'
import { useAuth } from '@/context/authContext'
import type { Records } from '@/types/interfaces'

import PageContainer from '@/components/ui/layout/PageContainer'
import PageHeader from '@/components/ui/layout/PageHeader'
import SectionHeader from '@/components/ui/layout/SectionHeader'
import DataTable, { type DataTableColumn } from '@/components/ui/layout/DataTable'
import Tabs from '@/components/ui/navigation/Tabs'
import Button from '@/components/ui/buttons/Button'
import Modal from '@/components/ui/modals/Modal'
import PlacementBadge from '@/components/ui/badges/PlacementBadge'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'
import EmptyState from '@/components/ui/feedback/EmptyState'
import { SkeletonTable } from '@/components/ui/feedback/Skeleton'

type RecordScope = 'game' | 'season'

const SCOPE_TABS = [
  { key: 'game', label: 'Single Game Records' },
  { key: 'season', label: 'Season Records' },
]

/** Display order for record types — offensive volume first, errors last. */
const RECORD_TYPE_ORDER = [
  'most total kills',
  'most total attempts',
  'most spike kills',
  'most spike attempts',
  'most ape kills',
  'most ape attempts',
  'most spike errors',
  'most blocks',
  'most assists',
  'most set errors',
  'most digs',
  'most block follows',
  'most aces',
  'most serve errors',
  'most misc errors',
  'most total errors',
]

const RECORD_LABELS: Record<string, string> = {
  'most spike kills': 'Most Spike Kills',
  'most assists': 'Most Assists',
  'most ape kills': 'Most APE Kills',
  'most digs': 'Most Digs',
  'most block follows': 'Most Block Follows',
  'most blocks': 'Most Blocks',
  'most aces': 'Most Aces',
  'most serve errors': 'Most Serve Errors',
  'most misc errors': 'Most Misc Errors',
  'most set errors': 'Most Set Errors',
  'most spike errors': 'Most Spike Errors',
  'most spike attempts': 'Most Spike Attempts',
  'most ape attempts': 'Most APE Attempts',
  'most total kills': 'Most Total Kills',
  'most total attempts': 'Most Total Attempts',
  'most total errors': 'Most Total Errors',
}

const SPIKING_PERCENT = 'best total spiking %'

/** Percentage records carry their attempt threshold in the key ("best total spiking % 50"). */
function attemptThreshold(recordType: string): number {
  return Number.parseInt(recordType.match(/\d+/)?.[0] ?? '0', 10)
}

function recordLabel(recordType: string): string {
  if (recordType.includes(SPIKING_PERCENT)) {
    return `Best Total Spiking % (${attemptThreshold(recordType)}+ attempts)`
  }
  return RECORD_LABELS[recordType] ?? recordType
}

/**
 * Percentage records sort to the very end (ascending by attempt threshold); everything else
 * follows RECORD_TYPE_ORDER, with unrecognised keys alphabetical after that.
 */
function compareRecordTypes(a: string, b: string): number {
  const aPercent = a.includes(SPIKING_PERCENT)
  const bPercent = b.includes(SPIKING_PERCENT)

  if (aPercent && bPercent) return attemptThreshold(a) - attemptThreshold(b)
  if (aPercent) return 1
  if (bPercent) return -1

  const aIndex = RECORD_TYPE_ORDER.indexOf(a)
  const bIndex = RECORD_TYPE_ORDER.indexOf(b)
  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
  if (aIndex !== -1) return -1
  if (bIndex !== -1) return 1
  return a.localeCompare(b)
}

function formatRecordValue(record: Records): string {
  const value = Number(record.value)
  if (record.value === null || record.value === undefined || Number.isNaN(value)) return 'N/A'
  if (record.record.includes('spiking %')) return `${value.toFixed(1)}%`
  return Math.round(value).toString()
}

function formatRecordDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Normalises any thrown value to a message for the error dialog. */
function toErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const candidate = err as {
      message?: string
      error?: string
      response?: { data?: { error?: string } }
    }
    return candidate.message ?? candidate.error ?? candidate.response?.data?.error ?? 'Unknown error'
  }
  return 'Unknown error'
}

export default function RecordsPage() {
  const { regionQuery } = useRegion()
  const { user } = useAuth()

  const [scope, setScope] = useState<RecordScope>('game')
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [localRecords, setLocalRecords] = useState<Records[]>([])

  const { data: records, loading, error, refetch } = useRecords({
    type: scope,
    limit: 1000,
    page: 1,
    ...regionQuery,
  })

  const { calculateRecords, loading: calculating } = useCalculateRecords((err: unknown) =>
    setErrorModal(toErrorMessage(err))
  )

  useEffect(() => {
    if (records) setLocalRecords(records)
  }, [records])

  const canRecalculate = user?.role === 'admin' || user?.role === 'superadmin'

  const groupedRecordTypes = useMemo(() => {
    const groups: Record<string, Records[]> = {}
    for (const record of localRecords) {
      ;(groups[record.record] ??= []).push(record)
    }
    return Object.keys(groups)
      .sort(compareRecordTypes)
      .map((recordType) => ({ recordType, rows: groups[recordType] }))
  }, [localRecords])

  const columns: DataTableColumn<Records>[] = useMemo(
    () => [
      {
        key: 'rank',
        header: 'Rank',
        width: 'w-20',
        render: (record) => <PlacementBadge place={record.rank} size="sm" />,
      },
      {
        key: 'player',
        header: 'Player',
        render: (record) => (
          <Link
            to={`/players/${record.player?.id}`}
            className="font-medium text-accent no-underline hover:underline"
          >
            {record.player?.name || 'Unknown Player'}
          </Link>
        ),
      },
      {
        key: 'value',
        header: 'Value',
        align: 'right',
        render: (record) => (
          <span className="font-semibold tabular-nums text-content">
            {formatRecordValue(record)}
          </span>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        hideOnMobile: true,
        render: (record) => formatRecordDate(record.date),
      },
      {
        key: 'gameOrSeason',
        header: scope === 'game' ? 'Game' : 'Season',
        align: 'right',
        render: (record) =>
          scope === 'game' ? (
            <Link
              to={`/games/${record.gameId}`}
              className="text-accent no-underline hover:underline"
            >
              View Game
            </Link>
          ) : (
            <Link
              to={`/seasons/${record.season?.id}`}
              className="text-accent no-underline hover:underline"
            >
              S{record.season?.seasonNumber || '?'}
            </Link>
          ),
      },
    ],
    [scope]
  )

  return (
    <PageContainer>
      <PageHeader
        title="Records"
        subtitle="League bests for every tracked statistic."
        actions={
          canRecalculate && (
            <Button
              variant="secondary"
              loading={calculating}
              loadingLabel="Calculating…"
              onClick={async () => {
                if (await calculateRecords()) refetch()
              }}
            >
              Re-calculate Records
            </Button>
          )
        }
      />

      <Tabs
        variant="segmented"
        items={SCOPE_TABS}
        activeKey={scope}
        onChange={(key) => setScope(key as RecordScope)}
      />

      {error ? (
        <ErrorNotice title="Error Loading Records" message={error} />
      ) : loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonTable key={index} rows={5} />
          ))}
        </div>
      ) : groupedRecordTypes.length === 0 ? (
        <EmptyState label="No records recorded yet for this region." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groupedRecordTypes.map(({ recordType, rows }) => (
            <section key={recordType} className="flex flex-col gap-3">
              <SectionHeader title={recordLabel(recordType)} level={3} />
              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(record) => record.id}
                density="compact"
              />
            </section>
          ))}
        </div>
      )}

      <Modal
        isOpen={errorModal !== null}
        onClose={() => setErrorModal(null)}
        title="Error"
        size="sm"
        footer={<Button onClick={() => setErrorModal(null)}>Close</Button>}
      >
        <ErrorNotice message={errorModal ?? ''} />
      </Modal>
    </PageContainer>
  )
}

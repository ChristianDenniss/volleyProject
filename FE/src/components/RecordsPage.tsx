// src/components/RecordsPage.tsx

import React, { useState, useEffect } from "react";
import { useRecords } from "../hooks/allFetch";
import { useCalculateRecords } from "../hooks/allCreate";
import { useAuth } from "../context/authContext";
import type { Records } from "../types/interfaces";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import "../styles/RecordsPage.css";

const RecordsPage: React.FC = () => {
    // Retrieve records list from API
    const { data: records, loading, error, refetch } = useRecords();

    // Retrieve current user (for permission checks)
    const { user } = useAuth();

    // Local copy of records for immediate UI updates
    const [localRecords, setLocalRecords] = useState<Records[]>([]);

    // Switch bar state: 'game' or 'season'
    const [recordTypeView, setRecordTypeView] = useState<'game' | 'season'>('game');

    // Search and pagination state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const recordsPerPage = 20;

    // Calculate records hook
    const { calculateRecords, loading: calculating } = useCalculateRecords(showErrorModal);

    // Modal state for errors
    const [errorModal, setErrorModal] = useState<string | null>(null);

    // Helper to show error modal
    function showErrorModal(err: any) {
        let errorMsg = '';
        if (err?.message) errorMsg = err.message;
        else if (err?.error) errorMsg = err.error;
        else if (err?.response?.data?.error) errorMsg = err.response.data.error;
        else errorMsg = 'Unknown error';
        setErrorModal(errorMsg);
    }

    // Initialize localRecords when data is fetched
    useEffect(() => {
        if (records) {
            setLocalRecords(records);
        }
    }, [records]);

    // Filter records based on search query and selected type
    const filteredRecords = localRecords.filter(record => {
        if (record.type !== recordTypeView) return false;
        const playerName = record.player?.name || '';
        const recordType = record.record || '';
        const seasonNumber = record.season?.seasonNumber?.toString() || '';
        const rank = record.rank?.toString() || '';
        const value = record.value?.toString() || '';
        
        const searchLower = searchQuery.toLowerCase();
        return (
            playerName.toLowerCase().includes(searchLower) ||
            recordType.toLowerCase().includes(searchLower) ||
            seasonNumber.includes(searchLower) ||
            rank.includes(searchLower) ||
            value.includes(searchLower)
        );
    });

    // Group records by record type
    const groupedRecords = filteredRecords.reduce((groups, record) => {
        const recordType = record.record;
        if (!groups[recordType]) {
            groups[recordType] = [];
        }
        groups[recordType].push(record);
        return groups;
    }, {} as { [key: string]: Records[] });

    // Sort record types for consistent display
    const sortedRecordTypes = Object.keys(groupedRecords).sort();

    // Calculate pagination for each record type
    const getPaginatedRecords = (records: Records[]) => {
        return records.slice(
            (currentPage - 1) * recordsPerPage,
            currentPage * recordsPerPage
        );
    };

    // Handle search
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page when searching
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("");
        setCurrentPage(1);
    };

    // Handle calculate records
    const handleCalculateRecords = async () => {
        const success = await calculateRecords();
        if (success) {
            // Refetch records after successful calculation
            refetch();
        }
    };

    // Format record value for display
    const formatRecordValue = (record: Records) => {
        const value = record.value;
        const recordType = record.record;
        
        // Format percentage records
        if (recordType.includes('spiking %')) {
            return `${value.toFixed(1)}%`;
        }
        
        // Format integer records
        return Math.round(value).toString();
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get record type display name
    const getRecordDisplayName = (recordType: string) => {
        const typeMap: { [key: string]: string } = {
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
        };

        // Handle percentage records
        if (recordType.includes('best total spiking %')) {
            const attempts = recordType.match(/\d+/)?.[0] || '';
            return `Best Total Spiking % (${attempts}+ attempts)`;
        }

        return typeMap[recordType] || recordType;
    };

    // Get rank badge class
    const getRankBadgeClass = (rank: number) => {
        if (rank === 1) return 'record-rank-badge gold';
        if (rank === 2) return 'record-rank-badge silver';
        if (rank === 3) return 'record-rank-badge bronze';
        return 'record-rank-badge';
    };

    if (loading) {
        return (
            <div className="records-container">
                <div className="records-loading">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading records...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="records-container">
                <div className="records-error">
                    <h4>Error Loading Records</h4>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="records-container">
            {/* Header */}
            <h1 className="records-header">Records</h1>

            {/* Meta information */}
            <div className="records-meta">
                <span>{recordTypeView === 'game' ? 'Game Records' : 'Season Records'}</span>
                <span>{filteredRecords.length} Total Records</span>
                {user && (user.role === 'admin' || user.role === 'superadmin') && (
                    <button
                        className="calculate-button"
                        onClick={handleCalculateRecords}
                        disabled={calculating}
                    >
                        {calculating ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Calculating...
                            </>
                        ) : (
                            'Re-calculate Records'
                        )}
                    </button>
                )}
            </div>

            {/* Switch bar for record type */}
            <div className="records-switch-bar">
                <button
                    className={`records-switch-button ${recordTypeView === 'game' ? 'active' : ''}`}
                    onClick={() => setRecordTypeView('game')}
                >
                    Game Records
                </button>
                <button
                    className={`records-switch-button ${recordTypeView === 'season' ? 'active' : ''}`}
                    onClick={() => setRecordTypeView('season')}
                >
                    Season Records
                </button>
            </div>

            {/* Search and filters */}
            <div className="records-search-section">
                <div className="records-search-container">
                    <SearchBar onSearch={handleSearch} placeholder="Search records..." />
                </div>
                <button className="clear-filters-button" onClick={clearFilters}>
                    Clear Filters
                </button>
            </div>

            {/* Records count */}
            <div className="records-count">
                Showing {filteredRecords.length} of {localRecords.filter(r => r.type === recordTypeView).length} {recordTypeView} records
            </div>

            {/* Record type sections */}
            {sortedRecordTypes.map((recordType) => {
                const recordsForType = groupedRecords[recordType];
                const paginatedRecords = getPaginatedRecords(recordsForType);
                const totalPages = Math.ceil(recordsForType.length / recordsPerPage);

                return (
                    <div key={recordType} className="record-type-section">
                        <h2 className="record-type-header">{getRecordDisplayName(recordType)}</h2>
                        
                        <div className="records-table-container">
                            <table className="records-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Player</th>
                                        <th>Value</th>
                                        <th>Date</th>
                                        <th>Game</th>
                                        <th>Season</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRecords.map((record) => (
                                        <tr key={record.id}>
                                            <td className="record-rank">
                                                <span className={getRankBadgeClass(record.rank)}>
                                                    {record.rank}
                                                </span>
                                            </td>
                                            <td>
                                                <a 
                                                    href={`/players/${record.player?.id}`}
                                                    className="record-link"
                                                >
                                                    {record.player?.name || 'Unknown Player'}
                                                </a>
                                            </td>
                                            <td>
                                                <span className="record-value">{formatRecordValue(record)}</span>
                                            </td>
                                            <td>
                                                <span className="record-date">{formatDate(record.date)}</span>
                                            </td>
                                            <td>
                                                {record.gameId && record.type === 'game' ? (
                                                    <a 
                                                        href={`/games/${record.gameId}`}
                                                        className="record-link"
                                                    >
                                                        View Game
                                                    </a>
                                                ) : (
                                                    <span className="record-date">-</span>
                                                )}
                                            </td>
                                            <td>
                                                <a 
                                                    href={`/seasons/${record.season?.id}`}
                                                    className="record-link"
                                                >
                                                    Season {record.season?.seasonNumber || 'Unknown'}
                                                </a>
                                            </td>
                                            <td>
                                                <span className={`record-type-badge ${record.type}`}>
                                                    {record.type === 'game' ? 'Game' : 'Season'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination for this record type */}
                        {totalPages > 1 && (
                            <div className="records-pagination">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Error Modal */}
            {errorModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Error</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setErrorModal(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>{errorModal}</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setErrorModal(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>
            )}
        </div>
    );
};

export default RecordsPage; 
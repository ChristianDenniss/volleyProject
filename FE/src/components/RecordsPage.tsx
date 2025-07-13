// src/components/RecordsPage.tsx

import React, { useState, useEffect } from "react";
import { useRecords } from "../hooks/allFetch";
import { useCalculateRecords } from "../hooks/allCreate";
import { useAuth } from "../context/authContext";
import type { Records } from "../types/interfaces";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import "../styles/UsersPage.css"; // reuse table & text-muted styles
import "../styles/RecordsPage.css"; // import new styles

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

    // Calculate pagination
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

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

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
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
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error Loading Records</h4>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Records</h1>
                {user && (user.role === 'admin' || user.role === 'superadmin') && (
                    <button
                        className="btn btn-primary"
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
            <div className="mb-3 d-flex justify-content-center">
                <div className="btn-group" role="group" aria-label="Record Type Switch">
                    <button
                        type="button"
                        className={`btn btn${recordTypeView === 'game' ? '' : '-outline'}-secondary`}
                        onClick={() => setRecordTypeView('game')}
                    >
                        Game Records
                    </button>
                    <button
                        type="button"
                        className={`btn btn${recordTypeView === 'season' ? '' : '-outline'}-secondary`}
                        onClick={() => setRecordTypeView('season')}
                    >
                        Season Records
                    </button>
                </div>
            </div>

            {/* Search and filters */}
            <div className="row mb-3">
                <div className="col-md-6">
                    <SearchBar onSearch={handleSearch} placeholder="Search records..." />
                </div>
                <div className="col-md-6 text-end">
                    <button className="btn btn-outline-secondary" onClick={clearFilters}>
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Records count */}
            <div className="mb-3">
                <p className="text-muted">
                    Showing {filteredRecords.length} of {localRecords.filter(r => r.type === recordTypeView).length} {recordTypeView} records
                </p>
            </div>

            {/* Records table */}
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>Rank</th>
                            <th>Record Type</th>
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
                                <td>
                                    <span className={`badge ${record.rank <= 3 ? 'bg-warning' : 'bg-secondary'}`}>
                                        #{record.rank}
                                    </span>
                                </td>
                                <td>
                                    <strong>{getRecordDisplayName(record.record)}</strong>
                                </td>
                                <td>
                                    <a 
                                        href={`/players/${record.player?.id}`}
                                        className="text-decoration-none"
                                    >
                                        {record.player?.name || 'Unknown Player'}
                                    </a>
                                </td>
                                <td>
                                    <span className="fw-bold">{formatRecordValue(record)}</span>
                                </td>
                                <td>
                                    <span className="text-muted">{formatDate(record.date)}</span>
                                </td>
                                <td>
                                    {record.gameId && record.type === 'game' ? (
                                        <a 
                                            href={`/games/${record.gameId}`}
                                            className="text-decoration-none"
                                        >
                                            View Game
                                        </a>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                                <td>
                                    <a 
                                        href={`/seasons/${record.season?.id}`}
                                        className="text-decoration-none"
                                    >
                                        Season {record.season?.seasonNumber || 'Unknown'}
                                    </a>
                                </td>
                                <td>
                                    <span className={`badge ${record.type === 'game' ? 'bg-info' : 'bg-success'}`}>
                                        {record.type === 'game' ? 'Game' : 'Season'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

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
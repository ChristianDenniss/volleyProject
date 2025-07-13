// src/components/RecordsPage.tsx

import React, { useState, useEffect } from "react";
import { useRecords } from "../hooks/allFetch";
import { useCalculateRecords } from "../hooks/allCreate";
import { useAuth } from "../context/authContext";
import type { Records } from "../types/interfaces";
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

    // Filter records based on selected type
    const filteredRecords = localRecords.filter(record => {
        return record.type === recordTypeView;
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
    const sortedRecordTypes = Object.keys(groupedRecords).sort((a, b) => {
        // Check if either record type is a spiking percentage record
        const aIsSpikingPercent = a.includes('best total spiking %');
        const bIsSpikingPercent = b.includes('best total spiking %');
        
        // If both are spiking percentage records, sort by attempts (higher attempts first)
        if (aIsSpikingPercent && bIsSpikingPercent) {
            const aAttempts = parseInt(a.match(/\d+/)?.[0] || '0');
            const bAttempts = parseInt(b.match(/\d+/)?.[0] || '0');
            return bAttempts - aAttempts; // Higher attempts first
        }
        
        // If only one is spiking percentage, put it last
        if (aIsSpikingPercent && !bIsSpikingPercent) {
            return 1; // a goes after b
        }
        if (!aIsSpikingPercent && bIsSpikingPercent) {
            return -1; // a goes before b
        }
        
        // Custom order for non-spiking percentage records
        const customOrder = [
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
            'most total errors'
        ];
        
        const aIndex = customOrder.indexOf(a);
        const bIndex = customOrder.indexOf(b);
        
        // If both are in the custom order, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
        }
        
        // If only one is in the custom order, prioritize it
        if (aIndex !== -1 && bIndex === -1) {
            return -1; // a goes before b
        }
        if (aIndex === -1 && bIndex !== -1) {
            return 1; // a goes after b
        }
        
        // If neither is in the custom order, use alphabetical sorting
        return a.localeCompare(b);
    });

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
        
        // Check if value is a valid number
        if (value === null || value === undefined || isNaN(Number(value))) {
            return 'N/A';
        }
        
        const numValue = Number(value);
        
        // Format percentage records
        if (recordType.includes('spiking %')) {
            return `${numValue.toFixed(1)}%`;
        }
        
        // Format integer records
        return Math.round(numValue).toString();
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

            {/* Calculate button for admins */}
            {user && (user.role === 'admin' || user.role === 'superadmin') && (
                <div style={{ textAlign: 'center' }}>
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
                </div>
            )}

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

            {/* Records grid */}
            <div className="records-grid">
                {sortedRecordTypes.map((recordType) => {
                    const recordsForType = groupedRecords[recordType];

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
                                            <th>Season</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recordsForType.map((record) => (
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
                                                    <a 
                                                        href={`/seasons/${record.season?.id}`}
                                                        className="record-link"
                                                    >
                                                        S{record.season?.seasonNumber || '?'}
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

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
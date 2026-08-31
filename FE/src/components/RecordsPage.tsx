// src/components/RecordsPage.tsx

import React, { useState, useEffect } from "react";
import { useRecords } from "../hooks/allFetch";
import { useRegion } from "../context/regionContext";
import { useCalculateRecords } from "../hooks/allCreate";
import { useAuth } from "../context/authContext";
import type { Records } from "../types/interfaces";
import Table, { type TableColumn } from "./ui/Table";

const recordsContainer =
    "bg-white text-[#1a1a1a] min-h-screen m-0 pt-[var(--space-page)] px-[2rem] pb-[2rem] " +
    "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] box-border " +
    "[contain:layout_style_paint]";

const recordsGrid =
    "grid grid-cols-[repeat(3,1fr)] gap-[2rem] mb-[2rem] " +
    "upto-xl:grid-cols-[repeat(2,1fr)] upto-md:grid-cols-[1fr] upto-md:gap-[1.5rem] " +
    "empty:before:content-[''] empty:before:block empty:before:h-[600px] empty:before:w-full";

const switchBar = "flex justify-center gap-[1rem] mb-[2rem]";

const switchButtonBase =
    "text-white border-2 border-brand-primary py-[0.75rem] px-[1.5rem] " +
    "rounded-[4px] cursor-pointer transition-all duration-200 ease-[ease] font-bold uppercase " +
    "hover:[transform:translateY(-2px)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] " +
    "upto-xs:py-[0.5rem] upto-xs:px-[1rem] upto-xs:text-[0.9rem]";

const calculateButton =
    "bg-[#1a1a1a] text-white border-2 border-brand-primary py-[0.75rem] px-[1.5rem] " +
    "rounded-[4px] cursor-pointer transition-all duration-200 ease-[ease] font-bold uppercase " +
    "min-w-[200px] mb-[2rem] " +
    "hover:enabled:bg-brand-primary hover:enabled:text-white " +
    "hover:enabled:[transform:translateY(-2px)] hover:enabled:shadow-[0_4px_8px_rgba(0,0,0,0.2)] " +
    "disabled:opacity-60 disabled:cursor-not-allowed " +
    "upto-md:min-w-[150px] upto-md:text-[0.9em]";

const recordTypeSection = "mb-[2rem]";

const recordTypeHeader =
    "relative text-[1.5rem] font-bold uppercase text-center text-[#1a1a1a] " +
    "mt-0 mx-auto mb-[1rem] leading-[1.1] max-w-fit " +
    "upto-md:text-[1.3rem] upto-xs:text-[1.2rem]";

const tableContainer =
    "bg-[#1a1a1a] border-2 border-brand-primary rounded-[8px] overflow-x-hidden overflow-y-auto " +
    "mb-[1rem] shadow-[0_4px_12px_rgba(0,0,0,0.3)] max-h-[500px] p-[1rem] " +
    "upto-md:max-h-[300px] upto-xs:max-h-[250px]";

const recordRank = "text-center font-bold";

const rankBadgeBase =
    "inline-block w-[1.5rem] h-[1.5rem] rounded-full text-center leading-[1.5rem] font-bold text-[0.8rem]";

const recordValue = "font-bold text-white text-[1rem]";

const recordLink =
    "text-white no-underline font-medium transition-[color] duration-200 ease-[ease] text-[0.85rem] " +
    "hover:text-brand-primary-hover hover:underline";

const recordDate = "text-[#ccc] text-[0.8rem]";

const recordsError =
    "bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb] rounded-[4px] p-[1rem] my-[2rem] text-center";

const skeletonSweep =
    "bg-[linear-gradient(90deg,#f0f0f0_25%,#e0e0e0_50%,#f0f0f0_75%)] bg-[length:200%_100%] " +
    "animate-skeleton-sweep";

const RecordsPage: React.FC = () => {
    const { regionQuery } = useRegion();
    const { user } = useAuth();

    // Switch bar state: 'game' or 'season' — forwarded as a server-side type filter
    const [recordTypeView, setRecordTypeView] = useState<'game' | 'season'>('game');

    const { data: records, loading, error, refetch } = useRecords({
        type: recordTypeView,
        limit: 1000,
        page: 1,
        ...regionQuery,
    });

    // Local copy of records for immediate UI updates
    const [localRecords, setLocalRecords] = useState<Records[]>([]);

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

    // Group records by record type (already filtered server-side by type=game|season)
    const groupedRecords = localRecords.reduce((groups, record) => {
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
        
        // If both are spiking percentage records, sort by attempts (lower attempts first)
        if (aIsSpikingPercent && bIsSpikingPercent) {
            const aAttempts = parseInt(a.match(/\d+/)?.[0] || '0');
            const bAttempts = parseInt(b.match(/\d+/)?.[0] || '0');
            return aAttempts - bAttempts; // Lower attempts first
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

    const getRankBadgeClass = (rank: number) => {
        if (rank === 1) return `${rankBadgeBase} bg-[#ffd700] text-[#1a1a1a]`;
        if (rank === 2) return `${rankBadgeBase} bg-[#c0c0c0] text-[#1a1a1a]`;
        if (rank === 3) return `${rankBadgeBase} bg-[#cd7f32] text-white`;
        return `${rankBadgeBase} bg-brand-primary text-white`;
    };

    if (loading) {
        return (
            <div className={`${recordsContainer} opacity-80 pointer-events-none`}>
                {/* Skeleton header */}
                <div className={`${skeletonSweep} h-[80px] w-[300px] mx-auto rounded-[8px]`}></div>
                
                {/* Skeleton calculate button for admins */}
                {user && (user.role === 'admin' || user.role === 'superadmin') && (
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div className={`${skeletonSweep} h-[50px] w-[200px] mx-auto rounded-[8px]`}></div>
                    </div>
                )}
                
                {/* Skeleton switch bar */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className={`${skeletonSweep} h-[50px] w-[400px] mx-auto rounded-[8px]`}></div>
                </div>
                
                {/* Skeleton grid */}
                <div className={recordsGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={recordTypeSection}>
                            <div className={`${skeletonSweep} h-[80px] w-[300px] mx-auto rounded-[8px]`} style={{ height: '40px', width: '200px' }}></div>
                            <div className={`${skeletonSweep} h-[500px] w-full rounded-[8px] border-2 border-[#e0e0e0]`}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Columns for the records table (shared across all record-type sections)
    const recordColumns: TableColumn<Records>[] = [
        {
            key: "rank",
            header: "Rank",
            render: (record) => (
                <div className={recordRank}>
                    <span className={getRankBadgeClass(record.rank)}>
                        {record.rank}
                    </span>
                </div>
            ),
        },
        {
            key: "player",
            header: "Player",
            render: (record) => (
                <a
                    href={`/players/${record.player?.id}`}
                    className={recordLink}
                >
                    {record.player?.name || 'Unknown Player'}
                </a>
            ),
        },
        {
            key: "value",
            header: "Value",
            render: (record) => (
                <span className={recordValue}>{formatRecordValue(record)}</span>
            ),
        },
        {
            key: "date",
            header: "Date",
            render: (record) => (
                <span className={recordDate}>{formatDate(record.date)}</span>
            ),
        },
        {
            key: "gameOrSeason",
            header: recordTypeView === 'game' ? 'Game' : 'Season',
            render: (record) => (
                recordTypeView === 'game' ? (
                    <a
                        href={`/games/${record.gameId}`}
                        className={recordLink}
                    >
                        View Game
                    </a>
                ) : (
                    <a
                        href={`/seasons/${record.season?.id}`}
                        className={recordLink}
                    >
                        S{record.season?.seasonNumber || '?'}
                    </a>
                )
            ),
        },
    ];

    if (error) {
        return (
            <div className={recordsContainer}>
                <div className={recordsError}>
                    <h4>Error Loading Records</h4>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={recordsContainer}>
            {/* Calculate button for admins */}
            {user && (user.role === 'admin' || user.role === 'superadmin') && (
                <div style={{ textAlign: 'center' }}>
                    <button
                        className={calculateButton}
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
            <div className={switchBar}>
                <button
                    className={`${switchButtonBase} ${recordTypeView === 'game' ? "bg-brand-primary" : "bg-[#1a1a1a]"}`}
                    onClick={() => setRecordTypeView('game')}
                >
                    Single Game Records
                </button>
                <button
                    className={`${switchButtonBase} ${recordTypeView === 'season' ? "bg-brand-primary" : "bg-[#1a1a1a]"}`}
                    onClick={() => setRecordTypeView('season')}
                >
                    Season Records
                </button>
            </div>

            {/* Records grid */}
            <div className={recordsGrid}>
                {sortedRecordTypes.map((recordType) => {
                    const recordsForType = groupedRecords[recordType];

                    return (
                        <div key={recordType} className={recordTypeSection}>
                            <h2 className={recordTypeHeader}>{getRecordDisplayName(recordType)}</h2>
                            
                            <div className={tableContainer}>
                                <Table
                                    columns={recordColumns}
                                    rows={recordsForType}
                                    rowKey={(record) => record.id}
                                />
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
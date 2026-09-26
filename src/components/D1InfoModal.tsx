import React, { useState } from 'react';
import {
  useGetAdminPartiesQuery,
  useResetDatabaseMutation,
  useGetD1SqlExportQuery
} from '../store/index.ts';

interface D1InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPartyGuest?: (guestName: string) => void;
}

export const D1InfoModal: React.FC<D1InfoModalProps> = ({ isOpen, onClose, onSelectPartyGuest }) => {
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'instructions'>('overview');

  const {
    data: stats,
    isLoading,
    refetch: fetchStats
  } = useGetAdminPartiesQuery(undefined, {
    skip: !isOpen
  });

  const { data: sqlSchema = '' } = useGetD1SqlExportQuery(undefined, {
    skip: !isOpen
  });

  const [resetDatabase, { isLoading: isResetting }] = useResetDatabaseMutation();

  if (!isOpen) return null;

  const copySchemaToClipboard = () => {
    if (navigator.clipboard && sqlSchema) {
      navigator.clipboard.writeText(sqlSchema);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset database to default demo state? All custom RSVPs will be reset.')) return;
    try {
      await resetDatabase().unwrap();
      alert('Database successfully reset to default demo data!');
    } catch (e) {
      console.error('Error resetting database:', e);
      alert('Failed to reset database.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 items-center justify-center p-3 sm:p-4 modal-backdrop bg-black/60 transition-opacity flex">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-7 shadow-2xl border border-stone-200 relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition flex items-center justify-center cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-stone-200 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-blue-light text-blue-primary flex items-center justify-center shrink-0 shadow-sm border border-blue-secondary">
            <span className="material-symbols-outlined text-xl">cloud_sync</span>
          </div>
          <div>
            <h3 className="font-editorial text-lg sm:text-xl font-medium text-stone-900 leading-tight">
              Cloudflare D1 Database Integration
            </h3>
            <p className="text-xs text-stone-500 font-sans-ui">
              Live SQLite Database Engine with full D1 Schema &amp; Party Hierarchy
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-stone-100 text-xs font-label">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-red-primary text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Live Database Overview
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-red-primary text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            D1 SQL Schema &amp; Migration
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'instructions'
                ? 'bg-red-primary text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Cloudflare Deployment Guide
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-4 pr-1">
            {/* Stat Counters Grid */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-beige-paper border border-beige-secondary text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 font-label block">Parties</span>
                  <span className="text-2xl font-editorial font-bold text-red-primary">{stats.totalParties}</span>
                  <span className="text-[10px] text-stone-500 block">({stats.submittedParties} submitted)</span>
                </div>
                <div className="p-3 rounded-2xl bg-beige-paper border border-beige-secondary text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 font-label block">Total Guests</span>
                  <span className="text-2xl font-editorial font-bold text-stone-800">{stats.totalGuests}</span>
                  <span className="text-[10px] text-stone-500 block">all invited members</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 font-label block">Confirmed</span>
                  <span className="text-2xl font-editorial font-bold text-emerald-800">{stats.confirmedGuests}</span>
                  <span className="text-[10px] text-emerald-600 block">attending guests</span>
                </div>
                <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 font-label block">Pending</span>
                  <span className="text-2xl font-editorial font-bold text-stone-700">{stats.pendingGuests}</span>
                  <span className="text-[10px] text-stone-500 block">awaiting response</span>
                </div>
              </div>
            )}

            {/* Parties List Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-label text-stone-700">
                  Parties &amp; Reserved Invitations in Database
                </span>
                <button
                  onClick={fetchStats}
                  className="text-[11px] font-label text-blue-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">refresh</span>
                  <span>Refresh</span>
                </button>
              </div>

              {isLoading ? (
                <div className="p-6 text-center text-xs text-stone-500">Loading live database records...</div>
              ) : (
                <div className="space-y-2.5">
                  {stats?.parties.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2 hover:border-red-primary/30 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-100 pb-2">
                        <div>
                          <span className="font-editorial text-sm font-semibold text-stone-900">
                            {p.party_name}
                          </span>
                          <span className="text-[10px] text-stone-500 font-label ml-2">
                            Token: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">{p.access_token}</code>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                            Cap: {p.max_reserved_seats} Seats
                          </span>
                          {p.is_submitted ? (
                            <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Submitted
                            </span>
                          ) : (
                            <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Guest Members */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {p.guests?.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-beige-paper text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="material-symbols-outlined text-xs text-stone-400">person</span>
                              <span className="font-medium text-stone-800 truncate">
                                {g.first_name} {g.last_name}
                              </span>
                              {g.is_primary_contact && (
                                <span className="text-[9px] text-red-primary font-bold uppercase font-label">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {g.rsvp_status === 'accepted' ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Accepted
                                </span>
                              ) : g.rsvp_status === 'declined' ? (
                                <span className="text-[9px] font-bold text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">
                                  Declined
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  Pending
                                </span>
                              )}
                              {onSelectPartyGuest && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectPartyGuest(`${g.first_name} ${g.last_name}`);
                                    onClose();
                                  }}
                                  className="text-[9px] font-label text-blue-primary hover:underline bg-white px-1 py-0.5 rounded border border-stone-200 cursor-pointer"
                                >
                                  Login as
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {p.notes && (
                        <p className="text-[11px] text-stone-500 font-sans-ui italic bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/50">
                          Note: "{p.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Demo Database Action */}
            <div className="pt-2 flex items-center justify-between border-t border-stone-200">
              <span className="text-xs text-stone-500">Need to reset demo responses?</span>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="px-3 py-1.5 text-xs rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-800 border border-stone-200 hover:border-rose-300 font-label font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Schema */}
        {activeTab === 'schema' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-3 pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600 font-label uppercase">
                Cloudflare D1 SQL Schema &amp; Seed Queries
              </span>
              <button
                onClick={copySchemaToClipboard}
                className="px-3 py-1 bg-red-primary hover:bg-red-accent text-white text-xs font-label uppercase font-bold tracking-wider rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>{copiedSchema ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-stone-200 text-xs font-mono rounded-2xl overflow-x-auto leading-relaxed border border-stone-800">
              {sqlSchema || 'Loading schema.sql...'}
            </pre>
          </div>
        )}

        {/* Tab 3: Instructions */}
        {activeTab === 'instructions' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-4 pr-1 text-xs text-stone-700 font-sans-ui">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-1">
              <span className="font-bold text-red-primary uppercase font-label text-xs block">
                How this Connects to Cloudflare D1
              </span>
              <p className="leading-relaxed">
                The application backend uses the exact SQLite D1 schema you provided with <code>parties</code> and{' '}
                <code>guests</code>. When deployed to Cloudflare Pages or Cloudflare Workers:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-beige-paper border border-stone-200">
                <p className="font-bold font-label text-stone-800 mb-1">1. Create your D1 Database in Cloudflare</p>
                <code className="block bg-stone-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px]">
                  wrangler d1 create wedding-db
                </code>
              </div>

              <div className="p-3 rounded-xl bg-beige-paper border border-stone-200">
                <p className="font-bold font-label text-stone-800 mb-1">2. Run the Schema and Seed Data</p>
                <code className="block bg-stone-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px]">
                  wrangler d1 execute wedding-db --file=./schema.sql
                </code>
              </div>

              <div className="p-3 rounded-xl bg-beige-paper border border-stone-200">
                <p className="font-bold font-label text-stone-800 mb-1">3. Bind D1 to your project in wrangler.toml</p>
                <pre className="bg-stone-900 text-amber-200 p-2 rounded-lg font-mono text-[11px] overflow-x-auto">
{`[[d1_databases]]
binding = "DB"
database_name = "wedding-db"
database_id = "<your-d1-database-uuid>"`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs uppercase tracking-wider font-label rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

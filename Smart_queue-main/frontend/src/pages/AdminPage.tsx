import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../services/api';
import { Card, Button, StatCard, Modal, Skeleton } from '../components/ui';
import type { AdminStats, LogEntry } from '../types';
import { RefreshCw, Download, AlertTriangle } from 'lucide-react';

export function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [resetPw, setResetPw] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([adminApi.getStats(), adminApi.getLogs(100)]);
      setStats(s);
      setLogs(l);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleReset = async () => {
    if (!resetPw.trim()) { toast.error('Enter your password'); return; }
    setResetting(true);
    try {
      await adminApi.reset(resetPw);
      toast.success('Queue reset successfully');
      setShowReset(false);
      setResetPw('');
      void fetchData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const ACTION_COLORS: Record<string, string> = {
    TOKEN_CREATED: 'text-green-600',
    TOKEN_SERVING: 'text-blue-600',
    TOKEN_COMPLETED: 'text-gray-600',
    SYSTEM_RESET: 'text-red-600',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} loading={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="secondary" onClick={adminApi.exportLogs}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="danger" onClick={() => setShowReset(true)}>
            <AlertTriangle className="w-4 h-4" /> Reset Queue
          </Button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Waiting" value={stats.total_waiting} color="bg-yellow-500" />
          <StatCard label="Serving" value={stats.total_serving} color="bg-blue-500" />
          <StatCard label="Completed" value={stats.total_completed} color="bg-green-500" />
          <StatCard label="Active Counters" value={stats.active_counters} color="bg-purple-500" />
          <StatCard label="Total Counters" value={stats.total_counters} color="bg-gray-500" />
        </div>
      )}

      {/* Logs */}
      <Card>
        <h2 className="font-semibold text-gray-700 mb-4">Recent Activity</h2>
        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10" />)}</div>
        ) : logs.length === 0 ? (
          <p className="text-gray-400 text-sm">No logs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 pr-4">Token</th>
                  <th className="pb-2 pr-4">Details</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-400">#{l.id}</td>
                    <td className={`py-2 pr-4 font-medium ${ACTION_COLORS[l.action] ?? 'text-gray-700'}`}>
                      {l.action}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{l.token_id ? `#${l.token_id}` : '—'}</td>
                    <td className="py-2 pr-4 text-gray-500 max-w-xs truncate">{l.details ?? '—'}</td>
                    <td className="py-2 text-gray-400 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reset Modal */}
      {showReset && (
        <Modal title="⚠️ Reset Queue" onClose={() => setShowReset(false)}>
          <p className="text-gray-600 mb-4 text-sm">
            This will mark all waiting and serving tokens as completed and release all counters.
            Enter your admin password to confirm.
          </p>
          <input
            type="password"
            placeholder="Your admin password"
            value={resetPw}
            onChange={(e) => setResetPw(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowReset(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleReset} loading={resetting} className="flex-1">Confirm Reset</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

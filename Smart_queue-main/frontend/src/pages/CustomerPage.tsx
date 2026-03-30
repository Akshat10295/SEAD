import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { queueApi } from '../services/api';
import { Card, Button, StatusBadge, Skeleton } from '../components/ui';
import type { CreateTokenResponse } from '../types';
import { Clock, Users, Ticket } from 'lucide-react';

export function CustomerPage() {
  const { state, dispatch, setLoading } = useApp();
  const [myToken, setMyToken] = useState<CreateTokenResponse | null>(null);
  const [joining, setJoining] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading('queue', true);
    try {
      const q = await queueApi.getQueue();
      dispatch({ type: 'SET_QUEUE', payload: q });
    } catch (e: unknown) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Failed to load queue' });
    } finally {
      setLoading('queue', false);
    }
  }, [dispatch, setLoading]);

  useEffect(() => { void fetchQueue(); }, [fetchQueue]);

  const joinQueue = async () => {
    if (joining) return;
    setJoining(true);
    try {
      const result = await queueApi.createToken();
      setMyToken(result);
      toast.success(`Joined queue! Your number is #${result.token.id}`);
      void fetchQueue();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to join queue');
    } finally {
      setJoining(false);
    }
  };

  const { queue } = state;
  const isLoading = state.loading['queue'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Customer Dashboard</h1>

      {/* My Token */}
      {myToken ? (
        <Card className="border-l-4 border-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Your Token</p>
              <p className="text-5xl font-bold text-blue-600">#{myToken.token.id}</p>
              <StatusBadge status={myToken.token.status} />
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <Users className="w-4 h-4" />
                <span>Position: <strong>{myToken.position}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <Clock className="w-4 h-4" />
                <span>~{myToken.estimated_wait_minutes} min wait</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-4">
            <Ticket className="w-12 h-12 mx-auto text-blue-400 mb-3" />
            <p className="text-gray-600 mb-4">You don't have an active queue number</p>
            <Button onClick={joinQueue} loading={joining} className="mx-auto">
              Join Queue
            </Button>
          </div>
        </Card>
      )}

      {/* Now Serving */}
      <Card>
        <h2 className="font-semibold text-gray-700 mb-3">Now Serving</h2>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : queue.serving.length === 0 ? (
          <p className="text-gray-400 text-sm">No one being served right now</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {queue.serving.map((t) => (
              <div key={t.id} className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">#{t.id}</p>
                <p className="text-xs text-gray-500">Counter {t.counter_id}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Waiting Queue */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Waiting Queue</h2>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
            {queue.total_waiting} waiting
          </span>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : queue.waiting.length === 0 ? (
          <p className="text-gray-400 text-sm">Queue is empty</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {queue.waiting.slice(0, 20).map((t, idx) => (
              <div
                key={t.id}
                className={`rounded-lg px-3 py-2 text-sm font-medium
                  ${myToken?.token.id === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                #{t.id} {idx === 0 ? '(Next)' : ''}
              </div>
            ))}
            {queue.waiting.length > 20 && (
              <div className="rounded-lg px-3 py-2 text-sm text-gray-400">+{queue.waiting.length - 20} more</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

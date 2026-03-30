import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { counterApi, queueApi } from '../services/api';
import { Card, Button, StatusBadge, Skeleton, StatCard } from '../components/ui';
import type { Counter } from '../types';
import { ChevronRight, CheckCircle } from 'lucide-react';

export function CounterPage() {
  const { state, dispatch } = useApp();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<number, string>>({});
  const [fetching, setFetching] = useState(true);

  const setOp = (id: number, op: string) => setLoadingMap((p) => ({ ...p, [id]: op }));
  const clearOp = (id: number) => setLoadingMap((p) => { const n = { ...p }; delete n[id]; return n; });

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const [cs, q] = await Promise.all([counterApi.getCounters(), queueApi.getQueue()]);
      setCounters(cs);
      dispatch({ type: 'SET_QUEUE', payload: q });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load counters');
    } finally {
      setFetching(false);
    }
  }, [dispatch]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // Update counters when WS broadcasts queue update
  useEffect(() => {
    if (counters.length > 0) {
      counterApi.getCounters().then(setCounters).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.queue]);

  const handleNext = async (counterId: number) => {
    if (loadingMap[counterId]) return;
    setOp(counterId, 'next');
    try {
      const t = await counterApi.next(counterId);
      toast.success(`Now serving #${t.id}`);
      void fetchAll();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      clearOp(counterId);
    }
  };

  const handleComplete = async (counterId: number) => {
    if (loadingMap[counterId]) return;
    setOp(counterId, 'complete');
    try {
      const t = await counterApi.complete(counterId);
      toast.success(`Completed token #${t.id}`);
      void fetchAll();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      clearOp(counterId);
    }
  };

  const { queue } = state;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Counter Staff Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Waiting" value={queue.total_waiting} color="bg-yellow-500" />
        <StatCard label="Being Served" value={queue.total_serving} color="bg-blue-500" />
      </div>

      {fetching ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : counters.length === 0 ? (
        <Card><p className="text-center text-gray-400">No counters configured</p></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {counters.map((c) => {
            const op = loadingMap[c.id];
            const isServing = !!c.current_token_id;
            return (
              <Card key={c.id} className={`border-t-4 ${isServing ? 'border-blue-500' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Counter #{c.id}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full
                    ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {isServing && c.current_token ? (
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl text-center">
                    <p className="text-xs text-gray-500">Serving</p>
                    <p className="text-4xl font-bold text-blue-600">#{c.current_token.id}</p>
                    <StatusBadge status={c.current_token.status} />
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl text-center">
                    <p className="text-gray-400 text-sm">No token assigned</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!isServing ? (
                    <Button
                      onClick={() => handleNext(c.id)}
                      loading={op === 'next'}
                      disabled={!c.is_active || queue.total_waiting === 0}
                      className="flex-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      onClick={() => handleComplete(c.id)}
                      loading={op === 'complete'}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

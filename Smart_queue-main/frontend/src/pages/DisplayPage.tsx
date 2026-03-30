import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { queueApi } from '../services/api';
import { Monitor } from 'lucide-react';

export function DisplayPage() {
  const { state, dispatch } = useApp();
  const { queue } = state;

  const refresh = useCallback(async () => {
    try {
      const q = await queueApi.getQueue();
      dispatch({ type: 'SET_QUEUE', payload: q });
    } catch { /* silent */ }
  }, [dispatch]);

  useEffect(() => { void refresh(); }, [refresh]);

  const nowServing = queue.serving;
  const upNext = queue.waiting.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <Monitor className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-blue-400">SmartQueue Display</h1>
      </div>

      {/* Now Serving */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-400 mb-4 uppercase tracking-widest">Now Serving</h2>
        {nowServing.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-500 text-2xl">—</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nowServing.map((t) => (
              <div key={t.id} className="bg-blue-600 rounded-2xl p-6 text-center shadow-lg animate-pulse-slow">
                <p className="text-sm text-blue-200">Counter {t.counter_id}</p>
                <p className="text-6xl font-black mt-1">#{t.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Up Next */}
      <div>
        <h2 className="text-xl font-semibold text-gray-400 mb-4 uppercase tracking-widest">Up Next</h2>
        {upNext.length === 0 ? (
          <p className="text-gray-600 text-xl text-center py-6">Queue is empty</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {upNext.map((t, i) => (
              <div key={t.id} className={`rounded-xl px-6 py-4 text-center ${i === 0 ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700'}`}>
                <p className="text-3xl font-bold">#{t.id}</p>
                {i === 0 && <p className="text-xs mt-1 font-semibold">NEXT</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-8 flex items-center justify-between text-gray-600 text-sm">
        <p>{queue.total_waiting} waiting • {queue.total_serving} being served</p>
        <p>{new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

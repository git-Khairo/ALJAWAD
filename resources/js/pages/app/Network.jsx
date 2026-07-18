import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { myApi } from '@/lib/api';
import { Network, Users, ChevronDown, ChevronRight, Loader2, Building2 } from 'lucide-react';

// ── Recursive IB sub-tree node ────────────────────────────────────────────────

const SubIbNode = ({ node, l, depth = 0 }) => {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (node.sub_ibs?.length ?? 0) > 0 || (node.clients?.length ?? 0) > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors group"
        style={{ paddingLeft: `${12 + depth * 18}px` }}
      >
        <button
          className="text-slate-500 w-4 flex-shrink-0"
          onClick={() => setOpen(o => !o)}
          disabled={!hasChildren}
        >
          {hasChildren
            ? (open ? <ChevronDown size={13} /> : <ChevronRight size={13} />)
            : <span className="w-4 inline-block" />}
        </button>
        <Network size={14} className="text-violet-400 flex-shrink-0" />
        <span className="text-sm text-white flex-1">{node.name}</span>
        <span className="text-xs text-slate-500">{node.broker_name}</span>
        <span className="text-xs text-slate-400 bg-white/5 rounded px-1.5 py-0.5">
          {l('عملاء', 'clients')}: {node.clients_count ?? 0}
        </span>
        <span className="text-xs text-slate-400 bg-white/5 rounded px-1.5 py-0.5">
          {l('وسطاء', 'IBs')}: {node.sub_ibs_count ?? 0}
        </span>
      </div>

      {open && hasChildren && (
        <div>
          {node.sub_ibs?.map(child => (
            <SubIbNode key={child.id} node={child} l={l} depth={depth + 1} />
          ))}
          {node.clients?.map(c => (
            <div
              key={c.user_id}
              className="flex items-center gap-2 text-xs text-slate-400 py-1 px-2 rounded"
              style={{ paddingLeft: `${30 + depth * 18}px` }}
            >
              <Users size={12} className="text-slate-500 flex-shrink-0" />
              <span>{c.name}</span>
              {c.stage && (
                <span className="bg-white/5 rounded px-1.5">{c.stage}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const { data, isLoading } = useQuery({
    queryKey: ['my-network'],
    queryFn: () => myApi.network().then(r => r.data),
    enabled: !!currentUser?.affiliate_code,
  });

  if (!currentUser?.affiliate_code) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <Network size={36} className="opacity-40" />
        <p>{l('لست وسيطاً مسجلاً', 'You are not a registered IB')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Network size={20} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{l('شبكتي', 'My Network')}</h1>
          {data?.broker && (
            <p className="text-xs text-slate-500">
              {l('الوسيط:', 'Broker:')} {data.broker}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-violet-400" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Direct clients */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Users size={15} className="text-sky-400" />
              {l('العملاء المباشرون', 'Direct Clients')}
              <span className="text-xs text-slate-500 font-normal">({data?.clients?.length ?? 0})</span>
            </h2>

            {!data?.clients?.length ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                {l('لا يوجد عملاء بعد', 'No clients yet')}
              </p>
            ) : (
              <div className="space-y-1">
                {data.clients.map(c => (
                  <div key={c.user_id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 text-sm">
                    <Users size={14} className="text-slate-500 flex-shrink-0" />
                    <span className="text-white flex-1">{c.name}</span>
                    {c.email && <span className="text-xs text-slate-500 hidden sm:inline">{c.email}</span>}
                    {c.stage && (
                      <span className="text-xs bg-white/5 rounded px-1.5 py-0.5 text-slate-400">{c.stage}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-IBs (only shown when present) */}
          {(data?.sub_ibs?.length ?? 0) > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Network size={15} className="text-violet-400" />
                {l('الوسطاء الفرعيون', 'Sub-IBs')}
                <span className="text-xs text-slate-500 font-normal">({data.sub_ibs.length})</span>
              </h2>

              <div className="space-y-0.5">
                {data.sub_ibs.map(node => (
                  <SubIbNode key={node.id} node={node} l={l} depth={0} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

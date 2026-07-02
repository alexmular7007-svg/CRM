import { Outlet } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { Sun, Moon, Zap, Check } from 'lucide-react'

/* ─── Feature bullets ────────────────────────────────────────────────── */
const FEATURES = [
  'Kanban boards with AI prioritization',
  'Real-time team chat & mentions',
  'CRM pipeline with lead tracking',
  'Productivity analytics & reports',
]

/* ─── Dashboard product screenshot ───────────────────────────────────── */
const DashboardPreview = () => (
  <div className="w-full rounded-lg overflow-hidden border border-white/[0.08] shadow-2xl"
       style={{ background: '#0D1117' }}>

    {/* Top bar */}
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]"
         style={{ background: '#161B22' }}>
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F56' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27C93F' }} />
        </div>
        <span className="text-[11px] font-mono" style={{ color: '#484F58' }}>
          app.taskflow.ai/board
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {['#7C3AED','#0EA5E9','#10B981','#F59E0B'].map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-[7px] font-bold"
                 style={{ background: c, borderColor: '#161B22' }}>
              {['A','S','M','R'][i]}
            </div>
          ))}
        </div>
        <div className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
             style={{ color: '#7C3AED', borderColor: '#7C3AED40', background: '#7C3AED15' }}>
          AI on
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="flex" style={{ height: '230px' }}>

      {/* Sidebar */}
      <div className="w-40 border-r flex flex-col py-3 flex-shrink-0"
           style={{ borderColor: '#21262D', background: '#0D1117' }}>
        <div className="flex items-center gap-2 px-4 pb-3 mb-1 border-b" style={{ borderColor: '#21262D' }}>
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
               style={{ background: '#7C3AED' }}>
            <Zap size={11} className="text-white" />
          </div>
          <span className="text-[12px] font-semibold" style={{ color: '#E6EDF3' }}>TaskFlow</span>
        </div>
        <div className="space-y-0.5 px-2 flex-1">
          {[
            { l: 'Dashboard', a: false },
            { l: 'Board',     a: true  },
            { l: 'Chat',      a: false },
            { l: 'Analytics', a: false },
            { l: 'AI Copilot',a: false },
            { l: 'CRM',       a: false },
          ].map(({ l, a }) => (
            <div key={l}
                 className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium"
                 style={{
                   background: a ? '#7C3AED20' : 'transparent',
                   color: a ? '#A78BFA' : '#6E7681',
                 }}>
              {l}
            </div>
          ))}
        </div>
        {/* online */}
        <div className="px-3 pt-2 border-t mt-2" style={{ borderColor: '#21262D' }}>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#484F58' }}>Online</p>
          {[['AJ','#7C3AED'],['SK','#0EA5E9'],['MK','#10B981']].map(([ini,c]) => (
            <div key={ini} className="flex items-center gap-2 py-0.5">
              <div className="relative w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0"
                   style={{ background: c }}>
                {ini[0]}
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border"
                      style={{ background: '#238636', borderColor: '#0D1117' }} />
              </div>
              <span className="text-[10px]" style={{ color: '#484F58' }}>{ini}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main board */}
      <div className="flex-1 p-4 overflow-hidden" style={{ background: '#0A0A0D' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-semibold" style={{ color: '#E6EDF3' }}>Sprint 12 — Q2</p>
            <p className="text-[10px]" style={{ color: '#484F58' }}>14 tasks · 3 in progress</p>
          </div>
          <div className="text-[10px] font-medium px-2.5 py-1 rounded border"
               style={{ color: '#3FB950', borderColor: '#238636', background: '#23863610' }}>
            On track
          </div>
        </div>

        {/* Columns */}
        <div className="flex gap-3" style={{ height: '175px' }}>
          {[
            { title:'To Do',      color:'#484F58', cards:[
                { t:'Design token audit',       tag:'Design',  p:'Med',  ai:false },
                { t:'User research synthesis',   tag:'Research',p:'Low',  ai:false },
              ]},
            { title:'In Progress', color:'#388BFD', cards:[
                { t:'API v2 integration',        tag:'Eng',     p:'High', ai:true  },
                { t:'Auth flow refactor',         tag:'Eng',     p:'High', ai:false },
              ]},
            { title:'Done',        color:'#3FB950', cards:[
                { t:'Q1 roadmap planning',        tag:'Strategy',p:'High', ai:false },
              ]},
          ].map(col => (
            <div key={col.title} className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6E7681' }}>
                  {col.title}
                </span>
                <span className="ml-auto text-[9px]" style={{ color: '#30363D' }}>
                  {col.cards.length}
                </span>
              </div>
              {col.cards.map(card => (
                <div key={card.t}
                     className="rounded-md p-2.5 cursor-pointer transition-colors"
                     style={{ background: '#161B22', border: '1px solid #21262D' }}>
                  {card.ai && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <Zap size={9} style={{ color: '#7C3AED' }} />
                      <span className="text-[8px] font-semibold" style={{ color: '#7C3AED' }}>AI priority</span>
                    </div>
                  )}
                  <p className="text-[11px] font-medium leading-snug mb-2" style={{ color: '#E6EDF3' }}>
                    {card.t}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{ color: '#6E7681', background: '#21262D' }}>
                      {card.tag}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded`}
                          style={{
                            color: card.p==='High' ? '#F85149' : card.p==='Med' ? '#D29922' : '#6E7681',
                            background: card.p==='High' ? '#F8514910' : card.p==='Med' ? '#D2992210' : '#21262D',
                          }}>
                      {card.p}
                    </span>
                  </div>
                </div>
              ))}
              <div className="rounded-md p-2 text-center text-[10px] cursor-pointer"
                   style={{ border: '1px dashed #21262D', color: '#30363D' }}>
                + Add task
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

/* ─── Layout ──────────────────────────────────────────────────────────── */
const EnhancedAuthLayout = () => {
  const { isDark, toggle } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden"
         style={{ background: isDark ? '#0D1117' : '#ffffff' }}>

      {/* ══ LEFT — 55% ═══════════════════════════════════════════════════ */}
      <div className="hidden md:flex w-[55%] flex-shrink-0 flex-col overflow-y-auto relative"
           style={{ background: '#09090B' }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
               backgroundSize: '48px 48px',
             }} />
        {/* Radial highlight — very subtle, no glow */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(124,58,237,0.10) 0%, transparent 60%)' }} />

        <div className="relative flex flex-col h-full px-10 xl:px-12 py-7 xl:py-8">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6 flex-shrink-0">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                 style={{ background: '#7C3AED' }}>
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-[14px] font-semibold tracking-tight"
                  style={{ color: '#E6EDF3' }}>
              TaskFlow <span style={{ color: '#7C3AED' }}>AI</span>
            </span>
          </div>

          {/* Headline */}
          <div className="mb-6 flex-shrink-0">
            <h1 className="text-[26px] xl:text-[30px] font-bold leading-[1.15] mb-2.5"
                style={{ color: '#E6EDF3', letterSpacing: '-0.02em' }}>
              Manage Projects,<br />Teams and Clients<br />
              <span style={{ color: '#8B949E' }}>from one workspace.</span>
            </h1>
            <p className="text-[13px] leading-relaxed max-w-xs"
               style={{ color: '#6E7681' }}>
              Tasks, chat, CRM, and AI insights — unified for engineering and ops teams.
            </p>
          </div>

          {/* Screenshot — 88% width, constrained height */}
          <div className="mb-6 flex-shrink-0" style={{ width: '88%' }}>
            <DashboardPreview />
          </div>

          {/* Features */}
          <ul className="space-y-2 flex-shrink-0">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-[12px]"
                  style={{ color: '#6E7681' }}>
                <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                     style={{ background: '#238636' }}>
                  <Check size={9} className="text-white" strokeWidth={3} />
                </div>
                {f}
              </li>
            ))}
          </ul>

          {/* Footer */}
          <p className="mt-auto pt-6 text-[10px]" style={{ color: '#21262D' }}>
            © {new Date().getFullYear()} TaskFlow AI · Trusted by 10,000+ teams
          </p>
        </div>
      </div>

      {/* ══ RIGHT — 45% ══════════════════════════════════════════════════ */}
      <div className="flex-1 md:w-[45%] overflow-y-auto flex flex-col items-center justify-start
                      px-6 pt-12 pb-12 relative"
           style={{ background: isDark ? '#0D1117' : '#F6F8FA' }}>

        {/* Mobile logo */}
        <div className="md:hidden self-start mb-8 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
               style={{ background: '#7C3AED' }}>
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: isDark ? '#E6EDF3' : '#24292F' }}>
            TaskFlow AI
          </span>
        </div>

        {/* Auth card — max 560px, no fixed height */}
        <div className="w-full" style={{ maxWidth: '480px' }}>
          <div className="rounded-xl p-8"
               style={{
                 background: isDark ? '#161B22' : '#ffffff',
                 border: `1px solid ${isDark ? '#30363D' : '#D0D7DE'}`,
                 boxShadow: isDark
                   ? '0 1px 3px rgba(0,0,0,0.4)'
                   : '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)',
               }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedAuthLayout

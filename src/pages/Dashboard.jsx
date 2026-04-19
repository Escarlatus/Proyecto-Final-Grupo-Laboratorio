import React, { useState, useEffect, useMemo } from "react"
import {
  BarChart2, ClipboardList, Download, Search, RefreshCw,
  FileText, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Calendar, ChevronLeft, ChevronRight
} from "lucide-react"
import { useSupabase } from "../hooks/useSupabase"

// ── STATUS CONFIG ────────────────────────────────────────────────
const STATUS_CFG = {
  1: { label: "Pendiente",            color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",    dot: "bg-amber-500" },
  2: { label: "En Revisión",          color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",        dot: "bg-blue-500" },
  3: { label: "Evaluación Favorable", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-400" },
  4: { label: "Rechazada",            color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",            dot: "bg-red-500" },
  5: { label: "Aprobada",             color: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300", dot: "bg-emerald-600" },
  6: { label: "Observada",            color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-500" },
}

const TABS = [
  { id: "estadisticas", label: "Estadísticas",   icon: BarChart2 },
  { id: "solicitudes",  label: "Solicitudes",     icon: FileText },
  { id: "auditoria",    label: "Auditoría",       icon: ClipboardList },
]

// ── HELPERS ──────────────────────────────────────────────────────
function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

// ── MAIN COMPONENT ───────────────────────────────────────────────
export default function Dashboard() {
  const supabase = useSupabase()
  const [activeTab, setActiveTab] = useState("estadisticas")
  const [requests, setRequests] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [requestTypes, setRequestTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [auditLoading, setAuditLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Filters — solicitudes
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [searchReq, setSearchReq] = useState("")

  // Filters — auditoría
  const [auditSearch, setAuditSearch] = useState("")
  const [auditAction, setAuditAction] = useState("all")

  // Pagination
  const [reqPage, setReqPage] = useState(1)
  const [auditPage, setAuditPage] = useState(1)
  const PAGE_SIZE = 15

  // ── FETCH ──
  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [{ data: reqs }, { data: types }] = await Promise.all([
        supabase.from("applications_requests").select(`
          request_id, request_number, status_id, submitted_at, reviewed_at,
          registry_establishments(trade_name, rnc),
          applications_request_types(type_name)
        `).order("submitted_at", { ascending: false }),
        supabase.from("applications_request_types").select("request_type_id, type_name")
      ])
      if (reqs) setRequests(reqs)
      if (types) setRequestTypes(types)
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const fetchAudit = async () => {
    setAuditLoading(true)
    try {
      const { data } = await supabase
        .from("system_audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500)
      if (data) setAuditLogs(data)
    } catch (e) { console.error(e) }
    finally { setAuditLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    if (activeTab === "auditoria" && auditLogs.length === 0) fetchAudit()
  }, [activeTab])

  // ── STATS ──
  const stats = useMemo(() => {
    const total = requests.length
    const byStatus = {}
    requests.forEach(r => { byStatus[r.status_id] = (byStatus[r.status_id] || 0) + 1 })
    const byType = {}
    requests.forEach(r => {
      const name = r.applications_request_types?.type_name || "Otro"
      byType[name] = (byType[name] || 0) + 1
    })
    const byMonth = {}
    requests.forEach(r => {
      const m = r.submitted_at?.slice(0, 7) || "?"
      byMonth[m] = (byMonth[m] || 0) + 1
    })
    return { total, byStatus, byType, byMonth }
  }, [requests])

  // ── FILTERED REQUESTS ──
  const filteredReqs = useMemo(() => {
    return requests.filter(r => {
      if (filterStatus !== "all" && String(r.status_id) !== filterStatus) return false
      if (filterType !== "all" && r.applications_request_types?.type_name !== filterType) return false
      if (filterDateFrom && r.submitted_at < filterDateFrom) return false
      if (filterDateTo && r.submitted_at > filterDateTo + "T23:59:59") return false
      const q = searchReq.toLowerCase()
      if (q && !r.request_number?.toLowerCase().includes(q) &&
          !r.registry_establishments?.trade_name?.toLowerCase().includes(q) &&
          !r.registry_establishments?.rnc?.toLowerCase().includes(q)) return false
      return true
    })
  }, [requests, filterStatus, filterType, filterDateFrom, filterDateTo, searchReq])

  const reqPages = Math.max(1, Math.ceil(filteredReqs.length / PAGE_SIZE))
  const pagedReqs = filteredReqs.slice((reqPage - 1) * PAGE_SIZE, reqPage * PAGE_SIZE)

  // ── FILTERED AUDIT ──
  const filteredAudit = useMemo(() => {
    return auditLogs.filter(l => {
      if (auditAction !== "all" && l.action !== auditAction) return false
      const q = auditSearch.toLowerCase()
      if (q && !l.entity_name?.toLowerCase().includes(q) &&
          !l.action?.toLowerCase().includes(q) &&
          !String(l.entity_id || "").includes(q)) return false
      return true
    })
  }, [auditLogs, auditAction, auditSearch])

  const auditPages = Math.max(1, Math.ceil(filteredAudit.length / PAGE_SIZE))
  const pagedAudit = filteredAudit.slice((auditPage - 1) * PAGE_SIZE, auditPage * PAGE_SIZE)
  const auditActions = [...new Set(auditLogs.map(l => l.action).filter(Boolean))]

  // ── EXPORT ──
  const exportRequests = () => {
    const headers = ["N° Solicitud", "Establecimiento", "RNC", "Tipo", "Estado", "Fecha Envío", "Fecha Revisión"]
    const rows = filteredReqs.map(r => [
      r.request_number,
      r.registry_establishments?.trade_name || "",
      r.registry_establishments?.rnc || "",
      r.applications_request_types?.type_name || "",
      STATUS_CFG[r.status_id]?.label || r.status_id,
      r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("es-DO") : "",
      r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString("es-DO") : "Pendiente"
    ])
    downloadCSV([headers, ...rows], "reporte_solicitudes")
  }

  const exportAudit = () => {
    const headers = ["Fecha", "Acción", "Entidad", "ID", "Valor Anterior", "Nuevo Valor", "Usuario"]
    const rows = filteredAudit.map(l => [
      l.timestamp ? new Date(l.timestamp).toLocaleString("es-DO") : "",
      l.action, l.entity_name, l.entity_id,
      l.old_values || "", l.new_values || "", l.user_id || "Sistema"
    ])
    downloadCSV([headers, ...rows], "auditoria")
  }

  // ── RENDER ──
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-2 border-[#0F539C] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-500">Cargando datos...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Panel Regulatorio</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Estadísticas del sistema, historial de solicitudes y trazabilidad de acciones.</p>
        </div>
        <button onClick={() => fetchAll(true)} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-[#0F539C] text-[#0F539C] dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB: ESTADÍSTICAS ── */}
      {activeTab === "estadisticas" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Solicitudes" value={stats.total} icon={FileText} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
            <StatCard label="Pendientes" value={(stats.byStatus[1] || 0) + (stats.byStatus[2] || 0)} icon={Clock} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" />
            <StatCard label="Aprobadas" value={stats.byStatus[5] || 0} icon={CheckCircle2} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" />
            <StatCard label="Observadas / Rechazadas" value={(stats.byStatus[6] || 0) + (stats.byStatus[4] || 0)} icon={AlertTriangle} color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por Estado */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Distribución por Estado</h3>
              <div className="space-y-3">
                {Object.entries(STATUS_CFG).map(([id, cfg]) => {
                  const count = stats.byStatus[Number(id)] || 0
                  const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={id}>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{cfg.label}</span>
                        <span className="font-semibold">{count} <span className="font-normal text-slate-400">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.dot} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Por Tipo */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Solicitudes por Tipo</h3>
              <div className="space-y-3">
                {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([name, count]) => {
                  const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span className="truncate max-w-[200px]">{name}</span>
                        <span className="font-semibold shrink-0 ml-2">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0F539C] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {Object.keys(stats.byType).length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sin datos aún.</p>}
              </div>
            </div>

            {/* Por Mes */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><Calendar className="h-4 w-4" /> Solicitudes por Mes</h3>
              {Object.keys(stats.byMonth).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos aún.</p>
              ) : (
                <div className="flex items-end gap-2 overflow-x-auto" style={{ height: "120px" }}>
                  {Object.entries(stats.byMonth).slice(-12).map(([month, count]) => {
                    const maxVal = Math.max(...Object.values(stats.byMonth))
                    const pct = maxVal ? (count / maxVal) * 100 : 0
                    return (
                      <div key={month} className="flex flex-col items-center gap-1 shrink-0 flex-1 min-w-[40px] h-full justify-end">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{count}</span>
                        <div className="w-full bg-[#0F539C] dark:bg-blue-500 rounded-t-md transition-all duration-700" style={{ height: `${pct}%` }} />
                        <span className="text-[10px] text-slate-400">{month.slice(5)}/{month.slice(2, 4)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SOLICITUDES ── */}
      {activeTab === "solicitudes" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input value={searchReq} onChange={e => { setSearchReq(e.target.value); setReqPage(1) }}
                    placeholder="N° expediente, establecimiento, RNC..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F539C] bg-white dark:bg-slate-900 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Estado</label>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setReqPage(1) }}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F539C] bg-white dark:bg-slate-900 dark:text-slate-100">
                  <option value="all">Todos</option>
                  {Object.entries(STATUS_CFG).map(([id, cfg]) => (
                    <option key={id} value={id}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Tipo</label>
                <select value={filterType} onChange={e => { setFilterType(e.target.value); setReqPage(1) }}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F539C] bg-white dark:bg-slate-900 dark:text-slate-100">
                  <option value="all">Todos</option>
                  {requestTypes.map(t => <option key={t.request_type_id} value={t.type_name}>{t.type_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Desde</label>
                <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setReqPage(1) }}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F539C] bg-white dark:bg-slate-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Hasta</label>
                <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setReqPage(1) }}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F539C] bg-white dark:bg-slate-900 dark:text-slate-100" />
              </div>
              <button onClick={exportRequests}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F539C] text-white text-sm font-semibold rounded-lg hover:bg-[#0d4a8a] transition-colors">
                <Download className="h-4 w-4" /> Exportar CSV
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">{filteredReqs.length}</span> resultados
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                  <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {["N° Solicitud", "Establecimiento", "RNC", "Tipo", "Estado", "Fecha Envío", "Última Revisión"].map(h => (
                      <th key={h} className="px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagedReqs.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">No se encontraron solicitudes.</td></tr>
                  ) : pagedReqs.map(r => {
                    const s = STATUS_CFG[r.status_id] || {}
                    return (
                      <tr key={r.request_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white text-xs">{r.request_number}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.registry_establishments?.trade_name || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{r.registry_establishments?.rnc || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.applications_request_types?.type_name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("es-DO") : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString("es-DO") : <span className="text-slate-300 dark:text-slate-600">Pendiente</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {reqPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500">Página {reqPage} de {reqPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setReqPage(p => Math.max(1, p - 1))} disabled={reqPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <button onClick={() => setReqPage(p => Math.min(reqPages, p + 1))} disabled={reqPage === reqPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                    <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: AUDITORÍA ── */}
      {activeTab === "auditoria" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input value={auditSearch} onChange={e => { setAuditSearch(e.target.value); setAuditPage(1) }}
                    placeholder="Entidad, acción, ID..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F539C] bg-white dark:bg-slate-900 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Acción</label>
                <select value={auditAction} onChange={e => { setAuditAction(e.target.value); setAuditPage(1) }}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F539C] bg-white dark:bg-slate-900 dark:text-slate-100">
                  <option value="all">Todas</option>
                  {auditActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button onClick={exportAudit}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F539C] text-white text-sm font-semibold rounded-lg hover:bg-[#0d4a8a] transition-colors">
                <Download className="h-4 w-4" /> Exportar CSV
              </button>
              <button onClick={fetchAudit} disabled={auditLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
                <RefreshCw className={`h-4 w-4 ${auditLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">{filteredAudit.length}</span> registros de auditoría
              </p>
            </div>
            {auditLoading ? (
              <div className="p-10 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-[#0F539C] border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-slate-500">Cargando auditoría...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {["Fecha", "Acción", "Entidad", "ID", "Antes", "Después", "Usuario"].map(h => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedAudit.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        {auditLogs.length === 0 ? "No hay registros de auditoría aún." : "Sin resultados para ese filtro."}
                      </td></tr>
                    ) : pagedAudit.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString("es-DO") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{log.action || "—"}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{log.entity_name || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{log.entity_id ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate" title={log.old_values}>{log.old_values || "—"}</td>
                        <td className="px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400 font-medium max-w-[120px] truncate" title={log.new_values}>{log.new_values || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 font-mono truncate max-w-[100px]">{log.user_id || "Sistema"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {auditPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500">Página {auditPage} de {auditPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <button onClick={() => setAuditPage(p => Math.min(auditPages, p + 1))} disabled={auditPage === auditPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
                    <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

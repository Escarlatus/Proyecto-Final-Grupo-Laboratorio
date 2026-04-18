import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FilePlus2, Search, Clock, CheckCircle, XCircle, FileText, ChevronRight, AlertCircle, AlertTriangle } from "lucide-react"
import { useUser } from "@clerk/react"
import { useSupabase } from "../hooks/useSupabase"

const STATUS_CONFIG = {
  borrador:    { label: "Pendiente",    color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",   icon: Clock },
  en_revision: { label: "En Revisión",  color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400",      icon: FileText },
  favorable:   { label: "Evaluación Favorable", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400", icon: CheckCircle },
  rechazada:   { label: "Rechazada",    color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",         icon: XCircle },
  aprobada:    { label: "Aprobada",     color: "text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300", icon: CheckCircle },
  observada:   { label: "Observada",    color: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400", icon: AlertTriangle },
}

const STATUS_MAP = { 1: "borrador", 2: "en_revision", 3: "favorable", 4: "rechazada", 5: "aprobada", 6: "observada" }

function StatusBadge({ statusKey }) {
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.borrador
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

export default function MisSolicitudes() {
  const { user } = useUser()
  const supabase = useSupabase()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!user) return
    const fetchMyRequests = async () => {
      try {
        setLoading(true)
        
        // 1. Obtener mi user_id interno
        const { data: dbUser } = await supabase
          .from("identity_users")
          .select("user_id")
          .eq("clerk_user_id", user.id)
          .single();

        if (!dbUser) { setLoading(false); return; }

        // 2. Traer las solicitudes filtradas
        const { data, error } = await supabase
          .from("applications_requests")
          .select(`
            request_id,
            request_number,
            status_id,
            registry_establishments(trade_name),
            applications_request_types(type_name),
            submitted_at
          `)
          .eq("applicant_user_id", dbUser.user_id)
          .order("submitted_at", { ascending: false });

        if (data) {
          const mapped = data.map(r => ({
            id: r.request_number,
            internalId: r.request_id,
            establishment: r.registry_establishments?.trade_name || "N/A",
            type: r.applications_request_types?.type_name || "Desconocido",
            status: STATUS_MAP[r.status_id] || "borrador",
            date: new Date(r.submitted_at).toLocaleDateString()
          }))
          setRequests(mapped)
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchMyRequests()
  }, [user, supabase])

  const filtered = requests.filter(r =>
    r.id?.toLowerCase().includes(search.toLowerCase()) ||
    r.establishment?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase())
  )

  // Dynamic alert counts
  const observadasCount = requests.filter(r => r.status === "observada").length
  const rechazadasCount = requests.filter(r => r.status === "rechazada").length
  const documentsAlerts = requests.filter(r => ["borrador","en_revision"].includes(r.status)).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Mis Solicitudes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Seguimiento de tus trámites ante la DIGEMAPS.</p>
        </div>
        <Link
          to="/app/nueva-solicitud"
          className="inline-flex items-center gap-2 bg-[#0F539C] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0d4a8a] transition-all shadow-md hover:shadow-lg"
        >
          <FilePlus2 className="h-4 w-4" />
          Nueva Solicitud
        </Link>
      </div>

      {/* Alertas dinámicas */}
      {(observadasCount > 0 || rechazadasCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {observadasCount > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-orange-900 dark:text-orange-200">Solicitudes Observadas</h4>
                <p className="text-xs text-orange-700 dark:text-orange-300/80 mt-0.5">
                  Tienes <strong>{observadasCount}</strong> solicitud{observadasCount > 1 ? "es" : ""} con observaciones del Revisor Técnico. Haz clic en cada una para ver el detalle.
                </p>
              </div>
            </div>
          )}
          {rechazadasCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-900 dark:text-red-200">Solicitudes Rechazadas</h4>
                <p className="text-xs text-red-700 dark:text-red-300/80 mt-0.5">
                  Tienes <strong>{rechazadasCount}</strong> solicitud{rechazadasCount > 1 ? "es" : ""} rechazada{rechazadasCount > 1 ? "s" : ""}. Consulta el motivo en el detalle.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon
          const count = requests.filter(r => STATUS_MAP[r.statusId] === key || r.status === key).length
          return (
            <div key={key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border dark:border-transparent ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{cfg.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número, establecimiento o tipo..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="animate-spin h-8 w-8 border-2 border-[#0F539C] dark:border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            Cargando tus solicitudes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No tienes solicitudes todavía.</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Crea tu primera solicitud usando el botón superior.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3 px-4">N° Solicitud</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3 px-4">Tipo</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3 px-4">Establecimiento</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3 px-4">Fecha</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3 px-4">Estado</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((req) => (
                <tr key={req.id}
                  onClick={() => navigate(`/app/solicitud/${req.requestId}`)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{req.id}</td>
                  <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{req.type}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{req.establishment}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{req.rnc}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{req.date ? new Date(req.date).toLocaleDateString("es-DO") : "—"}</td>
                  <td className="py-3 px-4"><StatusBadge statusKey={req.status} /></td>
                  <td className="py-3 px-4"><ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

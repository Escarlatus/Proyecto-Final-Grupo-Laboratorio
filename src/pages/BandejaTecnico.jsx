import React, { useState, useEffect } from "react"
import { Search, ClipboardCheck, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, X, Building2, User, GraduationCap, FileText, MessageSquare, ArrowLeft, RotateCcw } from "lucide-react"
import { useUser } from "@clerk/react"
import { useSupabase } from "../hooks/useSupabase"

const STATUS_CONFIG = {
  1: { label: "Pendiente",      color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",     key: "borrador" },
  2: { label: "En Revisión",    color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400",         key: "en_revision" },
  3: { label: "Favorable",      color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400", key: "favorable" },
  4: { label: "Rechazada",      color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",            key: "rechazada" },
  5: { label: "Aprobada",       color: "text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300", key: "aprobada" },
  6: { label: "Observada",      color: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",   key: "observada" },
}

const STATUS_LIST_MAP = {
  borrador: 1, en_revision: 2, favorable: 3, rechazada: 4, aprobada: 5, observada: 6
}

function StatusBadge({ statusId, statusKey }) {
  const id = statusId || STATUS_LIST_MAP[statusKey]
  const cfg = STATUS_CONFIG[id] || STATUS_CONFIG[1]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400 min-w-[140px] shrink-0">{label}:</span>
      <span className="text-slate-900 dark:text-slate-100 font-medium">{value}</span>
    </div>
  )
}

function DetailPanel({ request, onClose, onStatusChange }) {
  const [activeTab, setActiveTab] = useState("establecimiento")
  const [observations, setObservations] = useState("")
  const [saving, setSaving] = useState(false)
  const { user } = useUser()
  const supabase = useSupabase()

  const tabs = [
    { id: "establecimiento", label: "Establecimiento", icon: Building2 },
    { id: "propietario",     label: "Propietario",     icon: User },
    { id: "director",        label: "Dir. Técnico",    icon: GraduationCap },
    { id: "documentos",      label: "Documentos",      icon: FileText },
    { id: "observaciones",   label: "Observaciones",   icon: MessageSquare },
  ]

  const handleAction = async (newStatusId, label) => {
    if (!observations.trim() && [4, 6].includes(newStatusId)) {
      alert("Debes escribir una observación o motivo antes de " + label)
      return
    }
    if (!confirm(`¿Confirmar acción: "${label}"?`)) return
    setSaving(true)
    try {
      const { data: dbUser } = await supabase.from("identity_users").select("user_id").eq("clerk_user_id", user.id).single();
      
      const { error } = await supabase
        .from("applications_requests")
        .update({
          status_id: newStatusId,
          reviewer_observations: observations || request.reviewerObservations,
          reviewer_user_id: dbUser ? dbUser.user_id : null
        })
        .eq("request_id", request.requestId);

      if (!error) {
        onStatusChange()
        onClose()
      } else {
        alert("Error al actualizar el estado: " + error.message)
      }
    } catch {
      alert("Error de conexión.")
    }
    setSaving(false)
  }

  const isLocked = request.statusId === 5 || request.statusId === 4

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-[90vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">{request.id}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{request.requestType} — {request.applicantFirstName} {request.applicantLastName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge statusId={request.statusId} />
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "border-[#0F539C] text-[#0F539C] dark:text-blue-400 dark:border-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {activeTab === "establecimiento" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Datos del Establecimiento</h3>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 space-y-2.5 border border-slate-200 dark:border-slate-800">
                <InfoRow label="Nombre Comercial"   value={request.tradeName} />
                <InfoRow label="RNC"                value={request.rnc} />
                <InfoRow label="Categoría Permiso"  value={request.permitCategory} />
                <InfoRow label="Forma Presentación" value={request.presentationForm} />
                <InfoRow label="Dirección"          value={`${request.estStreet}, ${request.estSector}, ${request.estCity}`} />
                <InfoRow label="Municipio"          value={request.estMunicipality} />
                <InfoRow label="Ref. Larga"         value={request.estLongAddress} />
                <InfoRow label="Teléfono Fijo"      value={request.estPhoneFixed} />
                <InfoRow label="Teléfono Celular"   value={request.estPhoneMobile} />
                <InfoRow label="Correo"             value={request.estEmail} />
              </div>
            </div>
          )}

          {activeTab === "propietario" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Propietario / Representante Legal</h3>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 space-y-2.5 border border-slate-200 dark:border-slate-800">
                <InfoRow label="Nombre Completo"    value={`${request.ownerFirstName} ${request.ownerLastName}`} />
                <InfoRow label="Tipo Documento"     value={request.ownerDocType} />
                <InfoRow label="Número Documento"   value={request.ownerDocNum} />
                <InfoRow label="Correo"             value={request.ownerEmail} />
                <InfoRow label="Teléfono Fijo"      value={request.ownerPhoneFixed} />
                <InfoRow label="Teléfono Celular"   value={request.ownerPhoneMobile} />
                <InfoRow label="Dirección"          value={`${request.ownerStreet}, ${request.ownerSector}, ${request.ownerCity}`} />
                <InfoRow label="Municipio"          value={request.ownerMunicipality} />
              </div>
            </div>
          )}

          {activeTab === "director" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Director Técnico</h3>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 space-y-2.5 border border-slate-200 dark:border-slate-800">
                <InfoRow label="Nombre Completo"    value={`${request.dirFirstName} ${request.dirLastName}`} />
                <InfoRow label="Profesión"          value={request.profession} />
                <InfoRow label="Tipo Documento"     value={request.dirDocType} />
                <InfoRow label="Número Documento"   value={request.dirDocNum} />
                <InfoRow label="Nº Exequátur"       value={request.exequaturNumber} />
                <InfoRow label="Fecha Exequátur"    value={request.exequaturDate ? new Date(request.exequaturDate).toLocaleDateString("es-DO") : null} />
                <InfoRow label="Correo"             value={request.dirEmail} />
                <InfoRow label="Teléfono Fijo"      value={request.dirPhoneFixed} />
                <InfoRow label="Teléfono Celular"   value={request.dirPhoneMobile} />
                <InfoRow label="Dirección"          value={`${request.dirStreet}, ${request.dirSector}, ${request.dirCity}`} />
              </div>
            </div>
          )}

          {activeTab === "documentos" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Documentos Adjuntos</h3>
              <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl">
                <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">La gestión de archivos adjuntos estará disponible cuando se configure el almacenamiento de archivos (S3/Blob).</p>
              </div>
            </div>
          )}

          {activeTab === "observaciones" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Observaciones del Revisor</h3>
              {request.reviewerObservations && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Observaciones previas</p>
                  <p className="text-sm text-amber-900 dark:text-amber-200">{request.reviewerObservations}</p>
                </div>
              )}
              {request.applicantObservations && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Observaciones del Solicitante</p>
                  <p className="text-sm text-blue-900 dark:text-blue-200">{request.applicantObservations}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nueva observación / corrección</label>
                <textarea
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  disabled={isLocked}
                  rows={4}
                  placeholder="Describa las correcciones requeridas o el motivo de la resolución..."
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0F539C] bg-transparent dark:text-slate-100 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        {!isLocked && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Escribe tus observaciones en la pestaña correspondiente antes de ejecutar una acción.</p>
            <div className="flex flex-wrap gap-2">
              {request.statusId === 1 && (
                <button onClick={() => handleAction(2, "Marcar En Revisión")} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <ClipboardCheck className="h-4 w-4" />
                  Marcar "En Revisión"
                </button>
              )}
              {(request.statusId === 1 || request.statusId === 2) && (
                <>
                  <button onClick={() => handleAction(6, "Devolver con Observaciones")} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    <RotateCcw className="h-4 w-4" />
                    Devolver (Observada)
                  </button>
                  <button onClick={() => handleAction(3, "Marcar como Favorable")} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    <CheckCircle className="h-4 w-4" />
                    Evaluación Favorable
                  </button>
                  <button onClick={() => handleAction(4, "Rechazar Solicitud")} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </button>
                </>
              )}
              {request.statusId === 6 && (
                <>
                  <button onClick={() => handleAction(3, "Marcar como Favorable")} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    <CheckCircle className="h-4 w-4" />
                    Evaluación Favorable
                  </button>
                  <button onClick={() => handleAction(4, "Rechazar Solicitud")} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </button>
                </>
              )}
              {saving && <span className="text-sm text-slate-500 self-center">Guardando...</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BandejaTecnico() {
  const supabase = useSupabase()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [activeTabView, setActiveTabView] = useState("pendientes")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailData, setDetailData] = useState(null)

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("applications_requests")
        .select(`
          request_id, request_number, status_id, submitted_at,
          registry_establishments(trade_name, rnc),
          applications_request_types(type_name)
        `)
        .order("submitted_at", { ascending: false });

      if (data) {
        setRequests(data.map(r => ({
          id: r.request_number,
          requestId: r.request_id,
          type: r.applications_request_types?.type_name || "Trámite",
          establishment: r.registry_establishments?.trade_name,
          rnc: r.registry_establishments?.rnc,
          status: STATUS_MAP[r.status_id] || "borrador",
          date: r.submitted_at
        })))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openDetail = async (req) => {
    setSelectedRequest(req)
    setLoadingDetail(true)
    try {
      const { data, error } = await supabase
        .from("applications_requests")
        .select(`
          request_id, request_number, status_id, applicant_observations, reviewer_observations,
          applications_request_types(type_name),
          identity_users!applicant_user_id(identity_persons(first_name, last_name)),
          registry_establishments(*),
          registry_owners(*),
          registry_technical_directors(*)
        `)
        .eq("request_id", req.requestId)
        .single();
        
      if (data) {
        const est = data.registry_establishments || {};
        const own = data.registry_owners || {};
        const dir = data.registry_technical_directors || {};
        const usr = data.identity_users?.identity_persons || {};

        setDetailData({
          requestId: data.request_id, id: data.request_number, statusId: data.status_id,
          requestType: data.applications_request_types?.type_name,
          applicantFirstName: usr.first_name || "", applicantLastName: usr.last_name || "",
          applicantObservations: data.applicant_observations, reviewerObservations: data.reviewer_observations,
          
          tradeName: est.trade_name, rnc: est.rnc, permitCategory: est.permit_category_id, presentationForm: est.presentation_form_id,
          estStreet: est.street_address, estSector: est.sector, estCity: est.city, estMunicipality: est.municipality,
          estLongAddress: est.long_address, estPhoneFixed: est.phone_fixed, estPhoneMobile: est.phone_mobile, estEmail: est.email,
          
          ownerFirstName: own.first_name, ownerLastName: own.last_name, ownerDocType: own.document_type, ownerDocNum: own.document_number,
          ownerEmail: own.email, ownerPhoneFixed: own.phone_fixed, ownerPhoneMobile: own.phone_mobile,
          ownerStreet: own.street_address, ownerSector: own.sector, ownerCity: own.city, ownerMunicipality: own.municipality,
          
          dirFirstName: dir.first_name, dirLastName: dir.last_name, profession: dir.profession, dirDocType: dir.document_type,
          dirDocNum: dir.document_number, exequaturNumber: dir.exequatur_number, exequaturDate: dir.exequatur_date,
          dirEmail: dir.email, dirPhoneFixed: dir.phone_fixed, dirPhoneMobile: dir.phone_mobile,
          dirStreet: dir.street_address, dirSector: dir.sector, dirCity: dir.city
        })
      }
    } catch (e) { console.error(e) }
    finally { setLoadingDetail(false) }
  }

  const closeDetail = () => { setSelectedRequest(null); setDetailData(null) }

  const counts = {
    pending: requests.filter(r => r.status === "borrador").length,
    review: requests.filter(r => r.status === "en_revision").length,
    observed: requests.filter(r => r.status === "observada").length,
    favorable: requests.filter(r => r.status === "favorable").length,
  }

  const filtered = requests.filter(r => {
    const matchSearch = r.id?.toLowerCase().includes(search.toLowerCase()) || r.establishment?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || r.status === filterStatus
    const isPending = r.status === "borrador" || r.status === "en_revision"
    const matchView = activeTabView === "pendientes" ? isPending : (!isPending && r.status !== "aprobada")
    return matchSearch && matchStatus && matchView
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {selectedRequest && detailData && (
        <DetailPanel
          request={{ ...detailData, id: selectedRequest.id, requestId: selectedRequest.requestId }}
          onClose={closeDetail}
          onStatusChange={fetchRequests}
        />
      )}
      {selectedRequest && loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-2 border-[#0F539C] border-t-transparent rounded-full" />
            <p className="text-slate-600 text-sm">Cargando expediente...</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Bandeja del Revisor Técnico</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Evalúa los expedientes y emite tu concepto técnico oficial.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pendientes", count: counts.pending, color: "border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800", iconColor: "text-amber-600 dark:text-amber-400", Icon: Clock },
          { label: "En Revisión", count: counts.review, color: "border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800", iconColor: "text-blue-600 dark:text-blue-400", Icon: ClipboardCheck },
          { label: "Observadas", count: counts.observed, color: "border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800", iconColor: "text-orange-600 dark:text-orange-400", Icon: RotateCcw },
          { label: "Favorables", count: counts.favorable, color: "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800", iconColor: "text-emerald-600 dark:text-emerald-400", Icon: CheckCircle },
        ].map(({ label, count, color, iconColor, Icon }) => (
          <div key={label} className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm ${color}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border dark:border-transparent ${color}`}><Icon className={`h-4 w-4 ${iconColor}`} /></div>
              <div><p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p><p className="text-xs text-slate-500 dark:text-slate-400">{label}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4">
          <button onClick={() => setActiveTabView("pendientes")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTabView === "pendientes" ? "border-[#0F539C] text-[#0F539C] dark:border-blue-400 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}>
            Pendientes de Revisión
          </button>
          <button onClick={() => setActiveTabView("completadas")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTabView === "completadas" ? "border-[#0F539C] text-[#0F539C] dark:border-blue-400 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}>
            Mis Evaluaciones Completadas
          </button>
        </div>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3 w-full md:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#0F539C] transition-all relative">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar expediente o establecimiento..."
              className="flex-1 w-full md:w-64 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="w-full md:w-auto border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F539C] transition-all cursor-pointer">
            <option value="all">Todos los estados</option>
            <option value="borrador">Pendientes</option>
            <option value="en_revision">En Revisión</option>
            <option value="observada">Observadas</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="animate-spin h-8 w-8 border-2 border-[#0F539C] dark:border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            Cargando expedientes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No hay expedientes que mostrar.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                {["Expediente", "Tipo", "Establecimiento", "Fecha", "Estado", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(req => (
                <tr key={req.id} onClick={() => openDetail(req)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
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

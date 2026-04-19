import React, { useState, useEffect } from "react"
import { Search, Stamp, CheckCircle, XCircle, AlertCircle, X, Building2, User, GraduationCap, FileText, ShieldCheck, ArrowLeft, Download } from "lucide-react"
import { useUser } from "@clerk/react"
import { useSupabase } from "../hooks/useSupabase"

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
  const [sigApplicant, setSigApplicant] = useState(false)
  const [sigDirector, setSigDirector] = useState(false)
  const [saving, setSaving] = useState(false)
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const { user } = useUser()
  const supabase = useSupabase()

  React.useEffect(() => {
    const fetchDocs = async () => {
      setLoadingDocs(true)
      const { data } = await supabase
        .from("applications_documents")
        .select("document_id, file_name, file_path, file_type, file_size_in_bytes")
        .eq("request_id", request.requestId)
      setDocuments(data || [])
      setLoadingDocs(false)
    }
    fetchDocs()
  }, [request.requestId, supabase])

  const downloadFile = async (filePath, fileName) => {
    const { data, error } = await supabase.storage.from("solicitudes").createSignedUrl(filePath, 60)
    if (error) { alert("No se pudo generar el enlace."); return }
    const a = document.createElement("a")
    a.href = data.signedUrl
    a.download = fileName
    a.click()
  }

  const tabs = [
    { id: "establecimiento", label: "Establecimiento", icon: Building2 },
    { id: "propietario",     label: "Propietario",     icon: User },
    { id: "director",        label: "Dir. Técnico",    icon: GraduationCap },
    { id: "firmas",          label: "Firmas",          icon: ShieldCheck },
    { id: "documentos",      label: "Documentos",      icon: FileText },
  ]

  const handleAction = async (newStatusId, label) => {
    if (newStatusId === 5 && (!sigApplicant || !sigDirector)) {
      alert("Debes validar ambas firmas electrónicas antes de emitir la constancia.")
      return
    }
    if (newStatusId === 4 && !observations.trim()) {
      alert("Debes escribir el motivo del rechazo antes de continuar.")
      return
    }
    if (!confirm(`¿Confirmar: "${label}"?`)) return
    setSaving(true)
    try {
      const { data: dbUser } = await supabase.from("identity_users").select("user_id").eq("clerk_user_id", user.id).single();
      
      const { error } = await supabase
        .from("applications_requests")
        .update({
          status_id: newStatusId,
          reviewer_observations: newStatusId === 5 ? "Constancia emitida por Receptor VUS. Firmas verificadas." : observations,
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

  const isApproved = request.statusId === 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-[90vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
              <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">{request.requestNumber}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{request.requestType} — {request.applicantFirstName} {request.applicantLastName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700">
              Evaluación Favorable
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
              <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}>
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
                <InfoRow label="Correo"             value={request.estEmail} />
                <InfoRow label="Teléfono"           value={`${request.estPhoneFixed} / ${request.estPhoneMobile}`} />
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
                <InfoRow label="Teléfono"           value={`${request.ownerPhoneFixed} / ${request.ownerPhoneMobile}`} />
                <InfoRow label="Dirección"          value={`${request.ownerStreet}, ${request.ownerSector}, ${request.ownerCity}`} />
              </div>
            </div>
          )}

          {activeTab === "director" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Director Técnico</h3>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 space-y-2.5 border border-slate-200 dark:border-slate-800">
                <InfoRow label="Nombre Completo"    value={`${request.dirFirstName} ${request.dirLastName}`} />
                <InfoRow label="Profesión"          value={request.profession} />
                <InfoRow label="Nº Exequátur"       value={request.exequaturNumber} />
                <InfoRow label="Fecha Exequátur"    value={request.exequaturDate ? new Date(request.exequaturDate).toLocaleDateString("es-DO") : null} />
                <InfoRow label="Tipo Documento"     value={request.dirDocType} />
                <InfoRow label="Número Documento"   value={request.dirDocNum} />
                <InfoRow label="Correo"             value={request.dirEmail} />
                <InfoRow label="Teléfono"           value={`${request.dirPhoneFixed} / ${request.dirPhoneMobile}`} />
              </div>
            </div>
          )}

          {activeTab === "firmas" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Verificación de Firmas Electrónicas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Confirma que las firmas electrónicas del expediente son válidas y corresponden a las identidades registradas.</p>

              <div className="space-y-3">
                {[
                  { id: "applicant", label: "Firma del Solicitante / Propietario", name: `${request.ownerFirstName} ${request.ownerLastName}`, doc: request.ownerDocNum, state: sigApplicant, setter: setSigApplicant },
                  { id: "director",  label: "Firma del Director Técnico", name: `${request.dirFirstName} ${request.dirLastName}`, doc: `Exequátur: ${request.exequaturNumber}`, state: sigDirector, setter: setSigDirector },
                ].map(sig => (
                  <div key={sig.id} className={`rounded-xl border-2 p-4 transition-colors ${sig.state ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/50" : "border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sig.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sig.name} — {sig.doc}</p>
                      </div>
                      {!isApproved && (
                        <button
                          onClick={() => sig.setter(!sig.state)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            sig.state ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          }`}>
                          <ShieldCheck className="h-4 w-4" />
                          {sig.state ? "Validada ✓" : "Validar"}
                        </button>
                      )}
                      {isApproved && <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Verificada</span>}
                    </div>
                  </div>
                ))}
              </div>

              {!sigApplicant || !sigDirector ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Debes validar ambas firmas para poder emitir la constancia.
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Ambas firmas verificadas. El expediente está listo para emisión de constancia.
                </div>
              )}
            </div>
          )}

          {activeTab === "documentos" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Documentos Adjuntos</h3>
              {loadingDocs ? (
                <div className="text-center py-8 text-slate-400 text-sm">Cargando documentos...</div>
              ) : documents.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl">
                  <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No hay documentos adjuntos en este expediente.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.document_id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.file_name}</p>
                          <p className="text-xs text-slate-500">{doc.file_type} · {(doc.file_size_in_bytes / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadFile(doc.file_path, doc.file_name)}
                        className="shrink-0 ml-3 flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        {!isApproved && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Observaciones de Rechazo (requerido solo si rechaza)</label>
              <textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                rows={2}
                placeholder="Motivo del rechazo..."
                className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 bg-transparent dark:text-slate-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(5, "Aprobar y Emitir Constancia")}
                disabled={saving || !sigApplicant || !sigDirector}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <Stamp className="h-4 w-4" />
                {saving ? "Procesando..." : "Aprobar y Emitir Constancia"}
              </button>
              <button
                onClick={() => handleAction(4, "Rechazar Solicitud")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BandejaReceptor() {
  const supabase = useSupabase()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const STATUS_MAP = { 3: "favorable", 5: "aprobada", 4: "rechazada" }
      const { data, error } = await supabase
        .from("applications_requests")
        .select(`
          request_id, request_number, status_id, submitted_at,
          registry_establishments(trade_name, rnc),
          applications_request_types(type_name)
        `)
        .in("status_id", [3, 5])
        .order("submitted_at", { ascending: false });

      if (data) {
        setRequests(data.map(r => ({
          id: r.request_number,
          requestId: r.request_id,
          type: r.applications_request_types?.type_name || "Trámite",
          establishment: r.registry_establishments?.trade_name,
          rnc: r.registry_establishments?.rnc,
          status: STATUS_MAP[r.status_id] || "favorable",
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
          registry_owners(owner_id, street_address, sector, city, municipality, long_address,
            identity_persons(first_name, last_name, document_type, document_number, email, phone_fixed, phone_mobile)
          ),
          registry_technical_directors(director_id, profession, exequatur_number, exequatur_date, street_address, sector, city, municipality,
            identity_persons(first_name, last_name, document_type, document_number, email, phone_fixed, phone_mobile)
          )
        `)
        .eq("request_id", req.requestId)
        .single()
        
      if (data) {
        const est = data.registry_establishments || {}
        const own = data.registry_owners || {}
        const ownP = own.identity_persons || {}
        const dir = data.registry_technical_directors || {}
        const dirP = dir.identity_persons || {}
        const usr = data.identity_users?.identity_persons || {}

        setDetailData({
          requestId: data.request_id, id: data.request_number, requestNumber: data.request_number, statusId: data.status_id,
          requestType: data.applications_request_types?.type_name,
          applicantFirstName: usr.first_name || "", applicantLastName: usr.last_name || "",
          applicantObservations: data.applicant_observations, reviewerObservations: data.reviewer_observations,

          tradeName: est.trade_name, rnc: est.rnc, permitCategory: est.permit_category_id, presentationForm: est.presentation_form_id,
          estStreet: est.street_address, estSector: est.sector, estCity: est.city, estMunicipality: est.municipality,
          estLongAddress: est.long_address, estPhoneFixed: est.phone_fixed, estPhoneMobile: est.phone_mobile, estEmail: est.email,

          ownerFirstName: ownP.first_name, ownerLastName: ownP.last_name,
          ownerDocType: ownP.document_type, ownerDocNum: ownP.document_number,
          ownerEmail: ownP.email, ownerPhoneFixed: ownP.phone_fixed, ownerPhoneMobile: ownP.phone_mobile,
          ownerStreet: own.street_address, ownerSector: own.sector, ownerCity: own.city, ownerMunicipality: own.municipality,

          dirFirstName: dirP.first_name, dirLastName: dirP.last_name,
          profession: dir.profession, dirDocType: dirP.document_type, dirDocNum: dirP.document_number,
          exequaturNumber: dir.exequatur_number, exequaturDate: dir.exequatur_date,
          dirEmail: dirP.email, dirPhoneFixed: dirP.phone_fixed, dirPhoneMobile: dirP.phone_mobile,
          dirStreet: dir.street_address, dirSector: dir.sector, dirCity: dir.city
        })
      }
    } catch (e) { console.error(e) }
    finally { setLoadingDetail(false) }
  }

  const closeDetail = () => { setSelectedRequest(null); setDetailData(null) }

  const filtered = requests.filter(r =>
    r.id?.toLowerCase().includes(search.toLowerCase()) ||
    r.establishment?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = requests.filter(r => r.status === "favorable").length
  const approvedCount = requests.filter(r => r.status === "aprobada").length

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {selectedRequest && detailData && (
        <DetailPanel
          request={{ ...detailData, requestId: selectedRequest.requestId }}
          onClose={closeDetail}
          onStatusChange={fetchRequests}
        />
      )}
      {selectedRequest && loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
            <p className="text-slate-600 text-sm">Cargando expediente...</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Bandeja del Receptor VUS</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Valida la recepción final, verifica firmas y emite constancias de habilitación.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform"><AlertCircle className="w-24 h-24 text-blue-900 dark:text-blue-500" /></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-transparent"><FileText className="h-5 w-5 text-blue-700 dark:text-blue-400" /></div>
            <div><p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{pendingCount + approvedCount}</p><p className="text-xs font-medium text-blue-800 dark:text-blue-300">Total Asignadas a Receptor</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-[0.03] dark:opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform"><ShieldCheck className="w-24 h-24 text-emerald-900 dark:text-emerald-500" /></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-transparent"><ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div><p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</p><p className="text-xs font-medium text-emerald-800 dark:text-emerald-400">Pendientes de Firma / Validar</p></div>
          </div>
        </div>
        <div className="bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-800 dark:border-slate-700 p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-[0.05] dark:opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform"><Stamp className="w-24 h-24 text-white" /></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 rounded-lg bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600"><Stamp className="h-5 w-5 text-slate-300 dark:text-slate-100" /></div>
            <div><p className="text-2xl font-bold text-white">{approvedCount}</p><p className="text-xs font-medium text-slate-300 dark:text-slate-400">Constancias emitidas</p></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar expediente o establecimiento..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none" />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-600 dark:border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
            Cargando expedientes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No hay expedientes con evaluación favorable pendientes.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Solo verás expedientes que el Revisor Técnico marcó como favorables.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                {["Expediente", "Tipo", "Establecimiento", "RNC", "Estado", ""].map(h => (
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
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-100">{req.establishment}</td>
                  <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{req.rnc}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      req.status === "aprobada"
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700"
                        : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    }`}>
                      {req.status === "aprobada" ? "✓ Constancia Emitida" : "Evaluación Favorable"}
                    </span>
                  </td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-slate-400 dark:text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

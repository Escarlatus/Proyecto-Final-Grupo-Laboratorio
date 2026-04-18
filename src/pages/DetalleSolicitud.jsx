import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft, Building2, User, GraduationCap, FileText, MessageSquare,
  Clock, CheckCircle, XCircle, AlertTriangle, Stamp, Download, Loader2
} from "lucide-react"
import { useSupabase } from "../hooks/useSupabase"

const STATUS_CONFIG = {
  1: { label: "Pendiente",             color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",     icon: Clock },
  2: { label: "En Revisión",           color: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400",        icon: Clock },
  3: { label: "Evaluación Favorable",  color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400", icon: CheckCircle },
  4: { label: "Rechazada",             color: "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",           icon: XCircle },
  5: { label: "Aprobada",             color: "text-emerald-800 bg-emerald-100 border-emerald-300 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300", icon: Stamp },
  6: { label: "Observada",             color: "text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",  icon: AlertTriangle },
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
      <span className="text-slate-500 dark:text-slate-400 min-w-[160px] shrink-0">{label}</span>
      <span className="text-slate-900 dark:text-slate-100 font-medium">{value}</span>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="p-5 space-y-0.5">{children}</div>
    </div>
  )
}

export default function DetalleSolicitud() {
  const { id } = useParams()
  const navigate = useNavigate()
  const supabase = useSupabase()
  const [detail, setDetail] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("establecimiento")

  const downloadFile = async (filePath, fileName) => {
    const { data, error } = await supabase.storage
      .from("solicitudes")
      .createSignedUrl(filePath, 60) // URL válida por 60 segundos
    if (error) { alert("No se pudo generar el enlace de descarga."); return }
    const a = document.createElement("a")
    a.href = data.signedUrl
    a.download = fileName
    a.click()
  }

  useEffect(() => {
    const fetchAll = async () => {
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
          .eq("request_id", id)
          .single();
          
        if (data) {
          const est = data.registry_establishments || {};
          const own = data.registry_owners || {};
          const dir = data.registry_technical_directors || {};
          const usr = data.identity_users?.identity_persons || {};

          setDetail({
            requestId: data.request_id, requestNumber: data.request_number, statusId: data.status_id,
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
          
          // Documents — use applications_documents table (correct schema)
          const { data: docs } = await supabase
            .from("applications_documents")
            .select("*")
            .eq("request_id", id);
          if (docs) {
            setDocuments(docs.map(d => ({
              documentId: d.document_id,
              fileName: d.file_name,
              filePath: d.file_path,
              fileType: d.file_type,
              fileSizeBytes: d.file_size_in_bytes,
              uploadedAt: d.uploaded_at
            })));
          }
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [id, supabase])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#0F539C] mx-auto mb-3" />
        <p className="text-sm text-slate-500">Cargando expediente...</p>
      </div>
    </div>
  )

  if (!detail) return (
    <div className="text-center py-20">
      <p className="text-slate-500 dark:text-slate-400">No se encontró el expediente.</p>
      <Link to="/app/mis-solicitudes" className="text-[#0F539C] dark:text-blue-400 text-sm mt-2 inline-block hover:underline">
        ← Volver a mis solicitudes
      </Link>
    </div>
  )

  const statusCfg = STATUS_CONFIG[detail.statusId] || STATUS_CONFIG[1]
  const StatusIcon = statusCfg.icon
  const tabs = [
    { id: "establecimiento", label: "Establecimiento", icon: Building2 },
    { id: "propietario",     label: "Propietario",     icon: User },
    { id: "director",        label: "Dir. Técnico",    icon: GraduationCap },
    { id: "documentos",      label: "Documentos",      icon: FileText },
    { id: "observaciones",   label: "Observaciones",   icon: MessageSquare },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/app/mis-solicitudes")}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{detail.requestNumber}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{detail.requestType}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${statusCfg.color}`}>
          <StatusIcon className="h-4 w-4" />
          {statusCfg.label}
        </span>
      </div>

      {/* Alert: Observada */}
      {detail.statusId === 6 && detail.reviewerObservations && (
        <div className="flex gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-900 dark:text-orange-200">Tu solicitud tiene observaciones del Revisor Técnico</p>
            <p className="text-sm text-orange-800 dark:text-orange-300/80 mt-1">{detail.reviewerObservations}</p>
          </div>
        </div>
      )}

      {/* Alert: Rechazada */}
      {detail.statusId === 4 && detail.reviewerObservations && (
        <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900 dark:text-red-200">Tu solicitud fue rechazada</p>
            <p className="text-sm text-red-800 dark:text-red-300/80 mt-1">{detail.reviewerObservations}</p>
          </div>
        </div>
      )}

      {/* Alert: Aprobada */}
      {detail.statusId === 5 && (
        <div className="flex gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
          <Stamp className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">¡Constancia emitida! Tu solicitud fue aprobada por DIGEMAPS.</p>
            <p className="text-sm text-emerald-800 dark:text-emerald-300/80 mt-1">La constancia de registro está disponible. Conserva el número de expediente para tus registros.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-[#0F539C] text-[#0F539C] dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "establecimiento" && (
          <Section title="Datos del Establecimiento" icon={Building2}>
            <InfoRow label="Nombre Comercial"     value={detail.tradeName} />
            <InfoRow label="RNC"                  value={detail.rnc} />
            <InfoRow label="Categoría Permiso"    value={detail.permitCategory} />
            <InfoRow label="Forma Presentación"   value={detail.presentationForm} />
            <InfoRow label="Calle"                value={detail.estStreet} />
            <InfoRow label="Sector"               value={detail.estSector} />
            <InfoRow label="Ciudad"               value={detail.estCity} />
            <InfoRow label="Municipio"            value={detail.estMunicipality} />
            <InfoRow label="Dirección Referencia" value={detail.estLongAddress} />
            <InfoRow label="Teléfono Fijo"        value={detail.estPhoneFixed} />
            <InfoRow label="Teléfono Celular"     value={detail.estPhoneMobile} />
            <InfoRow label="Correo"               value={detail.estEmail} />
          </Section>
        )}

        {activeTab === "propietario" && (
          <Section title="Datos del Propietario / Representante Legal" icon={User}>
            <InfoRow label="Nombre"               value={`${detail.ownerFirstName || ""} ${detail.ownerLastName || ""}`} />
            <InfoRow label="Tipo Documento"       value={detail.ownerDocType} />
            <InfoRow label="Número Documento"     value={detail.ownerDocNum} />
            <InfoRow label="Correo"               value={detail.ownerEmail} />
            <InfoRow label="Teléfono Fijo"        value={detail.ownerPhoneFixed} />
            <InfoRow label="Teléfono Celular"     value={detail.ownerPhoneMobile} />
            <InfoRow label="Calle"                value={detail.ownerStreet} />
            <InfoRow label="Sector"               value={detail.ownerSector} />
            <InfoRow label="Ciudad"               value={detail.ownerCity} />
            <InfoRow label="Municipio"            value={detail.ownerMunicipality} />
          </Section>
        )}

        {activeTab === "director" && (
          <Section title="Datos del Director Técnico" icon={GraduationCap}>
            <InfoRow label="Nombre"               value={`${detail.dirFirstName || ""} ${detail.dirLastName || ""}`} />
            <InfoRow label="Tipo Documento"       value={detail.dirDocType} />
            <InfoRow label="Número Documento"     value={detail.dirDocNum} />
            <InfoRow label="Profesión"            value={detail.profession} />
            <InfoRow label="N° Exequátur"         value={detail.exequaturNumber} />
            <InfoRow label="Fecha Exequátur"      value={detail.exequaturDate ? new Date(detail.exequaturDate).toLocaleDateString("es-DO") : null} />
            <InfoRow label="Correo"               value={detail.dirEmail} />
            <InfoRow label="Teléfono Fijo"        value={detail.dirPhoneFixed} />
            <InfoRow label="Teléfono Celular"     value={detail.dirPhoneMobile} />
            <InfoRow label="Calle"                value={detail.dirStreet} />
            <InfoRow label="Sector"               value={detail.dirSector} />
            <InfoRow label="Ciudad"               value={detail.dirCity} />
            <InfoRow label="Municipio"            value={detail.dirMunicipality} />
          </Section>
        )}

        {activeTab === "documentos" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Documentos Adjuntos</h3>
            </div>
            <div className="p-5">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No hay documentos adjuntos en este expediente.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.documentId} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{doc.fileName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{doc.fileType} · {(doc.fileSizeBytes / 1024).toFixed(0)} KB · {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadFile(doc.filePath, doc.fileName)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title="Descargar archivo"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "observaciones" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Tus Observaciones
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 min-h-[80px]">
                {detail.applicantObservations || <span className="text-slate-400 dark:text-slate-500 italic">No añadiste observaciones.</span>}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-500" /> Observaciones del Revisor Técnico
              </h3>
              {detail.reviewerObservations ? (
                <p className={`text-sm rounded-lg p-4 ${
                  detail.statusId === 6 ? "bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50"
                  : detail.statusId === 4 ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50"
                  : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300"
                }`}>
                  {detail.reviewerObservations}
                </p>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  El revisor técnico aún no ha añadido observaciones.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Fecha de envío</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.submittedAt ? new Date(detail.submittedAt).toLocaleDateString("es-DO", { day:"2-digit", month:"long", year:"numeric" }) : "—"}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Última revisión</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.reviewedAt ? new Date(detail.reviewedAt).toLocaleDateString("es-DO", { day:"2-digit", month:"long", year:"numeric" }) : "Pendiente"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

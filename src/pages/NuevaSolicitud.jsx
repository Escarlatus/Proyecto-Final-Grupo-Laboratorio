import React, { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/react"
import { useSupabase } from "../hooks/useSupabase"
import { sanitizeForm, isValidEmail, isValidPhone } from "../lib/sanitize"
import { Stepper } from "../components/ui/Stepper"
import { Card, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { UploadCloud, FileText, X, CheckCircle, AlertCircle, ShieldCheck, Loader2 } from "lucide-react"

const STEPS = [
  { title: "Tipo" },
  { title: "Establecimiento" },
  { title: "Propietario" },
  { title: "Dir. Técnico" },
  { title: "Documentos" },
  { title: "Firma" }
]

export default function NuevaSolicitud() {
  const [currentStep, setCurrentStep] = useState(0)
  const [tipoTramite, setTipoTramite] = useState("apert")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [createdRequestId, setCreatedRequestId] = useState(null)
  const [signatureName, setSignatureName] = useState("")
  const [signatureDT, setSignatureDT] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [permitCategories, setPermitCategories] = useState([])
  const [presentationForms, setPresentationForms] = useState([])
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useUser()
  const supabase = useSupabase()

  const [formData, setFormData] = useState({
    estTradeName: "", estRNC: "", estStreetAddress: "", estSector: "", estCity: "", estMunicipality: "", estLongAddress: "", estPhoneFixed: "", estPhoneMobile: "", estEmail: "", estPermitCategoryId: null, estPresentationFormId: null,
    ownFirstName: "", ownLastName: "", ownEmail: "", ownDocumentType: "rnc", ownDocumentNumber: "", ownStreetAddress: "", ownSector: "", ownCity: "", ownMunicipality: "", ownLongAddress: "", ownPhoneFixed: "", ownPhoneMobile: "",
    dirFirstName: "", dirLastName: "", dirEmail: "", dirDocumentType: "cedula", dirDocumentNumber: "", dirProfession: "", dirExequaturNumber: "", dirExequaturDate: "", dirStreetAddress: "", dirSector: "", dirCity: "", dirMunicipality: "", dirLongAddress: "", dirPhoneFixed: "", dirPhoneMobile: "",
    applicantObservations: ""
  })

  // Load catalog options from Supabase on mount
  React.useEffect(() => {
    const loadCatalogs = async () => {
      const [{ data: cats }, { data: forms }] = await Promise.all([
        supabase.from("registry_permit_categories").select("category_id, category_name").order("category_id"),
        supabase.from("registry_presentation_forms").select("form_id, form_name").order("form_id")
      ])
      if (cats && cats.length > 0) {
        setPermitCategories(cats)
        setFormData(prev => ({ ...prev, estPermitCategoryId: cats[0].category_id }))
      }
      if (forms && forms.length > 0) {
        setPresentationForms(forms)
        setFormData(prev => ({ ...prev, estPresentationFormId: forms[0].form_id }))
      }
    }
    loadCatalogs()
  }, [supabase])

  const handleDocChange = (field, type, value) => {
    let val = value.replace(/\D/g, "");
    if (type === "cedula") {
      if (val.length > 11) val = val.slice(0, 11);
      if (val.length > 10) val = `${val.slice(0, 3)}-${val.slice(3, 10)}-${val.slice(10)}`;
      else if (val.length > 3) val = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (type === "rnc") {
      if (val.length > 9) val = val.slice(0, 9);
      if (val.length > 8) val = `${val.slice(0, 1)}-${val.slice(1, 3)}-${val.slice(3, 8)}-${val.slice(8)}`;
      else if (val.length > 3) val = `${val.slice(0, 1)}-${val.slice(1, 3)}-${val.slice(3)}`;
      else if (val.length > 1) val = `${val.slice(0, 1)}-${val.slice(1)}`;
    } else {
      val = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    }
    handleChange(field, val);
  };

  const handlePhoneChange = (field, value) => {
    let val = value.replace(/\D/g, "");
    if (val.length > 10) val = val.slice(0, 10);
    if (val.length > 6) val = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
    else if (val.length > 3) val = `${val.slice(0, 3)}-${val.slice(3)}`;
    handleChange(field, val);
  };

  const handleNext = () => {
    let isValid = true;
    let msg = "";
    if (currentStep === 1) {
      if (!formData.estTradeName || !formData.estRNC || !formData.estStreetAddress || !formData.estCity) {
        isValid = false; msg = "Por favor completa al menos el Nombre, RNC, Calle y Ciudad del Establecimiento.";
      }
    } else if (currentStep === 2) {
      if (!formData.ownFirstName || !formData.ownLastName || !formData.ownDocumentNumber) {
        isValid = false; msg = "Por favor completa los nombres y documento del Propietario.";
      }
    } else if (currentStep === 3) {
      if (!formData.dirFirstName || !formData.dirLastName || !formData.dirDocumentNumber || !formData.dirExequaturNumber) {
        isValid = false; msg = "Por favor completa al menos los nombres, documento y exequátur del Director Técnico.";
      }
    }
    if (!isValid) { alert(msg); return; }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  }
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const requiredOwnerName = `${formData.ownFirstName} ${formData.ownLastName}`.trim()
  const requiredDTName = `${formData.dirFirstName} ${formData.dirLastName}`.trim()
  const signaturesValid = signatureName === requiredOwnerName && signatureDT === requiredDTName && requiredOwnerName.length > 2

  // Handle file drop / selection
  const addFiles = (fileList) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 10 * 1024 * 1024
    const newFiles = Array.from(fileList).filter(f => {
      if (!allowed.includes(f.type)) { alert(`Formato no permitido: ${f.name}`); return false }
      if (f.size > maxSize) { alert(`${f.name} supera los 10MB`); return false }
      return true
    }).map(f => ({ file: f, name: f.name, size: f.size, uploaded: false, docId: null, error: null }))
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index))

  const uploadAllFiles = async (requestId) => {
    if (uploadedFiles.length === 0) return
    setUploading(true)

    for (let i = 0; i < uploadedFiles.length; i++) {
      const f = uploadedFiles[i]
      const storagePath = `${requestId}/${Date.now()}_${f.name}`

      try {
        // 1. Upload the physical file to Supabase Storage (bucket: "solicitudes")
        const { error: storageErr } = await supabase.storage
          .from("solicitudes")
          .upload(storagePath, f.file, {
            contentType: f.file.type || "application/octet-stream",
            upsert: false
          })

        if (storageErr) throw storageErr

        // 2. Insert metadata record into applications_documents
        await supabase.from("applications_documents").insert({
          request_id: requestId,
          file_name: f.name,
          file_path: storagePath,
          file_type: f.file.type || "application/octet-stream",
          file_size_in_bytes: f.size
        })

        // Mark file as uploaded in UI
        setUploadedFiles(prev => prev.map((item, idx) =>
          idx === i ? { ...item, uploaded: true, error: null } : item
        ))
      } catch (err) {
        // Mark file as failed but don't block the whole submission
        setUploadedFiles(prev => prev.map((item, idx) =>
          idx === i ? { ...item, uploaded: false, error: err.message } : item
        ))
      }
    }

    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!signaturesValid) {
      alert("Debes confirmar las firmas escribiendo los nombres completos del propietario y del Director Técnico antes de enviar.")
      return
    }
    setIsSubmitting(true)
    try {
      // --- SANITIZAR todos los campos de texto antes de guardar ---
      const safe = sanitizeForm(formData)
      const requestTypeIds = { apert: 1, tras: 2, renov: 3, cam_propietario: 4, cam_raz_social: 5, cam_actividad: 6, cam_nom: 7, nueva_area: 8 };
      
      // 1. Obtener mi ID de usuario
      const { data: dbUser } = await supabase.from("identity_users").select("user_id").eq("clerk_user_id", user.id).single();
      if (!dbUser) throw new Error("Usuario no sincronizado con base de datos.");

      // 2. Insertar Establecimiento
      const { data: estData, error: estErr } = await supabase.from("registry_establishments").insert({
        trade_name: safe.estTradeName, rnc: safe.estRNC, 
        street_address: safe.estStreetAddress, sector: safe.estSector,
        city: safe.estCity, municipality: safe.estMunicipality,
        long_address: safe.estLongAddress, phone_fixed: safe.estPhoneFixed,
        phone_mobile: safe.estPhoneMobile, email: safe.estEmail,
        permit_category_id: formData.estPermitCategoryId, presentation_form_id: formData.estPresentationFormId
      }).select("establishment_id").single();
      if (estErr) throw estErr;

      // 3. Insertar Propietario
      const { data: ownData, error: ownErr } = await supabase.from("registry_owners").insert({
        first_name: safe.ownFirstName, last_name: safe.ownLastName,
        document_type: safe.ownDocumentType, document_number: safe.ownDocumentNumber,
        email: safe.ownEmail, phone_fixed: safe.ownPhoneFixed, phone_mobile: safe.ownPhoneMobile,
        street_address: safe.ownStreetAddress, sector: safe.ownSector,
        city: safe.ownCity, municipality: safe.ownMunicipality
      }).select("owner_id").single();
      if (ownErr) throw ownErr;

      // 4. Insertar Director Tecnico
      const { data: dirData, error: dirErr } = await supabase.from("registry_technical_directors").insert({
        first_name: safe.dirFirstName, last_name: safe.dirLastName,
        profession: safe.dirProfession, document_type: safe.dirDocumentType,
        document_number: safe.dirDocumentNumber, exequatur_number: safe.dirExequaturNumber,
        exequatur_date: formData.dirExequaturDate ? new Date(formData.dirExequaturDate).toISOString() : null,
        email: safe.dirEmail, phone_fixed: safe.dirPhoneFixed, phone_mobile: safe.dirPhoneMobile,
        street_address: safe.dirStreetAddress, sector: safe.dirSector, city: safe.dirCity
      }).select("director_id").single();
      if (dirErr) throw dirErr;

      // 5. Insertar Solicitud
      const requestNumber = "REQ-" + Math.floor(100000 + Math.random() * 900000);
      const { data: reqData, error: reqErr } = await supabase.from("applications_requests").insert({
        request_number: requestNumber,
        applicant_user_id: dbUser.user_id,
        request_type_id: requestTypeIds[tipoTramite] || 1,
        establishment_id: estData.establishment_id,
        owner_id: ownData.owner_id,
        director_id: dirData.director_id,
        status_id: 1, // Borrador
        applicant_observations: formData.applicantObservations
      }).select("request_id").single();
      if (reqErr) throw reqErr;

      const newId = reqData.request_id;
      setCreatedRequestId(newId)
      
      if (uploadedFiles.length > 0) await uploadAllFiles(newId)
      
      alert("¡Solicitud enviada correctamente! El expediente ha sido registrado en el sistema con código " + requestNumber)
      navigate("/app")
    } catch (e) {
      alert("Error en el sistema al guardar: " + e.message)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Nueva Solicitud</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Completa el formulario FO-UBP-09 digitalizado.</p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <Card className="shadow-md border-0 ring-1 ring-slate-200 dark:ring-slate-800 dark:bg-slate-900">
        <CardContent className="p-6 sm:p-10">
          
          {/* STEP 0: Tipo de Solicitud */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tipo de Solicitud</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select 
                  label="Seleccione el tipo de trámite"
                  value={tipoTramite}
                  onChange={(e) => setTipoTramite(e.target.value)}
                  options={[
                    { value: "apert", label: "Apertura" },
                    { value: "tras", label: "Traslado" },
                    { value: "renov", label: "Renovación" },
                    { value: "cam_propietario", label: "Cambio de propietario" },
                    { value: "cam_raz_social", label: "Cambio de razón social" },
                    { value: "cam_actividad", label: "Cambio de actividad" },
                    { value: "cam_nom", label: "Cambio de nombre comercial" },
                    { value: "nueva_area", label: "Nueva área de fabricación" },
                  ]}
                />
              </div>
            </div>
          )}

          {/* STEP 1: Datos del Establecimiento */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Datos del Establecimiento</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input label="Nombre comercial" placeholder="Ej. Laboratorio MK" value={formData.estTradeName} onChange={e => handleChange("estTradeName", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="RNC" placeholder="1-30-12345-6" value={formData.estRNC} onChange={e => handleDocChange("estRNC", "rnc", e.target.value)} />
                </div>
                
                <Input label="Calle" placeholder="Nombre de la calle" value={formData.estStreetAddress} onChange={e => handleChange("estStreetAddress", e.target.value)} />
                <Input label="Sector" placeholder="Sector o barrio" value={formData.estSector} onChange={e => handleChange("estSector", e.target.value)} />
                <Input label="Ciudad" placeholder="Ciudad" value={formData.estCity} onChange={e => handleChange("estCity", e.target.value)} />
                <Input label="Municipio" placeholder="Municipio" value={formData.estMunicipality} onChange={e => handleChange("estMunicipality", e.target.value)} />
                <div className="md:col-span-4">
                  <Input label="Dirección larga (Referencia)" placeholder="Torre X, Local 5, Frente al parque..." value={formData.estLongAddress} onChange={e => handleChange("estLongAddress", e.target.value)} />
                </div>
                
                <div className="md:col-span-2">
                  <Input label="Teléfono Fijo" placeholder="809-XXX-XXXX" value={formData.estPhoneFixed} onChange={e => handlePhoneChange("estPhoneFixed", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Celular" placeholder="809-XXX-XXXX" value={formData.estPhoneMobile} onChange={e => handlePhoneChange("estPhoneMobile", e.target.value)} />
                </div>
                
                <div className="md:col-span-4">
                  <Input label="Correo electrónico" type="email" placeholder="lab@ejemplo.com" value={formData.estEmail} onChange={e => handleChange("estEmail", e.target.value)} />
                </div>
                
                <div className="md:col-span-2">
                   <Select 
                    label="Categoría del permiso de Habilitación:"
                    value={formData.estPermitCategoryId ?? ""}
                    onChange={e => handleChange("estPermitCategoryId", parseInt(e.target.value))}
                    options={permitCategories.map(c => ({ value: c.category_id, label: c.category_name }))}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Select 
                    label="Forma de presentación del producto a elaborar:"
                    value={formData.estPresentationFormId ?? ""}
                    onChange={e => handleChange("estPresentationFormId", parseInt(e.target.value))}
                    options={presentationForms.map(f => ({ value: f.form_id, label: f.form_name }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Propietario */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900">Datos del Propietario</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input label="Nombres" value={formData.ownFirstName} onChange={e => handleChange("ownFirstName", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Apellidos" value={formData.ownLastName} onChange={e => handleChange("ownLastName", e.target.value)} />
                </div>
                
                <Select 
                  label="Tipo de Documento"
                  value={formData.ownDocumentType}
                  onChange={e => {
                    handleChange("ownDocumentType", e.target.value);
                    handleChange("ownDocumentNumber", "");
                  }}
                  options={[
                    { value: "rnc", label: "RNC" },
                    { value: "cedula", label: "Cédula" },
                    { value: "pasaporte", label: "Pasaporte" }
                  ]}
                />
                <Input label="Número de documento" placeholder={formData.ownDocumentType === 'cedula' ? '001-XXXXXXX-X' : formData.ownDocumentType === 'rnc' ? '1-30-12345-6' : 'A000000'} value={formData.ownDocumentNumber} onChange={e => handleDocChange("ownDocumentNumber", formData.ownDocumentType, e.target.value)} />
                
                <Input label="Calle" value={formData.ownStreetAddress} onChange={e => handleChange("ownStreetAddress", e.target.value)} />
                <Input label="Sector" value={formData.ownSector} onChange={e => handleChange("ownSector", e.target.value)} />
                <Input label="Ciudad" value={formData.ownCity} onChange={e => handleChange("ownCity", e.target.value)} />
                <Input label="Municipio" value={formData.ownMunicipality} onChange={e => handleChange("ownMunicipality", e.target.value)} />
                <div className="md:col-span-4">
                  <Input label="Dirección larga (Referencia)" value={formData.ownLongAddress} onChange={e => handleChange("ownLongAddress", e.target.value)} />
                </div>
                
                <div className="md:col-span-2">
                  <Input label="Teléfono Fijo" placeholder="809-XXX-XXXX" value={formData.ownPhoneFixed} onChange={e => handlePhoneChange("ownPhoneFixed", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Celular" placeholder="829-XXX-XXXX" value={formData.ownPhoneMobile} onChange={e => handlePhoneChange("ownPhoneMobile", e.target.value)} />
                </div>
                
                <div className="md:col-span-4">
                  <Input label="Correo electrónico" type="email" value={formData.ownEmail} onChange={e => handleChange("ownEmail", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Director Técnico */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Datos del Director Técnico</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input label="Nombres" value={formData.dirFirstName} onChange={e => handleChange("dirFirstName", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Apellidos" value={formData.dirLastName} onChange={e => handleChange("dirLastName", e.target.value)} />
                </div>
                
                <Select 
                  label="Tipo de Documento"
                  value={formData.dirDocumentType}
                  onChange={e => {
                    handleChange("dirDocumentType", e.target.value);
                    handleChange("dirDocumentNumber", "");
                  }}
                  options={[
                    { value: "cedula", label: "Cédula" },
                    { value: "pasaporte", label: "Pasaporte" }
                  ]}
                />
                <Input label="Número de documento" placeholder={formData.dirDocumentType === 'cedula' ? '001-XXXXXXX-X' : 'A0000000'} value={formData.dirDocumentNumber} onChange={e => handleDocChange("dirDocumentNumber", formData.dirDocumentType, e.target.value)} />
                <div className="md:col-span-1">
                  <Input label="Profesión" value={formData.dirProfession} onChange={e => handleChange("dirProfession", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Número de exequátur" value={formData.dirExequaturNumber} onChange={e => handleChange("dirExequaturNumber", e.target.value)} />
                </div>
                <div className="md:col-span-1">
                  <Input label="Fecha de expedición" type="date" value={formData.dirExequaturDate} onChange={e => handleChange("dirExequaturDate", e.target.value)} />
                </div>
                
                <Input label="Calle" value={formData.dirStreetAddress} onChange={e => handleChange("dirStreetAddress", e.target.value)} />
                <Input label="Sector" value={formData.dirSector} onChange={e => handleChange("dirSector", e.target.value)} />
                <Input label="Ciudad" value={formData.dirCity} onChange={e => handleChange("dirCity", e.target.value)} />
                <Input label="Municipio" value={formData.dirMunicipality} onChange={e => handleChange("dirMunicipality", e.target.value)} />
                <div className="md:col-span-4">
                  <Input label="Dirección larga (Referencia)" value={formData.dirLongAddress} onChange={e => handleChange("dirLongAddress", e.target.value)} />
                </div>
                
                <div className="md:col-span-2">
                  <Input label="Teléfono Fijo" placeholder="809-XXX-XXXX" value={formData.dirPhoneFixed} onChange={e => handlePhoneChange("dirPhoneFixed", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Celular" placeholder="829-XXX-XXXX" value={formData.dirPhoneMobile} onChange={e => handlePhoneChange("dirPhoneMobile", e.target.value)} />
                </div>
                
                <div className="md:col-span-4">
                  <Input label="Correo de contacto" type="email" value={formData.dirEmail} onChange={e => handleChange("dirEmail", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Fijo de contacto" value={formData.dirPhoneFixed} onChange={e => handleChange("dirPhoneFixed", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Celular de contacto" value={formData.dirPhoneMobile} onChange={e => handleChange("dirPhoneMobile", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Documentos */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Documentos Adjuntos</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sube los documentos requeridos. Formatos aceptados: PDF, JPG, PNG, DOC. Máximo 10MB por archivo.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lista de documentos requeridos */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">Documentos Requeridos</h3>
                  <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                    {(() => {
                      const allDocs = {
                        rnc: "Copia del RNC del establecimiento",
                        onapi: "Copia del certificado de nombre comercial (ONAPI)",
                        cedula_prop: "Copia de la cédula del propietario/representante",
                        titulo_dt: "Copia del título profesional del Director Técnico",
                        exequatur_dt: "Copia del Exequátur del Director Técnico",
                        especialidad: "Título de especialidad (si aplica)",
                        planos: "Plano arquitectónico del establecimiento"
                      }
                      const docsMap = {
                        apert: [allDocs.rnc, allDocs.onapi, allDocs.cedula_prop, allDocs.titulo_dt, allDocs.exequatur_dt, allDocs.especialidad, allDocs.planos],
                        nueva_area: [allDocs.rnc, allDocs.onapi, allDocs.cedula_prop, allDocs.titulo_dt, allDocs.exequatur_dt, allDocs.especialidad, allDocs.planos],
                        tras: [allDocs.rnc, allDocs.onapi, allDocs.cedula_prop, allDocs.titulo_dt, allDocs.exequatur_dt, allDocs.especialidad, allDocs.planos],
                        renov: [allDocs.rnc, allDocs.onapi, allDocs.cedula_prop, allDocs.titulo_dt, allDocs.exequatur_dt, allDocs.especialidad],
                        cam_propietario: [allDocs.rnc, allDocs.onapi, allDocs.cedula_prop],
                        cam_actividad: [allDocs.rnc, allDocs.onapi, allDocs.titulo_dt, allDocs.exequatur_dt],
                      }
                      const docs = docsMap[tipoTramite] || [allDocs.rnc, allDocs.onapi]
                      return docs.map((doc, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0 mt-0.5" />
                          <span>{doc} {!doc.includes("aplica") && <span className="text-red-500 ml-0.5">*</span>}</span>
                        </div>
                      ))
                    })()}
                  </div>
                </div>

                {/* Dropzone */}
                <div className="space-y-3">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">Cargar Archivos</h3>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      isDragging ? "border-[#0F539C] bg-blue-50 dark:bg-[#0F539C]/10" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
                  >
                    <UploadCloud className={`mx-auto h-10 w-10 mb-3 ${isDragging ? "text-[#0F539C]" : "text-slate-400"}`} />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Arrastra archivos o haz clic para seleccionar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, JPG, PNG, DOC — máx. 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      onChange={e => { addFiles(e.target.files); e.target.value = '' }}
                    />
                  </div>

                  {/* File list */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                          f.uploaded ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className={`h-5 w-5 shrink-0 ${f.uploaded ? "text-emerald-600 dark:text-emerald-400" : "text-blue-500"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{f.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{(f.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {f.uploaded ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Firma y Observaciones */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confirmación y Firma Electrónica</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">Observaciones del Solicitante (Opcional)</label>
                <textarea
                  value={formData.applicantObservations}
                  onChange={e => handleChange("applicantObservations", e.target.value)}
                  className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-20 resize-none"
                  placeholder="Añada cualquier información relevante para el evaluador técnico..."
                />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#0F539C] dark:text-[#9FD0FD] mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Declaración Jurada y Firma Electrónica</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Para confirmar la declaración jurada, escriba el nombre completo exacto del Propietario y del Director Técnico.
                      Al firmar, ambas partes declaran bajo juramento que toda la información aportada es verídica y verificable según las regulaciones del MSP y DIGEMAPS.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Firma del Solicitante / Propietario</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Escriba exactamente: <strong className="dark:text-slate-200">{formData.ownFirstName} {formData.ownLastName}</strong></p>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={e => setSignatureName(e.target.value)}
                      placeholder="Nombre completo del propietario"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all dark:bg-slate-900 dark:text-white ${
                        signatureName === requiredOwnerName && requiredOwnerName.length > 2
                          ? "border-emerald-400 ring-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800"
                          : "border-slate-200 dark:border-slate-700 focus:ring-[#0F539C]"
                      }`}
                    />
                    {signatureName === requiredOwnerName && requiredOwnerName.length > 2 && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Firma del propietario confirmada</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Firma del Director Técnico</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Escriba exactamente: <strong className="dark:text-slate-200">{formData.dirFirstName} {formData.dirLastName}</strong></p>
                    <input
                      type="text"
                      value={signatureDT}
                      onChange={e => setSignatureDT(e.target.value)}
                      placeholder="Nombre completo del Director Técnico"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all dark:bg-slate-900 dark:text-white ${
                        signatureDT === requiredDTName && requiredDTName.length > 2
                          ? "border-emerald-400 ring-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800"
                          : "border-slate-200 dark:border-slate-700 focus:ring-[#0F539C]"
                      }`}
                    />
                    {signatureDT === requiredDTName && requiredDTName.length > 2 && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Firma del Director Técnico confirmada</p>
                    )}
                  </div>
                </div>

                {!signaturesValid && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Ambas firmas deben coincidir exactamente con los nombres registrados para poder enviar la solicitud.
                  </div>
                )}
                {signaturesValid && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    Ambas firmas electrónicas confirmadas. La solicitud está lista para enviarse.
                  </div>
                )}
              </div>
            </div>
          )}

        </CardContent>

        {/* Action Bar */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handlePrev} 
            disabled={currentStep === 0 || isSubmitting}
          >
            Atrás
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting || !signaturesValid}>
              {isSubmitting ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</span>
              ) : "Firmar y Enviar"}
            </Button>
          ) : (
            <Button onClick={handleNext}>Continuar</Button>
          )}
        </div>
      </Card>
    </div>
  )
}

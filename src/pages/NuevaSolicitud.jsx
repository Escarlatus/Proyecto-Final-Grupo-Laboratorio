import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Stepper } from "../components/ui/Stepper"
import { Card, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Badge } from "../components/ui/Badge"
import { UploadCloud, File, AlertCircle, Check } from "lucide-react"

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
  const navigate = useNavigate()

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      navigate("/app")
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Nueva Solicitud</h1>
        <p className="text-slate-500 mt-1">Completa el formulario FO-UBP-09 digitalizado.</p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <Card className="shadow-md border-0 ring-1 ring-slate-200">
        <CardContent className="p-6 sm:p-10">
          
          {/* STEP 0: Tipo de Solicitud */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900">Tipo de Solicitud</h2>
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
              <h2 className="text-xl font-bold text-slate-900">Datos del Establecimiento</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input label="Nombre comercial" placeholder="Ej. Laboratorio MK" />
                </div>
                <div className="md:col-span-2">
                  <Input label="RNC" placeholder="123456789" />
                </div>
                
                <Input label="Calle" placeholder="Nombre de la calle" />
                <Input label="Sector" placeholder="Sector o barrio" />
                <Input label="Ciudad" placeholder="Ciudad" />
                <Input label="Municipio" placeholder="Municipio" />
                <div className="md:col-span-4">
                  <Input label="Dirección larga (Referencia)" placeholder="Torre X, Local 5, Frente al parque..." />
                </div>
                
                <div className="md:col-span-2">
                  <Input label="Teléfono Fijo" placeholder="809-XXX-XXXX" />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Celular" placeholder="809-XXX-XXXX" />
                </div>
                
                <div className="md:col-span-4">
                  <Input label="Correo electrónico" type="email" placeholder="lab@ejemplo.com" />
                </div>
                
                <div className="md:col-span-2">
                  <Select 
                    label="Categoría del permiso de Habilitación:"
                    options={[
                      { value: "fab_med", label: "Fabricante de Medicamentos" },
                      { value: "prod_nat", label: "Productos Naturales" },
                      { value: "prod_san", label: "Productos Sanitarios" },
                      { value: "fab_cos", label: "Fabricante de Cosméticos" },
                      { value: "hig_per", label: "Higiene personal" },
                      { value: "hig_hog", label: "Higiene del Hogar" },
                      { value: "cen_nut", label: "Centro Prep. Mezclas Nutrición Parenteral" },
                      { value: "aco_1rio", label: "Acondicionador 1rio de Medicamentos" },
                      { value: "fab_bio", label: "Fabricante de biológicos" },
                      { value: "fab_mat", label: "Fabricante de Materia Prima" },
                    ]}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Select 
                    label="Forma de presentación del producto a elaborar:"
                    options={[
                      { value: "sol", label: "Sólidos" },
                      { value: "semi", label: "Semisólidos" },
                      { value: "liqi", label: "Líquidos" },
                      { value: "liq_oral", label: "Líquidos orales" },
                      { value: "est_inyect", label: "Estériles Inyectables/Parenterales" },
                      { value: "est_no_inyect", label: "Estériles no Inyectables" },
                    ]}
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
                  <Input label="Nombre o representante legal" />
                </div>
                
                <Select 
                  label="Tipo de Documento"
                  options={[
                    { value: "rnc", label: "RNC" },
                    { value: "cedula", label: "Cédula" },
                  ]}
                />
                <Input label="Número de documento" placeholder="Ej. 402XXXXXXX" />
                
                <Input label="Calle" />
                <Input label="Sector" />
                <Input label="Ciudad" />
                <Input label="Municipio" />
                <div className="md:col-span-4">
                  <Input label="Dirección larga (Referencia)" />
                </div>
                
                <div className="md:col-span-2">
                  <Input label="Teléfono Fijo" />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Celular" />
                </div>
                
                <div className="md:col-span-4">
                  <Input label="Correo electrónico" type="email" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Director Técnico */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900">Datos del Director Técnico</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input label="Nombre completo" />
                </div>
                <div className="md:col-span-2">
                  <Input label="Profesión" />
                </div>
                <div className="md:col-span-2">
                  <Input label="Número de exequátur" />
                </div>
                <div className="md:col-span-2">
                  <Input label="Fecha de expedición de exequátur" type="date" />
                </div>
                
                <Input label="Calle" />
                <Input label="Sector" />
                <Input label="Ciudad" />
                <Input label="Municipio" />
                <div className="md:col-span-4">
                  <Input label="Dirección larga (Referencia)" />
                </div>
                
                <div className="md:col-span-4">
                  <Input label="Correo de contacto" type="email" />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Fijo de contacto" />
                </div>
                <div className="md:col-span-2">
                  <Input label="Teléfono Celular de contacto" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Documentos */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900">Documentos Adjuntos</h2>
              <p className="text-sm text-slate-500 pb-2">Archivos válidos: PDF (Máx 5MB). Verifique subir los requeridos por la norma.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document List */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900 text-sm">Documentos Requeridos</h3>
                  <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                    {(() => {
                      const allDocs = {
                        rnc: "Copia del RNC del establecimiento",
                        onapi: "Copia del certificado de nombre comercial (ONAPI)",
                        cedula_prop: "Copia de la cédula de identidad del propietario/representante legal",
                        titulo_dt: "Copia del título profesional/diploma del Director Técnico",
                        exequatur_dt: "Copia del Exequátur del Director Técnico",
                        especialidad: "Copia del título de especialidad (si aplica)",
                        planos: "Plano arquitectónico del establecimiento"
                      };
                      
                      let docs = [];
                      switch (tipoTramite) {
                        case "apert":
                        case "nueva_area":
                        case "tras":
                          docs = [allDocs.rnc, allDocs.onapi, allDocs.cedula_prop, allDocs.titulo_dt, allDocs.exequatur_dt, allDocs.especialidad, allDocs.planos]; break;
                        case "renov":
                          docs = [allDocs.rnc, allDocs.onapi, allDocs.cedula_prop, allDocs.titulo_dt, allDocs.exequatur_dt, allDocs.especialidad]; break;
                        case "cam_propietario":
                          docs = [allDocs.rnc, allDocs.onapi, allDocs.cedula_prop]; break;
                        case "cam_actividad":
                          docs = [allDocs.rnc, allDocs.onapi, allDocs.titulo_dt, allDocs.exequatur_dt]; break;
                        default:
                          docs = [allDocs.rnc, allDocs.onapi]; break;
                      }

                      return docs.map((doc, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-snug">
                          <div className="h-5 w-5 rounded-full border border-slate-300 bg-white shrink-0 mt-0.5"></div>
                          <span className={doc.includes("(si aplica)") ? "text-slate-500" : ""}>
                            {doc} {doc.includes("(si aplica)") ? "" : <span className="text-red-500">*</span>}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Upload Zone */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-white hover:bg-slate-50 transition-colors flex flex-col items-center justify-center h-full min-h-[200px]">
                  <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-sm font-semibold text-slate-900">Haz clic aquí para cargar</h3>
                  <p className="text-xs text-slate-500 mt-1">Sube el documento remanente</p>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {/* Mock Uploaded file */}
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                      <File className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">copia_rnc.pdf</p>
                      <p className="text-xs text-slate-500">1.2 MB</p>
                    </div>
                  </div>
                  <Badge variant="aprobada">Subido y validado</Badge>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Firma y Observaciones */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <h2 className="text-xl font-bold text-slate-900">Confirmación y Firma</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Observaciones del Solicitante (Opcional)</label>
                <textarea 
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-20 resize-none"
                  placeholder="Añada cualquier información relevante para el evaluador técnico..."
                />
              </div>

              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 mt-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Autorización Electrónica Conjunta
                  </h3>
                  <p className="text-sm text-slate-600">
                    Al firmar, ambas partes declaran bajo juramento que toda la información aportada es verídica y verificable según las regulaciones operativas del MSP y DIGEMAPS.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-900">Firma del Solicitante / Propietario</h4>
                    <Input type="password" placeholder="Contraseña de firma digital" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-900">Firma del Director Técnico</h4>
                    <Input type="password" placeholder="Contraseña de firma digital" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </CardContent>

        {/* Action Bar */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handlePrev} 
            disabled={currentStep === 0 || isSubmitting}
          >
            Atrás
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Firmar y Enviar"}
            </Button>
          ) : (
            <Button onClick={handleNext}>Continuar</Button>
          )}
        </div>
      </Card>
    </div>
  )
}

import React, { useState } from "react"
import { User, CreditCard } from "lucide-react"
import { useSupabase } from "../hooks/useSupabase"

export default function CompletarPerfilModal({ clerkUserId, defaultFirstName = "", defaultLastName = "", defaultEmail = "", onComplete }) {
  const supabase = useSupabase()
  const [form, setForm] = useState({
    firstName: defaultFirstName, lastName: defaultLastName,
    documentType: "cedula", documentNumber: "",
    phoneFixed: "", phoneMobile: "", streetAddress: "", sector: "", city: "", municipality: ""
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const handleDocumentChange = (e) => {
    let val = e.target.value;
    if (form.documentType === "cedula") {
      val = val.replace(/\D/g, "");
      if (val.length > 11) val = val.slice(0, 11);
      if (val.length > 10) val = `${val.slice(0, 3)}-${val.slice(3, 10)}-${val.slice(10)}`;
      else if (val.length > 3) val = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (form.documentType === "rnc") {
      val = val.replace(/\D/g, "");
      if (val.length > 9) val = val.slice(0, 9);
      if (val.length > 8) val = `${val.slice(0, 1)}-${val.slice(1, 3)}-${val.slice(3, 8)}-${val.slice(8)}`;
      else if (val.length > 3) val = `${val.slice(0, 1)}-${val.slice(1, 3)}-${val.slice(3)}`;
      else if (val.length > 1) val = `${val.slice(0, 1)}-${val.slice(1)}`;
    } else {
      val = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    }
    set("documentNumber", val);
  };

  const handlePhoneChange = (field) => (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.slice(0, 10);
    if (val.length > 6) val = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
    else if (val.length > 3) val = `${val.slice(0, 3)}-${val.slice(3)}`;
    set(field, val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.documentNumber) {
      setError("Los campos marcados con * son obligatorios.")
      return
    }
    setSaving(true)
    setError("")

    try {
      // 1. Conseguir el person_id
      const { data: userData, error: userError } = await supabase
        .from("identity_users")
        .select("person_id")
        .eq("clerk_user_id", clerkUserId)
        .single();
        
      if (userError || !userData) {
        setError("Error de sincronización con tu cuenta principal.")
        setSaving(false)
        return
      }

      // 2. Actualizar identity_persons
      const { error: updateError } = await supabase
        .from("identity_persons")
        .update({
          first_name: form.firstName,
          last_name: form.lastName,
          document_type: form.documentType,
          document_number: form.documentNumber,
          phone_mobile: form.phoneMobile,
          phone_fixed: form.phoneFixed
        })
        .eq("person_id", userData.person_id);

      if (updateError) {
        setError("Error al guardar datos. Revisa los campos.")
      } else {
        onComplete()
      }
    } catch {
      setError("No se pudo conectar con el servidor.")
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#002D62] to-[#0F539C] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Completa tu Perfil</h2>
              <p className="text-blue-200 text-sm">Necesitamos tus datos para registrar solicitudes correctamente.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Names — pre-filled from Clerk if available */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nombres * {defaultFirstName && <span className="text-emerald-600 font-normal normal-case">(desde Clerk)</span>}
              </label>
              <input value={form.firstName} onChange={e => set("firstName", e.target.value)}
                placeholder="Ej. Carlos Miguel"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F539C] ${
                  defaultFirstName ? "border-emerald-300 bg-emerald-50" : "border-slate-200"
                }`} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Apellidos * {defaultLastName && <span className="text-emerald-600 font-normal normal-case">(desde Clerk)</span>}
              </label>
              <input value={form.lastName} onChange={e => set("lastName", e.target.value)}
                placeholder="Ej. Peña Ramírez"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F539C] ${
                  defaultLastName ? "border-emerald-300 bg-emerald-50" : "border-slate-200"
                }`} />
            </div>
          </div>

          {/* Documento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tipo de Documento *</label>
              <select value={form.documentType} onChange={e => {
                  set("documentType", e.target.value);
                  set("documentNumber", ""); // Limpiar formato al cambiar
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F539C]">
                <option value="cedula">Cédula de Identidad</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="rnc">RNC</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Número de Documento *</label>
              <input value={form.documentNumber} onChange={handleDocumentChange}
                placeholder={form.documentType === "cedula" ? "001-XXXXXXX-X" : form.documentType === "rnc" ? "1-30-12345-6" : "A0000000"}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F539C]" />
            </div>
          </div>

          {/* Teléfonos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Teléfono Fijo <span className="text-slate-400 font-normal normal-case">(opcional)</span></label>
              <input value={form.phoneFixed} onChange={handlePhoneChange("phoneFixed")}
                placeholder="809-XXX-XXXX"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F539C]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Teléfono Móvil</label>
              <input value={form.phoneMobile} onChange={handlePhoneChange("phoneMobile")}
                placeholder="829-XXX-XXXX"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F539C]" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-[#0F539C] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0d4a8a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? (
              <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando...</>
            ) : (
              <><User className="h-4 w-4" />Guardar y Continuar</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

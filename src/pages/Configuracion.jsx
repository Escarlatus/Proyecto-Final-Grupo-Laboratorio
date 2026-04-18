import React, { useState } from "react"
import { Card, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Badge } from "../components/ui/Badge"
import { useSupabase } from "../hooks/useSupabase"
import { Users, Database, Shield, MoreVertical, Plus, Search, Edit2, Trash2, X, CheckCircle2 } from "lucide-react"

export default function Configuracion() {
  const supabase = useSupabase()
  const [activeTab, setActiveTab] = useState("usuarios")
  
  // -- ESTADO: GESTIÓN DE USUARIOS --
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [usersDb, setUsersDb] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  const [requestTypes, setRequestTypes] = useState([])
  const [permitCategories, setPermitCategories] = useState([])
  const [presentationForms, setPresentationForms] = useState([])

  // -- ESTADO: CATÁLOGOS --
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [catalogContext, setCatalogContext] = useState({ type: null, label: "" })
  const [catalogItem, setCatalogItem] = useState({ id: null, name: "" })
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)

  // -- ESTADO: SEGURIDAD --
  const [twoFAEnabled, setTwoFAEnabled] = useState(true)
  const [concurrentSessions, setConcurrentSessions] = useState(false)
  const [inactivityTime, setInactivityTime] = useState("30")
  const [isSavingSecurity, setIsSavingSecurity] = useState(false)

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase
          .from("identity_users")
          .select(`
            clerk_user_id,
            role_id,
            identity_roles(role_name),
            identity_persons(first_name, last_name, email, document_number)
          `);
        
        if (data) {
          const mapped = data.map(u => ({
            id: u.clerk_user_id,
            firstName: u.identity_persons?.first_name || "",
            lastName: u.identity_persons?.last_name || "",
            email: u.identity_persons?.email || "",
            documentNumber: u.identity_persons?.document_number || "",
            rol: u.identity_roles?.role_name || "Solicitante"
          }));
          setUsersDb(mapped)
        }
      } catch (err) { console.error("Error usuarios:", err) } 
      finally { setIsLoadingUsers(false) }
    }

    const fetchCatalogs = async () => {
      try {
        const [{ data: reqTypes }, { data: permCats }, { data: presForms }] = await Promise.all([
          supabase.from("applications_request_types").select("*"),
          supabase.from("registry_permit_categories").select("*"),
          supabase.from("registry_presentation_forms").select("*")
        ])
        
        if (reqTypes) setRequestTypes(reqTypes.map(rt => ({ id: rt.request_type_id, name: rt.type_name })));
        if (permCats) setPermitCategories(permCats.map(pc => ({ id: pc.category_id, name: pc.category_name })));
        if (presForms) setPresentationForms(presForms.map(pf => ({ id: pf.form_id, name: pf.form_name })));
      } catch (err) { console.error("Error catálogos:", err) }
    }

    const fetchSecurity = async () => {
      // Configuraciones de seguridad hardcoded temporalmente hasta que se migre sys_security_settings si existe
      setTwoFAEnabled(true)
      setConcurrentSessions(false)
      setInactivityTime("30")
    }

    fetchUsers()
    fetchCatalogs()
    fetchSecurity()
  }, [supabase])

  const openRoleModal = (user) => {
    setUserToEdit(user)
    setSelectedRole(user.rol)
    setIsRoleModalOpen(true)
  }

  const handleSaveRole = async () => {
    setIsLoading(true)
    
    const roleMap = {
      "Solicitante": 1,
      "Revisor Técnico": 2,
      "Administrador del Sistema": 3,
      "Receptor VUS": 4
    }

    try {
      const { error } = await supabase
        .from("identity_users")
        .update({ role_id: roleMap[selectedRole] })
        .eq("clerk_user_id", userToEdit.id);

      if (!error) {
        setUsersDb(prev => prev.map(u => u.id === userToEdit.id ? { ...u, rol: selectedRole } : u))
        alert("Privilegio actualizado en Supabase exitosamente.")
      } else {
        alert("Error devuelto por Supabase: " + error.message)
      }
    } catch (error) {
      alert("Error de Conexión: " + error.message)
    } finally {
      setIsLoading(false)
      setIsRoleModalOpen(false)
      setUserToEdit(null)
    }
  }

  // --- HANDLERS: CATÁLOGOS ---
  const openNewCatalogModal = (type, label) => {
    setCatalogContext({ type, label })
    setCatalogItem({ id: null, name: "" })
    setIsCatalogModalOpen(true)
  }

  const openEditCatalogModal = (type, label, item) => {
    setCatalogContext({ type, label })
    setCatalogItem({ id: item.id, name: item.name })
    setIsCatalogModalOpen(true)
  }

  const handleSaveCatalog = async () => {
    setIsLoadingCatalog(true)
    try {
      const isNew = catalogItem.id === null;
      let tableName = "";
      let idColumn = "";
      let nameColumn = "";

      if (catalogContext.type === 'requestTypes') {
        tableName = "applications_request_types";
        idColumn = "request_type_id";
        nameColumn = "type_name";
      } else if (catalogContext.type === 'permitCategories') {
        tableName = "registry_permit_categories";
        idColumn = "permit_category_id";
        nameColumn = "category_name";
      } else if (catalogContext.type === 'presentationForms') {
        tableName = "applications_presentation_forms";
        idColumn = "presentation_form_id";
        nameColumn = "form_name";
      }

      if (isNew) {
        await supabase.from(tableName).insert({ [nameColumn]: catalogItem.name });
      } else {
        await supabase.from(tableName).update({ [nameColumn]: catalogItem.name }).eq(idColumn, catalogItem.id);
      }

      // Refresh data (lazy way: reload window or just re-fetch)
      window.location.reload(); 
      setIsCatalogModalOpen(false);
    } catch (error) {
      alert("Error de conexión: " + error.message);
    } finally {
      setIsLoadingCatalog(false);
    }
  }

  const handleDeleteCatalog = async (type, id) => {
    if (!window.confirm("¿Está seguro de eliminar este elemento?")) return;
    
    let tableName = "";
    let idColumn = "";
    if (type === 'requestTypes') { tableName = "applications_request_types"; idColumn = "request_type_id"; }
    else if (type === 'permitCategories') { tableName = "registry_permit_categories"; idColumn = "category_id"; }
    else if (type === 'presentationForms') { tableName = "registry_presentation_forms"; idColumn = "form_id"; }

    try {
      const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  }

  // --- HANDLERS: SEGURIDAD ---
  const handleSaveSecurity = async () => {
    setIsSavingSecurity(true);
    try {
      const { error } = await supabase
        .from("system_security_settings")
        .update({
          require_2fa: twoFAEnabled,
          allow_concurrent_sessions: concurrentSessions,
          inactivity_timeout_minutes: parseInt(inactivityTime) || 30
        })
        .eq("setting_id", 1);

      if (error) throw error;
      alert("Configuración de seguridad actualizada en Supabase.");
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setIsSavingSecurity(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Configuración del Sistema</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Administración de accesos, catálogos paramétricos y reglas de negocio del SASRL.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar para configuraciones */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab("usuarios")}
            className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "usuarios" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
          >
            <Users className="h-4 w-4" />
            Gestión de Usuarios
          </button>
          <button 
            onClick={() => setActiveTab("catalogos")}
            className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "catalogos" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
          >
            <Database className="h-4 w-4" />
            Catálogos y Parámetros
          </button>
          <button 
            onClick={() => setActiveTab("seguridad")}
            className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "seguridad" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
          >
            <Shield className="h-4 w-4" />
            Roles y Seguridad
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1">
          
          {/* TAB: USUARIOS */}
          {activeTab === "usuarios" && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Directorio de Usuarios</h2>
                <Button className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>

              <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o correo..." 
                      className="pl-9 h-9 flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <Select 
                    className="w-[180px]"
                    placeholder="Filtrar por rol..." 
                    options={[
                      { value: "todos", label: "Todos los roles" },
                      { value: "admin", label: "Administrador" },
                      { value: "evaluador", label: "Evaluador Técnico" },
                      { value: "revisor", label: "Revisor Legal" },
                      { value: "usuario", label: "Representante Externo" }
                    ]}
                  />
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 uppercase">
                        <tr>
                          <th className="px-6 py-4 font-medium">Nombre completo</th>
                          <th className="px-6 py-4 font-medium text-center">Rol del Sistema</th>
                          <th className="px-6 py-4 font-medium text-center">Estado</th>
                          <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoadingUsers ? (
                          <tr><td colSpan="4" className="text-center py-8 text-slate-500 dark:text-slate-400">Cargando usuarios...</td></tr>
                        ) : usersDb.length === 0 ? (
                          <tr><td colSpan="4" className="text-center py-8 text-slate-500 dark:text-slate-400">No hay usuarios dados de alta.</td></tr>
                        ) : usersDb.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{user.email}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100/50 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800/50 dark:text-indigo-400 text-xs font-semibold">
                                {user.rol}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant={user.estado === "Activo" ? "aprobada" : "rechazada"}>
                                {user.estado}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => openRoleModal(user)}
                                className="p-2 text-slate-400 hover:text-primary transition-colors"
                                title="Cambiar Rol"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* MODAL CAMBIO DE ROL */}
              {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden text-left animate-in zoom-in-95">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Editar Privilegios del Usuario</h3>
                      <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="px-6 py-6 space-y-5">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Usuario seleccionado</p>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                          {userToEdit?.firstName} {userToEdit?.lastName} <span className="text-sm font-normal text-slate-500">({userToEdit?.email})</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Asignar Nuevo Rol del Sistema</label>
                        <select 
                          className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                        >
                          <option value="Solicitante">Solicitante (Sólo Enviar Formularios)</option>
                          <option value="Revisor Técnico">Revisor Técnico (Evalúa Requisitos)</option>
                          <option value="Receptor VUS">Receptor VUS (Valida Recepción Final)</option>
                          <option value="Administrador del Sistema">Administrador del Sistema (Acceso Total)</option>
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex items-start gap-1.5">
                          <Shield className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                          Al cambiar el rol, el sistema actualizará los permisos del usuario de manera inmediata a través del webbook de Clerk.
                        </p>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setIsRoleModalOpen(false)}>Cancelar</Button>
                      <Button onClick={handleSaveRole} disabled={isLoading}>
                        {isLoading ? "Asignando..." : "Confirmar Privilegio"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: CATÁLOGOS */}
          {activeTab === "catalogos" && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Catálogos y Parámetros</h2>
                <Button className="shrink-0" onClick={() => openNewCatalogModal('requestTypes', 'Tipo de Solicitud')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Trámite
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Catálogo 1 */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 h-full">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">Tipo de Solicitud</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Trámites permitidos</p>
                    </div>
                  </div>
                  <div className="p-2 h-[320px] overflow-y-auto">
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {requestTypes.length === 0 && <li className="text-slate-500 dark:text-slate-400 text-sm p-4 text-center">Sin datos. Añade el primer tipo.</li>}
                      {requestTypes.map((item) => (
                        <li key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group transition-colors">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => openEditCatalogModal('requestTypes', 'Tipo de Solicitud', item)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md hover:text-primary dark:hover:text-primary transition-all">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteCatalog('requestTypes', item.id)} className="p-1.5 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-all">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400" onClick={() => openNewCatalogModal('requestTypes', 'Tipo de Solicitud')}>
                         Añadir opción
                    </Button>
                  </div>
                </Card>

                {/* Catálogo 2 */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 h-full">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">Categoría de Habilitación</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tipos de opciones</p>
                    </div>
                  </div>
                  <div className="p-2 h-[320px] overflow-y-auto">
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {permitCategories.length === 0 && <li className="text-slate-500 dark:text-slate-400 text-sm p-4 text-center">Sin datos. Añade la primera categoría.</li>}
                      {permitCategories.map((item) => (
                        <li key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group transition-colors">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => openEditCatalogModal('permitCategories', 'Categoría de Habilitación', item)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md hover:text-primary dark:hover:text-primary transition-all">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteCatalog('permitCategories', item.id)} className="p-1.5 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-all">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                   <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400" onClick={() => openNewCatalogModal('permitCategories', 'Categoría de Habilitación')}>
                         Añadir opción
                    </Button>
                  </div>
                </Card>

                {/* Catálogo 3 */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 h-full">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">Formas de presentación</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Producto a elaborar</p>
                    </div>
                  </div>
                  <div className="p-2 h-[320px] overflow-y-auto">
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {presentationForms.length === 0 && <li className="text-slate-500 dark:text-slate-400 text-sm p-4 text-center">Sin datos. Añade la primera forma.</li>}
                      {presentationForms.map((item) => (
                        <li key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group transition-colors">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => openEditCatalogModal('presentationForms', 'Formas de presentación', item)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md hover:text-primary dark:hover:text-primary transition-all">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteCatalog('presentationForms', item.id)} className="p-1.5 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-all">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                   <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400" onClick={() => openNewCatalogModal('presentationForms', 'Formas de presentación')}>
                         Añadir opción
                    </Button>
                  </div>
                </Card>
              </div>

               {/* MODAL MANTENIMIENTO CATÁLOGO */}
               {isCatalogModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-left animate-in zoom-in-95">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{catalogItem.id ? "Editar Opción" : "Nueva Opción"}</h3>
                      <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="px-5 py-6 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Catálogo origen</p>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">{catalogContext.label}</p>
                      </div>
                      <div className="space-y-2">
                        <Input 
                            label="Nombre de la opción" 
                            placeholder="Ingrese el valor..."
                            value={catalogItem.name}
                            onChange={(e) => setCatalogItem({ ...catalogItem, name: e.target.value })}
                            autoFocus
                        />
                      </div>
                    </div>
                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setIsCatalogModalOpen(false)}>Cancelar</Button>
                      <Button onClick={handleSaveCatalog} disabled={isLoadingCatalog || !catalogItem.name.trim()}>
                        {isLoadingCatalog ? "Guardando..." : "Guardar Opción"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: SEGURIDAD Y PERMISOS */}
          {activeTab === "seguridad" && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
               <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Control de Accesos</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configura las restricciones de qué puede hacer cada perfil.</p>
              </div>

              <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 p-6">
                 <div className="space-y-6">
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Verificación en Dos Pasos (2FA)</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Obligar a los evaluadores a utilizar autenticación de SMS o App.</p>
                      </div>
                      <div 
                        onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                        className={`h-6 w-11 rounded-full flex items-center p-1 cursor-pointer transition-colors ${twoFAEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${twoFAEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Sesiones concurrentes</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Permitir que un evaluador inicie sesión en múltiples dispositivos.</p>
                      </div>
                      <div 
                        onClick={() => setConcurrentSessions(!concurrentSessions)}
                        className={`h-6 w-11 rounded-full flex items-center p-1 cursor-pointer transition-colors ${concurrentSessions ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${concurrentSessions ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Tiempo límite de inactividad</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sesiones se cierran automáticamente tras inactividad.</p>
                      </div>
                      <Select 
                        className="w-[120px]"
                        value={inactivityTime}
                        onChange={(e) => setInactivityTime(e.target.value)}
                        options={[
                          {value: "15", label: "15 min"},
                          {value: "30", label: "30 min"},
                          {value: "60", label: "60 min"},
                        ]}
                      />
                    </div>
                 </div>
                 <div className="mt-8 flex justify-end">
                    <Button onClick={handleSaveSecurity} disabled={isSavingSecurity}>
                      {isSavingSecurity ? "Guardando Ajustes..." : "Guardar Ajustes de Seguridad"}
                    </Button>
                 </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

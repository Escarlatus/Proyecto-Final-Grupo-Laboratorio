import React, { useState } from "react"
import { Card, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Badge } from "../components/ui/Badge"
import { Users, Database, Shield, MoreVertical, Plus, Search, Edit2, Trash2 } from "lucide-react"

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState("usuarios")

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Configuración del Sistema</h1>
        <p className="text-slate-500 mt-1">
          Administración de accesos, catálogos paramétricos y reglas de negocio del SASRL.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar para configuraciones */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab("usuarios")}
            className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "usuarios" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <Users className="h-4 w-4" />
            Gestión de Usuarios
          </button>
          <button 
            onClick={() => setActiveTab("catalogos")}
            className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "catalogos" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <Database className="h-4 w-4" />
            Catálogos y Parámetros
          </button>
          <button 
            onClick={() => setActiveTab("seguridad")}
            className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "seguridad" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
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
                <h2 className="text-xl font-bold text-slate-900">Directorio de Usuarios</h2>
                <Button className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>

              <Card className="shadow-sm border-slate-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o correo..." 
                      className="pl-9 h-9 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      <thead className="text-xs text-slate-500 bg-slate-50/50 border-b border-slate-100 uppercase">
                        <tr>
                          <th className="px-6 py-4 font-medium">Nombre completo</th>
                          <th className="px-6 py-4 font-medium text-center">Rol del Sistema</th>
                          <th className="px-6 py-4 font-medium text-center">Estado</th>
                          <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { nombre: "Carlos Méndez", correo: "carlos.m@msp.gob.do", rol: "Administrador", estado: "Activo" },
                          { nombre: "Laura Rosario", correo: "lrosario@msp.gob.do", rol: "Evaluador Técnico", estado: "Activo" },
                          { nombre: "José Batista", correo: "jbatista@digemaps.gob.do", rol: "Revisor Legal", estado: "Inactivo" },
                          { nombre: "Ana López", correo: "admin@laboratoriosmk.com", rol: "Representante Externo", estado: "Activo" },
                        ].map((user, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">{user.nombre}</p>
                              <p className="text-slate-500 text-xs mt-0.5">{user.correo}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                {user.rol}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant={user.estado === "Activo" ? "aprobada" : "rechazada"}>
                                {user.estado}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: CATÁLOGOS */}
          {activeTab === "catalogos" && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Catálogos y Parámetros</h2>
                <Button className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Catálogo
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Catálogo 1 */}
                <Card className="shadow-sm border-slate-200 h-full">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">Tipo de Solicitud</h3>
                      <p className="text-xs text-slate-500 mt-1">Trámites permitidos</p>
                    </div>
                  </div>
                  <div className="p-2 h-[320px] overflow-y-auto">
                    <ul className="divide-y divide-slate-100">
                      {[
                        "Apertura", "Traslado", "Renovación", 
                        "Cambio de propietario", "Cambio de razón social", 
                        "Cambio de actividad", "Cambio de nombre comercial", 
                        "Nueva área de fabricación"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-lg group transition-colors">
                          <span className="text-sm font-medium text-slate-700">{item}</span>
                          <button className="p-1 text-slate-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {/* Catálogo 2 */}
                <Card className="shadow-sm border-slate-200 h-full">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">Categoría del permiso de Habilitación</h3>
                      <p className="text-xs text-slate-500 mt-1">Tipos de opciones</p>
                    </div>
                  </div>
                  <div className="p-2 h-[320px] overflow-y-auto">
                    <ul className="divide-y divide-slate-100">
                      {[
                        "Fabricante de Medicamentos", "Productos Naturales", "Productos Sanitarios", 
                        "Fabricante de Cosméticos", "Higiene personal", "Higiene del Hogar", 
                        "Centro Prep. Mezclas Nutrición", "Acondicionador 1rio Medic.", 
                        "Fabricante de biológicos", "Fabricante de Materia Prima"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-lg group transition-colors">
                          <span className="text-sm font-medium text-slate-700">{item}</span>
                          <button className="p-1 text-slate-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {/* Catálogo 3 */}
                <Card className="shadow-sm border-slate-200 h-full">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">Forma de presentación del producto a elaborar</h3>
                      <p className="text-xs text-slate-500 mt-1">Formas de presentación</p>
                    </div>
                  </div>
                  <div className="p-2 h-[320px] overflow-y-auto">
                    <ul className="divide-y divide-slate-100">
                      {[
                        "Sólidos", "Semisólidos", "Líquidos", 
                        "Líquidos orales", "Estériles Inyectables/Parenterales", 
                        "Estériles no Inyectables"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-lg group transition-colors">
                          <span className="text-sm font-medium text-slate-700">{item}</span>
                          <button className="p-1 text-slate-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB: SEGURIDAD Y PERMISOS */}
          {activeTab === "seguridad" && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
               <div>
                <h2 className="text-xl font-bold text-slate-900">Control de Accesos</h2>
                <p className="text-slate-500 text-sm mt-1">Configura las restricciones de qué puede hacer cada perfil.</p>
              </div>

              <Card className="shadow-sm border-slate-200 p-6">
                 <div className="space-y-6">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">Verificación en Dos Pasos (2FA)</h4>
                        <p className="text-sm text-slate-500 mt-1">Obligar a los evaluadores a utilizar autenticación de SMS o App.</p>
                      </div>
                      <div className="h-6 w-11 rounded-full bg-primary flex items-center p-1 cursor-pointer">
                        <div className="h-4 w-4 bg-white rounded-full translate-x-5 shadow-sm"></div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">Sesiones concurrentes</h4>
                        <p className="text-sm text-slate-500 mt-1">Permitir que un evaluador inicie sesión en múltiples dispositivos.</p>
                      </div>
                      <div className="h-6 w-11 rounded-full bg-slate-200 flex items-center p-1 cursor-pointer">
                        <div className="h-4 w-4 bg-white rounded-full shadow-sm relative"></div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">Tiempo límite de inactividad</h4>
                        <p className="text-sm text-slate-500 mt-1">Sesiones se cierran automáticamente tras inactividad.</p>
                      </div>
                      <Select 
                        className="w-[120px]"
                        options={[
                          {value: "15", label: "15 min"},
                          {value: "30", label: "30 min"},
                          {value: "60", label: "60 min"},
                        ]}
                      />
                    </div>
                 </div>
                 <div className="mt-8 flex justify-end">
                    <Button>Guardar Ajustes de Seguridad</Button>
                 </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

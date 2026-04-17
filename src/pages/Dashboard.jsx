import React from "react"
import { DollarSign, FileText, CheckCircle2, AlertTriangle, Plus, Search, MoreHorizontal, Filter } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { Link } from "react-router-dom"

const MOCK_DATA = [
  { id: "REQ-2026-001", type: "Habilitación Nueva", establishment: "Laboratorio Clínico RD", amount: "RD$ 15,000", status: "en_revision" },
  { id: "REQ-2026-002", type: "Renovación", establishment: "Centro Médico Oriental", amount: "RD$ 8,500", status: "aprobada" },
  { id: "REQ-2026-003", type: "Traslado", establishment: "BioAnálisis Dr. Díaz", amount: "RD$ 12,000", status: "observada" },
  { id: "REQ-2026-004", type: "Modificación", establishment: "Clínica del Sol", amount: "RD$ 5,000", status: "borrador" },
  { id: "REQ-2026-005", type: "Habilitación Nueva", establishment: "FarmaCentro Integral", amount: "RD$ 25,000", status: "en_revision" },
]

export default function Dashboard() {
  return (
    <div className="flex-col md:flex">
      <div className="flex-1 space-y-4 pt-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Panel Regulatorio</h2>
          <div className="flex items-center space-x-2">
            <Button className="hidden md:flex bg-[#0F539C] hover:bg-[#0A3C72] dark:bg-[#9FD0FD] dark:hover:bg-[#66A1DE] dark:text-[#0F539C] text-white" asChild>
              <Link to="/app/nueva-solicitud">
                 <Plus className="mr-2 h-4 w-4" /> Nuevo Trámite
              </Link>
            </Button>
          </div>
        </div>

        {/* Shadcn Sub-nav imitation */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/50 p-1 text-slate-500 dark:text-slate-400">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm">
              Visión General
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-800">
              Analíticas
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-800">
              Reportes
            </button>
          </div>
        </div>

        {/* Metrics Row (grid-cols-4) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 text-slate-600 dark:text-slate-400 pb-2">
              <CardTitle className="text-sm font-medium font-sans">Ingresos (Tasas)</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white text-left">RD$ 45,231.89</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1 text-left">+20.1% este mes</p>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 text-slate-600 dark:text-slate-400 pb-2">
              <CardTitle className="text-sm font-medium font-sans">Expedientes Activos</CardTitle>
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white text-left">+235</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1 text-left">+180 nuevos expedientes</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 text-slate-600 dark:text-slate-400 pb-2">
              <CardTitle className="text-sm font-medium font-sans">Atención Requerida</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white text-left">12</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1 text-left">+5 expedientes observados</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 text-slate-600 dark:text-slate-400 pb-2">
              <CardTitle className="text-sm font-medium font-sans">Aprobaciones</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white text-left">+573</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1 text-left">+201 trimestre actual</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Split (grid-cols-7) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          <Card className="col-span-4 flex flex-col dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">Listado Maestro de Trámites</CardTitle>
              <CardDescription className="dark:text-slate-400">Resumen interactivo de los expedientes sometidos al Ministerio.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-slate-500 dark:text-slate-400">
                      <th className="font-medium px-4 py-3">Expediente</th>
                      <th className="font-medium px-4 py-3">Asunto</th>
                      <th className="font-medium px-4 py-3">Estado</th>
                      <th className="font-medium px-4 py-3 text-right">Tasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_DATA.map((item, index) => (
                      <tr key={index} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">{item.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-900 dark:text-slate-300">{item.establishment}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-500">{item.type}</div>
                        </td>
                        <td className="px-4 py-3">
                           {item.status === 'aprobada' && <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent">Aprobada</span>}
                           {item.status === 'en_revision' && <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-[#9FD0FD]/20 text-[#0F539C] dark:bg-[#0F539C]/30 dark:text-[#9FD0FD] border-transparent">Revisión</span>}
                           {item.status === 'observada' && <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-transparent">Observada</span>}
                           {item.status === 'borrador' && <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-transparent">Borrador</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                          {item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">Actividad Reciente</CardTitle>
              <CardDescription className="dark:text-slate-400">
                Se registraron 265 movimientos este mes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[
                  { title: "Dr. Carlos Fernández", desc: "Sometió nuevos anexos (REN-03)", val: "+RD$ 3,000" },
                  { title: "Laboratorios Amadita", desc: "Aprobación de habilitación sede central", val: "Completado" },
                  { title: "Clínica Cruz Jiminián", desc: "Inspección técnica programada", val: "En proceso" },
                  { title: "Referencia Laboratorio", desc: "Pago de Tasa Única Procesado", val: "+RD$ 15,000" },
                  { title: "Centro Oncológico", desc: "Nueva solicitud de licencia", val: "+RD$ 45,000" }
                ].map((act, i) => (
                  <div key={i} className="flex items-center group cursor-pointer">
                    <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 justify-center items-center group-hover:bg-[#0F539C] dark:group-hover:bg-[#9FD0FD] transition-colors">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-white dark:group-hover:text-[#0F539C] block transition-colors">{act.title.charAt(0)}{act.title.charAt(1)}</span>
                    </span>
                    <div className="ml-4 space-y-1 text-left">
                      <p className="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">{act.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{act.desc}</p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-slate-900 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {act.val}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

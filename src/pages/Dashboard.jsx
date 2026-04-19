import React, { useState, useEffect } from "react"
import { Building, FileText, CheckCircle2, AlertTriangle, Plus, ClipboardList, Download, RefreshCw } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { Link } from "react-router-dom"
import { useSupabase } from "../hooks/useSupabase"
export default function Dashboard() {
  const supabase = useSupabase();
  const [activeTab, setActiveTab] = useState("general");
  const [stats, setStats] = useState({ TotalEstablishments: 0, ActiveRequests: 0, AttentionRequired: 0, Approvals: 0 });
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Conteo general de establecimientos
        const { count: estCount } = await supabase.from("registry_establishments").select("*", { count: "exact", head: true });
        
        // 2. Traer todas las solicitudes con su respectivo establecimiento (Foreign Key)
        const { data: peticiones, error } = await supabase
          .from("applications_requests")
          .select(`
            *,
            registry_establishments(trade_name, rnc),
            applications_request_types(type_name)
          `);

        if (error) {
          console.error("Error from Supabase:", error);
          return;
        }

        let ActiveRequests = peticiones.length;
        let AttentionRequired = peticiones.filter(r => r.status_id === 2 || r.status_id === 4).length; // Revision u Observada
        let Approvals = peticiones.filter(r => r.status_id === 5).length; // Aprobada

        // Mapear para el frontend de la tabla
        const mapped = peticiones.map(p => ({
          id: p.request_number,
          establishment: p.registry_establishments?.trade_name || "Desconocido",
          type: p.applications_request_types?.type_name || "Trámite",
          status: p.status_id === 5 ? "aprobada" : p.status_id === 4 ? "observada" : p.status_id === 1 ? "borrador" : "en_revision",
          rnc: p.registry_establishments?.rnc || "N/A"
        }));

        setStats({ TotalEstablishments: estCount || 0, ActiveRequests, AttentionRequired, Approvals });
        setRequests(mapped);

      } catch (error) { console.error("Error fetching dashboard data:", error) }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab !== "auditoria") return;
    const fetchAudit = async () => {
      setAuditLoading(true);
      try {
        const { data, error } = await supabase
          .from("system_audit_logs")
          .select("*")
          .order("timestamp", { ascending: false });

        if (!error) {
          // Mapeamos los campos a la estructura original de tabla
          setAuditLogs(data.map(log => ({
            Action: log.action,
            EntityName: log.entity_name,
            EntityId: log.entity_id,
            OldValues: log.old_values,
            NewValues: log.new_values,
            UserId: log.user_id,
            Timestamp: new Date(log.timestamp).toLocaleString()
          })));
        }
      } catch (err) { console.error(err); }
      setAuditLoading(false);
    };
    fetchAudit();
  }, [activeTab]);

  const exportCSV = () => {
    if (auditLogs.length === 0) return;
    const headers = ["Fecha","Accion","Entidad","ID","Valor Anterior","Nuevo Valor","Usuario","IP"];
    const rows = auditLogs.map(l => [
      l.Timestamp, l.Action, l.EntityName, l.EntityId,
      l.OldValues || "", l.NewValues || "", l.UserId || "System", l.IpAddress || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

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

        {/* Tab switcher */}
        <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/50 p-1">
          {[{id: "general", label: "Visión General"}, {id: "auditoria", label: "Auditoría del Sistema"}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}>
              {tab.id === "auditoria" && <ClipboardList className="h-3.5 w-3.5" />}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === "general" && <div className="space-y-4 animate-in fade-in duration-500 mt-1">
          {/* Metrics Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Establecimientos", value: stats?.TotalEstablishments || 0, desc: "Registrados en total", Icon: Building },
              { title: "Total Solicitudes", value: (stats?.ActiveRequests || 0) + (stats?.Approvals || 0), desc: "Histórico general", Icon: FileText },
              { title: "Observadas", value: stats?.AttentionRequired || 0, desc: "Expedientes devueltos", Icon: AlertTriangle },
              { title: "Aprobadas", value: stats?.Approvals || 0, desc: "Trámites completados", Icon: CheckCircle2 }
            ].map((stat, i) => (
              <Card key={i} className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</CardTitle>
                  <stat.Icon className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  <p className="text-xs text-slate-500 mt-1">{stat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Métricas por Estado</CardTitle>
                <CardDescription>Distribución general de todas las solicitudes del sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {['En Revisión', 'Favorable', 'Observada', 'Aprobada'].map(estado => {
                       const count = requests.filter(r => r.status === estado.toLowerCase().replace(' ', '_')).length;
                       const width = requests.length ? Math.round((count / requests.length) * 100) : 0;
                       return (
                         <div key={estado}>
                           <div className="flex items-center justify-between text-sm mb-1">
                             <span className="font-medium text-slate-700 dark:text-slate-300">{estado}</span>
                             <span className="text-slate-500">{count} ({width}%)</span>
                           </div>
                           <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-[#0F539C]" style={{ width: `${width}%` }} />
                           </div>
                         </div>
                       )
                    })}
                 </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 flex flex-col dark:bg-slate-900 dark:border-slate-800 transition-colors">
              <CardHeader>
                <CardTitle className="text-base text-slate-900 dark:text-white">Listado Maestro de Trámites</CardTitle>
                <CardDescription className="dark:text-slate-400">Resumen interactivo de los expedientes sometidos al Ministerio.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <tr className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                        <th className="font-semibold px-4 py-3">Expediente</th>
                        <th className="font-semibold px-4 py-3">Asunto</th>
                        <th className="font-semibold px-4 py-3">Estado</th>
                        <th className="font-semibold px-4 py-3 text-right">RNC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length > 0 ? requests.map((item, index) => (
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
                            {item.rnc}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No hay trámites registrados aún.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>}

        {activeTab === "auditoria" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-white">Registro de Auditoría</CardTitle>
                  <CardDescription className="dark:text-slate-400">Historial de cambios de estado y acciones del sistema (RF-11).</CardDescription>
                </div>
                {auditLogs.length > 0 && (
                  <button onClick={exportCSV}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Download className="h-3.5 w-3.5" /> Exportar CSV
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {auditLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-[#0F539C] border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Cargando registros...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No hay registros de auditoría aún.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Los cambios de estado de solicitudes aparecen aquí automáticamente.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                        <tr className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                          <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                          <th className="px-4 py-3 text-left font-semibold">Acción</th>
                          <th className="px-4 py-3 text-left font-semibold">Entidad / ID</th>
                          <th className="px-4 py-3 text-left font-semibold">Valor Anterior</th>
                          <th className="px-4 py-3 text-left font-semibold">Nuevo Valor</th>
                          <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {auditLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.Timestamp}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-semibold">{log.Action}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{log.EntityName} #{log.EntityId}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{log.OldValues || "—"}</td>
                            <td className="px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400 font-medium">{log.NewValues || "—"}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[120px]">{log.UserId || "System"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

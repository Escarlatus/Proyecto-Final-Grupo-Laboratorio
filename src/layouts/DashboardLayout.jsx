import React, { useState, useEffect } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { LayoutDashboard, FilePlus2, Settings, Bell, Hexagon, Moon, Sun, ClipboardList, Stamp, ListChecks } from "lucide-react"
import { cn } from "../lib/utils"
import { UserButton, useUser } from "@clerk/react"
import CompletarPerfilModal from "../components/CompletarPerfilModal"
import { useSupabase } from "../hooks/useSupabase"

export default function DashboardLayout() {
  const location = useLocation()
  const { user } = useUser()
  const supabase = useSupabase()
  const [userRole, setUserRole] = useState(null)
  const [profileComplete, setProfileComplete] = useState(true) // assume complete until checked
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    }
    return false
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  // Fetch role from DB on login
  useEffect(() => {
    if (!user) return

    const fetchRoleAndProfile = async () => {
      try {
        const { data: userData } = await supabase
          .from("identity_users")
          .select("role_id, person_id, identity_persons(document_number)")
          .eq("clerk_user_id", user.id)
          .single();

        if (userData) {
          const ROLE_MAP = {
            1: 'Solicitante',
            2: 'Revisor Técnico',
            3: 'Administrador del Sistema',
            4: 'Receptor VUS'
          };
          setUserRole(ROLE_MAP[userData.role_id] || "Solicitante");
          
          if (!userData.identity_persons?.document_number) {
            setProfileComplete(false);
          }
        }
      } catch (e) { console.error(e) }
    }

    fetchRoleAndProfile()
  }, [user, supabase])

  // Default to Solicitante until role loads (safe default — least privilege)
  const role = userRole || "Solicitante"

  // Nav items per role
  const allNavItems = {
    "Solicitante": [
      { name: "Mis Solicitudes",  href: "/app/mis-solicitudes",  icon: ListChecks },
      { name: "Nueva Solicitud",  href: "/app/nueva-solicitud", icon: FilePlus2 },
    ],
    "Revisor Técnico": [
      { name: "Bandeja de Revisión", href: "/app",              icon: ClipboardList },
    ],
    "Administrador del Sistema": [
      { name: "Dashboard",         href: "/app",               icon: LayoutDashboard },
      { name: "Nueva Solicitud",   href: "/app/nueva-solicitud", icon: FilePlus2 },
      { name: "Configuración",     href: "/app/configuracion",  icon: Settings },
    ],
    "Receptor VUS": [
      { name: "Bandeja VUS",       href: "/app",               icon: Stamp },
    ],
  }

  const navItems = allNavItems[role] || allNavItems["Administrador del Sistema"]

  const roleLabel = {
    "Solicitante": "Solicitante",
    "Revisor Técnico": "Revisor Técnico",
    "Administrador del Sistema": "Administrador",
    "Receptor VUS": "Receptor VUS",
  }[role] || "Usuario"

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col transition-colors duration-300">
        <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors duration-300">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-blue-700 via-white to-red-600 pointer-events-none"></div>
          <Link to="/" className="flex items-center gap-3 text-primary relative z-10 hover:opacity-80 transition-opacity">
            <Hexagon className="h-7 w-7 fill-primary dark:fill-[#9FD0FD]" />
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-[1.15rem] leading-none tracking-tight text-slate-900 dark:text-white">SASRL</span>
              <span className="text-[10px] font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-0.5">DIGEMAPS</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Menú Principal</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-[#0F539C] text-white shadow-md shadow-[#0F539C]/20" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center gap-3 px-2">
            <UserButton />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900 dark:text-white leading-none">Mi Perfil</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{roleLabel}</span>
            </div>
            
            {/* Dark Mode Toggle inside Sidebar at bottom */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="ml-auto p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 transition-colors duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002D62] via-transparent to-[#CE1126] opacity-80"></div>
          
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 w-full md:w-auto">
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsDark(!isDark)}
                className="md:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Profile completion modal — shown when document number is missing */}
      {!profileComplete && user && (
        <CompletarPerfilModal
          clerkUserId={user.id}
          defaultFirstName={user.firstName || ""}
          defaultLastName={user.lastName || ""}
          defaultEmail={user.primaryEmailAddress?.emailAddress || ""}
          onComplete={() => setProfileComplete(true)}
        />
      )}
    </div>
  )
}

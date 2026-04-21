import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Hexagon, ShieldCheck, Activity, FileText, Moon, Sun, X } from "lucide-react"
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react"

const LEGAL_TEXTS = {
  terms: {
    title: "Términos de Servicio",
    content: (
      <>
        <p className="mb-4">Bienvenido al Sistema de Registro de Laboratorios Fabricantes (SIRELAF). Al acceder a este portal, usted acepta cumplir con los siguientes términos y condiciones de uso.</p>
        <h4 className="font-bold mb-2">1. Uso del Portal</h4>
        <p className="mb-4">Este portal es exclusivo para el registro y habilitación de establecimientos bajo la normativa de DIGEMAPS. Cualquier uso indebido de la información o intentos de acceso no autorizado serán sancionados según las leyes de la República Dominicana.</p>
        <h4 className="font-bold mb-2">2. Responsabilidad del Usuario</h4>
        <p className="mb-4">El usuario es responsable de la veracidad de los documentos cargados. La falsificación de documentos conlleva la cancelación inmediata del proceso de registro y posibles acciones legales.</p>
      </>
    )
  },
  privacy: {
    title: "Privacidad de Datos",
    content: (
      <>
        <p className="mb-4">En cumplimiento con la Ley No. 172-13 sobre Protección de Datos de Carácter Personal, el Ministerio de Salud Pública garantiza la confidencialidad de la información suministrada.</p>
        <h4 className="font-bold mb-2">Uso de la Información</h4>
        <p className="mb-4">Sus datos personales y técnicos serán utilizados exclusivamente para fines de evaluación y habilitación institucional. No serán compartidos con terceros sin su consentimiento expreso, salvo por requerimiento de autoridad competente.</p>
      </>
    )
  },
  support: {
    title: "Soporte DIGEMAPS",
    content: (
      <>
        <p className="mb-4">¿Necesita ayuda con su trámite? Nuestro equipo técnico está disponible para asistirle.</p>
        <div className="space-y-2 text-sm">
          <p><strong>📍 Dirección:</strong> Av. Dr. Héctor Homero Hernández esq. Av. Tiradentes, Santo Domingo.</p>
          <p><strong>📞 Teléfono:</strong> (809) 541-3121 ext. 2345</p>
          <p><strong>📧 Correo:</strong> soporte.sirelaf@salud.gob.do</p>
          <p><strong>⏰ Horario:</strong> Lunes a Viernes, 8:00 AM - 4:00 PM</p>
        </div>
      </>
    )
  }
}

function LegalModal({ isOpen, type, onClose }) {
  if (!isOpen) return null;
  const data = LEGAL_TEXTS[type] || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          {data.content}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [activeLegal, setActiveLegal] = useState(null)
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 selection:bg-primary/20 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Hexagon className="h-6 w-6 fill-primary/20 dark:fill-[#9FD0FD]/20" />
            <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">SIRELAF</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#inicio" className="hover:text-[#0F539C] dark:hover:text-[#9FD0FD] transition-colors">Inicio</a>
            <a href="#beneficios" className="hover:text-[#0F539C] dark:hover:text-[#9FD0FD] transition-colors">Beneficios</a>
            <a href="#requisitos" className="hover:text-[#0F539C] dark:hover:text-[#9FD0FD] transition-colors">Requisitos</a>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0F539C] dark:hover:text-[#9FD0FD] transition-colors cursor-pointer">
                  Iniciar sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center justify-center rounded-md bg-[#0F539C] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#0A3C72] transition-colors cursor-pointer">
                  Acceder al Portal
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link to="/app" className="text-sm font-medium text-[#0F539C] dark:text-[#9FD0FD] hover:underline transition-colors mr-2">
                Ir a mi Dashboard
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* ================= INICIO (HERO) ================= */}
        <section id="inicio" className="relative bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
          {/* Subtle grid pattern background for technical feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="container mx-auto px-6 py-16 md:py-24 relative z-10 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Text Side (Left) */}
              <div className="text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-[#0F539C]/20 border border-blue-100 dark:border-[#0F539C]/30 rounded-full text-xs font-semibold uppercase tracking-widest text-[#0F539C] dark:text-[#9FD0FD] mb-8">
                  <span className="flex h-2 w-2 rounded-full bg-[#CE1126] animate-pulse"></span>
                  Ministerio de Salud Pública
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 font-display">
                  Plataforma Oficial de <br className="hidden md:block" />
                  <span className="text-[#0F539C] dark:text-[#9FD0FD]">Trámites DIGEMAPS</span>
                </h1>
                
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-lg leading-relaxed">
                  El sistema único para la habilitación, registro y regulación de laboratorios a nivel nacional. Gestiona tus expedientes de forma digital y segura.
                </p>
                
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Show when="signed-out">
                    <SignUpButton mode="modal">
                      <button className="h-12 px-8 inline-flex items-center justify-center rounded-md bg-[#0F539C] dark:bg-[#9FD0FD] text-sm font-medium text-white dark:text-[#0F539C] shadow hover:bg-[#0A3C72] dark:hover:bg-[#66A1DE] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 w-full sm:w-auto">
                        Crear Expediente
                      </button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <button className="h-12 px-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto">
                        Iniciar Sesión
                      </button>
                    </SignInButton>
                  </Show>
                  <Show when="signed-in">
                    <Link to="/app/nueva-solicitud" className="h-12 px-8 inline-flex items-center justify-center rounded-md bg-[#0F539C] dark:bg-[#9FD0FD] text-sm font-medium text-white dark:text-[#0F539C] shadow hover:bg-[#0A3C72] dark:hover:bg-[#66A1DE] transition-colors w-full sm:w-auto">
                      Iniciar Trámite Nuevo
                    </Link>
                    <Link to="/app" className="h-12 px-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto">
                      Ir al Dashboard
                    </Link>
                  </Show>
                </div>
              </div>

              {/* Image Side (Right) */}
              <div className="relative hidden md:block">
                <div className="absolute -inset-4 bg-[#0F539C]/5 dark:bg-[#9FD0FD]/5 rounded-[2rem] transform rotate-3 scale-105"></div>
                <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm transition-colors duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=1200" 
                    alt="Laboratorio clínico oficial" 
                    className="w-full h-auto aspect-[4/3] object-cover rounded-xl"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-4 hidden lg:flex transition-colors duration-300">
                    <div className="h-10 w-10 bg-green-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-emerald-400 border border-green-100 dark:border-emerald-800">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">100% Validado</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Sistema gubernamental seguro</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= BENEFICIOS ================= */}
        <section id="beneficios" className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 font-display">Ventajas del Sistema</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                La digitalización de los procesos regulatorios garantiza mayor rapidez, ahorra costos operativos e impone un estricto control de seguridad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Beneficio 1 */}
              <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-[#0F539C]/20 flex items-center justify-center mb-6 border border-blue-100 dark:border-[#0F539C]/40 group-hover:bg-[#0F539C] dark:group-hover:bg-[#9FD0FD] group-hover:text-white dark:group-hover:text-[#0F539C] transition-colors text-[#0F539C] dark:text-[#9FD0FD]">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mb-3">Reducción de Papel</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Todos los formularios y anexos probatorios son consolidados en un repositorio cifrado de forma 100% digital, eliminando el riesgo de extravío.
                </p>
              </div>

              {/* Beneficio 2 */}
              <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-[#0F539C]/20 flex items-center justify-center mb-6 border border-blue-100 dark:border-[#0F539C]/40 group-hover:bg-[#0F539C] dark:group-hover:bg-[#9FD0FD] group-hover:text-white dark:group-hover:text-[#0F539C] transition-colors text-[#0F539C] dark:text-[#9FD0FD]">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mb-3">Trazabilidad Total</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Conoce el estado exacto de tu expediente gubernamental en tiempo real, desde la recepción inicial hasta la inspección técnica.
                </p>
              </div>

              {/* Beneficio 3 */}
              <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-[#0F539C]/20 flex items-center justify-center mb-6 border border-blue-100 dark:border-[#0F539C]/40 group-hover:bg-[#0F539C] dark:group-hover:bg-[#9FD0FD] group-hover:text-white dark:group-hover:text-[#0F539C] transition-colors text-[#0F539C] dark:text-[#9FD0FD]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mb-3">Auditoría Estricta</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Las resoluciones emitidas cuentan con firmas digitales avaladas por el Ministerio, asegurando total invulnerabilidad legal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= REQUISITOS ================= */}
        <section id="requisitos" className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                  Requisitos de Habilitación
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                  Normativas y documentaciones de carácter obligatorio (formulario FO-UBP-09). Asegúrese de disponer de los originales digitalizados.
                </p>
              </div>
              <div className="text-xs font-semibold px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md uppercase tracking-wider inline-block transition-colors duration-300">
                Actualizado Ley 42-01
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm flex flex-col h-full transition-colors duration-300">
                <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl transition-colors duration-300">
                  <h3 className="font-semibold text-base leading-none tracking-tight flex items-center gap-2">
                    <span className="flex h-5 w-5 bg-blue-100 dark:bg-[#0F539C]/20 text-[#0F539C] dark:text-[#9FD0FD] text-xs items-center justify-center rounded font-bold">1</span>
                    Documentación Legal
                  </h3>
                </div>
                <div className="p-6 text-sm text-slate-600 dark:text-slate-400 flex-1">
                  <ul className="space-y-4 list-none">
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Copia del Registro Nacional de Contribuyente (RNC).</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Certificado de Nombre Comercial vigente emitido por ONAPI.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Copia de la cédula de identidad del propietario o representante.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm flex flex-col h-full relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 w-full h-1 bg-[#0F539C] dark:bg-[#9FD0FD]" />
                <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl pt-7 transition-colors duration-300">
                  <h3 className="font-semibold text-base leading-none tracking-tight flex items-center gap-2">
                    <span className="flex h-5 w-5 bg-blue-100 dark:bg-[#0F539C]/20 text-[#0F539C] dark:text-[#9FD0FD] text-xs items-center justify-center rounded font-bold">2</span>
                    Personal Técnico
                  </h3>
                </div>
                <div className="p-6 text-sm text-slate-600 dark:text-slate-400 flex-1">
                  <ul className="space-y-4 list-none">
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Copia del Exequátur oficial del Director Técnico.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Copia autenticada del título universitario o diploma.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Copia del título de especialidad avalada (de ser aplicable).</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm flex flex-col h-full transition-colors duration-300">
                <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl transition-colors duration-300">
                  <h3 className="font-semibold text-base leading-none tracking-tight flex items-center gap-2">
                    <span className="flex h-5 w-5 bg-blue-100 dark:bg-[#0F539C]/20 text-[#0F539C] dark:text-[#9FD0FD] text-xs items-center justify-center rounded font-bold">3</span>
                    Infraestructura
                  </h3>
                </div>
                <div className="p-6 text-sm text-slate-600 dark:text-slate-400 flex-1">
                  <ul className="space-y-4 list-none">
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Plano arquitectónico completo del establecimiento.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Autorización de Uso de Suelo emitida por la alcaldía local.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0F539C] dark:bg-[#9FD0FD] mt-1.5 flex-shrink-0" />
                      <span>Relación firmada de los equipos e instrumentos analíticos a usar.</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Legal Modal Component */}
        <LegalModal 
          isOpen={!!activeLegal} 
          type={activeLegal} 
          onClose={() => setActiveLegal(null)} 
        />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 mt-auto transition-colors duration-300">
        <div className="container mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex justify-center md:justify-start items-center gap-2 text-slate-900 dark:text-white mb-2">
              <Hexagon className="h-5 w-5 fill-slate-200 dark:fill-slate-800" />
              <span className="font-display font-bold text-lg tracking-tight">SIRELAF</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 Ministerio de Salud Pública. Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
            <button onClick={() => setActiveLegal('terms')} className="hover:text-[#0F539C] dark:hover:text-[#9FD0FD] transition-colors">Términos de servicio</button>
            <button onClick={() => setActiveLegal('privacy')} className="hover:text-[#0F539C] dark:hover:text-[#9FD0FD] transition-colors">Privacidad de datos</button>
            <button onClick={() => setActiveLegal('support')} className="hover:text-[#0F539C] dark:hover:text-[#9FD0FD] transition-colors">Soporte DIGEMAPS</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

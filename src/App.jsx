import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import NuevaSolicitud from './pages/NuevaSolicitud'
import Configuracion from './pages/Configuracion'
import Landing from './pages/Landing'
import MisSolicitudes from './pages/MisSolicitudes'
import DetalleSolicitud from './pages/DetalleSolicitud'
import BandejaTecnico from './pages/BandejaTecnico'
import BandejaReceptor from './pages/BandejaReceptor'
import { useAuth, useUser } from '@clerk/react'
import { useSupabase } from './hooks/useSupabase'

// Guard that redirects to "/" if the user is not signed in
function AuthGuard({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/" replace />
  return children
}

// Protects a route by role. Redirects to /app if the user's role is not allowed.
function ProtectedRoute({ allowedRoles, children }) {
  const { user, isLoaded } = useUser()
  const supabase = useSupabase()
  const [role, setRole] = React.useState(null)
  const [checked, setChecked] = React.useState(false)

  React.useEffect(() => {
    if (!isLoaded || !user) return
    supabase
      .from("identity_users")
      .select("role_id")
      .eq("clerk_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const ROLE_MAP = { 1: 'Solicitante', 2: 'Revisor Técnico', 3: 'Administrador del Sistema', 4: 'Receptor VUS' }
        setRole(data ? (ROLE_MAP[data.role_id] || 'Solicitante') : 'Solicitante')
        setChecked(true)
      })
  }, [user, isLoaded, supabase])

  if (!checked) return null
  if (!allowedRoles.includes(role)) return <Navigate to="/app" replace />
  return children
}

// Redirects each role to their correct home page after login
function RoleBasedIndex() {
  const { user } = useUser()
  const [role, setRole] = useState(null)
  const supabase = useSupabase()

  useEffect(() => {
    if (!user) return
    const syncUser = async () => {
      try {
        const { data: userData } = await supabase
          .from("identity_users")
          .select("role_id")
          .eq("clerk_user_id", user.id)
          .maybeSingle()

        const ROLE_MAP = {
          1: 'Solicitante',
          2: 'Revisor Técnico',
          3: 'Administrador del Sistema',
          4: 'Receptor VUS'
        }

        if (userData && userData.role_id) {
          setRole(ROLE_MAP[userData.role_id] || 'Solicitante')
          return
        }

        // New user: sync to Supabase
        const email = user.primaryEmailAddress?.emailAddress || "sin-correo@falso.com"
        let personId = null

        const { data: existingPerson } = await supabase
          .from("identity_persons")
          .select("person_id")
          .eq("email", email)
          .maybeSingle()

        if (existingPerson) {
          personId = existingPerson.person_id
        } else {
          const { data: newPerson, error: personErr } = await supabase
            .from("identity_persons")
            .insert({
              first_name: user.firstName || user.username || 'Nuevo',
              last_name: user.lastName || 'Usuario',
              email: email
            })
            .select("person_id")
            .single()
          if (personErr) throw personErr
          personId = newPerson.person_id
        }

        await supabase.from("identity_users").insert({
          clerk_user_id: user.id,
          person_id: personId,
          role_id: 1,
          is_active: true
        })

        setRole('Solicitante')
      } catch (err) {
        console.error("Error al sincronizar usuario:", err)
        setRole('Solicitante')
      }
    }
    syncUser()
  }, [user, supabase])

  if (!role) return null

  if (role === 'Solicitante') return <Navigate to="/app/mis-solicitudes" replace />
  if (role === 'Revisor Técnico') return <Navigate to="/app/bandeja-tecnico" replace />
  if (role === 'Receptor VUS') return <Navigate to="/app/bandeja-receptor" replace />
  return <Dashboard />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/app" element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }>
          <Route index element={<RoleBasedIndex />} />
          <Route path="nueva-solicitud" element={
            <ProtectedRoute allowedRoles={['Solicitante', 'Administrador del Sistema']}>
              <NuevaSolicitud />
            </ProtectedRoute>
          } />
          <Route path="configuracion" element={
            <ProtectedRoute allowedRoles={['Administrador del Sistema']}>
              <Configuracion />
            </ProtectedRoute>
          } />
          <Route path="mis-solicitudes" element={
            <ProtectedRoute allowedRoles={['Solicitante', 'Administrador del Sistema']}>
              <MisSolicitudes />
            </ProtectedRoute>
          } />
          <Route path="solicitud/:id" element={
            <ProtectedRoute allowedRoles={['Solicitante', 'Administrador del Sistema']}>
              <DetalleSolicitud />
            </ProtectedRoute>
          } />
          <Route path="bandeja-tecnico" element={
            <ProtectedRoute allowedRoles={['Revisor Técnico', 'Administrador del Sistema']}>
              <BandejaTecnico />
            </ProtectedRoute>
          } />
          <Route path="bandeja-receptor" element={
            <ProtectedRoute allowedRoles={['Receptor VUS', 'Administrador del Sistema']}>
              <BandejaReceptor />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

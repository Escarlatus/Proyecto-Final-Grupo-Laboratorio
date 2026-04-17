import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import NuevaSolicitud from './pages/NuevaSolicitud'
import Configuracion from './pages/Configuracion'
import Landing from './pages/Landing'
import { Show } from '@clerk/react'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/app" element={
          <React.Fragment>
            <Show when="signed-out">
              <Navigate to="/" replace />
            </Show>
            <Show when="signed-in">
              <DashboardLayout />
            </Show>
          </React.Fragment>
        }>
          <Route index element={<Dashboard />} />
          <Route path="nueva-solicitud" element={<NuevaSolicitud />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
//dd
export default App

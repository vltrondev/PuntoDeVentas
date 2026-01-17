import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './index.css' // <-- ¡ESTA LÍNEA CARGA TODOS TUS ESTILOS!

// Importar componentes y páginas
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import POS from './pages/POS'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import { AuthProvider } from './context/AuthContext'
import AdminLayout from './components/AdminLayout'
import AdminPanel from './pages/AdminPanel'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Contacts from './components/Contacts'
import ContactForm from './components/ContactForm'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import Invoices from './pages/Invoices'
import SalesReports from './pages/SalesReports'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <POS /> },
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Register /> },
      { path: '/olvide-password', element: <ForgotPassword /> },
      { path: '/actualizar-password', element: <UpdatePassword /> },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminPanel /> },
          { path: 'facturas', element: <Invoices /> },
          { path: 'contactos', element: <Contacts /> },
          { path: 'contactos/nuevo', element: <ContactForm /> },
          { path: 'contactos/editar/:id', element: <ContactForm /> },
          {
            element: <ProtectedAdminRoute />,
            children: [
              { path: 'productos', element: <Products isPOS={false} /> },
              { path: 'productos/nuevo', element: <ProductForm /> },
              { path: 'productos/editar/:id', element: <ProductForm /> },
              { path: 'reportes', element: <SalesReports /> },
            ]
          }
        ]
      }
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
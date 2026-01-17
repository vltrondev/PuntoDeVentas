
import { Outlet } from 'react-router-dom'
import Header from './Header'


export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <DebugAuth />
    </div>
  )
}

import DebugAuth from './DebugAuth'
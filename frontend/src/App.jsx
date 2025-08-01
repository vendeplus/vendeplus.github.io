import { useState } from 'react'
import ClientList from './components/ClientList'
import ClientDetails from './components/ClientDetails'
import Report from './components/Report'
import SalesList from './components/SalesList'
import UsersList from './components/UsersList'
import { AuthProvider, useAuth } from './AuthProvider'
import Login from './Login'
import './App.css'

function MainContent({ page, setPage }) {
  const { user, role, logout } = useAuth()
  const [open, setOpen] = useState(false)
  if (!user) return <Login />

  const splitName = name => {
    const parts = name ? name.trim().split(/\s+/) : []
    if (parts.length <= 2) {
      return { nombres: parts[0] || '', apellidos: parts.slice(1).join(' ') }
    }
    return {
      nombres: parts.slice(0, parts.length - 2).join(' '),
      apellidos: parts.slice(parts.length - 2).join(' '),
    }
  }

  const { nombres, apellidos } = splitName(user.displayName)

  const go = (name, clientId = null) => {
    if ((name === 'finance' || name === 'users') && role !== 'Administrador') return
    setPage({ name, clientId })
    setOpen(false)
  }

  let content
  switch (page.name) {
    case 'clients':
      content = <ClientList go={go} />
      break
    case 'sales':
      content = <SalesList />
      break
    case 'finance':
      content = role === 'Administrador'
        ? <Report />
        : <p className="text-center">Acceso restringido</p>
      break
    case 'users':
      content = role === 'Administrador'
        ? <UsersList />
        : <p className="text-center">Acceso restringido</p>
      break
    case 'client':
      content = <ClientDetails id={page.clientId} go={go} />
      break
    default:
      content = <ClientList go={go} />
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {open && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-10"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`bg-blue-900 text-white w-60 p-4 space-y-2 fixed inset-y-0 left-0 transform ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform md:relative md:translate-x-0 z-20`}>
        <button
          className="md:hidden absolute top-2 right-2 text-2xl"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        <h1 className="text-lg font-semibold mb-4 text-center">Menú</h1>
        <nav className="flex flex-col gap-2">
          <button onClick={() => go('sales')} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-500 text-left group">
            <svg className="w-5 h-5 text-current group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"/>
            </svg>
            Ventas
          </button>
          <button onClick={() => go('clients')} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-500 text-left group">
            <svg className="w-5 h-5 text-current group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clip-rule="evenodd"/>
              <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z"/>
            </svg>
            Clientes
          </button>
          {role === 'Administrador' && (
            <>
            <button onClick={() => go('finance')} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-500 text-left group">
              <svg className="w-5 h-5 text-current group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z"/>
                <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clip-rule="evenodd"/>
              </svg>
              Finanzas
            </button>
            <button onClick={() => go('users')} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-blue-500 text-left group">
              <svg className="w-5 h-5 text-current group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M15.75 9A3.75 3.75 0 1112 5.25 3.75 3.75 0 0115.75 9zm-7.5 0A3.75 3.75 0 115 5.25 3.75 3.75 0 018.25 9zM3 20.25a8.25 8.25 0 1118 0v1.5H3v-1.5z"/>
              </svg>
              Usuarios
            </button>
            </>
          )}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="fixed top-0 left-0 right-0 md:left-60 md:right-4 bg-white shadow">
          <div className="px-4 py-2 text-center">
            <img src="/assets/logo.png" alt="Claus Vende" className="h-8 mx-auto" />
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden text-2xl mr-2"
                onClick={() => setOpen(!open)}
              >
                ☰
              </button>
              <div className="flex items-center gap-2">
                <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
                <div className="leading-tight">
                  <p className="font-semibold leading-tight md:hidden">{nombres}</p>
                  <p className="font-semibold leading-tight md:hidden">{apellidos}</p>
                  <p className="font-semibold leading-none hidden md:block">{user.displayName}</p>
                  <p className="text-xs text-gray-700">{role}</p>
                </div>
              </div>
            </div>
            <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Cerrar sesión</button>
          </div>
        </header>
        <main className="p-4 pt-36 md:pt-36 flex-1">{content}</main>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState({ name: 'clients' })

  return (
    <AuthProvider>
      <MainContent page={page} setPage={setPage} />
    </AuthProvider>
  )
}

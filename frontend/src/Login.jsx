import { useAuth } from './AuthProvider'

export default function Login() {
  const { login } = useAuth()
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow text-center space-y-4">
        <img src="/assets/logo.png" alt="Claus Vende" className="h-12 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-700">Ingresa</h2>
        <button onClick={login} className="bg-blue-900 text-white px-4 py-2 rounded">Iniciar sesión con Google</button>
      </div>
    </div>
  )
}

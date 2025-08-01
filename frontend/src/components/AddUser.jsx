import { doc, setDoc } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../firebase'

export default function AddUser({ onDone }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Vendedor')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email) return
    await setDoc(doc(db, 'usuarios', email), {
      createdAt: Date.now(),
      name,
      role
    })
    if (onDone) onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-center">Nuevo Usuario</h2>
      <input
        className="w-full border rounded px-3 py-2"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre"
        required
      />
      <input
        className="w-full border rounded px-3 py-2"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Correo"
        required
      />
      <select
        className="w-full border rounded px-3 py-2"
        value={role}
        onChange={e => setRole(e.target.value)}
      >
        <option value="Vendedor">Vendedor</option>
        <option value="Administrador">Administrador</option>
      </select>
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Guardar</button>
    </form>
  )
}

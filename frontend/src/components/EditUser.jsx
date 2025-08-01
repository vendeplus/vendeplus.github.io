import { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function EditUser({ user, onDone }) {
  const [name, setName] = useState('')

  useEffect(() => {
    setName(user.displayName || '')
  }, [user])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!name) return
    await updateDoc(doc(db, 'users', user.id), { displayName: name })
    if (onDone) onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-center">Editar nombre</h2>
      <input
        className="w-full border rounded px-3 py-2"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre"
        required
      />
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Guardar</button>
    </form>
  )
}

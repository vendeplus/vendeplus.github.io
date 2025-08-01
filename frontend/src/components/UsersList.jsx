import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Modal from './Modal'
import AddUser from './AddUser'
import EditUser from './EditUser'
import { db } from '../firebase'
import editIcon from '../assets/icons/edit.svg'
import plus from '../assets/icons/plus.svg'

export default function UsersList() {
  const [allowed, setAllowed] = useState([])
  const [users, setUsers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState(null)

  const load = async () => {
    const allowSnap = await getDocs(collection(db, 'usuarios'))
    setAllowed(allowSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    const usersSnap = await getDocs(collection(db, 'users'))
    setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { load() }, [])

  const removeAllow = async email => {
    await deleteDoc(doc(db, 'usuarios', email))
    load()
  }

  const changeRole = async (userId, email, role) => {
    if (userId) {
      await updateDoc(doc(db, 'users', userId), { role })
    }
    await updateDoc(doc(db, 'usuarios', email), { role })
    load()
  }

  const merged = allowed.map(a => {
    const user = users.find(u => u.email === a.id)
    return {
      email: a.id,
      name: user?.displayName || a.name,
      photoURL: user?.photoURL,
      role: user?.role || a.role || 'Vendedor',
      userId: user?.id
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded w-full sm:w-auto"
        >
          <img src={plus} alt="" className="w-5 h-5" />Nuevo usuario
        </button>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Usuarios Registrados</h3>
        <ul className="grid gap-2">
          {merged.map(u => (
            <li key={u.email} className="card sm:flex-row sm:items-center">
              <img
                src={u.photoURL || '/vite.svg'}
                alt="avatar"
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <p className="font-semibold">{u.name || u.email}</p>
                <p className="text-sm text-gray-600">{u.email}</p>
              </div>
              <select
                value={u.role}
                onChange={e => changeRole(u.userId, u.email, e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="Vendedor">Vendedor</option>
                <option value="Administrador">Administrador</option>
              </select>
              {u.userId && (
                <button onClick={() => setEditUser(users.find(us => us.id === u.userId))} title="Editar nombre">
                  <img src={editIcon} alt="editar" className="icon" />
                </button>
              )}
              <button onClick={() => removeAllow(u.email)} className="bg-red-500 text-white px-2 py-1 rounded">Eliminar</button>
            </li>
          ))}
        </ul>
      </div>
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <AddUser onDone={() => { setShowAdd(false); load() }} />
        </Modal>
      )}
      {editUser && (
        <Modal onClose={() => setEditUser(null)}>
          <EditUser user={editUser} onDone={() => { setEditUser(null); load() }} />
        </Modal>
      )}
    </div>
  )
}

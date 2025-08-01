import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { db } from '../firebase';
import AddClient from './AddClient';
import Modal from './Modal';
import AccountStatement from './AccountStatement';
import AddPayment from './AddPayment';
import eye from '../assets/icons/eye.svg';
import docIcon from '../assets/icons/doc.svg';
import chat from '../assets/icons/chat.svg';
import editIcon from '../assets/icons/edit.svg';
import trash from '../assets/icons/trash.svg';
import plus from '../assets/icons/plus.svg';
import dollar from '../assets/icons/dollar.svg';
import { formatMoney } from '../utils';

export default function ClientList({ go }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [statementId, setStatementId] = useState(null);
  const [payClientId, setPayClientId] = useState(null);
  const { role } = useAuth();

  const fetchClients = async () => {
    const snapshot = await getDocs(collection(db, 'clients'));
    setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const removeClient = async c => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    await deleteDoc(doc(db, 'clients', c.id));
    fetchClients();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <button
          onClick={() => setShow(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded w-full sm:w-auto"
        >
          <img src={plus} alt="" className="w-5 h-5" />Nuevo cliente
        </button>
        <div className="relative w-full sm:w-auto">
          <input
            className="border rounded px-3 py-2 pr-8 w-full"
            placeholder="Buscar cliente"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <ul className="grid gap-3">
        {filtered.map(c => {
          const cleanPhone = (c.phone || '').replace(/\D/g, '');
          return (
            <li key={c.id} className="card border-l-4 border-blue-500">
              <div className="flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-gray-800">Deuda: {`$${formatMoney(c.balance)}`}</p>
              </div>
              <span className="actions">
                <button onClick={() => go('client', c.id)} title="Ver">
                  <img src={eye} alt="ver" className="icon" />
                </button>
                <button onClick={() => setStatementId(c.id)} title="Estado">
                  <img src={docIcon} alt="estado" className="icon" />
                </button>
                <button onClick={() => setPayClientId(c.id)} title="Abono">
                  <img src={dollar} alt="abono" className="icon" />
                </button>
                {cleanPhone && (
                  <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" title="Mensaje">
                    <img src={chat} alt="mensaje" className="icon" />
                  </a>
                )}
                {role === 'Administrador' && (
                  <>
                    <button onClick={() => setEditClient(c)} title="Editar">
                      <img src={editIcon} alt="editar" className="icon" />
                    </button>
                    <button onClick={() => removeClient(c)} title="Eliminar">
                      <img src={trash} alt="eliminar" className="icon" />
                    </button>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {show && (
        <Modal onClose={() => setShow(false)}>
          <AddClient onDone={() => { setShow(false); fetchClients(); }} />
        </Modal>
      )}
      {editClient && (
        <Modal onClose={() => setEditClient(null)}>
          <AddClient client={editClient} onDone={() => { setEditClient(null); fetchClients(); }} />
        </Modal>
      )}
      {statementId && (
        <Modal onClose={() => setStatementId(null)}>
          <AccountStatement clientId={statementId} />
        </Modal>
      )}
      {payClientId && (
        <Modal onClose={() => setPayClientId(null)}>
          <AddPayment clientId={payClientId} onDone={() => { setPayClientId(null); fetchClients(); }} />
        </Modal>
      )}
    </div>
  );
}

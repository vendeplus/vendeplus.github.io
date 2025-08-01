import { collection, addDoc, onSnapshot, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { db } from '../firebase';
import AddClient from './AddClient';
import Modal from './Modal';
import editIcon from '../assets/icons/edit.svg';
import trash from '../assets/icons/trash.svg';
import { formatMoney, applyPaymentsToSales, parseLocalDate } from '../utils';

export default function ClientDetails({ id, go }) {
  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [amount, setAmount] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [editSaleAmount, setEditSaleAmount] = useState('');
  const [editSaleDate, setEditSaleDate] = useState('');
  const { role } = useAuth();

  useEffect(() => {
    const unsubClient = onSnapshot(doc(db, 'clients', id), snap => {
      setClient({ id: snap.id, ...snap.data() });
    });
  const unsubPay = onSnapshot(collection(db, 'clients', id, 'payments'), snap => {
    setPayments(
      snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.date - b.date)
    );
  });
  const unsubSales = onSnapshot(collection(db, 'clients', id, 'sales'), snap => {
    setSales(
      snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.date - b.date)
    );
  });
    return () => { unsubClient(); unsubPay(); unsubSales(); };
  }, [id]);

  const addPayment = async e => {
    e.preventDefault();
    if (!amount) return;
    const value = parseFloat(amount);
    await addDoc(collection(db, 'clients', id, 'payments'), {
      amount: value,
      date: Date.now()
    });
    await updateDoc(doc(db, 'clients', id), { balance: increment(-value) });
    setAmount('');
  };

  const startEdit = p => {
    setEditingId(p.id);
    setEditAmount(p.amount);
    setEditDate(new Date(p.date).toISOString().split('T')[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditDate('');
  };

  const saveEdit = async p => {
    const newValue = parseFloat(editAmount);
    if (isNaN(newValue) || !editDate) return;
    await updateDoc(doc(db, 'clients', id, 'payments', p.id), {
      amount: newValue,
      date: parseLocalDate(editDate),
    });
    const diff = newValue - p.amount;
    if (diff !== 0) {
      await updateDoc(doc(db, 'clients', id), { balance: increment(-diff) });
    }
    cancelEdit();
  };

  const removePayment = async p => {
    if (!window.confirm('¿Eliminar este abono?')) return;
    await deleteDoc(doc(db, 'clients', id, 'payments', p.id));
    await updateDoc(doc(db, 'clients', id), { balance: increment(p.amount) });
  };

  const startEditSale = s => {
    setEditingSaleId(s.id);
    setEditSaleAmount(s.amount);
    setEditSaleDate(new Date(s.date).toISOString().split('T')[0]);
  };

  const cancelEditSale = () => {
    setEditingSaleId(null);
    setEditSaleAmount('');
    setEditSaleDate('');
  };

  const saveEditSale = async s => {
    const newValue = parseFloat(editSaleAmount);
    if (isNaN(newValue) || !editSaleDate) return;
    await updateDoc(doc(db, 'clients', id, 'sales', s.id), {
      amount: newValue,
      date: parseLocalDate(editSaleDate),
    });
    const diff = newValue - s.amount;
    if (diff !== 0) {
      await updateDoc(doc(db, 'clients', id), {
        balance: increment(diff),
        total: increment(diff)
      });
    }
    cancelEditSale();
  };

  const removeSale = async s => {
    if (!window.confirm('¿Eliminar esta venta?')) return;
    await deleteDoc(doc(db, 'clients', id, 'sales', s.id));
    await updateDoc(doc(db, 'clients', id), {
      balance: increment(-s.amount),
      total: increment(-s.amount)
    });
  };

  const removeClient = async () => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    await deleteDoc(doc(db, 'clients', id));
    go('clients');
  };

  const salesData = applyPaymentsToSales(
    sales.map(s => ({ ...s })),
    payments
  );

  if (!client) return <p>Cargando...</p>;

  return (
    <div className="space-y-4">
      <button
        onClick={() => go('list')}
        className="bg-blue-500 text-white px-3 py-2 rounded"
      >
        Regresar
      </button>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {client.name}
        {role === 'Administrador' && (
          <>
            <button onClick={() => setEditMode(true)}>
              <img src={editIcon} alt="editar" className="icon" />
            </button>
            <button onClick={removeClient}>
              <img src={trash} alt="eliminar" className="icon" />
            </button>
          </>
        )}
      </h2>
      <p className="text-gray-800">Teléfono: {client.phone}</p>
      {client.notes && (
        <p className="text-gray-800">Observaciones: {client.notes}</p>
      )}
      <p className="text-gray-800">Deuda actual: ${formatMoney(client.balance)}</p>
      <form onSubmit={addPayment} className="flex gap-2">
        <input className="border rounded px-3 py-2 flex-1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monto del abono" type="number" step="0.01" />
        <button type="submit" className="bg-blue-500 text-white px-3 py-2 rounded">Registrar abono</button>
      </form>
      <div className="section">
        <h3 className="text-lg font-semibold flex items-center gap-2">🛍️ Ventas</h3>
        <ul className="grid gap-2">
          {salesData.map(s => (
            <li key={s.id} className="card">
              {role === 'Administrador' && editingSaleId === s.id ? (
                <>
                  <input
                    className="border rounded px-2 py-1 mr-2"
                    type="number"
                    step="0.01"
                    value={editSaleAmount}
                    onChange={e => setEditSaleAmount(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 mr-2"
                    type="date"
                    value={editSaleDate}
                    onChange={e => setEditSaleDate(e.target.value)}
                  />
                  <button onClick={() => saveEditSale(s)} className="bg-blue-500 text-white px-2 py-1 rounded mr-1">Guardar</button>
                  <button onClick={cancelEditSale} className="px-2 py-1 rounded border">Cancelar</button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm flex items-center gap-1"><span>📅</span>{new Date(s.date).toLocaleDateString()}</p>
                    <p className="text-sm flex items-center gap-1"><span>🛍️</span>{s.description}</p>
                    <p className="text-sm flex items-center gap-1 font-medium"><span>💲</span>${formatMoney(s.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${s.pagada ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{s.pagada ? '✅ Pagada' : '⚠️ Pendiente'}</span>
                    {role === 'Administrador' && (
                      <>
                        <button onClick={() => startEditSale(s)} title="Editar">
                          <img src={editIcon} alt="editar" className="icon" />
                        </button>
                        <button onClick={() => removeSale(s)} title="Eliminar">
                          <img src={trash} alt="eliminar" className="icon" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3 className="text-lg font-semibold flex items-center gap-2">💸 Abonos</h3>
        <ul className="grid gap-2">
          {payments.map(p => (
            <li key={p.id} className="card">
              {editingId === p.id ? (
                <>
                  <input
                    className="border rounded px-2 py-1 mr-2"
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 mr-2"
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                  />
                  <button onClick={() => saveEdit(p)} className="bg-blue-500 text-white px-2 py-1 rounded mr-1">Guardar</button>
                  <button onClick={cancelEdit} className="px-2 py-1 rounded border">Cancelar</button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm flex items-center gap-1"><span>📅</span>{new Date(p.date).toLocaleDateString()}</p>
                    <p className="text-sm flex items-center gap-1 font-medium"><span>💲</span>${formatMoney(p.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(p)} title="Editar">
                      <img src={editIcon} alt="editar" className="icon" />
                    </button>
                    <button onClick={() => removePayment(p)} title="Eliminar">
                      <img src={trash} alt="eliminar" className="icon" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      {role === 'Administrador' && editMode && (
        <Modal onClose={() => setEditMode(false)}>
          <AddClient client={client} onDone={() => setEditMode(false)} />
        </Modal>
      )}
    </div>
  );
}

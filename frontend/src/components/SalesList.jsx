import { collection, getDocs, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { db } from '../firebase';
import AddSale from './AddSale';
import Modal from './Modal';
import plus from '../assets/icons/plus.svg';
import editIcon from '../assets/icons/edit.svg';
import trash from '../assets/icons/trash.svg';
import { formatMoney } from '../utils';

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const { role } = useAuth();

  const fetchSales = async () => {
    const clientSnap = await getDocs(collection(db, 'clients'));
    const all = [];
    for (const c of clientSnap.docs) {
      const salesSnap = await getDocs(collection(db, 'clients', c.id, 'sales'));
      salesSnap.forEach(s => {
        all.push({
          id: s.id,
          clientId: c.id,
          clientName: c.data().name,
          ...s.data(),
        });
      });
    }
    setSales(all);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const removeSale = async sale => {
    if (!window.confirm('¿Eliminar esta venta?')) return;
    await deleteDoc(doc(db, 'clients', sale.clientId, 'sales', sale.id));
    await updateDoc(doc(db, 'clients', sale.clientId), {
      balance: increment(-sale.amount),
      total: increment(-sale.amount),
    });
    fetchSales();
  };

  const filtered = sales.filter(s =>
    s.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <button
          onClick={() => setShow(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded w-full sm:w-auto"
        >
          <img src={plus} alt="" className="w-5 h-5" />Nueva venta
        </button>
        <div className="relative w-full sm:w-auto">
          <input
            className="border rounded px-3 py-2 pr-8 w-full"
            placeholder="Buscar por cliente"
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
        {filtered.map(s => (
          <li
            key={`${s.clientId}-${s.id}`}
            className="card border-l-4 border-blue-500"
          >
            <div className="flex-1">
              <p className="font-semibold">{s.clientName}</p>
              <p className="text-sm text-gray-800">
                {new Date(s.date).toLocaleDateString()} - {s.description} - ${formatMoney(s.amount)}
              </p>
            </div>
            <span className="actions">
              {role === 'Administrador' && (
                <>
                  <button onClick={() => setEditSale(s)} title="Editar">
                    <img src={editIcon} alt="editar" className="icon" />
                  </button>
                  <button onClick={() => removeSale(s)} title="Eliminar">
                    <img src={trash} alt="eliminar" className="icon" />
                  </button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      {show && (
        <Modal onClose={() => setShow(false)}>
          <AddSale onDone={() => { setShow(false); fetchSales(); }} />
        </Modal>
      )}
      {role === 'Administrador' && editSale && (
        <Modal onClose={() => setEditSale(null)}>
          <AddSale sale={editSale} onDone={() => { setEditSale(null); fetchSales(); }} />
        </Modal>
      )}
    </div>
  );
}

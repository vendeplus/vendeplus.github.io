import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db } from '../firebase';

export default function AddClient({ go, onDone, client }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone((client.phone || '').replace(/\D/g, ''));
      setNotes(client.notes || '');
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: name.toUpperCase(),
      phone: phone ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)} ${phone.slice(6, 10)}` : '',
      notes: notes.toUpperCase(),
    };
    if (client) {
      await updateDoc(doc(db, 'clients', client.id), payload);
    } else {
      await addDoc(collection(db, 'clients'), { ...payload, balance: 0 });
    }
    if (onDone) onDone();
    else go('list');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-center">{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
      <input
        className="w-full border rounded px-3 py-2"
        value={name}
        onChange={e => setName(e.target.value.toUpperCase())}
        placeholder="Nombre"
        required
      />
      <input
        className="w-full border rounded px-3 py-2"
        value={phone}
        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder="Teléfono"
        pattern="\d{10}"
      />
      <input
        className="w-full border rounded px-3 py-2"
        value={notes}
        onChange={e => setNotes(e.target.value.toUpperCase())}
        placeholder="Observaciones"
      />
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Guardar</button>
    </form>
  );
}

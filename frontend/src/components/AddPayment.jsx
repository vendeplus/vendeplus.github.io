import { collection, addDoc, updateDoc, increment, doc } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../firebase';
import { parseLocalDate } from '../utils';

export default function AddPayment({ clientId, onDone }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async e => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (isNaN(value) || !date) return;
    await addDoc(collection(db, 'clients', clientId, 'payments'), {
      amount: value,
      date: parseLocalDate(date),
    });
    await updateDoc(doc(db, 'clients', clientId), {
      balance: increment(-value),
    });
    if (onDone) onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-center">Registrar abono</h2>
      <input
        className="w-full border rounded px-3 py-2"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Monto del abono"
        type="number"
        step="0.01"
        required
      />
      <input
        className="w-full border rounded px-3 py-2"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Guardar</button>
    </form>
  );
}

import { collection, getDocs, doc, addDoc, updateDoc, increment } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { db } from '../firebase';
import { formatMoney, parseLocalDate } from '../utils';

export default function AddSale({ go, onDone, sale }) {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(sale?.clientId || '');
  const [amount, setAmount] = useState(sale?.amount || '');
  const [desc, setDesc] = useState((sale?.description || '').toUpperCase());
  const [date, setDate] = useState(() => {
    if (sale?.date) return new Date(sale.date).toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'clients'));
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  useEffect(() => {
    if (sale) {
      setClientId(sale.clientId);
      setAmount(sale.amount);
      setDesc(sale.description.toUpperCase());
      setDate(new Date(sale.date).toISOString().split('T')[0]);
    }
  }, [sale]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!clientId || !amount || !desc || !date) return;
    const value = parseFloat(amount);
    const ref = doc(db, 'clients', clientId);
    if (sale) {
      const diff = value - sale.amount;
      await updateDoc(doc(ref, 'sales', sale.id), {
        amount: value,
        description: desc.toUpperCase(),
        date: parseLocalDate(date)
      });
      if (diff !== 0) {
        await updateDoc(ref, { balance: increment(diff), total: increment(diff) });
      }
    } else {
      const ts = parseLocalDate(date);
      await addDoc(collection(ref, 'sales'), { amount: value, description: desc.toUpperCase(), date: ts });
      await updateDoc(ref, { balance: increment(value), total: increment(value) });

      const client = clients.find(c => c.id === clientId);
      if (client) {
        const pdf = new jsPDF({ unit: 'mm', format: [58, 100] });

        // Encabezado
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('Vende Más', 29, 8, { align: 'center' });
        pdf.setLineWidth(0.1);
        pdf.line(5, 11, 53, 11);

        // Datos del cliente
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(String(`Cliente: ${client.name}`), 5, 17);
        pdf.text(String(`Fecha: ${new Date(ts).toLocaleString()}`), 5, 23);
        pdf.line(5, 26, 53, 26);

        // Detalle de la venta
        pdf.setFont('helvetica', 'bold');
        pdf.text('Descripción', 5, 32);
        pdf.text('Monto', 53, 32, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(desc), 5, 38);
        pdf.text(String(`$${formatMoney(value)}`), 53, 38, { align: 'right' });
        pdf.line(5, 44, 53, 44);

        // Total
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTAL:', 40, 50, { align: 'right' });
        pdf.setFontSize(14);
        pdf.text(String(`$${formatMoney(value)}`), 53, 50, { align: 'right' });

        // Pie de página
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text('¡Gracias por tu compra!', 29, 96, { align: 'center' });

        pdf.save('ticket.pdf');
      }
    }
    if (onDone) onDone(clientId);
    else go('client', clientId);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-center">{sale ? 'Editar Venta' : 'Nueva Venta'}</h2>
      {sale ? (
        <p className="font-medium">Cliente: {sale.clientName}</p>
      ) : (
        <select
          className="w-full border rounded px-3 py-2"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          required
        >
          <option value="" disabled>Selecciona un cliente</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      <input
        className="w-full border rounded px-3 py-2"
        value={desc}
        onChange={e => setDesc(e.target.value.toUpperCase())}
        placeholder="Descripción"
        required
      />
      <input
        className="w-full border rounded px-3 py-2"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Monto"
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
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">{sale ? 'Guardar cambios' : 'Registrar venta'}</button>
    </form>
  );
}

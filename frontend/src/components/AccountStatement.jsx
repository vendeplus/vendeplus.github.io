import { collection, getDoc, getDocs, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import { formatMoney, applyPaymentsToSales, mapPaymentsToSales } from '../utils';

export default function AccountStatement({ clientId }) {
  const [client, setClient] = useState(null);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const load = async () => {
      const cSnap = await getDoc(doc(db, 'clients', clientId));
      if (!cSnap.exists()) return;
      setClient({ id: cSnap.id, ...cSnap.data() });
      const salesSnap = await getDocs(collection(db, 'clients', clientId, 'sales'));
      const salesData = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const paySnap = await getDocs(collection(db, 'clients', clientId, 'payments'));
      const payData = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyPaymentsToSales(salesData, payData);
      const mappedPays = mapPaymentsToSales(salesData, payData);
      setSales(salesData);
      setPayments(mappedPays);
    };
    load();
  }, [clientId]);

  const exportPdf = () => {
    const pdf = new jsPDF({ format: 'a5' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let y = margin;

    pdf.setFontSize(16);
    pdf.text('Vende Más', pageWidth / 2, y, { align: 'center' });
    y += 7;
    pdf.setFontSize(12);
    pdf.text('Estado de Cuenta', pageWidth / 2, y, { align: 'center' });
    y += 3;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.text(String(`Nombre: ${client.name}`), margin, y);
    y += 4;
    pdf.text(String(`Teléfono: ${client.phone}`), margin, y);
    y += 4;
    pdf.text(String(`Fecha: ${new Date().toLocaleDateString()}`), margin, y);
    y += 6;

    pdf.setFontSize(12);
    pdf.text('Resumen', margin, y);
    y += 5;
    pdf.setFontSize(10);
    const resumen = [
      ['Total comprado', formatMoney(totalSales)],
      ['Total abonado', formatMoney(totalPayments)],
      ['Saldo pendiente', formatMoney(totalSales - totalPayments)],
    ];
    pdf.setFont(undefined, 'bold');
    resumen.forEach(r => {
      pdf.text(String(r[0]), margin, y);
      pdf.text(String(`$${r[1]}`), pageWidth - margin, y, { align: 'right' });
      y += 4;
    });
    pdf.setFont(undefined, 'normal');
    y += 4;

    pdf.setFontSize(12);
    pdf.text('Detalle de ventas', margin, y);
    y += 4;
    pdf.setFontSize(10);
    const col = [margin, margin + 30, pageWidth - 55, pageWidth - 35, pageWidth - margin];
    pdf.setFont(undefined, 'bold');
    pdf.text('Fecha', col[0], y);
    pdf.text('Producto', col[1], y);
    pdf.text('Monto', col[2], y, { align: 'right' });
    pdf.text('Abonado', col[3], y, { align: 'right' });
    pdf.text('Saldo', col[4], y, { align: 'right' });
    pdf.setFont(undefined, 'normal');
    y += 2;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 4;

    sales
      .sort((a, b) => a.date - b.date)
      .forEach(s => {
        pdf.text(String(new Date(s.date).toLocaleDateString()), col[0], y);
        pdf.text(String(s.description), col[1], y);
        pdf.text(String(`$${formatMoney(s.amount)}`), col[2], y, { align: 'right' });
        pdf.text(String(`$${formatMoney(s.abonado)}`), col[3], y, { align: 'right' });
        pdf.text(String(s.pagada ? '✔' : `$${formatMoney(s.pendiente)}`), col[4], y, { align: 'right' });
        y += 4;
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      });

    y += 6;
    pdf.setFontSize(12);
    pdf.text('Detalle de abonos', margin, y);
    y += 4;
    pdf.setFontSize(10);
    const pcol = [margin, margin + 30, pageWidth - margin];
    pdf.setFont(undefined, 'bold');
    pdf.text('Fecha', pcol[0], y);
    pdf.text('Venta', pcol[1], y);
    pdf.text('Monto', pcol[2], y, { align: 'right' });
    pdf.setFont(undefined, 'normal');
    y += 2;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 4;

    payments
      .sort((a, b) => a.date - b.date)
      .forEach(p => {
        pdf.text(String(new Date(p.date).toLocaleDateString()), pcol[0], y);
        if (p.saleDescription) pdf.text(String(p.saleDescription), pcol[1], y);
        pdf.text(String(`$${formatMoney(p.amount)}`), pcol[2], y, { align: 'right' });
        y += 4;
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      });

    pdf.setFontSize(9);
    pdf.text('¡Gracias por su preferencia!', pageWidth / 2, pageHeight - margin, { align: 'center' });

    pdf.save(`estado-${client.name}.pdf`);
  };

  if (!client) return <p>Cargando...</p>;

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold flex items-center justify-center gap-2">
        <span role="img" aria-hidden="true">📋</span>
        Estado de cuenta
      </h2>

      <div className="bg-gray-50 rounded-lg p-4 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <p><span className="font-semibold">Nombre:</span> {client.name}</p>
        <p><span className="font-semibold">Teléfono:</span> {client.phone}</p>
        {client.notes && (
          <p className="sm:col-span-2"><span className="font-semibold">Notas:</span> {client.notes}</p>
        )}
        <p className="sm:col-span-2"><span className="font-semibold">Saldo actual:</span> ${formatMoney(client.balance)}</p>
      </div>

      <hr className="border-gray-300" />

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Ventas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-right">Monto</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sales
                .slice()
                .sort((a, b) => a.date - b.date)
                .map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="p-2">{s.description}</td>
                    <td className="p-2 text-right">${formatMoney(s.amount)}</td>
                    <td className="p-2 text-center">
                      {s.pagada ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">✔ Pagada</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">⏳ Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-gray-300" />

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Abonos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Venta</th>
                <th className="p-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {payments
                .slice()
                .sort((a, b) => a.date - b.date)
                .map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="p-2">{p.saleDescription || ''}</td>
                    <td className="p-2 text-right">${formatMoney(p.amount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-gray-300" />

      <div className="space-y-1 text-right">
        <p className="font-semibold">Total compras: ${formatMoney(totalSales)}</p>
        <p className="font-semibold">Total abonos: ${formatMoney(totalPayments)}</p>
      </div>

      <div className="text-center">
        <button
          onClick={exportPdf}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
        >
          <span role="img" aria-hidden="true">🖨️</span>
          Generar PDF
        </button>
      </div>
    </div>
  );
}

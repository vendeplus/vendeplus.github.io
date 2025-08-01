import { collection, getDocs, setDoc, doc } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import chat from '../assets/icons/chat.svg'
import dollar from '../assets/icons/dollar.svg'
import cart from '../assets/icons/cart.svg'
import users from '../assets/icons/users.svg'
import Modal from './Modal'
import AddPayment from './AddPayment'
import { db } from '../firebase'
import { formatMoney } from '../utils'

export default function Report() {
  const [metrics, setMetrics] = useState({
    outstanding: 0,
    monthlyPayments: 0,
    totalSales: 0,
    recoveryRate: 0,
    avgPayDays: 0,
    topDebtor: null,
    dueBalance: 0,
    overdueBalance: 0,
    monthlySales: []
  })
  const [debtors, setDebtors] = useState([])
  const [payClientId, setPayClientId] = useState(null)
  const fileRef = useRef(null)

  const load = async () => {
    const snap = await getDocs(collection(db, 'clients'))
    const now = Date.now()
    const monthMs = 30 * 24 * 60 * 60 * 1000
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    const salesMap = {}
    let outstanding = 0
    let totalSales = 0
    let monthlyPayments = 0
    let totalPayDays = 0
    let payCount = 0
    let topDebtor = { balance: 0 }
    let dueBalance = 0
    let overdueBalance = 0
    const overdueClients = []
    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      const clientId = docSnap.id
      const balance = data.balance || 0
      const name = data.name
      outstanding += balance
      if (balance > topDebtor.balance) topDebtor = { id: clientId, name, balance }

      const salesSnap = await getDocs(collection(db, 'clients', clientId, 'sales'))
      const paymentSnap = await getDocs(collection(db, 'clients', clientId, 'payments'))
      const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date - b.date)
      const payments = paymentSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date - b.date)

      sales.forEach(s => {
        totalSales += s.amount
        const d = new Date(s.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        salesMap[key] = (salesMap[key] || 0) + 1
      })

      payments.forEach(p => {
        if (p.date >= startOfMonth) monthlyPayments += p.amount
      })

      if (balance > 0) {
        let lastPayment = 0
        payments.forEach(p => { if (p.date > lastPayment) lastPayment = p.date })
        if (!lastPayment && sales.length) lastPayment = sales[sales.length - 1].date
        if (now - lastPayment >= monthMs) {
          overdueBalance += balance
          overdueClients.push({ id: clientId, name, phone: data.phone, balance, lastPayment })
        } else {
          dueBalance += balance
        }
      }

      const queue = sales.map(s => ({ date: s.date, remaining: s.amount }))
      for (const p of payments) {
        let amount = p.amount
        while (amount > 0 && queue.length) {
          const s = queue[0]
          const used = Math.min(s.remaining, amount)
          totalPayDays += (p.date - s.date) / (1000 * 60 * 60 * 24)
          payCount++
          s.remaining -= used
          amount -= used
          if (s.remaining <= 0) queue.shift()
          else break
        }
      }
    }

    const monthsToShow = 6
    const keys = Object.keys(salesMap).sort()
    let months = keys.slice(-monthsToShow).map(m => ({ month: m, count: salesMap[m] }))
    if (months.length === 0) {
      const nowDate = new Date()
      months = []
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        months.push({ month: key, count: salesMap[key] || 0 })
      }
    }

    const recoveryRate = totalSales ? (monthlyPayments / totalSales) * 100 : 0
    const avgPayDays = payCount ? totalPayDays / payCount : 0

    setMetrics({
      outstanding,
      monthlyPayments,
      totalSales,
      recoveryRate,
      avgPayDays,
      topDebtor,
      dueBalance,
      overdueBalance,
      monthlySales: months
    })
    setDebtors(overdueClients)
  }

  useEffect(() => {
    load();
  }, []);

  const exportDb = async () => {
    const data = {};
    const clientSnap = await getDocs(collection(db, 'clients'));
    const clients = [];
    for (const c of clientSnap.docs) {
      const salesSnap = await getDocs(collection(db, 'clients', c.id, 'sales'));
      const paymentsSnap = await getDocs(collection(db, 'clients', c.id, 'payments'));
      clients.push({
        id: c.id,
        ...c.data(),
        sales: salesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        payments: paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      });
    }
    data.clients = clients;
    const usuariosSnap = await getDocs(collection(db, 'usuarios'));
    data.usuarios = usuariosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const usersSnap = await getDocs(collection(db, 'users'));
    data.users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDb = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.clients) {
      for (const c of data.clients) {
        await setDoc(doc(db, 'clients', c.id), {
          name: c.name,
          phone: c.phone,
          notes: c.notes,
          balance: c.balance,
          total: c.total
        });
        if (c.sales) for (const s of c.sales) await setDoc(doc(db, 'clients', c.id, 'sales', s.id), { amount: s.amount, date: s.date });
        if (c.payments) for (const p of c.payments) await setDoc(doc(db, 'clients', c.id, 'payments', p.id), { amount: p.amount, date: p.date });
      }
    }
    if (data.usuarios) for (const u of data.usuarios) await setDoc(doc(db, 'usuarios', u.id), u);
    if (data.users) for (const u of data.users) await setDoc(doc(db, 'users', u.id), u);
    alert('Importación completada');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Panel de Finanzas</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <img src={dollar} alt="" className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-sm text-gray-600">Saldo por cobrar</p>
              <p className="text-lg font-bold">{`$${formatMoney(metrics.outstanding)}`}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <img src={dollar} alt="" className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Abonos del mes</p>
              <p className="text-lg font-bold">{`$${formatMoney(metrics.monthlyPayments)}`}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <img src={cart} alt="" className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-sm text-gray-600">Total ventas a crédito</p>
              <p className="text-lg font-bold">{`$${formatMoney(metrics.totalSales)}`}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M2.25 13.5A8.25 8.25 0 0110.5 5.25V3a.75.75 0 011.5 0v2.25A8.25 8.25 0 0120.25 13.5h2.25a.75.75 0 010 1.5H20.25A8.25 8.25 0 0111.25 23.25v2.25a.75.75 0 01-1.5 0v-2.25A8.25 8.25 0 012.25 15H0a.75.75 0 010-1.5h2.25z"/>
          </svg>
          <div>
            <p className="text-sm text-gray-600">Recuperación</p>
            <p className="text-lg font-bold">{metrics.recoveryRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12 1.5a10.5 10.5 0 100 21 10.5 10.5 0 000-21zM12 3a9 9 0 110 18A9 9 0 0112 3zm-.75 4.5a.75.75 0 011.5 0v4.336l3.404 1.967a.75.75 0 01-.758 1.288l-3.75-2.167A.75.75 0 0111.25 12V7.5z" clipRule="evenodd"/>
          </svg>
          <div>
            <p className="text-sm text-gray-600">Promedio de pago (días)</p>
            <p className="text-lg font-bold">{metrics.avgPayDays.toFixed(1)}</p>
          </div>
        </div>
        {metrics.topDebtor && (
          <div className="bg-white p-4 rounded shadow flex items-center gap-3">
            <img src={users} alt="" className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Mayor saldo</p>
              <p className="text-lg font-bold">{`${metrics.topDebtor.name} - $${formatMoney(metrics.topDebtor.balance)}`}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium mb-2">Ventas a crédito por mes</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className="px-2 py-1 border-b text-center">Mes</th>
              <th className="px-2 py-1 border-b text-center">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {metrics.monthlySales.map(m => (
              <tr key={m.month} className="odd:bg-gray-50">
                <td className="px-2 py-1 border-b">{m.month}</td>
                <td className="px-2 py-1 border-b text-center">{m.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {debtors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Clientes Morosos</h3>
          <ul className="grid gap-3">
            {debtors.map(d => {
              const cleanPhone = (d.phone || '').replace(/\D/g, '')
              return (
                <li key={d.id} className="card border-l-4 border-red-500">
                  <div className="flex-1">
                    <p className="font-semibold">{`${d.name} - $${formatMoney(d.balance)}`}</p>
                    <p className="text-sm text-gray-700">Último abono: {new Date(d.lastPayment).toLocaleDateString()}</p>
                  </div>
                  <span className="actions">
                    <button onClick={() => setPayClientId(d.id)} title="Abono">
                      <img src={dollar} alt="abono" className="icon" />
                    </button>
                    {cleanPhone && (
                      <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" title="Mensaje">
                        <img src={chat} alt="mensaje" className="icon" />
                      </a>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {payClientId && (
        <Modal onClose={() => setPayClientId(null)}>
          <AddPayment clientId={payClientId} onDone={() => { setPayClientId(null); load() }} />
        </Modal>
      )}

      <div className="flex gap-2">
        <button onClick={exportDb} className="bg-blue-500 text-white px-3 py-1 rounded">Exportar DB</button>
        <button onClick={() => fileRef.current.click()} className="bg-blue-500 text-white px-3 py-1 rounded">Importar DB</button>
      </div>
      <input type="file" accept="application/json" ref={fileRef} style={{ display: 'none' }} onChange={importDb} />
    </div>
  )
}

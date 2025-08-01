export function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Convierte una fecha en formato YYYY-MM-DD a la marca de tiempo local a
// medianoche. Esto evita el desfase de zona horaria que ocurre al usar
// `new Date(string)` directamente.
export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

// Aplica abonos a las ventas en orden cronológico, actualizando
// los campos `abonado`, `pendiente` y `pagada` de cada venta.
export function applyPaymentsToSales(sales, payments) {
  const sortedSales = [...sales].sort((a, b) => a.date - b.date);
  const sortedPayments = [...payments].sort((a, b) => a.date - b.date);

  let payIndex = 0;
  let remaining = sortedPayments[payIndex]?.amount || 0;

  for (const sale of sortedSales) {
    let paid = 0;
    while (payIndex < sortedPayments.length && paid < sale.amount) {
      const toUse = Math.min(remaining, sale.amount - paid);
      paid += toUse;
      remaining -= toUse;
      if (remaining === 0) {
        payIndex += 1;
        remaining = sortedPayments[payIndex]?.amount || 0;
      }
    }
    sale.abonado = paid;
    sale.pendiente = Math.max(0, sale.amount - paid);
    sale.pagada = sale.pendiente === 0;
  }

  return sales;
}

// Retorna los abonos indicando la primera venta a la que se aplicó cada uno
export function mapPaymentsToSales(sales, payments) {
  const sortedSales = [...sales].sort((a, b) => a.date - b.date);
  const result = [...payments]
    .sort((a, b) => a.date - b.date)
    .map(p => ({ ...p }));

  let saleIndex = 0;
  let remainingSale = sortedSales[saleIndex]?.amount || 0;

  for (const p of result) {
    let remainingPay = p.amount;
    while (saleIndex < sortedSales.length && remainingPay > 0) {
      if (!p.saleId) {
        p.saleId = sortedSales[saleIndex].id;
        p.saleDescription = sortedSales[saleIndex].description;
      }
      const toUse = Math.min(remainingPay, remainingSale);
      remainingPay -= toUse;
      remainingSale -= toUse;
      if (remainingSale === 0) {
        saleIndex += 1;
        remainingSale = sortedSales[saleIndex]?.amount || 0;
      }
    }
  }

  return result;
}

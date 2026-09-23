function normalizeSelectedServices(selectedServices) {
  if (!Array.isArray(selectedServices)) return [];

  return selectedServices
    .filter((item) => item && item.id)
    .map((item) => {
      const qty = Math.max(1, Math.floor(Number(item.qty) || 0));
      if (!qty) return null;
      return {
        id: String(item.id),
        name: String(item.name || '').trim(),
        price: Number(item.price) || 0,
        qty,
        itemType: item.itemType === 'Produto' ? 'Produto' : 'Servico'
      };
    })
    .filter(Boolean);
}

function buildServiceSummary(selectedServices) {
  const services = normalizeSelectedServices(selectedServices);
  return services
    .map((item) => `${item.name} x${item.qty}`)
    .join(', ');
}

module.exports = {
  normalizeSelectedServices,
  buildServiceSummary
};

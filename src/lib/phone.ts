export const normalizeNigerianPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+234')) return cleaned;
  if (cleaned.startsWith('234')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+234' + cleaned.slice(1);
  if (cleaned.length >= 10) return '+234' + cleaned;
  return cleaned;
};

export const getWhatsAppLink = (phone: string, message?: string): string => {
  const normalized = normalizeNigerianPhone(phone);
  const number = normalized.replace(/[^0-9]/g, '');
  if (!number) return '';
  const url = `https://wa.me/${number}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
};

export const getCallLink = (phone: string): string => {
  const normalized = normalizeNigerianPhone(phone);
  return normalized ? `tel:${normalized}` : '';
};

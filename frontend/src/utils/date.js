export const parseLocalDate = (dateValue) => {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    const d = new Date(dateValue.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (typeof dateValue === 'string') {
    const parts = dateValue.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const toLocalDateString = (dateValue) => {
  const d = parseLocalDate(dateValue);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

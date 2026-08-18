export const getTrailingNumber = (str) => {
  if (!str) return 0;
  const match = str.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
};
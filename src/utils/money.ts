export const parseNumberWithSuffix = (value: string): number | null => {
  // Remove all spaces and convert to lowercase
  const cleaned = value.replace(/\s+/g, '').toLowerCase();
  
  // Match number followed by optional suffix
  const match = cleaned.match(/^(-?\d*\.?\d+)(k|m|b)?$/);
  if (!match) return null;

  const [, num, suffix] = match;
  const baseValue = parseFloat(num);
  
  if (isNaN(baseValue)) return null;

  switch (suffix) {
    case 'k': return baseValue * 1000;
    case 'm': return baseValue * 1000000;
    case 'b': return baseValue * 1000000000;
    default: return baseValue;
  }
};

export const formatMoney = (value: number): string => {
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (absValue >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

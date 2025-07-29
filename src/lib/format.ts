export function formatCurrency(amount: number) {
  if (typeof amount !== 'number') {
    return "0 د.ع";
  }
  return `${amount.toLocaleString('en-US')} د.ع`;
}

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  termMonths: number
) => {
  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return Number((principal / termMonths).toFixed(2));
  }

  const payment =
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

  return Number(payment.toFixed(2));
};

export const calculateTotalPayment = (
  principal: number,
  annualRate: number,
  termMonths: number
) => {
  return Number((calculateMonthlyPayment(principal, annualRate, termMonths) * termMonths).toFixed(2));
};

export const calculateOverpayment = (
  principal: number,
  annualRate: number,
  termMonths: number
) => {
  return Number((calculateTotalPayment(principal, annualRate, termMonths) - principal).toFixed(2));
};
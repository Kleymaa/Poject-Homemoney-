import {
  calculateMonthlyPayment,
  calculateTotalPayment,
  calculateOverpayment,
} from '../src/utils/loan';

describe('Loan calculations', () => {
  it('should calculate annuity values correctly', () => {
    const monthly = calculateMonthlyPayment(60000, 12, 12);
    const total = calculateTotalPayment(60000, 12, 12);
    const overpayment = calculateOverpayment(60000, 12, 12);

    expect(monthly).toBeGreaterThan(0);
    expect(total).toBeGreaterThan(60000);
    expect(overpayment).toBeGreaterThan(0);
  });
});
import { query } from '../db';
import { calculateMonthlyPayment, calculateOverpayment, calculateTotalPayment } from '../utils/loan';
import { ensureAdultOwnsResource, ensureNotChild } from './permission.service';
import { AppError } from '../utils/AppError';
import { writeActionLog } from '../utils/logger';

export const createLoan = async (
  userId: string,
  payload: {
    familyId?: string | null;
    name: string;
    principal: number;
    annualRate: number;
    termMonths: number;
    startDate: string;
  }
) => {
  await ensureNotChild(userId, payload.familyId);

  const monthlyPayment = calculateMonthlyPayment(payload.principal, payload.annualRate, payload.termMonths);
  const totalPayment = calculateTotalPayment(payload.principal, payload.annualRate, payload.termMonths);
  const overpayment = calculateOverpayment(payload.principal, payload.annualRate, payload.termMonths);

  const result = await query(
    `
      INSERT INTO loans (
        user_id, family_id, name, principal, annual_rate, term_months,
        monthly_payment, total_payment, overpayment, start_date,
        created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
      RETURNING *
    `,
    [
      userId,
      payload.familyId || null,
      payload.name,
      payload.principal,
      payload.annualRate,
      payload.termMonths,
      monthlyPayment,
      totalPayment,
      overpayment,
      payload.startDate,
    ]
  );

  await writeActionLog({
    userId,
    familyId: payload.familyId || null,
    action: 'CREATE_LOAN',
    entityType: 'loan',
    entityId: result.rows[0].id,
  });

  return result.rows[0];
};

export const getLoans = async (userId: string) => {
  const result = await query(
    `
      SELECT * FROM loans
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

export const getLoanById = async (userId: string, loanId: string) => {
  const result = await query(
    `
      SELECT * FROM loans
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    `,
    [loanId, userId]
  );

  if (!result.rows[0]) throw new AppError('Loan not found', 404);
  return result.rows[0];
};

export const updateLoan = async (
  userId: string,
  loanId: string,
  payload: {
    name?: string;
    principal?: number;
    annualRate?: number;
    termMonths?: number;
    startDate?: string;
  }
) => {
  const currentRes = await query(`SELECT * FROM loans WHERE id = $1 AND deleted_at IS NULL`, [loanId]);
  const current = currentRes.rows[0];

  if (!current) throw new AppError('Loan not found', 404);

  await ensureAdultOwnsResource(userId, current.user_id, current.family_id);

  const principal = payload.principal ?? Number(current.principal);
  const annualRate = payload.annualRate ?? Number(current.annual_rate);
  const termMonths = payload.termMonths ?? Number(current.term_months);

  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const totalPayment = calculateTotalPayment(principal, annualRate, termMonths);
  const overpayment = calculateOverpayment(principal, annualRate, termMonths);

  const result = await query(
    `
      UPDATE loans
      SET
        name = $1,
        principal = $2,
        annual_rate = $3,
        term_months = $4,
        monthly_payment = $5,
        total_payment = $6,
        overpayment = $7,
        start_date = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `,
    [
      payload.name ?? current.name,
      principal,
      annualRate,
      termMonths,
      monthlyPayment,
      totalPayment,
      overpayment,
      payload.startDate ?? current.start_date,
      loanId,
    ]
  );

  return result.rows[0];
};

export const deleteLoan = async (userId: string, loanId: string) => {
  const currentRes = await query(`SELECT * FROM loans WHERE id = $1 AND deleted_at IS NULL`, [loanId]);
  const current = currentRes.rows[0];

  if (!current) throw new AppError('Loan not found', 404);

  await ensureAdultOwnsResource(userId, current.user_id, current.family_id);

  await query(`UPDATE loans SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [loanId]);

  return { message: 'Loan deleted' };
};
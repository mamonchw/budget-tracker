import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';

const jsonToCsv = (data: any[]) => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
};

export const getMonthlyReport = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.userId!;
    const { month, year, format } = req.query;

    if (!month || !year) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Month and year are required.'));
    }

    const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
    const endOfMonth = new Date(Number(year), Number(month), 0);

    const expenses = await prisma.expense.findMany({
      where: {
        user_id: userId,
        expense_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      orderBy: { expense_date: 'asc' }
    });

    if (format === 'csv') {
      const csvData = expenses.map(e => ({
        Date: e.expense_date.toISOString().split('T')[0],
        Category: e.category,
        Description: e.description || '',
        Amount: Number(e.amount)
      }));
      const csv = jsonToCsv(csvData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${year}-${month}.csv"`);
      return res.status(200).send(csv);
    }

    const totalSpending = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const averageExpense = expenses.length > 0 ? totalSpending / expenses.length : 0;
    
    const categorySpending: Record<string, number> = {};
    expenses.forEach(e => {
      categorySpending[e.category] = (categorySpending[e.category] || 0) + Number(e.amount);
    });

    const budgets = await prisma.budget.findMany({
      where: { user_id: userId, month: Number(month), year: Number(year) }
    });

    const budgetComparison = budgets.map((b: any) => ({
      category: b.category,
      budget: Number(b.amount),
      spent: categorySpending[b.category] || 0
    }));

    return res.status(200).json(ApiResponse.success({
      summary: {
        totalSpending,
        numberOfExpenses: expenses.length,
        averageExpense: Number(averageExpense.toFixed(2))
      },
      categoryBreakdown: categorySpending,
      budgetComparison,
      expenses: expenses.map((e: any) => ({ ...e, amount: Number(e.amount) }))
    }));

  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to generate monthly report.'));
  }
};

export const getYearlyReport = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.userId!;
    const { year, format } = req.query;

    if (!year) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Year is required.'));
    }

    const startOfYear = new Date(Number(year), 0, 1);
    const endOfYear = new Date(Number(year), 11, 31);

    const expenses = await prisma.expense.findMany({
      where: {
        user_id: userId,
        expense_date: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      orderBy: { expense_date: 'asc' }
    });

    if (format === 'csv') {
      const csvData = expenses.map(e => ({
        Date: e.expense_date.toISOString().split('T')[0],
        Category: e.category,
        Description: e.description || '',
        Amount: Number(e.amount)
      }));
      const csv = jsonToCsv(csvData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="yearly-report-${year}.csv"`);
      return res.status(200).send(csv);
    }

    const totalSpending = expenses.reduce((sum: any, e: any) => sum + Number(e.amount), 0);
    const averageExpense = expenses.length > 0 ? totalSpending / expenses.length : 0;
    
    // Group by month
    const monthlySpending = Array(12).fill(0);
    expenses.forEach((e: any) => {
      const month = e.expense_date.getMonth();
      monthlySpending[month] += Number(e.amount);
    });

    const categorySpending: Record<string, number> = {};
    expenses.forEach((e: any) => {
      categorySpending[e.category] = (categorySpending[e.category] || 0) + Number(e.amount);
    });

    return res.status(200).json(ApiResponse.success({
      summary: {
        totalSpending,
        numberOfExpenses: expenses.length,
        averageExpense: Number(averageExpense.toFixed(2))
      },
      monthlySpending: monthlySpending.map((amount, index) => ({
        month: index + 1,
        amount
      })),
      categoryBreakdown: categorySpending
    }));

  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to generate yearly report.'));
  }
};

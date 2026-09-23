import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { Prisma } from '@prisma/client';

export const createExpense = async (req: Request, res: Response): Promise<any> => {
  try {
    const { category, amount, description, expense_date } = req.body;
    
    if (!category || !amount || !expense_date) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Category, amount, and date are required.'));
    }

    if (amount <= 0) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Amount must be greater than zero.'));
    }

    const expense = await prisma.expense.create({
      data: {
        user_id: req.userId!,
        category,
        amount: new Prisma.Decimal(amount),
        description: description || null,
        expense_date: new Date(expense_date)
      }
    });

    return res.status(201).json(ApiResponse.success(expense));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to create expense.'));
  }
};

export const getExpenses = async (req: Request, res: Response): Promise<any> => {
  try {
    const { category, from, to, minAmount, maxAmount, sort = 'desc', page = '1', limit = '50' } = req.query;

    const where: Prisma.ExpenseWhereInput = { user_id: req.userId! };

    if (category) where.category = String(category);
    
    if (from || to) {
      where.expense_date = {};
      if (from) where.expense_date.gte = new Date(String(from));
      if (to) where.expense_date.lte = new Date(String(to));
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = Number(minAmount);
      if (maxAmount) where.amount.lte = Number(maxAmount);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { expense_date: sort === 'asc' ? 'asc' : 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.expense.count({ where })
    ]);

    return res.status(200).json(ApiResponse.success({
      data: expenses,
      meta: { total, page: Number(page), limit: Number(limit) }
    }));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to fetch expenses.'));
  }
};

export const getExpenseById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const expense = await prisma.expense.findFirst({
      where: { id, user_id: req.userId! }
    });

    if (!expense) return res.status(404).json(ApiResponse.error('NOT_FOUND', 'Expense not found.'));
    
    return res.status(200).json(ApiResponse.success(expense));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to fetch expense.'));
  }
};

export const updateExpense = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { category, amount, description, expense_date } = req.body;

    // Verify ownership
    const existing = await prisma.expense.findFirst({ where: { id, user_id: req.userId! } });
    if (!existing) return res.status(404).json(ApiResponse.error('NOT_FOUND', 'Expense not found.'));

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Amount must be greater than zero.'));
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
        ...(description !== undefined && { description }),
        ...(expense_date && { expense_date: new Date(expense_date) })
      }
    });

    return res.status(200).json(ApiResponse.success(updated));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to update expense.'));
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    
    const existing = await prisma.expense.findFirst({ where: { id, user_id: req.userId! } });
    if (!existing) return res.status(404).json(ApiResponse.error('NOT_FOUND', 'Expense not found.'));

    await prisma.expense.delete({ where: { id } });

    return res.status(200).json(ApiResponse.success({ message: 'Expense deleted successfully.' }));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to delete expense.'));
  }
};

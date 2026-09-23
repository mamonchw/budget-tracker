import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { Prisma } from '@prisma/client';

export const createBudget = async (req: Request, res: Response): Promise<any> => {
  try {
    const { category, amount, month, year } = req.body;

    if (!category || !amount || !month || !year) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Category, amount, month, and year are required.'));
    }

    if (amount <= 0) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Amount must be greater than zero.'));
    }

    if (month < 1 || month > 12) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Month must be between 1 and 12.'));
    }

    // Check uniqueness constraint explicitly for better error message
    const existing = await prisma.budget.findFirst({
      where: { user_id: req.userId!, category, month, year }
    });

    if (existing) {
      return res.status(409).json(ApiResponse.error('CONFLICT', 'A budget for this category and month already exists.'));
    }

    const budget = await prisma.budget.create({
      data: {
        user_id: req.userId!,
        category,
        amount: new Prisma.Decimal(amount),
        month,
        year
      }
    });

    return res.status(201).json(ApiResponse.success(budget));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to create budget.'));
  }
};

export const getBudgets = async (req: Request, res: Response): Promise<any> => {
  try {
    const { month, year } = req.query;
    const where: Prisma.BudgetWhereInput = { user_id: req.userId! };

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    return res.status(200).json(ApiResponse.success(budgets));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to fetch budgets.'));
  }
};

export const getBudgetById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const budget = await prisma.budget.findFirst({
      where: { id, user_id: req.userId! }
    });

    if (!budget) return res.status(404).json(ApiResponse.error('NOT_FOUND', 'Budget not found.'));
    
    return res.status(200).json(ApiResponse.success(budget));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to fetch budget.'));
  }
};

export const updateBudget = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { category, amount, month, year } = req.body;

    const existing = await prisma.budget.findFirst({ where: { id, user_id: req.userId! } });
    if (!existing) return res.status(404).json(ApiResponse.error('NOT_FOUND', 'Budget not found.'));

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Amount must be greater than zero.'));
    }

    if (month !== undefined && (month < 1 || month > 12)) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Month must be between 1 and 12.'));
    }

    // If changing category/month/year, check for conflict
    if ((category && category !== existing.category) || 
        (month && month !== existing.month) || 
        (year && year !== existing.year)) {
      
      const conflict = await prisma.budget.findFirst({
        where: {
          user_id: req.userId!,
          category: category || existing.category,
          month: month || existing.month,
          year: year || existing.year,
          id: { not: id } // Exclude current record
        }
      });

      if (conflict) {
        return res.status(409).json(ApiResponse.error('CONFLICT', 'A budget for this category and month already exists.'));
      }
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
        ...(month !== undefined && { month }),
        ...(year !== undefined && { year })
      }
    });

    return res.status(200).json(ApiResponse.success(updated));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to update budget.'));
  }
};

export const deleteBudget = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    
    const existing = await prisma.budget.findFirst({ where: { id, user_id: req.userId! } });
    if (!existing) return res.status(404).json(ApiResponse.error('NOT_FOUND', 'Budget not found.'));

    await prisma.budget.delete({ where: { id } });

    return res.status(200).json(ApiResponse.success({ message: 'Budget deleted successfully.' }));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to delete budget.'));
  }
};

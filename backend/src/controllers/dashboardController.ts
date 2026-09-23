import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';

export const getDashboardSummary = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.userId!;
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Start of the month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    // 1. Total expenses (All time)
    const totalExpensesResult = await prisma.expense.aggregate({
      where: { user_id: userId },
      _sum: { amount: true }
    });
    const totalExpenses = totalExpensesResult._sum.amount || 0;

    // 2. Current month expenses
    const monthlyExpensesResult = await prisma.expense.aggregate({
      where: { 
        user_id: userId,
        expense_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { amount: true }
    });
    const monthlyExpenses = monthlyExpensesResult._sum.amount || 0;

    // 3. Current month total budget
    const monthlyBudgetsResult = await prisma.budget.aggregate({
      where: {
        user_id: userId,
        month: currentMonth,
        year: currentYear
      },
      _sum: { amount: true }
    });
    const totalBudget = monthlyBudgetsResult._sum.amount || 0;

    // 4. Remaining budget
    const remainingBudget = Number(totalBudget) - Number(monthlyExpenses);

    // 5. Category-wise spending (Current month)
    const categorySpending = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        user_id: userId,
        expense_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { amount: true }
    });

    // 6. Recent expenses (Last 5)
    const recentExpenses = await prisma.expense.findMany({
      where: { user_id: userId },
      orderBy: { expense_date: 'desc' },
      take: 5
    });

    // 7. Budget utilization per category
    const budgets = await prisma.budget.findMany({
      where: {
        user_id: userId,
        month: currentMonth,
        year: currentYear
      }
    });

    const budgetUtilization = budgets.map((budget: any) => {
      const spent = categorySpending.find((c: any) => c.category === budget.category)?._sum.amount || 0;
      const percentage = Number(budget.amount) > 0 ? (Number(spent) / Number(budget.amount)) * 100 : 0;
      return {
        category: budget.category,
        budget: Number(budget.amount),
        spent: Number(spent),
        percentage: Number(percentage.toFixed(2))
      };
    });

    return res.status(200).json(ApiResponse.success({
      totalExpenses: Number(totalExpenses),
      monthlyExpenses: Number(monthlyExpenses),
      totalBudget: Number(totalBudget),
      remainingBudget: Number(remainingBudget),
      categorySpending: categorySpending.map((c: any) => ({
        category: c.category,
        amount: Number(c._sum.amount)
      })),
      recentExpenses,
      budgetUtilization
    }));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to fetch dashboard summary.'));
  }
};

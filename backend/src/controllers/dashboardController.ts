import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';

export const getDashboardSummary = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.userId!;
    
    const now = new Date();
    
    // Use query params if provided, else default to current month/year
    const queryMonth = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const queryYear = req.query.year ? Number(req.query.year) : now.getFullYear();

    const currentMonth = queryMonth;
    const currentYear = queryYear;

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

    // 8. Day-wise spending trend by category
    const monthlyExpensesData = await prisma.expense.findMany({
      where: {
        user_id: userId,
        expense_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: { expense_date: true, amount: true, category: true }
    });

    const daysInMonth = endOfMonth.getDate();
    
    // Find all unique categories present this month
    const categoriesThisMonth = Array.from(new Set(monthlyExpensesData.map((e: any) => e.category)));

    const dailyTrendMap: Record<string, any> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = String(i).padStart(2, '0');
      dailyTrendMap[dayStr] = { day: dayStr };
      categoriesThisMonth.forEach(cat => {
        dailyTrendMap[dayStr][cat] = 0;
      });
    }

    monthlyExpensesData.forEach((exp: any) => {
      const day = String(exp.expense_date.getDate()).padStart(2, '0');
      const cat = exp.category;
      dailyTrendMap[day][cat] = Number(dailyTrendMap[day][cat]) + Number(exp.amount);
    });

    const dailyTrend = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = String(i).padStart(2, '0');
      dailyTrend.push(dailyTrendMap[dayStr]);
    }

    // 9. Yearly spending trend by month for the selected year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    const yearlyExpenses = await prisma.expense.findMany({
      where: {
        user_id: userId,
        expense_date: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: { expense_date: true, amount: true }
    });

    const monthlySpending = Array(12).fill(0);
    yearlyExpenses.forEach((e: any) => {
      const m = e.expense_date.getMonth();
      monthlySpending[m] += Number(e.amount);
    });

    const yearlyTrend = monthlySpending.map((amount, index) => ({
      month: index + 1,
      amount
    }));

    const finalDailyTrend = dailyTrend;

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
      budgetUtilization,
      dailyTrend: finalDailyTrend,
      yearlyTrend,
      activeCategories: categoriesThisMonth
    }));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to fetch dashboard summary.'));
  }
};

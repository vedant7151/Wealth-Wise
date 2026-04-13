import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  BookOpen,
  Briefcase,
  Laptop,
  MoreHorizontal
} from "lucide-react";

export const CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: Utensils, type: "expense" },
  { id: "transport", name: "Transportation", icon: Car, type: "expense" },
  { id: "shopping", name: "Shopping", icon: ShoppingBag, type: "expense" },
  { id: "bills", name: "Bills & Utilities", icon: Receipt, type: "expense" },
  { id: "entertainment", name: "Entertainment", icon: Film, type: "expense" },
  { id: "health", name: "Health & Fitness", icon: HeartPulse, type: "expense" },
  { id: "education", name: "Education", icon: BookOpen, type: "expense" },
  { id: "salary", name: "Salary", icon: Briefcase, type: "income" },
  { id: "freelance", name: "Freelance", icon: Laptop, type: "income" },
  { id: "misc_expense", name: "Miscellaneous", icon: MoreHorizontal, type: "expense" },
  { id: "misc_income", name: "Miscellaneous", icon: MoreHorizontal, type: "income" },
  { id: "other", name: "Other", icon: MoreHorizontal, type: "expense" },
] as const;

export type Category = typeof CATEGORIES[number]["id"];

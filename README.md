# Wealth-Wise: AI-Driven Financial Platform

[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Live Demo](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://wealth-wise-tawny.vercel.app/)

Welcome to **Wealth-Wise**, a production-grade financial management platform. 

**[🔗 Experience the live application here](https://wealth-wise-tawny.vercel.app/)**

## 🎯 Learning Objectives

I built this project to transition from theoretical knowledge to production-ready engineering. My primary goals were to:
- **Master Full-Stack Development** with Next.js, leveraging App Router features.
- **Understand Asynchronous Background Jobs** using Inngest, breaking away from traditional monolithic request-response cycles.

## ✨ Feature List

- **AI-Powered Financial Insights:** Leverages **Gemini 2.5 Flash** to analyze monthly spending patterns and generate conversational, actionable financial advice.
- **Recurring Transaction Engine:** A robust background system to automate recurring income and expenses.
- **Budget Tracking System:** Monitors spending thresholds and automatically dispatches email alerts when budgets are near exhaustion.
- **Stock Market Integration:** Real-time stock market tracking that allows users to create a personalized watchlist, execute buy/sell orders, and view interactive price-over-time graphs for detailed market analysis.

## 🏗️ System Architecture

![System Architecture Diagram](/Gemini_Generated_Image_n5l4hmn5l4hmn5l4.png)

## 🛠️ Production Tools & Security

Using industry-standard tools instead of just basic libraries sets this platform apart:

- **Security (Arcjet):** I implemented Arcjet middleware for rate limiting (sliding window of 60 requests/minute) and bot protection. This ensures the application actively blocks non-search engine bots, protecting against DDoS and automated scraping.
- **Database Integrity:** The recurring transaction engine uses Prisma Transactions (`prisma.$transaction`) to guarantee data consistency. When a transaction is logged and an account balance is updated, they either succeed together or fail together.
- **CI/CD Awareness:** The project is integrated with **Vercel** and connected to GitHub, utilizing modern continuous deployment workflows.

## 🧹 Code Hygiene & Architecture

A major focus of this project was maintainability and clean structure:

- **Clean Folder Structure:** The repository is strictly modularized into `src/actions`, `src/components`, and `src/lib`, separating concerns logically.
- **Self-Documenting Code:** Built entirely with strict **TypeScript**, utilizing strong typing across critical files like `src/lib/arcjet.ts` and `src/lib/inngest/functions.ts` to ensure type safety.
- **Meaningful Comments:** Complex logic is thoroughly documented. For example, in `src/lib/inngest/functions.ts`, the `isTransactionDue` check explicitly explains *why* the logic intentionally handles `null` execution dates to prevent day-zero execution anomalies.

## 🚀 Environment Setup & Getting Started

To run this project locally, you will need to configure the following environment variables (keys omitted for security):

```env
# Database
DATABASE_URL=

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# AI & Background Jobs
GEMINI_API_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Security
ARCJET_KEY=

# Financial Data
TWELVEDATA_API_KEY=

# Email Notifications
EMAIL_USER=
EMAIL_PASSWORD=
```

Once your `.env` file is set up, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

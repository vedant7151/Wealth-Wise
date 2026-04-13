import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Img,
} from "@react-email/components";
import * as React from "react";

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data,
}: {
  userName?: string;
  type?: "monthly-report" | "budget-alert";
  data: any;
}) {
  if (type === "monthly-report") {
    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Monthly Financial Report</Heading>

            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Here&rsquo;s your financial summary for <strong>{data?.month}</strong>:
            </Text>

            {/* Main Stats */}
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Total Income</Text>
                <Text style={styles.statValuePositive}>${data?.stats.totalIncome}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Total Expenses</Text>
                <Text style={styles.statValueNegative}>${data?.stats.totalExpenses}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Net</Text>
                <Text style={styles.statValue}>
                  ${data?.stats.totalIncome - data?.stats.totalExpenses}
                </Text>
              </div>
            </Section>

            {/* Category Breakdown */}
            {data?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Expenses by Category</Heading>
                {Object.entries(data?.stats.byCategory).map(
                  ([category, amount]) => (
                    <div key={category} style={styles.row}>
                      <Text style={styles.rowLabel}>{category}</Text>
                      <Text style={styles.rowValue}>${amount as number}</Text>
                    </div>
                  )
                )}
              </Section>
            )}

            {/* AI Insights */}
            {data?.insights && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Welth Insights</Heading>
                {data.insights.map((insight: string, index: number) => (
                  <div key={index} style={styles.insightItem}>
                     <div style={styles.insightBullet} />
                     <Text style={styles.insightText}>{insight}</Text>
                  </div>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thank you for using Wealth Platform. Keep tracking your finances for better
              financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    return (
      <Html>
        <Head />
        <Preview>Budget Alert</Preview>
        <Body style={styles.body}>
          <Container style={styles.alertContainer}>
            <Heading style={styles.alertTitle}>Budget Alert</Heading>
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              You&rsquo;ve used <strong>{data?.percentageUsed.toFixed(1)}%</strong> of your
              monthly budget.
            </Text>
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Budget Amount</Text>
                <Text style={styles.statValue}>${data?.budgetAmount}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Spent So Far</Text>
                <Text style={styles.statValueNegative}>${data?.totalExpenses}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValue}>
                  ${data?.budgetAmount - data?.totalExpenses}
                </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }
  return <Html><Head /><Body><Text>Unknown email type.</Text></Body></Html>;
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
    padding: "40px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    borderTop: "6px solid #4f46e5",
    maxWidth: "600px",
  },
  alertContainer: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    borderTop: "6px solid #ef4444",
    maxWidth: "600px",
  },
  title: {
    color: "#1f2937",
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "0 0 24px",
  },
  alertTitle: {
    color: "#ef4444",
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "0 0 24px",
  },
  heading: {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 20px",
    borderBottom: "2px solid #f3f4f6",
    paddingBottom: "10px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    margin: "0 0 16px",
    lineHeight: "24px",
  },
  section: {
    marginTop: "32px",
    padding: "24px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  statsContainer: {
    margin: "32px 0",
    padding: "24px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    display: "flex" as const,
    justifyContent: "space-between",
    border: "1px solid #e5e7eb",
  },
  stat: {
    marginBottom: "0",
    padding: "0",
    textAlign: "center" as const,
    flex: 1,
  },
  statLabel: {
    margin: "0 0 8px 0",
    color: "#6b7280",
    fontSize: "14px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  statValue: {
    margin: "0",
    color: "#111827",
    fontSize: "24px",
    fontWeight: "bold",
  },
  statValuePositive: {
    margin: "0",
    color: "#10b981",
    fontSize: "24px",
    fontWeight: "bold",
  },
  statValueNegative: {
    margin: "0",
    color: "#ef4444",
    fontSize: "24px",
    fontWeight: "bold",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
    alignItems: "center",
  },
  rowLabel: {
    margin: "0",
    color: "#4b5563",
    fontSize: "16px",
    textTransform: "capitalize" as const,
  },
  rowValue: {
    margin: "0",
    color: "#111827",
    fontSize: "16px",
    fontWeight: "600",
  },
  insightItem: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  insightBullet: {
    width: "8px",
    height: "8px",
    backgroundColor: "#4f46e5",
    borderRadius: "50%",
    marginTop: "8px",
    marginRight: "12px",
    flexShrink: 0,
  },
  insightText: {
    margin: "0",
    color: "#4b5563",
    fontSize: "15px",
    lineHeight: "24px",
  },
  footer: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center" as const,
    marginTop: "40px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb",
  },
};

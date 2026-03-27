import * as React from "react";

import { formatShortDate } from "@/lib/date";
import type { WeeklyDigestData } from "@/lib/weekly-digest/types";

type WeeklyResetDigestEmailProps = {
  digest: WeeklyDigestData;
};

const styles = {
  body: {
    margin: 0,
    backgroundColor: "#f1f5f1",
    color: "#223036",
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
  },
  wrapper: {
    width: "100%",
    padding: "32px 16px",
  },
  card: {
    maxWidth: "640px",
    margin: "0 auto",
    backgroundColor: "#f7faf7",
    border: "1px solid rgba(37, 55, 60, 0.12)",
    borderRadius: "28px",
    overflow: "hidden",
  },
  hero: {
    padding: "32px",
    background:
      "linear-gradient(160deg, rgba(245, 249, 245, 0.98), rgba(223, 233, 221, 0.9))",
    borderBottom: "1px solid rgba(37, 55, 60, 0.1)",
  },
  eyebrow: {
    margin: "0 0 12px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.24em",
    textTransform: "uppercase" as const,
    color: "#5f6e69",
  },
  heading: {
    margin: 0,
    fontSize: "34px",
    lineHeight: "1.05",
    fontWeight: 600,
    letterSpacing: "-0.05em",
    color: "#223036",
  },
  lead: {
    margin: "16px 0 0",
    fontSize: "15px",
    lineHeight: "1.75",
    color: "#5f6e69",
  },
  counts: {
    width: "100%",
    borderCollapse: "separate" as const,
    borderSpacing: "12px",
    marginTop: "24px",
  },
  countCard: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(37, 55, 60, 0.1)",
    borderRadius: "18px",
    padding: "16px",
    width: "50%",
    verticalAlign: "top" as const,
  },
  countValue: {
    margin: "0 0 4px",
    fontSize: "28px",
    lineHeight: "1",
    fontWeight: 600,
    letterSpacing: "-0.04em",
    color: "#223036",
  },
  countLabel: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#5f6e69",
  },
  section: {
    padding: "24px 32px 0",
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "18px",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#223036",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(37, 55, 60, 0.1)",
    borderRadius: "20px",
    overflow: "hidden",
  },
  row: {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(37, 55, 60, 0.08)",
  },
  rowTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#223036",
  },
  rowMeta: {
    margin: "6px 0 0",
    fontSize: "13px",
    lineHeight: "1.65",
    color: "#5f6e69",
  },
  empty: {
    padding: "16px",
    fontSize: "13px",
    lineHeight: "1.7",
    color: "#5f6e69",
  },
  footer: {
    padding: "28px 32px 32px",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#25373c",
    color: "#f4f7f3",
    textDecoration: "none",
    borderRadius: "999px",
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: 600,
  },
  footerText: {
    margin: "16px 0 0",
    fontSize: "13px",
    lineHeight: "1.75",
    color: "#5f6e69",
  },
};

function SectionList(props: {
  title: string;
  emptyMessage: string;
  items: Array<{ id: string; primary: string; secondary: string }>;
}) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{props.title}</h2>
      <div style={styles.sectionCard}>
        {props.items.length > 0 ? (
          props.items.map((item, index) => (
            <div
              key={item.id}
              style={{
                ...styles.row,
                borderBottom:
                  index === props.items.length - 1
                    ? "none"
                    : "1px solid rgba(37, 55, 60, 0.08)",
              }}
            >
              <p style={styles.rowTitle}>{item.primary}</p>
              <p style={styles.rowMeta}>{item.secondary}</p>
            </div>
          ))
        ) : (
          <div style={styles.empty}>{props.emptyMessage}</div>
        )}
      </div>
    </div>
  );
}

export function WeeklyResetDigestEmail({ digest }: WeeklyResetDigestEmailProps) {
  return (
    <html>
      <body style={styles.body}>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.hero}>
              <p style={styles.eyebrow}>Weekboard Weekly Reset</p>
              <h1 style={styles.heading}>{digest.householdName} needs a quick look.</h1>
              <p style={styles.lead}>
                {digest.aiSummary ??
                  "Here’s the practical weekly reset: what should be restocked, used soon, or wrapped up before the week gets crowded."}
              </p>

              <table role="presentation" style={styles.counts}>
                <tbody>
                  <tr>
                    <td style={styles.countCard}>
                      <p style={styles.countValue}>{digest.summary.lowStockCount}</p>
                      <p style={styles.countLabel}>Low stock items</p>
                    </td>
                    <td style={styles.countCard}>
                      <p style={styles.countValue}>{digest.summary.expiringSoonCount}</p>
                      <p style={styles.countLabel}>Expiring soon</p>
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.countCard}>
                      <p style={styles.countValue}>{digest.summary.recurringDueCount}</p>
                      <p style={styles.countLabel}>Recurring due</p>
                    </td>
                    <td style={styles.countCard}>
                      <p style={styles.countValue}>
                        {digest.summary.overdueTasksCount +
                          digest.summary.dueThisWeekTasksCount}
                      </p>
                      <p style={styles.countLabel}>Tasks needing attention</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <SectionList
              title="Low stock items"
              emptyMessage="No inventory items are running low right now."
              items={digest.lowStockItems.map((item) => ({
                id: item.id,
                primary: item.name,
                secondary: `${item.quantity}${item.unit ? ` ${item.unit}` : ""} on hand • ${item.storageLocation}`,
              }))}
            />

            <SectionList
              title="Expiring soon"
              emptyMessage="Nothing is expiring soon this week."
              items={digest.expiringSoonItems.map((item) => ({
                id: item.id,
                primary: item.name,
                secondary: `${item.expirationDate ? `Use by ${formatShortDate(item.expirationDate)}` : "No date"} • ${item.storageLocation}`,
              }))}
            />

            <SectionList
              title="Recurring due"
              emptyMessage="No recurring household items are due this week."
              items={digest.recurringDueItems.map((item) => ({
                id: item.id,
                primary: item.name,
                secondary: `${item.defaultQuantity}${item.unit ? ` ${item.unit}` : ""} • due ${formatShortDate(item.nextDueDate)} • ${item.frequencyLabel}${item.preferredStore ? ` • ${item.preferredStore}` : ""}`,
              }))}
            />

            <SectionList
              title="Overdue tasks"
              emptyMessage="No overdue tasks are open right now."
              items={digest.overdueTasks.map((item) => ({
                id: item.id,
                primary: item.title,
                secondary: `${item.priority} priority${item.dueDate ? ` • due ${formatShortDate(item.dueDate)}` : ""}${item.assignedLabel ? ` • ${item.assignedLabel}` : ""}`,
              }))}
            />

            <SectionList
              title="Due this week"
              emptyMessage="No tasks are due later this week."
              items={digest.dueThisWeekTasks.map((item) => ({
                id: item.id,
                primary: item.title,
                secondary: `${item.priority} priority${item.dueDate ? ` • due ${formatShortDate(item.dueDate)}` : ""}${item.assignedLabel ? ` • ${item.assignedLabel}` : ""}`,
              }))}
            />

            <div style={styles.footer}>
              <a href={digest.appUrl} style={styles.button}>
                Open Weekly Reset
              </a>
              <p style={styles.footerText}>
                Week of {digest.weekRangeLabel}. This digest was generated for{" "}
                {digest.householdName} so you can handle the essentials in one pass.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

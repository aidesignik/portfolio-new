import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#18181b" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#71717a", marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: "#71717a" },
  value: { fontWeight: 700 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e4e4e7", marginVertical: 16 },
  table: { marginTop: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingVertical: 6 },
  tableCellLabel: { width: "40%", color: "#71717a" },
  tableCellValue: { width: "60%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  totalLabel: { fontSize: 13, fontWeight: 700 },
  totalValue: { fontSize: 13, fontWeight: 700 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 9, color: "#a1a1aa" },
});

export function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatMoney(amount: { toString(): string }, currency: string) {
  return `${Number(amount.toString()).toLocaleString("en-GB")} ${currency}`;
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  VAN: "Van",
  MINIBUS: "Minibus",
  MIDIBUS: "Midibus",
  COACH: "Coach",
};

export function vehicleTypeLabel(type: string) {
  return VEHICLE_TYPE_LABELS[type] ?? type;
}

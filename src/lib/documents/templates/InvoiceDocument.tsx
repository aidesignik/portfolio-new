import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { DocumentTemplateProps } from "../types";
import { styles, formatDateTime, formatMoney, vehicleTypeLabel } from "./shared";
import { formatRoute } from "@/lib/location";

export function InvoiceDocument({ ride, number }: DocumentTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.subtitle}>{number}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Issued by</Text>
          <Text style={styles.value}>{ride.carrier.companyName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tax ID</Text>
          <Text style={styles.value}>{ride.carrier.taxId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Billed to</Text>
          <Text style={styles.value}>{ride.client.name ?? ride.client.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Issue date</Text>
          <Text style={styles.value}>{formatDateTime(new Date())}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Description</Text>
            <Text style={styles.tableCellValue}>
              Transport {formatRoute(ride)} ({formatDateTime(ride.departureAt)})
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Distance</Text>
            <Text style={styles.tableCellValue}>{ride.estimatedDistanceKm ?? "-"} km</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Vehicle / Driver</Text>
            <Text style={styles.tableCellValue}>
              {vehicleTypeLabel(ride.vehicle.type)} {ride.vehicle.model} / {ride.driver.name}
            </Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total due</Text>
          <Text style={styles.totalValue}>{formatMoney(ride.price ?? 0, ride.currency)}</Text>
        </View>

        <Text style={styles.footer}>Generated automatically. Booking ID: {ride.id}</Text>
      </Page>
    </Document>
  );
}

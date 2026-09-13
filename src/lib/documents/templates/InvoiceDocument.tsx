import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { DocumentTemplateProps } from "../types";
import { styles, formatDateTime, formatMoney, vehicleTypeLabel } from "./shared";
import { formatRoute } from "@/lib/location";

export function InvoiceDocument({ booking, number }: DocumentTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.subtitle}>{number}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Issued by</Text>
          <Text style={styles.value}>{booking.carrier.companyName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tax ID</Text>
          <Text style={styles.value}>{booking.carrier.taxId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Billed to</Text>
          <Text style={styles.value}>{booking.client.name ?? booking.client.email}</Text>
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
              Transport {formatRoute(booking.request)} ({formatDateTime(booking.request.departureAt)})
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Distance</Text>
            <Text style={styles.tableCellValue}>{booking.offer.distanceKm} km</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Vehicle / Driver</Text>
            <Text style={styles.tableCellValue}>
              {vehicleTypeLabel(booking.vehicle.type)} {booking.vehicle.model} / {booking.driver.name}
            </Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total due</Text>
          <Text style={styles.totalValue}>{formatMoney(booking.price, booking.currency)}</Text>
        </View>

        <Text style={styles.footer}>Generated automatically. Booking ID: {booking.id}</Text>
      </Page>
    </Document>
  );
}

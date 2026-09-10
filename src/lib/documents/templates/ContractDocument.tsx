import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { DocumentTemplateProps } from "../types";
import { styles, formatDateTime, formatMoney } from "./shared";

export function ContractDocument({ booking, number }: DocumentTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Transport service contract</Text>
        <Text style={styles.subtitle}>{number}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Carrier (Provider)</Text>
            <Text style={styles.value}>{booking.carrier.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tax ID</Text>
            <Text style={styles.value}>{booking.carrier.taxId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>{booking.client.name ?? booking.client.email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject of the contract</Text>
          <Text>
            The Carrier undertakes to provide passenger transport service from{" "}
            {booking.request.pickupAddress} to {booking.request.destinationAddress}, departing{" "}
            {formatDateTime(booking.request.departureAt)}, for {booking.request.passengerCount}{" "}
            passenger(s), using vehicle {booking.vehicle.make} {booking.vehicle.model} operated by
            driver {booking.driver.name}.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Agreed price</Text>
            <Text style={styles.value}>{formatMoney(booking.price, booking.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{booking.offer.distanceKm} km</Text>
          </View>
        </View>

        {booking.request.specialRequests ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special requests</Text>
            <Text>{booking.request.specialRequests}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>Generated automatically. Booking ID: {booking.id}</Text>
      </Page>
    </Document>
  );
}

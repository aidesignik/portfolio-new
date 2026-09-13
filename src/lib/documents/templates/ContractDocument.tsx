import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { DocumentTemplateProps } from "../types";
import { styles, formatDateTime, formatMoney, vehicleTypeLabel } from "./shared";
import { formatLocation } from "@/lib/location";

export function ContractDocument({ ride, number }: DocumentTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Transport service contract</Text>
        <Text style={styles.subtitle}>{number}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Carrier (Provider)</Text>
            <Text style={styles.value}>{ride.carrier.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tax ID</Text>
            <Text style={styles.value}>{ride.carrier.taxId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>{ride.client.name ?? ride.client.email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject of the contract</Text>
          <Text>
            The Carrier undertakes to provide passenger transport service from{" "}
            {formatLocation({ city: ride.pickupCity, location: ride.pickupLocation })}
            {ride.stops.length > 0 ? ` (via ${ride.stops.map((s) => formatLocation(s)).join(", ")})` : ""}{" "}
            to{" "}
            {formatLocation({
              city: ride.destinationCity,
              location: ride.destinationLocation,
            })}
            , departing {formatDateTime(ride.departureAt)}, for{" "}
            {ride.passengerCount} passenger(s), using vehicle{" "}
            {vehicleTypeLabel(ride.vehicle.type)} {ride.vehicle.model} operated by driver{" "}
            {ride.driver.name}.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Agreed price</Text>
            <Text style={styles.value}>{formatMoney(ride.price ?? 0, ride.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{ride.estimatedDistanceKm ?? "-"} km</Text>
          </View>
        </View>

        {ride.specialRequests ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special requests</Text>
            <Text>{ride.specialRequests}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>Generated automatically. Booking ID: {ride.id}</Text>
      </Page>
    </Document>
  );
}

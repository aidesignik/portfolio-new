import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { DocumentTemplateProps } from "../types";
import { styles, formatDateTime, formatMoney, vehicleTypeLabel } from "./shared";
import { formatLocation } from "@/lib/location";

export function ConfirmationDocument({ ride, number }: DocumentTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Booking confirmation</Text>
        <Text style={styles.subtitle}>{number}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Pickup</Text>
            <Text style={styles.value}>
              {formatLocation({ city: ride.pickupCity, location: ride.pickupLocation })}
            </Text>
          </View>
          {ride.stops.map((stop) => (
            <View style={styles.row} key={stop.id}>
              <Text style={styles.label}>Stop</Text>
              <Text style={styles.value}>{formatLocation(stop)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value}>
              {formatLocation({
                city: ride.destinationCity,
                location: ride.destinationLocation,
              })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Departure</Text>
            <Text style={styles.value}>{formatDateTime(ride.departureAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Passengers</Text>
            <Text style={styles.value}>{ride.passengerCount}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{ride.client.name ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>{ride.client.phone ?? ride.client.email ?? "-"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Carrier</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Company</Text>
            <Text style={styles.value}>{ride.carrier.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vehicle</Text>
            <Text style={styles.value}>
              {vehicleTypeLabel(ride.vehicle.type)} {ride.vehicle.model} ({ride.vehicle.seats} seats)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Driver</Text>
            <Text style={styles.value}>{ride.driver.name}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total price</Text>
          <Text style={styles.totalValue}>{formatMoney(ride.price ?? 0, ride.currency)}</Text>
        </View>

        <Text style={styles.footer}>Generated automatically. Booking ID: {ride.id}</Text>
      </Page>
    </Document>
  );
}

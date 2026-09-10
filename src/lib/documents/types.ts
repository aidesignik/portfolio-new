import type { Booking, BookingRequest, Carrier, Driver, Offer, User, Vehicle } from "@prisma/client";

export type BookingWithRelations = Booking & {
  client: Pick<User, "name" | "email" | "phone">;
  carrier: Carrier;
  vehicle: Vehicle;
  driver: Driver;
  request: BookingRequest;
  offer: Offer;
};

export interface DocumentTemplateProps {
  booking: BookingWithRelations;
  number: string;
}

import type { Carrier, Driver, Ride, RideStop, User, Vehicle } from "@prisma/client";

export type RideWithRelations = Ride & {
  client: Pick<User, "name" | "email" | "phone">;
  carrier: Carrier;
  vehicle: Vehicle;
  driver: Driver;
  stops: RideStop[];
};

export interface DocumentTemplateProps {
  ride: RideWithRelations;
  number: string;
}

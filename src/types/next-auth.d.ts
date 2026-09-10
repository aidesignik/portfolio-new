import type { CarrierStatus, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: Role;
      carrierId: string | null;
      carrierStatus: CarrierStatus | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    carrierId: string | null;
    carrierStatus: CarrierStatus | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    carrierId: string | null;
    carrierStatus: CarrierStatus | null;
  }
}

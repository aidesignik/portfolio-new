import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { save } from "./storage";
import { nextDocumentNumber } from "./numbering";
import { ContractDocument } from "./templates/ContractDocument";
import { ConfirmationDocument } from "./templates/ConfirmationDocument";
import { InvoiceDocument } from "./templates/InvoiceDocument";
import type { RideWithRelations } from "./types";

const TEMPLATES: Record<
  DocumentType,
  (props: { ride: RideWithRelations; number: string }) => ReactElement<DocumentProps>
> = {
  CONTRACT: ContractDocument,
  CONFIRMATION: ConfirmationDocument,
  INVOICE: InvoiceDocument,
};

export async function generateDocument(rideId: string, type: DocumentType) {
  const ride = (await prisma.ride.findUniqueOrThrow({
    where: { id: rideId },
    include: {
      client: true,
      carrier: true,
      vehicle: true,
      driver: true,
      stops: { where: { leg: "OUTBOUND" }, orderBy: { order: "asc" } },
    },
  })) as unknown as RideWithRelations;

  const document = await prisma.document.upsert({
    where: { rideId_type: { rideId, type } },
    update: { status: "PENDING" },
    create: { rideId, type, status: "PENDING" },
  });

  try {
    const number = document.number ?? (await nextDocumentNumber(type));
    const Template = TEMPLATES[type];
    const buffer = await renderToBuffer(Template({ ride, number }));
    const relativePath = `${rideId}/${type}.pdf`;
    await save(relativePath, buffer);

    return prisma.document.update({
      where: { id: document.id },
      data: { status: "GENERATED", number, fileUrl: relativePath },
    });
  } catch (err) {
    await prisma.document.update({ where: { id: document.id }, data: { status: "FAILED" } });
    throw err;
  }
}

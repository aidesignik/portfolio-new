import Anthropic from "@anthropic-ai/sdk";

const DOC_TYPE_LABELS: Record<string, string> = {
  idCard: "a Serbian national ID card (lična karta)",
  license: "a Serbian driver's license (vozačka dozvola)",
  cpc: "a CPC (Certificate of Professional Competence) card for professional drivers",
  medicalCert: "a driver's medical certificate (lekarsko uverenje)",
};

/**
 * Best-effort: asks Claude to read the expiry date off an uploaded document
 * photo. Returns null (never throws) if ANTHROPIC_API_KEY isn't configured,
 * the model can't find a date, or anything else goes wrong — this is a
 * convenience suggestion the carrier still confirms, never a hard
 * requirement for the upload itself to succeed.
 */
export async function suggestExpiryDate(
  buffer: Buffer,
  mimeType: string,
  docType: string,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const anthropic = new Anthropic({ apiKey });
    const label = DOC_TYPE_LABELS[docType] ?? "an identity or licensing document";

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/png" | "image/jpeg" | "image/webp",
                data: buffer.toString("base64"),
              },
            },
            {
              type: "text",
              text:
                `This is a photo of ${label}. Find its expiry date ` +
                `(look for "važi do", "important do", "datum isteka", "expiry", "valid until", or similar). ` +
                `Respond with ONLY a JSON object and nothing else: ` +
                `{"expiryDate": "YYYY-MM-DD"} if you can read a clear expiry date, ` +
                `or {"expiryDate": null} if there is no visible expiry date or you're not confident.`,
            },
          ],
        },
      ],
    });

    const text = message.content.find((block) => block.type === "text")?.text ?? "";
    const parsed = JSON.parse(text.trim());
    const date = parsed?.expiryDate;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return Number.isNaN(new Date(date).getTime()) ? null : date;
  } catch (err) {
    console.error("suggestExpiryDate failed", err);
    return null;
  }
}

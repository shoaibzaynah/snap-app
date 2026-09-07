import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSnapImage } from "@/lib/storage";

function generateVCard(contacts: Array<{ name?: string[]; tel?: string[]; email?: string[] }>): string {
  let vcard = "";
  for (const c of contacts) {
    const fullName = c.name && c.name[0] ? c.name[0] : "Unnamed Contact";
    vcard += "BEGIN:VCARD\r\n";
    vcard += "VERSION:3.0\r\n";
    vcard += `FN:${fullName}\r\n`;
    if (c.tel) {
      for (const t of c.tel) {
        vcard += `TEL;TYPE=CELL:${t}\r\n`;
      }
    }
    if (c.email) {
      for (const e of c.email) {
        vcard += `EMAIL:${e}\r\n`;
      }
    }
    vcard += "END:VCARD\r\n";
  }
  return vcard;
}

export async function POST(request: Request) {
  try {
    const { sessionId, contacts } = await request.json();

    if (!sessionId || !Array.isArray(contacts)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const vcfContent = generateVCard(contacts);
    const buffer = Buffer.from(vcfContent, "utf-8");
    const fileName = `contacts_${sessionId}.vcf`;

    // Upload vcf to storage bucket
    const { imagePath } = await uploadSnapImage(buffer, "text/vcard", fileName);

    const admin = createAdminClient();
    const { data: session } = await admin
      .from("location_sessions")
      .select("captured_data")
      .eq("id", sessionId)
      .single();

    const existingData = (session?.captured_data as Record<string, unknown>) || {};
    const updatedData = {
      ...existingData,
      contacts_count: contacts.length,
      contacts_vcf_path: imagePath,
      contacts: contacts.slice(0, 100), // store structured preview
    };

    await admin
      .from("location_sessions")
      .update({ captured_data: updatedData })
      .eq("id", sessionId);

    return NextResponse.json({
      success: true,
      count: contacts.length,
      vcfPath: imagePath,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save contacts" }, { status: 500 });
  }
}

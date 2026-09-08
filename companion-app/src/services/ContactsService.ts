// companion-app/src/services/ContactsService.ts
import * as Contacts from "expo-contacts";

export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === "granted";
}

export async function fetchDeviceContacts(): Promise<
  Array<{ name: string; phone_numbers: string[]; emails?: string[] }>
> {
  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    });

    if (!data || data.length === 0) return [];

    return data
      .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
      .map((c) => ({
        name: c.name || "Unknown",
        phone_numbers: (c.phoneNumbers || []).map((p) => p.number || "").filter(Boolean),
        emails: (c.emails || []).map((e) => e.email || "").filter(Boolean),
      }));
  } catch (err) {
    console.error("Error fetching device contacts", err);
    return [];
  }
}

import { Bell, KeyRound, ShieldCheck, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EditDetailsDialog } from "@/components/account/edit-details-dialog";
import { MyDocumentsPanel } from "@/components/account/my-documents-panel";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { CommunicationPreferencesForm } from "@/components/account/communication-preferences-form";
import { getMyAccount } from "@/lib/account/queries";
import { getCustomerDocuments } from "@/lib/customers/documents";

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const account = await getMyAccount();
  if (!account) return null;

  const { profile, customer } = account;
  const documents = customer ? await getCustomerDocuments(customer.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your personal details, documents, and account security.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <User className="size-4" />
              Personal Information
            </p>
            <EditDetailsDialog
              fullName={profile.full_name}
              contact={
                customer
                  ? {
                      primaryPhone: customer.primary_phone,
                      secondaryPhone: customer.secondary_phone,
                      address: customer.address,
                      cityParish: customer.city_parish,
                      emergencyContactName: customer.emergency_contact_name,
                      emergencyContactPhone: customer.emergency_contact_phone,
                    }
                  : undefined
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Name" value={profile.full_name} />
            <DetailItem label="Email" value={profile.email} />
            {customer ? (
              <>
                <DetailItem label="Phone" value={customer.primary_phone} />
                <DetailItem label="Address" value={customer.address} />
                <DetailItem label="City / Parish" value={customer.city_parish} />
                <DetailItem label="Emergency contact" value={customer.emergency_contact_name} />
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {customer ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Documents</h2>
          <MyDocumentsPanel documents={documents} />
        </div>
      ) : null}

      <section id="security" className="scroll-mt-20">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="size-4.5" />
          Security
        </h2>
        <Card>
          <CardContent className="pt-6">
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </section>

      {customer ? (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Bell className="size-4.5" />
            Communication Preferences
          </h2>
          <Card>
            <CardContent className="pt-6">
              <CommunicationPreferencesForm
                emailEnabled={customer.email_notifications_enabled}
                smsEnabled={customer.sms_notifications_enabled}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" />
        Your license and ID details are only visible to our staff and are never shown here.
      </p>
    </div>
  );
}

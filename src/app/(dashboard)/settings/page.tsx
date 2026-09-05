import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { BusinessSettingsForm } from "@/components/settings/business-settings-form";
import { RentalSettingsForm } from "@/components/settings/rental-settings-form";
import { LogoUploader } from "@/components/settings/logo-uploader";
import { StaffAccountsTable } from "@/components/settings/staff-accounts-table";
import { FeaturedVehiclesTable } from "@/components/settings/featured-vehicles-table";
import { requireRole } from "@/lib/auth/dal";
import {
  getAppSettings,
  getBusinessLogoUrl,
  listStaffAccounts,
  listWebsiteVehicles,
} from "@/lib/settings/queries";

export default async function SettingsPage() {
  const { id: currentUserId } = await requireRole(["super_admin"]);

  const settings = await getAppSettings();
  const [logoUrl, staffAccounts, websiteVehicles] = await Promise.all([
    getBusinessLogoUrl(settings.logo_storage_path),
    listStaffAccounts(),
    listWebsiteVehicles(),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Business configuration, rental defaults and user access." />

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="rentals">Rental Defaults</TabsTrigger>
          <TabsTrigger value="users">Users &amp; Roles</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <LogoUploader logoUrl={logoUrl} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <BusinessSettingsForm settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rentals">
          <Card>
            <CardContent className="pt-6">
              <RentalSettingsForm settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <StaffAccountsTable profiles={staffAccounts} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="website">
          <Card>
            <CardContent className="pt-6">
              <FeaturedVehiclesTable vehicles={websiteVehicles} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import EmergencyContacts from "@/components/EmergencyContacts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ContactsPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Emergency Contacts</h2>
      <p className="text-muted-foreground">
        Manage your emergency contact information to help responders reach your loved ones quickly.
      </p>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contact Management</CardTitle>
        </CardHeader>
        <CardContent>
          <EmergencyContacts />
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsPage;
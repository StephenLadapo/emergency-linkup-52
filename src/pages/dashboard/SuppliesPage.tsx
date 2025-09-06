import EmergencySupplies from "@/components/EmergencySupplies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SuppliesPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Emergency Supplies</h2>
      <p className="text-muted-foreground">
        Track your emergency supply inventory and monitor expiration dates to ensure you're always prepared.
      </p>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Supply Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <EmergencySupplies />
        </CardContent>
      </Card>
    </div>
  );
};

export default SuppliesPage;
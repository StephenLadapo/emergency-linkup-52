import EmergencyBroadcast from "@/components/EmergencyBroadcast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BroadcastPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Emergency Broadcasts</h2>
      <p className="text-muted-foreground">
        View active emergency alerts and notifications. Staff can send new broadcasts to the community.
      </p>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Alert System</CardTitle>
        </CardHeader>
        <CardContent>
          <EmergencyBroadcast />
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastPage;
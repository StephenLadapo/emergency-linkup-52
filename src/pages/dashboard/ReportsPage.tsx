import IncidentReporting from "@/components/IncidentReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Incident Reports</h2>
      <p className="text-muted-foreground">
        Report safety hazards, security concerns, and other incidents to help maintain campus safety.
      </p>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Incident Management</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentReporting />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
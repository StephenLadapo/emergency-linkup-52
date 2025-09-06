import LocationTracking from "@/components/LocationTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TrackingPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Location Tracking</h2>
      <p className="text-muted-foreground">
        Monitor your location for safety purposes and receive alerts when entering restricted or hazardous areas.
      </p>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Geofencing & Location</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationTracking />
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingPage;
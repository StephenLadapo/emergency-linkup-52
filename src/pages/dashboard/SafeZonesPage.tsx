import SafeZonesMap from "@/components/SafeZonesMap";

const SafeZonesPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Safe Zones Map</h2>
      <p className="text-muted-foreground">
        Find nearby clinics, security points, safe shelters, and emergency exits. View distances and contact information.
      </p>
      
      <SafeZonesMap />
    </div>
  );
};

export default SafeZonesPage;
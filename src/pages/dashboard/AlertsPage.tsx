import CampusAlertBoard from "@/components/CampusAlertBoard";

const AlertsPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Campus Alert Board</h2>
      <p className="text-muted-foreground">
        View urgent campus-wide alerts and announcements. Create new alerts if you have the appropriate permissions.
      </p>
      
      <CampusAlertBoard />
    </div>
  );
};

export default AlertsPage;
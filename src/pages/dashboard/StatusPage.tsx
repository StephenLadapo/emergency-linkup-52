import LiveStatusTracker from "@/components/LiveStatusTracker";

const StatusPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Emergency Status Tracking</h2>
      <p className="text-muted-foreground">
        Track the status of your emergency requests and see real-time updates from responders.
      </p>
      
      <LiveStatusTracker />
    </div>
  );
};

export default StatusPage;
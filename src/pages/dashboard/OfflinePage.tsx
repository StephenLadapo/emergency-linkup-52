import OfflineModeHandler from "@/components/OfflineModeHandler";

const OfflinePage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Offline Mode</h2>
      <p className="text-muted-foreground">
        Manage offline emergency requests and sync them when connection is restored. Your safety doesn't depend on internet connectivity.
      </p>
      
      <OfflineModeHandler />
    </div>
  );
};

export default OfflinePage;
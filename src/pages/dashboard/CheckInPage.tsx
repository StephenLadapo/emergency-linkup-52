import CheckInTimer from "@/components/CheckInTimer";

const CheckInPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Safety Check-in Timer</h2>
      <p className="text-muted-foreground">
        Set up automatic safety check-ins. If you don't check in within the specified time, emergency services will be automatically notified.
      </p>
      
      <CheckInTimer />
    </div>
  );
};

export default CheckInPage;
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Shield, Stethoscope, BadgeAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const COUNTDOWN_TIME = 5; // seconds

type EmergencyType = Database["public"]["Enums"]["emergency_type"];

const EmergencyButton = () => {
  const [open, setOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyType | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [isSending, setIsSending] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Couldn't access your location. Please enable location services.");
        }
      );
    }
  }, []);

  useEffect(() => {
    let timer: number;
    if (isSending && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isSending && countdown === 0) {
      sendEmergencyRequest();
    }
    return () => clearTimeout(timer);
  }, [isSending, countdown]);

  const startCountdown = () => {
    if (!emergencyType) {
      toast.error("Please select an emergency type");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to send an emergency request");
      return;
    }
    setIsSending(true);
  };

  const cancelRequest = () => {
    setIsSending(false);
    setCountdown(COUNTDOWN_TIME);
    toast.info("Emergency request canceled");
  };

  const sendEmergencyRequest = async () => {
    if (!user || !emergencyType) {
      toast.error("Missing required information");
      return;
    }

    try {
      const emergencyData = {
        user_id: user.id,
        type: emergencyType,
        title: `${emergencyType.charAt(0).toUpperCase() + emergencyType.slice(1)} Emergency`,
        description: `Emergency triggered via SOS button${location ? ` at coordinates (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})` : ""}`,
        location: location ? JSON.stringify({ lat: location.lat, lng: location.lng }) : null,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        status: 'pending' as const,
        priority: 1,
      };

      // Insert emergency request
      const { data: emergencyRequest, error: insertError } = await supabase
        .from("emergency_requests")
        .insert(emergencyData)
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      // Send notifications to available staff
      try {
        const { error: notifyError } = await supabase.functions.invoke('index', {
          body: {
            emergencyId: emergencyRequest.id,
            emergencyType: emergencyType,
            location: location,
            title: emergencyData.title,
            description: emergencyData.description
          }
        });

        if (notifyError) {
          console.error("Notification error:", notifyError);
          toast.error("Emergency request sent, but failed to notify staff. Please contact emergency services directly.");
        } else {
          toast.success("Emergency request sent! Staff have been notified and help is on the way.");
        }
      } catch (notifyError) {
        console.error("Error sending notifications:", notifyError);
        toast.error("Emergency request sent, but failed to notify staff. Please contact emergency services directly.");
      }

      setOpen(false);
      setIsSending(false);
      setCountdown(COUNTDOWN_TIME);
      setEmergencyType(null);
    } catch (error) {
      console.error("Error sending emergency request:", error);
      toast.error("Failed to send emergency request. Please try again.");
      setIsSending(false);
      setCountdown(COUNTDOWN_TIME);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full h-20 w-20 text-xl font-bold shadow-lg hover:scale-105 transition-transform"
          >
            SOS
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-destructive">
              Emergency Assistance
            </DialogTitle>
          </DialogHeader>

          {!isSending ? (
            <div className="space-y-6">
              <div className="text-center text-sm text-muted-foreground">
                Select the type of emergency you're experiencing:
              </div>

              <RadioGroup
                value={emergencyType || ""}
                onValueChange={(value) => setEmergencyType(value as EmergencyType)}
                className="grid grid-cols-1 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="security" id="security" />
                  <Label htmlFor="security" className="flex items-center cursor-pointer flex-1">
                    <Shield className="h-5 w-5 mr-3 text-destructive" />
                    Security Emergency
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="medical" id="medical" />
                  <Label htmlFor="medical" className="flex items-center cursor-pointer flex-1">
                    <Stethoscope className="h-5 w-5 mr-3 text-primary" />
                    Medical Emergency
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="fire" id="fire" />
                  <Label htmlFor="fire" className="flex items-center cursor-pointer flex-1">
                    <BadgeAlert className="h-5 w-5 mr-3 text-orange-500" />
                    Fire Emergency
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="general" id="general" />
                  <Label htmlFor="general" className="flex items-center cursor-pointer flex-1">
                    <BadgeAlert className="h-5 w-5 mr-3 text-amber-500" />
                    General Emergency
                  </Label>
                </div>
              </RadioGroup>

              <Button
                variant="destructive"
                className="w-full py-6 text-lg font-bold"
                onClick={startCountdown}
              >
                Request Help Now
              </Button>
            </div>
          ) : (
            <div className="space-y-6 text-center p-4">
              <div className="text-5xl font-bold text-destructive mb-2">{countdown}</div>
              <div className="text-lg">
                Help will be requested in {countdown} seconds
              </div>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                Your current location will be shared with emergency responders
              </div>
              <Button variant="outline" onClick={cancelRequest} className="w-full">
                Cancel Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmergencyButton;

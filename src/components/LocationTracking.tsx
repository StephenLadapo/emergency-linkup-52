import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface GeofenceZone {
  id: string;
  name: string;
  description?: string;
  zone_type: string;
  coordinates: any;
  radius?: number;
  is_active: boolean;
}

interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  zone_id?: string;
  zone_status?: string;
  created_at: string;
}

const LocationTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchZones();
      fetchRecentLocations();
    }
  }, [user]);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from("geofence_zones")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast({
        title: "Error",
        description: "Failed to fetch geofence zones",
        variant: "destructive",
      });
    }
  };

  const fetchRecentLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("user_locations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch location history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = async (latitude: number, longitude: number, accuracy?: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_locations")
        .insert({
          user_id: user.id,
          latitude,
          longitude,
          accuracy,
        });

      if (error) throw error;
      fetchRecentLocations();
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        saveLocation(latitude, longitude, accuracy);
        
        // Check for zone entry/exit (simplified implementation)
        checkZoneStatus(latitude, longitude);
      },
      (error) => {
        console.error("Location error:", error);
        toast({
          title: "Location Error",
          description: "Failed to get your location",
          variant: "destructive",
        });
      },
      options
    );

    setWatchId(id);
    setTrackingEnabled(true);
    toast({
      title: "Tracking Started",
      description: "Location tracking is now active",
    });
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTrackingEnabled(false);
    toast({
      title: "Tracking Stopped",
      description: "Location tracking has been disabled",
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        saveLocation(latitude, longitude, accuracy);
        toast({
          title: "Location Updated",
          description: "Your current location has been recorded",
        });
      },
      (error) => {
        console.error("Location error:", error);
        toast({
          title: "Location Error",
          description: "Failed to get your current location",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const checkZoneStatus = (latitude: number, longitude: number) => {
    // Simplified zone checking - in a real implementation, you'd use proper geofencing
    zones.forEach(zone => {
      if (zone.zone_type === 'hazard_zone') {
        // Example: trigger alert if user enters a hazard zone
        toast({
          title: "Zone Alert",
          description: `You have entered ${zone.name}`,
          variant: "destructive",
        });
      }
    });
  };

  const getZoneTypeColor = (type: string) => {
    switch (type) {
      case "safe_zone": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "restricted": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "evacuation_route": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "emergency_assembly": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "hazard_zone": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getZoneTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      safe_zone: "🛡️",
      restricted: "🚫",
      evacuation_route: "🚪",
      emergency_assembly: "🎯",
      hazard_zone: "⚠️",
    };
    return icons[type] || "📍";
  };

  if (loading) {
    return <div className="text-center">Loading location data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Location Tracking & Geofencing</h3>
          <p className="text-sm text-muted-foreground">
            Monitor your location and receive zone-based alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={getCurrentLocation} variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            Get Location
          </Button>
          {trackingEnabled ? (
            <Button onClick={stopTracking} variant="destructive">
              <Navigation className="w-4 h-4 mr-2" />
              Stop Tracking
            </Button>
          ) : (
            <Button onClick={startTracking}>
              <Navigation className="w-4 h-4 mr-2" />
              Start Tracking
            </Button>
          )}
        </div>
      </div>

      {/* Current Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {currentLocation ? (
                <div>
                  <p className="text-sm">
                    Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Location Available
                  </Badge>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">No location data available</p>
                  <Badge variant="secondary" className="mt-1">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Location Unknown
                  </Badge>
                </div>
              )}
            </div>
            <Badge variant={trackingEnabled ? "default" : "secondary"}>
              {trackingEnabled ? "Tracking Active" : "Tracking Disabled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Geofence Zones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Geofence Zones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active geofence zones configured.</p>
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getZoneTypeIcon(zone.zone_type)}</span>
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      {zone.description && (
                        <p className="text-sm text-muted-foreground">{zone.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={getZoneTypeColor(zone.zone_type)}>
                    {zone.zone_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Location History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Location History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No location history available.</p>
          ) : (
            <div className="space-y-3">
              {locations.slice(0, 5).map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    {location.accuracy && (
                      <p className="text-xs text-muted-foreground">
                        Accuracy: ±{Math.round(location.accuracy)}m
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(location.created_at), 'MMM dd, HH:mm')}
                    </p>
                    {location.zone_status && (
                      <Badge variant="outline" className="mt-1">
                        {location.zone_status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationTracking;
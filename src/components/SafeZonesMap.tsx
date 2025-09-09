import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MapPin, Shield, Plus, Phone, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface SafeZone {
  id: string;
  name: string;
  zone_type: string;
  latitude: number;
  longitude: number;
  description: string | null;
  capacity: number | null;
  operating_hours: string | null;
  contact_info: string | null;
  is_active: boolean;
  created_at: string;
}

const SafeZonesMap = () => {
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    zone_type: 'shelter',
    latitude: '',
    longitude: '',
    description: '',
    capacity: '',
    operating_hours: '',
    contact_info: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSafeZones();
    getCurrentLocation();
  }, []);

  const fetchSafeZones = async () => {
    try {
      const { data, error } = await supabase
        .from('safe_zones')
        .select('*')
        .eq('is_active', true)
        .order('zone_type');

      if (error) throw error;
      setSafeZones(data || []);
    } catch (error) {
      console.error('Error fetching safe zones:', error);
      toast({
        title: "Error",
        description: "Failed to load safe zones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const createSafeZone = async () => {
    try {
      const { error } = await supabase
        .from('safe_zones')
        .insert({
          name: newZone.name,
          zone_type: newZone.zone_type,
          latitude: parseFloat(newZone.latitude),
          longitude: parseFloat(newZone.longitude),
          description: newZone.description || null,
          capacity: newZone.capacity ? parseInt(newZone.capacity) : null,
          operating_hours: newZone.operating_hours || null,
          contact_info: newZone.contact_info || null
        });

      if (error) throw error;

      toast({
        title: "Safe Zone Created",
        description: "New safe zone has been added successfully",
      });

      setNewZone({
        name: '',
        zone_type: 'shelter',
        latitude: '',
        longitude: '',
        description: '',
        capacity: '',
        operating_hours: '',
        contact_info: ''
      });
      setShowCreateDialog(false);
      fetchSafeZones();
    } catch (error) {
      console.error('Error creating safe zone:', error);
      toast({
        title: "Error",
        description: "Failed to create safe zone",
        variant: "destructive",
      });
    }
  };

  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'clinic': return '🏥';
      case 'security_point': return '🔒';
      case 'shelter': return '🏠';
      case 'emergency_exit': return '🚪';
      default: return '📍';
    }
  };

  const getZoneColor = (type: string) => {
    switch (type) {
      case 'clinic': return 'bg-red-500';
      case 'security_point': return 'bg-blue-500';
      case 'shelter': return 'bg-green-500';
      case 'emergency_exit': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const groupedZones = safeZones.reduce((acc, zone) => {
    if (!acc[zone.zone_type]) {
      acc[zone.zone_type] = [];
    }
    acc[zone.zone_type].push(zone);
    return acc;
  }, {} as Record<string, SafeZone[]>);

  // Sort zones by distance if user location is available
  Object.keys(groupedZones).forEach(type => {
    if (userLocation) {
      groupedZones[type].sort((a, b) => {
        const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distanceA - distanceB;
      });
    }
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Safe Zones Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Safe Zones Map
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add Zone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Safe Zone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Zone Name</Label>
                  <Input
                    id="name"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    placeholder="Enter zone name"
                  />
                </div>
                <div>
                  <Label>Zone Type</Label>
                  <Select value={newZone.zone_type} onValueChange={(value) => setNewZone({ ...newZone, zone_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic">Medical Clinic</SelectItem>
                      <SelectItem value="security_point">Security Point</SelectItem>
                      <SelectItem value="shelter">Safe Shelter</SelectItem>
                      <SelectItem value="emergency_exit">Emergency Exit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={newZone.latitude}
                      onChange={(e) => setNewZone({ ...newZone, latitude: e.target.value })}
                      placeholder="-23.8962"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={newZone.longitude}
                      onChange={(e) => setNewZone({ ...newZone, longitude: e.target.value })}
                      placeholder="29.4410"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newZone.description}
                    onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                    placeholder="Zone description"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newZone.capacity}
                      onChange={(e) => setNewZone({ ...newZone, capacity: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact</Label>
                    <Input
                      id="contact"
                      value={newZone.contact_info}
                      onChange={(e) => setNewZone({ ...newZone, contact_info: e.target.value })}
                      placeholder="+27 123 456 789"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="hours">Operating Hours</Label>
                  <Input
                    id="hours"
                    value={newZone.operating_hours}
                    onChange={(e) => setNewZone({ ...newZone, operating_hours: e.target.value })}
                    placeholder="24/7 or 08:00 - 17:00"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createSafeZone} disabled={!newZone.name || !newZone.latitude || !newZone.longitude}>
                    Add Zone
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {userLocation && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </p>
          </div>
        )}

        {Object.keys(groupedZones).length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No safe zones available</p>
        ) : (
          Object.entries(groupedZones).map(([type, zones]) => (
            <div key={type} className="space-y-3">
              <h4 className="font-semibold capitalize flex items-center">
                <span className="mr-2">{getZoneIcon(type)}</span>
                {type.replace('_', ' ')}s ({zones.length})
              </h4>
              <div className="grid gap-3">
                {zones.map((zone) => (
                  <div key={zone.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">{zone.name}</h5>
                      <Badge className={getZoneColor(zone.zone_type)}>
                        {zone.zone_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {zone.description && (
                      <p className="text-sm text-muted-foreground">{zone.description}</p>
                    )}
                    
                    <div className="flex items-center text-sm space-x-4">
                      <span className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                      </span>
                      {userLocation && (
                        <span className="text-blue-600">
                          {calculateDistance(userLocation.lat, userLocation.lng, zone.latitude, zone.longitude).toFixed(1)}km away
                        </span>
                      )}
                    </div>
                    
                    {(zone.capacity || zone.operating_hours || zone.contact_info) && (
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        {zone.capacity && (
                          <span className="flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            {zone.capacity} capacity
                          </span>
                        )}
                        {zone.operating_hours && (
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {zone.operating_hours}
                          </span>
                        )}
                        {zone.contact_info && (
                          <span className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {zone.contact_info}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default SafeZonesMap;
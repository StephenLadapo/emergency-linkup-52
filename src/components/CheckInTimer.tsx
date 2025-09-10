import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Clock, Play, Pause, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CheckInTimer {
  id: string;
  timer_duration: number;
  start_time: string;
  expected_check_in: string;
  last_check_in: string | null;
  status: string;
  emergency_contacts: string[];
  location_data: any;
  created_at: string;
}

const CheckInTimer = () => {
  const [timers, setTimers] = useState<CheckInTimer[]>([]);
  const [activeTimer, setActiveTimer] = useState<CheckInTimer | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTimer, setNewTimer] = useState({
    duration: '30',
    emergencyContacts: ''
  });
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimers();
    getCurrentLocation();
    
    const interval = setInterval(() => {
      if (activeTimer && activeTimer.status === 'active') {
        updateTimeRemaining();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const fetchTimers = async () => {
    try {
      const { data, error } = await supabase
        .from('check_in_timers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setTimers(data || []);
      
      // Find active timer
      const active = data?.find(timer => timer.status === 'active');
      if (active) {
        setActiveTimer(active);
      }
    } catch (error) {
      console.error('Error fetching timers:', error);
      toast({
        title: "Error",
        description: "Failed to load check-in timers",
        variant: "destructive",
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
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

  const updateTimeRemaining = () => {
    if (!activeTimer) return;
    
    const now = new Date();
    const expectedCheckIn = new Date(activeTimer.expected_check_in);
    const remaining = Math.max(0, expectedCheckIn.getTime() - now.getTime());
    
    setTimeRemaining(remaining);
    
    // If time is up and no emergency has been triggered
    if (remaining === 0 && activeTimer.status === 'active') {
      triggerEmergencyAlert(activeTimer.id);
    }
  };

  const createTimer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const duration = parseInt(newTimer.duration);
      const startTime = new Date();
      const expectedCheckIn = new Date(startTime.getTime() + duration * 60 * 1000);
      
      const contacts = newTimer.emergencyContacts
        .split(',')
        .map(contact => contact.trim())
        .filter(contact => contact.length > 0);

      const { data, error } = await supabase
        .from('check_in_timers')
        .insert({
          user_id: user.id,
          timer_duration: duration,
          start_time: startTime.toISOString(),
          expected_check_in: expectedCheckIn.toISOString(),
          emergency_contacts: contacts,
          location_data: currentLocation ? {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            timestamp: new Date().toISOString()
          } : null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Timer Started",
        description: `Check-in timer set for ${duration} minutes`,
      });

      setActiveTimer(data);
      setNewTimer({ duration: '30', emergencyContacts: '' });
      setShowCreateDialog(false);
      fetchTimers();
    } catch (error) {
      console.error('Error creating timer:', error);
      toast({
        title: "Error",
        description: "Failed to create check-in timer",
        variant: "destructive",
      });
    }
  };

  const checkIn = async () => {
    if (!activeTimer) return;

    try {
      const { error } = await supabase
        .from('check_in_timers')
        .update({
          last_check_in: new Date().toISOString(),
          status: 'completed',
          location_data: currentLocation ? {
            ...activeTimer.location_data,
            check_in_location: {
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
              timestamp: new Date().toISOString()
            }
          } : activeTimer.location_data
        })
        .eq('id', activeTimer.id);

      if (error) throw error;

      toast({
        title: "Check-in Successful",
        description: "You've successfully checked in. Timer stopped.",
      });

      setActiveTimer(null);
      setTimeRemaining(0);
      fetchTimers();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      });
    }
  };

  const cancelTimer = async () => {
    if (!activeTimer) return;

    try {
      const { error } = await supabase
        .from('check_in_timers')
        .update({ status: 'completed' })
        .eq('id', activeTimer.id);

      if (error) throw error;

      toast({
        title: "Timer Cancelled",
        description: "Check-in timer has been cancelled",
      });

      setActiveTimer(null);
      setTimeRemaining(0);
      fetchTimers();
    } catch (error) {
      console.error('Error cancelling timer:', error);
    }
  };

  const triggerEmergencyAlert = async (timerId: string) => {
    try {
      // Update timer status
      const { error: updateError } = await supabase
        .from('check_in_timers')
        .update({ status: 'emergency_triggered' })
        .eq('id', timerId);

      if (updateError) throw updateError;

      // Create emergency request
      const { data: { user } } = await supabase.auth.getUser();
      if (user && currentLocation) {
        const { error: emergencyError } = await supabase
          .from('emergency_requests')
          .insert({
            user_id: user.id,
            type: 'general',
            title: 'Check-in Timer Emergency',
            description: 'User failed to check in within the specified time period. Automatic emergency alert triggered.',
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            status: 'pending'
          });

        if (emergencyError) throw emergencyError;
      }

      toast({
        title: "Emergency Alert Triggered",
        description: "You missed your check-in. Emergency services have been notified.",
        variant: "destructive",
      });

      setActiveTimer(null);
      fetchTimers();
    } catch (error) {
      console.error('Error triggering emergency alert:', error);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'missed': return 'bg-yellow-500';
      case 'emergency_triggered': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Safety Check-in Timer
          </CardTitle>
          {!activeTimer && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Start Timer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Check-in Timer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Timer Duration</Label>
                    <Select value={newTimer.duration} onValueChange={(value) => setNewTimer({ ...newTimer, duration: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contacts">Emergency Contacts (comma-separated)</Label>
                    <Input
                      id="contacts"
                      value={newTimer.emergencyContacts}
                      onChange={(e) => setNewTimer({ ...newTimer, emergencyContacts: e.target.value })}
                      placeholder="+27123456789, security@university.ac.za"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>If you don't check in within the specified time, an emergency alert will be automatically sent to campus security and your emergency contacts.</p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTimer}>
                      Start Timer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTimer ? (
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className="text-4xl font-bold mb-2">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-muted-foreground mb-4">
                Time remaining until check-in required
              </p>
              <div className="flex justify-center space-x-2">
                <Button onClick={checkIn} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Check In Now
                </Button>
                <Button variant="outline" onClick={cancelTimer}>
                  Cancel Timer
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Started: {new Date(activeTimer.start_time).toLocaleString()}</p>
              <p>Expected check-in: {new Date(activeTimer.expected_check_in).toLocaleString()}</p>
              {activeTimer.emergency_contacts.length > 0 && (
                <p>Emergency contacts: {activeTimer.emergency_contacts.join(', ')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No active check-in timer</p>
            <p className="text-sm text-muted-foreground">
              Start a safety timer to automatically alert emergency services if you don't check in within the specified time.
            </p>
          </div>
        )}

        {timers.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Recent Timers</h4>
            {timers.slice(0, 5).map((timer) => (
              <div key={timer.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{timer.timer_duration} minute timer</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(timer.start_time).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(timer.status)}>
                    {timer.status.replace('_', ' ')}
                  </Badge>
                </div>
                {timer.last_check_in && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Checked in: {new Date(timer.last_check_in).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckInTimer;
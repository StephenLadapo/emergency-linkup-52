import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EmergencyStatus {
  id: string;
  title: string;
  type: string;
  status: string;
  response_status: string;
  responder_eta: string | null;
  response_notes: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

const LiveStatusTracker = () => {
  const [emergencies, setEmergencies] = useState<EmergencyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmergencyStatuses();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('emergency-status-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_requests'
        },
        () => fetchEmergencyStatuses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEmergencyStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEmergencies(data || []);
    } catch (error) {
      console.error('Error fetching emergency statuses:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency statuses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, responseStatus: string) => {
    if (responseStatus === 'responders_dispatched') return 'bg-blue-500';
    if (responseStatus === 'responders_arrived') return 'bg-green-500';
    if (responseStatus === 'completed') return 'bg-green-600';
    if (status === 'pending') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusText = (status: string, responseStatus: string) => {
    if (responseStatus === 'responders_dispatched') return 'Responders on the way';
    if (responseStatus === 'responders_arrived') return 'Help has arrived';
    if (responseStatus === 'completed') return 'Emergency resolved';
    if (status === 'pending') return 'Emergency received';
    return 'Processing...';
  };

  const formatETA = (eta: string | null) => {
    if (!eta) return null;
    const etaDate = new Date(eta);
    const now = new Date();
    const diffMinutes = Math.ceil((etaDate.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Arriving now';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    return `${Math.ceil(diffMinutes / 60)} hr`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Status Tracker</CardTitle>
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
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Live Emergency Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {emergencies.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No active emergencies</p>
        ) : (
          emergencies.map((emergency) => (
            <div key={emergency.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{emergency.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {emergency.type} • {new Date(emergency.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge className={getStatusColor(emergency.status, emergency.response_status)}>
                  {getStatusText(emergency.status, emergency.response_status)}
                </Badge>
              </div>
              
              {emergency.responder_eta && (
                <div className="flex items-center text-sm">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>ETA: {formatETA(emergency.responder_eta)}</span>
                </div>
              )}
              
              {emergency.latitude && emergency.longitude && (
                <div className="flex items-center text-sm">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>Location: {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}</span>
                </div>
              )}
              
              {emergency.response_notes && (
                <div className="bg-muted p-2 rounded text-sm">
                  <strong>Update:</strong> {emergency.response_notes}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default LiveStatusTracker;
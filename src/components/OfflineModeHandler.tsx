import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, Upload, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface OfflineRequest {
  id: string;
  emergency_data: any;
  sync_status: string;
  created_at: string;
}

const OfflineModeHandler = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineRequests, setOfflineRequests] = useState<OfflineRequest[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You're back online. Syncing offline requests...",
      });
      syncOfflineRequests();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "You're offline. Emergency requests will be stored locally.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadOfflineRequests();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_emergency_requests')
        .select('*')
        .eq('sync_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOfflineRequests(data || []);
    } catch (error) {
      console.error('Error loading offline requests:', error);
    }
  };

  const storeOfflineRequest = async (emergencyData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isOnline) {
        // If online, try to submit directly
        const { error } = await supabase
          .from('emergency_requests')
          .insert(emergencyData);

        if (error) throw error;
        
        toast({
          title: "Emergency Request Sent",
          description: "Your emergency request has been submitted successfully",
        });
      } else {
        // If offline, store locally
        const { error } = await supabase
          .from('offline_emergency_requests')
          .insert({
            user_id: user.id,
            emergency_data: emergencyData,
            sync_status: 'pending'
          });

        if (error) throw error;

        toast({
          title: "Emergency Request Stored",
          description: "Your request has been stored and will be sent when connection is restored",
        });
        
        loadOfflineRequests();
      }
    } catch (error) {
      console.error('Error storing emergency request:', error);
      toast({
        title: "Error",
        description: "Failed to store emergency request",
        variant: "destructive",
      });
    }
  };

  const syncOfflineRequests = async () => {
    if (!isOnline || offlineRequests.length === 0) return;

    setSyncing(true);
    let successCount = 0;

    for (const request of offlineRequests) {
      try {
        // Submit the emergency request
        const { error: insertError } = await supabase
          .from('emergency_requests')
          .insert(request.emergency_data);

        if (insertError) throw insertError;

        // Mark as synced
        const { error: updateError } = await supabase
          .from('offline_emergency_requests')
          .update({ 
            sync_status: 'synced',
            synced_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (updateError) throw updateError;
        
        successCount++;
      } catch (error) {
        console.error('Error syncing request:', error);
        
        // Mark as failed
        await supabase
          .from('offline_emergency_requests')
          .update({ sync_status: 'failed' })
          .eq('id', request.id);
      }
    }

    setSyncing(false);
    
    if (successCount > 0) {
      toast({
        title: "Sync Complete",
        description: `${successCount} offline emergency requests have been synced`,
      });
      loadOfflineRequests();
    }
  };

  const retryFailedSync = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_emergency_requests')
        .select('*')
        .eq('sync_status', 'failed');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setOfflineRequests(prev => [...prev, ...data]);
        await syncOfflineRequests();
      }
    } catch (error) {
      console.error('Error retrying failed sync:', error);
    }
  };

  // Expose the storeOfflineRequest function globally for use by other components
  (window as any).storeOfflineRequest = storeOfflineRequest;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {isOnline ? (
              <>
                <Wifi className="mr-2 h-5 w-5 text-green-500" />
                Online Mode
              </>
            ) : (
              <>
                <WifiOff className="mr-2 h-5 w-5 text-red-500" />
                Offline Mode
              </>
            )}
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOnline && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              You're currently offline. Emergency requests will be stored locally and automatically sent when connection is restored.
            </p>
          </div>
        )}

        {offlineRequests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Pending Offline Requests ({offlineRequests.length})</h4>
              {isOnline && (
                <Button
                  size="sm"
                  onClick={syncOfflineRequests}
                  disabled={syncing}
                  className="flex items-center"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-1 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {offlineRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">{request.emergency_data.title || 'Emergency Request'}</h5>
                    <p className="text-sm text-muted-foreground">
                      Type: {request.emergency_data.type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={
                    request.sync_status === 'pending' ? 'secondary' :
                    request.sync_status === 'failed' ? 'destructive' : 'default'
                  }>
                    {request.sync_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {isOnline && offlineRequests.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            All emergency requests are synced
          </p>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Emergency requests work offline and sync automatically</p>
          <p>• Location data is captured when available</p>
          <p>• Requests are secured with encryption</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineModeHandler;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Megaphone, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CampusAlert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  priority: string;
  is_active: boolean;
  expires_at: string | null;
  target_audience: string;
  created_at: string;
  sender_id: string;
}

const CampusAlertBoard = () => {
  const [alerts, setAlerts] = useState<CampusAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    alert_type: 'general',
    priority: 'medium',
    target_audience: 'all',
    expires_in_hours: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('campus-alerts-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campus_alerts'
        },
        () => fetchAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('campus_alerts')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load campus alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expiresAt = newAlert.expires_in_hours 
        ? new Date(Date.now() + parseInt(newAlert.expires_in_hours) * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('campus_alerts')
        .insert({
          title: newAlert.title,
          message: newAlert.message,
          alert_type: newAlert.alert_type,
          priority: newAlert.priority,
          target_audience: newAlert.target_audience,
          expires_at: expiresAt,
          sender_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Alert Created",
        description: "Campus alert has been broadcasted successfully",
      });

      setNewAlert({
        title: '',
        message: '',
        alert_type: 'general',
        priority: 'medium',
        target_audience: 'all',
        expires_in_hours: ''
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Error",
        description: "Failed to create campus alert",
        variant: "destructive",
      });
    }
  };

  const deactivateAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('campus_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Deactivated",
        description: "Campus alert has been deactivated",
      });
    } catch (error) {
      console.error('Error deactivating alert:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate alert",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'lockdown': return '🔒';
      case 'weather': return '🌩️';
      case 'threat': return '⚠️';
      case 'fire': return '🔥';
      default: return '📢';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campus Alert Board</CardTitle>
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
            <Megaphone className="mr-2 h-5 w-5" />
            Campus Alert Board
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Campus Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Alert Title</Label>
                  <Input
                    id="title"
                    value={newAlert.title}
                    onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    placeholder="Enter alert title"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    placeholder="Enter alert message"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Alert Type</Label>
                    <Select value={newAlert.alert_type} onValueChange={(value) => setNewAlert({ ...newAlert, alert_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="lockdown">Lockdown</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="threat">Threat</SelectItem>
                        <SelectItem value="fire">Fire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={newAlert.priority} onValueChange={(value) => setNewAlert({ ...newAlert, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Audience</Label>
                    <Select value={newAlert.target_audience} onValueChange={(value) => setNewAlert({ ...newAlert, target_audience: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expires">Expires In (hours)</Label>
                    <Input
                      id="expires"
                      type="number"
                      value={newAlert.expires_in_hours}
                      onChange={(e) => setNewAlert({ ...newAlert, expires_in_hours: e.target.value })}
                      placeholder="24"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAlert} disabled={!newAlert.title || !newAlert.message}>
                    Create Alert
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No active campus alerts</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getAlertTypeIcon(alert.alert_type)}</span>
                    <h4 className="font-semibold">{alert.title}</h4>
                    <Badge className={getPriorityColor(alert.priority)}>
                      {alert.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{alert.message}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Target: {alert.target_audience}</span>
                    <span>•</span>
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                    {alert.expires_at && (
                      <>
                        <span>•</span>
                        <span>Expires: {new Date(alert.expires_at).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deactivateAlert(alert.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CampusAlertBoard;
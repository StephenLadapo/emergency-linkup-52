import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Radio, Users, AlertTriangle, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface EmergencyBroadcast {
  id: string;
  title: string;
  message: string;
  broadcast_type: string;
  priority: string;
  target_audience: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

const EmergencyBroadcast = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<EmergencyBroadcast[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    broadcast_type: "",
    priority: "",
    target_audience: "all",
    expires_at: "",
  });

  useEffect(() => {
    if (user) {
      fetchBroadcasts();
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      setUserRole(data?.role || "");
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_broadcasts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBroadcasts(data || []);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch emergency broadcasts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dataToSave = {
        ...formData,
        sender_id: user.id,
        expires_at: formData.expires_at || null,
      };

      const { error } = await supabase
        .from("emergency_broadcasts")
        .insert(dataToSave);
      
      if (error) throw error;
      
      toast({ 
        title: "Success", 
        description: "Emergency broadcast sent successfully" 
      });

      setIsDialogOpen(false);
      setFormData({ title: "", message: "", broadcast_type: "", priority: "", target_audience: "all", expires_at: "" });
      fetchBroadcasts();
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast({
        title: "Error",
        description: "Failed to send emergency broadcast",
        variant: "destructive",
      });
    }
  };

  const deactivateBroadcast = async (id: string) => {
    try {
      const { error } = await supabase
        .from("emergency_broadcasts")
        .update({ is_active: false })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Broadcast deactivated" });
      fetchBroadcasts();
    } catch (error) {
      console.error("Error deactivating broadcast:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate broadcast",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getBroadcastTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      general: "📢",
      weather: "🌦️",
      security: "🔒",
      medical: "🏥",
      evacuation: "🚨",
      all_clear: "✅",
    };
    return icons[type] || "📢";
  };

  const canCreateBroadcast = userRole === "admin" || userRole === "security_staff";

  if (loading) {
    return <div className="text-center">Loading emergency broadcasts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Emergency Broadcasts</h3>
          <p className="text-sm text-muted-foreground">
            View active emergency alerts and notifications
          </p>
        </div>
        {canCreateBroadcast && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setFormData({ title: "", message: "", broadcast_type: "", priority: "", target_audience: "all", expires_at: "" });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Send Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Emergency Broadcast</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Broadcast Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Emergency alert title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="broadcast_type">Broadcast Type</Label>
                  <Select 
                    value={formData.broadcast_type} 
                    onValueChange={(value) => setFormData({ ...formData, broadcast_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select broadcast type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="weather">Weather</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="evacuation">Evacuation</SelectItem>
                      <SelectItem value="all_clear">All Clear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Select 
                    value={formData.target_audience} 
                    onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="staff">Staff Only</SelectItem>
                      <SelectItem value="faculty">Faculty Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expires_at">Expires At (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Detailed emergency message..."
                    rows={4}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Send Broadcast
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {broadcasts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No active emergency broadcasts.</p>
              <p className="text-sm text-muted-foreground">Emergency alerts will appear here when issued.</p>
            </CardContent>
          </Card>
        ) : (
          broadcasts.map((broadcast) => {
            const isExpired = broadcast.expires_at && new Date(broadcast.expires_at) < new Date();
            return (
              <Card key={broadcast.id} className={broadcast.priority === 'critical' ? "border-destructive" : broadcast.priority === 'high' ? "border-orange-500" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="text-lg">{getBroadcastTypeIcon(broadcast.broadcast_type)}</span>
                        {broadcast.title}
                        {!broadcast.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {isExpired && (
                          <Badge variant="outline">Expired</Badge>
                        )}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getPriorityColor(broadcast.priority)}>
                          {broadcast.priority.charAt(0).toUpperCase() + broadcast.priority.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {broadcast.target_audience}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {format(parseISO(broadcast.created_at), 'MMM dd, HH:mm')}
                      </div>
                      {canCreateBroadcast && broadcast.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deactivateBroadcast(broadcast.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{broadcast.message}</p>
                  {broadcast.expires_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Expires: {format(parseISO(broadcast.expires_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EmergencyBroadcast;
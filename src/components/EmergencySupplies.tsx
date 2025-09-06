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
import { Trash2, Edit, Plus, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";

interface EmergencySupply {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  expiry_date?: string;
  location?: string;
  notes?: string;
  last_checked?: string;
  created_at: string;
}

const EmergencySupplies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supplies, setSupplies] = useState<EmergencySupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<EmergencySupply | null>(null);
  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    quantity: 1,
    expiry_date: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchSupplies();
    }
  }, [user]);

  const fetchSupplies = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_supplies")
        .select("*")
        .order("category")
        .order("item_name");

      if (error) throw error;
      setSupplies(data || []);
    } catch (error) {
      console.error("Error fetching supplies:", error);
      toast({
        title: "Error",
        description: "Failed to fetch emergency supplies",
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
        expiry_date: formData.expiry_date || null,
        location: formData.location || null,
        notes: formData.notes || null,
      };

      if (editingSupply) {
        const { error } = await supabase
          .from("emergency_supplies")
          .update(dataToSave)
          .eq("id", editingSupply.id);
        if (error) throw error;
        toast({ title: "Success", description: "Supply updated successfully" });
      } else {
        const { error } = await supabase
          .from("emergency_supplies")
          .insert({ ...dataToSave, user_id: user.id });
        if (error) throw error;
        toast({ title: "Success", description: "Supply added successfully" });
      }

      setIsDialogOpen(false);
      setEditingSupply(null);
      setFormData({ item_name: "", category: "", quantity: 1, expiry_date: "", location: "", notes: "" });
      fetchSupplies();
    } catch (error) {
      console.error("Error saving supply:", error);
      toast({
        title: "Error",
        description: "Failed to save supply",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("emergency_supplies")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Supply deleted successfully" });
      fetchSupplies();
    } catch (error) {
      console.error("Error deleting supply:", error);
      toast({
        title: "Error",
        description: "Failed to delete supply",
        variant: "destructive",
      });
    }
  };

  const updateLastChecked = async (id: string) => {
    try {
      const { error } = await supabase
        .from("emergency_supplies")
        .update({ last_checked: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Marked as checked" });
      fetchSupplies();
    } catch (error) {
      console.error("Error updating last checked:", error);
      toast({
        title: "Error",
        description: "Failed to update check status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (supply: EmergencySupply) => {
    setEditingSupply(supply);
    setFormData({
      item_name: supply.item_name,
      category: supply.category,
      quantity: supply.quantity,
      expiry_date: supply.expiry_date || "",
      location: supply.location || "",
      notes: supply.notes || "",
    });
    setIsDialogOpen(true);
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return "expired";
    if (days <= 30) return "expiring";
    return "good";
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: "🍞",
      water: "💧",
      medical: "🏥",
      tools: "🔧",
      clothing: "👕",
      documents: "📄",
      other: "📦",
    };
    return icons[category] || "📦";
  };

  if (loading) {
    return <div className="text-center">Loading emergency supplies...</div>;
  }

  const groupedSupplies = supplies.reduce((acc, supply) => {
    if (!acc[supply.category]) acc[supply.category] = [];
    acc[supply.category].push(supply);
    return acc;
  }, {} as Record<string, EmergencySupply[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Emergency Supply Inventory</h3>
          <p className="text-sm text-muted-foreground">
            Track your emergency supplies and their expiration dates
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSupply(null);
              setFormData({ item_name: "", category: "", quantity: 1, expiry_date: "", location: "", notes: "" });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supply
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSupply ? "Edit Supply" : "Add Emergency Supply"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="item_name">Item Name</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Kitchen cabinet, Storage room"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingSupply ? "Update" : "Add"} Supply
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedSupplies).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No emergency supplies added yet.</p>
              <p className="text-sm text-muted-foreground">Start building your emergency kit.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedSupplies).map(([category, categorySupplies]) => (
            <div key={category}>
              <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                <span className="text-lg">{getCategoryIcon(category)}</span>
                {category.charAt(0).toUpperCase() + category.slice(1)}
                <Badge variant="secondary">{categorySupplies.length}</Badge>
              </h4>
              <div className="grid gap-4">
                {categorySupplies.map((supply) => {
                  const expiryStatus = getExpiryStatus(supply.expiry_date);
                  return (
                    <Card key={supply.id} className={expiryStatus === 'expired' ? "border-destructive" : expiryStatus === 'expiring' ? "border-yellow-500" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-base">{supply.item_name}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">Qty: {supply.quantity}</Badge>
                              {supply.expiry_date && (
                                <Badge 
                                  variant={expiryStatus === 'expired' ? 'destructive' : expiryStatus === 'expiring' ? 'outline' : 'secondary'}
                                >
                                  {expiryStatus === 'expired' ? '❌ Expired' : 
                                   expiryStatus === 'expiring' ? '⚠️ Expiring' : '✅ Good'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateLastChecked(supply.id)}
                              title="Mark as checked"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(supply)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(supply.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {supply.expiry_date && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {format(parseISO(supply.expiry_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                        {supply.location && (
                          <p className="text-sm text-muted-foreground">
                            Location: {supply.location}
                          </p>
                        )}
                        {supply.notes && (
                          <p className="text-sm text-muted-foreground">
                            Notes: {supply.notes}
                          </p>
                        )}
                        {supply.last_checked && (
                          <p className="text-xs text-muted-foreground">
                            Last checked: {format(parseISO(supply.last_checked), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmergencySupplies;
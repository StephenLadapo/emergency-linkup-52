
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PlusCircle, X, Phone, Mail, MapPin, UserPlus, Shield, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  is_primary?: boolean;
};

type MedicalInfo = {
  blood_type: string;
  allergies: string;
  conditions: string;
  medications: string;
  medical_aid_number?: string;
  medical_aid_provider?: string;
  doctor_name?: string;
  doctor_contact?: string;
};

type UserProfile = {
  id: string;
  full_name: string;
  username?: string;
  student_number?: string;
  phone_number?: string;
  address?: string;
  faculty?: string;
  year_of_study?: string;
  avatar_url?: string;
  department?: string;
};

const UserProfile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    id: '',
    name: '',
    relation: '',
    phone: '',
    email: '',
    is_primary: false
  });
  const [showAddContact, setShowAddContact] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          setProfile(profileData);
        } else {
          // Create initial profile if it doesn't exist
          const initialProfile = {
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || '',
            username: authUser.user_metadata?.username || '',
            student_number: authUser.user_metadata?.student_id || '',
            phone_number: '',
            address: '',
            faculty: '',
            year_of_study: '',
            avatar_url: '',
            department: ''
          };
          setProfile(initialProfile);
        }

        // Fetch medical info
        const { data: medicalData, error: medicalError } = await supabase
          .from('medical_info')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (medicalError && medicalError.code !== 'PGRST116') {
          throw medicalError;
        }

        if (medicalData) {
          setMedicalInfo(medicalData);
        } else {
          // Initialize empty medical info
          setMedicalInfo({
            blood_type: '',
            allergies: '',
            conditions: '',
            medications: '',
            medical_aid_number: '',
            medical_aid_provider: '',
            doctor_name: '',
            doctor_contact: ''
          });
        }

        // Fetch emergency contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', authUser.id)
          .order('is_primary', { ascending: false });

        if (contactsError) {
          throw contactsError;
        }

        setEmergencyContacts(contactsData || []);
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser?.id]);
  
  const handleUpdateProfile = async () => {
    if (!profile || !authUser?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          full_name: profile.full_name,
          student_number: profile.student_number,
          phone_number: profile.phone_number,
          address: profile.address,
          faculty: profile.faculty,
          year_of_study: profile.year_of_study
        });

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };
  
  const handleUpdateMedical = async () => {
    if (!medicalInfo || !authUser?.id) return;

    try {
      const { error } = await supabase
        .from('medical_info')
        .upsert({
          user_id: authUser.id,
          blood_type: medicalInfo.blood_type,
          allergies: medicalInfo.allergies,
          conditions: medicalInfo.conditions,
          medications: medicalInfo.medications,
          medical_aid_number: medicalInfo.medical_aid_number,
          medical_aid_provider: medicalInfo.medical_aid_provider,
          doctor_name: medicalInfo.doctor_name,
          doctor_contact: medicalInfo.doctor_contact
        });

      if (error) throw error;

      toast.success('Medical information updated successfully!');
    } catch (error: any) {
      console.error('Error updating medical info:', error);
      toast.error('Failed to update medical information');
    }
  };
  
  const handleAddContact = async () => {
    if (!authUser?.id) return;
    
    if (!newContact.name || !newContact.phone) {
      toast.error('Please provide at least a name and phone number.');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: authUser.id,
          name: newContact.name,
          relation: newContact.relation,
          phone: newContact.phone,
          email: newContact.email,
          is_primary: newContact.is_primary
        })
        .select()
        .single();

      if (error) throw error;

      setEmergencyContacts([...emergencyContacts, data]);
      
      setNewContact({
        id: '',
        name: '',
        relation: '',
        phone: '',
        email: '',
        is_primary: false
      });
      
      setShowAddContact(false);
      
      toast.success('Emergency contact added successfully!');
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add emergency contact');
    }
  };
  
  const handleRemoveContact = async (id: string) => {
    if (!authUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', authUser.id);

      if (error) throw error;

      setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
      
      toast.success('Contact removed successfully!');
    } catch (error: any) {
      console.error('Error removing contact:', error);
      toast.error('Failed to remove contact');
    }
  };
  
  const handleSetPrimaryContact = async (id: string) => {
    if (!authUser?.id) return;
    
    try {
      // First, set all contacts to not primary
      await supabase
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', authUser.id);

      // Then set the selected contact as primary
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_primary: true })
        .eq('id', id)
        .eq('user_id', authUser.id);

      if (error) throw error;

      // Update local state
      setEmergencyContacts(emergencyContacts.map(contact => ({
        ...contact,
        is_primary: contact.id === id
      })));
      
      toast.success('Primary contact updated!');
    } catch (error: any) {
      console.error('Error updating primary contact:', error);
      toast.error('Failed to update primary contact');
    }
  };
  
  
  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }
  
  if (!authUser) {
    return <div className="text-center">Please login to view your profile.</div>;
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />Personal Info
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />Medical Info
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />Emergency Contacts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={profile?.full_name || ''} 
                    onChange={(e) => setProfile(profile ? {...profile, full_name: e.target.value} : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={authUser.email || ''} 
                    readOnly 
                    className="bg-muted/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input 
                    id="studentId" 
                    value={profile?.student_number || ''}
                    onChange={(e) => setProfile(profile ? {...profile, student_number: e.target.value} : null)}
                    placeholder="Enter your student ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    id="phoneNumber" 
                    value={profile?.phone_number || ''}
                    onChange={(e) => setProfile(profile ? {...profile, phone_number: e.target.value} : null)}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="address">Campus Address/Residence</Label>
                  <Input 
                    id="address" 
                    value={profile?.address || ''}
                    onChange={(e) => setProfile(profile ? {...profile, address: e.target.value} : null)}
                    placeholder="Enter your campus address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty</Label>
                  <Input 
                    id="faculty" 
                    value={profile?.faculty || ''}
                    onChange={(e) => setProfile(profile ? {...profile, faculty: e.target.value} : null)}
                    placeholder="Enter your faculty"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearOfStudy">Year of Study</Label>
                  <Input 
                    id="yearOfStudy" 
                    value={profile?.year_of_study || ''}
                    onChange={(e) => setProfile(profile ? {...profile, year_of_study: e.target.value} : null)}
                    placeholder="Enter your year of study"
                  />
                </div>
              </div>
              
              <Button onClick={handleUpdateProfile} className="w-full">
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Input 
                    id="bloodType" 
                    value={medicalInfo?.blood_type || ''} 
                    onChange={(e) => setMedicalInfo(medicalInfo ? {
                      ...medicalInfo, 
                      blood_type: e.target.value
                    } : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="medicalAidNumber">Medical Aid Number</Label>
                  <Input 
                    id="medicalAidNumber" 
                    value={medicalInfo?.medical_aid_number || ''} 
                    onChange={(e) => setMedicalInfo(medicalInfo ? {
                      ...medicalInfo, 
                      medical_aid_number: e.target.value
                    } : null)}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="medicalAidProvider">Medical Aid Provider</Label>
                  <Input 
                    id="medicalAidProvider" 
                    value={medicalInfo?.medical_aid_provider || ''} 
                    onChange={(e) => setMedicalInfo(medicalInfo ? {
                      ...medicalInfo, 
                      medical_aid_provider: e.target.value
                    } : null)}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea 
                    id="allergies" 
                    value={medicalInfo?.allergies || ''} 
                    onChange={(e) => setMedicalInfo(medicalInfo ? {
                      ...medicalInfo, 
                      allergies: e.target.value
                    } : null)}
                    placeholder="List any allergies, or write 'None' if not applicable"
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="conditions">Medical Conditions</Label>
                  <Textarea 
                    id="conditions" 
                    value={medicalInfo?.conditions || ''} 
                    onChange={(e) => setMedicalInfo(medicalInfo ? {
                      ...medicalInfo, 
                      conditions: e.target.value
                    } : null)}
                    placeholder="List any medical conditions, or write 'None' if not applicable"
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea 
                    id="medications" 
                    value={medicalInfo?.medications || ''} 
                    onChange={(e) => setMedicalInfo(medicalInfo ? {
                      ...medicalInfo, 
                      medications: e.target.value
                    } : null)}
                    placeholder="List any medications you are currently taking, or write 'None' if not applicable"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor's Name</Label>
                  <Input 
                    id="doctorName" 
                    value={medicalInfo?.doctor_name || ''} 
                    onChange={(e) => setMedicalInfo(medicalInfo ? {
                      ...medicalInfo, 
                      doctor_name: e.target.value
                    } : null)}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doctorContact">Doctor's Contact</Label>
                  <Input 
                    id="doctorContact" 
                    value={medicalInfo?.doctor_contact || ''} 
                    onChange={(e) => setMedicalInfo(medicalInfo ? {
                      ...medicalInfo, 
                      doctor_contact: e.target.value
                    } : null)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <Button onClick={handleUpdateMedical} className="w-full">
                Update Medical Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Emergency Contacts</CardTitle>
              {!showAddContact && (
                <Button variant="outline" onClick={() => setShowAddContact(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddContact && (
                <Card className="border-dashed border-primary/50 bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Name</Label>
                        <Input 
                          id="contactName" 
                          value={newContact.name} 
                          onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                          placeholder="Contact Name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contactRelation">Relationship</Label>
                        <Input 
                          id="contactRelation" 
                          value={newContact.relation} 
                          onChange={(e) => setNewContact({...newContact, relation: e.target.value})}
                          placeholder="e.g. Parent, Sibling, Friend"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Phone Number</Label>
                        <Input 
                          id="contactPhone" 
                          value={newContact.phone} 
                          onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                          placeholder="Contact Phone Number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">Email (Optional)</Label>
                        <Input 
                          id="contactEmail" 
                          value={newContact.email || ''} 
                          onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                          placeholder="Contact Email"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <Button onClick={handleAddContact} className="flex-1">
                        Save Contact
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddContact(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-4">
                {emergencyContacts.length > 0 ? (
                  emergencyContacts.map((contact) => (
                    <div key={contact.id} className="border p-4 rounded-md relative">
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-full"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <div className="font-medium text-lg mb-1">{contact.name}</div>
                        <div>
                          {contact.is_primary ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900/20 dark:text-green-300">
                              Primary Contact
                            </span>
                          ) : (
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => handleSetPrimaryContact(contact.id)} 
                              className="text-xs p-0 h-auto"
                            >
                              Set as primary
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-1">{contact.relation}</div>
                      
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                        
                        {contact.email && (
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No emergency contacts added yet.</p>
                    <p className="text-sm">Add contacts who should be notified during emergencies.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ChevronRight,
  LogOut,
  Trash2,
  AlertTriangle,
  Loader2,
  Users,
  Settings,
  Camera,
  Plus
} from 'lucide-react';

interface Patient {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  height: number | null;
  weight: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  user_id: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [mainPatient, setMainPatient] = useState<Patient | null>(null);
  const [familyPatients, setFamilyPatients] = useState<Patient[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    phone: '',
    height: 0,
    weight: 0
  });

  const [familyForm, setFamilyForm] = useState({
    dni: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    height: '',
    weight: '',
    gender: ''
  });

  useEffect(() => {
    fetchPatients();
  }, [user, profile]);

  const fetchPatients = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data: patients, error } = await supabase
        .from('patients_app')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (patients && patients.length > 0) {
        const main = patients.find(p => p.id === profile?.patient_main);
        if (main) {
          setMainPatient(main);
          setEditForm({
            phone: main.phone || '',
            height: main.height || 170,
            weight: main.weight || 70
          });
        }

        const family = patients.filter(p => p.id !== profile?.patient_main);
        setFamilyPatients(family);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Máximo 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Delete old avatar if exists
      if (profile?.avatar_url?.includes('/avatars/')) {
        const urlParts = profile.avatar_url.split('/avatars/');
        if (urlParts.length === 2) {
          await supabase.storage.from('avatars').remove([urlParts[1]]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      refreshProfile();
      toast.success('Foto actualizada');
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error('Error al subir foto');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = async () => {
    if (!mainPatient) return;

    try {
      await supabase
        .from('patients_app')
        .update({
          phone: editForm.phone,
          height: editForm.height,
          weight: editForm.weight
        })
        .eq('id', mainPatient.id);

      toast.success('Perfil actualizado');
      setIsEditingProfile(false);
      fetchPatients();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleAddFamily = async () => {
    if (!familyForm.dni || !familyForm.first_name || !familyForm.last_name || !familyForm.birth_date) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    if (!user?.id) return;

    try {
      await supabase.from('patients_app').insert({
        dni: familyForm.dni,
        first_name: familyForm.first_name,
        last_name: familyForm.last_name,
        birth_date: familyForm.birth_date,
        height: familyForm.height ? parseInt(familyForm.height) : null,
        weight: familyForm.weight ? parseInt(familyForm.weight) : null,
        gender: familyForm.gender || null,
        user_id: user.id
      });

      toast.success('Familiar agregado');
      setIsAddingFamily(false);
      setFamilyForm({ dni: '', first_name: '', last_name: '', birth_date: '', height: '', weight: '', gender: '' });
      fetchPatients();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Ya existe un paciente con ese DNI');
      } else {
        toast.error('Error al agregar');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    setDeleting(true);
    try {
      const { data: medicalFiles } = await supabase
        .from('medical_files')
        .select('file_path')
        .eq('user_id', user.id);

      if (medicalFiles?.length) {
        await supabase.storage.from('medical-files').remove(medicalFiles.map(f => f.file_path));
      }

      await supabase.from('medical_files').delete().eq('user_id', user.id);
      await supabase.from('patients_app').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);

      toast.success('Cuenta eliminada');
      await signOut();
      navigate('/login');
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getInitials = () => {
    if (mainPatient) {
      return `${mainPatient.first_name.charAt(0)}${mainPatient.last_name.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  const displayName = mainPatient
    ? `${mainPatient.first_name} ${mainPatient.last_name}`
    : profile?.name || 'Usuario';

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-5 pt-10 pb-28">
        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-8">Cuenta</h1>

        {/* Profile Card */}
        <button
          onClick={() => setIsEditingProfile(true)}
          className="w-full flex items-center gap-4 py-4 border-b border-border"
        >
          <div className="relative">
            <Avatar className="w-14 h-14">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-muted text-foreground font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Menu Items */}
        <div className="mt-6 space-y-1">
          <MenuItem
            icon={Settings}
            title="General"
            subtitle="Altura, peso y datos personales"
            onClick={() => setIsEditingProfile(true)}
          />
          
          <MenuItem
            icon={Users}
            title="Grupo Familiar"
            subtitle={`${familyPatients.length} familiar${familyPatients.length !== 1 ? 'es' : ''} registrado${familyPatients.length !== 1 ? 's' : ''}`}
            onClick={() => setIsAddingFamily(true)}
          />

          <MenuItem
            icon={LogOut}
            title="Cerrar sesión"
            subtitle="Salir de tu cuenta"
            onClick={handleSignOut}
          />
        </div>

        {/* Delete Account */}
        <div className="mt-10">
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger asChild>
              <button className="text-sm text-destructive hover:underline">
                Eliminar cuenta
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Eliminar Cuenta
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground py-4">
                Esta acción eliminará permanentemente tu cuenta y todos tus datos.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting} className="flex-1">
                  {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Eliminar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Profile Sheet */}
        <Sheet open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="text-left">Editar Perfil</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 pt-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-muted text-foreground font-semibold text-2xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-foreground rounded-full flex items-center justify-center"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 text-background animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-background" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">Toca para cambiar foto</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Teléfono</label>
                  <Input
                    placeholder="+51 999 999 999"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Altura (cm)</label>
                    <Input
                      type="number"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Peso (kg)</label>
                    <Input
                      type="number"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button onClick={handleUpdateProfile} className="w-full">
                  Guardar
                </Button>
                <Button variant="ghost" onClick={() => setIsEditingProfile(false)} className="w-full">
                  Cancelar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Add Family Dialog */}
        <Dialog open={isAddingFamily} onOpenChange={setIsAddingFamily}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Grupo Familiar</DialogTitle>
            </DialogHeader>
            
            {/* Family List */}
            {familyPatients.length > 0 && (
              <div className="space-y-2 mb-4">
                {familyPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-background text-foreground text-sm">
                        {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{patient.first_name} {patient.last_name}</p>
                      <p className="text-xs text-muted-foreground">DNI: {patient.dni}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Family Form */}
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Agregar nuevo familiar</p>
              <Input
                placeholder="DNI"
                value={familyForm.dni}
                onChange={(e) => setFamilyForm({ ...familyForm, dni: e.target.value.replace(/\D/g, '') })}
                maxLength={8}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nombre"
                  value={familyForm.first_name}
                  onChange={(e) => setFamilyForm({ ...familyForm, first_name: e.target.value })}
                />
                <Input
                  placeholder="Apellido"
                  value={familyForm.last_name}
                  onChange={(e) => setFamilyForm({ ...familyForm, last_name: e.target.value })}
                />
              </div>
              <Input
                type="date"
                placeholder="Fecha de nacimiento"
                value={familyForm.birth_date}
                onChange={(e) => setFamilyForm({ ...familyForm, birth_date: e.target.value })}
              />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAddingFamily(false)} className="flex-1">
                  Cerrar
                </Button>
                <Button onClick={handleAddFamily} className="flex-1">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

// Menu Item Component
const MenuItem = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClick 
}: { 
  icon: any; 
  title: string; 
  subtitle: string; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 py-4 hover:bg-muted/50 rounded-xl transition-colors px-2 -mx-2"
  >
    <Icon className="w-5 h-5 text-muted-foreground" />
    <div className="flex-1 text-left">
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </button>
);

export default Profile;

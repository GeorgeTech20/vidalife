import { useState, useEffect } from 'react';
import { FolderOpen, HeartPulse, ChevronRight, LogOut, Check, Star } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import HealthProfile from '@/components/HealthProfile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePatient } from '@/hooks/useActivePatient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { activePatient } = useActivePatient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPatients();
    }
  }, [user?.id]);

  const fetchPatients = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('patients_app')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleSelectPatient = async (patientId: string) => {
    if (!user?.id) return;
    try {
      await supabase
        .from('profiles')
        .update({ patient_active: patientId })
        .eq('user_id', user.id);
      
      refreshProfile();
      setOpen(false);
      toast.success('Paciente seleccionado');
    } catch (error) {
      console.error('Error selecting patient:', error);
    }
  };

  const displayName = activePatient 
    ? activePatient.first_name
    : profile?.name || 'Usuario';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getInitials = (name?: string, lastName?: string) => {
    if (name && lastName) {
      return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (activePatient) {
      return `${activePatient.first_name.charAt(0)}${activePatient.last_name.charAt(0)}`.toUpperCase();
    }
    return profile?.name?.charAt(0).toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
    } else {
      navigate('/auth');
    }
  };

  const sortedPatients = [...patients].sort((a, b) => {
    if (a.id === profile?.patient_main) return -1;
    if (b.id === profile?.patient_main) return 1;
    return 0;
  });

  return (
    <MobileLayout>
      <div className="px-5 pt-8 pb-28 space-y-6">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm mb-1">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-foreground">
              Hola, <span className="text-primary">{displayName}!</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Tu salud acompañada</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="p-2 bg-card border border-border rounded-xl hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button className="relative">
                  <Avatar className="w-12 h-12 border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {patients.length > 1 && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                      {patients.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              
              {patients.length > 0 && (
                <PopoverContent className="w-72 p-2 bg-card border border-border z-50" align="end">
                  <p className="text-xs text-muted-foreground px-3 py-2 font-medium">Seleccionar paciente</p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {sortedPatients.map((patient) => {
                      const isMain = patient.id === profile?.patient_main;
                      const isActive = patient.id === profile?.patient_active;
                      
                      return (
                        <button
                          key={patient.id}
                          onClick={() => handleSelectPatient(patient.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                            isActive ? "bg-accent" : "hover:bg-muted"
                          )}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {getInitials(patient.first_name, patient.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">DNI: {patient.dni}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {isMain && <Star className="w-4 h-4 text-chart-3 fill-chart-3" />}
                            {isActive && <Check className="w-4 h-4 text-primary" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              )}
            </Popover>
          </div>
        </header>

        {/* Health Profile */}
        <HealthProfile />

        {/* Mama Chat Button */}
        <button
          onClick={() => navigate('/chat')}
          className="w-full p-5 bg-primary/5 rounded-2xl flex items-center gap-4 hover:bg-primary/10 transition-all border border-primary/20"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <HeartPulse className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-semibold text-foreground">Habla con Michi Medic</h3>
            <p className="text-sm text-muted-foreground">Tu asistente de salud 24/7</p>
          </div>
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>

        {/* Medical Library CTA */}
        <button
          onClick={() => navigate('/library')}
          className="w-full p-5 bg-card rounded-2xl flex items-center gap-4 text-left hover:shadow-md transition-all border border-border"
        >
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Historia Clínica</h3>
            <p className="text-sm text-muted-foreground">Tus documentos médicos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <BottomNav />
    </MobileLayout>
  );
};

export default Home;

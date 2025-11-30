import { useState, useEffect } from 'react';
import { ChevronDown, User, Check, Crown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Patient } from '@/types/health';

const PatientSelector = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPatients();
    }
  }, [user?.id]);

  useEffect(() => {
    const autoConfigurePatients = async () => {
      if (!user?.id || !profile || patients.length === 0) return;

      if (!profile.patient_main || !profile.patient_active) {
        const firstPatient = patients[0];
        try {
          const updates: { patient_main?: string; patient_active?: string } = {};
          if (!profile.patient_main) updates.patient_main = firstPatient.id;
          if (!profile.patient_active) updates.patient_active = firstPatient.id;

          if (Object.keys(updates).length > 0) {
            await supabase
              .from('profiles')
              .update(updates)
              .eq('user_id', user.id);
            await refreshProfile();
          }
        } catch (error) {
          console.error('Error auto-configuring patients:', error);
        }
      }
    };

    autoConfigurePatients();
  }, [patients, profile, user?.id, refreshProfile]);

  const fetchPatients = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients_app')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPatients((data || []) as Patient[]);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patientId: string) => {
    if (!user?.id) return;
    try {
      await supabase
        .from('profiles')
        .update({ patient_active: patientId })
        .eq('user_id', user.id);
      await refreshProfile();
      toast.success('Paciente seleccionado');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al seleccionar paciente');
    }
  };

  const activePatient = patients.find(p => p.id === profile?.patient_active);
  const isMainPatient = (patientId: string) => patientId === profile?.patient_main;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 p-2 bg-card border border-border rounded-full pr-4 hover:bg-accent/50 transition-colors">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">
              {activePatient ? `${activePatient.first_name} ${activePatient.last_name}` : 'Seleccionar'}
            </p>
            <p className="text-xs text-muted-foreground">Paciente activo</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay pacientes registrados</p>
          ) : (
            patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    {patient.first_name} {patient.last_name}
                    {isMainPatient(patient.id) && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{patient.dni}</p>
                </div>
                {profile?.patient_active === patient.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PatientSelector;

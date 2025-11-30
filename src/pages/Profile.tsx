import { useState } from 'react';
import { ArrowLeft, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePatient } from '@/hooks/useActivePatient';
import { cn } from '@/lib/utils';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { activePatient, loading } = useActivePatient();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const calculateAge = () => {
    if (!activePatient?.birth_date) return null;
    const today = new Date();
    const birthDate = new Date(activePatient.birth_date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = () => {
    if (!activePatient?.height || !activePatient?.weight) return null;
    const h = Number(activePatient.height) / 100;
    if (h > 0 && Number(activePatient.weight) > 0) {
      return (Number(activePatient.weight) / (h * h)).toFixed(1);
    }
    return null;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Bajo peso', color: 'text-yellow-500' };
    if (bmi < 25) return { text: 'Normal', color: 'text-green-500' };
    if (bmi < 30) return { text: 'Sobrepeso', color: 'text-orange-500' };
    return { text: 'Obesidad', color: 'text-red-500' };
  };

  const age = calculateAge();
  const bmi = calculateBMI();
  const bmiStatus = bmi ? getBMIStatus(parseFloat(bmi)) : null;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="flex items-center gap-4 px-4 py-4 bg-card border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg text-foreground">Mi Perfil</h1>
        </header>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                <User className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {activePatient ? `${activePatient.first_name} ${activePatient.last_name}` : 'Usuario'}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-muted-foreground text-center">Cargando información...</p>
            </div>
          ) : activePatient ? (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
                <h3 className="font-semibold text-foreground">Información Personal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">DNI</p>
                    <p className="font-medium text-foreground">{activePatient.dni}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Edad</p>
                    <p className="font-medium text-foreground">{age ? `${age} años` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Género</p>
                    <p className="font-medium text-foreground">{activePatient.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Nacimiento</p>
                    <p className="font-medium text-foreground">
                      {activePatient.birth_date ? new Date(activePatient.birth_date).toLocaleDateString('es-ES') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
                <h3 className="font-semibold text-foreground">Medidas Físicas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{activePatient.height || '-'}</p>
                    <p className="text-xs text-muted-foreground">cm</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{activePatient.weight || '-'}</p>
                    <p className="text-xs text-muted-foreground">kg</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-2xl font-bold", bmiStatus?.color || 'text-foreground')}>{bmi || '-'}</p>
                    <p className="text-xs text-muted-foreground">IMC</p>
                  </div>
                </div>
                {bmiStatus && (
                  <p className={cn("text-center text-sm", bmiStatus.color)}>
                    Estado: {bmiStatus.text}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-muted-foreground text-center">No hay paciente seleccionado</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => {}}
            >
              <Settings className="w-5 h-5" />
              Configuración
            </Button>
            <Button
              variant="destructive"
              className="w-full h-12 justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default Profile;

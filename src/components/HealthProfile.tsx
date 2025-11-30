import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivePatient } from '@/hooks/useActivePatient';

const HealthProfile = () => {
  const { activePatient, loading } = useActivePatient();

  if (loading) {
    return (
      <div className="bg-card rounded-3xl p-4 border border-border">
        <p className="text-muted-foreground text-center">Cargando perfil...</p>
      </div>
    );
  }

  if (!activePatient) {
    return (
      <div className="bg-card rounded-3xl p-4 border border-border">
        <p className="text-muted-foreground text-center">Sin paciente activo</p>
      </div>
    );
  }

  const { height, weight, gender, birth_date } = activePatient;

  const calculateAge = () => {
    if (!birth_date) return 0;
    const today = new Date();
    const birthDate = new Date(birth_date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge();

  const calculateBMI = () => {
    if (!height || !weight) return null;
    const h = Number(height) / 100;
    if (h > 0 && Number(weight) > 0) {
      return (Number(weight) / (h * h)).toFixed(1);
    }
    return null;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Bajo peso', color: 'text-yellow-500' };
    if (bmi < 25) return { text: 'Normal', color: 'text-green-500' };
    if (bmi < 30) return { text: 'Sobrepeso', color: 'text-orange-500' };
    return { text: 'Obesidad', color: 'text-red-500' };
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi ? getBMIStatus(parseFloat(bmi)) : null;

  return (
    <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Perfil de Salud</h2>
        <Heart className="w-5 h-5 text-primary" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{age}</p>
          <p className="text-xs text-muted-foreground">Años</p>
        </div>
        <div className="bg-background rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{gender === 'M' ? '♂' : '♀'}</p>
          <p className="text-xs text-muted-foreground">Género</p>
        </div>
        <div className="bg-background rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{height || '-'}</p>
          <p className="text-xs text-muted-foreground">cm</p>
        </div>
        <div className="bg-background rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{weight || '-'}</p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
      </div>

      {bmi && bmiStatus && (
        <div className="mt-4 bg-background rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Índice de Masa Corporal</p>
            <p className={cn("text-lg font-semibold", bmiStatus.color)}>{bmi}</p>
          </div>
          <span className={cn("text-sm font-medium", bmiStatus.color)}>{bmiStatus.text}</span>
        </div>
      )}
    </div>
  );
};

export default HealthProfile;

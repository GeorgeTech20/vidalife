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

  // Calculate age from birth_date
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
    const h = height / 100; // cm to m
    if (h > 0 && weight > 0) {
      return (weight / (h * h)).toFixed(1);
    }
    return null;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Bajo peso', color: 'text-yellow-500' };
    if (bmi < 25) return { text: 'Normal', color: 'text-green-500' };
    if (bmi < 30) return { text: 'Sobrepeso', color: 'text-orange-500' };
    return { text: 'Obesidad', color: 'text-destructive' };
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi ? getBMIStatus(parseFloat(bmi)) : null;

  return (
    <div className="bg-card rounded-3xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-destructive/10 rounded-full">
          <Heart className="w-5 h-5 text-destructive fill-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Perfil de Salud</h3>
        </div>
      </div>

      {/* Stats Grid - Read Only */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{height || '-'}</p>
          <p className="text-xs text-muted-foreground">cm</p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{weight || '-'}</p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{age}</p>
          <p className="text-xs text-muted-foreground">años</p>
        </div>
      </div>

      {/* BMI Result */}
      {bmi && (
        <div className="bg-background rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-10 h-10 text-destructive fill-destructive animate-pulse" />
            <div>
              <p className="text-sm text-muted-foreground">Tu IMC</p>
              <p className={cn("font-semibold", bmiStatus?.color)}>{bmiStatus?.text}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{bmi}</p>
            <p className="text-xs text-muted-foreground">kg/m²</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthProfile;

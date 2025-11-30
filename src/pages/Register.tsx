import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ScrollPickerProps {
  values: (string | number)[];
  selected: string | number;
  onChange: (value: string | number) => void;
  suffix?: string;
}

const ScrollPicker = ({ values, selected, onChange, suffix = '' }: ScrollPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 48;
  const visibleItems = 7;

  useEffect(() => {
    const selectedIndex = values.indexOf(selected);
    if (containerRef.current && selectedIndex !== -1) {
      const scrollPosition = selectedIndex * itemHeight - (visibleItems / 2 - 0.5) * itemHeight;
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [selected, values]);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const centerIndex = Math.round((scrollTop + (visibleItems / 2 - 0.5) * itemHeight) / itemHeight);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, centerIndex));
      if (values[clampedIndex] !== selected) {
        onChange(values[clampedIndex]);
      }
    }
  };

  return (
    <div className="relative h-[336px] overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-primary/10 rounded-lg pointer-events-none z-10" />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        <div style={{ height: `${(visibleItems / 2 - 0.5) * itemHeight}px` }} />
        {values.map((value, index) => (
          <div
            key={index}
            className="h-12 flex items-center justify-center snap-center"
            style={{ scrollSnapAlign: 'center' }}
          >
            <span className={`text-xl font-medium transition-all ${
              value === selected ? 'text-foreground scale-110' : 'text-muted-foreground/50 scale-90'
            }`}>
              {value}{suffix}
            </span>
          </div>
        ))}
        <div style={{ height: `${(visibleItems / 2 - 0.5) * itemHeight}px` }} />
      </div>
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [dni, setDni] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  
  const [selectedYear, setSelectedYear] = useState(1990);
  const [selectedMonth, setSelectedMonth] = useState('Enero');
  const [selectedDay, setSelectedDay] = useState(1);
  
  const heights = Array.from({ length: 121 }, (_, i) => i + 100);
  const weights = Array.from({ length: 151 }, (_, i) => i + 30);
  
  const [selectedHeight, setSelectedHeight] = useState(170);
  const [selectedWeight, setSelectedWeight] = useState(70);

  const totalSteps = 4;

  const handleNext = () => {
    if (step === 1 && (!name.trim() || !surname.trim())) {
      toast.error('Por favor completa tu nombre');
      return;
    }
    if (step === 2 && !dni.trim()) {
      toast.error('Por favor ingresa tu DNI');
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('No hay usuario autenticado');
      return;
    }

    setIsLoading(true);
    try {
      const monthIndex = months.indexOf(selectedMonth) + 1;
      const birthDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: name.trim(),
          surname: surname.trim(),
          dni: dni.trim(),
          gender,
          birth_date: birthDate,
          height: selectedHeight,
          weight: selectedWeight,
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      const { data: patientData, error: patientError } = await supabase
        .from('patients_app')
        .insert({
          user_id: user.id,
          dni: dni.trim(),
          first_name: name.trim(),
          last_name: surname.trim(),
          gender,
          birth_date: birthDate,
          height: selectedHeight,
          weight: selectedWeight,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      const { error: linkError } = await supabase
        .from('profiles')
        .update({
          patient_main: patientData.id,
          patient_active: patientData.id,
        })
        .eq('user_id', user.id);

      if (linkError) throw linkError;

      await refreshProfile();
      toast.success('¡Perfil completado!');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al guardar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="w-9" />
        </div>

        <div className="flex-1 px-6 py-4">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground">¿Cómo te llamas?</h1>
                <p className="text-muted-foreground mt-2">Cuéntanos un poco sobre ti</p>
              </div>
              <div className="space-y-4">
                <Input
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 text-lg bg-muted/50 border-0"
                />
                <Input
                  placeholder="Apellido"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="h-14 text-lg bg-muted/50 border-0"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground">Datos personales</h1>
                <p className="text-muted-foreground mt-2">Esta información nos ayuda a personalizar tu experiencia</p>
              </div>
              <Input
                placeholder="DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="h-14 text-lg bg-muted/50 border-0"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setGender('M')}
                  className={`flex-1 h-14 rounded-xl font-medium transition-colors ${
                    gender === 'M' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  Masculino
                </button>
                <button
                  onClick={() => setGender('F')}
                  className={`flex-1 h-14 rounded-xl font-medium transition-colors ${
                    gender === 'F' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  Femenino
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground">Fecha de nacimiento</h1>
                <p className="text-muted-foreground mt-2">Selecciona tu fecha de nacimiento</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Día</p>
                  <ScrollPicker
                    values={days}
                    selected={selectedDay}
                    onChange={(v) => setSelectedDay(v as number)}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Mes</p>
                  <ScrollPicker
                    values={months}
                    selected={selectedMonth}
                    onChange={(v) => setSelectedMonth(v as string)}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Año</p>
                  <ScrollPicker
                    values={years}
                    selected={selectedYear}
                    onChange={(v) => setSelectedYear(v as number)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground">Medidas físicas</h1>
                <p className="text-muted-foreground mt-2">Esto nos ayuda a calcular tu IMC</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Altura</p>
                  <ScrollPicker
                    values={heights}
                    selected={selectedHeight}
                    onChange={(v) => setSelectedHeight(v as number)}
                    suffix=" cm"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Peso</p>
                  <ScrollPicker
                    values={weights}
                    selected={selectedWeight}
                    onChange={(v) => setSelectedWeight(v as number)}
                    suffix=" kg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex gap-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-14 px-6"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            onClick={step === totalSteps ? handleSubmit : handleNext}
            disabled={isLoading}
            className="flex-1 h-14 text-lg"
          >
            {isLoading ? 'Guardando...' : step === totalSteps ? 'Completar' : 'Continuar'}
            {step < totalSteps && <ChevronRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Register;

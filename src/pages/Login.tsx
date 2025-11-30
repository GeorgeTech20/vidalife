import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import loginBackground from '@/assets/login-background.png';
import vidaLogo from '@/assets/vida-logo-new.png';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      const isProfileComplete = profile && profile.name && (profile.dni || profile.patient_main);
      if (isProfileComplete) {
        navigate('/', { replace: true });
      } else {
        navigate('/register', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleEmailSignIn = () => {
    navigate('/auth');
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen flex flex-col relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${loginBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center relative z-10">
          <img
            src={vidaLogo}
            alt="Vida"
            className="h-20 w-auto mb-4"
          />
          <p className="text-lg font-serif text-primary-foreground/90 mt-2 italic">
            Tu salud acompañada
          </p>
        </div>

        <div className="relative z-10 bg-card/80 backdrop-blur-md rounded-t-3xl p-6 pb-8 space-y-3">
          <Button
            className="w-full h-12 bg-muted hover:bg-muted/80 text-muted-foreground"
            variant="secondary"
            onClick={handleEmailSignIn}
          >
            Continuar con email
          </Button>

          <div className="flex justify-center gap-6 pt-4">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Política de privacidad
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Términos de servicio
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Login;

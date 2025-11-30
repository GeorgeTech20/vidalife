import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
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

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    if (mode !== 'forgot-password') {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }

      if (mode === 'signup' && password !== confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error('Error al enviar el email: ' + error.message);
        return;
      }

      toast.success('¡Email enviado! Revisa tu bandeja de entrada.');
      setMode('login');
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'forgot-password') {
      await handleForgotPassword();
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email o contraseña incorrectos');
          } else {
            toast.error('Error al iniciar sesión: ' + error.message);
          }
          setIsLoading(false);
          return;
        }

        toast.success('¡Bienvenido de nuevo!');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/register`
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email ya está registrado.');
          } else {
            toast.error('Error al registrar: ' + error.message);
          }
          setIsLoading(false);
          return;
        }

        if (data?.user && !data?.session) {
          toast.success('¡Revisa tu email para confirmar tu cuenta!');
          setIsLoading(false);
          setMode('login');
          return;
        }

        toast.success('¡Cuenta creada! Completa tu perfil.');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Iniciar sesión';
      case 'signup': return 'Crear cuenta';
      case 'forgot-password': return 'Recuperar contraseña';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Ingresa tus credenciales';
      case 'signup': return 'Crea tu cuenta con email';
      case 'forgot-password': return 'Te enviaremos un enlace de recuperación';
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Cargando...';
    switch (mode) {
      case 'login': return 'Iniciar sesión';
      case 'signup': return 'Crear cuenta';
      case 'forgot-password': return 'Enviar enlace';
    }
  };

  if (loading && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center p-4">
          <button
            onClick={() => mode === 'forgot-password' ? setMode('login') : navigate('/login')}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-6 py-8">
          <h1 className="text-2xl font-semibold text-center text-foreground mb-2">
            {getTitle()}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {getSubtitle()}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-muted/50 border-0"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {mode !== 'forgot-password' && (
              <>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-muted/50 border-0 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {errors.password && (
                    <p className="text-destructive text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {mode === 'signup' && (
                  <div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirmar contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 bg-muted/50 border-0"
                    />
                    {errors.confirmPassword && (
                      <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading}
            >
              {getButtonText()}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setMode('forgot-password');
                  setErrors({});
                }}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            {mode !== 'forgot-password' && (
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setErrors({});
                }}
                className="text-primary hover:underline text-sm"
              >
                {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Auth;

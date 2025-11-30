import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error('Error al actualizar contraseña: ' + error.message);
        return;
      }

      toast.success('¡Contraseña actualizada correctamente!');
      navigate('/login');
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Nueva contraseña</h1>
          <p className="text-muted-foreground mt-2">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nueva contraseña"
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
          </div>

          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 bg-muted/50 border-0"
          />

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
};

export default ResetPassword;

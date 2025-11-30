import { useState } from 'react';
import { FolderOpen, MessageCircleHeart, LogOut } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import HealthProfile from '@/components/HealthProfile';
import PatientSelector from '@/components/PatientSelector';
import MamaModal from '@/components/MamaModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import mamaAvatar from '@/assets/mama-avatar.png';

const Home = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showMamaModal, setShowMamaModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-24 space-y-6">
        <header className="flex items-center justify-between">
          <PatientSelector />
          <button
            onClick={handleSignOut}
            className="p-2 bg-card border border-border rounded-full hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </header>

        <HealthProfile />

        <button
          onClick={() => setShowMamaModal(true)}
          className="w-full p-4 bg-card border border-border rounded-2xl flex items-center gap-4 hover:bg-accent/50 transition-colors shadow-sm"
        >
          <img
            src={mamaAvatar}
            alt="Mama"
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-foreground">Habla con Mamá</h3>
            <p className="text-sm text-muted-foreground">Tu asistente de salud personal</p>
          </div>
          <MessageCircleHeart className="w-6 h-6 text-primary" />
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/chat')}
            className="p-4 bg-card border border-border rounded-2xl text-center hover:bg-accent/50 transition-colors"
          >
            <MessageCircleHeart className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Chat de Salud</p>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="p-4 bg-card border border-border rounded-2xl text-center hover:bg-accent/50 transition-colors"
          >
            <FolderOpen className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Mi Perfil</p>
          </button>
        </div>
      </div>

      <MamaModal open={showMamaModal} onOpenChange={setShowMamaModal} />
      <BottomNav />
    </MobileLayout>
  );
};

export default Home;

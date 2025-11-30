import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/health';

export const useActivePatient = () => {
  const { profile } = useAuth();
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePatient = async () => {
      if (!profile?.patient_active) {
        setActivePatient(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('patients_app')
          .select('*')
          .eq('id', profile.patient_active)
          .single();

        if (error) throw error;
        setActivePatient(data as Patient);
      } catch (error) {
        console.error('Error fetching active patient:', error);
        setActivePatient(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePatient();
  }, [profile?.patient_active]);

  return { activePatient, loading };
};

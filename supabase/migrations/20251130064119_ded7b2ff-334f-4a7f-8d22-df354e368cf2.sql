-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  surname TEXT,
  dni TEXT,
  birth_date DATE,
  height NUMERIC,
  weight NUMERIC,
  gender TEXT,
  phone TEXT,
  patient_main TEXT,
  patient_active TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create patients_app table
CREATE TABLE public.patients_app (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dni TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  height NUMERIC,
  weight NUMERIC,
  gender TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patients_app ENABLE ROW LEVEL SECURITY;

-- Policies for patients_app
CREATE POLICY "Users can view their own patients" 
ON public.patients_app FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients" 
ON public.patients_app FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" 
ON public.patients_app FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" 
ON public.patients_app FOR DELETE 
USING (auth.uid() = user_id);

-- Create medical_files table for file uploads
CREATE TABLE public.medical_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients_app(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- Policies for medical_files
CREATE POLICY "Users can view their own medical files" 
ON public.medical_files FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical files" 
ON public.medical_files FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical files" 
ON public.medical_files FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false);

-- Storage policies
CREATE POLICY "Users can upload their own medical files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own medical files"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own medical files"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients_app
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BACKEND_URL = Deno.env.get('VIDA_BACKEND_URL');
    
    if (!BACKEND_URL) {
      throw new Error('VIDA_BACKEND_URL is not configured');
    }

    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const description = formData.get('description') as string;
    const documentType = formData.get('documentType') as string || 'OTHER';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!patientId) {
      return new Response(JSON.stringify({ error: 'No patientId provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Uploading document to backend:', { 
      fileName: file.name, 
      fileType: file.type,
      fileSize: file.size,
      patientId,
      documentType,
      description 
    });

    // Create form data for the backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('patientId', patientId);
    backendFormData.append('documentType', documentType);
    if (description) {
      backendFormData.append('description', description);
    }

    const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Backend error', 
        details: errorText,
        status: response.status 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    console.log('Backend upload response:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in document-upload function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
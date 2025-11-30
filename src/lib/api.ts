// API service for connecting to the Java backend via edge functions
import { supabase } from '@/integrations/supabase/client';

// Document types matching backend enum
export type DocumentType = 'MEDICAL_EXAM' | 'PRESCRIPTION' | 'LAB_RESULT' | 'IMAGING_RESULT' | 'OTHER';

export interface DocumentUploadResponse {
  id: number;
  fileName: string;
  documentType: DocumentType;
  fileSize: number;
  uploadedAt: string;
  processed: boolean;
  message: string;
}

export interface MedicalDocument {
  id: number;
  patientId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  documentType: DocumentType;
  description?: string;
  uploadedAt: string;
  processed: boolean;
}

class ApiService {
  /**
   * Upload a medical document via edge function
   */
  async uploadDocument(
    file: File,
    patientId: string | number,
    documentType: DocumentType = 'OTHER',
    description?: string
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId.toString());
    formData.append('documentType', documentType);
    if (description) {
      formData.append('description', description);
    }

    console.log('[API] Uploading document via edge function');

    const response = await supabase.functions.invoke('document-upload', {
      body: formData,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to upload document');
    }

    return response.data;
  }

  /**
   * Get document type from file MIME type
   */
  getDocumentType(fileType: string): DocumentType {
    if (fileType.includes('pdf')) return 'OTHER';
    if (fileType.includes('image')) return 'MEDICAL_EXAM';
    return 'OTHER';
  }
}

// Export a singleton instance
export const api = new ApiService();
export default api;

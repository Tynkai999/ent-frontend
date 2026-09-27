import type { Document, DocumentVersion } from '../models/Document.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const documentService = {
  list: (params = '') => apiService.get<Paginated<Document>>(`/documents/${params}`),
  create: (data: Partial<Document>) => apiService.post<Document>('/documents/', data),
  update: (id: string, data: Partial<Document>) => apiService.patch<Document>(`/documents/${id}/`, data),
  remove: (id: string) => apiService.delete(`/documents/${id}/`),
  uploadVersion: (documentId: string, file: File, versionLabel: string, changelog = '') => {
    const formData = new FormData();
    formData.append('document', documentId);
    formData.append('version_label', versionLabel);
    formData.append('changelog', changelog);
    formData.append('file', file);
    return apiService.postFormData<DocumentVersion>('/document-versions/', formData);
  },
};

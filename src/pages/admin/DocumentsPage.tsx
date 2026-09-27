import React, { useEffect, useState } from 'react';
import { Download, FileText, Plus, Trash2, Upload, X } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { Table, type TableColumn } from '../../components/Table';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { documentService } from '../../services/document.service';
import { platformService } from '../../services/platform.service';
import type { Document, DocumentCategory } from '../../models/Document.model';
import type { Platform } from '../../models/Platform.model';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  manuel: 'Manuel utilisateur', guide_demarrage: 'Guide de démarrage', guide_admin: 'Guide administrateur',
  faq: 'FAQ', notes_version: 'Notes de version', tutoriel: 'Tutoriel',
};

const DocumentFormModal: React.FC<{ platforms: Platform[]; onClose: () => void; onSaved: () => void }> = ({
  platforms, onClose, onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('manuel');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [versionLabel, setVersionLabel] = useState('1.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const doc = await documentService.create({ title, platform, category, description, status: 'published' });
      if (file) await documentService.uploadVersion(doc.id, file, versionLabel);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Nouveau document</h3>

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Titre" required className="col-span-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Plateforme" required>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sélectionner...</option>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Catégorie">
              <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Description" className="col-span-2">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
            <Field label="Fichier (PDF)">
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600" />
            </Field>
            <Field label="Version">
              <input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </Field>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" isLoading={loading} icon={Upload} className="flex-1">Publier</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    documentService.list().then((res) => setDocuments(res.results)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    platformService.list().then((res) => setPlatforms(res.results));
  }, []);

  const columns: TableColumn<Document>[] = [
    { key: 'title', label: 'Document', render: (d) => (
      <div className="flex items-center gap-2">
        <FileText size={15} className="text-gray-400 flex-shrink-0" />
        <div><p className="font-medium text-gray-800">{d.title}</p><p className="text-xs text-gray-400">{d.platform_name}</p></div>
      </div>
    ) },
    { key: 'category', label: 'Catégorie', render: (d) => CATEGORY_LABELS[d.category] },
    { key: 'current_version', label: 'Version courante', render: (d) => d.current_version?.version_label || '—' },
    { key: 'status', label: 'Statut', render: (d) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${d.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {d.status === 'published' ? 'Publié' : 'Brouillon'}
      </span>
    ) },
  ];

  return (
    <AppLayout
      activeItem="documents"
      title="Documentation"
      subtitle="Bibliothèque documentaire par plateforme"
      rightAction={<Button icon={Plus} onClick={() => setShowForm(true)}>Nouveau document</Button>}
    >
      <Table
        columns={columns}
        data={documents}
        loading={loading}
        emptyMessage="Aucun document publié."
        actions={[
          {
            icon: Download, variant: 'details', label: 'Télécharger',
            onClick: (d) => { if (d.current_version?.file) window.open(d.current_version.file, '_blank'); },
            condition: (d) => !!d.current_version,
          },
          { icon: Trash2, onClick: (d) => documentService.remove(d.id).then(load), variant: 'delete', label: 'Supprimer' },
        ]}
      />

      {showForm && (
        <DocumentFormModal platforms={platforms} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </AppLayout>
  );
};

export default DocumentsPage;

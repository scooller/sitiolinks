import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import { BACKEND_URL } from '../config/constants';
import { ensureCsrfCookie } from '../lib/graphql/graphqlRequest';
import { useTranslation } from 'react-i18next';

export interface VerificationStatus {
  has_id_front: boolean;
  has_id_back: boolean;
  has_selfie: boolean;
  is_complete: boolean;
  verified: boolean;
  verified_at: string | null;
  notes: string | null;
  urls: {
    id_front: string | null;
    id_back: string | null;
    selfie_with_id: string | null;
  };
}

interface VerificationDocumentsUploadProps {
  compact?: boolean;
  title?: string;
  description?: string;
  onStatusChange?: (status: VerificationStatus) => void;
}

type SlotKey = 'id_front' | 'id_back' | 'selfie_with_id';

interface SlotConfig {
  key: SlotKey;
  label: string;
  badge: string;
  hint: string;
  icon: string;
}

export default function VerificationDocumentsUpload({
  compact = false,
  title,
  description,
  onStatusChange,
}: VerificationDocumentsUploadProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingSlot, setUploadingSlot] = useState<SlotKey | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<SlotKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus>({
    has_id_front: false,
    has_id_back: false,
    has_selfie: false,
    is_complete: false,
    verified: false,
    verified_at: null,
    notes: null,
    urls: {
      id_front: null,
      id_back: null,
      selfie_with_id: null,
    },
  });

  const fileInputRefs = {
    id_front: useRef<HTMLInputElement>(null),
    id_back: useRef<HTMLInputElement>(null),
    selfie_with_id: useRef<HTMLInputElement>(null),
  };

  const getApiBase = () => {
    return (import.meta.env.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
  };

  const getCsrfToken = (): string | null => {
    const match = document.cookie.match(/(^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[2]) : null;
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      await ensureCsrfCookie();
      const base = getApiBase();
      const res = await fetch(`${base}/api/verification-documents/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!res.ok) {
        throw new Error('No se pudo cargar el estado de verificación');
      }

      const data: VerificationStatus = await res.json();
      setStatus(data);
      onStatusChange?.(data);
    } catch (err: any) {
      setError(err?.message || 'Error al obtener estado de documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileSelected = async (slot: SlotKey, file: File) => {
    if (!file) return;

    // Validación tamaño (8MB máx)
    if (file.size > 8 * 1024 * 1024) {
      setError(t('verification.file_too_large', 'El archivo no debe superar los 8MB.'));
      return;
    }

    // Validación tipo
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setError(t('verification.invalid_format', 'Formato no soportado. Usa JPG, PNG o WEBP.'));
      return;
    }

    try {
      setUploadingSlot(slot);
      setError(null);
      await ensureCsrfCookie();

      const formData = new FormData();
      formData.append('collection', slot);
      formData.append('file', file);

      const base = getApiBase();
      const csrf = getCsrfToken();

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };
      if (csrf) {
        headers['X-XSRF-TOKEN'] = csrf;
      }

      const res = await fetch(`${base}/api/verification-documents/upload`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Error al subir el documento');
      }

      const data = await res.json();
      setStatus((prev) => {
        const next: VerificationStatus = {
          ...prev,
          has_id_front: !!data.has_id_front,
          has_id_back: !!data.has_id_back,
          has_selfie: !!data.has_selfie,
          is_complete: !!data.is_complete,
          verified: !!data.verified,
          urls: {
            ...prev.urls,
            [slot]: data.url || prev.urls[slot],
          },
        };
        onStatusChange?.(next);
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'Error al subir el archivo.');
    } finally {
      setUploadingSlot(null);
      if (fileInputRefs[slot].current) {
        fileInputRefs[slot].current.value = '';
      }
    }
  };

  const handleDelete = async (slot: SlotKey) => {
    try {
      setDeletingSlot(slot);
      setError(null);
      await ensureCsrfCookie();

      const base = getApiBase();
      const csrf = getCsrfToken();

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };
      if (csrf) {
        headers['X-XSRF-TOKEN'] = csrf;
      }

      const res = await fetch(`${base}/api/verification-documents/${slot}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!res.ok) {
        throw new Error('Error al eliminar el documento');
      }

      const data = await res.json();
      setStatus((prev) => {
        const next: VerificationStatus = {
          ...prev,
          has_id_front: !!data.has_id_front,
          has_id_back: !!data.has_id_back,
          has_selfie: !!data.has_selfie,
          is_complete: !!data.is_complete,
          verified: !!data.verified,
          urls: {
            ...prev.urls,
            [slot]: null,
          },
        };
        onStatusChange?.(next);
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el archivo.');
    } finally {
      setDeletingSlot(null);
    }
  };

  const slots: SlotConfig[] = [
    {
      key: 'id_front',
      label: t('verification.id_front_label', '1. Cédula / ID Frontal'),
      badge: 'Frontal',
      hint: t('verification.id_front_hint', 'Foto clara donde se aprecie nombre y fecha de nacimiento.'),
      icon: 'fa-id-card',
    },
    {
      key: 'id_back',
      label: t('verification.id_back_label', '2. Cédula / ID Reverso'),
      badge: 'Reverso',
      hint: t('verification.id_back_hint', 'Foto nítida de la parte posterior de tu cédula o pasaporte.'),
      icon: 'fa-id-badge',
    },
    {
      key: 'selfie_with_id',
      label: t('verification.selfie_label', '3. Selfie con Cédula'),
      badge: 'Selfie + ID',
      hint: t('verification.selfie_hint', 'Rostro visible sosteniendo tu identificación al lado de la cara.'),
      icon: 'fa-camera',
    },
  ];

  const completedCount = [status.has_id_front, status.has_id_back, status.has_selfie].filter(Boolean).length;

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" size="sm" variant="primary" className="me-2" />
        <span className="small text-muted">{t('verification.loading_status', 'Verificando documentos...')}</span>
      </div>
    );
  }

  return (
    <div className={`verification-docs-container ${compact ? 'compact' : ''}`}>
      {/* Cabecera */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h6 className="fw-bold mb-0" style={{ fontSize: compact ? '0.95rem' : '1.05rem' }}>
              <i className="fas fa-shield-check text-primary me-2"></i>
              {title || t('verification.title', 'Documentación de Identidad y Mayoría de Edad (+18)')}
            </h6>
            {status.verified ? (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                <i className="fas fa-badge-check me-1"></i>
                {t('verification.verified_badge', 'Verificado')}
              </span>
            ) : (
              <span
                className={`badge px-2 py-1 small ${
                  status.is_complete
                    ? 'bg-warning-subtle text-warning border border-warning-subtle'
                    : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                }`}
              >
                {completedCount}/3 {t('verification.uploaded_count', 'Completados')}
              </span>
            )}
          </div>
          <p className="text-muted small mb-0 mt-1" style={{ fontSize: '0.82rem' }}>
            {description ||
              t(
                'verification.desc',
                'Para solicitar perfil de Creador o Manager debes adjuntar fotos legibles de tu documento y selfie. Almacenamiento seguro y privado.'
              )}
          </p>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-circle-exclamation flex-shrink-0"></i>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn-close btn-close-sm"
            onClick={() => setError(null)}
            aria-label="Cerrar"
          ></button>
        </div>
      )}

      {/* Grid de 3 Documentos */}
      <div className="row g-2 g-md-3">
        {slots.map((slot) => {
          const hasFile =
            slot.key === 'id_front'
              ? status.has_id_front
              : slot.key === 'id_back'
              ? status.has_id_back
              : status.has_selfie;

          const isUploading = uploadingSlot === slot.key;
          const isDeleting = deletingSlot === slot.key;
          const previewUrl = status.urls[slot.key];

          return (
            <div key={slot.key} className="col-12 col-md-4">
              <div
                className="verification-slot-card h-100 p-3 rounded-3 d-flex flex-column justify-content-between position-relative"
                style={{
                  background: hasFile ? 'rgba(52, 199, 89, 0.06)' : 'rgba(120, 120, 128, 0.06)',
                  border: hasFile ? '1.5px solid rgba(52, 199, 89, 0.35)' : '1px dashed rgba(120, 120, 128, 0.3)',
                  transition: 'all 0.2s ease',
                  minHeight: compact ? '150px' : '170px',
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge rounded-pill bg-dark bg-opacity-10 text-body small px-2 py-0.5">
                      {slot.badge}
                    </span>
                    {hasFile ? (
                      <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                        <i className="fas fa-check-circle"></i>
                        <span>{t('verification.ready', 'Listo')}</span>
                      </span>
                    ) : (
                      <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
                        {t('verification.required', 'Obligatorio')}
                      </span>
                    )}
                  </div>

                  <h6 className="fw-semibold mb-1" style={{ fontSize: '0.88rem' }}>
                    <i className={`fas ${slot.icon} me-1.5 text-muted`}></i>
                    {slot.label}
                  </h6>
                  <p className="text-muted mb-2" style={{ fontSize: '0.76rem', lineHeight: '1.25' }}>
                    {slot.hint}
                  </p>
                </div>

                {/* Zona de Acción */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRefs[slot.key]}
                    style={{ display: 'none' }}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(slot.key, file);
                    }}
                  />

                  {isUploading ? (
                    <div className="text-center py-2 text-primary small fw-semibold">
                      <Spinner animation="border" size="sm" className="me-1" />
                      <span>{t('common.uploading', 'Subiendo...')}</span>
                    </div>
                  ) : hasFile ? (
                    <div className="d-flex align-items-center gap-1.5 mt-2">
                      {previewUrl && (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="apple-btn-glass flex-grow-1 text-center py-1 text-decoration-none"
                          style={{ fontSize: '0.78rem', minHeight: '34px' }}
                          title={t('verification.view_file', 'Ver archivo subido')}
                        >
                          <i className="fas fa-eye me-1"></i>
                          <span>{t('common.view', 'Ver')}</span>
                        </a>
                      )}
                      <button
                        type="button"
                        className="apple-btn-glass py-1 px-2"
                        style={{ fontSize: '0.78rem', minHeight: '34px' }}
                        onClick={() => fileInputRefs[slot.key].current?.click()}
                        title={t('verification.replace', 'Reemplazar foto')}
                      >
                        <i className="fas fa-rotate"></i>
                      </button>
                      <button
                        type="button"
                        className="apple-btn-glass text-danger py-1 px-2"
                        style={{ fontSize: '0.78rem', minHeight: '34px' }}
                        disabled={isDeleting}
                        onClick={() => handleDelete(slot.key)}
                        title={t('common.delete', 'Eliminar')}
                      >
                        {isDeleting ? <Spinner animation="border" size="sm" /> : <i className="fas fa-trash"></i>}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="apple-btn-glass w-100 py-1.5 mt-2 d-flex align-items-center justify-content-center gap-1.5"
                      style={{ fontSize: '0.8rem', minHeight: '36px' }}
                      onClick={() => fileInputRefs[slot.key].current?.click()}
                    >
                      <i className="fas fa-arrow-up-from-bracket"></i>
                      <span>{t('verification.upload_btn', 'Seleccionar foto')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aviso de Privacidad y Cumplimiento Legal */}
      <div
        className="mt-3 p-2.5 rounded-3 d-flex align-items-center gap-2"
        style={{ background: 'rgba(120, 120, 128, 0.05)', fontSize: '0.77rem' }}
      >
        <i className="fas fa-lock text-muted flex-shrink-0"></i>
        <span className="text-muted">
          {t(
            'verification.privacy_notice',
            'Tus documentos se cifran y almacenan en un volumen local privado sin acceso público. Exclusivo para revisión de administración (Ley 21.719).'
          )}
        </span>
      </div>
    </div>
  );
}

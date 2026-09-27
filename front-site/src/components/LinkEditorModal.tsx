import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { SOCIAL_PLATFORMS, detectSocialPlatform, getPlatformById, type SocialPlatformConfig } from '../lib/socialLinks';

export interface ProfileLinkItem {
  id?: string | number;
  name: string;
  url: string;
  icon: string;
  order?: number;
  is_adult?: boolean;
}

interface LinkEditorModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (link: ProfileLinkItem) => void;
  initialLink?: ProfileLinkItem | null;
}

export default function LinkEditorModal({ show, onHide, onSave, initialLink }: LinkEditorModalProps) {
  const { t } = useTranslation();
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('whatsapp');
  const [handleInput, setHandleInput] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [isAdult, setIsAdult] = useState<boolean>(false);
  const [hasCustomTitle, setHasCustomTitle] = useState<boolean>(false);

  // Initialize or reset form state
  useEffect(() => {
    if (show) {
      if (initialLink) {
        // Detect matching platform from initial URL or icon
        const detected = detectSocialPlatform(initialLink.url || '');
        setSelectedPlatformId(detected.platform.id);
        setHandleInput(detected.handle || initialLink.url || '');
        setCustomName(initialLink.name || detected.platform.name);
        setHasCustomTitle(initialLink.name !== detected.platform.name);
        setIsAdult(!!initialLink.is_adult);
      } else {
        setSelectedPlatformId('whatsapp');
        setHandleInput('');
        setCustomName('WhatsApp');
        setHasCustomTitle(false);
        setIsAdult(false);
      }
    }
  }, [show, initialLink]);

  const currentPlatform: SocialPlatformConfig = useMemo(() => {
    return getPlatformById(selectedPlatformId);
  }, [selectedPlatformId]);

  // Compute canonical URL dynamically
  const canonicalUrl = useMemo(() => {
    return currentPlatform.toCanonicalUrl(handleInput);
  }, [currentPlatform, handleInput]);

  // Select platform manually
  const handleSelectPlatform = (platform: SocialPlatformConfig) => {
    setSelectedPlatformId(platform.id);
    if (!hasCustomTitle) {
      setCustomName(platform.name);
    }
    if (platform.isAdultDefault !== undefined) {
      setIsAdult(platform.isAdultDefault);
    }
  };

  // Handle input changes with auto-detection of pasted links
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;

    // Check if user pasted a full URL of another platform
    if (/^https?:\/\//i.test(rawVal.trim()) || rawVal.includes('.com/') || rawVal.includes('t.me/') || rawVal.includes('wa.me/')) {
      const detected = detectSocialPlatform(rawVal);
      if (detected.platform.id !== selectedPlatformId) {
        setSelectedPlatformId(detected.platform.id);
        if (!hasCustomTitle) {
          setCustomName(detected.platform.name);
        }
        if (detected.platform.isAdultDefault !== undefined) {
          setIsAdult(detected.platform.isAdultDefault);
        }
      }
      setHandleInput(detected.handle);
      return;
    }

    setHandleInput(rawVal);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
    setHasCustomTitle(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) return;

    const finalUrl = canonicalUrl || handleInput.trim();
    const finalName = (customName.trim() || currentPlatform.name).slice(0, 100);

    onSave({
      id: initialLink?.id,
      name: finalName,
      url: finalUrl,
      icon: currentPlatform.icon,
      order: initialLink?.order ?? 0,
      is_adult: isAdult,
    });
    onHide();
  };

  const previewIconClass = currentPlatform.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-');

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      dialogClassName="apple-glass-modal-dialog"
      contentClassName="apple-glass-modal-content border-0 rounded-4 shadow-lg overflow-hidden"
    >
      <form onSubmit={handleSubmit}>
        <div className="apple-modal-header p-4 pb-3 border-bottom border-secondary border-opacity-10 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center text-white"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: currentPlatform.color || 'var(--color-primary)',
                boxShadow: `0 4px 12px ${currentPlatform.color}40`,
                transition: 'background 0.2s ease',
              }}
            >
              <i className={`${previewIconClass} fs-5`}></i>
            </div>
            <div>
              <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.15rem' }}>
                {initialLink ? t('profile.edit_link', 'Editar Enlace') : t('profile.add_link', 'Agregar Enlace')}
              </h5>
              <p className="text-muted small mb-0">
                {t('profile.link_helper_subtitle', 'Selecciona la plataforma e ingresa tu identificador')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onHide}
            aria-label={t('common.close', 'Cerrar')}
            style={{ filter: 'var(--apple-close-filter, none)' }}
          ></button>
        </div>

        <div className="modal-body p-4">
          {/* 1. Selector de Plataforma en Rejilla Apple */}
          <div className="mb-4">
            <label className="apple-label mb-2 d-flex justify-content-between">
              <span>{t('profile.select_platform', 'Plataforma')}</span>
              <span className="badge rounded-pill bg-secondary bg-opacity-25 text-body fw-normal">
                {SOCIAL_PLATFORMS.length} {t('common.available', 'disponibles')}
              </span>
            </label>
            <div
              className="apple-platform-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                gap: '8px',
                maxHeight: '190px',
                overflowY: 'auto',
                padding: '4px',
                borderRadius: '14px',
                background: 'rgba(120, 120, 128, 0.06)',
              }}
            >
              {SOCIAL_PLATFORMS.map((plat) => {
                const isSelected = selectedPlatformId === plat.id;
                const iconClass = plat.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-');
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => handleSelectPlatform(plat)}
                    className={`apple-platform-chip d-flex flex-column align-items-center justify-content-center p-2 rounded-3 border transition-all ${
                      isSelected ? 'active shadow-sm' : ''
                    }`}
                    style={{
                      minHeight: '62px',
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${plat.color}` : '1px solid var(--apple-glass-border)',
                      background: isSelected ? `${plat.color}15` : 'rgba(255, 255, 255, 0.5)',
                      color: isSelected ? 'var(--color-text)' : 'var(--color-text-secondary)',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    <i
                      className={`${iconClass} mb-1`}
                      style={{
                        fontSize: '1.25rem',
                        color: plat.color,
                      }}
                    ></i>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}
                    >
                      {plat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Entrada Inteligente de Identificador / Handle */}
          <div className="mb-3">
            <label className="apple-label d-flex justify-content-between">
              <span>{currentPlatform.name === 'WhatsApp' ? t('common.phone', 'Número / Identificador') : t('profile.handle_or_user', 'Usuario / Identificador')}</span>
              <span className="text-muted small fw-normal">{currentPlatform.helperText}</span>
            </label>
            <div className="input-group apple-input-group">
              <span
                className="input-group-text bg-secondary bg-opacity-10 border-0 fw-semibold text-muted"
                style={{
                  borderRadius: '12px 0 0 12px',
                  border: '1px solid var(--apple-glass-border)',
                  borderRight: 'none',
                  fontSize: '0.88rem',
                }}
              >
                {currentPlatform.prefix}
              </span>
              <input
                type="text"
                className="form-control apple-input"
                style={{
                  borderRadius: '0 12px 12px 0',
                  borderLeft: 'none',
                }}
                value={handleInput}
                onChange={handleInputChange}
                placeholder={currentPlatform.placeholder}
                autoFocus
                required
              />
            </div>
            {canonicalUrl && (
              <div className="mt-1 small text-muted text-truncate d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
                <i className="fas fa-link text-primary" style={{ fontSize: '0.7rem' }}></i>
                <span>URL final:</span>
                <code className="text-primary">{canonicalUrl}</code>
              </div>
            )}
          </div>

          {/* 3. Nombre Personalizado de la Etiqueta (opcional) */}
          <Row className="g-3 mb-3">
            <Col md={12}>
              <label className="apple-label">
                {t('profile.link_custom_label', 'Título visible del botón (opcional)')}
              </label>
              <input
                type="text"
                className="apple-input"
                value={customName}
                onChange={handleTitleChange}
                placeholder={currentPlatform.name}
              />
            </Col>
          </Row>

          {/* 4. Switch Apple Contenido +18 */}
          <div className="apple-switch-wrapper mb-3 py-2 px-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning bg-opacity-25 text-warning fw-bold px-2 py-1 rounded-2" style={{ fontSize: '0.75rem' }}>
                +18
              </span>
              <div>
                <div className="apple-switch-label" style={{ fontSize: '0.86rem' }}>
                  {t('profile.link_is_adult', 'Contenido para adultos')}
                </div>
                <div className="apple-switch-desc" style={{ fontSize: '0.75rem' }}>
                  {t('profile.link_adult_help', 'Requiere confirmación de edad previa al redireccionar')}
                </div>
              </div>
            </div>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="modal_is_adult_switch"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                style={{ width: '2.4rem', height: '1.35rem', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* 5. Previsualización en Vivo de la Card Pública */}
          <div className="p-3 rounded-3" style={{ background: 'rgba(120, 120, 128, 0.05)', border: '1px solid var(--apple-glass-border)' }}>
            <div className="apple-label mb-2" style={{ fontSize: '0.75rem' }}>
              {t('common.preview', 'Vista previa del enlace')}:
            </div>
            <div
              className="profile-link-item d-flex align-items-center p-3 rounded-3"
              style={{
                background: 'var(--apple-glass-bg, #ffffff)',
                border: '1px solid var(--apple-glass-border)',
                textDecoration: 'none',
                color: 'var(--color-text)',
              }}
            >
              <i
                className={`${previewIconClass} me-2 fs-5`}
                style={{ color: currentPlatform.color }}
              ></i>
              <span className="flex-grow-1 fw-semibold text-truncate">
                {customName.trim() || currentPlatform.name}
              </span>
              {isAdult && <span className="profile-link-badge-18 me-2">+18</span>}
              <i className="fas fa-arrow-up-right-from-square text-muted" style={{ fontSize: '0.75rem' }}></i>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer p-3 border-top border-secondary border-opacity-10 d-flex justify-content-end gap-2">
          <button
            type="button"
            className="apple-btn-glass"
            onClick={onHide}
            style={{ minHeight: '44px', padding: '0.5rem 1.25rem' }}
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            type="submit"
            className="apple-btn-primary"
            disabled={!handleInput.trim()}
            style={{ minHeight: '44px', padding: '0.5rem 1.5rem' }}
          >
            <i className="fas fa-check me-1"></i>
            {initialLink ? t('common.save', 'Guardar Cambios') : t('profile.add_link', 'Agregar Enlace')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

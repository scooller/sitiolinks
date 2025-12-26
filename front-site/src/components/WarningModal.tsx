import { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useTranslation } from 'react-i18next';

export default function WarningModal() {
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(t('modal.warning_title'));
  const [titleIcon, setTitleIcon] = useState('');
  const [btnText, setBtnText] = useState(t('modal.ok'));
  const [btnIcon, setBtnIcon] = useState('');
  const [btnVariant, setBtnVariant] = useState('primary');
  
  // New settings
  const [showCloseIcon, setShowCloseIcon] = useState(true);
  const [cancelBtnEnabled, setCancelBtnEnabled] = useState(false);
  const [cancelBtnText, setCancelBtnText] = useState(t('common.cancel'));
  const [cancelBtnIcon, setCancelBtnIcon] = useState('');
  const [cancelBtnVariant, setCancelBtnVariant] = useState('secondary');
  const [cancelBtnUrl, setCancelBtnUrl] = useState('');

  const didCheckRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (didCheckRef.current) return;
    didCheckRef.current = true;

    const checkWarning = async () => {
      try {
        const data = await graphqlRequest<{ siteSettings: any }>({ query: queries.siteSettings });
        const settings = data?.siteSettings;

        if (settings?.warning_modal_enabled && settings?.warning_modal_content) {
          const setupModal = () => {
            setContent(settings.warning_modal_content);
            if (settings.warning_modal_title) setTitle(settings.warning_modal_title);
            if (settings.warning_modal_title_icon) setTitleIcon(settings.warning_modal_title_icon);
            if (settings.warning_modal_btn_text) setBtnText(settings.warning_modal_btn_text);
            if (settings.warning_modal_btn_icon) setBtnIcon(settings.warning_modal_btn_icon);
            if (settings.warning_modal_btn_variant) setBtnVariant(settings.warning_modal_btn_variant);
            
            // Load new settings
            if (settings.warning_modal_show_close_icon !== undefined) setShowCloseIcon(settings.warning_modal_show_close_icon);
            if (settings.warning_modal_cancel_btn_enabled) setCancelBtnEnabled(true);
            if (settings.warning_modal_cancel_btn_text) setCancelBtnText(settings.warning_modal_cancel_btn_text);
            if (settings.warning_modal_cancel_btn_icon) setCancelBtnIcon(settings.warning_modal_cancel_btn_icon);
            if (settings.warning_modal_cancel_btn_variant) setCancelBtnVariant(settings.warning_modal_cancel_btn_variant);
            if (settings.warning_modal_cancel_btn_url) setCancelBtnUrl(settings.warning_modal_cancel_btn_url);

            if (!show) setShow(true);
          };

          if (isAuthenticated && user) {
             if (!(user as any).warning_modal_dismissed) {
                setupModal();
             }
          } else {
             // Para usuarios no conectados, siempre mostrar el mensaje (no guardar estado)
             setupModal();
          }
        }
      } catch (e) {
      }
    };

    checkWarning();
  }, [loading, isAuthenticated, user]);

  const handleClose = async () => {
    setShow(false);
    if (isAuthenticated) {
      try {
        await graphqlRequest({
          query: `mutation { dismissWarning }`,
          authenticated: true,
          schema: 'default'
        });
        // Refresh user to update local state
        await refreshUser();
      } catch (e) {
      }
    }
    // No guardar en sessionStorage para usuarios no conectados
  };

  const handleCancel = () => {
    if (cancelBtnUrl) {
      window.location.href = cancelBtnUrl;
    } else {
      setShow(false);
    }
  };

  const normalizeFA = (icon?: string | null): string | null => {
    return icon ? icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
  };

  return (
    <Modal show={show} onHide={showCloseIcon ? handleClose : undefined} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton={showCloseIcon}>
        <Modal.Title>
          {titleIcon && <i className={`${normalizeFA(titleIcon)} me-2`}></i>}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </Modal.Body>
      <Modal.Footer>
        {cancelBtnEnabled && (
            <Button variant={cancelBtnVariant} onClick={handleCancel}>
                {cancelBtnIcon && <i className={`${normalizeFA(cancelBtnIcon)} me-2`}></i>}
                {cancelBtnText}
            </Button>
        )}
        <Button variant={btnVariant} onClick={handleClose}>
          {btnIcon && <i className={`${normalizeFA(btnIcon)} me-2`}></i>}
          {btnText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

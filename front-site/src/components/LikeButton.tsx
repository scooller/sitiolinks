import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { mutations } from '../lib/graphql/mutations';
import { useAuth } from '../contexts/AuthContext';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface LikeButtonProps {
  galleryId?: number;
  profileUserId?: number;
  ownerUserId?: number;
  initialLikesCount: number;
  initialLiked: boolean;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({ galleryId, profileUserId, ownerUserId, initialLikesCount, initialLiked, className }) => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [liked, setLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setLikesCount(initialLikesCount);
  }, [initialLiked, initialLikesCount]);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated || !user) {
      // Opcional: redirigir a login o mostrar un mensaje
      return;
    }
    if (isLoading) return;

    setIsLoading(true);

    // Optimistic update
    const previousLiked = liked;
    const previousLikesCount = likesCount;
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const isProfile = typeof profileUserId === 'number';
      const query = isProfile ? mutations.toggleUserLike : mutations.toggleLike;
      const variables = isProfile ? { liked_user_id: profileUserId } : { gallery_id: galleryId };
      await graphqlRequest({
        query,
        variables,
        authenticated: true,
        schema: 'default',
      });
    } catch (error) {
      // Revertir en caso de error
      setLiked(previousLiked);
      setLikesCount(previousLikesCount);
    } finally {
      setIsLoading(false);
    }
  }, [galleryId, profileUserId, isAuthenticated, user, isLoading, liked, likesCount]);

  const renderTooltip = (props: any) => (
    <Tooltip id="button-tooltip" {...props}>
      {isAuthenticated ? (liked ? t('likes.remove') : t('likes.add')) : t('likes.login_to_like')}
    </Tooltip>
  );

  // Ocultar si es contenido propio (perfil o galería del mismo usuario)
  const isOwnContent = (
    typeof profileUserId === 'number' && user?.id === profileUserId
  ) || (
    typeof ownerUserId === 'number' && user?.id === ownerUserId
  );

  if (isOwnContent) {
    return null;
  }

  return (
    <OverlayTrigger
      placement="top"
      delay={{ show: 250, hide: 400 }}
      overlay={renderTooltip}
    >
      <motion.button
        onClick={handleLike}
        disabled={isLoading || !isAuthenticated}
        className={`${className ? className + ' ' : ''}like-button btn btn-sm ${liked ? 'btn-danger' : 'btn-outline-danger'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        {liked ? <i className="fas fa-heart"></i> : <i className="far fa-heart"></i>}
        <span>{likesCount}</span>
      </motion.button>
    </OverlayTrigger>
  );
};

export default LikeButton;

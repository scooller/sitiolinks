export const GalleryFields = `
  id
  title
  description
  visibility
  status
  order
  created_at
  updated_at
  media_count
  can_view
  is_featured
  featured_at
  likes_count
  liked_by_user
  user {
    id
    username
    avatar_thumb_webp
    is_verified
    roles {
      name
    }
  }
  media {
    id
    order
    caption
    thumb_url
    thumb_webp_url
    url
    mime_type
    size
  }
`;

export const mutations = {
  createTicket: `
    mutation CreateTicket($user_id: Int!, $subject: String!, $description: String!, $category: String!, $priority: String!) {
      createTicket(user_id: $user_id, subject: $subject, description: $description, category: $category, priority: $priority) {
        id
        subject
        status
        priority
        category
      }
    }
  `,
  addTicketComment: `
    mutation AddTicketComment($ticket_id: Int!, $comment: String!, $is_internal: Boolean) {
      addTicketComment(ticket_id: $ticket_id, comment: $comment, is_internal: $is_internal) {
        id
        comment
        is_internal
        created_at
        user { id name username }
      }
    }
  `,
  addMediaToGallery: `
    mutation AddMediaToGallery($gallery_id: Int!, $media_ids: [Int!]!, $captions: [String!]) {
      addMediaToGallery(gallery_id: $gallery_id, media_ids: $media_ids, captions: $captions) {
        id
        media_count
        media { id order caption thumb_url url }
      }
    }
  `,
  removeMediaFromGallery: `
    mutation RemoveMediaFromGallery($gallery_id: Int!, $media_ids: [Int!]!) {
      removeMediaFromGallery(gallery_id: $gallery_id, media_ids: $media_ids) {
        id
        media_count
        media { id order caption thumb_url url }
      }
    }
  `,
  reorderGalleryMedia: `
    mutation ReorderGalleryMedia($gallery_id: Int!, $media_ids: [Int!]!) {
      reorderGalleryMedia(gallery_id: $gallery_id, media_ids: $media_ids) {
        id
        media { id order caption thumb_url url }
      }
    }
  `,
  toggleFeaturedGallery: `
    mutation ToggleFeaturedGallery($id: Int!, $is_featured: Boolean!) {
      toggleFeaturedGallery(id: $id, is_featured: $is_featured) {
        id
        is_featured
        featured_at
      }
    }
  `,
  toggleLike: `
    mutation ToggleLike($gallery_id: Int!) {
      toggleLike(gallery_id: $gallery_id) {
        id
        created_at
      }
    }
  `,
  toggleUserLike: `
    mutation ToggleUserLike($liked_user_id: Int!) {
      toggleUserLike(liked_user_id: $liked_user_id) {
        id
        created_at
      }
    }
  `,
  sendVipNotification: `
    mutation SendVipNotification($recipientId: ID!, $message: String!, $title: String, $url: String) {
      sendVipNotification(recipient_id: $recipientId, message: $message, title: $title, url: $url) {
        id
        type
        title
        message
        url
        created_at
      }
    }
  `,
} as const;

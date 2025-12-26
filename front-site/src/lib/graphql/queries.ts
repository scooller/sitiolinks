import { GalleryFields } from './fragments';

export const queries = {
  siteSettings: `
    query SiteSettings {
      siteSettings {
        site_title
        site_description
        avatar_width
        avatar_height
        thumbnail_width
        thumbnail_height
        grid_cols_desktop
        grid_cols_mobile
        grid_users_sort
        grid_roles_order
        grid_users_per_page
        max_galleries_creator
        max_galleries_vip
        max_media_per_gallery_creator
        max_media_per_gallery_vip
        max_upload_size_creator
        max_upload_size_vip
        default_avatar_url
        logo_url
        favicon_url
        vip_badge_label
        vip_badge_icon
        transition_type
        google_analytics_id
        vip_home_enabled
        vip_home_limit
        vip_featured_profile
        qr_logo_size
        heading_font
        body_font
        custom_css
        warning_modal_enabled
        warning_modal_content
        warning_modal_title
        warning_modal_title_icon
        warning_modal_btn_text
        warning_modal_btn_icon
        warning_modal_btn_variant
        warning_modal_show_close_icon
        warning_modal_cancel_btn_enabled
        warning_modal_cancel_btn_text
        warning_modal_cancel_btn_icon
        warning_modal_cancel_btn_variant
        warning_modal_cancel_btn_url
      }
    }
  `,
  tags: `
    query Tags {
      tags {
        id
        name
        color
        icon
        weight
        is_fixed
      }
    }
  `,
  users: `
    query Users(
      $page: Int,
      $perPage: Int,
      $role: String,
      $gender: String,
      $nationality: String,
      $tagId: Int,
      $search: String,
      $minPrice: Float,
      $maxPrice: Float
    ) {
      users(
        page: $page,
        per_page: $perPage,
        role: $role,
        gender: $gender,
        nationality: $nationality,
        tagId: $tagId,
        search: $search,
        min_price: $minPrice,
        max_price: $maxPrice
      ) {
        data {
          id
          username
          avatar_thumb
          avatar_thumb_webp
          avatar_small_webp
          avatar_medium_webp
          gender
          description
          nationality
          birth_date
          price_from
          card_bg_color
          is_verified
          tags { id name color icon weight is_fixed }
          roles { name }
        }
        paginatorInfo {
          currentPage
          lastPage
          perPage
          total
          hasMorePages
        }
      }
    }
  `,
  userByUsername: `
    query UserByUsername($username: String!) {
      user(username: $username) {
        id
        name
        username
        avatar_url
        avatar_thumb
        avatar_thumb_webp
        avatar_small_webp
        avatar_medium_webp
        avatar_webp
        gender
        nationality
        country
        city
        description
        card_bg_color
        card_bg_opacity
        country_block
        birth_date
        price_from
        views
        followers_count
        following_count
        is_following
        has_public_profile
        is_verified
        verified_at
        roles { name }
        galleries_count
        tags { id name color icon weight is_fixed }
        links { id name url icon order }
      }
    }
  `,
  usersByTag: `
    query UsersByTag($tag: String!, $limit: Int) {
      users(tag: $tag, limit: $limit) {
        id
        username
        avatar_url
        avatar_thumb
        avatar_thumb_webp
        avatar_small_webp
        avatar_medium_webp
        gender
        description
        nationality
        birth_date
        price_from
        card_bg_color
        tags { id name color icon weight is_fixed }
        roles { name }
      }
    }
  `,
  ticketsList: `
    query Tickets($user_id: Int, $status: String, $priority: String, $category: String, $limit: Int) {
      tickets(user_id: $user_id, status: $status, priority: $priority, category: $category, limit: $limit) {
        id
        subject
        status
        priority
        category
        created_at
        resolved_at
        closed_at
      }
    }
  `,
  ticketDetail: `
    query Ticket($id: Int!) {
      ticket(id: $id) {
        id
        subject
        description
        status
        priority
        category
        user { id name username }
        assigned_to
        first_response_at
        resolved_at
        closed_at
        comments {
          id
          comment
          is_internal
          created_at
          user { id name username }
        }
      }
    }
  `,
  following: `
    query Following($user_id: Int!, $page: Int, $per_page: Int, $search: String, $tag: String) {
      following(user_id: $user_id, page: $page, per_page: $per_page, search: $search, tag: $tag) {
        data {
          id
          username
          avatar_url
          avatar_thumb
          avatar_thumb_webp
          avatar_small_webp
          avatar_medium_webp
          gender
          description
          nationality
          price_from
          card_bg_color
          is_verified
          tags { id name color icon weight is_fixed }
          roles { name }
        }
        paginatorInfo {
          currentPage
          lastPage
          perPage
          total
          hasMorePages
        }
      }
    }
  `,
  galleries: `
    query Galleries(
      $page: Int,
      $per_page: Int,
      $user_id: Int,
      $visibility: String,
      $search: String,
      $sort_by: String
    ) {
      galleries(
        page: $page,
        per_page: $per_page,
        user_id: $user_id,
        visibility: $visibility,
        search: $search,
        sort_by: $sort_by
      ) {
        data {
          ...GalleryFields
        }
        paginatorInfo {
          currentPage
          lastPage
          perPage
          total
          hasMorePages
        }
      }
    }
    fragment GalleryFields on Gallery {
      ${GalleryFields}
    }
  `,
  galleryById: `
    query Gallery($id: Int!) {
      gallery(id: $id) {
        ...GalleryFields
      }
    }
    fragment GalleryFields on Gallery {
      ${GalleryFields}
    }
  `,
} as const;

// GraphQL Types
export interface User {
  id: string | number;
  name: string;
  username: string;
  email?: string;
  email_verified_at?: string;
  avatar_url?: string;
  avatar_thumb?: string;
  avatar_thumb_webp?: string;
  avatar_small_webp?: string;
  avatar_medium_webp?: string;
  avatar_webp?: string;
  description?: string;
  nationality?: string;
  country?: string;
  city?: string;
  gender?: 'hombre' | 'mujer' | 'trans' | 'otro';
  birth_date?: string;
  price_from?: number;
  card_bg_color?: string;
  card_bg_opacity?: number;
  country_block?: string[];
  views?: number;
  followers_count?: number;
  following_count?: number;
  likes_count?: number;
  liked_by_user?: boolean;
  is_following?: boolean;
  has_public_profile?: boolean;
  is_verified?: boolean;
  verified_at?: string;
  tags?: Tag[];
  links?: Link[];
  roles?: Role[] | string[]; // Acepta array de objetos o strings para compatibilidad
}

export interface Role {
  id?: string | number;
  name: string;
  guard_name?: string;
}

export interface Tag {
  id: string | number;
  name: string;
  name_en?: string;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  icon?: string;
  weight?: number;
  is_fixed?: boolean;
}

export interface Link {
  id: string | number;
  name: string;
  url: string;
  icon?: string;
  order?: number;
  user_id?: string | number;
}

export interface Gallery {
  id: string | number;
  user_id: string | number;
  title: string;
  description?: string;
  visibility: 'public' | 'private' | 'followers';
  status?: 'pending' | 'approved' | 'rejected';
  order?: number;
  is_featured?: boolean;
  featured_at?: string;
  can_be_featured?: boolean;
  featured_limit?: number | null;
  media_count?: number;
  can_view?: boolean;
  created_at?: string;
  updated_at?: string;
  user?: User;
  media?: GalleryMediaItem[];
  likes_count: number;
  liked_by_user: boolean;
}

export interface GalleryMediaItem {
  id: string | number;
  media_id: string | number;
  gallery_id: string | number;
  order: number;
  caption?: string;
  url: string;
  thumb_url: string;
  thumb_webp_url?: string;
  preview_url: string;
  file_name: string;
  mime_type: string;
  size: number;
  created_at?: string;
}

export interface PaginatorInfo {
  count: number;
  currentPage: number;
  firstItem: number | null;
  hasMorePages: boolean;
  lastItem: number | null;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface GalleryPaginator {
  data: Gallery[];
  paginatorInfo: PaginatorInfo;
}

export interface UserPaginator {
  data: User[];
  paginatorInfo: PaginatorInfo;
}

export interface Media {
  id: string | number;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  thumb_url?: string;
  preview_url?: string;
  collection_name?: string;
}

export interface SiteSettings {
  site_title?: string;
  site_description?: string;
  logo_url?: string;
  favicon_url?: string;
  default_avatar_url?: string;
  avatar_width?: number;
  avatar_height?: number;
  thumbnail_width?: number;
  thumbnail_height?: number;
  grid_cols_desktop?: number;
  grid_cols_mobile?: number;
  grid_users_sort?: 'newest' | 'oldest' | 'most_views' | 'least_views' | 'name' | 'username' | 'random';
  grid_users_per_page?: number;
  max_galleries_creator?: number;
  max_galleries_vip?: number | null;
  max_media_per_gallery_creator?: number;
  max_media_per_gallery_vip?: number | null;
  max_upload_size_creator?: number;
  max_upload_size_vip?: number;
  // Campos comentados - Funcionalidad futura
  // require_approval_creator?: boolean;
  // require_approval_vip?: boolean;
  // allow_comments_creator?: boolean;
  // allow_comments_vip?: boolean;
  vip_featured_profile?: boolean;
  vip_priority_search?: boolean;
  vip_home_enabled?: boolean;
  vip_home_limit?: number;
  vip_badge_label?: string | null;
  vip_badge_icon?: string | null;
  featured_galleries_vip?: number;
  primary_color?: string;
  secondary_color?: string;
  success_color?: string;
  danger_color?: string;
  warning_color?: string;
  info_color?: string;
  light_color?: string;
  dark_color?: string;
  custom_css?: string;
  heading_font?: string;
  body_font?: string;
  transition_type?: string;
  google_analytics_id?: string;
}

export interface Page {
  id: string | number;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  order?: number;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ContactMessage {
  id: string | number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'new' | 'read' | 'responded' | 'closed';
  created_at?: string;
}

export interface Cafe {
  id: string | number;
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  image_url?: string;
  branches_count?: number;
  reviews_count?: number;
  average_rating?: number;
  branches?: CafeBranch[];
}

export interface CafeBranch {
  id: string | number;
  cafe_id: string | number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  website?: string;
  google_maps_url?: string;
  menu_qr_url?: string;
  entry_price?: number;
  image_url?: string;
  tags?: Tag[];
  creators?: User[];
  reviews_count?: number;
  average_rating?: number;
  reviews?: CafeBranchReview[];
}

export interface CafeBranchReview {
  id: string | number;
  cafe_branch_id: string | number;
  user_id: string | number;
  rating: number;
  comment?: string;
  created_at?: string;
  user?: User;
}

export interface Ticket {
  id: string | number;
  user_id: string | number;
  assigned_to?: string | number;
  category: 'tecnico' | 'facturacion' | 'cuenta' | 'contenido' | 'otro';
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  subject: string;
  description: string;
  resolution?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  assigned_user?: User;
  comments?: TicketComment[];
  comments_count?: number;
}

export interface TicketComment {
  id: string | number;
  ticket_id: string | number;
  user_id: string | number;
  comment: string;
  is_internal: boolean;
  created_at?: string;
  user?: User;
}

// Component Props Types
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  register: (name: string, email: string, username: string, password: string, password_confirmation: string, birth_date: string, gender: string, captcha?: string) => Promise<User>;
  refreshUser: () => Promise<void>;
}

export interface GraphQLRequestOptions {
  query: string;
  variables?: Record<string, any>;
  schema?: 'default' | 'public';
  authenticated?: boolean;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, any>;
  }>;
}

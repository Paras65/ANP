export interface Article {
  _id: string;
  title: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  publishedAt: string;
  district: string;
  state: 'chhattisgarh' | 'madhya-pradesh';
  category: string;
  author: string;
  views?: number;
  status?: 'PUBLISHED' | 'DRAFT' | 'REVIEW' | 'ARCHIVED';
  isBreaking?: boolean;
  isFeatured?: boolean;
  shares?: number;
}

export interface VideoBulletin {
  id: string;
  title: string;
  youtubeId: string;
  thumbnail: string;
  duration: string;
  views: string;
  timeAgo: string;
  category: string;
  youtubeUrl: string;
}

export interface ReelComment {
  id: string;
  user: string;
  text: string;
  time: string;
  avatar: string;
  createdAt?: string;
}

export interface InstagramPost {
  id: string;
  caption: string;
  imageUrl: string;
  videoUrl?: string;
  youtubeId?: string;
  embedUrl?: string;
  postUrl: string;
  likes: string;
  likesCount?: number;
  commentsCount?: string;
  sharesCount?: string;
  comments?: ReelComment[];
  district: string;
  timeAgo: string;
  audioTrack?: string;
}

export interface MandiRate {
  id: string;
  crop: string;
  mandi: string;
  state: string;
  rate: number;
  unit: string;
  change: 'up' | 'down' | 'steady';
  diff: number;
}

export interface DistrictItem {
  _id: string;
  name: string;
  nameHindi: string;
  slug: string;
  state: 'chhattisgarh' | 'madhya-pradesh';
}

export interface Reporter {
  _id: string;
  name: string;
  nameHindi?: string;
  phone: string;
  role: 'REPORTER' | 'EDITOR' | 'ADMIN';
  bureau: string;
  district: string;
  districtId?: string;
  reporterIdCode: string;
  photoUrl?: string;
  articlesCount?: number;
  isActive: boolean;
  createdAt?: string;
}


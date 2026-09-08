export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  tag?: string | null;
  price?: string | null;
  link?: string | null;
  image: string;
  order: number;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateHeroSlideInput {
  title: string;
  subtitle: string;
  badge: string;
  tag?: string | null;
  price?: string | null;
  link?: string;
  image: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateHeroSlideInput {
  title?: string;
  subtitle?: string;
  badge?: string;
  tag?: string | null;
  price?: string | null;
  link?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
}

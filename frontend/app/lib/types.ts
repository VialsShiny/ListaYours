export type UserRole = "owner" | "visitor";

export type User = {
  id: number | string;
  email: string;
  display_name: string;
  role: UserRole;
  has_avatar: boolean;
  avatar_updated_at: string | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type WishlistSummary = {
  title: string;
  slug: string;
  description: string | null;
};

export type Category = {
  id: number | string;
  name: string;
  position: number;
};

export type PublicGift = {
  id: number | string;
  category_id: number | string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: string | null;
  old_price: string | null;
  currency: string;
  purchase_url: string | null;
  position: number;
  is_reserved: boolean;
  reserved_by_me: boolean;
};

export type PublicWishlist = {
  wishlist: WishlistSummary;
  categories: Category[];
  gifts: PublicGift[];
  reservations_visible: boolean;
};

export type Reservation = {
  id: number | string;
  gift_id: number | string;
  created_at: string;
};

export type MyReservation = {
  reservation: Reservation;
  gift: PublicGift;
  wishlist: WishlistSummary;
};

export type OwnerWishlist = {
  id: number | string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type OwnerGift = {
  id: number | string;
  category_id: number | string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: string | null;
  old_price: string | null;
  currency: string;
  purchase_url: string | null;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type OwnerData = {
  wishlist: OwnerWishlist;
  categories: Category[];
  gifts: OwnerGift[];
};

export type WishlistPatch = Partial<
  Pick<OwnerWishlist, "title" | "slug" | "description" | "is_published">
>;

export type GiftPayload = {
  name: string;
  description?: string | null;
  image_url?: string | null;
  price?: string | null;
  old_price?: string | null;
  currency?: string;
  purchase_url?: string | null;
  category_id?: number | string | null;
  is_visible?: boolean;
};

export type ScrapeStrategy = "HTTPX" | "PLAYWRIGHT";

export type ProductData = {
  product_url: string;
  canonical_url: string | null;
  title: string | null;
  price: string | null;
  old_price: string | null;
  discount: string | null;
  currency: string | null;
  description: string | null;
  images: string[];
  gallery: string[];
  brand: string | null;
  sku: string | null;
  availability: boolean | null;
  stock: string | null;
  category: string | null;
  variants: Record<string, string[]>;
  characteristics: Record<string, unknown>;
  reviews: {
    rating_average: number | null;
    review_count: number | null;
    list: unknown[];
  };
};

export type ScrapeResponse = {
  success: boolean;
  data: ProductData | null;
  error: string | null;
  strategy_used: string | null;
  debug: boolean;
};

export type ProfilePatch = { display_name?: string; email?: string };

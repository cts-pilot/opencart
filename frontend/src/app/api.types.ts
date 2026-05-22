export interface Category {
  categoryId: number;
  categoryName: string;
}

export interface Product {
  productId: number;
  productName: string;
  productUrl: string;
  price: number;
  stock: number;
  category?: Category;
  seller?: SellerProfile;
  offerPercent?: number | null;
  offerValidUntil?: string | null;
}

export interface Review {
  reviewId: number;
  rating: number;
  comment: string;
  user?: UserProfile;
}

export interface Address {
  addressId: number;
  country: string;
  city: string;
  address: string;
  pincode: string;
}

export interface CartItem {
  cartItemsId: number;
  qty: number;
  product: Product;
}

export interface WishlistItem {
  id: number;
  product: Product;
}

export interface Order {
  orderId: number;
  createdAt: string;
  address: Address;
}

export interface OrderItem {
  orderItemId: number;
  qty: number;
  status: string;
  product: Product;
  /** Frozen unit price captured at order placement. */
  unitPrice?: number | null;
  /** Frozen offer percent captured at order placement. */
  offerPercent?: number | null;
  order?: {
    orderId?: number;
    createdAt?: string;
    user?: UserProfile;
    address?: Address;
  };
}

export interface UserProfile {
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SellerProfile {
  sellerId?: number;
  shopName?: string;
  user?: UserProfile;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}
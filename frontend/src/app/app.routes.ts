import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { SellerComponent } from './seller/seller.component';
import { ProfileComponent } from './profile/profile.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { CartComponent } from './cart/cart.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrdersComponent } from './orders/orders.component';
import { SellerOrdersComponent } from './seller-orders/seller-orders.component';
import { SellerProductsComponent } from './seller-products/seller-products.component';
import { SellerProfileComponent } from './seller-profile/seller-profile.component';
import { sellerBlockGuard, sellerGuard, userGuard } from './auth.guard';

export const routes: Routes = [
    {path: '', redirectTo: '/home', pathMatch: 'full'},
    {path: 'home', component: HomeComponent, canActivate: [sellerBlockGuard]},
    {path: 'category/:categoryId', component: HomeComponent, canActivate: [sellerBlockGuard]},
    {path: 'product/:productId', component: ProductDetailComponent},
    {path:'register',component:RegisterComponent},
    {path:'login',component:LoginComponent},
    {path:'profile',component:ProfileComponent, canActivate: [userGuard]},
    {path:'cart',component:CartComponent, canActivate: [userGuard]},
    {path:'wishlist',component:WishlistComponent, canActivate: [userGuard]},
    {path:'checkout',component:CheckoutComponent, canActivate: [userGuard]},
    {path:'orders',component:OrdersComponent, canActivate: [userGuard]},
    {path:'seller',component:SellerComponent, canActivate: [sellerGuard]},
    {path:'seller/products',component:SellerProductsComponent, canActivate: [sellerGuard]},
    {path:'seller/orders',component:SellerOrdersComponent, canActivate: [sellerGuard]},
    {path:'seller/profile',component:SellerProfileComponent, canActivate: [sellerGuard]},
];

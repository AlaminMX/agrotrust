import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminRoute } from "@/components/auth/AdminRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import TrackOrder from "./pages/TrackOrder";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import FarmerOnboarding from "./pages/farmer/FarmerOnboarding";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import AddProduct from "./pages/farmer/AddProduct";
import EditProduct from "./pages/farmer/EditProduct";
import FarmerOrderDetail from "./pages/farmer/FarmerOrderDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import FarmerVerifications from "./pages/admin/FarmerVerifications";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import DisputeResolution from "./pages/admin/DisputeResolution";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminUsers from "./pages/admin/AdminUsers";
import NotFound from "./pages/NotFound";
import PaymentCallback from "./pages/PaymentCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:orderId" element={<OrderTracking />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              {/* Farmer Routes */}
              <Route path="/farmer/onboarding" element={<FarmerOnboarding />} />
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/products/add" element={<AddProduct />} />
              <Route path="/farmer/products/:id/edit" element={<EditProduct />} />
              <Route path="/farmer/orders/:orderId" element={<FarmerOrderDetail />} />
              {/* Admin Routes - Protected */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/verifications" element={<AdminRoute><FarmerVerifications /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/orders/:orderId" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
              <Route path="/admin/disputes" element={<AdminRoute><DisputeResolution /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/payouts" element={<AdminRoute><AdminPayouts /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

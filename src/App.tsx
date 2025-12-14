import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
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
import FarmerOnboarding from "./pages/farmer/FarmerOnboarding";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import AddProduct from "./pages/farmer/AddProduct";
import EditProduct from "./pages/farmer/EditProduct";
import FarmerOrderDetail from "./pages/farmer/FarmerOrderDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FarmerVerifications from "./pages/admin/FarmerVerifications";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import DisputeResolution from "./pages/admin/DisputeResolution";
import NotFound from "./pages/NotFound";

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
              {/* Farmer Routes */}
              <Route path="/farmer/onboarding" element={<FarmerOnboarding />} />
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/products/add" element={<AddProduct />} />
              <Route path="/farmer/products/:id/edit" element={<EditProduct />} />
              <Route path="/farmer/orders/:orderId" element={<FarmerOrderDetail />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/verifications" element={<FarmerVerifications />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
              <Route path="/admin/disputes" element={<DisputeResolution />} />
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

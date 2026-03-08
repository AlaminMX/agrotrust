import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AppErrorBoundary } from "@/components/layout/AppErrorBoundary";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import TrustAndSafety from "./pages/TrustAndSafety";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import FarmerProfile from "./pages/FarmerProfile";
import FarmerOnboarding from "./pages/farmer/FarmerOnboarding";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import AddProduct from "./pages/farmer/AddProduct";
import EditProduct from "./pages/farmer/EditProduct";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FarmerVerifications from "./pages/admin/FarmerVerifications";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminNotifications from "./pages/admin/AdminNotifications";
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
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:state" element={<Products />} />
              <Route path="/products/id/:id" element={<ProductDetail />} />
              <Route path="/trust-and-safety" element={<TrustAndSafety />} />
              <Route path="/how-it-works" element={<TrustAndSafety />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/farmers/:id" element={<FarmerProfile />} />
              {/* Farmer Routes */}
              <Route path="/farmer/onboarding" element={<FarmerOnboarding />} />
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/products/add" element={<AddProduct />} />
              <Route path="/farmer/products/:id/edit" element={<EditProduct />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/verifications" element={<AdminRoute><FarmerVerifications /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
              <Route path="/admin/locations" element={<AdminRoute><AdminLocations /></AdminRoute>} />
              <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

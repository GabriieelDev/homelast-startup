import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CartSyncProvider from "@/components/CartSyncProvider";

import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Addresses from "./pages/Addresses.tsx";
import Checkout from "./pages/Checkout.tsx";
import OrderConfirmation from "./pages/OrderConfirmation.tsx";
import OrderTracking from "./pages/OrderTracking.tsx";
import Orders from "./pages/Orders.tsx";
import Admin from "./pages/Admin.tsx";
import Courier from "./pages/Courier.tsx";
import CourierLogin from "./pages/CourierLogin.tsx";
import Perfil from "./pages/Perfil.tsx";
import Historico from "./pages/Historico.tsx";
import SobreNos from "./pages/SobreNos.tsx";
import TermosDeUso from "./pages/TermosDeUso.tsx";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartSyncProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/enderecos" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/confirmacao" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="/rastreamento" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/entregador/login" element={<CourierLogin />} />
            <Route path="/entregador" element={<ProtectedRoute><Courier /></ProtectedRoute>} />
            <Route path="/sobre" element={<SobreNos />} />
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          </BrowserRouter>
        </TooltipProvider>
      </CartSyncProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

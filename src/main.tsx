import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ReviewRemovalCheckout from "./pages/ReviewRemovalCheckout";
import ClientDashboard from "./pages/ClientDashboard";
import ClientLogin from "./pages/ClientLogin";
import { AdminAuthProvider } from "./hooks/useAdmin";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardHome from "./components/admin/DashboardHome";
import ContactSubmissions from "./components/admin/ContactSubmissions";
import CheckoutSubmissions from "./components/admin/CheckoutSubmissions";
import EmailTemplates from "./components/admin/EmailTemplates";
import SettingsPage from "./components/admin/SettingsPage";
import SiteSettings from "./components/admin/SiteSettings";
import ContentManager from "./components/admin/ContentManager";
import AccountSettings from "./components/admin/AccountSettings";
import "./index.css";

function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthProvider>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/checkout",
    element: <ReviewRemovalCheckout />,
  },
  {
    path: "/client-login",
    element: <ClientLogin />,
  },
  {
    path: "/client-dashboard",
    element: <ClientDashboard />,
  },
  {
    path: "/admin",
    element: <AdminPage><DashboardHome /></AdminPage>,
  },
  {
    path: "/admin/contacts",
    element: <AdminPage><ContactSubmissions /></AdminPage>,
  },
  {
    path: "/admin/checkouts",
    element: <AdminPage><CheckoutSubmissions /></AdminPage>,
  },
  {
    path: "/admin/emails",
    element: <AdminPage><EmailTemplates /></AdminPage>,
  },
  {
    path: "/admin/settings",
    element: <AdminPage><SettingsPage /></AdminPage>,
  },
  {
    path: "/admin/site",
    element: <AdminPage><SiteSettings /></AdminPage>,
  },
  {
    path: "/admin/content",
    element: <AdminPage><ContentManager /></AdminPage>,
  },
  {
    path: "/admin/account",
    element: <AdminPage><AccountSettings /></AdminPage>,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/terms-of-service",
    element: <TermsOfService />,
  },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Equipment from "@/pages/Equipment/Equipment";
import Customers from "@/pages/Customers/Customers";
import Suppliers from "@/pages/Suppliers/Suppliers";
import Rentals from "@/pages/Rentals/Rentals";
import UsageStats from "@/pages/UsageStats/UsageStats";
import Damage from "@/pages/Damage/Damage";
import Maintenance from "@/pages/Maintenance/Maintenance";
import Inventory from "@/pages/Inventory/Inventory";
import Reports from "@/pages/Reports/Reports";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="rentals" element={<Rentals />} />
          <Route path="usage-stats" element={<UsageStats />} />
          <Route path="damage" element={<Damage />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

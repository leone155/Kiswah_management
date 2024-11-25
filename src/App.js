import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ManagementPage from "./ManagementPage";
import SupportPage from "./SupportPage";
import UserInfoPage from "./UserInfoPage"; // Import UserInfoPage
import DeliveryPage from "./DeliveryPage"; // Import DeliveryPage
import StoragePage from "./StoragePage"; // Import StoragePage

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route for ManagementPage */}
        <Route path="/" element={<ManagementPage />} />
        
        {/* Route for SupportPage */}
        <Route path="/support" element={<SupportPage />} />
        
        {/* Route for UserInfoPage */}
        <Route path="/user-info" element={<UserInfoPage />} />
        
        {/* Route for DeliveryPage */}
        <Route path="/delivery" element={<DeliveryPage />} />
        
        {/* Route for StoragePage */}
        <Route path="/storage" element={<StoragePage />} />
      </Routes>
    </Router>
  );
}

export default App;

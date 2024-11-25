import React from "react";
import "./ManagementPage.css";
import { FaWarehouse, FaTruck, FaHeadset, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.png"; // Import the logo

function ManagementPage() {
  const navigate = useNavigate(); // Initialize navigation hook

  return (
    <div className="management-container">
      <div className="management-header">
        <img src={logo} alt="Kiswah Logo" className="management-logo" />
        <h1 className="management-title">Kiswah Management</h1>
      </div>
      <div className="button-container">
        <button
          className="management-button"
          onClick={() => navigate("/storage")} // Navigate to StoragePage
        >
          <FaWarehouse className="button-icon" />
          Storage
        </button>
        <button
          className="management-button"
          onClick={() => navigate("/delivery")} // Navigate to DeliveryPage
        >
          <FaTruck className="button-icon" />
          Delivery
        </button>
        <button
          className="management-button"
          onClick={() => navigate("/support")} // Navigate to SupportPage
        >
          <FaHeadset className="button-icon" />
          Support
        </button>
        <button
          className="management-button"
          onClick={() => navigate("/user-info")} // Navigate to UserInfoPage
        >
          <FaUsers className="button-icon" />
          Users Info
        </button>
      </div>
    </div>
  );
}

export default ManagementPage;

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"; // Firebase Firestore functions
import { db } from "./firebase"; // Import Firestore config
import "./DeliveryPage.css"; // Add your CSS styles
import { FaTruck } from "react-icons/fa"; // Import delivery icon

function DeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [activeTable, setActiveTable] = useState("donations"); // Track active table (donations or orders)

  useEffect(() => {
    async function fetchDeliveries() {
      try {
        console.log("Fetching InTransit DonationBags...");

        const donationBagsSnapshot = await getDocs(collection(db, "DonationBags"));

        // Filter and map the data to match the requirements
        const inTransitDonations = donationBagsSnapshot.docs
          .filter((doc) => doc.data().status === "InTransit") // Only fetch InTransit donations
          .map((doc, index) => {
            const data = doc.data();
            return {
              serial: index + 1, // Serial number
              id: doc.id,
              dateOfPickup: data.estimated_pickup_time?.toDate(),
              estimatedDelivery: data.estimated_delivery_time
                ? new Date(data.estimated_delivery_time)
                : null,
              trackingNumber: data.tracking_number || "Unknown",
              driverName: data.driver_name || "Unknown",
              donorName: data.donor_name || "Unknown",
              donorPhone: data.phone_number || "Unknown",
              weight: data.weight || "Unknown",
              donationNote: data.donation_note || "No note provided",
              createdAt: data.created_at?.toDate(),
            };
          });

        setDeliveries(inTransitDonations);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchOrders() {
      try {
        console.log("Fetching InTransit Orders...");

        const ordersSnapshot = await getDocs(collection(db, "Orders"));

        // Filter and map the data to match the requirements
        const inTransitOrders = ordersSnapshot.docs
          .filter((doc) => doc.data().status === "InTransit") // Only fetch InTransit orders
          .map((doc, index) => {
            const data = doc.data();
            const estimatedDelivery = new Date(data.pickup_date);
            estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 2) + 1); // Estimated delivery after 1 or 2 days

            return {
              serial: index + 1, // Serial number
              id: doc.id,
              dateOfPickup: data.pickup_date ? new Date(data.pickup_date) : null,
              estimatedDelivery,
              trackingNumber: data.tracking_number || "Unknown",
              driverName: data.driver_name || "Unknown",
            };
          });

        setOrders(inTransitOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    }

    fetchDeliveries();
    fetchOrders();
  }, []);

  const formatDateTime = (date) => {
    if (!date) return "No Date Provided";
    return (
      new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " at " +
      new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  return (
    <div className="delivery-page">
      <button onClick={() => window.history.back()} className="back-button">
        Back to Home
      </button>
      <div className="delivery-icon">
        <FaTruck size={100} color="#32a852" />
      </div>
      <h1 className="delivery-title">Delivery Information</h1>

      <div className="filter-buttons">
        <button
          className={`filter-button ${activeTable === "donations" ? "active" : ""}`}
          onClick={() => setActiveTable("donations")}
        >
          InTransit Donations
        </button>
        <button
          className={`filter-button ${activeTable === "orders" ? "active" : ""}`}
          onClick={() => setActiveTable("orders")}
        >
          InTransit Orders
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading deliveries...</p>
        </div>
      ) : activeTable === "donations" ? (
        <div className="table-wrapper">
          <table className="deliveries-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Donation ID</th>
                <th>Date of Pickup</th>
                <th>Estimated Delivery</th>
                <th>Tracking Number</th>
                <th>Driver Name</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr
                  key={delivery.id}
                  className={delivery.serial % 2 === 0 ? "even-row" : "odd-row"}
                  onClick={() => setSelectedDelivery(delivery)} // Set selected delivery on row click
                  style={{ cursor: "pointer" }} // Make row clickable
                >
                  <td>{delivery.serial}</td>
                  <td>{delivery.id}</td>
                  <td>{formatDateTime(delivery.dateOfPickup)}</td>
                  <td>{formatDateTime(delivery.estimatedDelivery)}</td>
                  <td>{delivery.trackingNumber}</td>
                  <td>{delivery.driverName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Order ID</th>
                <th>Date of Pickup</th>
                <th>Estimated Delivery</th>
                <th>Tracking Number</th>
                <th>Driver Name</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={order.serial % 2 === 0 ? "even-row" : "odd-row"}
                  onClick={() => setSelectedDelivery(order)} // Set selected order on row click
                  style={{ cursor: "pointer" }} // Make row clickable
                >
                  <td>{order.serial}</td>
                  <td>{order.id}</td>
                  <td>{formatDateTime(order.dateOfPickup)}</td>
                  <td>{formatDateTime(order.estimatedDelivery)}</td>
                  <td>{order.trackingNumber}</td>
                  <td>{order.driverName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDelivery && (
        <div className="delivery-modal">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => setSelectedDelivery(null)}
            >
              &#10005;
            </button>
            <h2>Delivery Details</h2>
            <p>
              <strong>Serial Number:</strong> {selectedDelivery.serial}
            </p>
            <p>
              <strong>Donation/Order ID:</strong> {selectedDelivery.id}
            </p>
            <p>
              <strong>Date of Pickup:</strong> {formatDateTime(selectedDelivery.dateOfPickup)}
            </p>
            <p>
              <strong>Estimated Delivery:</strong> {formatDateTime(selectedDelivery.estimatedDelivery)}
            </p>
            <p>
              <strong>Tracking Number:</strong> {selectedDelivery.trackingNumber}
            </p>
            <p>
              <strong>Driver Name:</strong> {selectedDelivery.driverName}
            </p>
            {activeTable === "donations" && (
              <>
                <p>
                  <strong>Donor Name:</strong> {selectedDelivery.donorName}
                </p>
                <p>
                  <strong>Donor Phone:</strong> {selectedDelivery.donorPhone}
                </p>
                <p>
                  <strong>Package Weight:</strong> {selectedDelivery.weight} kg
                </p>
                <p>
                  <strong>Donation Note:</strong> {selectedDelivery.donationNote}
                </p>
              </>
            )}
            <p>
              <strong>Created At:</strong> {formatDateTime(selectedDelivery.createdAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryPage;

import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"; // Firestore functions
import { db } from "./firebase"; // Firestore config
import { FaWarehouse, FaWeight, FaClipboardList } from "react-icons/fa"; // Icons
import fulfillOrders from "./functions/fulfillOrders"; // Import fulfillOrders function
import "./StoragePage.css"; // Add your CSS styles

function StoragePage() {
  const [storages, setStorages] = useState([]);
  const [filteredStorages, setFilteredStorages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true); // Unified loading state for all content
  const [orderModal, setOrderModal] = useState(null);
  const [filter, setFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [activeTable, setActiveTable] = useState("donationBags");
  const [totalDonationWeight, setTotalDonationWeight] = useState(0);
  const [totalRequestedQuantity, setTotalRequestedQuantity] = useState(0);
  const [loadingDonationId, setLoadingDonationId] = useState(null); // Track the donation currently being cleaned
  const [fulfillLoading, setFulfillLoading] = useState(false); // Track if fulfill orders process is loading

  useEffect(() => {
    async function fetchStoragesAndOrders() {
      setLoading(true);
      try {
        // Fetch donation bags
        const donationBagsSnapshot = await getDocs(collection(db, "DonationBags"));
        const storagesWithDetails = await Promise.all(
          donationBagsSnapshot.docs
            .filter((doc) => doc.data().status === "InStorage")
            .map(async (doc, index) => {
              const data = doc.data();
              return {
                serial: index + 1,
                id: doc.id,
                createdAt: data.created_at?.toDate(),
                storageEntryTime: data.estimated_delivery_time
                  ? new Date(data.estimated_delivery_time)
                  : null,
                cleanStatus: data.needs_laundry ? "Unclean" : "Clean",
                phoneNumber: data.phone_number || "Unknown",
                weight: data.weight || 0,
              };
            })
        );

        const totalWeight = storagesWithDetails.reduce(
          (sum, storage) => sum + (storage.weight || 0),
          0
        );

        setTotalDonationWeight(totalWeight);
        setStorages(storagesWithDetails);
        setFilteredStorages(storagesWithDetails);

        // Fetch orders
        const ordersSnapshot = await getDocs(collection(db, "Orders"));
        const ordersWithDetails = await Promise.all(
          ordersSnapshot.docs
            .filter(
              (doc) =>
                doc.data().status === "Pending" || doc.data().status === "InStorage"
            )
            .map((doc, index) => {
              const data = doc.data();
              return {
                serial: index + 1,
                id: doc.id,
                createdAt: data.created_at?.toDate(),
                priority: data.priority || "Low",
                requestedQuantity: data.requested_quantity || 0,
                fulfilledBy: data.fulfilled_by || null,
                address: data.address || "No Address Provided",
                orderNote: data.order_note || "No Notes",
              };
            })
        );

        // Calculate total requested quantity only for unfulfilled orders
        const totalRequested = ordersWithDetails
          .filter((order) => !order.fulfilledBy) // Only count orders that are not fulfilled
          .reduce((sum, order) => sum + (order.requestedQuantity || 0), 0);

        setTotalRequestedQuantity(totalRequested);
        setOrders(ordersWithDetails);
        setFilteredOrders(ordersWithDetails);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStoragesAndOrders();
  }, []);

  const applyStorageFilter = (filterOption) => {
    setFilter(filterOption);
    setFilteredStorages(
      filterOption === "All"
        ? storages
        : storages.filter((storage) => storage.cleanStatus === filterOption)
    );
  };

  const applyOrderFilter = (filterOption) => {
    setOrderFilter(filterOption);
    setFilteredOrders(
      filterOption === "All"
        ? orders
        : orders.filter(
            (order) =>
              (filterOption === "Fulfilled") === Boolean(order.fulfilledBy)
          )
    );
  };

  const toggleLaundryStatus = async (id) => {
    if (!id) return;

    const confirmation = window.confirm(
      "Are you sure you want to mark this donation as Clean?"
    );
    if (!confirmation) return;

    try {
      setLoadingDonationId(id); // Set the loading state for the current donation being cleaned
      const donationRef = doc(db, "DonationBags", id);
      await updateDoc(donationRef, { needs_laundry: false }); // Update the status in Firestore

      // Re-fetch the donation bags data
      const donationBagsSnapshot = await getDocs(collection(db, "DonationBags"));
      const storagesWithDetails = await Promise.all(
        donationBagsSnapshot.docs
          .filter((doc) => doc.data().status === "InStorage")
          .map(async (doc, index) => {
            const data = doc.data();
            return {
              serial: index + 1,
              id: doc.id,
              createdAt: data.created_at?.toDate(),
              storageEntryTime: data.estimated_delivery_time
                ? new Date(data.estimated_delivery_time)
                : null,
              cleanStatus: data.needs_laundry ? "Unclean" : "Clean",
              phoneNumber: data.phone_number || "Unknown",
              weight: data.weight || 0,
            };
          })
      );

      const totalWeight = storagesWithDetails.reduce(
        (sum, storage) => sum + (storage.weight || 0),
        0
      );

      // Update state with the refreshed data
      setTotalDonationWeight(totalWeight);
      setStorages(storagesWithDetails);
      setFilteredStorages(storagesWithDetails);

      alert("Donation marked as Clean successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoadingDonationId(null); // Reset the loading state
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "No Date Provided";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleFulfillOrders = async () => {
    setFulfillLoading(true); // Set loading state for fulfill orders
    try {
      await fulfillOrders();
      window.location.reload(); // Reload the page after fulfilling orders
    } catch (error) {
      console.error("Error fulfilling orders:", error);
    } finally {
      setFulfillLoading(false); // Reset loading state
    }
  };

  return (
    <div className="storage-page">
      {/* Back Button */}
      <button onClick={() => window.history.back()} className="back-button">
        Back to Home
      </button>

      {/* Icon */}
      <div className="storage-icon">
        <FaWarehouse size={100} color="#32a852" />
      </div>
      <h1 className="storage-title">Storage Information</h1>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="cards-container">
            <div
              className={`card ${activeTable === "donationBags" ? "active-card" : ""}`}
              onClick={() => setActiveTable("donationBags")}
            >
              <div className="card-icon">
                <FaWeight size={40} color="#32a852" />
              </div>
              <div className="card-content">
                <h3>Total Donation Weight</h3>
                <p>{totalDonationWeight} kg</p>
              </div>
            </div>
            <div
              className={`card ${activeTable === "orders" ? "active-card" : ""}`}
              onClick={() => setActiveTable("orders")}
            >
              <div className="card-icon">
                <FaClipboardList size={40} color="#32a852" />
              </div>
              <div className="card-content">
                <h3>Total Requested</h3>
                <p>{totalRequestedQuantity} kg</p>
              </div>
            </div>
          </div>

          {/* Fulfill Orders Button */}
          <div className="fulfill-orders-button-container">
            <button
              onClick={handleFulfillOrders}
              className="fulfill-orders-button"
              disabled={fulfillLoading}
            >
              {fulfillLoading ? <div className="spinner"></div> : "Fulfill Orders"}
            </button>
          </div>

          {/* Table Logic */}
          {activeTable === "donationBags" ? (
            <>
              <div className="filter-buttons">
                <button
                  className={`filter-button ${filter === "All" ? "active" : ""}`}
                  onClick={() => applyStorageFilter("All")}
                >
                  All
                </button>
                <button
                  className={`filter-button ${filter === "Clean" ? "active" : ""}`}
                  onClick={() => applyStorageFilter("Clean")}
                >
                  Clean
                </button>
                <button
                  className={`filter-button ${filter === "Unclean" ? "active" : ""}`}
                  onClick={() => applyStorageFilter("Unclean")}
                >
                  Unclean
                </button>
              </div>
              <div className="table-wrapper">
                <table className="storages-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Donation ID</th>
                      <th>Created At</th>
                      <th>Storage Entry Time</th>
                      <th>Clean Status</th>
                      <th>Phone Number</th>
                      <th>Weight (kg)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStorages.map((storage) => (
                      <tr key={storage.id}>
                        <td>{storage.serial}</td>
                        <td>{storage.id}</td>
                        <td>{formatDateTime(storage.createdAt)}</td>
                        <td>{formatDateTime(storage.storageEntryTime)}</td>
                        <td>{storage.cleanStatus}</td>
                        <td>{storage.phoneNumber}</td>
                        <td>{storage.weight}</td>
                        <td>
                          {storage.cleanStatus === "Unclean" &&
                            (loadingDonationId === storage.id ? (
                              <div className="spinner"></div>
                            ) : (
                              <button
                                onClick={() => toggleLaundryStatus(storage.id)}
                                className="toggle-status-button"
                              >
                                Mark as Clean
                              </button>
                            ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="filter-buttons">
                <button
                  className={`filter-button ${orderFilter === "All" ? "active" : ""}`}
                  onClick={() => applyOrderFilter("All")}
                >
                  All
                </button>
                <button
                  className={`filter-button ${orderFilter === "Fulfilled" ? "active" : ""}`}
                  onClick={() => applyOrderFilter("Fulfilled")}
                >
                  Fulfilled
                </button>
                <button
                  className={`filter-button ${orderFilter === "Unfulfilled" ? "active" : ""}`}
                  onClick={() => applyOrderFilter("Unfulfilled")}
                >
                  Unfulfilled
                </button>
              </div>
              <div className="table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Order ID</th>
                      <th>Created At</th>
                      <th>Priority</th>
                      <th>Requested Quantity</th>
                      <th>Fulfilled By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setOrderModal(order)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{order.serial}</td>
                        <td>{order.id}</td>
                        <td>{formatDateTime(order.createdAt)}</td>
                        <td>{order.priority}</td>
                        <td>{order.requestedQuantity}</td>
                        <td>
                          <button
                            disabled={!order.fulfilledBy}
                            onClick={(e) => {
                              e.stopPropagation();
                              const fulfilledByIds = order.fulfilledBy.map((bag) => bag.id).join("--");
                              alert(`Fulfilled By: ${fulfilledByIds}`);
                            }}
                          >
                            {order.fulfilledBy ? "View" : "None"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Order Modal */}
          {orderModal && (
            <div className="modal">
              <div className="modal-content scrollable">
                <button
                  onClick={() => setOrderModal(null)}
                  className="close-button"
                >
                  X
                </button>
                <h2>Order Details</h2>
                <p>
                  <strong>ID:</strong> {orderModal.id}
                </p>
                <p>
                  <strong>Priority:</strong> {orderModal.priority}
                </p>
                <p>
                  <strong>Requested Quantity:</strong> {orderModal.requestedQuantity}
                </p>
                <p>
                  <strong>Address:</strong> {orderModal.address}
                </p>
                <p>
                  <strong>Note:</strong> {orderModal.orderNote}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StoragePage;

import React, { useEffect, useState, useCallback } from "react";
import "./SupportPage.css"; // Add your CSS styles here
import { FaHeadset } from "react-icons/fa"; // Import support icon
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore"; // Import Firebase functions
import { db } from "./firebase"; // Firebase configuration

function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all"); // Filter state: 'all', 'completed', 'uncompleted'
  const [loading, setLoading] = useState(true);

  // Fetch user email based on UID from Donors or Recipients collection
  const fetchUserEmail = useCallback(async (uid) => {
    try {
      let userDoc = await getDoc(doc(db, "Donors", uid));
      if (userDoc.exists()) {
        return userDoc.data().email; // Return email if found in Donors
      }

      userDoc = await getDoc(doc(db, "Recipients", uid));
      if (userDoc.exists()) {
        return userDoc.data().email; // Return email if found in Recipients
      }

      return null; // Return null if email not found
    } catch (error) {
      console.error("Error fetching user email:", error);
      return null;
    }
  }, []);

  // Fetch tickets and sort them by createdAt date in ascending order
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true); // Show loading spinner
      const querySnapshot = await getDocs(collection(db, "Support"));
      let fetchedTickets = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const ticketData = doc.data();
          const email = await fetchUserEmail(ticketData.uid); // Fetch user email
          const createdAt =
            ticketData.created_at && ticketData.created_at.toDate
              ? ticketData.created_at.toDate()
              : null;
          const updatedAt =
            ticketData.update_at && ticketData.update_at.toDate
              ? ticketData.update_at.toDate()
              : null;

          return {
            id: doc.id, // Document ID
            ...ticketData, // Document data
            email: email || "Email not found", // Add user email
            createdAt, // Add formatted created_at
            updatedAt, // Add formatted update_at
          };
        })
      );

      fetchedTickets.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // Sort by date

      fetchedTickets = fetchedTickets.map((ticket, index) => ({
        ...ticket,
        serial: index + 1, // Assign serial number based on sorted order
      }));

      setTickets(fetchedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false); // Hide loading spinner
    }
  }, [fetchUserEmail]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]); // Include fetchTickets in the dependency array

  const handleSolve = async (id) => {
    const confirmed = window.confirm("Are you sure you want to mark this ticket as solved?");
    if (confirmed) {
      try {
        const ticketRef = doc(db, "Support", id);
        await updateDoc(ticketRef, { solved: true });
        fetchTickets(); // Refresh tickets
      } catch (error) {
        console.error("Error updating ticket:", error);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "No Date Provided";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
      " at " +
      new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "completed") return ticket.solved;
    if (filter === "uncompleted") return !ticket.solved;
    return true;
  });

  return (
    <div className="support-page">
      <button onClick={() => window.history.back()} className="back-button">
        Back to Home
      </button>
      <div className="support-header">
        <FaHeadset className="support-icon" /> {/* Add large support icon */}
        <h1 className="support-title">Support Tickets</h1>
      </div>

      {!loading && (
        <div className="filter-buttons">
          <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>
            All Tickets
          </button>
          <button onClick={() => setFilter("completed")} className={filter === "completed" ? "active" : ""}>
            Completed Tickets
          </button>
          <button onClick={() => setFilter("uncompleted")} className={filter === "uncompleted" ? "active" : ""}>
            Uncompleted Tickets
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tickets...</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Details</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>User Type</th>
                <th>User Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket, index) => (
                <tr key={ticket.id} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                  <td>{ticket.serial}</td>
                  <td>{ticket.title}</td>
                  <td>{ticket.details}</td>
                  <td>{formatDate(ticket.createdAt)}</td>
                  <td>{formatDate(ticket.updatedAt)}</td>
                  <td>{ticket.user_type}</td>
                  <td>{ticket.email}</td>
                  <td>{ticket.solved ? "Solved" : "Unsolved"}</td>
                  <td>
                    {!ticket.solved && (
                      <button onClick={() => handleSolve(ticket.id)} className="solve-button">
                        Mark as Solved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SupportPage;

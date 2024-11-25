import React, { useEffect, useState } from "react";
import "./UserInfoPage.css"; // Add your CSS styles
import { FaUsers } from "react-icons/fa"; // Import user icon
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"; // Import Firebase functions
import { db } from "./firebase"; // Firebase configuration

function UserInfoPage() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all"); // Filter: 'all', 'donors', 'recipients', 'notVerifiedWithValidRegister'
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // Modal data

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const donorsSnapshot = await getDocs(collection(db, "Donors"));
      const donors = donorsSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        ...doc.data(),
        userType: "Donor",
      }));

      const recipientsSnapshot = await getDocs(collection(db, "Recipients"));
      const recipients = recipientsSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        ...doc.data(),
        userType: "Recipient",
      }));

      const combinedUsers = [...donors, ...recipients].sort(
        (a, b) => a.created_at?.toDate() - b.created_at?.toDate()
      );

      combinedUsers.forEach((user, index) => {
        user.serial = index + 1;
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyRecipient = async (user) => {
    if (!user.register_number || user.register_number.length !== 10) {
      alert("Register number must be 10 digits to verify this recipient.");
      return;
    }

    if (window.confirm("Are you sure you want to verify this recipient?")) {
      try {
        await updateDoc(doc(db, "Recipients", user.id), {
          is_verified: true,
        });
        alert("Recipient has been verified successfully.");
        fetchUsers(); // Refresh the user list after verification
        setSelectedUser(null); // Close the dialog
      } catch (error) {
        console.error("Error verifying recipient:", error);
        alert("Failed to verify the recipient.");
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    if (filter === "donors") return user.userType === "Donor";
    if (filter === "recipients") return user.userType === "Recipient";
    if (filter === "notVerifiedWithValidRegister")
      return (
        user.userType === "Recipient" &&
        user.is_verified === false &&
        user.register_number?.length === 10
      );
    return true;
  });

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

  return (
    <div className="user-info-page">
      <button onClick={() => window.history.back()} className="back-button">
        Back to Home
      </button>
      <div className="user-icon-container">
        <FaUsers className="user-icon" /> {/* User icon */}
      </div>
      <h1 className="user-info-title">Users Information</h1>

      {!loading && (
        <div className="filter-buttons">
          <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>
            All Users
          </button>
          <button onClick={() => setFilter("donors")} className={filter === "donors" ? "active" : ""}>
            Donors
          </button>
          <button
            onClick={() => setFilter("recipients")}
            className={filter === "recipients" ? "active" : ""}
          >
            Recipients
          </button>
          <button
            onClick={() => setFilter("notVerifiedWithValidRegister")}
            className={filter === "notVerifiedWithValidRegister" ? "active" : ""}
          >
            Ready for verification
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>UID</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Phone</th>
                <th>User Type</th>
                <th>Is Verified</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={index % 2 === 0 ? "even-row" : "odd-row"}
                  onClick={() => setSelectedUser(user)}
                >
                  <td>{user.serial}</td>
                  <td>{user.name}</td>
                  <td>{user.id}</td>
                  <td>{formatDate(user.created_at?.toDate())}</td>
                  <td>{formatDate(user.updated_at?.toDate())}</td>
                  <td>{user.phone || "N/A"}</td>
                  <td>{user.userType}</td>
                  <td
                    style={{
                      color: user.is_verified === undefined ? "inherit" : "white",
                      backgroundColor:
                        user.is_verified === true
                          ? "green"
                          : user.is_verified === false
                          ? "red"
                          : "inherit",
                      textAlign: "center",
                    }}
                  >
                    {user.userType === "Recipient"
                      ? user.is_verified === undefined
                        ? "N/A"
                        : user.is_verified
                        ? "Verified"
                        : "Not Verified"
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="user-modal">
          <div className="modal-content">
            <button className="close-button" onClick={() => setSelectedUser(null)}>
              &#10005;
            </button>
            <h2>{selectedUser.name}</h2>
            <p>
              <strong>UID:</strong> {selectedUser.id}
            </p>
            <p>
              <strong>Email:</strong> {selectedUser.email || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {selectedUser.phone || "N/A"}
            </p>
            <p>
              <strong>Address:</strong> {selectedUser.address || "N/A"}
            </p>
            <p>
              <strong>Register Number:</strong> {selectedUser.register_number || "N/A"}
            </p>
            <p>
              <strong>Created At:</strong> {formatDate(selectedUser.created_at?.toDate())}
            </p>
            <p>
              <strong>Updated At:</strong> {formatDate(selectedUser.updated_at?.toDate())}
            </p>
            <p>
              <strong>User Type:</strong> {selectedUser.userType}
            </p>
            {selectedUser.userType === "Recipient" && !selectedUser.is_verified && (
              <button
                onClick={() => verifyRecipient(selectedUser)}
                disabled={!selectedUser.register_number || selectedUser.register_number.length !== 10}
                className="verify-button"
                style={{
                  fontSize: "18px",
                  padding: "10px 20px",
                  marginTop: "20px",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                  backgroundColor:
                    !selectedUser.register_number || selectedUser.register_number.length !== 10
                      ? "gray"
                      : "#32a852",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor:
                    !selectedUser.register_number || selectedUser.register_number.length !== 10
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Verify Recipient
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserInfoPage;

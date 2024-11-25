import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase"; // Import Firestore config

async function fulfillOrders() {
  try {
    // Fetch DonationBags (status = InStorage and needs_laundry = false)
    const donationBagsSnapshot = await getDocs(collection(db, "DonationBags"));
    const donationBags = donationBagsSnapshot.docs
      .filter(
        (doc) => doc.data().status === "InStorage" && doc.data().needs_laundry === false
      )
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    // Fetch Orders (status = Pending and fulfilled_by is null)
    const ordersSnapshot = await getDocs(collection(db, "Orders"));
    const orders = ordersSnapshot.docs
      .filter((doc) => doc.data().status === "Pending" && !doc.data().fulfilled_by)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    if (donationBags.length === 0) {
      alert("No clean donations available to allocate.");
      return;
    }

    if (orders.length === 0) {
      alert("No pending orders to fulfill.");
      return;
    }

    // Calculate Importance Score for Orders
    const now = new Date();
    const scoredOrders = orders.map((order) => {
      const priorityScore = order.priority * 10; // Priority Contribution
      const ageInDays = Math.floor((now - order.created_at.toDate()) / (1000 * 60 * 60 * 24));
      const importanceScore = priorityScore + ageInDays; // Total Importance Score

      return {
        ...order,
        importanceScore,
      };
    });

    // Sort Orders by Importance Score (Descending)
    scoredOrders.sort((a, b) => b.importanceScore - a.importanceScore);

    const proposedAllocations = [];
    const usedDonationBags = new Set(); // Track used donation bags

    // Helper function to find the optimal combination of bags to fulfill the order
    function findOptimalBags(donationBags, requestedQuantity) {
      const n = donationBags.length;
      let bestCombination = [];
      let minExcessWeight = Infinity;

      // Use a bitwise approach to check all combinations of donation bags
      for (let i = 1; i < (1 << n); i++) {
        let combination = [];
        let totalWeight = 0;

        for (let j = 0; j < n; j++) {
          if (i & (1 << j)) {
            const bag = donationBags[j];
            if (usedDonationBags.has(bag.id)) continue; // Skip already used bags

            combination.push(bag);
            totalWeight += bag.weight;
          }
        }

        // If the combination meets or exceeds the requested quantity but minimizes excess weight
        if (totalWeight >= requestedQuantity && totalWeight - requestedQuantity < minExcessWeight) {
          bestCombination = combination;
          minExcessWeight = totalWeight - requestedQuantity;
        }
      }

      return bestCombination;
    }

    // Allocate DonationBags to Orders More Efficiently
    for (const order of scoredOrders) {
      const requestedQuantity = order.requested_quantity;

      // Find the optimal combination of bags for the current order
      const optimalBags = findOptimalBags(donationBags, requestedQuantity);
      const allocatedWeight = optimalBags.reduce((sum, bag) => sum + bag.weight, 0);

      if (optimalBags.length > 0) {
        // Mark these bags as used
        optimalBags.forEach((bag) => usedDonationBags.add(bag.id));

        // Add to proposed allocations
        proposedAllocations.push({
          orderId: order.id,
          fulfilledBags: optimalBags,
          totalWeight: allocatedWeight,
        });
      }
    }

    if (proposedAllocations.length === 0) {
      alert("No orders can be fulfilled with the available donations.");
      return;
    }

    // Show Summary and Ask for Confirmation
    const summary = proposedAllocations
      .map(
        (allocation) =>
          `*Order ID*: ${allocation.orderId}\n*Fulfilled by Donations*: ${allocation.fulfilledBags
            .map((bag) => bag.id)
            .join(" -- ")}\n*Total Donation Bags*: ${allocation.fulfilledBags.length}\n*Total Weight*: ${allocation.totalWeight}kg\n`
      )
      .join("\n");

    const totalBagsUsed = proposedAllocations.reduce(
      (sum, allocation) => sum + allocation.fulfilledBags.length,
      0
    );

    const confirmed = window.confirm(
      `*Proposed Allocations*:\n\n${summary}\n*Total Donation Bags Used for All Orders*: ${totalBagsUsed}\n\nDo you want to proceed?`
    );

    if (!confirmed) {
      alert("Operation cancelled.");
      return;
    }

    // Perform Database Updates
    const batch = writeBatch(db);

    for (const allocation of proposedAllocations) {
      const orderRef = doc(db, "Orders", allocation.orderId);
      const fulfilledBagsRefs = allocation.fulfilledBags.map((bag) =>
        doc(db, "DonationBags", bag.id)
      );

      // Calculate pickup date (1 or 2 days after the current date)
      const pickupDate = new Date();
      pickupDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 2) + 1);
      const pickupDateString = pickupDate.toISOString().split("T")[0];

      // Update Order
      batch.update(orderRef, {
        status: "InStorage",
        fulfilled_by: fulfilledBagsRefs,
        fulfilled: true,
        pickup_date: pickupDateString, // Add pickup date to the order
      });

      // Update DonationBags
      allocation.fulfilledBags.forEach((bag) => {
        const bagRef = doc(db, "DonationBags", bag.id);
        batch.update(bagRef, { status: "Delivered" });
      });
    }

    await batch.commit();
    alert(
      `Orders have been successfully fulfilled!\n\nTotal Donation Bags Used: ${totalBagsUsed}`
    );
  } catch (error) {
    console.error("Error fulfilling orders:", error);
    alert("An error occurred while fulfilling orders. Please try again.");
  }
}

export default fulfillOrders;

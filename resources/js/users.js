import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  updateDoc // Add this
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBHJ025X5bX0-nhwvbq5CTNxCtRyvGYJE4",
  authDomain: "parepair-63325.firebaseapp.com",
  projectId: "parepair-63325",
  storageBucket: "parepair-63325.appspot.com",
  messagingSenderId: "269243614085",
  appId: "1:269243614085:web:af243ba37f8f12f2d1faec"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

let allUsers = []; // Store all users for filtering

// Authentication state listener
auth.onAuthStateChanged((user) => {
  if (user) {
    const userId = user.uid;
    fetchUserData(userId);
    countTotalAppointments();
    fetchAppointments();
    countPendingAppointments();
    writeUserData(userId, { lastLogin: new Date().toISOString() });
  } else {
    window.location.href = "index.html";
  }
});

// Logout button event listener
document.getElementById("logout-button").addEventListener("click", async () => {
  try {
    await signOut(auth);
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error signing out:", error);
  }
});

async function countTotalUsers() {
  const usersCollection = collection(db, "users");
  onSnapshot(usersCollection, (snapshot) => {
    let totalClient = 0;
    let totalServiceProviders = 0;
    let totalUsers = 0;

    snapshot.forEach((doc) => {
      const user = doc.data();
      if (user.isServiceProvider) {
        totalServiceProviders += 1;
      } else if (!user.isServiceProvider) {
        totalClient += 1;
      }
    });

    document.getElementById("clientCount").textContent = totalClient;
    document.getElementById("serviceProviderCount").textContent = totalServiceProviders;
    document.getElementById("userCount").textContent = totalClient + totalServiceProviders;
  });
}

function fetchUsers() {
  const usersCollection = collection(db, "users");
  const searchBar = document.getElementById("search-bar");

  onSnapshot(usersCollection, (snapshot) => {
    allUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    displayUsers(allUsers); // Display all users by default

    // Add event listeners to the cards
    document.getElementById("all-users-card").addEventListener("click", () => {
      displayUsers(allUsers); // Show only regular users
    });

    document.getElementById("client-card").addEventListener("click", () => {
      const clientUsers = allUsers.filter(user => !user.isServiceProvider);
      displayUsers(clientUsers);
    });

    document.getElementById("service-provider-card").addEventListener("click", () => {
      const serviceProviders = allUsers.filter(user => user.isServiceProvider); // Filter service providers
      displayUsers(serviceProviders); // Show only service providers
    });

    // Search functionality
    searchBar.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredUsers = allUsers.filter((user) =>
        (user.fullName || "").toLowerCase().includes(searchTerm)
      );
      displayUsers(filteredUsers);
    });
  });
}

function displayUsers(users) {
  const usersTbody = document.getElementById("users-tbody");
  usersTbody.innerHTML = "";
  let rowCount = 1;

  users.forEach((user) => {
      const isVerified = user.isIDFrontTaken && user.isSelfieTaken;
      const verificationStatus = isVerified ? "Verified" : "Not Verified";
      const verificationIcon = isVerified ? "✅" : "❌";

      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${rowCount++}</td>
          <td>${user.uid}</td>
          <td>${user.fullName || "N/A"}</td>
          <td>${user.isServiceProvider ? "Service Provider" : "Client"}</td>
          <td>${user.jobType || "N/A"}</td>
          <td>${user.address || "N/A"}</td>
          <td>${verificationIcon} ${verificationStatus}</td>
          <td>
              <button class="btn btn-primary btn-sm view-details-button" data-uid="${user.uid}">View Details</button>
          </td>
      `;
      usersTbody.appendChild(row);
  });

  // Add event listeners to "View Details" buttons
  document.querySelectorAll(".view-details-button").forEach((button) => {
      button.addEventListener("click", async () => {
          const uid = button.getAttribute("data-uid");
          const user = allUsers.find((u) => u.uid === uid);
          if (user) {
              // Show loading overlay
              document.getElementById("loading-overlay").style.display = "flex";

              await showUserDetails(user);

              // Hide loading overlay after data is fetched
              document.getElementById("loading-overlay").style.display = "none";
          }
      });
  });


  // Add event listeners to all "View Details" buttons
  document.querySelectorAll(".view-details-button").forEach((button) => {
      button.addEventListener("click", async () => {
          const uid = button.getAttribute("data-uid");
          const user = allUsers.find((u) => u.uid === uid);
          if (user) {
              // Show loading spinner
              button.disabled = true;
              button.querySelector(".button-text").textContent = "Loading...";
              button.querySelector(".spinner-border").classList.remove("d-none");

              await showUserDetails(user);

              // Reset button after loading
              button.disabled = false;
              button.querySelector(".button-text").textContent = "View Details";
              button.querySelector(".spinner-border").classList.add("d-none");
          }
      });
  });
}

async function showUserDetails(user) {
  const detailsContainer = document.getElementById("appointmentDetails");
  const isVerified = user.isIDFrontTaken && user.isSelfieTaken; // Check if user is verified
  const verificationStatus = isVerified ? "Verified" : "Not Verified"; // Set verification status text

  // Display basic user details
  detailsContainer.innerHTML = `
    <p><strong>Full Name:</strong> ${user.fullName || "N/A"}</p>
    <p><strong>Email:</strong> ${user.email || "N/A"}</p>
    <p><strong>Role:</strong> ${user.isServiceProvider ? "Service Provider" : "Client"}</p>
    <p><strong>Job Type:</strong> ${user.jobType || "N/A"}</p>
    <p><strong>Address:</strong> ${user.address || "N/A"}</p>
    <p><strong>Verification Status:</strong> ${verificationStatus}</p>
  `;

  // If the user is a service provider, fetch and display their average rating and stars
  if (user.isServiceProvider) {
    const { averageRating } = await fetchServiceProviderRatings(user.uid);
    const completedBookingsCount = await fetchCompletedBookings(user.uid);

    detailsContainer.innerHTML += `
      <h4>Ratings:</h4>
      <p><strong>Average Rating:</strong> ${averageRating.toFixed(2)}</p>
      <div class="rating-bar" data-rating="${Math.round(averageRating)}">
        <div class="stars"></div>
      </div>
    `;

    detailsContainer.innerHTML += `
      <h4>Completed Bookings:</h4>
      <p><strong>Total Completed Bookings:</strong> ${completedBookingsCount}</p>
    `;

    // Add the "Terminate Service Provider Account" button
    detailsContainer.innerHTML += `
      <button id="terminateAccountButton" class="btn btn-danger btn-sm">Terminate Service Provider Account</button>
    `;

    // Add event listener to the "Terminate Service Provider Account" button
    document.getElementById("terminateAccountButton").addEventListener("click", () => {
      terminateServiceProviderAccount(user.uid);
    });
  }

  // Set the UID for the "View Profile" button
  const viewProfileButton = document.getElementById("viewProfileButton");
  viewProfileButton.setAttribute("data-uid", user.uid);

  // Remove any previous event listeners before adding a new one
  viewProfileButton.replaceWith(viewProfileButton.cloneNode(true));
  document.getElementById("viewProfileButton").addEventListener("click", () => {
    window.open(`user_profile.html?uid=${user.uid}`, "_blank");
  });

  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById("appointmentModal"));
  modal.show();
}
  
  // Add event listener to the "View Profile" button
  document.getElementById("viewProfileButton").addEventListener("click", () => {
    const uid = document.getElementById("viewProfileButton").getAttribute("data-uid");
    window.open = `user_profile.html?uid=${uid}`, "_blank"; // Navigate to user_profile.html with the UID
  });

async function fetchServiceProviderRatings(serviceProviderId) {
  const ratingsCollection = collection(db, "reviews");
  const q = query(ratingsCollection, where("serviceProviderUid", "==", serviceProviderId));
  const querySnapshot = await getDocs(q);

  const ratings = querySnapshot.docs.map(doc => doc.data().rating); // Extract the "rating" field
  const totalRatings = ratings.length;

  if (totalRatings === 0) {
    return {
      ratings: [],
      totalRating: 0,
      averageRating: 0,
    };
  }

  const totalRating = ratings.reduce((sum, rating) => sum + rating, 0); // Sum all ratings
  const averageRating = totalRating / totalRatings; // Calculate average

  return {
    ratings: querySnapshot.docs.map(doc => doc.data()), // Return all rating data
    totalRating,
    averageRating,
  };
}

async function terminateServiceProviderAccount(uid) {
  // Show a confirmation dialog
  const isConfirmed = confirm("Are you sure you want to terminate this service provider's account?");
  
  if (isConfirmed) {
    try {
      // Update the user's document to set isServiceProvider to false
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, {
        isServiceProvider: false,
      });

      alert("Service provider account terminated successfully.");
      // Refresh the user details or close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("appointmentModal"));
      modal.hide();
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error terminating service provider account:", error);
      alert("An error occurred while terminating the account.");
    }
  }
}

async function fetchCompletedBookings(serviceProviderUid) {
  const appointmentsCollection = collection(db, "appointments");
  const q = query(
    appointmentsCollection,
    where("serviceProviderUid", "==", serviceProviderUid),
    where("bookingStatus", "==", "Completed")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.size; // Return the count of completed bookings
}

// Check if the user is logged in
const isLoggedIn = sessionStorage.getItem('isLoggedIn');
if (!isLoggedIn) {
  window.location.replace("index.html");
}

fetchUsers();
countTotalUsers();

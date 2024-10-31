import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// Function to count total users
async function countTotalUsers() {
  try {
    const userCollection = collection(db, "users");
    const userSnapshot = await getDocs(userCollection);
    const userCount = userSnapshot.size;
    document.getElementById("userCount").textContent = userCount;
  } catch (error) {
    console.error("Error counting users:", error.message);
  }
}

async function fetchUserData(userId) {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      document.getElementById("user-data").innerHTML = `<p>User Data: ${JSON.stringify(userDoc.data())}</p>`;
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error retrieving data from Firestore:", error.message);
  }
}

async function writeUserData(userId, data) {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, data, {
      merge: true
    });
    console.log("User data written successfully");
  } catch (error) {
    console.error("Error writing data to Firestore:", error.message);
  }
}


async function fetchAppointments() {
  try {
    const appointmentsCollection = collection(db, "appointments");
    const appointmentsSnapshot = await getDocs(appointmentsCollection);

    const appointmentsTbody = document.getElementById("appointments-tbody");
    appointmentsTbody.innerHTML = "";

    let rowCount = 1;

    appointmentsSnapshot.forEach((doc) => {
      const appointment = doc.data();
      const row = document.createElement("tr");
      row.innerHTML = `
    <td>${rowCount++}</td> <!-- Increment the counter -->
    <td>${appointment.clientFullName}</td>
    <td>${appointment.serviceProviderJob}</td>
    <td>${appointment.selectedDate}</td>
    <td>${appointment.selectedTime}</td>
    <td>${appointment.bookingStatus}</td>
  `;
      appointmentsTbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
  }
}
  
async function countPendingAppointments() {
  try {
    const appointmentsCollection = collection(db, "appointments");
    const pendingQuery = query(appointmentsCollection, where("bookingStatus", "==", "Pending"));
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingCount = pendingSnapshot.size;
    document.getElementById("appointmentCount").textContent = pendingCount;
  } catch (error) {
    console.error("Error counting pending appointments:", error.message);
  }
}

auth.onAuthStateChanged((user) => {
  if (user) {
    const userId = user.uid;
    fetchUserData(userId);
    countTotalUsers();
    fetchAppointments();
    countPendingAppointments();
    writeUserData(userId, {
      lastLogin: new Date().toISOString()
    });
  } else {
    window.location.href = "index.html";
  }
});


document.getElementById("logout-button").addEventListener("click", async () => {
  await signOut(auth);
  sessionStorage.removeItem("isLoggedIn");
  window.location.href = "index.html";
});
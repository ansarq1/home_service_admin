import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHJ025X5bX0-nhwvbq5CTNxCtRyvGYJE4",
    authDomain: "parepair-63325.firebaseapp.com",
    projectId: "parepair-63325",
    storageBucket: "parepair-63325.appspot.com",
    messagingSenderId: "269243614085",
    appId: "1:269243614085:web:af243ba37f8f12f2d1faec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Get UID from URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');

onAuthStateChanged(auth, (user) => {
    if (user || uid) {
        fetchUserProfile(uid || user.uid);
    } else {
        console.error("User not authenticated");
        window.location.href = "index.html";
    }
});

// Fetch User Data
async function fetchUserProfile(uid) {
    if (!uid) {
        console.error("No UID found or user not authenticated.");
        return;
    }

    try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const user = userDoc.data();
            displayUserProfile(user);

            if (user.isServiceProvider) {
                fetchServiceProviderDetails(uid);
            }
        } else {
            console.error("User not found.");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Fetch and Display Reviews for the Service Provider
async function fetchServiceProviderReviews(uid) {
    const reviewsCollection = collection(db, "reviews");
    const q = query(reviewsCollection, where("serviceProviderUid", "==", uid));
    const querySnapshot = await getDocs(q);

    const reviews = querySnapshot.docs.map(doc => doc.data());
    displayReviews(reviews);
}

// Function to Display Reviews
// Function to Display Reviews
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById("reviewsContainer");
    
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = "<p>No reviews yet.</p>";
        return;
    }

    reviewsContainer.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="d-flex align-items-center mb-2">
                <h6 class="mb-0">${review.clientName || "Anonymous"}</h6>
            </div>
            <p class="rating-stars">${generateStars(review.rating)}</p>
            <p class="review-text">"${review.review}"</p>
            ${review.imageUrl ? `<img src="${review.imageUrl}" alt="Review Image" class="review-image mt-2">` : ""}
            <small class="text-muted">${formatTimestamp(review.timeStamp)}</small>
        </div>
    `).join("");
}

// Generate Star Rating HTML
function generateStars(rating) {
    let stars = "";
    for (let i = 0; i < 5; i++) {
        stars += `<i class="fas fa-star${i < rating ? " text-warning" : " text-secondary"}"></i>`;
    }
    return stars;
}

// Convert Firestore Timestamp to Readable Date
function formatTimestamp(timestamp) {
    if (!timestamp || !timestamp.toDate) return "Unknown Date";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });
}


let currentImage = 0; // 0 = ID Front, 1 = Selfie
let currentUser = null; // Store user data globally

// Function to update the ID image slider
function updateIDImage() {
    if (!currentUser) return; // Ensure user data is available

    const images = [currentUser.idFrontUrl, currentUser.selfieUrl];
    const captions = ["Front of ID", "Selfie Verification"];
    
    document.getElementById("idImage").src = images[currentImage] || "default-id.png";
    document.getElementById("imageCaption").textContent = captions[currentImage];

    // Enable/disable buttons based on image index
    document.getElementById("prevBtn").disabled = currentImage === 0;
    document.getElementById("nextBtn").disabled = currentImage === images.length - 1;
}

// Handle Next Button Click
document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentImage < 1) {
        currentImage++;
        updateIDImage();
    }
});

// Handle Previous Button Click
document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentImage > 0) {
        currentImage--;
        updateIDImage();
    }
});

// Function to display user details (Updated to use ID slider)
// Modify displayUserProfile to Show Reviews
function displayUserProfile(user) {
    currentUser = user;
    document.getElementById("profile-picture").src = user.profileImage;
    document.getElementById("fullName").textContent = user.fullName || "N/A";
    document.getElementById("role").textContent = user.isServiceProvider ? "Service Provider" : "Client";
    document.getElementById("email").textContent = user.email || "N/A";
    document.getElementById("jobType").textContent = user.jobType || "N/A";
    document.getElementById("address").textContent = user.address || "N/A";

    const verificationStatus = user.isIDFrontTaken && user.isSelfieTaken ? "Verified" : "Not Verified";
    document.getElementById("verificationStatus").textContent = verificationStatus;
    document.getElementById("verificationStatus").classList.replace("bg-secondary", verificationStatus === "Verified" ? "bg-success" : "bg-danger");

    if (verificationStatus === "Verified") {
        document.getElementById("showVerificationBtn").disabled = false;
    }

    document.getElementById("idType").textContent = user.idType || "N/A";
    document.getElementById("validIDNumber").textContent = user.validIDNumber || "N/A";

    currentImage = 0;
    updateIDImage();

    // Fetch and display reviews if the user is a Service Provider
    if (user.isServiceProvider) {
        document.getElementById("reviewSection").style.display = "block";
        fetchServiceProviderReviews(user.uid);
    }
}



// Fetch Service Provider Details (Ratings and Completed Bookings)
async function fetchServiceProviderDetails(uid) {
    const { ratings, totalRating, averageRating } = await fetchServiceProviderRatings(uid);
    const completedBookingsCount = await fetchCompletedBookings(uid);

    document.getElementById("totalRatings").textContent = totalRating.toFixed(2);
    document.getElementById("averageRating").textContent = averageRating.toFixed(2);
    document.getElementById("completedBookings").textContent = completedBookingsCount;

    const ratingsList = document.getElementById("ratingsList");
    ratingsList.innerHTML = ratings.map(rating => `
        <li>${rating.rating} stars - ${rating.review || "No comment"}</li>
    `).join("");

    // Show the ratings and completed bookings sections
    document.getElementById("ratingsSection").style.display = "block";
    document.getElementById("completedBookingsSection").style.display = "block";
}

// Fetch Ratings for Service Providers
async function fetchServiceProviderRatings(serviceProviderId) {
    const ratingsCollection = collection(db, "reviews");
    const q = query(ratingsCollection, where("serviceProviderUid", "==", serviceProviderId));
    const querySnapshot = await getDocs(q);

    const ratings = querySnapshot.docs.map(doc => doc.data());
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0; // ✅ Prevent NaN

    return { ratings, totalRating, averageRating };
}

// Fetch Completed Bookings for Service Providers
async function fetchCompletedBookings(serviceProviderUid) {
    const appointmentsCollection = collection(db, "appointments");
    const q = query(
        appointmentsCollection,
        where("serviceProviderUid", "==", serviceProviderUid),
        where("bookingStatus", "==", "Completed")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
}


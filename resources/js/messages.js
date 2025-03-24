import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, getDoc, doc, orderBy, addDoc, serverTimestamp, setDoc, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHJ025X5bX0-nhwvbq5CTNxCtRyvGYJE4",
  authDomain: "parepair-63325.firebaseapp.com",
  projectId: "parepair-63325",
  storageBucket: "parepair-63325.appspot.com",
  messagingSenderId: "269243614085",
  appId: "1:269243614085:web:af243ba37f8f12f2d1faec"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentChatUserId = null;

// Request notification permission on page load
if (Notification.permission !== "granted") {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      console.log("Notification permission granted.");
    }
  });
}

// Function to display a notification
function showNotification(senderName, message) {
  if (Notification.permission === "granted") {
    new Notification(`New message from ${senderName}`, {
      body: message,
      icon: "resources/images/logo.png", // Optional: Add an icon
    });
  }
}

async function getUserFullName(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data().fullName || "Unknown User" : "Unknown User";
}

async function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();

  if (!message || !currentChatUserId) return;

  try {
    await addDoc(collection(db, "admin_chats"), {
      senderId: currentChatUserId,
      message: message,
      isAdmin: true,
      timestamp: serverTimestamp(),
      read: true, // Admin messages are marked as read by default
    });

    messageInput.value = "";
  } catch (error) {
    console.error("Error sending message: ", error);
    alert("Failed to send message. Please try again.");
  }
}

document.getElementById("send-button").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

async function loadUserList() {
  const userList = document.getElementById("user-list");
  userList.innerHTML = "";

  const chatRef = collection(db, "admin_chats");
  const userMap = new Map(); // Store user data and latest message timestamp

  onSnapshot(chatRef, async (snapshot) => {
    for (const docSnap of snapshot.docChanges()) {
      const data = docSnap.doc.data();

      if (data.senderId) {
        const fullName = await getUserFullName(data.senderId);
        const latestTimestamp = data.timestamp;

        // Update the user's latest message timestamp
        if (!userMap.has(data.senderId) || userMap.get(data.senderId).latestTimestamp < latestTimestamp) {
          userMap.set(data.senderId, {
            fullName: fullName,
            latestTimestamp: latestTimestamp,
          });
        }

        // Send auto-response only once per user
        if (docSnap.type === "added" && data.isAdmin === false) {
          checkAndSendAutoResponse(data.senderId);

          // Show notification if the message is unread
          if (!data.read) {
            showNotification(fullName, data.message);
          }
        }
      }
    }

    // Convert the map to an array and sort by latest message timestamp
    const sortedUsers = Array.from(userMap.entries()).sort((a, b) => {
      return b[1].latestTimestamp - a[1].latestTimestamp; // Descending order
    });

    // Render the sorted user list
    userList.innerHTML = "";
    sortedUsers.forEach(([senderId, userData]) => {
      const li = document.createElement("li");
      li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

      // User name
      const userName = document.createElement("span");
      userName.textContent = userData.fullName;

      // Unread message indicator (red dot)
      const indicator = document.createElement("span");
      indicator.classList.add("badge", "bg-danger", "rounded-pill");
      indicator.textContent = "New";
      indicator.style.display = "none"; // Hide by default

      // Check if the user has unread messages
      const unreadQuery = query(collection(db, "admin_chats"), where("senderId", "==", senderId), where("read", "==", false));
      getDocs(unreadQuery).then((unreadSnapshot) => {
        if (!unreadSnapshot.empty) {
          indicator.style.display = "inline-block"; // Show indicator if there are unread messages
        }
      });

      li.appendChild(userName);
      li.appendChild(indicator);
      li.addEventListener("click", () => openChat(senderId, userData.fullName));
      userList.appendChild(li);
    });
  });
}

function formatTimestamp(timestamp) {
  const date = timestamp.toDate();
  return date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

async function openChat(senderId, fullName) {
  document.getElementById("chat-header").textContent = `Chatting with: ${fullName}`;
  document.getElementById("chat-messages").innerHTML = "";
  currentChatUserId = senderId;

  const chatRef = collection(db, "admin_chats");
  const q = query(chatRef, where("senderId", "==", senderId), orderBy("timestamp", "asc"));

  onSnapshot(q, async (snapshot) => {
    const chatMessages = document.getElementById("chat-messages");
    chatMessages.innerHTML = "";

    snapshot.forEach(async (doc) => {
      const messageData = doc.data();
      const messageContainer = document.createElement("div");
      messageContainer.classList.add("message-container");

      const messageBubble = document.createElement("div");
      messageBubble.classList.add("message-bubble");
      messageBubble.textContent = messageData.message;

      const timestamp = document.createElement("span");
      timestamp.classList.add("timestamp");
      timestamp.textContent = formatTimestamp(messageData.timestamp);

      if (messageData.isAdmin === false) {
        messageContainer.classList.add("user-message");
      } else {
        messageContainer.classList.add("admin-message");
      }

      messageContainer.appendChild(messageBubble);
      messageContainer.appendChild(timestamp);
      chatMessages.appendChild(messageContainer);

      // Mark the message as read when displayed in the chat
      if (!messageData.read && messageData.isAdmin === false) {
        await updateDoc(doc.ref, { read: true });
      }
    });

    // Hide the indicator for this user
    const userListItems = document.querySelectorAll("#user-list li");
    userListItems.forEach((li) => {
      if (li.textContent.includes(fullName)) {
        const indicator = li.querySelector(".badge");
        if (indicator) {
          indicator.style.display = "none";
        }
      }
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

async function checkAndSendAutoResponse(userId) {
  const autoResponseRef = doc(db, "admin_chats", `auto_${userId}`);
  const autoResponseSnap = await getDoc(autoResponseRef);

  if (!autoResponseSnap.exists()) {
    const fullName = await getUserFullName(userId);
    const autoMessage = `Hi ${fullName}, thanks for reaching out! Our team will get back to you soon.`;

    await setDoc(autoResponseRef, { hasAutoResponse: true });

    await addDoc(collection(db, "admin_chats"), {
      senderId: userId,
      message: autoMessage,
      isAdmin: true,
      timestamp: serverTimestamp(),
      read: true, // Auto-response is marked as read by default
    });
  }
}

document.addEventListener("DOMContentLoaded", loadUserList);

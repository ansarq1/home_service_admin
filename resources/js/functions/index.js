const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError("permission-denied", "Only admins can delete users.");
    }

    try {
        const uid = data.uid;
        await admin.auth().deleteUser(uid);
        await admin.firestore().collection("users").doc(uid).delete();

        return { success: true, message: "User deleted successfully" };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

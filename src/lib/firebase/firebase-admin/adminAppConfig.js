import admin from "firebase-admin"

if (!admin.apps.length) {
	const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)

	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: process.env.NEXT_PUBLIC_FIREBASE_REALTIME_DATABASE_URL,
	})
}

export const firebaseAdminAuth = admin.auth()
export const db = admin.database()

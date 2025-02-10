import fs from "fs"
import { db } from "@/lib/firebase/firebase-admin/adminAppConfig"

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" })
	}

	try {
		const data = req.body

		const snapshot = await db.ref("knits").once("value")
		const knitsData = snapshot.val()

		if (Object.keys(data.updates).length > 0) {
			await db.ref().update(data.updates)
		}

		for (const record of data.newRecords) {
			const { count, material, quality, supplier, price } = record
			const newRecordRef = db.ref("knits").push()
			record.id = newRecordRef.key
			await newRecordRef.set({ count, material, quality, supplier, price })
		}

		// upload to storage bucket

		fs.unlinkSync(data.tempFilePath)

		return res.status(200).json({
			message: "File uploaded successfully",
			data,
		})
		// return res.status(200).json({ message: "File uploaded successfully" })
	} catch (error) {
		console.log(error)

		return res.status(500).json({ message: error.message })
	}
}

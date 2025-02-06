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

		// let updates = {}
		// let newRecords = []

		// for (const row of results) {
		// 	const { count, material, quality, supplier, price } = row
		// 	let recordFound = false

		// 	// verify if all the feilds are filled, if not, return error and stop the loop
		// 	if (!count || !material || !quality || !supplier || !price) {
		// 		fs.unlinkSync(tempFilePath)
		// 		return res
		// 			.status(400)
		// 			.json({ message: "Please fill all the fields", data: row })
		// 	}

		// 	Object.entries(knitsData).forEach(([id, data]) => {
		// 		if (
		// 			data.count === count &&
		// 			data.material === material &&
		// 			data.quality === quality &&
		// 			data.supplier === supplier
		// 		) {
		// 			recordFound = true
		// 			if (data.price !== price) {
		// 				updates[`knits/${id}/price`] = price
		// 			}
		// 		}
		// 	})

		// 	if (!recordFound) {
		// 		const newRecordRef = db.ref("knits").push()

		// 		newRecordRef.set({ count, material, quality, supplier, price })
		// 	}
		// }

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

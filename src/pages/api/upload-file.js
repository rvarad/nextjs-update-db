import path from "path"
import fs from "fs"
import csvParser from "csv-parser"
import { db } from "@/lib/firebase/firebase-admin/adminAppConfig"

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" })
	}

	try {
		const chunks = []

		for await (const chunk of req) {
			// console.log("chunk : ", chunk)
			chunks.push(chunk)
		}

		// console.log("Chunks : ", chunks)

		const buffer = Buffer.concat(chunks)
		console.log("buffer : ", buffer)
		const tempFilePath = path.join(process.cwd(), "public", "tempKnits.csv")

		fs.writeFileSync(tempFilePath, buffer)

		const results = []

		fs.createReadStream(tempFilePath)
			.pipe(csvParser())
			.on("data", (row) => {
				results.push(row)
				// console.log("row : ", row)
			})
			.on("end", async () => {
				const snapshot = await db.ref("knits").once("value")
				const knitsData = snapshot.val()

				console.log("knitsData: ", knitsData)

				let updates = {}
				let newRecords = []

				for (const row of results) {
					const { count, material, quality, supplier, price } = row
					let recordFound = false

					// verify if all the feilds are filled, if not return error and stop the loop
					if (!count || !material || !quality || !supplier || !price) {
						fs.unlinkSync(tempFilePath)
						return res
							.status(400)
							.json({ message: "Please fill all the fields", data: row })
					}

					Object.entries(knitsData).forEach(([id, data]) => {
						if (
							data.count === count &&
							data.material === material &&
							data.quality === quality &&
							data.supplier === supplier
						) {
							recordFound = true
							if (data.price !== price) {
								updates[`knits/${id}/price`] = price
							}
							console.log("record found: ", data)
						}
					})

					if (!recordFound) {
						console.log("no record found: ", row)
						const newRecordRef = db.ref("knits").push()
						newRecords.push({
							id: newRecordRef.key,
							count,
							material,
							quality,
							supplier,
							price,
						})
						newRecordRef.set({ count, material, quality, supplier, price })
					}
				}

				if (Object.keys(updates).length > 0) {
					await db.ref().update(updates)
				}

				// console.log("results : ", results)

				// upload to storage bucket

				fs.unlinkSync(tempFilePath)

				return res.status(200).json({
					message: "File uploaded successfully",
					data: { newRecords, updates },
				})
			})
		// return res.status(200).json({ message: "File uploaded successfully" })
	} catch (error) {
		console.log(error)

		return res.status(500).json({ message: error.message })
	}
}

export const config = {
	api: {
		bodyParser: false,
	},
}

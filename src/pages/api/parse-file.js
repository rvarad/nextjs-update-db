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
		// console.log("buffer : ", buffer)
		const tempFilePath = path.join(
			process.cwd(),
			"public",
			"orgId_timeStamp_knits.csv"
		)

		fs.writeFileSync(tempFilePath, buffer)

		const results = []
		const uniqueResults = new Set()

		fs.createReadStream(tempFilePath)
			.pipe(csvParser())
			.on("data", (row) => {
				console.log("row : ", row)
				const uniqueRow = row
				delete uniqueRow["si no"]
				const stringifiedRow = JSON.stringify(uniqueRow)
				if (!uniqueResults.has(stringifiedRow)) {
					uniqueResults.add(stringifiedRow)
					results.push(row)
				}
			})
			.on("end", async () => {
				const snapshot = await db.ref("knits").once("value")
				const knitsData = snapshot.val()

				let updates = {}
				let newRecords = []

				for (const row of results) {
					const { count, material, quality, supplier, price } = row
					let recordFound = false

					// verify if all the feilds are filled, if not, return error and stop the loop
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
						}
					})

					if (!recordFound) {
						newRecords.push({
							count,
							material,
							quality,
							supplier,
							price,
						})
					}
				}
				return res.status(200).json({
					message: "File uploaded successfully",
					data: { newRecords, updates, tempFilePath },
				})
			})
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

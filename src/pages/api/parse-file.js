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
		const uniqueResults = new Map()
		const duplicateResults = []
		const erronousResults = []
		const emptyResults = []
		// Evauluation pre firebase:
		// 1) remove duplicates, but store the original record
		// 2) check if all records are unique, if not, highlight the erronous ones
		// 3) store the duplicates in a new obj.
		// 4) newly added
		// 5) updated
		// 6) Ones with the error.(only show these back to the user).

		// all error checks are done: then store the data under (knits/tempData/userId)

		fs.createReadStream(tempFilePath)
			.pipe(csvParser())
			.on("data", (row) => {
				// console.log("row : ", row)
				// const uniqueRow = row
				// delete uniqueRow["si no"]
				// const stringifiedRow = JSON.stringify(uniqueRow)
				// if (!uniqueResults.has(stringifiedRow)) {
				// 	uniqueResults.add(stringifiedRow)
				// 	results.push(row)
				// }

				if (
					!row.count ||
					!row.material ||
					!row.quality ||
					!row.supplier ||
					!row.price
				) {
					emptyResults.push(row)
				} else {
					const uniqueRow = { ...row }
					delete uniqueRow["si no"]
					const searchKey = `${uniqueRow.count}_${uniqueRow.material}_${uniqueRow.quality}_${uniqueRow.supplier}`

					if (uniqueResults.has(searchKey)) {
						if (uniqueResults.get(searchKey) === row["price"]) {
							duplicateResults.push(row)
						} else {
							erronousResults.push(row)
						}
					} else {
						uniqueResults.set(searchKey, row["price"])
						results.push(row)
					}
				}
			})
			.on("end", async () => {
				if (
					emptyResults.length > 0 ||
					erronousResults.length > 0 ||
					duplicateResults.length > 0
				) {
					fs.unlinkSync(tempFilePath)
					return res.status(400).json({
						message: "file contains errors",
						data: {
							duplicateResults,
							erronousResults,
							emptyResults,
						},
					})
				}

				const snapshot = await db.ref("knits").once("value")
				const knitsData = snapshot.val()

				let updates = {}
				let newRecords = []

				for (const row of results) {
					const { count, material, quality, supplier, price } = row
					let recordFound = false

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
							// serchKey: `${count}_${material}_${quality}_${supplier}`,
						})
					}
				}

				await db.ref(`knits/tempData/userId`).set({ updates, newRecords })

				// TODO: upload file to storage bucket

				fs.unlinkSync(tempFilePath)

				return res.status(200).json({
					message: "File uploaded successfully",
					data: { newRecords, updates },
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

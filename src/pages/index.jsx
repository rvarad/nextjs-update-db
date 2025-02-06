import { useState } from "react"

export default function Home() {
	const [file, setFile] = useState(null)
	const [data, setData] = useState(null)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)

	function handleFileChange(e) {
		setFile(e.target.files[0])
	}

	async function handleFileUpload() {
		if (!file) {
			console.log("No file")
			setError("Please select a file")
			return
		}

		setLoading(true)
		setError("")

		try {
			const response = await fetch("/api/upload-file", {
				method: "POST",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			})

			const result = await response.json()
			console.log(result.data["newRecords"])
			setData(result.data)
		} catch (error) {
			console.log("error", error)
			setError(error.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div>
			<div>
				<h3>Upload file</h3>
				<input
					type="file"
					accept=".csv"
					onChange={handleFileChange}
				/>
				<button
					onClick={handleFileUpload}
					disabled={loading}
				>
					{loading ? "Uploading..." : "Upload"}
				</button>
				{error && <p>Error: {error}</p>}
			</div>
			<div>
				<h3>knits</h3>
				<p>{JSON.stringify(data)}</p>
			</div>
		</div>
	)
}

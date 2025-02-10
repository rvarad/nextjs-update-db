import { useState } from "react"

export default function Home() {
	const [file, setFile] = useState(null)
	const [data, setData] = useState(null)
	const [parsedData, setParsedData] = useState(null)
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
				body: JSON.stringify(parsedData),
				headers: {
					"Content-Type": "application/json",
				},
			})

			const result = await response.json()
			console.log(result)
			setParsedData(null)
			setData(result.data)
			setFile(null)
		} catch (error) {
			console.log("error", error)
			setError(error.message)
		} finally {
			setLoading(false)
		}
	}

	async function handleFileParsing() {
		if (!file) {
			console.log("No file")
			setError("Please select a file")
			return
		}

		setLoading(true)
		setError("")

		try {
			const response = await fetch("/api/parse-file", {
				method: "POST",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			})

			const result = await response.json()
			console.log(result.data)
			setParsedData(result)
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
					onClick={handleFileParsing}
					disabled={loading}
				>
					{loading ? "Parsing..." : "Parse"}
				</button>
				{error && <p>Error: {error}</p>}
			</div>
			<div>
				<h3>knits</h3>
				<p>Already Existing knits</p>
				<p>Data: {JSON.stringify(data)}</p>
				{/* Fetch the data and display it here */}
			</div>
			{/* Below part can be extracted into a separate component(that's my personal preference) */}
			{parsedData && (
				<div>
					<h3>Confirm your input data</h3>
					<p>
						{/* <em>New Records: </em> {JSON.stringify(data["newRecords"])}
					</p>
					<p>
						<em>Updates: </em> {JSON.stringify(data["updates"])} */}
						<span>Message: {JSON.stringify(parsedData.message)}</span>
						Parsed Data: {JSON.stringify(parsedData.data)}
						{/* Parsed Data: {JSON.stringify(parsedData)} */}
					</p>
					<div>
						<button
							onClick={handleFileUpload}
							disabled={loading}
						>
							{loading ? "Uploading..." : "Upload"}
						</button>
						<button
							onClick={() => {
								setParsedData(null)
								// TODO: fs.unlink the temp file
							}}
						>
							Cancel
						</button>
						{error && <p>Error: {error}</p>}
					</div>
				</div>
			)}
		</div>
	)
}

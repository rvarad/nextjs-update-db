import { useState } from "react"

function ParsedCSV({ data, handleFileUpload }) {
	// const [parsedData, setParsedData] = useState(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	return (
		<div>
			<h3>Confirm your input data</h3>
			<p>
				{/* <em>New Records: </em> {JSON.stringify(data["newRecords"])}
					</p>
					<p>
						<em>Updates: </em> {JSON.stringify(data["updates"])} */}
				<span>Message: {JSON.stringify(data.message)}</span>
				<span>Parsed Data: {JSON.stringify(data.data)}</span>
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
						// TODO: remove the file from the storage bucket
					}}
				>
					Cancel
				</button>
				{error && <p>Error: {error}</p>}
			</div>
		</div>
	)
}

export default ParsedCSV

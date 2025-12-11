<script lang="ts">
	const createInvoiceExample = `// Create an invoice
const response = await fetch('https://txid.cc/api/invoices', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    blockchain: 'solana',
    coin: 'solana',
    amount: 0.1
  })
});

const data = await response.json();
console.log(data.invoice.wallet_address); // Payment wallet address
console.log(data.invoice.invoice_id); // Invoice ID`;

	const curlExample = `curl -X POST https://txid.cc/api/invoices \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"blockchain":"solana","coin":"solana","amount":0.1}'`;

	const responseExample = `{
  "success": true,
  "invoice": {
    "id": 123,
    "invoice_id": "abc123xyz",
    "blockchain": "solana",
    "coin": "solana",
    "amount": 0.1,
    "amount_paid": 0,
    "status": "unpaid",
    "wallet_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}`;

	const errorExample = `{
  "error": "Invalid API key"
}`;
</script>

<svelte:head>
	<title>API Documentation - txid.cc</title>
	<meta name="description" content="Complete API documentation for txid.cc payment processing" />
</svelte:head>

<div class="docs-page">
	<nav class="navbar">
		<div class="nav-container">
			<div class="logo">
				<a href="/">
					<h1>txid.cc</h1>
				</a>
			</div>
			<div class="nav-links">
				<a href="/" class="nav-link">Home</a>
				<a href="/docs" class="nav-link active">Docs</a>
				<a href="/login" class="nav-link">Login</a>
				<a href="/register" class="nav-link nav-button">Register</a>
			</div>
		</div>
	</nav>

	<div class="docs-container">
		<div class="docs-sidebar">
			<h3>Quick Links</h3>
			<ul class="sidebar-nav">
				<li><a href="#authentication">Authentication</a></li>
				<li><a href="#create-invoice">Create Invoice</a></li>
				<li><a href="#complete-invoice">Complete Invoice</a></li>
				<li><a href="#responses">Responses</a></li>
				<li><a href="#errors">Errors</a></li>
				<li><a href="#examples">Examples</a></li>
			</ul>
		</div>

		<div class="docs-content">
			<div class="docs-header">
				<h1>API Documentation</h1>
				<p>Complete guide to integrating txid.cc payment processing</p>
			</div>

			<section id="authentication" class="docs-section">
				<h2>Authentication</h2>
				<p>All API requests require authentication using a Bearer token in the Authorization header.</p>
				<p>Get your API key from your <a href="/dashboard">dashboard</a> after registering.</p>
				<div class="code-box">
					<div class="code-header">
						<span class="code-lang">HTTP Header</span>
					</div>
					<pre class="code-content"><code>Authorization: Bearer YOUR_API_KEY</code></pre>
				</div>
			</section>

			<section id="create-invoice" class="docs-section">
				<h2>Create Invoice</h2>
				<p>Create a new payment invoice. The system will automatically generate a temporary Solana wallet for receiving payments.</p>
				
				<h3>Endpoint</h3>
				<div class="endpoint-box">
					<span class="method post">POST</span>
					<span class="url">/api/invoices</span>
				</div>

				<h3>Request Body</h3>
				<div class="params-table">
					<table>
						<thead>
							<tr>
								<th>Field</th>
								<th>Type</th>
								<th>Required</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>blockchain</code></td>
								<td>string</td>
								<td>Yes</td>
								<td>Must be "solana"</td>
							</tr>
							<tr>
								<td><code>coin</code></td>
								<td>string</td>
								<td>Yes</td>
								<td>Must be "solana"</td>
							</tr>
							<tr>
								<td><code>amount</code></td>
								<td>number</td>
								<td>Yes</td>
								<td>Amount in SOL (e.g., 0.1)</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h3>Response</h3>
				<div class="code-box">
					<div class="code-header">
						<span class="code-lang">JSON</span>
					</div>
					<pre class="code-content"><code>{responseExample}</code></pre>
				</div>

				<h3>Response Fields</h3>
				<div class="params-table">
					<table>
						<thead>
							<tr>
								<th>Field</th>
								<th>Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>success</code></td>
								<td>boolean</td>
								<td>Whether the request was successful</td>
							</tr>
							<tr>
								<td><code>invoice.id</code></td>
								<td>number</td>
								<td>Internal invoice ID</td>
							</tr>
							<tr>
								<td><code>invoice.invoice_id</code></td>
								<td>string</td>
								<td>Unique 10-character invoice identifier</td>
							</tr>
							<tr>
								<td><code>invoice.wallet_address</code></td>
								<td>string</td>
								<td>Solana wallet address to send payment to</td>
							</tr>
							<tr>
								<td><code>invoice.amount</code></td>
								<td>number</td>
								<td>Invoice amount in SOL</td>
							</tr>
							<tr>
								<td><code>invoice.status</code></td>
								<td>string</td>
								<td>Invoice status: "unpaid", "partial", or "completed"</td>
							</tr>
							<tr>
								<td><code>invoice.created_at</code></td>
								<td>string</td>
								<td>ISO 8601 timestamp</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section id="complete-invoice" class="docs-section">
				<h2>Complete Invoice</h2>
				<p>Manually mark an invoice as complete. Note: Invoices are automatically updated when payments are detected.</p>
				
				<h3>Endpoint</h3>
				<div class="endpoint-box">
					<span class="method post">POST</span>
					<span class="url">/api/invoices/[invoice_id]/complete</span>
				</div>

				<h3>Request Body</h3>
				<div class="params-table">
					<table>
						<thead>
							<tr>
								<th>Field</th>
								<th>Type</th>
								<th>Required</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>amount_paid</code></td>
								<td>number</td>
								<td>Yes</td>
								<td>Amount paid in SOL</td>
							</tr>
							<tr>
								<td><code>txid</code></td>
								<td>string</td>
								<td>Yes</td>
								<td>Solana transaction ID</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section id="responses" class="docs-section">
				<h2>Response Format</h2>
				<p>All successful responses return JSON with a <code>success: true</code> field and relevant data.</p>
				<div class="code-box">
					<div class="code-header">
						<span class="code-lang">JSON</span>
					</div>
					<pre class="code-content"><code>{responseExample}</code></pre>
				</div>
			</section>

			<section id="errors" class="docs-section">
				<h2>Error Handling</h2>
				<p>Errors are returned with appropriate HTTP status codes and error messages.</p>
				
				<h3>Status Codes</h3>
				<div class="params-table">
					<table>
						<thead>
							<tr>
								<th>Code</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>400</code></td>
								<td>Bad Request - Invalid parameters</td>
							</tr>
							<tr>
								<td><code>401</code></td>
								<td>Unauthorized - Invalid or missing API key</td>
							</tr>
							<tr>
								<td><code>500</code></td>
								<td>Internal Server Error</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h3>Error Response Format</h3>
				<div class="code-box">
					<div class="code-header">
						<span class="code-lang">JSON</span>
					</div>
					<pre class="code-content"><code>{errorExample}</code></pre>
				</div>
			</section>

			<section id="examples" class="docs-section">
				<h2>Code Examples</h2>
				
				<h3>JavaScript/TypeScript</h3>
				<div class="code-box">
					<div class="code-header">
						<span class="code-lang">JavaScript</span>
					</div>
					<pre class="code-content"><code>{createInvoiceExample}</code></pre>
				</div>

				<h3>cURL</h3>
				<div class="code-box">
					<div class="code-header">
						<span class="code-lang">Bash</span>
					</div>
					<pre class="code-content"><code>{curlExample}</code></pre>
				</div>
			</section>

			<section class="docs-section">
				<h2>Payment Monitoring</h2>
				<p>When you create an invoice, the system automatically:</p>
				<ul>
					<li>Generates a unique Solana wallet for receiving payments</li>
					<li>Monitors the wallet for incoming transactions</li>
					<li>Updates invoice status automatically (unpaid → partial → completed)</li>
					<li>Distributes funds when complete (95% to your wallet, 5% fee)</li>
				</ul>
				<p>Make sure to set your Solana wallet address in your <a href="/dashboard">dashboard</a> to receive payments.</p>
			</section>

			<section class="docs-section">
				<h2>Invoice Status</h2>
				<div class="params-table">
					<table>
						<thead>
							<tr>
								<th>Status</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>unpaid</code></td>
								<td>No payment received yet</td>
							</tr>
							<tr>
								<td><code>partial</code></td>
								<td>Partial payment received (less than invoice amount)</td>
							</tr>
							<tr>
								<td><code>completed</code></td>
								<td>Full payment received and processed</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.docs-page {
		min-height: 100vh;
		background: #ffffff;
	}

	.navbar {
		background: #ffffff;
		border-bottom: 1px solid #e0e0e0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		padding: 1rem 0;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.nav-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo a {
		text-decoration: none;
	}

	.logo h1 {
		font-size: 1.8rem;
		color: #003afa;
		margin: 0;
		font-weight: 600;
	}

	.nav-links {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.nav-link {
		color: #666;
		text-decoration: none;
		padding: 0.5rem 1rem;
		transition: color 0.2s;
		font-weight: 500;
	}

	.nav-link:hover {
		color: #003afa;
	}

	.nav-link.active {
		color: #003afa;
		border-bottom: 2px solid #003afa;
	}

	.nav-button {
		background: #003afa;
		border: 1px solid #003afa;
		border-radius: 6px;
		color: #fff;
		cursor: pointer;
		transition: all 0.2s;
		padding: 0.5rem 1rem;
		font-weight: 500;
	}

	.nav-button:hover {
		background: #0028cc;
		border-color: #0028cc;
	}

	.docs-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		display: grid;
		grid-template-columns: 250px 1fr;
		gap: 3rem;
	}

	.docs-sidebar {
		position: sticky;
		top: 100px;
		height: fit-content;
	}

	.docs-sidebar h3 {
		font-size: 1rem;
		color: #1a1a1a;
		margin: 0 0 1rem 0;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.sidebar-nav {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.sidebar-nav li {
		margin-bottom: 0.5rem;
	}

	.sidebar-nav a {
		color: #666;
		text-decoration: none;
		font-size: 0.9rem;
		padding: 0.5rem;
		display: block;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.sidebar-nav a:hover {
		background: #f8f9fa;
		color: #003afa;
	}

	.docs-content {
		max-width: 800px;
	}

	.docs-header {
		margin-bottom: 3rem;
	}

	.docs-header h1 {
		font-size: 3rem;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
		font-weight: 700;
	}

	.docs-header p {
		font-size: 1.2rem;
		color: #666;
		margin: 0;
	}

	.docs-section {
		margin-bottom: 4rem;
		scroll-margin-top: 100px;
	}

	.docs-section h2 {
		font-size: 2rem;
		color: #1a1a1a;
		margin: 0 0 1rem 0;
		font-weight: 700;
		border-bottom: 2px solid #e0e0e0;
		padding-bottom: 0.5rem;
	}

	.docs-section h3 {
		font-size: 1.3rem;
		color: #1a1a1a;
		margin: 2rem 0 1rem 0;
		font-weight: 600;
	}

	.docs-section p {
		color: #666;
		line-height: 1.8;
		margin-bottom: 1rem;
	}

	.docs-section ul {
		color: #666;
		line-height: 1.8;
		margin-left: 1.5rem;
	}

	.docs-section a {
		color: #003afa;
		text-decoration: none;
	}

	.docs-section a:hover {
		text-decoration: underline;
	}

	.endpoint-box {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 1rem 0;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 6px;
	}

	.method {
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.85rem;
		text-transform: uppercase;
	}

	.method.post {
		background: #28a745;
		color: #fff;
	}

	.url {
		font-family: 'Fira Mono', monospace;
		font-size: 0.9rem;
		color: #333;
	}

	.code-box {
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		margin: 1rem 0;
	}

	.code-header {
		background: #2d2d2d;
		border-bottom: 1px solid #333;
		padding: 0.75rem 1.5rem;
		display: flex;
		align-items: center;
	}

	.code-lang {
		color: #4a9eff;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.code-content {
		margin: 0;
		padding: 1.5rem;
		overflow-x: auto;
		background: #1a1a1a;
	}

	.code-content code {
		font-family: 'Fira Mono', monospace;
		font-size: 0.9rem;
		color: #4a9eff;
		line-height: 1.6;
		white-space: pre;
	}

	.params-table {
		margin: 1.5rem 0;
		overflow-x: auto;
	}

	.params-table table {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		overflow: hidden;
	}

	.params-table thead {
		background: #f8f9fa;
	}

	.params-table th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: #1a1a1a;
		border-bottom: 2px solid #e0e0e0;
	}

	.params-table td {
		padding: 1rem;
		border-bottom: 1px solid #e0e0e0;
		color: #666;
	}

	.params-table tbody tr:last-child td {
		border-bottom: none;
	}

	.params-table code {
		background: #f8f9fa;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Fira Mono', monospace;
		font-size: 0.85rem;
		color: #003afa;
	}

	@media (max-width: 1024px) {
		.docs-container {
			grid-template-columns: 1fr;
		}

		.docs-sidebar {
			position: static;
			margin-bottom: 2rem;
		}

		.sidebar-nav {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}

	@media (max-width: 768px) {
		.docs-header h1 {
			font-size: 2rem;
		}

		.docs-section h2 {
			font-size: 1.5rem;
		}
	}
</style>


<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let activeTab = $state<'overview' | 'invoices' | 'settings'>('overview');
	let userData = $state<any>(null);
	let invoices = $state<any[]>([]);
	let loading = $state(true);
	let error = $state('');
	
	let allInvoices = $state<any[]>([]);
	let invoicesLoading = $state(false);
	let currentPage = $state(1);
	let totalPages = $state(1);
	const invoicesPerPage = 10;
	let expandedInvoice = $state<string | null>(null);
	
	let walletInput = $state('');
	let updatingWallet = $state(false);
	let walletError = $state('');
	let walletSuccess = $state(false);
	
	let apiKeyCopied = $state(false);
	let showApiKey = $state(false);
	
	onMount(async () => {
		try {
			const response = await fetch('/dashboard');
			if (!response.ok) {
				if (response.status === 302 || response.redirected) {
					goto('/');
					return;
				}
				throw new Error('Failed to load dashboard');
			}
			const data = await response.json();
			userData = data.user;
			invoices = data.invoices || [];
			walletInput = userData.solana_wallet || '';
			loading = false;
		} catch (err) {
			error = 'Failed to load dashboard data';
			loading = false;
		}
	});
	
	function getStatusColor(status: string): string {
		switch(status) {
			case 'completed': return '#28a745';
			case 'partial': return '#ffc107';
			case 'unpaid': return '#dc3545';
			default: return '#6c757d';
		}
	}
	
	function formatDate(dateString: string): string {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
	
	function formatWalletAddress(wallet: string | null): string {
		if (!wallet) {
			return 'Not Set';
		}
		if (wallet.length <= 7) {
			return wallet;
		}
		return `${wallet.substring(0, 3)}...${wallet.substring(wallet.length - 4)}`;
	}

	async function copyApiKey() {
		if (!userData?.api_key) return;
		
		try {
			await navigator.clipboard.writeText(userData.api_key);
			apiKeyCopied = true;
			setTimeout(() => {
				apiKeyCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	async function updateWallet() {
		walletError = '';
		walletSuccess = false;
		updatingWallet = true;
		
		try {
			const response = await fetch('/dashboard/update-wallet', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ wallet: walletInput || null })
			});
			
			if (!response.ok) {
				const data = await response.json();
				walletError = data.error || 'Failed to update wallet';
				updatingWallet = false;
				return;
			}
			
			const data = await response.json();
			walletSuccess = true;
			if (userData) {
				userData.solana_wallet = walletInput || null;
			}
			updatingWallet = false;
			
			setTimeout(() => {
				walletSuccess = false;
			}, 3000);
		} catch (err) {
			walletError = 'Network error. Please try again.';
			updatingWallet = false;
		}
	}

	async function loadInvoices(page: number = 1) {
		invoicesLoading = true;
		try {
			const offset = (page - 1) * invoicesPerPage;
			const response = await fetch(`/dashboard/invoices?limit=${invoicesPerPage}&offset=${offset}`);
			if (!response.ok) {
				throw new Error('Failed to load invoices');
			}
			const data = await response.json();
			allInvoices = data.invoices || [];
			totalPages = Math.ceil((data.total || 0) / invoicesPerPage);
			currentPage = page;
		} catch (err) {
			console.error('Error loading invoices:', err);
		} finally {
			invoicesLoading = false;
		}
	}

	$effect(() => {
		if (activeTab === 'invoices' && !invoicesLoading && allInvoices.length === 0) {
			loadInvoices(1);
		}
	});
</script>

<svelte:head>
	<title>Dashboard - txid.cc</title>
</svelte:head>

<div class="dashboard">
	<!-- Navigation -->
	<nav class="navbar">
		<div class="nav-container">
			<div class="logo">
				<h1>txid.cc</h1>
			</div>
			<div class="nav-links">
				<a href="/" class="nav-link">Home</a>
				<a href="/dashboard" class="nav-link active">Dashboard</a>
				<a href="/login" class="nav-link">Logout</a>
			</div>
		</div>
	</nav>

	<div class="dashboard-content">
		<!-- Header -->
		<div class="dashboard-header">
			<h1 class="dashboard-title">Dashboard</h1>
			<p class="dashboard-subtitle">
				{#if loading}
					Loading...
				{:else if userData}
					Welcome back, {userData.username}!
				{:else}
					Welcome back!
				{/if}
			</p>
		</div>

		{#if loading}
			<div class="loading-message">Loading dashboard...</div>
		{:else if error}
			<div class="error-message">{error}</div>
		{:else if userData}
			<!-- Tabs -->
			<div class="tabs">
				<button 
					class="tab-button {activeTab === 'overview' ? 'active' : ''}"
					onclick={() => activeTab = 'overview'}
				>
					Overview
				</button>
				<button 
					class="tab-button {activeTab === 'invoices' ? 'active' : ''}"
					onclick={() => { activeTab = 'invoices'; if (allInvoices.length === 0) loadInvoices(1); }}
				>
					Invoices
				</button>
				<button 
					class="tab-button {activeTab === 'settings' ? 'active' : ''}"
					onclick={() => activeTab = 'settings'}
				>
					Account Settings
				</button>
			</div>

			{#if activeTab === 'overview'}
				<!-- Stats Grid -->
				<div class="stats-grid">
					<div class="stat-box">
						<div class="stat-icon">💰</div>
						<div class="stat-info">
							<h3>Total Made</h3>
							<p class="stat-value">{userData.total_made.toLocaleString()} SOL</p>
						</div>
					</div>
					<div class="stat-box">
						<div class="stat-icon">📊</div>
						<div class="stat-info">
							<h3>Total Payments</h3>
							<p class="stat-value">{userData.total_payments.toLocaleString()}</p>
						</div>
					</div>
					<div class="stat-box">
						<div class="stat-icon">🔑</div>
						<div class="stat-info">
							<h3>Solana Wallet</h3>
							<p class="stat-value">{formatWalletAddress(userData.solana_wallet)}</p>
						</div>
					</div>
				</div>

				<!-- Recent Transactions -->
				<div class="section-box">
					<div class="section-header">
						<h2>Recent Transactions</h2>
					</div>
					{#if invoices.length === 0}
						<div class="empty-state">
							<p>No invoices yet. Invoices will appear here once you start creating them.</p>
						</div>
					{:else}
						<div class="table-container">
							<table class="transactions-table">
								<thead>
									<tr>
										<th>Invoice ID</th>
										<th>Amount</th>
										<th>Amount Paid</th>
										<th>Status</th>
										<th>Created</th>
									</tr>
								</thead>
								<tbody>
									{#each invoices as invoice}
										<tr>
											<td class="tx-id">{invoice.invoice_id}</td>
											<td class="tx-amount">{invoice.amount} {invoice.coin}</td>
											<td class="tx-amount">{invoice.amount_paid} {invoice.coin}</td>
											<td>
												<span 
													class="status-badge" 
													style="background-color: {getStatusColor(invoice.status)}"
												>
													{invoice.status}
												</span>
											</td>
											<td class="tx-date">{formatDate(invoice.created_at)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'invoices'}
				<div class="section-box">
					<div class="section-header">
						<h2>All Invoices</h2>
					</div>
					{#if invoicesLoading}
						<div class="loading-message">Loading invoices...</div>
					{:else if allInvoices.length === 0}
						<div class="empty-state">
							<p>No invoices found.</p>
						</div>
					{:else}
						<div class="table-container">
							<table class="transactions-table">
								<thead>
									<tr>
										<th>Invoice ID</th>
										<th>Amount</th>
										<th>Amount Paid</th>
										<th>Status</th>
										<th>Created</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{#each allInvoices as invoice}
										<tr>
											<td class="tx-id">{invoice.invoice_id}</td>
											<td class="tx-amount">{invoice.amount.toFixed(8)} {invoice.coin.toUpperCase()}</td>
											<td class="tx-amount">{invoice.amount_paid.toFixed(8)} {invoice.coin.toUpperCase()}</td>
											<td>
												<span 
													class="status-badge" 
													style="background-color: {getStatusColor(invoice.status)}"
												>
													{invoice.status}
												</span>
											</td>
											<td class="tx-date">{formatDate(invoice.created_at)}</td>
											<td>
												<button 
													class="btn btn-small btn-primary"
													onclick={() => expandedInvoice = expandedInvoice === invoice.invoice_id ? null : invoice.invoice_id}
												>
													{expandedInvoice === invoice.invoice_id ? 'Hide TXs' : 'View TXs'}
												</button>
											</td>
										</tr>
										{#if expandedInvoice === invoice.invoice_id}
											<tr class="expanded-row">
												<td colspan="6">
													<div class="invoice-details">
														<div class="detail-section">
															<h4>Wallet Address</h4>
															<p class="detail-value">{invoice.wallet_address || 'N/A'}</p>
														</div>
														<div class="detail-section">
															<h4>Transaction IDs ({invoice.txids?.length || 0})</h4>
															{#if invoice.txids && invoice.txids.length > 0}
																<ul class="tx-list">
																	{#each invoice.txids as txid}
																		<li class="tx-item">{txid}</li>
																	{/each}
																</ul>
															{:else}
																<p class="detail-value">No transactions yet</p>
															{/if}
														</div>
														{#if invoice.completed_at}
															<div class="detail-section">
																<h4>Completed At</h4>
																<p class="detail-value">{formatDate(invoice.completed_at)}</p>
															</div>
														{/if}
													</div>
												</td>
											</tr>
										{/if}
									{/each}
								</tbody>
							</table>
						</div>
						{#if totalPages > 1}
							<div class="pagination">
								<button 
									class="btn btn-small"
									onclick={() => loadInvoices(currentPage - 1)}
									disabled={currentPage === 1 || invoicesLoading}
								>
									Previous
								</button>
								<span class="pagination-info">Page {currentPage} of {totalPages}</span>
								<button 
									class="btn btn-small"
									onclick={() => loadInvoices(currentPage + 1)}
									disabled={currentPage >= totalPages || invoicesLoading}
								>
									Next
								</button>
							</div>
						{/if}
					{/if}
				</div>
			{:else if activeTab === 'settings'}
				<!-- Account Settings -->
				<div class="section-box">
					<h2>Account Details</h2>
					<div class="settings-grid">
						<div class="setting-item">
							<div class="setting-label">Username</div>
							<div class="setting-value">{userData.username}</div>
						</div>
						<div class="setting-item">
							<div class="setting-label">Email</div>
							<div class="setting-value">{userData.email}</div>
						</div>
						<div class="setting-item">
							<div class="setting-label">User ID</div>
							<div class="setting-value">{userData.id}</div>
						</div>
					</div>
				</div>

				<div class="section-box">
					<h2>API Key</h2>
					<div class="api-key-section">
						<div class="api-key-display">
							<div 
								class="api-key-value {showApiKey ? '' : 'blurred'}"
								onclick={copyApiKey}
								role="button"
								tabindex="0"
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyApiKey(); } }}
							>
								{#if userData.api_key}
									{userData.api_key}
								{:else}
									No API key found
								{/if}
							</div>
							<button 
								class="btn btn-small"
								type="button"
								onclick={() => showApiKey = !showApiKey}
							>
								{showApiKey ? 'Hide' : 'Show'} Key
							</button>
						</div>
						{#if apiKeyCopied}
							<div class="success-message">API key copied to clipboard!</div>
						{/if}
						<p class="api-key-hint">Click on the API key to copy it to your clipboard</p>
					</div>
				</div>

				<div class="section-box">
					<h2>Solana Wallet</h2>
					<div class="wallet-section">
						<div class="input-group">
							<label for="wallet">Solana Wallet Address</label>
							<input
								type="text"
								id="wallet"
								bind:value={walletInput}
								placeholder="Enter your Solana wallet address"
								maxlength="64"
								disabled={updatingWallet}
							/>
							<p class="input-hint">Enter your Solana wallet address (max 64 characters)</p>
						</div>
						
						{#if walletError}
							<div class="error-message">{walletError}</div>
						{/if}
						
						{#if walletSuccess}
							<div class="success-message">Wallet address updated successfully!</div>
						{/if}
						
						<button 
							class="btn btn-primary" 
							type="button"
							onclick={updateWallet}
							disabled={updatingWallet}
						>
							{updatingWallet ? 'Updating...' : 'Update Wallet'}
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.dashboard {
		min-height: 100vh;
		background: #f5f5f5;
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

	.logo h1 {
		font-size: 1.8rem;
		color: #003afa;
		margin: 0;
		font-weight: 600;
	}

	.nav-links {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.nav-link {
		color: #666;
		text-decoration: none;
		padding: 0.5rem 1rem;
		transition: color 0.2s;
		border-bottom: 2px solid transparent;
		font-weight: 500;
	}

	.nav-link:hover {
		color: #003afa;
	}

	.nav-link.active {
		color: #003afa;
		border-bottom-color: #003afa;
	}

	.dashboard-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.dashboard-header {
		margin-bottom: 2rem;
	}

	.dashboard-title {
		font-size: 2.5rem;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
		font-weight: 700;
	}

	.dashboard-subtitle {
		font-size: 1.1rem;
		color: #666;
		margin: 0;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-box {
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.stat-box:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.stat-icon {
		font-size: 3rem;
		line-height: 1;
	}

	.stat-info {
		flex: 1;
	}

	.stat-info h3 {
		font-size: 0.9rem;
		color: #666;
		margin: 0 0 0.5rem 0;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 2rem;
		color: #003afa;
		margin: 0;
		font-weight: 700;
	}

	.section-box {
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		font-size: 1.5rem;
		color: #1a1a1a;
		margin: 0;
		font-weight: 600;
	}

	.table-container {
		overflow-x: auto;
	}

	.transactions-table {
		width: 100%;
		border-collapse: collapse;
	}

	.transactions-table thead {
		background: #f8f9fa;
		border-bottom: 2px solid #e0e0e0;
	}

	.transactions-table th {
		padding: 1rem;
		text-align: left;
		color: #1a1a1a;
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.transactions-table td {
		padding: 1rem;
		color: #333;
		border-bottom: 1px solid #e0e0e0;
	}

	.transactions-table tbody tr:hover {
		background: #f8f9fa;
	}

	.tx-id {
		font-family: 'Fira Mono', monospace;
		color: #003afa;
		font-size: 0.9rem;
	}

	.tx-amount {
		color: #1a1a1a;
		font-weight: 600;
	}

	.tx-date {
		color: #666;
	}

	.status-badge {
		display: inline-block;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		color: #fff;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}

	.api-keys-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.api-key-box {
		background: #f8f9fa;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.5rem;
	}

	.api-key-info {
		flex: 1;
	}

	.api-key-info h3 {
		font-size: 1.1rem;
		color: #003afa;
		margin: 0 0 0.5rem 0;
		font-weight: 600;
	}

	.api-key-value {
		font-family: 'Fira Mono', monospace;
		color: #666;
		margin: 0.5rem 0;
		font-size: 0.9rem;
	}

	.api-key-date {
		color: #999;
		font-size: 0.85rem;
		margin: 0;
	}

	.api-key-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		font-size: 0.9rem;
		padding: 0.6rem 1.2rem;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		color: #333;
		cursor: pointer;
		transition: all 0.2s;
		outline: none;
		background: #ffffff;
		font-weight: 500;
	}

	.btn:hover:not(:disabled) {
		background: #f8f9fa;
		border-color: #d0d0d0;
	}

	.btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.btn-primary {
		background: #003afa;
		color: #ffffff;
		border-color: #003afa;
	}

	.btn-primary:hover:not(:disabled) {
		background: #0028cc;
		border-color: #0028cc;
	}

	.btn-secondary {
		background: #dc3545;
		color: #ffffff;
		border-color: #dc3545;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #c82333;
		border-color: #c82333;
	}

	.btn-small {
		font-size: 0.85rem;
		padding: 0.5rem 1rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid #e0e0e0;
	}

	.tab-button {
		padding: 0.75rem 1.5rem;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: #666;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.2s;
		margin-bottom: -2px;
	}

	.tab-button:hover {
		color: #003afa;
	}

	.tab-button.active {
		color: #003afa;
		border-bottom-color: #003afa;
	}

	.loading-message, .error-message {
		text-align: center;
		padding: 2rem;
		color: #666;
	}

	.error-message {
		color: #dc3545;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: #666;
	}

	.settings-grid {
		display: grid;
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-label {
		font-size: 0.9rem;
		color: #666;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.setting-value {
		font-size: 1.1rem;
		color: #1a1a1a;
		font-weight: 500;
	}

	.api-key-section {
		margin-top: 1rem;
	}

	.api-key-display {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.api-key-value {
		flex: 1;
		font-family: 'Fira Mono', monospace;
		font-size: 0.9rem;
		padding: 0.75rem 1rem;
		background: #f8f9fa;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		color: #333;
		cursor: pointer;
		transition: all 0.2s;
		user-select: none;
		word-break: break-all;
	}

	.api-key-value:hover {
		background: #e9ecef;
		border-color: #003afa;
	}

	.api-key-value.blurred {
		filter: blur(4px);
		user-select: none;
	}

	.api-key-value.blurred:hover {
		filter: blur(3px);
	}

	.api-key-hint {
		font-size: 0.85rem;
		color: #999;
		margin: 0;
		margin-top: 0.5rem;
	}

	.wallet-section {
		margin-top: 1rem;
	}

	.wallet-section .input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.wallet-section .input-group label {
		font-size: 0.9rem;
		color: #333;
		font-weight: 500;
	}

	.wallet-section .input-group input {
		font-size: 1rem;
		padding: 0.75rem;
		background: #ffffff;
		border: 1px solid #d0d0d0;
		border-radius: 6px;
		color: #333;
		outline: none;
		transition: all 0.2s;
		font-family: 'Fira Mono', monospace;
	}

	.wallet-section .input-group input:focus {
		border-color: #003afa;
		box-shadow: 0 0 0 3px rgba(0, 58, 250, 0.1);
	}

	.wallet-section .input-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f8f9fa;
	}

	.input-hint {
		font-size: 0.85rem;
		color: #999;
		margin: 0;
	}

	.success-message {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		border-radius: 6px;
		color: #155724;
		padding: 0.75rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e0e0e0;
	}

	.pagination-info {
		color: #666;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.expanded-row {
		background: #f8f9fa;
	}

	.expanded-row td {
		padding: 0;
		border-bottom: 2px solid #e0e0e0;
	}

	.invoice-details {
		padding: 1.5rem;
	}

	.detail-section {
		margin-bottom: 1.5rem;
	}

	.detail-section:last-child {
		margin-bottom: 0;
	}

	.detail-section h4 {
		font-size: 0.9rem;
		color: #666;
		margin: 0 0 0.5rem 0;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.detail-value {
		font-family: 'Fira Mono', monospace;
		font-size: 0.9rem;
		color: #333;
		margin: 0;
		word-break: break-all;
	}

	.tx-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.tx-item {
		font-family: 'Fira Mono', monospace;
		font-size: 0.85rem;
		color: #003afa;
		padding: 0.5rem;
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		word-break: break-all;
	}

	.tx-item:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		.dashboard-content {
			padding: 1rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.api-key-box {
			flex-direction: column;
			align-items: flex-start;
		}

		.api-key-actions {
			width: 100%;
			justify-content: flex-end;
		}

		.tabs {
			overflow-x: auto;
		}

		.tab-button {
			white-space: nowrap;
		}
	}
</style>
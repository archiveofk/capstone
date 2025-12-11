<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	
	let invoice = $state<any>(null);
	let loading = $state(true);
	let error = $state('');
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	
	async function fetchInvoice() {
		try {
			const invoiceId = $page.params.invoice_id;
			const response = await fetch(`/${invoiceId}`);
			
			if (!response.ok) {
				if (response.status === 404) {
					error = 'Invoice not found';
				} else {
					error = 'Failed to load invoice';
				}
				loading = false;
				return;
			}
			
			const data = await response.json();
			invoice = data.invoice;
			loading = false;
			error = '';
		} catch (err) {
			error = 'Failed to load invoice';
			loading = false;
		}
	}
	
	onMount(() => {
		fetchInvoice();
		
		// Poll every 30 seconds
		pollInterval = setInterval(() => {
			fetchInvoice();
		}, 30000);
	});
	
	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
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
	
	function formatWalletAddress(address: string | null): string {
		if (!address) return 'Not available';
		if (address.length <= 10) return address;
		return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
	}
	
	function getProgressPercentage(): number {
		if (!invoice || invoice.amount === 0) return 0;
		return Math.min((invoice.amount_paid / invoice.amount) * 100, 100);
	}
</script>

<svelte:head>
	<title>{invoice ? `Invoice ${invoice.invoice_id}` : 'Invoice'} - txid.cc</title>
</svelte:head>

<div class="invoice-page">
	<div class="invoice-container">
		{#if loading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Loading invoice...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<h1>Error</h1>
				<p>{error}</p>
			</div>
		{:else if invoice}
			<div class="invoice-header">
				<h1>Invoice #{invoice.invoice_id}</h1>
				<span 
					class="status-badge large" 
					style="background-color: {getStatusColor(invoice.status)}"
				>
					{invoice.status.toUpperCase()}
				</span>
			</div>
			
			<div class="invoice-content">
				<!-- Payment Info -->
				<div class="info-card">
					<h2>Payment Information</h2>
					<div class="info-grid">
						<div class="info-item">
							<label>Amount</label>
							<div class="value large">{invoice.amount} {invoice.coin.toUpperCase()}</div>
						</div>
						<div class="info-item">
							<label>Amount Paid</label>
							<div class="value large">{invoice.amount_paid} {invoice.coin.toUpperCase()}</div>
						</div>
						<div class="info-item">
							<label>Remaining</label>
							<div class="value large">{(invoice.amount - invoice.amount_paid).toFixed(8)} {invoice.coin.toUpperCase()}</div>
						</div>
					</div>
					
					<!-- Progress Bar -->
					<div class="progress-section">
						<div class="progress-bar">
							<div 
								class="progress-fill" 
								style="width: {getProgressPercentage()}%"
							></div>
						</div>
						<p class="progress-text">{getProgressPercentage().toFixed(1)}% paid</p>
					</div>
				</div>
				
				<!-- Wallet Address -->
				{#if invoice.wallet_address}
					<div class="info-card">
						<h2>Send Payment To</h2>
						<div class="wallet-address-box">
							<code class="wallet-address">{invoice.wallet_address}</code>
							<button 
								class="btn btn-small"
								onclick={async () => {
									try {
										await navigator.clipboard.writeText(invoice.wallet_address);
										// Could add a toast notification here
									} catch (err) {
										console.error('Failed to copy:', err);
									}
								}}
							>
								Copy
							</button>
						</div>
						<p class="wallet-hint">Send exactly {invoice.amount} {invoice.coin.toUpperCase()} to this address</p>
					</div>
				{/if}
				
				<!-- Invoice Details -->
				<div class="info-card">
					<h2>Invoice Details</h2>
					<div class="info-grid">
						<div class="info-item">
							<label>Blockchain</label>
							<div class="value">{invoice.blockchain}</div>
						</div>
						<div class="info-item">
							<label>Coin</label>
							<div class="value">{invoice.coin}</div>
						</div>
						<div class="info-item">
							<label>Created</label>
							<div class="value">{formatDate(invoice.created_at)}</div>
						</div>
						{#if invoice.completed_at}
							<div class="info-item">
								<label>Completed</label>
								<div class="value">{formatDate(invoice.completed_at)}</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="auto-refresh-indicator">
				<p>🔄 Auto-refreshing every 30 seconds</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.invoice-page {
		min-height: 100vh;
		background: #f5f5f5;
		padding: 2rem 1rem;
	}
	
	.invoice-container {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.loading-state, .error-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.spinner {
		border: 4px solid #f3f3f3;
		border-top: 4px solid #003afa;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.error-state h1 {
		color: #dc3545;
		margin: 0 0 1rem 0;
	}
	
	.invoice-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		background: #ffffff;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.invoice-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #1a1a1a;
		font-weight: 700;
	}
	
	.status-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		color: #fff;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}
	
	.status-badge.large {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
	}
	
	.invoice-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.info-card {
		background: #ffffff;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.info-card h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.3rem;
		color: #1a1a1a;
		font-weight: 600;
	}
	
	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	
	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.info-item label {
		font-size: 0.85rem;
		color: #666;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.info-item .value {
		font-size: 1.1rem;
		color: #1a1a1a;
		font-weight: 500;
	}
	
	.info-item .value.large {
		font-size: 1.5rem;
		font-weight: 700;
		color: #003afa;
	}
	
	.progress-section {
		margin-top: 1.5rem;
	}
	
	.progress-bar {
		width: 100%;
		height: 12px;
		background: #e0e0e0;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}
	
	.progress-fill {
		height: 100%;
		background: #28a745;
		transition: width 0.3s ease;
	}
	
	.progress-text {
		margin: 0;
		font-size: 0.9rem;
		color: #666;
		text-align: center;
	}
	
	.wallet-address-box {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #e0e0e0;
	}
	
	.wallet-address {
		flex: 1;
		font-family: 'Fira Mono', monospace;
		font-size: 0.9rem;
		color: #333;
		word-break: break-all;
		margin: 0;
	}
	
	.wallet-hint {
		margin: 1rem 0 0 0;
		font-size: 0.9rem;
		color: #666;
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
	
	.btn-small {
		font-size: 0.85rem;
		padding: 0.5rem 1rem;
	}
	
	.auto-refresh-indicator {
		text-align: center;
		margin-top: 2rem;
		padding: 1rem;
		color: #666;
		font-size: 0.85rem;
	}
	
	@media (max-width: 768px) {
		.invoice-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		
		.info-grid {
			grid-template-columns: 1fr;
		}
	}
</style>





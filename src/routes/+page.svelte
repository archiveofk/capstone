<script lang="ts">
	import { goto } from '$app/navigation';
	
	const codeExample = `// Create an invoice
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

const invoice = await response.json();
console.log(invoice.invoice.wallet_address); // Payment wallet address
console.log(invoice.invoice.invoice_id); // Invoice ID
console.log(invoice.invoice.status); // Invoice status`;
</script>

<svelte:head>
	<title>txid.cc - Crypto Payment Processor for Developers</title>
	<meta name="description" content="Simple crypto payment processing API for developers. Built for Solana." />
</svelte:head>

<div class="homepage">
	<!-- Navigation -->
	<nav class="navbar">
		<div class="nav-container">
			<div class="logo">
				<h1>txid.cc</h1>
			</div>
			<div class="nav-links">
				<a href="/login" class="nav-link">Login</a>
				<a href="/register" class="nav-link nav-button">Register</a>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1 class="hero-title">Crypto Payments Made Simple</h1>
			<p class="hero-subtitle">The developer-friendly payment processor for Solana</p>
			<div class="hero-buttons">
				<button class="btn btn-primary" onclick={() => goto('/register')}>
					Get Started
				</button>
				<button class="btn btn-secondary" onclick={() => goto('/login')}>
					Login
				</button>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="features">
		<div class="container">
			<h2 class="section-title">Built for Developers</h2>
			<div class="features-grid">
				<div class="feature-box">
					<div class="feature-icon">⚡</div>
					<h3>Lightning Fast</h3>
					<p>Process Solana payments in seconds with our optimized API</p>
				</div>
				<div class="feature-box">
					<div class="feature-icon">🔒</div>
					<h3>Secure by Default</h3>
					<p>Enterprise-grade security with API key authentication</p>
				</div>
				<div class="feature-box">
					<div class="feature-icon">📚</div>
					<h3>Simple API</h3>
					<p>RESTful endpoints that integrate in minutes, not hours</p>
				</div>
				<div class="feature-box">
					<div class="feature-icon">💎</div>
					<h3>Solana Native</h3>
					<p>Built specifically for the Solana blockchain ecosystem</p>
				</div> 
			</div>
		</div>
	</section>

	<!-- Code Example Section -->
	<section class="code-example">
		<div class="container">
			<h2 class="section-title">Get Started in Minutes</h2>
			<div class="code-box">
				<div class="code-header">
					<span class="code-lang">JavaScript</span>
				</div>
				<pre class="code-content"><code>{codeExample}</code></pre>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="cta">
		<div class="container">
			<div class="cta-box">
				<h2>Ready to Start Processing Payments?</h2>
				<p>Join developers building the future of crypto payments</p>
				<button class="btn btn-primary btn-large" onclick={() => goto('/register')}>
					Create Free Account
				</button>
			</div>
		</div>
	</section>
</div>

<style>
	.homepage {
		min-height: 100vh;
		background: #ffffff;
	}

	/* Navigation */
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
		max-width: 1200px;
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

	/* Hero Section */
	.hero {
		padding: 6rem 2rem;
		text-align: center;
		background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.hero-title {
		font-size: 3.5rem;
		color: #1a1a1a;
		margin: 0 0 1.5rem 0;
		line-height: 1.2;
		font-weight: 700;
	}

	.hero-subtitle {
		font-size: 1.3rem;
		color: #666;
		margin: 0 0 3rem 0;
		font-weight: 400;
	}

	.hero-buttons {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Features Section */
	.features {
		padding: 4rem 2rem;
		background: #f8f9fa;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-title {
		font-size: 2.5rem;
		color: #1a1a1a;
		text-align: center;
		margin: 0 0 3rem 0;
		font-weight: 700;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.feature-box {
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		padding: 2rem;
		text-align: center;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.feature-box:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature-box h3 {
		font-size: 1.3rem;
		color: #003afa;
		margin: 0 0 1rem 0;
		font-weight: 600;
	}

	.feature-box p {
		color: #666;
		margin: 0;
		line-height: 1.6;
	}

	/* Code Example Section */
	.code-example {
		padding: 4rem 2rem;
		background: #ffffff;
	}

	.code-box {
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
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

	/* CTA Section */
	.cta {
		padding: 4rem 2rem;
		background: #f8f9fa;
	}

	.cta-box {
		background: #ffffff;
		border: 2px solid #003afa;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		padding: 3rem;
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
	}

	.cta-box h2 {
		font-size: 2rem;
		color: #1a1a1a;
		margin: 0 0 1rem 0;
		font-weight: 700;
	}

	.cta-box p {
		color: #666;
		margin: 0 0 2rem 0;
		font-size: 1.1rem;
	}

	/* Button Styles */
	.btn {
		font-size: 1rem;
		padding: 0.75rem 1.5rem;
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
		background: #6c757d;
		color: #ffffff;
		border-color: #6c757d;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #5a6268;
		border-color: #5a6268;
	}

	.btn-large {
		font-size: 1.2rem;
		padding: 1rem 2.5rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2.5rem;
		}

		.hero-subtitle {
			font-size: 1.1rem;
		}

		.nav-container {
			flex-direction: column;
			gap: 1rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
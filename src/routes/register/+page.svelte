<script lang="ts">
	let email = $state('');
	let password = $state('');
	let username = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleSubmit() {
		error = '';
		loading = true;

		try {
			const response = await fetch('/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password, username }),
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Registration failed';
				return;
			}

			success = true;
			email = '';
			password = '';
			username = '';
		} catch (err) {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="register-container">
	<div class="register-box">
		<h1 class="register-title">Register</h1>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		{#if success}
			<div class="success-message">Account created successfully!</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="register-form">
			<div class="input-group">
				<label for="username">Username</label>
				<input
					type="text"
					id="username"
					bind:value={username}
					required
					placeholder="Enter username"
					disabled={loading}
				/>
			</div>

			<div class="input-group">
				<label for="email">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					placeholder="Enter email"
					disabled={loading}
				/>
			</div>

			<div class="input-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					placeholder="Enter password"
					disabled={loading}
				/>
			</div>

			<button type="submit" class="btn btn-primary" disabled={loading}>
				{loading ? 'Creating...' : 'Create Account'}
			</button>

            <div class="login-link">
                <p>Already have an account? <a href="/login" class="login-link-text">Login here</a></p>
            </div>
		</form>
	</div>
</div>

<style>
	.login-link-text {
		color: #003afa;
	}

	.register-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 2rem;
		background: #f5f5f5;
	}

	.register-box {
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		padding: 2.5rem;
		width: 100%;
		max-width: 400px;
	}

	.register-title {
		font-size: 2rem;
		text-align: center;
		margin: 0 0 2rem 0;
		color: #1a1a1a;
		font-weight: 700;
	}

	.register-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-size: 0.9rem;
		color: #333;
		font-weight: 500;
	}

	.input-group input {
		font-size: 1rem;
		padding: 0.75rem;
		background: #ffffff;
		border: 1px solid #d0d0d0;
		border-radius: 6px;
		color: #333;
		outline: none;
		transition: all 0.2s;
	}

	.input-group input:focus {
		border-color: #003afa;
		box-shadow: 0 0 0 3px rgba(0, 58, 250, 0.1);
	}

	.input-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f8f9fa;
	}

	.input-group input::placeholder {
		color: #999;
	}

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
		margin-top: 0.5rem;
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

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.error-message {
		background: #dc3545;
		border: 1px solid #dc3545;
		border-radius: 6px;
		color: #fff;
		padding: 0.75rem;
		margin-bottom: 1rem;
		text-align: center;
		font-size: 0.9rem;
	}

	.success-message {
		background: #28a745;
		border: 1px solid #28a745;
		border-radius: 6px;
		color: #fff;
		padding: 0.75rem;
		margin-bottom: 1rem;
		text-align: center;
		font-size: 0.9rem;
	}
</style>
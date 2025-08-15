// Root startup with dependency self-heal for Azure runtime
const { execSync } = require('child_process');

function ensureDependenciesInstalled() {
	try {
		// Probe a couple of critical modules
		require.resolve('express');
		require.resolve('parseurl');
		return;
	} catch (err) {
		const isModuleNotFound = err && (err.code === 'MODULE_NOT_FOUND' || /Cannot find module/.test(String(err)));
		if (!isModuleNotFound) throw err;
		try {
			console.error('[startup] Missing Node modules detected. Installing dependencies with npm ci...');
			execSync('npm ci --omit=dev --no-audit --no-fund', { stdio: 'inherit' });
			console.error('[startup] Dependencies installed successfully.');
		} catch (installErr) {
			console.error('[startup] Failed to install dependencies:', installErr);
			process.exit(1);
		}
	}
}

ensureDependenciesInstalled();

// Start backend server
require('./backend/server.js'); 
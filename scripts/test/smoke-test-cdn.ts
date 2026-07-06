import {chromium} from "@playwright/test";

function resolveViewerTestBaseUrl(): string {
	const explicit = process.env.VIEWER_TEST_BASE_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");

	const target = (
		process.env.VIEWER_TEST_ENV ||
		process.env.GITHUB_ENVIRONMENT ||
		process.env.GITHUB_REF_NAME ||
		"production"
	)
		.trim()
		.toLowerCase();

	switch (target) {
		case "development":
			return "https://viewer.shapediver.com/v3/development";
		case "staging":
			return "https://viewer.shapediver.com/v3/staging";
		case "production":
		case "latest":
		case "main":
		default:
			return "https://viewer.shapediver.com/v3/latest";
	}
}

(async () => {
	const baseUrl = resolveViewerTestBaseUrl();
	const url = `${baseUrl}/test-cdn/index.html`;
	const browser = await chromium.launch({headless: true});
	const page = await browser.newPage();

	const consoleMessages: string[] = [];
	const pageErrors: string[] = [];
	const requestFailures: string[] = [];

	page.on("console", (msg) => {
		consoleMessages.push(`[console:${msg.type()}] ${msg.text()}`);
	});
	page.on("pageerror", (err) => {
		pageErrors.push(err.stack || err.message);
	});
	page.on("requestfailed", (req) => {
		requestFailures.push(
			`${req.method()} ${req.url()} :: ${req.failure()?.errorText || "unknown"}`,
		);
	});

	try {
		console.log(`[smoke-test-cdn] Opening ${url}`);
		await page.goto(url, {waitUntil: "load", timeout: 120_000});
		await page.waitForFunction(
			() => !!(window as any).SDV?.createViewport,
			undefined,
			{timeout: 30_000},
		);

		const info = await page.evaluate(() => {
			const sdv = (window as any).SDV;
			return {
				hasSDV: !!sdv,
				hasCreateViewport: !!sdv?.createViewport,
				keys: sdv ? Object.keys(sdv).slice(0, 10) : [],
			};
		});
		console.log(`[smoke-test-cdn] OK ${JSON.stringify(info)}`);
	} catch (error) {
		console.error(`[smoke-test-cdn] FAILED for ${url}`);
		if (consoleMessages.length > 0) {
			console.error("[smoke-test-cdn] Browser console:");
			for (const line of consoleMessages) console.error(line);
		}
		if (pageErrors.length > 0) {
			console.error("[smoke-test-cdn] Page errors:");
			for (const line of pageErrors) console.error(line);
		}
		if (requestFailures.length > 0) {
			console.error("[smoke-test-cdn] Request failures:");
			for (const line of requestFailures) console.error(line);
		}
		throw error;
	} finally {
		await browser.close();
	}
})();

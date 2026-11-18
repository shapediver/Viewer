import {expect, test} from "@playwright/test";
import {HttpClient} from "../../shared/services/src/http-client/HttpClient";

const SESSION_ID = "unit-test-session";
const originalFetch = globalThis.fetch;
let counter = 0;
const uniqueUrl = () =>
	`https://example.test/env-${Date.now()}-${counter++}.hdr`;

const bytes = new Uint8Array([1, 2, 3]).buffer;

const stubFetch = (impl: (url: string) => Promise<unknown>) => {
	const calls: string[] = [];
	globalThis.fetch = (async (url: string) => {
		calls.push(String(url));
		return impl(String(url));
	}) as unknown as typeof fetch;
	return calls;
};

const okResponse = () => ({
	ok: true,
	status: 200,
	statusText: "OK",
	headers: new Headers({"content-type": "image/vnd.radiance"}),
	arrayBuffer: async () => bytes,
	text: async () => "",
});

const notFoundResponse = () => ({
	ok: false,
	status: 404,
	statusText: "",
	headers: new Headers(),
});

const addSession = (downloadTexture: () => Promise<[ArrayBuffer, string]>) =>
	HttpClient.instance.addDataLoading(SESSION_ID, {
		getAsset: async () => [bytes, ""],
		downloadTexture,
	});

test.afterEach(() => {
	globalThis.fetch = originalFetch;
	HttpClient.instance.removeDataLoading(SESSION_ID);
});

test.describe("HttpClient texture download", () => {
	test("falls back to direct fetch when the session download fails", async () => {
		const url = uniqueUrl();
		addSession(async () => {
			throw new Error("SdTextureUrlError");
		});
		const calls = stubFetch(async () => okResponse());

		const result = await HttpClient.instance.get(url, undefined, true);

		expect(calls).toEqual([url]);
		expect(new Uint8Array(result.data as ArrayBuffer)).toEqual(
			new Uint8Array([1, 2, 3]),
		);
		expect(result.headers["content-type"]).toBe("image/vnd.radiance");
	});

	test("reports URL, status and session error when both downloads fail with HTTP error", async () => {
		const url = uniqueUrl();
		addSession(async () => {
			throw new Error("proxy said no");
		});
		stubFetch(async () => notFoundResponse());

		const error = await HttpClient.instance
			.get(url, undefined, true)
			.catch((e) => e);

		expect(error).toBeInstanceOf(Error);
		expect(error.message).toContain(url);
		expect(error.message).toContain("404");
		expect(error.message).toContain("proxy said no");
	});

	test("reports network or CORS errors of the direct download", async () => {
		const url = uniqueUrl();
		addSession(async () => {
			throw new Error("proxy said no");
		});
		stubFetch(async () => {
			throw new TypeError("Failed to fetch");
		});

		const error = await HttpClient.instance
			.get(url, undefined, true)
			.catch((e) => e);

		expect(error.message).toContain(url);
		expect(error.message).toContain("network or CORS");
	});

	test("uses the session download and does not fetch when it succeeds", async () => {
		const url = uniqueUrl();
		addSession(async () => [bytes, "image/x-test"]);
		const calls = stubFetch(async () => okResponse());

		const result = await HttpClient.instance.get(url, undefined, true);

		expect(calls).toEqual([]);
		expect(result.headers["content-type"]).toBe("image/x-test");
		expect(new Uint8Array(result.data as ArrayBuffer)).toEqual(
			new Uint8Array([1, 2, 3]),
		);
	});

	test("reports URL and status without a session", async () => {
		const url = uniqueUrl();
		stubFetch(async () => notFoundResponse());

		const error = await HttpClient.instance
			.get(url, undefined, true)
			.catch((e) => e);

		expect(error.message).toContain(url);
		expect(error.message).toContain("404");
	});
});

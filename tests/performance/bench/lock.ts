import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * One benchmark at a time per machine. Two runs at once measure each other,
 * and they would also fight over ports 8195 and 8196.
 *
 * The lock is a file with the owner's process id. A file whose process is
 * gone is stale and is taken over. Waiting is synchronous because the
 * Playwright config is loaded synchronously and has to hold the lock before
 * Playwright starts the web servers.
 */
const LOCK = path.join(os.tmpdir(), "shapediver-viewer-bench.lock");
const POLL_MS = 2000;

function isAlive(pid: number) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		// EPERM: the process exists but belongs to someone else.
		return (error as NodeJS.ErrnoException).code === "EPERM";
	}
}

function parseOwner(content: string): {pid: number; since: string} | undefined {
	try {
		return JSON.parse(content);
	} catch {
		return undefined;
	}
}

function readOwner() {
	try {
		return parseOwner(fs.readFileSync(LOCK, "utf8"));
	} catch {
		return undefined;
	}
}

/**
 * Creates the lock with its content in one step, so no other process ever
 * sees it empty: the content goes to a file of our own, which is then
 * hard-linked to the lock name. The link fails if the lock exists.
 */
function tryCreate() {
	const temp = `${LOCK}.${process.pid}`;
	fs.writeFileSync(
		temp,
		JSON.stringify({pid: process.pid, since: new Date().toISOString()}),
	);
	try {
		fs.linkSync(temp, LOCK);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
		return false;
	} finally {
		fs.rmSync(temp, {force: true});
	}
}

function sleep(ms: number) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Blocks until this process holds the lock. Released when the process exits. */
export function acquireBenchLock() {
	let announced = false;
	for (;;) {
		if (tryCreate()) break;
		let content: string;
		try {
			content = fs.readFileSync(LOCK, "utf8");
		} catch {
			continue; // Released in the meantime.
		}
		const owner = parseOwner(content);
		if (owner?.pid === process.pid) return;
		if (!owner || !isAlive(owner.pid)) {
			// Stale: its process is gone. Remove it only if no other waiter
			// has replaced it with a live lock in the meantime.
			try {
				if (fs.readFileSync(LOCK, "utf8") === content)
					fs.unlinkSync(LOCK);
			} catch {
				// Someone else removed it. Try again.
			}
			continue;
		}
		if (!announced) {
			console.log(
				`Another timing benchmark is running (process ${owner.pid}, since ${owner.since}). ` +
					`Waiting for it to finish. Lock file: ${LOCK}`,
			);
			announced = true;
		}
		sleep(POLL_MS);
	}
	if (announced) console.log("The other benchmark finished. Starting.");
	// Playwright exits normally on Ctrl+C too. A killed run leaves a stale
	// file, which the next run takes over.
	process.on("exit", () => {
		if (readOwner()?.pid === process.pid) fs.rmSync(LOCK, {force: true});
	});
}

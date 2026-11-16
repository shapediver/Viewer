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

function readOwner(): {pid: number; since: string} | undefined {
	try {
		return JSON.parse(fs.readFileSync(LOCK, "utf8"));
	} catch {
		return undefined;
	}
}

function sleep(ms: number) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Blocks until this process holds the lock. Released when the process exits. */
export function acquireBenchLock() {
	let announced = false;
	for (;;) {
		try {
			const fd = fs.openSync(LOCK, "wx");
			fs.writeSync(
				fd,
				JSON.stringify({
					pid: process.pid,
					since: new Date().toISOString(),
				}),
			);
			fs.closeSync(fd);
			break;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
		}
		const owner = readOwner();
		if (owner?.pid === process.pid) return;
		if (!owner || !isAlive(owner.pid)) {
			// Stale, or written half by an owner that is starting up.
			// Remove it only if it is still the same file after a pause.
			try {
				const before = fs.readFileSync(LOCK, "utf8");
				sleep(200);
				if (fs.readFileSync(LOCK, "utf8") === before)
					fs.unlinkSync(LOCK);
			} catch {
				// Someone else removed or replaced it. Try again.
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

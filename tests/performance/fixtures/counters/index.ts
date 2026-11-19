import {installMatrixWorld} from "./matrixWorld";
import {installProgramCacheKey} from "./programCacheKey";

/**
 * Counters that wrap three.js functions, in the order `openViewer` evaluates
 * them in the page after `installProbe`. Each is one file in this folder and
 * one line here. A counter adds `window.__probe.counters.<name>` with
 * `attach`, `reset` and `read` (see `probe.ts`), and a test reads it with
 * `__probe.readCounters()`.
 *
 * Counters that are planned but belong to other tickets (SS-10477
 * `batchMembers` and `visits`, SS-10486 `fade`, SS-10393 `picking`, SS-10383
 * `contactShadow`) get their file and their line here.
 */
export const COUNTER_INSTALLERS = [installMatrixWorld, installProgramCacheKey];

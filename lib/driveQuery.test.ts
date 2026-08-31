import assert from "node:assert/strict";
import { escapeQueryValue, isTokenFresh, TOKEN_SKEW_MS } from "./driveQuery";

// Album names are user input spliced into a Drive `q` string.
assert.equal(escapeQueryValue("Japan 2024"), "Japan 2024");
assert.equal(escapeQueryValue("Dad's trip"), "Dad\\'s trip");
assert.equal(escapeQueryValue("a\\b"), "a\\\\b");
// A closing quote must not be able to break out and append clauses.
assert.equal(escapeQueryValue("x' or name='y"), "x\\' or name=\\'y");

const now = 1_000_000;
assert.equal(isTokenFresh(now + TOKEN_SKEW_MS + 1, now), true);
// Inside the skew window the token counts as stale, so it can't die mid-request.
assert.equal(isTokenFresh(now + TOKEN_SKEW_MS - 1, now), false);
assert.equal(isTokenFresh(now - 1, now), false);

console.log("driveQuery: all checks passed");

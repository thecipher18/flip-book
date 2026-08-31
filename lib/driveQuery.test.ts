import assert from "node:assert/strict";
import {
  escapeQueryValue,
  isTokenFresh,
  isWriter,
  TOKEN_SKEW_MS,
} from "./driveQuery";

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

const allow = "owner@example.com, Friend@Example.com";
assert.equal(isWriter("owner@example.com", allow), true);
// Google emails are case-insensitive; the allowlist must be too.
assert.equal(isWriter("friend@example.com", allow), true);
assert.equal(isWriter(" friend@example.com ", allow), true);
assert.equal(isWriter("stranger@example.com", allow), false);
// An unset or empty allowlist must not hand write access to everyone.
assert.equal(isWriter("owner@example.com", undefined), false);
assert.equal(isWriter("owner@example.com", ""), false);
assert.equal(isWriter("", allow), false);
assert.equal(isWriter(null, allow), false);
// An empty entry in the list must not match an empty-ish email.
assert.equal(isWriter(" ", "a@b.com,,c@d.com"), false);

console.log("driveQuery: all checks passed");

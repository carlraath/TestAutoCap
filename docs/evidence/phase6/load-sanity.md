# Load sanity

Date: 2026-09-10. 20 concurrent participants for 60 seconds against the production build.

Every participant was created and started through the real screens, then autosaved an answer and polled
its attempt once a second over HTTP, and all of them submitted at the same instant.

| Operation | Requests | Failed | p50 ms | p95 ms | p99 ms |
|---|---|---|---|---|---|
| autosave | 1200 | 0 | 46 | 66 | 73 |
| poll | 1200 | 0 | 52 | 62 | 65 |
| submit | 20 | 0 | 55 | 79 | 79 |

Total requests: 2420. Failed: 0.
Answers acknowledged and stored: 120. Mismatches after the run: 0.

Every attempt finished submitted exactly once, and every answer the server acknowledged was still stored afterwards.

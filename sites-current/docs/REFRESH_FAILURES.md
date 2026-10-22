# Refresh errors and durable verification

Successful edition and cooldown responses retain their existing HTTP 200
contract. A completely unavailable provider mesh now returns HTTP 503 instead
of saving a newly dated edition made entirely from retained observations.
When readable, the previous public payload is included, with its original
`requestedAt`, values and quote timestamp. Error responses use `Cache-Control:
no-store`; clients must inspect HTTP status before treating them as a refresh.

Errors add `errorCode`, an opaque `requestId`, `X-ABCM-Refresh-Result` and
`X-ABCM-Request-Id`. Fixed categories distinguish provider rate limiting,
timeout, network failure, invalid transport payload, general unavailability,
snapshot validation, persistence failure, unconfirmed persistence, unreadable
concurrent edition and internal generation failure. When several providers fail,
the reported category is a summary (rate limit, then timeout, network, invalid
payload, generic); inspect the bounded transport health for each provider.
These categories diagnose the current attempt, not the historical production
POST whose HTTP status was never captured.

D1 insert admission remains one atomic statement. A zero-change insert uses
the other writer's durable edition. A successful one-change acknowledgement
requires an ID-specific read-back with identical timestamp, metrics, scores and
provenance. Lost or altered bytes and unexpected change counts fail closed;
the API does not return an unsaved generation as success. No history is deleted.
This verifies acknowledgement/readability, not a distributed writer lease or an
external database backup. The existing five-minute admission window and manual
cooldown are retained.

The logger emits only the fixed code and generated request ID. It does not emit
exception messages, upstream bodies, query strings, cookies or authorization.
Browser attachments preserve method, path and HTTP status, without response
bodies or request headers. Error injection uses Miniflare, local D1 triggers and
test bindings; never reproduce refresh errors with a production POST.

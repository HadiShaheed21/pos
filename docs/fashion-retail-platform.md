# Fashion retail platform architecture

**Status: ACTIVE DESIGN — approved 2026-09-13**

This document defines the approved evolution of FloCafe into a Kerala, India
fashion-retail POS and online store. It deliberately adds a dedicated retail
platform rather than exposing the local Electron API to the public internet or
making the existing local SQLite database a shared database.

## Goals and boundaries

- A desktop POS can sell, scan barcodes, deduct stock, return/exchange items,
  and print receipts without an internet connection.
- `api.<domain>` and PostgreSQL are the authoritative shared system once the
  POS has synchronized. `shop.<domain>` only reads and writes through that API.
- Inventory is changed by immutable, idempotent movements, never by copying a
  client-side stock balance over the server's balance.
- Every sellable size/colour combination has its own ID, SKU, barcode, price,
  and stock position.
- All monetary and tax calculations are backend-authoritative. Amounts are
  stored as integer paise; timestamps are UTC and business dates use the
  configured store timezone (`Asia/Kolkata` for the initial location).
- Existing FloCafe restaurant behavior and its cloud-coordination pathway are
  not silently repurposed by this work. The fashion platform is a new bounded
  service, with an explicit migration/import path added only when ready.

## Deployment topology

```text
                         Internet
                            |
        +-------------------+-------------------+
        |                                       |
 shop.<domain>                            admin.<domain>
 public storefront                         authenticated operations UI
        \                                       /
         +---------- api.<domain> ------------+
                       |    |    \
                 PostgreSQL Redis  object storage
                       |
               event stream / sync API
                       |
             TLS + device-authenticated sync
                       |
        FloCafe retail POS desktop (SQLite)
          local inventory ledger + outbox
```

The VPS runs Docker Compose services for the API, storefront/admin static or
SSR apps, worker, PostgreSQL, Redis, reverse proxy, and a backup job. TLS is
terminated at the reverse proxy; PostgreSQL and Redis are private-only Docker
networks. Product media is object storage (S3-compatible storage) rather than
base64 inside PostgreSQL or SQLite.

Production configuration is supplied through a secrets manager or host-protected
environment files, never committed. Required operations include encrypted daily
PostgreSQL backups plus point-in-time recovery where offered, encrypted off-host
backup retention, restore drills, image version pinning, health checks, structured
logs, metrics/alerts, and a documented rolling update/rollback procedure.

## Identity, locations, and access

Every tenant has one or more locations. The first location is Kerala. A POS
installation is a registered device belonging to exactly one location and has a
rotatable device credential. Users, customers, orders, catalog records and audit
actors are tenant-scoped. Stock belongs to a `location_id`; the online shop has
one or more fulfillment locations. This makes transfers and future branches
first-class rather than a later schema rewrite.

The API uses short-lived user access tokens and refresh-token rotation for web
users. POS sync uses a device credential plus signed requests and TLS. Roles are
server-enforced. Audit history captures actor/device, source (`pos`, `shop`,
`admin`, `sync`), correlation ID, request ID, and before/after business facts;
it never relies on order ownership to hide orders.

## Catalog and variant model

`product` is the non-sellable parent: name, description, brand, collection,
gender, category, fabric/material, fit, style, season, HSN, tax category,
media, publishing state, and size guide. Categories support Men, Women, Kids
and children such as shirts, T-shirts, jeans, trousers, and dresses.

`product_variant` is the sellable record. It holds `product_id`, canonical
option values (for example Colour=Black, Size=M), unique tenant SKU, unique
tenant barcode, purchase/selling/discount price in paise, GST rule, weight,
active/published flags, and media overrides. A database uniqueness constraint
on `(product_id, option_value_fingerprint)` prevents duplicate Black/M entries.

The initial option dimensions are Size and Colour; the model supports additional
dimensions without modifying order or stock tables. Product images and approved
product video references are media assets; uploaded file type, size, ownership,
and content-disposition are validated on the server.

## Inventory ledger

There is no editable source-of-truth `stock_quantity`. The read model is derived
per `(tenant_id, location_id, variant_id)` from `inventory_movement` records:

| Movement | Effect | Typical source |
| --- | ---: | --- |
| receipt | positive | purchase order received |
| sale | negative | paid POS or online order |
| return | positive | customer return |
| exchange_out | negative | exchange replacement |
| adjustment | signed | approved count/damage correction |
| transfer_out / transfer_in | signed | inter-location transfer |
| reservation / release | availability only | online checkout/order lifecycle |

Each movement has a globally unique UUID generated by its originating device or
server, a causal `operation_id`, occurred-at timestamp, business effective time,
quantity, reason, immutable product/price/tax snapshot where applicable, and
actor/device metadata. The server enforces a unique `(tenant_id, movement_id)`;
replays return the original result, not a second deduction.

`inventory_balance` is a transactional server projection used for reads and
availability. It contains on-hand, reserved, and available quantities, a
monotonic version, and the last applied event sequence. It can always be
reconstructed from the ledger. Low-stock notifications operate on available
quantity and are generated by a durable worker.

Online checkout creates an expiring reservation atomically after a conditional
availability check. A Razorpay success page is not proof of payment: only
verified payment handling moves a paid order from reservation to a final sale.
Expired, failed, or cancelled orders release the reservation idempotently.

## POS offline outbox and synchronization

The desktop retains SQLite for its local read models and a durable outbox. A
local POS transaction commits its receipt/order, inventory movements, and outbox
rows in one SQLite transaction before printing. Thus a power failure cannot
create a receipt without a replayable stock/order operation.

Every outbox row includes `event_id`, `operation_id`, device ID, monotonic local
sequence, schema version, UTC occurred-at time, payload hash, retry count, and
state (`pending`, `in_flight`, `acknowledged`, `conflict`, `dead_letter`). It is
never deleted on normal acknowledgement; acknowledgement and server sequence are
retained for recovery/audit. Retries use exponential backoff with jitter and
resume across app restarts. Network errors are retryable; validation/auth and
business conflicts are not silently retried.

The sync protocol is pull-then-push in bounded batches:

1. Authenticate the device and pull central events after its durable server
   cursor. Apply them locally in one SQLite transaction and advance that cursor.
2. Push locally ordered outbox events with their immutable IDs and payload hashes.
   The API records an idempotency result before returning it.
3. The API validates each event in a PostgreSQL transaction, appends it to the
   central ledger, updates projections, emits it to the stream, and returns an
   acknowledgement or an explicit conflict.
4. Store the acknowledgement locally. Repeat until caught up; a WebSocket/SSE
   subscription wakes online POS clients for new central events but is only an
   optimisation, never the source of truth.

The UI states are **Online**, **Offline**, **Syncing**, and **Sync Error**. Sync
Error exposes a safe correlation ID, backlog count, last successful sync time,
and a retry action. It never blocks the local POS from billing solely because
the internet is unavailable.

## Conflicts and overselling

The server never accepts a client-provided final stock value. Offline POS sales
are valid inventory events and can be synchronized exactly once. If their
event arrives after website reservations/sales have consumed the same central
available stock, the server appends the event, records an `oversold` exception,
updates the balance, and creates an admin reconciliation task. It does not drop
or rewrite either sale. The affected online order remains auditable and staff
choose fulfillment, substitution, transfer, or refund through an explicit
workflow.

Barcode/SKU collisions, an unknown/deleted variant, malformed event hashes,
unauthorized device/location, duplicate IDs with different payload hashes,
and invalid state transitions are hard conflicts. They are preserved locally
and centrally with their reason and correlation ID for administrator review.
Replaying a known ID with the same payload is a success and returns the original
result. Payments use their own unique provider payment/order IDs and state
machine so synchronizing an order cannot charge or capture it twice.

While a POS is offline, the online shop displays the last confirmed central
availability only. It must not label that stock as including offline-shop sales
or promise that a just-offline physical sale has reached the server.

## Indian GST and invoicing

Tax is versioned data, not a hard-coded clothing-rate assumption. A product or
variant stores its HSN (or SAC for services) and tax category; rate configuration
has effective dates and supports inclusive, exclusive, exempt, and configurable
rates. At order finalization the backend snapshots the applicable rule, supplier
GSTIN, customer GSTIN where provided, delivery/place-of-supply state, tax
breakdown, and rounding result.

For an intra-state Kerala supply the invoice calculates CGST and SGST components;
for an inter-state supply it calculates IGST. Invoice numbering is sequential and
unique within the configured financial-year series. Credit notes/refunds reference
the original invoice and preserve its original tax snapshot. The generated GST
invoice includes the supplier/recipient details where applicable, HSN/SAC,
description, quantity/unit, taxable value after discounts, tax rate and amount,
place of supply, delivery address, and required invoice identifiers. Confirm
final tax-rate mappings and statutory/e-invoicing thresholds with the merchant's
Indian GST professional before live use.

## Payments and online orders

In-person POS records Cash, Card, UPI, and split tenders locally; its idempotent
payment ID is part of the order event. Card/UPI terminal integration must have a
separate approved provider contract before attempting automatic charge/refund.

For web checkout, the API calculates prices, GST, shipping, and discounts from
the server-side basket and creates a Razorpay Order server-side. The browser gets
only the public Razorpay key and order details. It may report a checkout result,
but the API verifies the signature and processes authenticated Razorpay webhooks
against the raw request body. Webhooks are deduplicated by provider event ID and
stored before they are processed. Fulfillment is allowed only after the verified
and captured payment state. Razorpay secret keys and webhook secrets stay solely
in server secrets.

## Delivery increments and acceptance tests

1. Establish the central service repository/package, PostgreSQL schema migrations,
   tenant/location/device identity, Docker local stack, backups, health checks,
   observability, and authenticated API skeleton.
2. Deliver the catalog and variant model plus media, HSN/tax configuration, and
   inventory ledger/projection with migration tests.
3. Add POS local ledger/outbox, connectivity states, idempotent sync, conflict
   queue, crash/retry testing, and multi-device event propagation.
4. Convert POS scanning, search, cart, receipts, returns/exchanges, shifts and
   reports to sell variants and use tax snapshots.
5. Deliver purchase orders, suppliers, adjustments, damages, low-stock alerts,
   transfers, and full inventory/audit history.
6. Deliver the public fashion shop, accounts, wishlists, cart, shipping, coupons,
   Razorpay test-mode flow, verified webhook processing, tracking, and returns.
7. Complete security review, load/failure testing, backup restore drill, Razorpay
   live-mode readiness, GST professional review, and production deployment.

Required automated scenarios include: barcode lookup selects exactly one variant;
Black/M and Black/L have independent quantities; duplicate event delivery is a
no-op; crash after local commit is recovered; offline sale plus concurrent online
sale creates a reviewable oversell conflict rather than a lost write; payment
webhook replay does not create a second order or deduction; refunds restore stock
only once; and two locations never alter each other's balance without a transfer.

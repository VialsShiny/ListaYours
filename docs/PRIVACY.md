# Owner privacy — how "the owner never learns what is reserved" is enforced

The rule is enforced in the API and in the data layer, never in CSS or by filtering in the browser.

## Data layer

- Reservations live in their own table (`reservations`) with `UNIQUE (gift_id)`; the API inserts inside one
  transaction and maps the constraint violation to `409`, so a gift can never be reserved twice, even under
  concurrent requests (`api/tests/core/test_public_and_reservations.py::test_concurrent_reservations_only_one_wins`).
- No ORM relationship points from `Gift`, `Wishlist` or `User` to `Reservation`: nothing an owner query loads
  can lazy-load reservation rows (`api/tests/privacy/test_structure.py`).
- Reservations are deleted by database cascade when a gift is deleted; the owner's response is the same `204`
  whether or not the gift was reserved.
- Reserving or cancelling never writes to `gifts` (no `updated_at` change, no counters).

## API layer

- Owner endpoints (`/api/owner/**`, `/api/scrape`) all depend on `require_owner`, and their response models are
  explicit whitelists (`OwnerGiftOut`, `OwnerWishlistOut`) with no reservation field. A structural test walks every
  owner route and its response models.
- The public page (`GET /api/public/wishlists/{slug}`) attaches reservation status only for authenticated
  accounts that are neither the owner nor anonymous. The owner, and anonymous readers, receive every gift as
  available and `reservations_visible: false`.
- The owner account is refused on every visitor endpoint (`/api/me/reservations`, reserve, cancel → `403`).
- Error messages and status codes are identical for reserved and unreserved gifts.

## Tests that must stay green

`api/tests/privacy/test_owner_blindness.py` calls every owner-facing route (reads, writes, settings, scrape and the 400/404/409/422 error bodies) with a reserved gift in place and
asserts that no response (body or headers, accents folded) contains reservation markers or visitor identities,
that the owner's view is JSON-identical before, during and after a reservation, and that deleting/editing a reserved gift looks
exactly like deleting/editing a free one. `api/tests/privacy/test_structure.py` guards the route dependencies,
the response schemas and the ORM mapping.

## Known limits

- Anyone can register a visitor account; an owner who registers a second account can see reservations like any
  visitor. This is inherent to a public list with self-service registration.
- Response timing is not normalised.

---
name: project-backend-structure
description: AlJawad backend architecture — DB schema, models, controllers, roles after June 2026 restructure
metadata:
  type: project
---

## Architecture (as of 2026-06-12)

### Core principle
Everyone is a user first. `users` is the single source of truth for identity, auth, and shared contact data. `clients` and `coaches` are profile/CRM extensions.

### `users` table
name, email, phone, password, user_type (client|coach), is_active, telegram_chat_id, affiliate_code (nullable unique), affiliate_balance, referred_by_user_id (self-FK)

### `clients` table (CRM — leads + clients)
user_id (NOT NULL FK users), type (lead|client), status (active|inactive), source, tags (JSON), lead_status, last_contact, courses_count, converted_at

### `client_notes` table
id, client_id, author_id (FK users — always a coach), body, timestamps
Multiple notes per client. Added/deleted via `POST/DELETE /api/admin/crm/{client}/notes`.

### `coaches` table
user_id (NOT NULL FK users), login_email (nullable override), login_password (nullable override, hashed), status (active|inactive)
No specialization. No name/email/phone — all from users. login_email/login_password, when set, override the users record auth credentials.

### Affiliate program (on users table)
- affiliate_code on users — any user (coach, client, lead) can be an affiliate
- affiliate_balance on users — earned commissions
- referred_by_user_id on users — who referred them
- affiliate_commissions table has referrer_user_id (FK users) instead of old affiliate_id
- old affiliates table DROPPED

### Roles & Permissions (Spatie)
Roles are for coaches ONLY. Clients/leads have no role assigned.
Roles: admin, coach, account_manager, marketer, customer_support, analyst
Added permissions: view affiliates, manage affiliates

### Key controllers
- ClientController: creates User + Client in DB::transaction. Search via whereHas('user'). Notes via storeNote/destroyNote.
- CoachController: creates User + Coach. login_email/login_password sync to users record.
- AuthController: register() creates User + auto-creates lead Client record. No role assignment for clients.
- MarketingController: sendNotification() auto-computes telegram recipient count from users.telegram_chat_id. New GET telegram-recipients endpoint.

### Routes added
- POST   /api/admin/crm/{client}/notes
- DELETE /api/admin/crm/{client}/notes/{note}
- GET    /api/admin/marketing/telegram-recipients?segment=all|clients|leads|coaches

**Why:** User requested "everyone is a user first" architecture so leads, clients, and coaches all share identity data (name/email/phone/telegram) from a single users record. Affiliate program moved to users so coaches can also be affiliates.

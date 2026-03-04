# KIWIFY WEBHOOK RUNBOOK

**Versão:** 1.0
**Last Updated:** 2026-03-03
**Status:** Production Ready (P0.3)

---

## 📚 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Operations](#operations)
5. [Troubleshooting](#troubleshooting)
6. [Monitoring](#monitoring)
7. [FAQ](#faq)

---

## QUICK START

### Pré-requisitos
- Node.js 20+
- Supabase project (production database)
- Kiwify account with webhook credentials

### Setup (5 min)

```bash
# 1. Aplicar migration
psql $DATABASE_URL < sql-scripts/12-webhook-logs.sql

# 2. Configurar .env.local
echo "KIWIFY_WEBHOOK_SECRET=your_webhook_secret_from_kiwify" >> .env.local

# 3. Testar endpoint
curl -X GET http://localhost:3000/api/webhooks/kiwify/health

# 4. Ver logs
npm run retry:webhooks -- --dry-run
```

### Verify Setup

```bash
# Testar com payload fictício
npm run test:webhooks

# Reprocessar webhooks falhados
npm run retry:webhooks
```

---

## ARCHITECTURE

### Flow Diagram

```
┌─────────────────┐
│  Kiwify Server  │
│  (Payment Flow) │
└────────┬────────┘
         │
         │ POST /api/webhooks/kiwify
         │ Header: x-kiwify-signature
         │ Body: {event, order_id, customer, ...}
         ↓
┌─────────────────────────────────────┐
│  Express.js                         │
├─────────────────────────────────────┤
│ 1. kiwifyAuth middleware            │
│    └─ Validate HMAC-SHA256 signature│
│ 2. express.json()                   │
│    └─ Parse JSON body               │
│ 3. Endpoint handler                 │
│    └─ Return 200 OK immediately     │
└────────┬────────────────────────────┘
         │
         │ Async: processKiwifyEvent()
         ↓
┌─────────────────────────────────────┐
│  Kiwify Service                     │
├─────────────────────────────────────┤
│ • logWebhook() → webhook_logs       │
│ • Event handler (3 types)           │
│   ├─ handleOrderApproved            │
│   ├─ handleSubscriptionCanceled     │
│   ├─ handleSubscriptionRenewed      │
│   └─ handleOrderRefunded            │
│ • updateWebhookLog() → set status   │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Supabase Database                  │
├─────────────────────────────────────┤
│ users (plan updated)                │
│ webhook_logs (audit trail)          │
│ plan_changes_audit (history)        │
└─────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  User Experience                    │
├─────────────────────────────────────┤
│ ✅ Plan upgraded/downgraded         │
│ ✅ Features unlocked/locked         │
│ ✅ Welcome/cancellation email sent  │
└─────────────────────────────────────┘
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **Middleware** | `src/middleware/kiwify-auth.js` | HMAC-SHA256 validation |
| **Service** | `src/services/kiwify-service.js` | Event processing logic |
| **Routes** | `src/routes/webhooks.js` | HTTP endpoint |
| **Migration** | `sql-scripts/12-webhook-logs.sql` | Database schema |
| **Retry Script** | `scripts/retry-webhooks.js` | Manual retry command |
| **Tests** | `tests/webhooks.test.js` | Unit & integration tests |

---

## SETUP & CONFIGURATION

### 1. Environment Variables

**Required (.env.local):**
```bash
# Kiwify webhook secret (get from Kiwify dashboard)
KIWIFY_WEBHOOK_SECRET=whk_live_abc123def456...

# Optional
KIWIFY_WEBHOOK_URL=https://yourdomain.com/api/webhooks/kiwify
```

### 2. Database Migration

**Apply once:**
```bash
# Development
psql postgresql://localhost/scopsy < sql-scripts/12-webhook-logs.sql

# Production
psql $DATABASE_URL < sql-scripts/12-webhook-logs.sql

# Verify
SELECT COUNT(*) FROM webhook_logs;
```

### 3. Kiwify Dashboard Configuration

1. Login to https://dashboard.kiwify.com.br
2. Go to Settings → Webhooks
3. Add webhook endpoint:
   - **URL:** `https://yourdomain.com/api/webhooks/kiwify`
   - **Events:** Select all (or: order.approved, subscription.renewed, subscription.canceled)
   - **Secret:** Copy the secret, paste into .env.local as `KIWIFY_WEBHOOK_SECRET`
4. Save and test

### 4. Verify Configuration

```bash
# Check env var is set
echo $KIWIFY_WEBHOOK_SECRET

# Test health endpoint
curl http://localhost:3000/api/webhooks/kiwify/health

# Expected output:
# {
#   "status": "OK",
#   "webhook": "kiwify",
#   "env": {
#     "hasWebhookSecret": true
#   }
# }
```

---

## OPERATIONS

### Daily Operations

#### Morning Check
```bash
# 1. Check for failed webhooks overnight
npm run retry:webhooks -- --limit 5

# 2. View recent errors
psql $DATABASE_URL -c "SELECT * FROM webhook_logs_recent_errors LIMIT 10;"

# 3. Monitor webhook_logs table growth
psql $DATABASE_URL -c "SELECT COUNT(*) as total_webhooks FROM webhook_logs;"
```

#### Run Testes
```bash
# Unit tests
npm run test:webhooks

# Or all tests
npm test

# Watch mode during development
npm run test:watch
```

### Retry Failed Webhooks

#### Automatic (Cron Job - Recommended)

**Setup cron job (every 5 minutes):**
```bash
# Add to crontab
*/5 * * * * cd /path/to/scopsy && npm run retry:webhooks >> /var/log/scopsy-retry.log 2>&1

# Or use a process manager (PM2, systemd, etc)
pm2 start "npm run retry:webhooks" --cron "*/5 * * * *"
```

#### Manual Retry

```bash
# Retry all pending webhooks
npm run retry:webhooks

# Retry only 5 webhooks
npm run retry:webhooks -- --limit 5

# Dry-run first (see what would happen)
npm run retry:webhooks -- --dry-run --verbose

# Help
npm run retry:webhooks -- --help
```

### Monitor Webhooks

#### View Pending Webhooks
```sql
-- Webhooks ready for retry
SELECT
  id,
  event_type,
  customer_email,
  attempt_count,
  next_retry_at
FROM webhook_logs_pending_retry
ORDER BY next_retry_at ASC;
```

#### View Recent Errors (Last 24h)
```sql
SELECT
  id,
  event_type,
  customer_email,
  error_message,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_ago
FROM webhook_logs_recent_errors
ORDER BY created_at DESC;
```

#### View Event Statistics
```sql
SELECT
  event_type,
  COUNT(*) as total,
  SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed_count
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total DESC;
```

#### Manual Webhook Retry (SQL)

If a webhook failed and you fixed the underlying issue:

```sql
-- Retry a specific webhook
UPDATE webhook_logs
SET status = 'retrying',
    next_retry_at = NOW(),
    updated_at = NOW()
WHERE id = 12345;

-- Or retry all failed webhooks from today
UPDATE webhook_logs
SET status = 'retrying',
    next_retry_at = NOW(),
    updated_at = NOW()
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '1 day'
  AND attempt_count < 5;
```

---

## TROUBLESHOOTING

### Issue 1: Webhook Rejected with 401 Signature Invalid

**Symptoms:**
```
❌ Rejeitado: token invalido
```

**Causes:**
- KIWIFY_WEBHOOK_SECRET wrong
- Payload modified in transit
- Signature calculation error

**Solution:**
```bash
# 1. Verify secret in .env.local
echo $KIWIFY_WEBHOOK_SECRET

# 2. Get secret from Kiwify dashboard
# Settings → Webhooks → Copy Secret

# 3. Check if it matches
# Compare character by character

# 4. Test with health endpoint
curl http://localhost:3000/api/webhooks/kiwify/health
```

### Issue 2: Webhook Received But No Plan Update

**Symptoms:**
- Webhook logged in webhook_logs with status='success'
- User plan in database still 'free'

**Causes:**
- Event handler error (logged in error_message)
- User not found in database
- Database query failed

**Solution:**
```bash
# 1. Check webhook_logs for error
psql $DATABASE_URL << EOF
SELECT id, event_type, payload, error_message, status
FROM webhook_logs
WHERE customer_email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 1;
EOF

# 2. Check user exists
SELECT id, email, plan FROM users WHERE email = 'user@example.com';

# 3. Check RLS doesn't block service role
-- If users table has RLS, verify service_role has access
-- (Service role should bypass RLS)

# 4. Manually retry webhook
npm run retry:webhooks -- --limit 1 --verbose
```

### Issue 3: Webhook Timeout / No Response

**Symptoms:**
- Kiwify retries webhook multiple times
- Server logs show timeout

**Causes:**
- Database slow query
- Network latency
- Service role blocked

**Solution:**
```bash
# 1. Check server logs
tail -f logs/error.log | grep WEBHOOK

# 2. Check database response time
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM users WHERE email='test@test.com';"

# 3. Verify service_role can access tables
psql $DATABASE_URL -c "SELECT current_role;" # Should show "service_role"

# 4. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### Issue 4: Retry Command Fails

**Symptoms:**
```
❌ Erro ao buscar webhooks: permission denied
```

**Causes:**
- Database connection string wrong
- User doesn't have permissions
- Table doesn't exist

**Solution:**
```bash
# 1. Check DATABASE_URL
echo $DATABASE_URL

# 2. Verify webhook_logs table exists
psql $DATABASE_URL -c "SELECT COUNT(*) FROM webhook_logs;"

# 3. Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# 4. If table missing, apply migration
psql $DATABASE_URL < sql-scripts/12-webhook-logs.sql
```

### Issue 5: Webhook Secret Not Configured

**Symptoms:**
```
HTTP 503: Webhook não configurado no servidor
```

**Solution:**
```bash
# 1. Add to .env.local
echo "KIWIFY_WEBHOOK_SECRET=your_secret" >> .env.local

# 2. Restart server
npm run dev

# 3. Test again
curl http://localhost:3000/api/webhooks/kiwify/health
```

---

## MONITORING

### Alert Thresholds

Set alerts for:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Failed webhooks (24h) | > 5 | Page on-call |
| Pending retry count | > 20 | Investigate |
| Webhook latency (p95) | > 1s | Check DB |
| Error rate | > 5% | Page on-call |

### Metrics Query

```sql
-- Webhook health dashboard
WITH stats AS (
  SELECT
    COUNT(*) as total_webhooks,
    SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status IN ('pending', 'retrying') THEN 1 ELSE 0 END) as pending,
    ROUND(100.0 * SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
  FROM webhook_logs
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT * FROM stats;
```

---

## FAQ

### Q: How often are webhooks retried?
**A:** Exponential backoff: 1min, 2min, 4min, 8min, 16min (max 5 attempts)

### Q: What if Kiwify sends duplicate webhook?
**A:** Idempotent design - order_id check in handler prevents duplicate charges

### Q: Can I manually process a webhook?
**A:** Yes, update webhook_logs.status='retrying' and run `npm run retry:webhooks`

### Q: What happens if user doesn't exist when webhook arrives?
**A:** Webhook logs error, retries later. On retry, if user was created, it succeeds.

### Q: How long are webhooks kept?
**A:** Forever in webhook_logs (essential audit trail). Can implement archival if needed.

### Q: Can I test webhook locally?
**A:** Yes, run `npm run test:webhooks` or use Kiwify sandbox environment

### Q: Is HMAC-SHA256 secure?
**A:** Yes, industry standard. Uses timing-safe comparison to prevent attacks.

### Q: What if KIWIFY_WEBHOOK_SECRET leaks?
**A:** Change in Kiwify dashboard, update .env.local, restart server immediately

---

## REFERENCES

- **Story:** `.aios-core/development/stories/p0-security-hardening/p0.3-kiwify-webhooks.md`
- **Research:** `.planning/phases/01-security-hardening/P0.3-RESEARCH.md`
- **Code:** `src/services/kiwify-service.js`, `src/middleware/kiwify-auth.js`
- **Kiwify Docs:** https://docs.kiwify.com.br/webhooks

---

**Last Review:** 2026-03-03
**Next Review:** 2026-03-17 (2 weeks into production)
**Owner:** @devops, @dev

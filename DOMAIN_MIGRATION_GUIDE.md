# Domain Migration Guide: PPL Project

**Migration Date:** 2025-12-27
**Purpose:** Pindahin PPL ke domain temporary (frontenppl & bekenppl)
**Reversible:** YES - Tinggal revert file changes + rebuild

---

## 📋 Summary of Changes

### Domain Changes:
- **Frontend**: `ppl.vinmedia.my.id` → `frontenppl.vinmedia.my.id`
- **Backend**: `api-ppl.vinmedia.my.id` → `bekenppl.vinmedia.my.id`

### Files Modified:
1. `/var/www/config-server/config.json` ✅
2. `/root/.cloudflared/ppl-config.yml` ✅
3. `/var/www/PPL-C-2025/frontend/.env` ✅
4. `/var/www/PPL-C-2025/backend/src/app.js` ✅
5. `/var/www/PPL-C-2025/backend/src/server.js` ✅
6. `/var/www/PPL-C-2025/backend/public/mock-payment/index.html` ✅
7. `/var/www/PPL-C-2025/backend/src/config/swagger.js` ✅
8. `/var/www/PPL-C-2025/backend/src/modules/chat/infrastructure/services/SocketService.js` ✅

---

## 🔄 Complete Change Log

### 1. Config Server (`/var/www/config-server/config.json`)

**BEFORE:**
```json
{
  "backend": "https://api-ppl.vinmedia.my.id",
  "frontend": "https://ppl.vinmedia.my.id",
  "version": "1.0",
  "updated_at": "2025-12-27T12:00:00Z"
}
```

**AFTER:**
```json
{
  "backend": "https://bekenppl.vinmedia.my.id",
  "frontend": "https://frontenppl.vinmedia.my.id",
  "version": "1.1",
  "updated_at": "2025-12-27T18:45:00Z"
}
```

**Revert Command:**
```bash
nano /var/www/config-server/config.json
# Change backend & frontend URLs back to original
```

---

### 2. Cloudflare Tunnel Config (`/root/.cloudflared/ppl-config.yml`)

**BEFORE:**
```yaml
  # Frontend - ppl.vinmedia.my.id
  - hostname: ppl.vinmedia.my.id
    service: http://localhost:5173
    originRequest:
      noTLSVerify: true

  # API - api-ppl.vinmedia.my.id
  - hostname: api-ppl.vinmedia.my.id
    service: http://localhost:5001
    originRequest:
      noTLSVerify: true
```

**AFTER:**
```yaml
  # Frontend - frontenppl.vinmedia.my.id (NEW)
  - hostname: frontenppl.vinmedia.my.id
    service: http://localhost:5173
    originRequest:
      noTLSVerify: true

  # API - bekenppl.vinmedia.my.id (NEW)
  - hostname: bekenppl.vinmedia.my.id
    service: http://localhost:5001
    originRequest:
      noTLSVerify: true

  # OLD - DISABLED SEMENTARA
  # - hostname: ppl.vinmedia.my.id
  #   service: http://localhost:5173
  # - hostname: api-ppl.vinmedia.my.id
  #   service: http://localhost:5001

  # Config Server - config.vinmedia.my.id
  - hostname: config.vinmedia.my.id
    service: http://localhost:8083
    originRequest:
      noTLSVerify: true
```

**Revert Command:**
```bash
nano /root/.cloudflared/ppl-config.yml
# Uncomment old domains, comment new ones
sudo systemctl restart cloudflared-ppl.service
```

---

### 3. Frontend Environment (`/var/www/PPL-C-2025/frontend/.env`)

**BEFORE:**
```env
VITE_API_BASE_URL=https://api-ppl.vinmedia.my.id/api
VITE_GOOGLE_CLIENT_ID=1018988187094-4b01hm507uanc57p0e6cb5vjk64lfkbb.apps.googleusercontent.com
```

**AFTER:**
```env
VITE_API_BASE_URL=https://bekenppl.vinmedia.my.id/api
VITE_GOOGLE_CLIENT_ID=1018988187094-4b01hm507uanc57p0e6cb5vjk64lfkbb.apps.googleusercontent.com
```

**Revert Command:**
```bash
nano /var/www/PPL-C-2025/frontend/.env
# Change VITE_API_BASE_URL back to api-ppl.vinmedia.my.id
cd /var/www/PPL-C-2025/frontend
npm run build
pm2 restart ppl-frontend
```

---

### 4. Backend CORS - app.js (`/var/www/PPL-C-2025/backend/src/app.js`)

**Line 26-31 BEFORE:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://ppl.vinmedia.my.id',
  process.env.FRONTEND_URL
].filter(Boolean);
```

**Line 26-31 AFTER:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://ppl.vinmedia.my.id',
  'https://frontenppl.vinmedia.my.id',
  process.env.FRONTEND_URL
].filter(Boolean);
```

**Revert Command:**
```bash
nano /var/www/PPL-C-2025/backend/src/app.js
# Remove 'https://frontenppl.vinmedia.my.id', line
pm2 restart ppl-backend
```

---

### 5. Backend CORS & CSP - server.js (`/var/www/PPL-C-2025/backend/src/server.js`)

**Line 42-54 BEFORE (CSP connectSrc):**
```javascript
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://localhost:5001",
        "ws://localhost:5000",
        "ws://localhost:5001",
        "https://api-ppl.vinmedia.my.id",
        "wss://api-ppl.vinmedia.my.id",
        "ws://api-ppl.vinmedia.my.id",
      ],
```

**Line 42-54 AFTER:**
```javascript
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://localhost:5001",
        "ws://localhost:5000",
        "ws://localhost:5001",
        "https://api-ppl.vinmedia.my.id",
        "wss://api-ppl.vinmedia.my.id",
        "ws://api-ppl.vinmedia.my.id",
        "https://bekenppl.vinmedia.my.id",
        "wss://bekenppl.vinmedia.my.id",
        "ws://bekenppl.vinmedia.my.id",
      ],
```

**Line 114-119 BEFORE (CORS allowedOrigins):**
```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "https://ppl.vinmedia.my.id",
  process.env.FRONTEND_URL,
].filter(Boolean);
```

**Line 114-119 AFTER:**
```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "https://ppl.vinmedia.my.id",
  "https://frontenppl.vinmedia.my.id",
  process.env.FRONTEND_URL,
].filter(Boolean);
```

**Revert Command:**
```bash
nano /var/www/PPL-C-2025/backend/src/server.js
# Remove bekenppl and frontenppl lines
pm2 restart ppl-backend
```

---

### 6. Mock Payment Gateway (`/var/www/PPL-C-2025/backend/public/mock-payment/index.html`)

**Line 717-725 BEFORE (Webhook):**
```javascript
        const response = await fetch('https://api-ppl.vinmedia.my.id/api/payments/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        });
```

**Line 717-725 AFTER:**
```javascript
        // Use current backend domain (works with any domain)
        const backendUrl = window.location.origin;
        const response = await fetch(`${backendUrl}/api/payments/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        });
```

**Line 762-765 BEFORE (Redirect):**
```javascript
    // Redirect back
    function redirectBack() {
      // Redirect to frontend app
      window.location.href = 'https://ppl.vinmedia.my.id/orders';
    }
```

**Line 762-774 AFTER:**
```javascript
    // Redirect back
    async function redirectBack() {
      // Fetch frontend URL from config server
      try {
        const configResponse = await fetch('https://config.vinmedia.my.id/config.json');
        const config = await configResponse.json();
        window.location.href = `${config.frontend}/orders`;
      } catch (error) {
        console.error('Failed to load config, using fallback URL');
        window.location.href = 'https://frontenppl.vinmedia.my.id/orders';
      }
    }
```

**Revert Command:**
```bash
nano /var/www/PPL-C-2025/backend/public/mock-payment/index.html
# Revert webhook to use hardcoded URL
# Revert redirectBack to use hardcoded URL
pm2 restart ppl-backend
```

---

### 7. Swagger Config (`/var/www/PPL-C-2025/backend/src/config/swagger.js`)

**Line 11-14 BEFORE:**
```javascript
    servers: [
      { url: 'http://localhost:5000', description: 'Development Server' },
      { url: 'https://api-ppl.vinmedia.my.id', description: 'Production Server' }
    ],
```

**Line 11-15 AFTER:**
```javascript
    servers: [
      { url: 'http://localhost:5000', description: 'Development Server' },
      { url: 'https://bekenppl.vinmedia.my.id', description: 'Production Server' },
      { url: 'https://api-ppl.vinmedia.my.id', description: 'Production Server (Old)' }
    ],
```

**Revert Command:**
```bash
nano /var/www/PPL-C-2025/backend/src/config/swagger.js
# Remove bekenppl line, keep only api-ppl
pm2 restart ppl-backend
```

---

### 8. Socket.IO CORS (`/var/www/PPL-C-2025/backend/src/modules/chat/infrastructure/services/SocketService.js`)

**Line 35-42 BEFORE:**
```javascript
        const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:5001",
            "http://localhost:5137",
            "https://api-ppl.vinmedia.my.id",
            "http://api-ppl.vinmedia.my.id"
        ];
```

**Line 35-44 AFTER:**
```javascript
        const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:5001",
            "http://localhost:5137",
            "https://api-ppl.vinmedia.my.id",
            "http://api-ppl.vinmedia.my.id",
            "https://bekenppl.vinmedia.my.id",
            "https://frontenppl.vinmedia.my.id"
        ];
```

**Revert Command:**
```bash
nano /var/www/PPL-C-2025/backend/src/modules/chat/infrastructure/services/SocketService.js
# Remove bekenppl and frontenppl lines
pm2 restart ppl-backend
```

---

## 🔧 DNS Records (Cloudflare)

**Added CNAME Records:**
```
Type: CNAME
Name: frontenppl
Content: 152617a3-4850-4c03-b4b8-03d9ff410b02.cfargotunnel.com
Proxy: Proxied

Type: CNAME
Name: bekenppl
Content: 152617a3-4850-4c03-b4b8-03d9ff410b02.cfargotunnel.com
Proxy: Proxied

Type: CNAME
Name: config
Content: 152617a3-4850-4c03-b4b8-03d9ff410b02.cfargotunnel.com
Proxy: Proxied
```

**To Revert:** Delete these CNAME records from Cloudflare dashboard

---

## 🔄 Full Revert Procedure

### Step 1: Revert Config Server
```bash
nano /var/www/config-server/config.json
```
Change:
```json
{
  "backend": "https://api-ppl.vinmedia.my.id",
  "frontend": "https://ppl.vinmedia.my.id",
  "version": "1.0",
  "updated_at": "2025-12-27T12:00:00Z"
}
```

### Step 2: Revert Cloudflare Tunnel
```bash
nano /root/.cloudflared/ppl-config.yml
```
Uncomment old domains, comment new ones:
```yaml
  # Frontend - ppl.vinmedia.my.id
  - hostname: ppl.vinmedia.my.id
    service: http://localhost:5173
    originRequest:
      noTLSVerify: true

  # API - api-ppl.vinmedia.my.id
  - hostname: api-ppl.vinmedia.my.id
    service: http://localhost:5001
    originRequest:
      noTLSVerify: true

  # OLD DOMAINS (keep commented if not reverting)
  # - hostname: frontenppl.vinmedia.my.id
  #   service: http://localhost:5173
  # - hostname: bekenppl.vinmedia.my.id
  #   service: http://localhost:5001
```

Restart:
```bash
sudo systemctl restart cloudflared-ppl.service
```

### Step 3: Revert Frontend
```bash
nano /var/www/PPL-C-2025/frontend/.env
```
Change `VITE_API_BASE_URL=https://api-ppl.vinmedia.my.id/api`

Rebuild:
```bash
cd /var/www/PPL-C-2025/frontend
npm run build
pm2 restart ppl-frontend
```

### Step 4: Revert Backend Files
```bash
# Remove new domains from CORS
nano /var/www/PPL-C-2025/backend/src/app.js
nano /var/www/PPL-C-2025/backend/src/server.js
nano /var/www/PPL-C-2025/backend/src/modules/chat/infrastructure/services/SocketService.js

# Revert mock payment to hardcoded URLs
nano /var/www/PPL-C-2025/backend/public/mock-payment/index.html

# Revert swagger config
nano /var/www/PPL-C-2025/backend/src/config/swagger.js

# Restart backend
pm2 restart ppl-backend
```

### Step 5: Update Google Cloud Console OAuth
Remove authorized origins & redirect URIs:
- `https://frontenppl.vinmedia.my.id`
- `https://frontenppl.vinmedia.my.id/login`
- `https://frontenppl.vinmedia.my.id/register`

Keep:
- `https://ppl.vinmedia.my.id`
- `https://ppl.vinmedia.my.id/login`
- `https://ppl.vinmedia.my.id/register`

### Step 6: (Optional) Delete DNS Records
Remove from Cloudflare:
- `frontenppl.vinmedia.my.id`
- `bekenppl.vinmedia.my.id`
- `config.vinmedia.my.id` (if not needed)

---

## ✅ Full Re-Apply Procedure (Use New Domains Again)

### Step 1: Update Config Server
```bash
nano /var/www/config-server/config.json
```
```json
{
  "backend": "https://bekenppl.vinmedia.my.id",
  "frontend": "https://frontenppl.vinmedia.my.id",
  "version": "1.1",
  "updated_at": "2025-12-27T18:45:00Z"
}
```

### Step 2: Update Cloudflare Tunnel
```bash
nano /root/.cloudflared/ppl-config.yml
```
Enable new domains, disable old ones (see "AFTER" section above)
```bash
sudo systemctl restart cloudflared-ppl.service
```

### Step 3: Update Frontend
```bash
nano /var/www/PPL-C-2025/frontend/.env
```
Change `VITE_API_BASE_URL=https://bekenppl.vinmedia.my.id/api`
```bash
cd /var/www/PPL-C-2025/frontend
npm run build
pm2 restart ppl-frontend
```

### Step 4: Update Backend (Apply all changes above)
```bash
pm2 restart ppl-backend
```

### Step 5: Update Google OAuth
Add to Google Cloud Console:
- Authorized origins: `https://frontenppl.vinmedia.my.id`
- Redirect URIs: `https://frontenppl.vinmedia.my.id/*`

---

## 📝 Testing Checklist

### After Migration:
- [ ] Config server accessible: `curl https://config.vinmedia.my.id/config.json`
- [ ] Frontend loads: `https://frontenppl.vinmedia.my.id`
- [ ] Backend API works: `curl https://bekenppl.vinmedia.my.id/api/health`
- [ ] Login works (no CORS error)
- [ ] Google OAuth works
- [ ] Mock payment gateway works
- [ ] Socket.IO connections work
- [ ] Swagger docs accessible: `https://bekenppl.vinmedia.my.id/api-docs`

### After Revert:
- [ ] Frontend loads: `https://ppl.vinmedia.my.id`
- [ ] Backend API works: `curl https://api-ppl.vinmedia.my.id/api/health`
- [ ] Login works
- [ ] Google OAuth works
- [ ] All features functional

---

## 🎯 Quick Commands Reference

**Check current config:**
```bash
# Config server
curl https://config.vinmedia.my.id/config.json

# Cloudflare tunnel status
systemctl status cloudflared-ppl.service

# PM2 status
pm2 status

# Current frontend .env
cat /var/www/PPL-C-2025/frontend/.env
```

**Restart services:**
```bash
# Restart all
pm2 restart ppl-frontend ppl-backend
sudo systemctl restart cloudflared-ppl.service

# Rebuild frontend
cd /var/www/PPL-C-2025/frontend && npm run build && pm2 restart ppl-frontend
```

**View logs:**
```bash
# Frontend logs
pm2 logs ppl-frontend --lines 50

# Backend logs
pm2 logs ppl-backend --lines 50

# Cloudflare tunnel logs
journalctl -u cloudflared-ppl.service -f
```

---

## 📌 Important Notes

1. **Frontend requires rebuild** after .env changes (Vite bakes env vars at build time)
2. **Browser cache** must be cleared or hard refresh required
3. **Google OAuth** must be updated in Google Cloud Console manually
4. **Config server** dapat digunakan untuk ganti backend URL tanpa rebuild (future improvement)
5. **Old domains** kept in CORS for backward compatibility
6. **DNS propagation** may take 5-10 minutes

---

## 🚨 Troubleshooting

**CORS Error:**
- Check backend CORS config includes new frontend domain
- Restart backend: `pm2 restart ppl-backend`
- Clear browser cache

**Login hits old domain:**
- Rebuild frontend: `cd /var/www/PPL-C-2025/frontend && npm run build`
- Restart frontend: `pm2 restart ppl-frontend`
- Hard refresh browser (Ctrl+Shift+R)

**Google OAuth Error 400:**
- Update Google Cloud Console authorized origins
- Add redirect URIs for new domain
- Wait 5 minutes for Google to propagate

**Config server 404:**
- Check nginx config: `/etc/nginx/sites-enabled/config-server`
- Check cloudflared tunnel routing
- Verify port 8083 listening: `ss -tulpn | grep 8083`

---

**Last Updated:** 2025-12-27 19:00 WIB
**Author:** Claude Sonnet 4.5
**Status:** ✅ Applied & Tested

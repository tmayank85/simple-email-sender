# Simple Backend URL Configuration

## What was changed:

### 1. Created Environment File
- `.env` file with `VITE_BACKEND_URL=https://simple-email-sender-mediator.vercel.app`

### 2. Updated All Services to use Backend URL + /api pattern:
- **AuthService.ts**: All authentication endpoints now use `${BACKEND_URL}/api/auth/...`
- **EmailService.ts**: All email service endpoints now use `${BACKEND_URL}/api/...`
- **AdminAuthContext.tsx**: Admin login now uses `${BACKEND_URL}/api/admin/login`
- **AdminPage.tsx**: All admin CRUD operations now use `${BACKEND_URL}/api/admin/...`
- **MainPage.tsx**: Health check now uses `${BACKEND_URL}/api/health/comprehensive`

## How it works:
- Instead of `/api/auth/login` → `https://simple-email-sender-mediator.vercel.app/api/auth/login`
- Instead of `/api/send-email` → `https://simple-email-sender-mediator.vercel.app/api/send-email`
- And so on for all API endpoints...

## For deployment:
1. The `.env` file will automatically be used by Vite
2. All API calls will now go directly to your backend server
3. No more 404 errors on Vercel!

## To deploy:
```bash
git add .
git commit -m "Use backend URL for all API calls"
git push
```

Your app should now work on both localhost and Vercel deployment! 🎉

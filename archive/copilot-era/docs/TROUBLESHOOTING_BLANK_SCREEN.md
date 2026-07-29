# 🚨 Blank Screen Troubleshooting Guide

## Problem: "I get a blank website"

This happens **too often** because both servers need to be running simultaneously.

---

## ✅ QUICK FIX (30 seconds)

### Option 1: Use the Startup Script (EASIEST)
```powershell
.\START_DASHBOARD.ps1
```
This automatically starts both servers and opens your browser.

### Option 2: Manual Start (2 terminals)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\JimBLogic\AustrianBusinessCycleMonitor-1
python -m apps.dashboard.webapp
```
Wait until you see: `Running on http://127.0.0.1:5002`

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\JimBLogic\AustrianBusinessCycleMonitor-1\packages\frontend
npm run dev
```
Wait until you see: `Local: http://127.0.0.1:8080/`

**Then open:** http://127.0.0.1:8080 (or 8081 if 8080 is busy)

---

## 🔍 Root Causes & Solutions

### Cause 1: Backend Not Running
**Symptom:** Blank white screen, browser console shows "ERR_CONNECTION_REFUSED"

**Solution:**
```powershell
# In a new PowerShell terminal:
cd C:\Users\JimBLogic\AustrianBusinessCycleMonitor-1
python -m apps.dashboard.webapp
```

**How to verify:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:5002/api/status" | ConvertTo-Json -Depth 5
```
Should return JSON data, not an error.

---

### Cause 2: Frontend Not Running
**Symptom:** "This site can't be reached" or connection refused on port 8080

**Solution:**
```powershell
# In a new PowerShell terminal:
cd C:\Users\JimBLogic\AustrianBusinessCycleMonitor-1\packages\frontend
npm run dev
```

**How to verify:**
Look for this message:
```
➜  Local:   http://127.0.0.1:8080/
```

---

### Cause 3: Port Already in Use
**Symptom:** "Port 8080 is in use, trying another one..."

**Solution:** Frontend automatically uses port 8081 instead.
**Action:** Open **http://127.0.0.1:8081** instead of 8080

---

### Cause 4: i18n Loading Issue (Fixed!)
**Symptom:** Blank screen, console shows "Suspense" errors

**Status:** ✅ **FIXED** in latest version
- Changed `useSuspense: false` in i18n.ts
- Removed React.Suspense wrapper from main.tsx
- i18n now loads synchronously

**If still happening:**
```powershell
cd packages\frontend
npm run build
```

---

### Cause 5: Build Files Not Generated
**Symptom:** 404 errors in browser console

**Solution:**
```powershell
cd packages\frontend
npm run build
```

---

### Cause 6: Browser Cache
**Symptom:** Old version loads or partial blank screen

**Solution:**
1. Press **Ctrl + Shift + R** (hard refresh)
2. Or press **F12** → **Network** tab → Check "Disable cache"
3. Or clear browser cache completely

---

## 🧪 Diagnostic Checklist

Run these commands to diagnose issues:

### 1. Check if Backend is Running
```powershell
Get-Process | Where-Object {$_.ProcessName -match "python"}
```
Should show python.exe process.

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:5002/api/status" | ConvertTo-Json -Depth 5
```
Should return `{"status":"healthy"}`

### 2. Check if Frontend is Running
```powershell
Get-Process | Where-Object {$_.ProcessName -match "node"}
```
Should show node.exe process.

### 3. Check What Port Frontend is Using
Look at the terminal output for:
```
➜  Local:   http://127.0.0.1:8080/
```
or
```
Port 8080 is in use, trying another one...
➜  Local:   http://127.0.0.1:8081/
```

### 4. Check Browser Console (F12)
Open browser dev tools (F12) and look for:
- ❌ Red errors about "ERR_CONNECTION_REFUSED" → Backend not running
- ❌ 404 errors → Wrong URL or frontend not built
- ❌ "Failed to fetch" → API connection issue
- ✅ No errors → Should be working!

---

## 🎯 Prevention Tips

### Always Start Both Servers
The dashboard needs **TWO** servers:
1. **Backend (Flask)** on port 5002 - Provides API data
2. **Frontend (Vite)** on port 8080/8081 - Serves the UI

### Use the Startup Script
```powershell
.\START_DASHBOARD.ps1
```
This starts both servers automatically in separate windows.

### Check Before Coding
Before making changes, verify both servers are running:
```powershell
# Backend check:
curl http://127.0.0.1:5002/api/status

# Frontend check (look for "ready in"):
# Check the terminal running "npm run dev"
```

---

## 🆘 Still Not Working?

### Nuclear Option (Start Fresh)
```powershell
# Kill all processes
Get-Process python,node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 5 seconds
Start-Sleep -Seconds 5

# Rebuild frontend
cd packages\frontend
npm run build

# Start backend
cd ..\..
python -m apps.dashboard.webapp
# Wait until "Running on http://127.0.0.1:5002"

# In NEW terminal, start frontend
cd packages\frontend
npm run dev
# Wait until "Local: http://127.0.0.1:8080/"

# Open browser
Start-Process "http://127.0.0.1:8080"
```

### Check for Port Conflicts
```powershell
# See what's using port 8080
netstat -ano | findstr :8080

# See what's using port 5002
netstat -ano | findstr :5002

# If something else is using these ports, kill it:
# Stop-Process -Id <PID> -Force
```

---

## 📋 Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Blank white screen | Start backend: `python -m apps.dashboard.webapp` |
| "Can't reach site" | Start frontend: `npm run dev` in packages/frontend |
| Port 8080 in use | Use port 8081: http://127.0.0.1:8081 |
| Old version loading | Hard refresh: **Ctrl + Shift + R** |
| Translation issues | Already fixed in i18n.ts (useSuspense: false) |
| Both servers running but blank | Check browser console (F12) for errors |

---

## 🎉 Success Checklist

✅ Backend terminal shows: `Running on http://127.0.0.1:5002`  
✅ Frontend terminal shows: `Local: http://127.0.0.1:8080/`  
✅ Browser opens to dashboard (not blank)  
✅ Can switch languages with 🇺🇸 🇪🇸 flags  
✅ Data loads (Austrian Score, charts visible)  

**If all 5 checkmarks → YOU'RE GOOD TO GO!** 🚀

---

*This guide was created because blank screens happen "too often". Follow these steps and you'll be back up in 30 seconds!* 💪

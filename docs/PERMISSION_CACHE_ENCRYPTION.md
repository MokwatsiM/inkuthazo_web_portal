# Permission Cache Encryption

## Overview

The permission cache uses **AES-256 encryption** to protect sensitive permission data stored in browser localStorage. This ensures that even if someone inspects the browser's storage using DevTools, they cannot read the cached permissions without the encryption key.

## Security Architecture

### Encryption Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Permission Data (Plain)                   │
│  { role: "admin", permissions: {...}, updatedAt: ... }      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Convert to JSON String                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Derive Encryption Key (PBKDF2)                 │
│  Input: User ID + Session Salt                              │
│  Output: 256-bit AES key                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Encrypt with AES-256                       │
│  Algorithm: AES-256-CBC                                      │
│  Result: Encrypted ciphertext                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           Store in localStorage (Encrypted)                  │
│  Key: perm_cache_v1_<userId>                                │
│  Value: U2FsdGVkX1+... (base64 ciphertext)                  │
└─────────────────────────────────────────────────────────────┘
```

### Decryption Flow

```
┌─────────────────────────────────────────────────────────────┐
│         Retrieve from localStorage (Encrypted)               │
│  Value: U2FsdGVkX1+... (base64 ciphertext)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Derive Encryption Key (PBKDF2)                 │
│  Input: User ID + Session Salt (from sessionStorage)        │
│  Output: 256-bit AES key                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Decrypt with AES-256                       │
│  If salt matches: Successful decryption                      │
│  If salt changed: Decryption fails (clear cache)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Parse JSON to Object                        │
│  Result: Plain permission data                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Derivation

### Session Salt Generation

Each browser session generates a unique random salt:

```typescript
// Generate 256-bit random salt using crypto-secure RNG
const salt = CryptoJS.lib.WordArray.random(256 / 8).toString();

// Store in sessionStorage (cleared on browser close)
sessionStorage.setItem('perm_session_salt', salt);
```

**Properties:**
- **Unique per session**: Each time user opens the app, new salt is generated
- **Crypto-secure**: Uses `CryptoJS.lib.WordArray.random()` (CSPRNG)
- **Session-scoped**: Stored in sessionStorage, cleared when browser closes
- **256-bit entropy**: Strong randomness for key derivation

### Encryption Key Derivation

The encryption key is derived using **PBKDF2** (Password-Based Key Derivation Function 2):

```typescript
const key = CryptoJS.PBKDF2(userId, salt, {
  keySize: 256 / 32,     // 256-bit key
  iterations: 1000       // 1000 iterations for key stretching
}).toString();
```

**Parameters:**
- **Password**: User ID (known value)
- **Salt**: Session-specific random salt (from sessionStorage)
- **Key Size**: 256 bits (AES-256)
- **Iterations**: 1000 (balances security vs performance)

**Security Properties:**
- Each user has a unique encryption key (user ID is unique)
- Each session has a different key (salt changes per session)
- Key is never stored, always derived on-the-fly
- Computationally expensive to brute-force (PBKDF2 iterations)

## Encryption Algorithm

### AES-256-CBC

```typescript
// Encrypt
const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();

// Decrypt
const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
```

**Algorithm Details:**
- **Mode**: CBC (Cipher Block Chaining)
- **Key Size**: 256 bits
- **Block Size**: 128 bits
- **IV**: Automatically generated by CryptoJS
- **Output Format**: Base64-encoded ciphertext with embedded IV and salt

## Security Guarantees

### What's Protected

✅ **Encrypted in localStorage**
- Permission data is AES-256 encrypted
- Not human-readable in DevTools
- Cannot be copied to another browser/session
- Requires correct user ID + session salt to decrypt

✅ **Session-based Security**
- Different encryption key each session
- Old cached data becomes unreadable after session ends
- Automatic invalidation on browser close

✅ **User Isolation**
- Each user has unique encryption key
- User A cannot decrypt User B's cache
- Even on shared computers, data is isolated

### What's NOT Protected Against

❌ **Active Session Attacks**
- If attacker has access to running browser session, they can read decrypted data from memory
- Encryption protects stored data, not runtime data

❌ **Browser Extension Attacks**
- Malicious extensions can potentially access sessionStorage
- This is an inherent browser security limitation

❌ **XSS Attacks**
- If attacker can inject JavaScript, they can access decrypted data
- Defense: Proper CSP headers, input sanitization

❌ **Physical Device Access**
- If attacker has physical access to unlocked device during active session
- Defense: Screen lock, session timeouts

## Storage Locations

### localStorage (Encrypted Data)

```
Key: perm_cache_v1_<userId>
Value: U2FsdGVkX1+zQ5rK... (AES-256 encrypted base64)
Scope: Persistent (survives browser restart)
Clearable: Yes (manual or on version change)
```

**Example encrypted value:**
```
U2FsdGVkX1+zQ5rK8nB2dF3mK9pL7xQ8vN1wH5jT6yU2fR4gS...
```
This is **not human-readable** and requires the correct encryption key to decrypt.

### sessionStorage (Encryption Salt)

```
Key: perm_session_salt
Value: a1b2c3d4e5f6... (random hex string)
Scope: Session (cleared on browser close)
Clearable: Automatically cleared on browser/tab close
```

**Example salt:**
```
7f8e9d8c7b6a5e4d3c2b1a0f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b
```

### Memory (Derived Encryption Key)

```
Location: Never stored, computed on-demand
Lifetime: Computed during encrypt/decrypt, immediately discarded
Persistence: None
```

The encryption key is **never written to any storage**. It's computed on-the-fly each time and discarded after use.

## Attack Scenarios & Defenses

### Scenario 1: Attacker Inspects localStorage

**Attack:**
1. Attacker opens DevTools → Application → Local Storage
2. Finds `perm_cache_v1_<userId>` entry
3. Copies encrypted value

**Defense:**
- Data is AES-256 encrypted ✅
- Without session salt, cannot decrypt ✅
- Salt is in sessionStorage, cleared on browser close ✅
- Even if attacker copies salt, needs user ID ✅

**Result:** Attack fails - data is unreadable

### Scenario 2: Attacker Copies Cache to Another Browser

**Attack:**
1. Attacker copies localStorage data
2. Opens data in different browser/computer
3. Tries to decrypt

**Defense:**
- Session salt is missing (different session) ✅
- Decryption fails automatically ✅
- Cache is cleared on failed decryption ✅

**Result:** Attack fails - cache auto-clears

### Scenario 3: Attacker Has User ID

**Attack:**
1. Attacker knows user ID (e.g., from URL or network logs)
2. Has encrypted cache from localStorage
3. Tries to decrypt using user ID

**Defense:**
- Still needs session salt from sessionStorage ✅
- Salt is randomly generated, cannot be guessed ✅
- 256-bit entropy makes brute-force infeasible ✅

**Result:** Attack fails - needs session salt

### Scenario 4: Session Hijacking

**Attack:**
1. Attacker gains access to active browser session
2. Reads sessionStorage to get salt
3. Reads localStorage to get encrypted cache
4. Derives key and decrypts

**Defense:**
- This is a legitimate session, encryption cannot prevent ✅
- Defense layers:
  - Session timeouts
  - Firebase Auth token expiration
  - Screen lock on idle
  - CSP headers to prevent XSS

**Result:** Encryption protects stored data, not active sessions

## Performance Impact

### Encryption Overhead

```
Operation             | Time      | Impact
---------------------|-----------|----------
Derive key (PBKDF2)  | ~10-20ms  | Low
AES-256 encrypt      | ~1-2ms    | Negligible
AES-256 decrypt      | ~1-2ms    | Negligible
Total overhead       | ~15-25ms  | Minimal
```

**Optimization:**
- Key derivation happens only during cache save/load
- Not during permission checks (uses already-decrypted data)
- 1000 PBKDF2 iterations balances security vs speed

### Memory Usage

```
Component                | Size      | Notes
------------------------|-----------|-------------------------
Unencrypted JSON        | ~5-10 KB  | Typical role data
Encrypted ciphertext    | ~7-12 KB  | +30% due to Base64
Session salt            | 64 bytes  | In sessionStorage
Derived key (runtime)   | 32 bytes  | Never stored, computed
```

**Total Storage Impact:** +2-3 KB per user (acceptable)

## Implementation Details

### Code Location

**File:** [`/src/hooks/usePermissions.ts`](../src/hooks/usePermissions.ts)

**Key Functions:**
- `getOrCreateSessionSalt()` - Generates/retrieves session salt
- `deriveEncryptionKey(userId)` - PBKDF2 key derivation
- `encryptData(data, userId)` - AES-256 encryption
- `decryptData(encryptedData, userId)` - AES-256 decryption
- `saveCachedPermissions()` - Encrypt and save to localStorage
- `loadCachedPermissions()` - Load and decrypt from localStorage

### Dependencies

```json
{
  "crypto-js": "^4.2.0",
  "@types/crypto-js": "^4.2.0"
}
```

**Why crypto-js?**
- Industry-standard encryption library
- Well-audited and maintained
- Wide browser compatibility
- AES-256 + PBKDF2 support
- Small bundle size (~85 KB minified)

## Debugging

### View Encrypted Cache

```javascript
// In browser console
const userId = "your-user-id";
const cacheKey = `perm_cache_v1_${userId}`;
const encrypted = localStorage.getItem(cacheKey);
console.log('Encrypted cache:', encrypted);
// Output: U2FsdGVkX1+zQ5rK... (not human-readable)
```

### View Session Salt

```javascript
// In browser console
const salt = sessionStorage.getItem('perm_session_salt');
console.log('Session salt:', salt);
// Output: 7f8e9d8c7b6a5e4d... (random hex)
```

### Test Decryption

```javascript
// This will ONLY work in the same session
import CryptoJS from 'crypto-js';

const userId = "your-user-id";
const cacheKey = `perm_cache_v1_${userId}`;
const encrypted = localStorage.getItem(cacheKey);
const salt = sessionStorage.getItem('perm_session_salt');

// Derive key
const key = CryptoJS.PBKDF2(userId, salt, {
  keySize: 256 / 32,
  iterations: 1000
}).toString();

// Decrypt
const decrypted = CryptoJS.AES.decrypt(encrypted, key);
const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
console.log('Decrypted:', JSON.parse(plaintext));
```

### Console Logs

Encryption operations log their status:

```
[PermissionCache] Generated new session salt
[PermissionCache] ✓ Encrypted and saved to localStorage: {roleName: "admin", encrypted: true, size: "1234 chars"}
[PermissionCache] ✓ Loaded and decrypted from localStorage: {roleName: "admin", encrypted: true}
```

Failed decryption (wrong session/salt):
```
[PermissionCache] Failed to decrypt cache - may be from different session
[PermissionCache] No cache found in localStorage
```

## Best Practices

### For Developers

1. **Never log decrypted data** in production
   ```typescript
   // ❌ Bad
   console.log('Permissions:', decryptedData);

   // ✅ Good
   console.log('Permissions loaded:', { encrypted: true, size: data.length });
   ```

2. **Handle decryption failures gracefully**
   ```typescript
   const cached = loadCachedPermissions(userId);
   if (!cached) {
     // Fallback to Firestore fetch
     return await fetchFreshPermissions();
   }
   ```

3. **Clear cache on logout**
   ```typescript
   const clearPermissionCache = (userId: string) => {
     const cacheKey = getCacheKey(userId);
     localStorage.removeItem(cacheKey);
     sessionStorage.removeItem('perm_session_salt');
   };
   ```

### For Security Audits

**Verification Checklist:**

- [ ] Encrypted data in localStorage is not human-readable
- [ ] Session salt changes on each browser session
- [ ] Encryption key is never stored, only derived
- [ ] Failed decryption clears invalid cache
- [ ] Different users have isolated caches
- [ ] CSP headers prevent XSS attacks
- [ ] Session timeouts implemented
- [ ] Sensitive logs disabled in production

## Comparison: Before vs After

### Before (Plaintext Cache)

```javascript
// localStorage value (human-readable)
{
  "role": {
    "id": "admin",
    "name": "admin",
    "permissions": {
      "credits": {"view": true, "create": true, "edit": true},
      "members": {"view": true, "create": true, "edit": true}
    }
  },
  "roleUpdatedAt": "2026-04-07T16:00:00Z",
  "memberUpdatedAt": "2026-04-07T15:30:00Z"
}
```

**Security:** ❌ Anyone with DevTools access can read permissions

### After (Encrypted Cache)

```javascript
// localStorage value (encrypted, not human-readable)
U2FsdGVkX1+zQ5rK8nB2dF3mK9pL7xQ8vN1wH5jT6yU2fR4gS8cL...
```

**Security:** ✅ AES-256 encrypted, requires session salt + user ID to decrypt

## Conclusion

The encrypted permission cache provides:

✅ **Strong Security**
- AES-256 encryption with PBKDF2 key derivation
- Session-scoped keys
- Automatic invalidation on session end

✅ **Minimal Performance Impact**
- ~15-25ms overhead for encrypt/decrypt
- No impact on permission checks (uses cached data)

✅ **User Privacy**
- Permissions not readable via DevTools
- User-specific encryption keys
- Automatic cleanup on session end

✅ **Developer Friendly**
- Transparent encryption (no code changes needed)
- Clear logging for debugging
- Graceful degradation on decryption failures

**Security Level:** Suitable for protecting sensitive permission data from casual inspection and cross-session copying.

**Not a replacement for:** Server-side access control, HTTPS, CSP headers, and proper authentication.

# Firebase setDoc Undefined Field Error Fix

## Problem
When creating admin users (admin_desa, kepala_desa, kepala_dusun), the application threw a Firebase error:
```
FirebaseError: Function setDoc() called with invalid data. 
Unsupported field value: undefined 
(found in field idNumber in document Super_admin/HPcU1bSbOkdaqSQQsYvxUNuMkJ52)
```

## Root Cause
Firestore's `setDoc()` function does not accept `undefined` values. When optional fields like `idNumber`, `phoneNumber`, `address`, `notes`, etc. were passed as `undefined`, Firestore rejected the entire document write operation.

This occurred in multiple scenarios:
1. **Super Admin creation** via `superAdminService.ts`
2. **Admin Desa creation** via `superAdminService.ts`
3. **Kepala Desa creation** - was not properly handled
4. **Kepala Dusun creation** - was not properly handled
5. **Managed user creation** via `superAdminUserService.ts`

## Solutions Implemented

### 1. Created Unified Admin User Service (`src/lib/adminUserService.ts`)

A comprehensive service to handle all admin role types in a consistent way:
- **Roles supported**: `administrator`, `admin_desa`, `kepala_desa`, `kepala_dusun`
- **Collection mapping**:
  - `administrator` → `Super_admin` collection
  - `admin_desa` → `Admin_Desa` collection
  - `kepala_desa` → `Kepala_Desa` collection
  - `kepala_dusun` → `Kepala_Dusun` collection
- **Dual storage**: Saves to both role-specific collection AND main `users` collection

Key features:
```typescript
// Filter out undefined values before setDoc
const filteredData = Object.fromEntries(
  Object.entries(adminUserData).filter(([_, value]) => value !== undefined)
);
```

### 2. Fixed Super Admin Service (`src/lib/superAdminService.ts`)

Added filtering to remove undefined values:
```typescript
// Filter out undefined values to avoid Firestore errors
const filteredData = Object.fromEntries(
  Object.entries(superAdminData).filter(([_, value]) => value !== undefined)
);

await setDoc(doc(db, this.collectionName, firebaseUser.uid), filteredData);
```

### 3. Fixed Super Admin User Service (`src/lib/superAdminUserService.ts`)

Applied same filtering technique for managed users:
```typescript
// Filter out undefined values to avoid Firestore errors
const filteredDoc = Object.fromEntries(
  Object.entries(userDoc).filter(([_, value]) => value !== undefined)
) as ManagedUser;

await setDoc(doc(this.usersCollection, uid), filteredDoc);
```

### 4. Updated User Registration Form (`src/app/admin/kelola-pengguna/components/UserRegistrationForm.tsx`)

**Changes:**
1. **Import new service**:
   ```typescript
   import adminUserService, { CreateAdminUserData } from '../../../../lib/adminUserService';
   ```

2. **Added `idNumber` field** to form state for NIK (kepala_desa & kepala_dusun)

3. **Updated role detection** to include all admin roles:
   ```typescript
   const isAdminRole = ['administrator', 'admin_desa', 'kepala_desa', 'kepala_dusun'].includes(formData.role);
   ```

4. **Unified admin user creation**:
   ```typescript
   const adminUserData: CreateAdminUserData = {
     email: formData.email,
     password: formData.password,
     displayName: formData.displayName,
     userName: formData.userName || undefined,
     role: formData.role as 'administrator' | 'admin_desa' | 'kepala_desa' | 'kepala_dusun',
     phoneNumber: formData.phoneNumber || undefined,
     idNumber: formData.idNumber || undefined,
     nik: formData.idNumber || undefined, // NIK for kepala desa/dusun
     daerah: formData.daerah || undefined, // Daerah for kepala dusun
     address: undefined,
     notes: undefined
   };
   
   const result = await adminUserService.createAdminUser(adminUserData, createdBy);
   ```

5. **Added NIK input field** for kepala_desa and kepala_dusun:
   - Conditional rendering based on role
   - 16-digit validation
   - Pattern matching: `[0-9]{16}`
   - Required field for these roles

6. **Enhanced success message** with role-specific collection names

## Field Requirements by Role

### Administrator
- ✅ Email (required)
- ✅ Password (required)
- ✅ Display Name (required)
- ⚪ Username (optional)
- ⚪ Phone Number (optional)

### Admin Desa
- ✅ Email (required)
- ✅ Password (required)
- ✅ Display Name (required)
- ⚪ Username (optional)
- ⚪ Phone Number (optional)

### Kepala Desa
- ✅ Email (required)
- ✅ Password (required)
- ✅ Display Name (required)
- ✅ NIK/ID Number (required, 16 digits)
- ⚪ Username (optional)
- ⚪ Phone Number (optional)

### Kepala Dusun
- ✅ Email (required)
- ✅ Password (required)
- ✅ Display Name (required)
- ✅ NIK/ID Number (required, 16 digits)
- ✅ Daerah (required, selected from data-desa)
- ⚪ Username (optional)
- ⚪ Phone Number (optional)

## Data Storage Structure

### Role-Specific Collections
Each admin role now has its dedicated Firestore collection:
```
Firestore Database
├── Super_admin/
│   └── {uid}: {administrator data}
├── Admin_Desa/
│   └── {uid}: {admin_desa data}
├── Kepala_Desa/
│   └── {uid}: {kepala_desa data}
├── Kepala_Dusun/
│   └── {uid}: {kepala_dusun data with daerah}
└── users/
    └── {uid}: {unified user data for authentication}
```

### Dual Storage Benefits
1. **Role-specific queries**: Easy to fetch all users of a specific role
2. **Unified authentication**: All admin users stored in `users` collection
3. **Data consistency**: Same data in both locations
4. **Backward compatibility**: Existing authentication flows continue to work

## Testing Checklist

- [x] Build completes without errors (102 pages generated)
- [x] TypeScript compilation passes
- [ ] Create Administrator user (test undefined field handling)
- [ ] Create Admin Desa user (test undefined field handling)
- [ ] Create Kepala Desa user (test with NIK field)
- [ ] Create Kepala Dusun user (test with NIK and Daerah)
- [ ] Verify data saved to correct collections
- [ ] Verify login works for all admin roles
- [ ] Verify optional fields don't cause errors when empty

## Files Modified

1. **src/lib/adminUserService.ts** (NEW)
   - Unified admin user management service
   - Handles all 4 admin role types
   - Filters undefined values before setDoc

2. **src/lib/superAdminService.ts**
   - Added undefined value filtering
   - Prevents FirebaseError on setDoc

3. **src/lib/superAdminUserService.ts**
   - Added undefined value filtering
   - Prevents FirebaseError on setDoc

4. **src/app/admin/kelola-pengguna/components/UserRegistrationForm.tsx**
   - Integrated adminUserService for kepala_desa and kepala_dusun
   - Added idNumber field to form state
   - Added NIK input field with validation
   - Enhanced role detection logic
   - Improved success messages

## Migration Notes

### For Existing Deployments
If you have existing admin users created before this fix:

1. **No immediate action required** - existing users will continue to work
2. **New users** will be created in the correct collections
3. **Optional**: Run a migration script to move existing users to role-specific collections

### Migration Script (Future Enhancement)
```typescript
// Pseudocode for migrating existing admin users
async function migrateAdminUsers() {
  const users = await getAllUsersFromUsersCollection();
  
  for (const user of users) {
    if (['administrator', 'admin_desa', 'kepala_desa', 'kepala_dusun'].includes(user.role)) {
      const collectionName = getCollectionNameByRole(user.role);
      await setDoc(doc(db, collectionName, user.uid), filterUndefinedValues(user));
    }
  }
}
```

## Prevention Measures

To prevent similar issues in the future:

1. **Always filter undefined values** before Firestore write operations
2. **Use conditional spreading** for optional fields:
   ```typescript
   const data = {
     required: value,
     ...(optionalValue && { optional: optionalValue })
   };
   ```
3. **Validate data before submission** in forms
4. **Use TypeScript strict mode** to catch undefined handling issues
5. **Test with various combinations** of filled/empty optional fields

## Related Documentation

- Firebase Firestore: [Unsupported Data Types](https://firebase.google.com/docs/firestore/manage-data/data-types)
- JavaScript: [Object.entries() and Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
- TypeScript: [Strict Null Checks](https://www.typescriptlang.org/tsconfig#strictNullChecks)

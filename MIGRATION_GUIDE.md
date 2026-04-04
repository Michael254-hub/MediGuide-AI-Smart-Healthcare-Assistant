# MongoDB to Supabase Migration Guide

## ✅ Completed Changes

### 1. **Dependencies Updated**

- ✅ Removed: `mongoose`, `mongodb-memory-server`, `bcryptjs`
- ✅ Added: `@supabase/supabase-js`, `pg`
- Run `npm install` in the server folder (already done)

### 2. **Database Configuration**

- ✅ Updated `config/db.js` to use Supabase client instead of Mongoose
- ✅ Created `config/schema.sql` with PostgreSQL schema definition

### 3. **Data Layer (Repositories)**

- ✅ Updated `repositories/userRepository.js` - now uses Supabase SQL queries
- ✅ Updated `repositories/symptomRepository.js` - now uses Supabase SQL queries
- Field mappings:
  - MongoDB `_id` → PostgreSQL `id` (UUID)
  - MongoDB `userId` → PostgreSQL `user_id`
  - MongoDB `submissionId` → PostgreSQL `submission_id`
  - MongoDB `flaggedEmergency` → PostgreSQL `flagged_emergency`

### 4. **Services Layer**

- ✅ Updated `services/userService.js` - uses bcrypt for password comparison instead of Mongoose method
- ✅ Updated `services/triageService.js` - uses `submission.id` instead of `submission._id`

### 5. **Controllers**

- ✅ Updated `controllers/authController.js` - uses `req.user.id` instead of `req.user._id`
- ✅ Updated `controllers/symptomController.js` - uses `req.user.id` instead of `req.user._id`

### 6. **Server Configuration**

- ✅ Updated `server.js` - properly handles Supabase connection
- ✅ Updated `.env` - uses Supabase credentials instead of MongoDB URI
- ✅ Deprecated model files - kept for reference with schema documentation

---

## ⚠️ REQUIRED SETUP STEPS

### Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region (e.g., us-east-1)
3. Save your project credentials

### Step 2: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `server/config/schema.sql`
3. Create a new query and paste the SQL
4. Execute the query to create all tables and indexes

### Step 3: Update Environment Variables

Update `server/.env` with your Supabase credentials:

```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_super_secret_jwt_key_here
```

**Where to find these:**

- `SUPABASE_URL`: Supabase dashboard → Settings → API → URL
- `SUPABASE_ANON_KEY`: Supabase dashboard → Settings → API → Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase dashboard → Settings → API → Service Role Key (for server-side operations)

### Step 4: Test Connection

```bash
cd server
npm run dev
```

You should see: `✓ Supabase Connected Successfully`

---

## 📊 Data Migration (If You Have Existing MongoDB Data)

If you have existing data in MongoDB and want to migrate it to Supabase:

### Option 1: Manual Export/Import

1. Export data from MongoDB as JSON
2. Import into Supabase using the dashboard or SQL

### Option 2: Create a Migration Script

Create `server/scripts/migrate.js`:

```javascript
const mongoose = require("mongoose");
const { supabase } = require("../config/db");

async function migrateData() {
  try {
    // Connect to old MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    // Fetch data from MongoDB
    const users = await mongoose.connection
      .collection("users")
      .find({})
      .toArray();

    // Transform and insert into Supabase
    // Map _id → id, adjust field names to snake_case
    const transformedUsers = users.map((user) => ({
      id: user._id.toString(), // Keep original ID or use UUID
      name: user.name,
      email: user.email,
      password: user.password, // Already hashed from MongoDB
      phone: user.phone || null,
      role: user.role || "patient",
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    }));

    // Insert into Supabase
    const { error } = await supabase.from("users").insert(transformedUsers);

    if (error) throw error;
    console.log(`✓ Migrated ${transformedUsers.length} users`);

    // Repeat for other collections...
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

migrateData();
```

Run with: `node server/scripts/migrate.js`

---

## 🔄 Key Differences from MongoDB

| Aspect               | MongoDB               | Supabase (PostgreSQL)                  |
| -------------------- | --------------------- | -------------------------------------- |
| **ID Type**          | ObjectId              | UUID                                   |
| **Foreign Keys**     | Mongoose refs         | SQL FOREIGN KEY                        |
| **Arrays**           | Native arrays         | TEXT[] or JSONB                        |
| **Timestamps**       | Automatic (createdAt) | Manual or DEFAULT NOW()                |
| **Password Hashing** | Pre-save hook         | Manual with bcrypt                     |
| **Transactions**     | Mongoose methods      | SQL transactions                       |
| **Relationships**    | Populate/refs         | JOIN queries or Supabase relationships |

---

## 🧪 Testing the Migration

### 1. Test User Registration

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

### 2. Test User Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Verify Data in Supabase

- Go to Supabase dashboard → Table Editor
- Check the `users` table to see the created user

---

## 📝 Important Notes

1. **No Model Files**: You no longer need the Mongoose model files. They're kept for documentation but deprecated.

2. **ID Fields**: All `_id` references have been changed to `id`.

3. **Field Names**: Snake_case is now used in database (`user_id` instead of `userId`).

4. **Password Hashing**: Passwords are hashed using bcrypt before saving in repositories.

5. **Error Handling**: Supabase errors return specific error codes (e.g., `PGRST116` for "not found").

6. **Relations**: Supabase relationships use `select()` with dot notation instead of Mongoose `populate()`.

---

## ❓ Troubleshooting

### "Supabase connection failed"

- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Verify the Supabase project is active
- Check network connectivity to Supabase

### "User table doesn't exist"

- Run the SQL from `config/schema.sql` in Supabase SQL Editor
- Verify tables in Supabase dashboard → Table Editor

### "Invalid email or password"

- Check if user exists in Supabase dashboard
- Verify password was hashed correctly (bcrypt format)

### "Relations not found"

- Ensure foreign keys are set up correctly in schema
- Use proper column names in queries (e.g., `user_id` not `userId`)

---

## 🎉 Next Steps

1. ✅ Set up Supabase project and create schema
2. ✅ Update `.env` with credentials
3. ✅ Test API endpoints
4. ✅ Migrate existing data (if applicable)
5. ✅ Update frontend if needed (API endpoints remain the same)
6. ✅ Deploy to production

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [bcryptjs NPM](https://www.npmjs.com/package/bcrypt)

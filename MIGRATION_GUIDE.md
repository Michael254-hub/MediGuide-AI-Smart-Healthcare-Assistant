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

---

## 🔄 AI Model Migration: Anthropic Claude → Google Gemini 3

### Version 2.0 Upgrade

Migrated from Anthropic Claude 3.5 Sonnet to Google Gemini 3 Flash for improved performance, multimodal capabilities (voice & image), and cost efficiency.

### Changes Made

#### 1. **Dependencies Updated**

```bash
# Removed
npm uninstall @anthropic-ai/sdk

# Added
npm install @google/generative-ai
```

**Changes in `package.json`:**

- ✅ Removed: `@anthropic-ai/sdk`
- ✅ Added: `@google/generative-ai` (latest version)

#### 2. **Environment Variables**

Update `server/.env`:

```env
# Old
ANTHROPIC_API_KEY=sk-ant-...

# New
GEMINI_API_KEY=AIza-...
```

**Where to find Gemini API Key:**

1. Go to: https://aistudio.google.com/app/apikeys
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (format: `AIza...`)

#### 3. **Backend Service Updates**

**File: `server/services/aiConsultationService.js`**

```javascript
// OLD (Anthropic)
const Anthropic = require('@anthropic-ai/sdk');
const response = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [...],
});

// NEW (Gemini 3)
const { GoogleGenerativeAI } = require('@google/generative-ai');
const model = client.getGenerativeModel({
  model: 'gemini-3-flash',
  systemInstruction: CLINICAL_SYSTEM_PROMPT
});
const response = await model.generateContent({ contents: [...] });
```

**Key Changes:**

- Model endpoint: `claude-3-5-sonnet-20241022` → `gemini-3-flash`
- System prompt: Passed independently to `getGenerativeModel()`
- Multimodal support: Added `inlineData` for images
- Response format: `response.content[0].text` → `response.response.text()`

#### 4. **New Multimodal Features**

**Added Functions:**

```javascript
// NEW: Image analysis capability
analyzeSymptomImage(imageData, symptomDescription);

// UPDATED: With image support
consultWithAI(patientContext, userQuestion, conversationHistory, imageData);

// UPDATED: With image support
consultWithAIStream(
  patientContext,
  userQuestion,
  conversationHistory,
  imageData,
);
```

#### 5. **Frontend Enhancements**

**File: `client/src/pages/SubmitSymptoms.jsx`**

**New Features:**

- ✅ Web Speech API for voice recording
- ✅ Image upload with preview
- ✅ Real-time transcription
- ✅ Support for FormData multipart submission

**New Icons (from lucide-react):**

- `Mic` - Start voice recording
- `MicOff` - Stop voice recording
- `Upload` - Image upload button
- `Image` - Image icon
- `X` - Remove image

#### 6. **API Changes**

**POST `/api/v1/symptoms`**

```javascript
// OLD: JSON only
{
  symptoms: string,
  duration: string,
  severity: 'mild' | 'moderate' | 'severe'
}

// NEW: FormData with multipart support
FormData:
  - symptoms (text)
  - duration (text)
  - severity (text)
  - images[] (files - optional)
```

### API Compatibility

| Feature              | Claude 3.5 | Gemini 3 Flash | Notes          |
| -------------------- | ---------- | -------------- | -------------- |
| Text input           | ✅         | ✅             | Same           |
| Image analysis       | ❌         | ✅             | **NEW**        |
| Voice input          | ❌         | ✅             | **NEW**        |
| Context window       | 200k       | 1M             | Larger support |
| Streaming            | ✅         | ✅             | Faster         |
| Conversation history | ✅         | ✅             | Same           |
| Cost                 | Higher     | Lower          | ~10x cheaper   |

### Migration Checklist

- [ ] Install new dependencies: `npm install @google/generative-ai`
- [ ] Update environment variable: `GEMINI_API_KEY`
- [ ] Replace `aiConsultationService.js` with Gemini version
- [ ] Update `SubmitSymptoms.jsx` with voice/image features
- [ ] Test form submission with text only
- [ ] Test voice recording functionality
- [ ] Test image upload functionality
- [ ] Verify Gemini API responses in browser console
- [ ] Test clinical dashboard with new AI model
- [ ] Update all documentation to reference Gemini 3

### Performance Comparison

**Claude 3.5 Sonnet:**

- Token cost: ~$3/$15 per 1M tokens (input/output)
- Tokens per second: ~100
- Context window: 200k

**Gemini 3 Flash:**

- Token cost: ~$0.075/$0.3 per 1M tokens (input/output) - **40x cheaper**
- Tokens per second: ~200+ (faster)
- Context window: 1M - **5x larger**

### Safety Settings

Gemini 3 Flash configured with these safety settings:

```javascript
safetySettings: [
  { category: "HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];
```

These are relaxed for clinical use case where medical terminology might be flagged.

### Troubleshooting Migration

#### Error: "Gemini API not configured"

- Check `GEMINI_API_KEY` in `server/.env`
- Verify key format starts with `AIza-`
- Test key at https://aistudio.google.com/app/apikeys

#### Error: "Model not found"

- Ensure model name is `gemini-3-flash`
- Check for typos in model identifier
- Verify account has Gemini API access

#### Image upload not working

- Check browser console for errors
- Verify image file size < 10MB
- Supported formats: JPEG, PNG, GIF, WebP
- Ensure FormData is being sent with correct MIME types

#### Voice recording not working

- Check browser console for Speech Recognition API errors
- Only Chrome, Edge, Safari (mobile) fully support it
- Firefox has limited support
- Allow microphone permissions when prompted

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
2. ✅ Update `.env` with Supabase and Gemini credentials
3. ✅ Install dependencies: `npm install`
4. ✅ Test API endpoints
5. ✅ Try new voice and image input features
6. ✅ Test clinical dashboard with Gemini 3 AI
7. ✅ Deploy to production

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Google Generative AI (Gemini) Docs](https://ai.google.dev/gemini-api/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [bcryptjs NPM](https://www.npmjs.com/package/bcrypt)

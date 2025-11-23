# ONBOARDING - Emergency Dispatch System

Welcome to the Emergency Dispatch System! This document provides context on the architecture, design decisions, and development guidelines for this project.

---

## 🏗️ Architecture Overview

### System Components

This is an **AI-powered emergency call dispatch system** with the following components:

1. **Next.js Frontend** (this repo) - Single-page React application
2. **Python Backend** (`tiqn_backend/`) - Audio processing & AI extraction
3. **Convex Database** - Real-time reactive database
4. **Twilio** - Voice call handling

### How It Works

```
Incoming Call (Twilio)
    ↓
Audio Stream → Python Backend
    ↓
1. Azure OpenAI Whisper (transcription every 5 seconds)
2. Claude AI (extract 31 structured fields)
3. Update Convex DB (real-time)
    ↓
Frontend (auto-updates via Convex reactivity)
```

---

## 📋 Key Design Decisions

### 1. Single Page Application
- **Everything happens on one page** (`src/app/page.tsx`)
- No routing, no separate pages
- Keep it simple and focused
- All UI conditionally rendered based on call status

### 2. Convex Handles Real-Time Updates
- **NEVER manually poll or refresh data**
- Convex's `useQuery` is reactive - it auto-updates when DB changes
- Just display the data - Convex takes care of real-time synchronization
- Python backend updates DB → Frontend automatically re-renders

### 3. Data Persistence
- Incident data **persists after hanging up** (stored in local state)
- UI panels are **always visible** (show empty states when no data)
- This allows operators to review previous call data

### 4. Minimal & Functional
- **No over-engineering**
- **No extra routes or pages**
- **No unnecessary abstractions**
- Keep dependencies minimal

---

## 🎨 Design System

### Visual Style: Palantir-Inspired Dark Theme

- **Background**: Deep slate (`bg-slate-950`)
- **Primary accent**: Cyan (`cyan-400`, `cyan-500`)
- **Cards**: Dark with cyan borders and subtle glow effects
- **Typography**: Monospace for data, clean sans-serif for headers
- **Glow effects**: Subtle box-shadows for borders and status indicators

### Color Palette

```
Status Colors:
- Incoming call: Amber (animate-pulse)
- Connected: Cyan (with glow)
- Ready: Gray
- Error: Red

Data Sections:
- Cyan borders with transparency (border-cyan-500/30)
- Dark backgrounds (bg-slate-900/50)
- Subtle glows (shadow-[0_0_15px_rgba(6,182,212,0.1)])
```

### Layout Structure

```
┌─────────────────────────────────────┐
│ Header (Status, Operator Info)      │
├─────────────────────────────────────┤
│ Call Controls (Accept/Decline/End)  │
├─────────────────────────────────────┤
│ Two-Column Layout (when connected)  │
│ ┌──────────┬────────────────────┐  │
│ │ Patient  │                    │  │
│ │ Vitals   │   Live Transcript  │  │
│ │          │   (Hero Element)   │  │
│ │ Location │                    │  │
│ │          │                    │  │
│ │ Medical  │                    │  │
│ └──────────┴────────────────────┘  │
├─────────────────────────────────────┤
│ System Logs (collapsed, bottom)     │
└─────────────────────────────────────┘
```

---

## 🔧 Development Guidelines

### Code Style Rules

1. **Use TypeScript nullish coalescing (`??`) instead of logical or (`||`)**
   ```typescript
   // ✅ Good
   const value = incident ?? persistedIncident;

   // ❌ Bad (ESLint will fail build)
   const value = incident || persistedIncident;
   ```

2. **No custom hooks - use Convex's built-in hooks**
   - `useQuery(api.*.*)` - Reactive data fetching
   - `useMutation(api.*.*)` - Database mutations

3. **Avoid unnecessary useEffect**
   - Only use when necessary (e.g., persisting data to local state)
   - Convex handles reactivity automatically

4. **Keep components inline**
   - No separate component files for this single-page app
   - Everything in `page.tsx`

### File Structure

```
tiqn-nextjs/
├── src/app/page.tsx          # Main application (EVERYTHING HERE)
├── convex/
│   ├── schema.ts             # Database schema
│   ├── incidents.ts          # Incident queries/mutations
│   ├── app_state.ts          # Global app state (active incident tracking)
│   ├── incidentAssignments.ts # Emergency approvals
│   └── ...
└── ONBOARDING.md             # This file
```

---

## 📊 Convex Database Schema

### Key Tables

#### `incidents`
Stores all emergency call data extracted by AI:
- Patient info: `firstName`, `lastName`, `patientAge`, `patientSex`
- Vitals: `consciousness`, `breathing`, `avdi`, `respiratoryStatus`
- Location: `address`, `district`, `apartment`, `reference`
- Medical: `symptomOnset`, `medicalHistory`, `currentMedications`, `allergies`, `vitalSigns`
- Tracking: `callSessionId` (Twilio stream SID), `fullTranscript`

#### `app_state`
Global singleton that tracks:
- `activeDispatcherId` - Current logged-in dispatcher
- `activeIncidentId` - Currently active incident (set by Python backend)

#### `incidentAssignments`
Tracks emergency approvals:
- `incidentId` - Reference to incident
- `rescuerId` - Assigned rescuer (optional, null when pending)
- `status`: `"pending"` | `"accepted"` | `"rejected"` | `"cancelled"` | `"completed"`

### Convex Patterns

**Creating a new mutation:**
```typescript
// convex/myTable.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutation = mutation({
  args: {
    fieldName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tableName", {
      fieldName: args.fieldName,
    });
  },
});
```

**Using in frontend:**
```typescript
const myMutation = useMutation(api.myTable.myMutation);
await myMutation({ fieldName: "value" });
```

---

## 🔄 Data Flow

### Incident Creation Flow

1. **Call comes in** → Twilio webhook (`/api/twilio/voice/route.ts`)
2. **Audio streams** → Python backend WebSocket
3. **Every 5 seconds**:
   - Transcribe audio (Azure Whisper)
   - Extract data (Claude AI)
   - Call `incidents:createOrUpdate` mutation
   - Call `app_state:setActiveIncident` mutation
4. **Frontend auto-updates** (Convex reactivity)

### State Management

```typescript
// Active incident from Convex (cleared when call ends)
const incident = useQuery(api.incidents.get,
  appState?.activeIncidentId ? { id: appState.activeIncidentId } : "skip"
);

// Persisted in local state (survives hang-up)
const [persistedIncident, setPersistedIncident] = useState(null);

// Display either active or persisted
const displayIncident = incident ?? persistedIncident;
```

### Approval Flow

1. User clicks **"Approve Emergency"** button
2. Calls `incidentAssignments:createPendingAssignment`
3. Creates entry with:
   - `status: "pending"`
   - `rescuerId: undefined` (no rescuer assigned yet)
   - `times.offered: Date.now()`

---

## 🚀 Common Tasks

### Adding a New Field to Display

1. **Check if it exists in schema** (`convex/schema.ts`)
2. **Verify Python backend extracts it** (`tiqn_backend/core_api/src/services/canonical.py`)
3. **Add to UI** in `page.tsx` using `displayIncident?.fieldName`

Example:
```tsx
{displayIncident?.newField && (
  <div className="flex justify-between">
    <span className="text-gray-500">New Field:</span>
    <span className="text-cyan-300">{displayIncident.newField}</span>
  </div>
)}
```

### Creating a New Convex Function

1. Create/edit file in `convex/` directory
2. Export mutation or query
3. Import in frontend: `import { api } from "../../convex/_generated/api"`
4. Use with hook: `useMutation(api.fileName.functionName)`

### Debugging Real-Time Updates

1. Check Convex dashboard: https://dashboard.convex.dev
2. Verify Python backend is calling mutations (check logs)
3. Check `app_state.activeIncidentId` is set correctly
4. Frontend query should auto-update when DB changes

---

## ⚠️ Important Rules

### DO:
✅ Keep everything in single page (`page.tsx`)
✅ Let Convex handle real-time updates
✅ Use `??` instead of `||` for nullish coalescing
✅ Display UI panels always (with empty states)
✅ Persist incident data in local state
✅ Use monospace font for data display
✅ Add subtle glow effects for status indicators

### DON'T:
❌ Create new routes or pages
❌ Manually poll/refresh data
❌ Use custom hooks unnecessarily
❌ Hide UI panels when no data (show empty states)
❌ Over-engineer solutions
❌ Add external dependencies without discussion
❌ Use `||` operator (ESLint will fail build)

---

## 🔍 Troubleshooting

### Build fails with ESLint errors
- Check for `||` operators → replace with `??`
- Run: `pnpm run build` to verify

### Data not updating in real-time
- Verify Convex query is set up correctly
- Check Python backend logs for mutation calls
- Verify `app_state.activeIncidentId` is being set

### Incident disappears after hang-up
- Should not happen anymore - we persist in local state
- Check `persistedIncident` state and `displayIncident` logic

---

## 📚 Additional Resources

- **Convex Docs**: https://docs.convex.dev
- **Twilio Voice SDK**: https://www.twilio.com/docs/voice/sdks/javascript
- **Next.js App Router**: https://nextjs.org/docs/app

---

## 🤝 Contributing

When making changes:
1. Keep the single-page architecture
2. Maintain the Palantir dark theme aesthetic
3. Ensure Convex reactivity works (don't break auto-updates)
4. Test with a real call flow if possible
5. Run `pnpm run build` before committing

---

**Questions?** Review this document and the existing code in `src/app/page.tsx`. The patterns are consistent and should be self-evident.

**Welcome aboard! 🚑**

# 🎯 Quick Reference Card - Unimog Community Hub

## 🚨 CRITICAL COMMANDS - COPY & PASTE

### Daily Development
```bash
# Start development server
npm run dev

# Check file count (should be ~2,950)
git ls-files | wc -l

# Safe push to staging
./scripts/safe-push.sh staging main

# Check for hardcoded keys
grep -r "supabase.co" src/ | grep -v VITE_
```

### Emergency Recovery
```bash
# Remove git lock if stuck
rm -f .git/index.lock

# Clone fresh from main if corrupted
git clone https://github.com/Thabonel/unimogcommunityhub.git fresh
cd fresh && git remote add staging https://github.com/Thabonel/unimogcommunity-staging.git
```

## 🔑 Environment Variables (Required)
```env
VITE_SUPABASE_URL=https://ydevatqwkoccxhtejdor.supabase.co
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token
VITE_OPENAI_API_KEY=<OPENAI_API_KEY>
```

## 📁 Project Structure
```
/src/
  /components/     # UI Components
  /pages/         # Route pages  
  /hooks/         # Custom React hooks
  /services/      # API services
  /utils/         # Helper functions
/supabase/
  /migrations/    # Database schemas
  /functions/     # Edge functions
/docs/
  /project-essentials/  # START HERE!
```

## 🔐 Database Tables (Key Ones)
- `profiles` - User profiles
- `vehicles` - User vehicles
- `marketplace_listings` - Items for sale
- `manual_chunks` - Processed manuals for Barry AI
- `community_recommendations` - User guides & tips
- `gpx_tracks` - Saved GPS routes

## ⚠️ DO NOT DO THESE
❌ Push to production without permission  
❌ Force push without checking file count  
❌ Commit hardcoded API keys  
❌ Delete files without understanding impact  
❌ Change git config settings  
❌ Create new features without user request  

## ✅ ALWAYS DO THESE
✅ Test locally before pushing  
✅ Push to staging first  
✅ Check console for errors  
✅ Verify file count before push  
✅ Use environment variables for keys  
✅ Read existing code before creating new  

## 🛠️ Common Fixes

### Netlify Build Fails
```toml
# In netlify.toml, use:
command = "npm install --include=dev && npm run build"
# NOT npm ci
```

### Maps Not Loading
- Check Mapbox token in env vars
- Check console for CSP errors
- Verify token in localStorage

### Barry AI Not Responding
- Check OpenAI key in env vars
- Verify Supabase connection
- Check manual_chunks table has data

## 🎯 Component Patterns

### Using Supabase
```typescript
import { supabase } from '@/lib/supabase-client';

const { data, error } = await supabase
  .from('table_name')
  .select('*');
```

### Protected Routes
```typescript
import { useAuth } from '@/hooks/use-auth';

const { user } = useAuth();
if (!user) return <Navigate to="/sign-in" />;
```

### Toast Notifications
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();
toast({
  title: "Success",
  description: "Action completed"
});
```

## 📊 Git Workflow

```bash
# 1. Make changes
git add -A

# 2. Commit with message
git commit -m "fix: description

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. Push to STAGING only
git push staging main:main

# 4. NEVER do this without permission:
# git push origin main
```

## 🚀 Deployment Status URLs

- **Staging Build**: https://app.netlify.com/sites/unimogcommunity-staging/deploys
- **Production Build**: https://app.netlify.com/sites/unimogcommunityhub/deploys
- **Supabase**: https://supabase.com/dashboard/project/ydevatqwkoccxhtejdor

## 💡 Pro Tips

1. **Before ANY git operation**: Check file count
2. **Before pushing**: Run the app locally
3. **After deployment**: Check the live site
4. **If something breaks**: Check recent commits
5. **When in doubt**: Read the docs in project-essentials

---
**Remember**: The platform is LIVE with REAL USERS. Be careful!
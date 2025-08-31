#!/bin/bash

# Safe push script with comprehensive validation
# Prevents accidental file deletion and provides detailed push information

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
MIN_FILES=3000
STAGING_REMOTE="staging"
PROD_REMOTE="origin"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}     Safe Push with Validation      ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Parse arguments
REMOTE=${1:-$STAGING_REMOTE}
BRANCH=${2:-main}

# Function to count files
count_files() {
    git ls-tree -r HEAD --name-only 2>/dev/null | wc -l | tr -d ' '
}

# Function to get remote URL
get_remote_url() {
    git remote get-url "$1" 2>/dev/null
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Not in a git repository${NC}"
    exit 1
fi

# Display current repository status
echo "📍 Current Repository Status:"
echo "  Branch: $(git branch --show-current)"
echo "  Files: $(count_files)"
echo "  Uncommitted changes: $(git status --porcelain | wc -l | tr -d ' ')"
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status --short
    echo ""
    read -p "Do you want to commit these changes first? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add -A
        git commit -m "$commit_msg

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
    fi
fi

# Validate file count
FILE_COUNT=$(count_files)
if [ "$FILE_COUNT" -lt "$MIN_FILES" ]; then
    echo -e "${RED}❌ ERROR: Repository has only $FILE_COUNT files${NC}"
    echo -e "${RED}Expected at least $MIN_FILES files${NC}"
    echo ""
    echo "This might indicate:"
    echo "- Files have been accidentally deleted"
    echo "- Repository is incomplete"
    echo ""
    echo "To fix this, run: ./scripts/restore-from-main.sh"
    exit 1
fi

# Show what will be pushed
echo "📤 Push Details:"
echo "  Remote: $REMOTE ($(get_remote_url $REMOTE))"
echo "  Branch: $BRANCH"
echo ""

# Check if remote exists
if ! git remote | grep -q "^$REMOTE$"; then
    echo -e "${RED}ERROR: Remote '$REMOTE' does not exist${NC}"
    echo "Available remotes:"
    git remote -v
    exit 1
fi

# Special handling for production push
if [ "$REMOTE" = "$PROD_REMOTE" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Pushing to PRODUCTION repository${NC}"
    echo "This will affect the live site at unimogcommunityhub.com"
    echo ""
    read -p "Type 'PRODUCTION' to confirm: " confirm
    if [ "$confirm" != "PRODUCTION" ]; then
        echo -e "${RED}Production push cancelled${NC}"
        exit 1
    fi
fi

# Show diff stats
echo "📊 Changes to be pushed:"
git diff --stat $REMOTE/$BRANCH..HEAD 2>/dev/null || echo "  (new branch)"
echo ""

# Final confirmation
read -p "Proceed with push to $REMOTE/$BRANCH? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Push cancelled${NC}"
    exit 1
fi

# Perform the push
echo ""
echo -e "${GREEN}Pushing to $REMOTE/$BRANCH...${NC}"
git push $REMOTE HEAD:$BRANCH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Push completed successfully!${NC}"
    
    if [ "$REMOTE" = "$STAGING_REMOTE" ]; then
        echo ""
        echo "🌐 View staging site at: https://unimogcommunity-staging.netlify.app"
        echo "📊 Check build status at: https://app.netlify.com/sites/unimogcommunity-staging/deploys"
    fi
else
    echo ""
    echo -e "${RED}❌ Push failed${NC}"
    echo "Check the error message above and try again"
    exit 1
fi
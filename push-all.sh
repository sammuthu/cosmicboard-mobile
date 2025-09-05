#!/bin/bash

# CosmicBoard - Push All Projects Script
# Pushes backend, web, and mobile projects to their git remotes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directories
BACKEND_DIR="../cosmicboard-backend"
WEB_DIR="../cosmicboard"
MOBILE_DIR="."

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}   CosmicBoard - Pushing All Projects      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# Function to push a project
push_project() {
    local project_name=$1
    local project_dir=$2
    
    echo -e "${YELLOW}→ Pushing $project_name...${NC}"
    
    if [ ! -d "$project_dir" ]; then
        echo -e "${RED}  ✗ Directory not found: $project_dir${NC}"
        return 1
    fi
    
    cd "$project_dir" || return 1
    
    # Check if it's a git repository
    if [ ! -d ".git" ]; then
        echo -e "${RED}  ✗ Not a git repository${NC}"
        return 1
    fi
    
    # Get current branch
    BRANCH=$(git branch --show-current)
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD 2>/dev/null; then
        echo -e "${YELLOW}  ⚠ Uncommitted changes detected${NC}"
        git status --short
        echo -e "${YELLOW}  Skipping push for $project_name${NC}"
        return 1
    fi
    
    # Push to remote
    if git push origin "$BRANCH" 2>&1; then
        echo -e "${GREEN}  ✓ Successfully pushed $project_name (branch: $BRANCH)${NC}"
    else
        echo -e "${RED}  ✗ Failed to push $project_name${NC}"
        return 1
    fi
    
    return 0
}

# Track results
TOTAL=0
SUCCESS=0
FAILED=0
SKIPPED=0

# Push Backend
TOTAL=$((TOTAL + 1))
if push_project "Backend" "$BACKEND_DIR"; then
    SUCCESS=$((SUCCESS + 1))
else
    if [ $? -eq 1 ]; then
        FAILED=$((FAILED + 1))
    else
        SKIPPED=$((SKIPPED + 1))
    fi
fi
echo ""

# Push Web
TOTAL=$((TOTAL + 1))
if push_project "Web App" "$WEB_DIR"; then
    SUCCESS=$((SUCCESS + 1))
else
    if [ $? -eq 1 ]; then
        FAILED=$((FAILED + 1))
    else
        SKIPPED=$((SKIPPED + 1))
    fi
fi
echo ""

# Push Mobile (current directory)
TOTAL=$((TOTAL + 1))
if push_project "Mobile App" "$MOBILE_DIR"; then
    SUCCESS=$((SUCCESS + 1))
else
    if [ $? -eq 1 ]; then
        FAILED=$((FAILED + 1))
    else
        SKIPPED=$((SKIPPED + 1))
    fi
fi

# Return to original directory
cd "$MOBILE_DIR" 2>/dev/null

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}                 Summary                    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "  Total Projects: $TOTAL"
echo -e "  ${GREEN}✓ Pushed:${NC} $SUCCESS"
if [ $SKIPPED -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ Skipped:${NC} $SKIPPED (uncommitted changes)"
fi
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}✗ Failed:${NC} $FAILED"
fi
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
    exit 1
fi
exit 0
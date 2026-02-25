# Pre-Publication Checklist

## 0. Validate Against Guidelines

| # | Guideline | Key Validation |
|---|-----------|----------------|
| 1 | DDL | No CHECK constraints |
| 2 | Deployment Scripts | Three-script model (deploy, run, clean) |
| 3 | Notebooks | All cells have unique names |
| 4 | Streamlit | No external CDN JavaScript |
| 5 | Parallel Queries | Independent queries batched |
| 6 | Data Generation | Pre-generated, committed to repo |

## 1. Code Quality

### SQL Scripts
- [ ] Uses `snow sql` (NOT deprecated `snowsql`)
- [ ] Scripts are standalone (no cross-references)
- [ ] All DDL has `IF NOT EXISTS` / `IF EXISTS`

### Shell Scripts
- [ ] All `.sh` files are executable
- [ ] `set -e` and `set -o pipefail` at top
- [ ] Help text via `--help`

### Python
- [ ] No hardcoded credentials
- [ ] Version matches environment constraints

## 2. Security

- [ ] No passwords, API keys, or tokens
- [ ] No real customer/production data
- [ ] Connection uses CLI profiles (not inline creds)
- [ ] Demo data is synthetic

## 3. File Cleanup

### Remove Before Commit

```bash
# Remove Python cache
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null

# Remove Jupyter checkpoints
find . -type d -name ".ipynb_checkpoints" -exec rm -rf {} + 2>/dev/null

# Remove .DS_Store
find . -name ".DS_Store" -delete 2>/dev/null

# Remove Streamlit output
rm -rf streamlit/output 2>/dev/null
```

## 4. Validation Commands

```bash
# Check for CHECK constraints (should return nothing)
grep -i "CHECK\s*(" sql/*.sql

# Check for external scripts (should return nothing)
grep -r "src=\"https://" streamlit/ --include="*.py" | grep -v __pycache__

# Verify no sensitive strings
grep -r "password\|secret\|private_key\|api_key" \
  --include="*.py" --include="*.sql" --include="*.sh" . | grep -v ".git"

# Check shell scripts executable
ls -la *.sh

# Validate notebook cells
for notebook in notebooks/*.ipynb; do
  python3 -c "
import json
with open('$notebook') as f:
    nb = json.load(f)
unnamed = sum(1 for c in nb['cells'] if not c.get('metadata', {}).get('name'))
print(f'$notebook: {unnamed} unnamed cells')
"
done
```

## 5. Required Files

- [ ] `README.md` with deployment instructions
- [ ] `LICENSE`
- [ ] `.gitignore`
- [ ] `deploy.sh`, `run.sh`, `clean.sh`
- [ ] `sql/` with numbered scripts
- [ ] `notebooks/` with `snowflake.yml`
- [ ] `streamlit/` with `snowflake.yml` and `environment.yml`

## Quick Reference: Common Issues

| Issue | Solution |
|-------|----------|
| CHECK constraint in SQL | Remove and document in comments |
| External JS not loading | Use Plotly or inline JS |
| Notebook cells unnamed | Add names to cell metadata |
| Data regenerated on deploy | Pre-generate and commit |
| `.cursor/` in git status | Add to `.gitignore` |


# 🔒 Security Scan Runbook - Scopsy Backend

## Overview

Scopsy backend uses a **3-layer security scanning approach**:

1. **Layer 1:** AgentShield - Claude Code configuration security
2. **Layer 2:** ESLint + Security Rules - Backend code vulnerabilities
3. **Layer 3:** npm Audit - Dependency vulnerability detection

---

## Quick Start

### Before committing (automatic with git hooks)
```bash
# Security checks run automatically on `git commit`
git commit -m "feat: add new feature"
# If checks fail, fix issues and commit again
```

### Manual Security Scan
```bash
# Run full security scan
npm run security:scan

# Auto-fix issues (where safe)
npm run security:scan:fix

# Generate HTML security report
npm run security:report
```

---

## Layer 1: AgentShield Configuration Scanning

Scans Claude Code configuration for vulnerabilities:
- Hardcoded secrets in config files
- Dangerous permission settings
- Hook injection vectors
- MCP server risks

### Run AgentShield Manually
```bash
# Scan with summary report
npx ecc-agentshield scan .

# Scan with JSON output (for CI/CD)
npx ecc-agentshield scan . --format json

# Scan with HTML report
npx ecc-agentshield scan . --format html > security-report.html

# Scan specific severity level
npx ecc-agentshield scan . --min-severity medium

# Auto-fix safe issues
npx ecc-agentshield scan . --fix
```

### Configuration File
**File:** `.agentshield.json`

**What it covers:**
- ✅ Secrets Detection (API keys, tokens, passwords)
- ✅ Auth Bypass Patterns
- ✅ Environment Variable Validation
- ✅ Hardcoded Values Detection

**Whitelist Known Patterns:**
```json
{
  "whitelist": [
    {
      "rule": "secrets-detection",
      "pattern": "OPENAI_API_KEY",
      "reason": "Template variable in documentation",
      "locations": ["docs/**", ".env.example"]
    }
  ]
}
```

---

## Layer 2: ESLint Security Rules

Scans backend code for security vulnerabilities.

### Run ESLint Manually
```bash
# Check for security issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Check specific file
npx eslint src/services/openai-service.js

# Generate report
npx eslint src --format json > eslint-report.json
```

### Security Rules Enabled

**Critical (must fix):**
- `security/detect-buffer-noalloc` - Buffer memory issues
- `security/detect-unsafe-regex` - ReDoS vulnerabilities
- `no-eval` - Dynamic code execution
- `no-new-func` - Function constructor from strings

**High (fix before release):**
- `security/detect-child-process` - Unvalidated command execution
- `security/detect-non-literal-fs-filename` - File path injection
- `security/detect-no-csrf-before-method-override` - CSRF vulnerabilities

**Medium (recommended):**
- `security/detect-object-injection` - Prototype pollution
- `security/detect-non-literal-regexp` - Dynamic regex
- `security/detect-non-literal-require` - Dynamic require

---

## Layer 3: npm Audit - Dependency Vulnerabilities

Scans `package.json` dependencies for known vulnerabilities.

### Run npm Audit Manually
```bash
# Check dependencies
npm audit

# Check with severity filter
npm audit --audit-level=moderate

# Auto-fix vulnerabilities (where safe)
npm audit fix

# Generate JSON report
npm audit --json > audit-report.json

# Interactive fix
npm audit fix --force (⚠️ use with caution)
```

### Understanding npm Audit Output

```
┌─────────────────────────────────────┐
│ npm audit security report           │
├─────────────────────────────────────┤
│ 5 vulnerabilities found             │
│ 2 high, 3 medium                    │
│ 0 critical                          │
└─────────────────────────────────────┘

High: SQL Injection in 'package@1.0.0'
└─ fix available with: npm audit fix
```

---

## GitHub Actions Integration

### What Happens
On every **PR** and **push to main**:
1. AgentShield scans configuration
2. ESLint runs security rules
3. npm audit checks dependencies
4. Reports saved as artifacts

### Viewing Results
1. Go to GitHub → Actions
2. Click on security scan workflow
3. Download artifacts for detailed reports

### Failing Checks
- **PR:** Checks appear as annotations on files
- **Main push:** Checks must pass before merge

---

## Troubleshooting

### AgentShield Says: "Hardcoded secret detected"

**Scenario:** Template env variable flagged
```javascript
// ❌ This is flagged
const apiKey = "sk-proj-...";
```

**Fix:**
```javascript
// ✅ Use environment variable
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured');
}
```

**Whitelist if legitimate:**
Edit `.agentshield.json`:
```json
{
  "whitelist": [
    {
      "rule": "secrets-detection",
      "pattern": "sk-proj-",
      "reason": "Example in documentation",
      "locations": ["docs/**"]
    }
  ]
}
```

---

### ESLint Says: "Detect object injection"

**Scenario:** User input used as object key
```javascript
// ⚠️ ESLint warning
const obj = {};
obj[userInput] = value;  // Potential prototype pollution
```

**Fix:**
```javascript
// ✅ Use Map instead
const map = new Map();
map.set(userInput, value);

// Or validate key
const validKeys = ['name', 'email', 'age'];
if (!validKeys.includes(userInput)) {
  throw new Error('Invalid key');
}
obj[userInput] = value;
```

---

### npm Audit Says: "Vulnerabilities found"

**Scenario:** Dependency has known CVE
```
High: Cross-site Scripting (XSS) in express-template@1.0.0
```

**Fix Priority:**
1. **Critical:** Fix immediately before deploying
2. **High:** Fix before next release
3. **Medium:** Fix when convenient
4. **Low:** Monitor but not urgent

**Solutions:**
```bash
# Upgrade specific package
npm install express-template@2.0.0

# Update all packages
npm audit fix

# Update with major version bump
npm audit fix --force
```

---

## Pre-Commit Hooks

### How They Work
When you run `git commit`:
1. AgentShield scan runs
2. ESLint checks code
3. npm audit checks deps
4. If all pass → commit proceeds
5. If any fail → commit blocked

### Bypass Hooks (⚠️ use rarely)
```bash
# Skip pre-commit (not recommended)
git commit --no-verify

# Skip pre-push
git push --no-verify
```

**⚠️ WARNING:** Only skip hooks if:
- You're fixing the issue immediately after
- You have explicit approval from @devops
- It's a documented emergency

---

## Security Baseline Report

### Generate Report
```bash
npm run security:report
```

Creates:
- `security-report.html` - AgentShield findings
- `audit-report.json` - npm audit results
- `.eslintrc.json` - ESLint configuration

### Review Process
1. Run security report
2. Categorize findings by severity
3. Create GitHub issues for each
4. Estimate remediation effort
5. Schedule fixes in sprint

---

## Adding Custom Security Rules

### For AgentShield
Edit `.agentshield.json`:
```json
{
  "rules": {
    "custom-rule": {
      "enabled": true,
      "severity": "high",
      "patterns": ["suspicious-pattern"]
    }
  }
}
```

### For ESLint
Edit `.eslintrc.json`:
```json
{
  "rules": {
    "custom-rule": "error",
    "security/detect-xyz": "warn"
  }
}
```

---

## Team Responsibilities

| Role | Task |
|------|------|
| **@dev** | Fix code security issues, review ESLint warnings |
| **@devops** | Manage security tooling, update configurations |
| **@qa** | Verify security fixes, run manual tests |
| **All** | Run local security scans before committing |

---

## References

- **AgentShield:** https://github.com/affaan-m/agentshield
- **ESLint Security Plugin:** https://github.com/nodesecurity/eslint-plugin-security
- **npm Audit:** https://docs.npmjs.com/cli/v10/commands/npm-audit
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/

---

**Last Updated:** 2026-03-02
**Status:** Active

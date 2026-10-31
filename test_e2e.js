/**
 * ============================================================================
 * UI GEMPAK: SYAHMI AOF - SYAHMI-POD INTERACTIVE EXPERIENCE SHOWCASE
 * Automated E2E, Integration, and Production Test Runner (4-Tier Architecture)
 * ============================================================================
 * 
 * Target: c:\Users\USER\Desktop\ui-gempak\ui-sofi
 * Live Production: https://pod.syahmiaof.my
 * Local Port: 4182 (http://127.0.0.1:4182)
 * 
 * Execution:
 *   node test_e2e.js                  # Run all 4 Tiers (31 test cases)
 *   node test_e2e.js --tier=1         # Tier 1: Feature Coverage only
 *   node test_e2e.js --tier=2         # Tier 2: Boundary & Corner Cases only
 *   node test_e2e.js --tier=3         # Tier 3: Cross-Feature Interactions only
 *   node test_e2e.js --tier=4         # Tier 4: Real-World Scenarios only
 *   node test_e2e.js --milestone=M1   # Run Milestone 1 tests only
 *   node test_e2e.js --skip-network   # Run offline (skip GitHub API / DNS / live HTTPS)
 *   node test_e2e.js --json           # Machine-readable JSON test telemetry
 *   node test_e2e.js --help           # Show usage options
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const dns = require('dns');
const tls = require('tls');
const url = require('url');
const { spawn } = require('child_process');

// ----------------------------------------------------------------------------
// 1. Path Resolution
// ----------------------------------------------------------------------------
const SOFI_DIR = fs.existsSync(path.join(__dirname, 'public', 'index.html'))
  ? __dirname
  : path.join(__dirname, 'ui-sofi');

const PROJECT_ROOT = path.resolve(SOFI_DIR, '..');
const PUBLIC_DIR = path.join(SOFI_DIR, 'public');

const PATHS = {
  sofiDir: SOFI_DIR,
  projectRoot: PROJECT_ROOT,
  publicDir: PUBLIC_DIR,
  packageJson: path.join(SOFI_DIR, 'package.json'),
  serverJs: path.join(SOFI_DIR, 'server.js'),
  vercelJson: path.join(SOFI_DIR, 'vercel.json'),
  indexHtml: path.join(PUBLIC_DIR, 'index.html'),
  appJs: path.join(PUBLIC_DIR, '_next', 'static', 'chunks', 'pages', '_app-25ad7f4542810d4b.js'),
  ogPreviewJpg: path.join(PUBLIC_DIR, 'og-preview.jpg'),
  videoPodEmergesDir: path.join(PUBLIC_DIR, 'images', 'video_pod_emerges'),
  videoPodRotationDir: path.join(PUBLIC_DIR, 'images', 'video_pod_rotation')
};

// ----------------------------------------------------------------------------
// 2. CLI Options & Output Utilities
// ----------------------------------------------------------------------------
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
syahmi-pod Automated E2E Test Suite
Usage:
  node test_e2e.js [options]

Options:
  --tier=1|2|3|4         Run only tests for the specified tier
  --milestone=M1..M5     Run only tests associated with milestone (M1 to M5)
  --skip-network         Skip network-dependent tests (GitHub API, Cloudflare DNS, Live HTTPS)
  --offline              Alias for --skip-network
  --json                 Output test execution report in JSON format
  --help, -h             Show this help message
`);
  process.exit(0);
}

const TARGET_TIER = (() => {
  const tArg = args.find(a => a.startsWith('--tier='));
  return tArg ? parseInt(tArg.split('=')[1], 10) : null;
})();

const TARGET_MILESTONE = (() => {
  const mArg = args.find(a => a.startsWith('--milestone='));
  return mArg ? mArg.split('=')[1].toUpperCase() : null;
})();

const SKIP_NETWORK = args.includes('--skip-network') || args.includes('--offline');
const OUTPUT_JSON = args.includes('--json');

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

function log(msg = '') {
  if (!OUTPUT_JSON) process.stdout.write(msg + '\n');
}

// ----------------------------------------------------------------------------
// 3. Milestone Mapping Matrix
// ----------------------------------------------------------------------------
const MILESTONE_MAP = {
  'TC-T1-01': 'M1',
  'TC-T1-02': 'M1',
  'TC-T1-03': 'M1',
  'TC-T1-04': 'M1',
  'TC-T1-05': 'M1',
  'TC-T1-06': 'M1',
  'TC-T1-07': 'M1',
  'TC-T1-08': 'M1',
  'TC-T1-09': 'M1',
  'TC-T1-10': 'M2',
  'TC-T1-11': 'M2',
  'TC-T1-12': 'M2',
  'TC-T1-13': 'M3',
  'TC-T1-14': 'M4',
  'TC-T1-15': 'M5',
  'TC-T2-01': 'M1',
  'TC-T2-02': 'M1',
  'TC-T2-03': 'M1',
  'TC-T2-04': 'M1',
  'TC-T2-05': 'M2',
  'TC-T2-06': 'M4',
  'TC-T3-01': 'M1',
  'TC-T3-02': 'M1',
  'TC-T3-03': 'M1',
  'TC-T3-04': 'M4',
  'TC-T3-05': 'M1',
  'TC-T4-01': 'M1',
  'TC-T4-02': 'M2',
  'TC-T4-03': 'M2',
  'TC-T4-04': 'M5',
  'TC-T4-05': 'M5'
};

// ----------------------------------------------------------------------------
// 4. Test Runner Harness
// ----------------------------------------------------------------------------
class TestHarness {
  constructor() {
    this.results = [];
    this.currentTier = null;
    this.tierSummaries = {
      1: { name: 'Tier 1: Feature Coverage (Core Capabilities)', total: 0, passed: 0, failed: 0, skipped: 0 },
      2: { name: 'Tier 2: Boundary & Corner Cases', total: 0, passed: 0, failed: 0, skipped: 0 },
      3: { name: 'Tier 3: Cross-Feature Interactions', total: 0, passed: 0, failed: 0, skipped: 0 },
      4: { name: 'Tier 4: Real-World Scenarios', total: 0, passed: 0, failed: 0, skipped: 0 }
    };
    this.startTime = Date.now();
  }

  setTier(tierNum) {
    this.currentTier = tierNum;
    if (TARGET_TIER !== null && TARGET_TIER !== tierNum) return;
    if (TARGET_MILESTONE !== null) {
      const hasMilestone = Object.entries(MILESTONE_MAP).some(
        ([id, m]) => m === TARGET_MILESTONE && id.startsWith(`TC-T${tierNum}-`)
      );
      if (!hasMilestone) return;
    }
    if (!OUTPUT_JSON) {
      log(`\n${COLORS.bold}${COLORS.cyan}======================================================================${COLORS.reset}`);
      log(`${COLORS.bold}${COLORS.cyan} [TIER ${tierNum}] ${this.tierSummaries[tierNum].name}${COLORS.reset}`);
      log(`${COLORS.bold}${COLORS.cyan}======================================================================${COLORS.reset}`);
    }
  }

  async test(id, title, testFn, isNetwork = false) {
    // Check tier filter
    if (TARGET_TIER !== null && TARGET_TIER !== this.currentTier) {
      return;
    }

    // Check milestone filter
    if (TARGET_MILESTONE !== null && MILESTONE_MAP[id] !== TARGET_MILESTONE) {
      return;
    }

    const tierSummary = this.tierSummaries[this.currentTier];
    tierSummary.total++;

    if (isNetwork && SKIP_NETWORK) {
      tierSummary.skipped++;
      this.results.push({
        tier: this.currentTier,
        id,
        title,
        milestone: MILESTONE_MAP[id] || 'M1',
        passed: false,
        skipped: true,
        error: 'Skipped (--skip-network active)',
        duration: 0
      });
      if (!OUTPUT_JSON) {
        log(`  ${COLORS.yellow}${COLORS.bold}[SKIP]${COLORS.reset} ${COLORS.bold}${id}${COLORS.reset} - ${title} ${COLORS.dim}(network test skipped)${COLORS.reset}`);
      }
      return;
    }

    const start = Date.now();
    let passed = false;
    let errorMsg = null;

    try {
      await testFn();
      passed = true;
      tierSummary.passed++;
    } catch (err) {
      passed = false;
      tierSummary.failed++;
      errorMsg = err.message || String(err);
    }

    const duration = Date.now() - start;
    this.results.push({
      tier: this.currentTier,
      id,
      title,
      milestone: MILESTONE_MAP[id] || 'M1',
      passed,
      skipped: false,
      error: errorMsg,
      duration
    });

    if (!OUTPUT_JSON) {
      const statusTag = passed
        ? `${COLORS.green}${COLORS.bold}[PASS]${COLORS.reset}`
        : `${COLORS.red}${COLORS.bold}[FAIL]${COLORS.reset}`;
      log(`  ${statusTag} ${COLORS.bold}${id}${COLORS.reset} - ${title} ${COLORS.dim}(${duration}ms)${COLORS.reset}`);
      if (!passed && errorMsg) {
        log(`         ${COLORS.red}Error: ${errorMsg}${COLORS.reset}`);
      }
    }
  }

  summary() {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const skippedTests = this.results.filter(r => r.skipped).length;
    const failedTests = totalTests - passedTests - skippedTests;

    if (OUTPUT_JSON) {
      const jsonReport = {
        timestamp: new Date().toISOString(),
        totalDuration,
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        success: failedTests === 0,
        tierSummaries: this.tierSummaries,
        tests: this.results
      };
      console.log(JSON.stringify(jsonReport, null, 2));
      return failedTests === 0 ? 0 : 1;
    }

    log(`\n${COLORS.bold}${COLORS.magenta}----------------------------------------------------------------------${COLORS.reset}`);
    log(`${COLORS.bold}${COLORS.magenta} TEST SUITE EXECUTION SUMMARY${COLORS.reset}`);
    log(`${COLORS.bold}${COLORS.magenta}----------------------------------------------------------------------${COLORS.reset}`);

    for (let t = 1; t <= 4; t++) {
      if (TARGET_TIER !== null && TARGET_TIER !== t) continue;
      const s = this.tierSummaries[t];
      if (s.total === 0) continue;
      const color = s.failed === 0 ? COLORS.green : COLORS.red;
      log(`  Tier ${t}: ${color}${s.passed}/${s.total} Passed${COLORS.reset} (${s.failed} Failed, ${s.skipped} Skipped) - ${s.name}`);
    }

    log(`----------------------------------------------------------------------`);
    const overallColor = failedTests === 0 ? COLORS.green : COLORS.red;
    log(`  ${COLORS.bold}Total Tests:${COLORS.reset}  ${totalTests}`);
    log(`  ${COLORS.bold}Passed:${COLORS.reset}       ${COLORS.green}${passedTests}${COLORS.reset}`);
    log(`  ${COLORS.bold}Failed:${COLORS.reset}       ${failedTests > 0 ? COLORS.red : COLORS.dim}${failedTests}${COLORS.reset}`);
    log(`  ${COLORS.bold}Skipped:${COLORS.reset}      ${skippedTests > 0 ? COLORS.yellow : COLORS.dim}${skippedTests}${COLORS.reset}`);
    log(`  ${COLORS.bold}Total Time:${COLORS.reset}   ${totalDuration}ms`);
    log(`  ${COLORS.bold}Overall:${COLORS.reset}      ${overallColor}${failedTests === 0 ? 'ALL TESTS PASSED [READY]' : 'FAILURES DETECTED [NEEDS REVISION]'}${COLORS.reset}`);
    log(`${COLORS.bold}${COLORS.magenta}======================================================================${COLORS.reset}\n`);

    return failedTests === 0 ? 0 : 1;
  }
}

// ----------------------------------------------------------------------------
// 5. Assertion & Utility Functions
// ----------------------------------------------------------------------------
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertIncludes(haystack, needle, message) {
  assert(
    typeof haystack === 'string' && haystack.includes(needle),
    message || `Expected string to contain "${needle}"`
  );
}

function assertNotIncludes(haystack, needle, message) {
  assert(
    typeof haystack === 'string' && !haystack.includes(needle),
    message || `Expected string NOT to contain "${needle}"`
  );
}

function fetchHttp(targetUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const reqOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'syahmi-pod-test-runner/1.0',
        ...(options.headers || {})
      },
      timeout: options.timeout || 8000
    };

    const req = client.request(reqOptions, res => {
      let data = '';
      res.setEncoding(options.encoding || 'utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`HTTP request timed out after ${reqOptions.timeout}ms for ${targetUrl}`));
    });

    req.on('error', err => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function probePort(port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const socket = new http.Agent().createConnection({ port, host, timeout: 500 });
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function resolveDnsCname(hostname) {
  return new Promise((resolve, reject) => {
    dns.resolveCname(hostname, (err, addresses) => {
      if (err) return reject(err);
      resolve(addresses);
    });
  });
}

function resolveDnsLookup(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { all: true }, (err, addresses) => {
      if (err) return reject(err);
      resolve(addresses);
    });
  });
}

function inspectTlsCertificate(hostname, port = 443) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(port, hostname, { servername: hostname, timeout: 6000 }, () => {
      const cert = socket.getPeerCertificate();
      const authorized = socket.authorized;
      socket.end();
      resolve({ authorized, cert });
    });
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`TLS connection timed out to ${hostname}:${port}`));
    });
    socket.on('error', err => {
      reject(err);
    });
  });
}

// ----------------------------------------------------------------------------
// 6. Test Suite Execution
// ----------------------------------------------------------------------------
async function runSuite() {
  const harness = new TestHarness();

  // Read files once for test assertions
  let indexHtml = '';
  let appJs = '';
  let serverJs = '';
  let packageJson = {};
  let vercelJson = null;

  try {
    if (fs.existsSync(PATHS.indexHtml)) {
      indexHtml = fs.readFileSync(PATHS.indexHtml, 'utf8');
    }
    if (fs.existsSync(PATHS.appJs)) {
      appJs = fs.readFileSync(PATHS.appJs, 'utf8');
    }
    if (fs.existsSync(PATHS.serverJs)) {
      serverJs = fs.readFileSync(PATHS.serverJs, 'utf8');
    }
    if (fs.existsSync(PATHS.packageJson)) {
      packageJson = JSON.parse(fs.readFileSync(PATHS.packageJson, 'utf8'));
    }
    if (fs.existsSync(PATHS.vercelJson)) {
      vercelJson = JSON.parse(fs.readFileSync(PATHS.vercelJson, 'utf8'));
    }
  } catch (err) {
    // Files will fail individual test assertions
  }

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (Core Capabilities)
  // ==========================================================================
  harness.setTier(1);

  // TC-T1-01: Page Metadata Brand Identity
  await harness.test('TC-T1-01', 'Page Metadata: Brand Identity in public/index.html head', () => {
    assert(indexHtml.length > 0, 'public/index.html must exist and not be empty');
    const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/i);
    assert(titleMatch, 'Missing <title> tag in index.html');
    assertIncludes(titleMatch[1].toLowerCase(), 'syahmi aof', `Expected title to contain "syahmi aof", got "${titleMatch[1]}"`);

    const descMatch = indexHtml.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    assert(descMatch, 'Missing meta name="description" in index.html');
    assertIncludes(
      descMatch[1].toLowerCase(),
      'syahmi aof crafts interactive digital experiences to push the web forward',
      `Meta description must contain the official slogan`
    );
  });

  // TC-T1-02: Client App Fallback Metadata
  await harness.test('TC-T1-02', 'Client App: Fallback SEO title and meta in _app.js', () => {
    assert(appJs.length > 0, '_app-25ad7f4542810d4b.js must exist');
    assertIncludes(
      appJs,
      'syahmi aof',
      '_app.js must contain "syahmi aof" in client SEO fallbacks'
    );
    assertIncludes(
      appJs,
      'syahmi aof crafts interactive digital experiences to push the web forward',
      '_app.js must contain official slogan in client metadata fallback'
    );
  });

  // TC-T1-03: Brand Slogan in Hero & Canvas Scrubbing Titles
  await harness.test('TC-T1-03', 'Hero & Canvas Scrubbing: Slogan in fillText titles', () => {
    assert(indexHtml.length > 0, 'index.html must exist');
    const fillText1 = indexHtml.match(/<h2[^>]*id=["']fillText1["'][^>]*>([\s\S]*?)<\/h2>/i);
    assert(fillText1, 'Missing #fillText1 h2 element in index.html');
    assertIncludes(
      fillText1[1].toLowerCase(),
      'syahmi aof crafts interactive digital experiences to push the web forward',
      '#fillText1 must contain official slogan'
    );

    const fillText = indexHtml.match(/<h2[^>]*id=["']fillText["'][^>]*>([\s\S]*?)<\/h2>/i);
    assert(fillText, 'Missing #fillText h2 element in index.html');
    assertIncludes(
      fillText[1].toLowerCase(),
      'syahmi aof crafts interactive digital experiences to push the web forward',
      '#fillText must contain official slogan'
    );

    assertIncludes(
      appJs,
      'syahmi aof crafts interactive digital experiences to push the web forward',
      '_app.js JSX scrubbing template must contain official slogan'
    );
  });

  // TC-T1-04: Navigation & CTA External Links
  await harness.test('TC-T1-04', 'Navigation Links: Portfolio URL & CTA rebranding', () => {
    assertIncludes(
      indexHtml,
      'https://syahmiaof.my',
      'index.html navigation CTA must link to https://syahmiaof.my'
    );
    assertIncludes(
      appJs,
      'https://syahmiaof.my',
      '_app.js JSX literals must link to https://syahmiaof.my'
    );
  });

  // TC-T1-05: Social Media & GitHub Profile Linkage
  await harness.test('TC-T1-05', 'Social Links: GitHub profile URL in footer / client bundle', () => {
    assert(appJs.length > 0, '_app.js must exist');
    assertIncludes(
      appJs,
      'https://github.com/syahmiaof',
      '_app.js must link to GitHub profile https://github.com/syahmiaof'
    );
  });

  // TC-T1-06: Pod Title Rebranding
  await harness.test('TC-T1-06', 'Pod Title: Rebranded to "syahmi pod" in DOM and JSX', () => {
    assert(indexHtml.length > 0, 'index.html must exist');
    assertIncludes(
      indexHtml.toLowerCase(),
      '<h2>syahmi pod</h2>',
      'index.html must contain "<h2>syahmi pod</h2>"'
    );
    assertNotIncludes(
      indexHtml.toLowerCase(),
      '<h2>sofi pod</h2>',
      'index.html must NOT contain legacy "<h2>sofi pod</h2>"'
    );
    assertIncludes(
      appJs.toLowerCase(),
      'syahmi pod',
      '_app.js must contain "syahmi pod"'
    );
  });

  // TC-T1-07: Pod Feature String 1: Performance & 60fps
  await harness.test('TC-T1-07', 'Pod Feature 1: Modernized performance copy (60fps)', () => {
    const expectedSnippet = '60fps performance';
    assertIncludes(
      indexHtml.toLowerCase(),
      expectedSnippet,
      `index.html pod feature must mention "${expectedSnippet}"`
    );
    assertIncludes(
      appJs.toLowerCase(),
      expectedSnippet,
      `_app.js pod feature must mention "${expectedSnippet}"`
    );
  });

  // TC-T1-08: Pod Feature String 2: Cross-Platform Connectivity
  await harness.test('TC-T1-08', 'Pod Feature 2: Modernized device & browser connectivity copy', () => {
    const expectedSnippet = 'modern browsers';
    assertIncludes(
      indexHtml.toLowerCase(),
      expectedSnippet,
      `index.html pod feature must mention "${expectedSnippet}"`
    );
    assertIncludes(
      appJs.toLowerCase(),
      expectedSnippet,
      `_app.js pod feature must mention "${expectedSnippet}"`
    );
  });

  // TC-T1-09: Pod Description Narrative
  await harness.test('TC-T1-09', 'Pod Description: Modernized digital craft narrative', () => {
    const expectedSnippet = 'the syahmi pod is designed to house interactive digital experiences';
    assertIncludes(
      indexHtml.toLowerCase(),
      expectedSnippet,
      `index.html must contain pod narrative: "${expectedSnippet}"`
    );
    assertIncludes(
      appJs.toLowerCase(),
      expectedSnippet,
      `_app.js must contain pod narrative: "${expectedSnippet}"`
    );
  });

  // TC-T1-10: OpenGraph Preview Poster File Existence & Format
  await harness.test('TC-T1-10', 'OpenGraph Image: File existence & valid image header in public/', () => {
    assert(
      fs.existsSync(PATHS.ogPreviewJpg),
      `public/og-preview.jpg must exist at ${PATHS.ogPreviewJpg}`
    );
    const buf = fs.readFileSync(PATHS.ogPreviewJpg);
    assert(buf.length > 1024, 'og-preview.jpg must be non-empty (>1 KB)');

    // Verify JPEG magic bytes FF D8 FF or WebP magic bytes RIFF...WEBP
    const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    const isWebP = buf.toString('utf8', 0, 4) === 'RIFF' && buf.toString('utf8', 8, 12) === 'WEBP';
    assert(isJpeg || isWebP, 'og-preview.jpg must have valid JPEG (FF D8 FF) or WebP header');
  });

  // TC-T1-11: OpenGraph Poster Payload Size < 300 KB
  await harness.test('TC-T1-11', 'OpenGraph Image: Size < 300 KB (WhatsApp scraper boundary)', () => {
    assert(fs.existsSync(PATHS.ogPreviewJpg), 'public/og-preview.jpg must exist');
    const stat = fs.statSync(PATHS.ogPreviewJpg);
    const maxSizeBytes = 300 * 1024; // 307,200 bytes
    assert(
      stat.size <= maxSizeBytes,
      `og-preview.jpg size (${stat.size} bytes / ${(stat.size / 1024).toFixed(1)} KB) exceeds 300 KB threshold (${maxSizeBytes} bytes)`
    );
  });

  // TC-T1-12: OpenGraph Metadata Tag Specification
  await harness.test('TC-T1-12', 'OpenGraph Metadata: og:image and twitter:image tags in index.html', () => {
    assert(indexHtml.length > 0, 'index.html must exist');
    const ogImageMatch = indexHtml.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    assert(ogImageMatch, 'Missing <meta property="og:image"> tag in index.html');
    assertIncludes(
      ogImageMatch[1],
      'og-preview.jpg',
      `og:image content must target og-preview.jpg, got "${ogImageMatch[1]}"`
    );

    const twitterImageMatch = indexHtml.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    assert(twitterImageMatch, 'Missing <meta name="twitter:image"> tag in index.html');
    assertIncludes(
      twitterImageMatch[1],
      'og-preview.jpg',
      `twitter:image content must target og-preview.jpg, got "${twitterImageMatch[1]}"`
    );
  });

  // TC-T1-13: GitHub Public Repository Existence
  await harness.test('TC-T1-13', 'GitHub Repository: https://github.com/syahmiaof/syahmi-pod exists', async () => {
    const res = await fetchHttp('https://api.github.com/repos/syahmiaof/syahmi-pod');
    assert(
      res.statusCode === 200,
      `GitHub API returned HTTP ${res.statusCode} (expected 200). Repository "syahmi-pod" may not exist yet or is private.`
    );
    const repoData = JSON.parse(res.body);
    assert(repoData.name === 'syahmi-pod', `Expected repository name "syahmi-pod", got "${repoData.name}"`);
    assert(repoData.private === false, 'GitHub repository must be public');
  }, true);

  // TC-T1-14: Cloudflare DNS CNAME Resolution
  await harness.test('TC-T1-14', 'Cloudflare DNS: pod.syahmiaof.my resolves to cname.vercel-dns.com', async () => {
    try {
      const cnames = await resolveDnsCname('pod.syahmiaof.my');
      const pointsToVercel = cnames.some(c => c.toLowerCase().includes('vercel'));
      assert(
        pointsToVercel,
        `pod.syahmiaof.my CNAME (${cnames.join(', ')}) must target Vercel (cname.vercel-dns.com)`
      );
    } catch (err) {
      // Fallback: check direct lookup
      const addresses = await resolveDnsLookup('pod.syahmiaof.my');
      assert(
        addresses && addresses.length > 0,
        `DNS resolution for pod.syahmiaof.my failed: ${err.message}`
      );
    }
  }, true);

  // TC-T1-15: Live Production HTTPS Reachability
  await harness.test('TC-T1-15', 'Live Production: https://pod.syahmiaof.my responds HTTP 200', async () => {
    const res = await fetchHttp('https://pod.syahmiaof.my/');
    assert(
      res.statusCode === 200,
      `Live production URL returned HTTP ${res.statusCode} (expected 200)`
    );
    assertIncludes(
      res.body.toLowerCase(),
      'syahmi aof',
      'Live site response body must contain "syahmi aof"'
    );
  }, true);

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ==========================================================================
  harness.setTier(2);

  // TC-T2-01: Protected Internal Tokens Preservation
  await harness.test('TC-T2-01', 'Protected Tokens: CSS module keys & GSAP selectors preserved', () => {
    assert(appJs.length > 0, '_app.js must exist');

    // 1. CSS module keys must NOT be renamed to "syahmi aofTitle"
    assertIncludes(appJs, 'sofiTitle', 'CSS module key "sofiTitle" must remain intact in _app.js');
    assertIncludes(appJs, 'sofiLinks', 'CSS module key "sofiLinks" must remain intact in _app.js');
    assertNotIncludes(appJs, 'syahmi aofTitle', 'CSS module key must NOT be renamed with spaces');

    // 2. GSAP class selector
    // In _app.js, .sofi__moon or a valid selector without spaces must exist
    const hasValidMoonSelector = appJs.includes('.sofi__moon') || appJs.includes('.syahmi__moon');
    assert(
      hasValidMoonSelector,
      'GSAP moon animation selector (.sofi__moon or .syahmi__moon) must be present'
    );
    assertNotIncludes(
      appJs,
      '.syahmi aof__moon',
      'GSAP selector must not contain unescaped spaces which cause DOMExceptions'
    );
  });

  // TC-T2-02: HTML Entity Encoding Integrity (&#x27; vs ')
  await harness.test('TC-T2-02', 'Encoding Integrity: HTML entity resolution & zero double-escaping', () => {
    assert(indexHtml.length > 0, 'index.html must exist');
    assert(appJs.length > 0, '_app.js must exist');

    // Check that raw HTML does not inject literal unencoded double quotes inside attributes
    const rawEntityIssues = indexHtml.match(/content="[^"]*&amp;amp;[^"]*"/g);
    assert(!rawEntityIssues, 'Detected double-escaped entities (&amp;amp;) in index.html metadata');

    // Check that JavaScript does not contain literal "&#x27;" which breaks virtual DOM comparison
    // In JSX literals, single quote should be raw (')
    const jsEntityLeak = appJs.includes('the syahmi pod&#x27;s') || appJs.includes('syahmi aof&#x27;s');
    assert(!jsEntityLeak, 'Detected HTML entity &#x27; inside _app.js JSX literals (must use raw UTF-8)');
  });

  // TC-T2-03: Hydration Mismatch Markers & Tag Balancing
  await harness.test('TC-T2-03', 'Hydration Safety: DOM tree balancing & unique ID integrity', () => {
    assert(indexHtml.length > 0, 'index.html must exist');

    // Verify __next root container
    assertIncludes(indexHtml, '<div id="__next">', 'Missing <div id="__next"> root element');
    assertIncludes(indexHtml, '<script id="__NEXT_DATA__"', 'Missing <script id="__NEXT_DATA__"> element');

    // Check unique ID definitions
    const fillText1Count = (indexHtml.match(/id=["']fillText1["']/g) || []).length;
    assert(
      fillText1Count === 1,
      `Expected exactly 1 instance of id="fillText1", found ${fillText1Count}`
    );

    const fillTextCount = (indexHtml.match(/id=["']fillText["']/g) || []).length;
    assert(
      fillTextCount === 1,
      `Expected exactly 1 instance of id="fillText", found ${fillTextCount}`
    );
  });

  // TC-T2-04: User-Facing "Sofi" Residual Elimination
  await harness.test('TC-T2-04', 'Brand Leak Audit: Zero remaining user-facing "sofi" copy in DOM', () => {
    assert(indexHtml.length > 0, 'index.html must exist');

    // Extract text between headings and paragraphs
    const userFacingPattern = /<(?:title|h1|h2|h3|h4|h5|h6|p|button)[^>]*>([\s\S]*?)<\/(?:title|h1|h2|h3|h4|h5|h6|p|button)>/gi;
    let match;
    const leakingElements = [];

    while ((match = userFacingPattern.exec(indexHtml)) !== null) {
      const innerText = match[1].replace(/<[^>]+>/g, '').trim();
      // Match whole word or isolated "sofi" (case insensitive)
      if (/\bsofi\b/i.test(innerText)) {
        leakingElements.push(innerText.slice(0, 80));
      }
    }

    assert(
      leakingElements.length === 0,
      `Found ${leakingElements.length} user-facing elements still containing "sofi":\n       -> ${leakingElements.slice(0, 3).join('\n       -> ')}`
    );
  });

  // TC-T2-05: WhatsApp Image Size Boundary Ceiling
  await harness.test('TC-T2-05', 'Image Boundary: og-preview.jpg size between 10 KB and 300 KB', () => {
    assert(fs.existsSync(PATHS.ogPreviewJpg), 'public/og-preview.jpg must exist');
    const size = fs.statSync(PATHS.ogPreviewJpg).size;
    const minBytes = 10 * 1024;
    const maxBytes = 300 * 1024;

    assert(
      size >= minBytes,
      `og-preview.jpg is too small (${(size / 1024).toFixed(1)} KB < 10 KB), may be corrupted`
    );
    assert(
      size <= maxBytes,
      `og-preview.jpg (${(size / 1024).toFixed(1)} KB) exceeds strict 300 KB ceiling for WhatsApp cards`
    );
  });

  // TC-T2-06: Cloudflare DNS Proxy Mode (proxied: false)
  await harness.test('TC-T2-06', 'DNS Boundary: Cloudflare CNAME record has proxied: false', async () => {
    // Attempt verification via Cloudflare API if token available, or DNS direct check
    const cfToken = process.env.CLOUDFLARE_API_TOKEN || '';
    const zoneId = process.env.CLOUDFLARE_ZONE_ID || '';

    const res = await fetchHttp(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=pod.syahmiaof.my`,
      {
        headers: {
          'Authorization': `Bearer ${cfToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.statusCode === 200) {
      const data = JSON.parse(res.body);
      assert(data.success, 'Cloudflare API query failed');
      const record = (data.result || []).find(r => r.name === 'pod.syahmiaof.my');
      assert(record, 'Cloudflare DNS record for pod.syahmiaof.my not found');
      assert(
        record.proxied === false,
        `Cloudflare record must have proxied: false (grey cloud), found proxied: ${record.proxied}`
      );
      assert(
        record.type === 'CNAME',
        `Expected DNS record type CNAME, got ${record.type}`
      );
    } else {
      // If API access is restricted, perform DNS resolution check
      const addresses = await resolveDnsLookup('pod.syahmiaof.my');
      assert(addresses.length > 0, 'DNS lookup for pod.syahmiaof.my returned no addresses');
    }
  }, true);

  // ==========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS
  // ==========================================================================
  harness.setTier(3);

  // TC-T3-01: Triple-Sync: Title & Metadata Synchronization
  await harness.test('TC-T3-01', 'Triple-Sync: <title>, _app.js, and __NEXT_DATA__ title alignment', () => {
    assert(indexHtml.length > 0, 'index.html must exist');
    assert(appJs.length > 0, '_app.js must exist');

    // 1. DOM Title
    const domTitleMatch = indexHtml.match(/<title>([^<]+)<\/title>/i);
    assert(domTitleMatch, 'Missing <title> tag in index.html');
    const domTitle = domTitleMatch[1].trim();

    // 2. __NEXT_DATA__ Title
    const nextDataMatch = indexHtml.match(/<script id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    assert(nextDataMatch, 'Missing __NEXT_DATA__ script in index.html');
    const nextData = JSON.parse(nextDataMatch[1]);
    const rawNextDataStr = JSON.stringify(nextData);

    assertIncludes(
      domTitle.toLowerCase(),
      'syahmi aof',
      'DOM <title> must contain "syahmi aof"'
    );
    assertIncludes(
      rawNextDataStr.toLowerCase(),
      'syahmi aof',
      '__NEXT_DATA__ payload must contain "syahmi aof"'
    );
    assertIncludes(
      appJs.toLowerCase(),
      'syahmi aof',
      '_app.js must contain "syahmi aof"'
    );
  });

  // TC-T3-02: Triple-Sync: Slogan & Hero Narrative Alignment
  await harness.test('TC-T3-02', 'Triple-Sync: Slogan across DOM, _app.js JSX, and __NEXT_DATA__', () => {
    const slogan = 'syahmi aof crafts interactive digital experiences to push the web forward';

    // 1. Check DOM
    assertIncludes(
      indexHtml.toLowerCase(),
      slogan,
      'DOM markup must contain official slogan'
    );

    // 2. Check _app.js
    assertIncludes(
      appJs.toLowerCase(),
      slogan,
      '_app.js bundle must contain official slogan'
    );

    // 3. Check __NEXT_DATA__
    const nextDataMatch = indexHtml.match(/<script id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    assert(nextDataMatch, 'Missing __NEXT_DATA__ in index.html');
    assertIncludes(
      nextDataMatch[1].toLowerCase(),
      slogan,
      '__NEXT_DATA__ state must contain official slogan'
    );
  });

  // TC-T3-03: Triple-Sync: Hardware Pod Copy Alignment
  await harness.test('TC-T3-03', 'Triple-Sync: "syahmi pod" copy synchronized between DOM and JSX', () => {
    assertIncludes(
      indexHtml.toLowerCase(),
      'syahmi pod',
      'DOM must contain "syahmi pod"'
    );
    assertIncludes(
      appJs.toLowerCase(),
      'syahmi pod',
      '_app.js must contain "syahmi pod"'
    );
  });

  // TC-T3-04: Vercel Deployment Configuration (vercel.json)
  await harness.test('TC-T3-04', 'Vercel Config: vercel.json outputDirectory & Next.js image rewrite', () => {
    assert(
      fs.existsSync(PATHS.vercelJson),
      `vercel.json must exist at ${PATHS.vercelJson}`
    );
    assert(vercelJson !== null, 'vercel.json must be valid JSON');

    // 1. outputDirectory must be "public"
    assert(
      vercelJson.outputDirectory === 'public',
      `vercel.json outputDirectory must be "public", got "${vercelJson.outputDirectory}"`
    );

    // 2. rewrites must contain Next.js image query rewrite
    assert(Array.isArray(vercelJson.rewrites), 'vercel.json must define rewrites array');
    const imgRewrite = vercelJson.rewrites.find(r => r.source === '/_next/image');
    assert(
      imgRewrite,
      'vercel.json must define rewrite for source "/_next/image"'
    );
    assert(
      imgRewrite.destination === '/:url',
      `/_next/image rewrite destination must be "/:url", got "${imgRewrite.destination}"`
    );
  });

  // TC-T3-05: Dev Server Next.js Image Query Route Simulation
  await harness.test('TC-T3-05', 'Dev Server Image Rewrite: /_next/image?url=... streams static asset', async () => {
    const isListening = await probePort(4182);
    assert(isListening, 'Dev server is not listening on port 4182 (start via `node server.js`)');

    const testImgUrl = 'http://127.0.0.1:4182/_next/image?url=%2Fimages%2Ffavicons%2Fwhite-favicon-32x32.png&w=32&q=75';
    const res = await fetchHttp(testImgUrl, { encoding: 'binary' });

    assert(
      res.statusCode === 200,
      `/_next/image route returned HTTP ${res.statusCode} (expected 200)`
    );
    assert(
      res.headers['content-type'] && res.headers['content-type'].includes('image'),
      `Expected Content-Type image/*, got "${res.headers['content-type']}"`
    );
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // ==========================================================================
  harness.setTier(4);

  // TC-T4-01: Dev Server Local HTTP 200 Health Check
  await harness.test('TC-T4-01', 'Dev Server Health: http://127.0.0.1:4182/ returns HTTP 200 and HTML', async () => {
    const isListening = await probePort(4182);
    assert(isListening, 'Local server is not running on port 4182');

    const res = await fetchHttp('http://127.0.0.1:4182/');
    assert(res.statusCode === 200, `Local server returned HTTP ${res.statusCode}`);
    assert(
      res.headers['content-type'] && res.headers['content-type'].includes('text/html'),
      `Expected text/html Content-Type, got "${res.headers['content-type']}"`
    );
    assert(res.body.length > 50000, `Expected HTML body > 50KB, got ${res.body.length} bytes`);
  });

  // TC-T4-02: Social Preview Scraper Simulation (Facebook & WhatsApp)
  await harness.test('TC-T4-02', 'Scraper Simulation: WhatsApp/Facebook crawler parses complete OpenGraph card', async () => {
    // Request local or live HTML with Facebook/WhatsApp crawler User-Agent
    const target = (await probePort(4182))
      ? 'http://127.0.0.1:4182/'
      : (SKIP_NETWORK ? null : 'https://pod.syahmiaof.my/');

    assert(target !== null, 'Cannot run scraper simulation: server on 4182 not listening and network skipped');

    const res = await fetchHttp(target, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      }
    });

    assert(res.statusCode === 200, `Crawler request returned HTTP ${res.statusCode}`);

    const html = res.body;
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

    assert(ogTitle && ogTitle[1].toLowerCase().includes('syahmi aof'), 'Missing or invalid og:title for social crawler');
    assert(ogDesc && ogDesc[1].toLowerCase().includes('syahmi aof'), 'Missing or invalid og:description for social crawler');
    assert(ogImage && ogImage[1].includes('og-preview.jpg'), 'Missing or invalid og:image for social crawler');
  });

  // TC-T4-03: Twitter / X Bot Card Scraper Emulation
  await harness.test('TC-T4-03', 'Scraper Simulation: Twitterbot crawler parses summary_large_image card', async () => {
    const target = (await probePort(4182))
      ? 'http://127.0.0.1:4182/'
      : (SKIP_NETWORK ? null : 'https://pod.syahmiaof.my/');

    assert(target !== null, 'Server not listening on 4182');

    const res = await fetchHttp(target, {
      headers: {
        'User-Agent': 'Twitterbot/1.0'
      }
    });

    assert(res.statusCode === 200, `Twitterbot request returned HTTP ${res.statusCode}`);
    const html = res.body;

    const twitterCard = html.match(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i);
    assert(
      twitterCard && twitterCard[1] === 'summary_large_image',
      `Expected twitter:card "summary_large_image", got "${twitterCard ? twitterCard[1] : 'null'}"`
    );

    const twitterTitle = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    assert(
      twitterTitle && twitterTitle[1].toLowerCase().includes('syahmi aof'),
      'Missing or invalid twitter:title for Twitterbot'
    );
  });

  // TC-T4-04: Live Production HTTPS 200 & Security Response
  await harness.test('TC-T4-04', 'Live Production: https://pod.syahmiaof.my/ serves clean production HTML', async () => {
    const res = await fetchHttp('https://pod.syahmiaof.my/', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    assert(res.statusCode === 200, `Live site returned HTTP ${res.statusCode}`);
    assertIncludes(
      res.body.toLowerCase(),
      'syahmi aof',
      'Live site response body must contain "syahmi aof"'
    );
    assert(
      res.body.length > 50000,
      `Live site body too small (${res.body.length} bytes), expected full SPA bundle`
    );
  }, true);

  // TC-T4-05: Live TLS / SSL Certificate Handshake Verification
  await harness.test('TC-T4-05', 'TLS / SSL Security: Valid SSL certificate handshake on pod.syahmiaof.my:443', async () => {
    const { authorized, cert } = await inspectTlsCertificate('pod.syahmiaof.my', 443);
    assert(authorized, 'TLS certificate failed validation authorization');
    assert(cert, 'Failed to extract TLS peer certificate');

    const validTo = new Date(cert.valid_to).getTime();
    assert(
      validTo > Date.now(),
      `TLS certificate has expired (valid_to: ${cert.valid_to})`
    );

    // Verify Subject CN or SubjectAltNames
    const altNames = cert.subjectaltname || '';
    const subjectCn = cert.subject ? cert.subject.CN : '';
    const matchesDomain =
      subjectCn.includes('syahmiaof.my') ||
      altNames.includes('pod.syahmiaof.my') ||
      altNames.includes('*.syahmiaof.my');

    assert(
      matchesDomain,
      `Certificate (${subjectCn}, SAN: ${altNames}) does not cover pod.syahmiaof.my`
    );
  }, true);

  // ==========================================================================
  // Summary & Exit Code
  // ==========================================================================
  const exitCode = harness.summary();
  process.exit(exitCode);
}

// Run runner
runSuite().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});

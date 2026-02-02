import {
  oneWayEncrypt,
  twoWayEncrypt,
  twoWayDecrypt
} from '../src/index.js';

// Benchmark configuration
const ITERATIONS = {
  oneWay: 20,
  twoWay: 10  // Fewer iterations for slower operations
};

// Test data sizes
const TEST_DATA = {
  small: 'x'.repeat(100),      // 100 bytes
  medium: 'x'.repeat(1024),    // 1 KB
  large: 'x'.repeat(10240)     // 10 KB
};

const PASSPHRASE = 'test-passphrase-for-benchmarking';

// Utility functions
function formatMs(ms) {
  return ms.toFixed(2);
}

function formatOpsPerSec(avgMs) {
  return (1000 / avgMs).toFixed(1);
}

function getStats(timings) {
  const sum = timings.reduce((a, b) => a + b, 0);
  const avg = sum / timings.length;
  const min = Math.min(...timings);
  const max = Math.max(...timings);
  return { avg, min, max };
}

function formatDataSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getWarningIcon(avgMs) {
  if (avgMs > 100) return ' ⚠️⚠️';
  if (avgMs > 10) return ' ⚠️';
  return '';
}

// Benchmark functions
async function benchmarkOneWayEncrypt(data, algorithm, iterations) {
  const timings = [];
  const useSha = algorithm === 'SHA-256';
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await oneWayEncrypt(data, useSha);
    const end = performance.now();
    timings.push(end - start);
  }
  
  return getStats(timings);
}

async function benchmarkTwoWayEncrypt(data, iterations) {
  const timings = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await twoWayEncrypt(data, PASSPHRASE);
    const end = performance.now();
    timings.push(end - start);
  }
  
  return getStats(timings);
}

async function benchmarkTwoWayDecrypt(encrypted, iterations) {
  const timings = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await twoWayDecrypt(encrypted, PASSPHRASE);
    const end = performance.now();
    timings.push(end - start);
  }
  
  return getStats(timings);
}

async function benchmarkTwoWayRoundTrip(data, iterations) {
  const timings = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const encrypted = await twoWayEncrypt(data, PASSPHRASE);
    await twoWayDecrypt(encrypted, PASSPHRASE);
    const end = performance.now();
    timings.push(end - start);
  }
  
  return getStats(timings);
}

// Main benchmark runner
async function runBenchmarks() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Common-Encryption v3.0 Performance Benchmark');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // One-way encryption benchmarks
  console.log('━━━ ONE-WAY ENCRYPTION (HASHING) ━━━\n');
  
  for (const [sizeName, data] of Object.entries(TEST_DATA)) {
    console.log(`📊 ${sizeName.toUpperCase()} DATA (${formatDataSize(data.length)}):\n`);
    
    // SHA-256
    const sha256Stats = await benchmarkOneWayEncrypt(data, 'SHA-256', ITERATIONS.oneWay);
    console.log(`  SHA-256:`);
    console.log(`    Iterations: ${ITERATIONS.oneWay}`);
    console.log(`    Average:    ${formatMs(sha256Stats.avg)}ms (${formatOpsPerSec(sha256Stats.avg)} ops/sec)`);
    console.log(`    Min:        ${formatMs(sha256Stats.min)}ms`);
    console.log(`    Max:        ${formatMs(sha256Stats.max)}ms\n`);
    
    // MD5
    const md5Stats = await benchmarkOneWayEncrypt(data, 'MD5', ITERATIONS.oneWay);
    console.log(`  MD5:`);
    console.log(`    Iterations: ${ITERATIONS.oneWay}`);
    console.log(`    Average:    ${formatMs(md5Stats.avg)}ms (${formatOpsPerSec(md5Stats.avg)} ops/sec)`);
    console.log(`    Min:        ${formatMs(md5Stats.min)}ms`);
    console.log(`    Max:        ${formatMs(md5Stats.max)}ms\n`);
  }

  // Two-way encryption benchmarks
  console.log('━━━ TWO-WAY ENCRYPTION (AES-GCM + PBKDF2) ━━━\n');
  
  for (const [sizeName, data] of Object.entries(TEST_DATA)) {
    console.log(`📊 ${sizeName.toUpperCase()} DATA (${formatDataSize(data.length)}):\n`);
    
    // Encryption
    const encryptStats = await benchmarkTwoWayEncrypt(data, ITERATIONS.twoWay);
    console.log(`  Encryption:`);
    console.log(`    Iterations: ${ITERATIONS.twoWay}`);
    console.log(`    Average:    ${formatMs(encryptStats.avg)}ms (${formatOpsPerSec(encryptStats.avg)} ops/sec)${getWarningIcon(encryptStats.avg)}`);
    console.log(`    Min:        ${formatMs(encryptStats.min)}ms`);
    console.log(`    Max:        ${formatMs(encryptStats.max)}ms\n`);
    
    // Decryption (need to encrypt once first)
    const encrypted = await twoWayEncrypt(data, PASSPHRASE);
    const decryptStats = await benchmarkTwoWayDecrypt(encrypted, ITERATIONS.twoWay);
    console.log(`  Decryption:`);
    console.log(`    Iterations: ${ITERATIONS.twoWay}`);
    console.log(`    Average:    ${formatMs(decryptStats.avg)}ms (${formatOpsPerSec(decryptStats.avg)} ops/sec)${getWarningIcon(decryptStats.avg)}`);
    console.log(`    Min:        ${formatMs(decryptStats.min)}ms`);
    console.log(`    Max:        ${formatMs(decryptStats.max)}ms\n`);
    
    // Round-trip (encrypt + decrypt)
    const roundTripStats = await benchmarkTwoWayRoundTrip(data, ITERATIONS.twoWay);
    console.log(`  Round-trip (Encrypt + Decrypt):`);
    console.log(`    Iterations: ${ITERATIONS.twoWay}`);
    console.log(`    Average:    ${formatMs(roundTripStats.avg)}ms (${formatOpsPerSec(roundTripStats.avg)} ops/sec)${getWarningIcon(roundTripStats.avg)}`);
    console.log(`    Min:        ${formatMs(roundTripStats.min)}ms`);
    console.log(`    Max:        ${formatMs(roundTripStats.max)}ms\n`);
  }

  // Security Level Performance Comparison
  console.log('━━━ SECURITY LEVEL PERFORMANCE COMPARISON ━━━\n');
  console.log('Testing with 1KB data (representative of typical API payloads)\n');
  
  const apiTestData = TEST_DATA.medium; // 1KB
  const securityLevelIterations = 10;
  
  // Define security levels to test
  const securityLevels = [
    { name: 'Fast Mode', config: { securityLevel: 'fast' }, iterations: 1000, target: 2 },
    { name: 'Standard Mode', config: { securityLevel: 'standard' }, iterations: 10000, target: 20 },
    { name: 'High Mode', config: { securityLevel: 'high' }, iterations: 100000, target: 100 },
    { name: 'Maximum Mode', config: { securityLevel: 'maximum' }, iterations: 600000, target: 113 },
    { name: 'Custom (5k)', config: { iterations: 5000 }, iterations: 5000, target: 10 }
  ];
  
  const results = [];
  
  for (const level of securityLevels) {
    console.log(`📊 ${level.name.toUpperCase()} (${level.iterations.toLocaleString()} iterations):\n`);
    
    // Encryption benchmark
    const encryptTimings = [];
    for (let i = 0; i < securityLevelIterations; i++) {
      const start = performance.now();
      await twoWayEncrypt(apiTestData, PASSPHRASE, level.config);
      const end = performance.now();
      encryptTimings.push(end - start);
    }
    const encryptStats = getStats(encryptTimings);
    
    // Decryption benchmark (need to encrypt once first with this config)
    const encrypted = await twoWayEncrypt(apiTestData, PASSPHRASE, level.config);
    const decryptTimings = [];
    for (let i = 0; i < securityLevelIterations; i++) {
      const start = performance.now();
      await twoWayDecrypt(encrypted, PASSPHRASE, level.config);
      const end = performance.now();
      decryptTimings.push(end - start);
    }
    const decryptStats = getStats(decryptTimings);
    
    // Store results for comparison
    results.push({
      name: level.name,
      iterations: level.iterations,
      target: level.target,
      encrypt: encryptStats.avg,
      decrypt: decryptStats.avg
    });
    
    // Format output with target indicators
    const encryptMeetsTarget = encryptStats.avg < 10 ? ' ✓ TARGET MET' : '';
    const decryptMeetsTarget = decryptStats.avg < 10 ? ' ✓ TARGET MET' : '';
    
    console.log(`  Encrypt:  ${formatMs(encryptStats.avg)}ms | Min: ${formatMs(encryptStats.min)}ms | Max: ${formatMs(encryptStats.max)}ms${encryptMeetsTarget}`);
    console.log(`  Decrypt:  ${formatMs(decryptStats.avg)}ms | Min: ${formatMs(decryptStats.min)}ms | Max: ${formatMs(decryptStats.max)}ms${decryptMeetsTarget}\n`);
  }
  
  // Comparison table
  console.log('━━━ PERFORMANCE COMPARISON TABLE ━━━\n');
  console.log('┌─────────────────┬────────────┬────────────┬────────────┬──────────────────┐');
  console.log('│ Security Level  │  Encrypt   │  Decrypt   │   Target   │     Speedup      │');
  console.log('├─────────────────┼────────────┼────────────┼────────────┼──────────────────┤');
  
  const maximumResult = results.find(r => r.name === 'Maximum Mode');
  
  for (const result of results) {
    const encryptSpeedup = maximumResult.encrypt / result.encrypt;
    const decryptSpeedup = maximumResult.decrypt / result.decrypt;
    const avgSpeedup = (encryptSpeedup + decryptSpeedup) / 2;
    
    const encryptStr = formatMs(result.encrypt).padStart(7) + 'ms';
    const decryptStr = formatMs(result.decrypt).padStart(7) + 'ms';
    const targetStr = formatMs(result.target).padStart(7) + 'ms';
    const speedupStr = `${avgSpeedup.toFixed(1)}x faster`.padStart(16);
    
    const meetsTarget = (result.encrypt < 10 && result.decrypt < 10) ? ' ✓' : '';
    
    console.log(`│ ${result.name.padEnd(15)} │ ${encryptStr} │ ${decryptStr} │ ${targetStr} │ ${speedupStr}${meetsTarget} │`);
  }
  
  console.log('└─────────────────┴────────────┴────────────┴────────────┴──────────────────┘\n');
  
  // Key insights
  console.log('━━━ KEY INSIGHTS ━━━\n');
  
  const fastResult = results.find(r => r.name === 'Fast Mode');
  const standardResult = results.find(r => r.name === 'Standard Mode');
  const customResult = results.find(r => r.name === 'Custom (5k)');
  
  const fastMeetsTarget = fastResult.encrypt < 10 && fastResult.decrypt < 10;
  const standardMeetsTarget = standardResult.encrypt < 10 && standardResult.decrypt < 10;
  const customMeetsTarget = customResult.encrypt < 10 && customResult.decrypt < 10;
  
  console.log(`  🚀 Fast Mode (1,000 iterations):`);
  console.log(`     • Encrypt: ${formatMs(fastResult.encrypt)}ms | Decrypt: ${formatMs(fastResult.decrypt)}ms`);
  console.log(`     • ${((maximumResult.encrypt / fastResult.encrypt).toFixed(1))}x faster than maximum mode`);
  console.log(`     • ${fastMeetsTarget ? '✓ MEETS' : '✗ DOES NOT MEET'} real-time API target (<10ms)\n`);
  
  console.log(`  ⚡ Standard Mode (10,000 iterations):`);
  console.log(`     • Encrypt: ${formatMs(standardResult.encrypt)}ms | Decrypt: ${formatMs(standardResult.decrypt)}ms`);
  console.log(`     • ${((maximumResult.encrypt / standardResult.encrypt).toFixed(1))}x faster than maximum mode`);
  console.log(`     • ${standardMeetsTarget ? '✓ MEETS' : '✗ DOES NOT MEET'} real-time API target (<10ms)\n`);
  
  console.log(`  🎯 Custom 5k iterations:`);
  console.log(`     • Encrypt: ${formatMs(customResult.encrypt)}ms | Decrypt: ${formatMs(customResult.decrypt)}ms`);
  console.log(`     • ${((maximumResult.encrypt / customResult.encrypt).toFixed(1))}x faster than maximum mode`);
  console.log(`     • ${customMeetsTarget ? '✓ MEETS' : '✗ DOES NOT MEET'} real-time API target (<10ms)\n`);
  
  // Recommendations
  console.log('━━━ SECURITY LEVEL RECOMMENDATIONS ━━━\n');
  console.log('  📱 Real-time API / Transport Encryption:');
  console.log(`     → Use Fast Mode ({ securityLevel: 'fast' })`);
  console.log(`     → ~${formatMs((fastResult.encrypt + fastResult.decrypt) / 2)}ms average latency`);
  console.log(`     → Suitable for ephemeral data in transit\n`);
  
  console.log('  🔐 Standard Application Data:');
  console.log(`     → Use Standard Mode ({ securityLevel: 'standard' })`);
  console.log(`     → ~${formatMs((standardResult.encrypt + standardResult.decrypt) / 2)}ms average latency`);
  console.log(`     → Good balance of security and performance\n`);
  
  console.log('  🛡️  Sensitive Long-term Storage:');
  console.log(`     → Use High or Maximum Mode`);
  console.log(`     → ~${formatMs((maximumResult.encrypt + maximumResult.decrypt) / 2)}ms average latency`);
  console.log(`     → Maximum protection for critical data\n`);
  
  console.log('  ⚙️  Custom Requirements:');
  console.log(`     → Use { iterations: N } for fine-tuned control`);
  console.log(`     → Balance security needs with performance constraints\n`);

  // Performance analysis
  console.log('━━━ LEGACY PERFORMANCE ANALYSIS ━━━\n');
  
  // Quick single operation test for detailed analysis
  const testData = TEST_DATA.medium;
  
  console.log('⏱️  Single Operation Breakdown (1KB data):\n');
  
  const hashStart = performance.now();
  await oneWayEncrypt(testData, true);
  const hashTime = performance.now() - hashStart;
  
  const encStart = performance.now();
  const enc = await twoWayEncrypt(testData, PASSPHRASE);
  const encTime = performance.now() - encStart;
  
  const decStart = performance.now();
  await twoWayDecrypt(enc, PASSPHRASE);
  const decTime = performance.now() - decStart;
  
  console.log(`  One-way (SHA-256):     ${formatMs(hashTime)}ms`);
  console.log(`  Two-way encrypt:       ${formatMs(encTime)}ms${getWarningIcon(encTime)}`);
  console.log(`  Two-way decrypt:       ${formatMs(decTime)}ms${getWarningIcon(decTime)}`);
  console.log(`  Total round-trip:      ${formatMs(encTime + decTime)}ms${getWarningIcon(encTime + decTime)}\n`);
  
  console.log('📈 Key Findings:\n');
  console.log(`  • One-way encryption is ${(encTime / hashTime).toFixed(0)}x faster than two-way`);
  console.log(`  • PBKDF2 (600k iterations) dominates two-way operation time`);
  console.log(`  • Both encrypt & decrypt are slow due to key derivation\n`);
  
  // Target performance
  console.log('🎯 Target Performance (Real-time API Requirements):\n');
  console.log(`  Current:  ~${formatMs(encTime)}ms per operation`);
  console.log(`  Target:   <10ms per operation`);
  console.log(`  Gap:      ${(encTime / 10).toFixed(1)}x too slow\n`);
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Benchmark Complete');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('💡 Next Steps:');
  console.log('   1. Reduce PBKDF2 iterations for transport encryption use case');
  console.log('   2. Consider caching derived keys for rotating key scenarios');
  console.log('   3. Re-run benchmark to measure improvements\n');
}

// Run benchmarks
console.log('Starting benchmarks...\n');
runBenchmarks().catch(error => {
  console.error('Benchmark error:', error);
  process.exit(1);
});
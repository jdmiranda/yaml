#!/usr/bin/env node

/**
 * Performance benchmark for YAML parser optimizations
 * Measures lexer and parser performance across various YAML sizes
 */

const fs = require('fs');
const path = require('path');
const { parse, parseDocument, parseAllDocuments } = require('./dist/index.js');

// Benchmark utilities
function benchmark(name, fn, iterations = 1000) {
    // Warm up
    for (let i = 0; i < 10; i++) fn();

    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    return {
        name,
        iterations,
        totalTime: duration,
        avgTime: duration / iterations,
        opsPerSec: Math.round((iterations / duration) * 1000)
    };
}

// Generate test YAML content
function generateSimpleYAML() {
    return `
name: test-config
version: 1.0.0
settings:
  debug: true
  timeout: 3000
  retries: 5
items:
  - id: 1
    name: First item
    active: true
  - id: 2
    name: Second item
    active: false
`;
}

function generateMediumYAML() {
    const items = [];
    for (let i = 0; i < 100; i++) {
        items.push(`  - id: ${i}\n    name: Item ${i}\n    value: ${Math.random()}\n    active: ${i % 2 === 0}`);
    }
    return `
apiVersion: v1
kind: ConfigMap
metadata:
  name: benchmark-config
  namespace: default
data:
  config.yaml: |
    database:
      host: localhost
      port: 5432
      name: benchmark_db
      connections: 100
    cache:
      type: redis
      ttl: 3600
items:
${items.join('\n')}
`;
}

function generateLargeYAML() {
    const sections = [];
    for (let i = 0; i < 50; i++) {
        const items = [];
        for (let j = 0; j < 50; j++) {
            items.push(`    - id: ${i}_${j}
      name: "Item ${i}_${j}"
      description: "This is a longer description for item ${i}_${j} with more text"
      metadata:
        created: "2024-01-01T00:00:00Z"
        updated: "2024-01-02T00:00:00Z"
        tags: [tag1, tag2, tag3]
      properties:
        value1: ${Math.random()}
        value2: ${Math.random()}
        value3: ${Math.random()}`);
        }
        sections.push(`section_${i}:\n  items:\n${items.join('\n')}`);
    }
    return sections.join('\n');
}

// Run benchmarks
function runBenchmarks() {
    console.log('Running YAML parser performance benchmarks...\n');
    console.log('=' .repeat(60));

    const results = [];

    // Test data
    const simpleYAML = generateSimpleYAML();
    const mediumYAML = generateMediumYAML();
    const largeYAML = generateLargeYAML();

    console.log(`Test data sizes:`);
    console.log(`  Simple: ${simpleYAML.length} bytes`);
    console.log(`  Medium: ${mediumYAML.length} bytes`);
    console.log(`  Large: ${largeYAML.length} bytes`);
    console.log('=' .repeat(60));

    // Benchmark 1: Simple YAML parsing
    console.log('\nTest 1: Simple YAML parsing');
    results.push(benchmark('Simple YAML parse()', () => {
        parse(simpleYAML);
    }, 10000));

    results.push(benchmark('Simple YAML parseDocument()', () => {
        parseDocument(simpleYAML);
    }, 10000));

    // Benchmark 2: Medium YAML parsing
    console.log('\nTest 2: Medium YAML parsing');
    results.push(benchmark('Medium YAML parse()', () => {
        parse(mediumYAML);
    }, 1000));

    results.push(benchmark('Medium YAML parseDocument()', () => {
        parseDocument(mediumYAML);
    }, 1000));

    // Benchmark 3: Large YAML parsing
    console.log('\nTest 3: Large YAML parsing');
    results.push(benchmark('Large YAML parse()', () => {
        parse(largeYAML);
    }, 100));

    results.push(benchmark('Large YAML parseDocument()', () => {
        parseDocument(largeYAML);
    }, 100));

    // Benchmark 4: Multi-document parsing
    console.log('\nTest 4: Multi-document YAML parsing');
    const multiDoc = `---
doc: 1
---
doc: 2
---
doc: 3
`;
    results.push(benchmark('Multi-doc parseAllDocuments()', () => {
        parseAllDocuments(multiDoc);
    }, 5000));

    // Benchmark 5: Complex nested structures
    console.log('\nTest 5: Complex nested structures');
    const complexYAML = `
root:
  level1:
    level2:
      level3:
        level4:
          level5:
            - item1: value1
            - item2: value2
            - item3:
                nested:
                  deeply:
                    - a
                    - b
                    - c
`;
    results.push(benchmark('Complex nested parse()', () => {
        parse(complexYAML);
    }, 5000));

    // Print results
    console.log('\n' + '=' .repeat(60));
    console.log('BENCHMARK RESULTS:');
    console.log('=' .repeat(60));

    const table = results.map(r => ({
        'Test': r.name,
        'Iterations': r.iterations,
        'Total (ms)': r.totalTime.toFixed(2),
        'Avg (ms)': r.avgTime.toFixed(3),
        'Ops/sec': r.opsPerSec
    }));

    console.table(table);

    // Calculate aggregate metrics
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    console.log('\n' + '=' .repeat(60));
    console.log(`Total benchmark time: ${totalTime.toFixed(2)} ms`);

    // Save results to file for comparison
    const resultsFile = `benchmark-results-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        results: results,
        environment: {
            node: process.version,
            platform: process.platform,
            arch: process.arch
        }
    }, null, 2));
    console.log(`Results saved to: ${resultsFile}`);

    console.log('\n' + '=' .repeat(60));
    console.log('OPTIMIZATION TARGETS:');
    console.log('- Lexer: charAt() and buffer operations');
    console.log('- Buffer management: substring() allocations');
    console.log('- Character checks: isEmpty() function');
    console.log('- String methods: deprecated substr()');
    console.log('=' .repeat(60));
}

// Check if dist exists
if (!fs.existsSync('./dist/index.js')) {
    console.log('Building project first...');
    require('child_process').execSync('npm run build:node', { stdio: 'inherit' });
}

// Run benchmarks
if (require.main === module) {
    runBenchmarks();
}

module.exports = { benchmark, runBenchmarks };
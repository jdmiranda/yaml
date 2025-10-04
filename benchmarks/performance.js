/**
 * Performance benchmarks for YAML parsing and stringification
 * Tests cache effectiveness, throughput, and memory usage
 */

const YAML = require('../dist/index.js')

// Sample YAML documents of varying complexity
const samples = {
  small: `
name: John Doe
age: 30
email: john@example.com
`,

  medium: `
users:
  - name: John Doe
    age: 30
    email: john@example.com
    roles:
      - admin
      - developer
  - name: Jane Smith
    age: 28
    email: jane@example.com
    roles:
      - developer
      - tester
config:
  database:
    host: localhost
    port: 5432
    name: mydb
  cache:
    enabled: true
    ttl: 3600
`,

  large: `
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
  labels:
    app: myapp
    version: "1.0"
data:
  application.yaml: |
    server:
      port: 8080
      host: 0.0.0.0
    database:
      url: jdbc:postgresql://db:5432/mydb
      username: admin
      password: secret
    features:
      - feature1
      - feature2
      - feature3
  logging.yaml: |
    level: info
    format: json
    outputs:
      - console
      - file
services:
  - name: app-service
    spec:
      selector:
        app: myapp
      ports:
        - protocol: TCP
          port: 80
          targetPort: 8080
      type: LoadBalancer
`,

  complex: `
users: &users
  - &john
    name: John Doe
    age: 30
    contact:
      email: john@example.com
      phone: "+1-555-0100"
    preferences:
      theme: dark
      notifications: true
  - &jane
    name: Jane Smith
    age: 28
    contact:
      email: jane@example.com
      phone: "+1-555-0200"
    preferences:
      theme: light
      notifications: false

teams:
  - name: Development
    lead: *john
    members: *users
  - name: QA
    lead: *jane
    members: *users

projects:
  - name: Project Alpha
    owner: *john
    team: Development
    status: active
  - name: Project Beta
    owner: *jane
    team: QA
    status: planning
`
}

// Benchmark parse throughput
function benchmarkParse(sampleName, yamlContent, iterations = 1000) {
  console.log(`\n--- Parse Benchmark: ${sampleName} (${iterations} iterations) ---`)

  // Clear caches before benchmark
  YAML.clearCaches()

  const startMem = process.memoryUsage().heapUsed
  const start = Date.now()

  for (let i = 0; i < iterations; i++) {
    YAML.parse(yamlContent)
  }

  const duration = Date.now() - start
  const endMem = process.memoryUsage().heapUsed
  const stats = YAML.getCacheStats()

  const bytesProcessed = yamlContent.length * iterations
  const throughputDocs = (iterations / duration) * 1000
  const throughputKB = (bytesProcessed / 1024 / duration) * 1000

  console.log(`  Duration: ${duration}ms`)
  console.log(`  Throughput: ${throughputDocs.toFixed(2)} docs/sec`)
  console.log(`  Throughput: ${throughputKB.toFixed(2)} KB/sec`)
  console.log(`  Cache hits: ${stats.parse.hits}`)
  console.log(`  Cache misses: ${stats.parse.misses}`)
  console.log(`  Cache hit rate: ${(stats.parse.hitRate * 100).toFixed(2)}%`)
  console.log(`  Memory delta: ${((endMem - startMem) / 1024 / 1024).toFixed(2)} MB`)

  return { duration, throughputDocs, throughputKB, stats }
}

// Benchmark stringify throughput
function benchmarkStringify(sampleName, data, iterations = 1000) {
  console.log(`\n--- Stringify Benchmark: ${sampleName} (${iterations} iterations) ---`)

  // Clear caches before benchmark
  YAML.clearCaches()

  const startMem = process.memoryUsage().heapUsed
  const start = Date.now()

  let totalBytes = 0
  for (let i = 0; i < iterations; i++) {
    const result = YAML.stringify(data)
    totalBytes += result.length
  }

  const duration = Date.now() - start
  const endMem = process.memoryUsage().heapUsed
  const stats = YAML.getCacheStats()

  const throughputDocs = (iterations / duration) * 1000
  const throughputKB = (totalBytes / 1024 / duration) * 1000

  console.log(`  Duration: ${duration}ms`)
  console.log(`  Throughput: ${throughputDocs.toFixed(2)} docs/sec`)
  console.log(`  Throughput: ${throughputKB.toFixed(2)} KB/sec`)
  console.log(`  Cache hits: ${stats.stringify.hits}`)
  console.log(`  Cache misses: ${stats.stringify.misses}`)
  console.log(`  Cache hit rate: ${(stats.stringify.hitRate * 100).toFixed(2)}%`)
  console.log(`  Memory delta: ${((endMem - startMem) / 1024 / 1024).toFixed(2)} MB`)

  return { duration, throughputDocs, throughputKB, stats }
}

// Benchmark cache effectiveness with repeated operations
function benchmarkCacheEffectiveness(sampleName, yamlContent, repetitions = 100) {
  console.log(`\n--- Cache Effectiveness: ${sampleName} (${repetitions} repetitions) ---`)

  YAML.clearCaches()

  const start = Date.now()

  // First parse (cache miss)
  const firstStart = Date.now()
  YAML.parse(yamlContent)
  const firstDuration = Date.now() - firstStart

  // Repeated parses (cache hits)
  const repeatStart = Date.now()
  for (let i = 0; i < repetitions - 1; i++) {
    YAML.parse(yamlContent)
  }
  const repeatDuration = Date.now() - repeatStart

  const totalDuration = Date.now() - start
  const stats = YAML.getCacheStats()

  const avgRepeatTime = repeatDuration / (repetitions - 1)
  const speedup = firstDuration / avgRepeatTime

  console.log(`  First parse (uncached): ${firstDuration}ms`)
  console.log(`  Avg repeat parse (cached): ${avgRepeatTime.toFixed(3)}ms`)
  console.log(`  Speedup: ${speedup.toFixed(2)}x`)
  console.log(`  Total duration: ${totalDuration}ms`)
  console.log(`  Cache hit rate: ${(stats.parse.hitRate * 100).toFixed(2)}%`)

  return { firstDuration, avgRepeatTime, speedup, stats }
}

// Main benchmark runner
function runBenchmarks() {
  console.log('=================================================')
  console.log('YAML Performance Benchmarks')
  console.log('=================================================')

  // Parse benchmarks
  console.log('\n\n### PARSE THROUGHPUT BENCHMARKS ###')
  benchmarkParse('Small Document', samples.small, 5000)
  benchmarkParse('Medium Document', samples.medium, 2000)
  benchmarkParse('Large Document', samples.large, 1000)
  benchmarkParse('Complex Document (with anchors)', samples.complex, 1000)

  // Stringify benchmarks
  console.log('\n\n### STRINGIFY THROUGHPUT BENCHMARKS ###')
  const smallData = YAML.parse(samples.small)
  const mediumData = YAML.parse(samples.medium)
  const largeData = YAML.parse(samples.large)

  benchmarkStringify('Small Document', smallData, 5000)
  benchmarkStringify('Medium Document', mediumData, 2000)
  benchmarkStringify('Large Document', largeData, 1000)

  // Cache effectiveness
  console.log('\n\n### CACHE EFFECTIVENESS BENCHMARKS ###')
  benchmarkCacheEffectiveness('Small Document', samples.small, 1000)
  benchmarkCacheEffectiveness('Medium Document', samples.medium, 500)
  benchmarkCacheEffectiveness('Large Document', samples.large, 200)

  console.log('\n\n=================================================')
  console.log('Benchmarks Complete')
  console.log('=================================================')
}

// Run benchmarks if executed directly
if (require.main === module) {
  runBenchmarks()
}

module.exports = {
  benchmarkParse,
  benchmarkStringify,
  benchmarkCacheEffectiveness,
  runBenchmarks
}

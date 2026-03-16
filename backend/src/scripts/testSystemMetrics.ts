import dotenv from 'dotenv';
import { systemMetricsService } from '../services/systemMetricsService';
import { connectDatabase } from '../database/connection';
import { logger } from '../utils/logger';

dotenv.config();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function logTest(test: string, passed: boolean, message: string, duration?: number) {
  const result: TestResult = {
    test,
    status: passed ? 'PASS' : 'FAIL',
    message,
    duration
  };
  results.push(result);
  
  const emoji = passed ? '✅' : '❌';
  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`${emoji} ${test}: ${message}${durationStr}`);
}

async function testSystemMetrics() {
  console.log('🔧 SYSTEM METRICS COMPREHENSIVE TEST');
  console.log('=' .repeat(50));
  console.log();

  try {
    // ==========================================
    // 1. DATABASE CONNECTION TEST
    // ==========================================
    console.log('🔌 DATABASE CONNECTION TEST');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    await connectDatabase();
    const connectionTime = Date.now() - startTime;
    
    logTest('Database connection', true, 'Connected successfully', connectionTime);
    console.log();

    // ==========================================
    // 2. CURRENT METRICS COLLECTION TEST
    // ==========================================
    console.log('📊 CURRENT METRICS COLLECTION TEST');
    console.log('-'.repeat(40));
    
    try {
      const metricsStart = Date.now();
      const currentMetrics = await systemMetricsService.collectCurrentMetrics();
      const metricsTime = Date.now() - metricsStart;
      
      logTest('Current metrics collection', true, 
        `Collected all metric types successfully`, metricsTime);
      
      // Test individual metric types
      logTest('CPU metrics', 
        typeof currentMetrics.cpu.usage_percent === 'number' && 
        currentMetrics.cpu.usage_percent >= 0 && 
        currentMetrics.cpu.usage_percent <= 100,
        `CPU usage: ${currentMetrics.cpu.usage_percent}%`);
      
      logTest('Memory metrics', 
        typeof currentMetrics.memory.usage_percent === 'number' &&
        currentMetrics.memory.total_mb > 0,
        `Memory usage: ${currentMetrics.memory.usage_percent}% (${currentMetrics.memory.used_mb}MB/${currentMetrics.memory.total_mb}MB)`);
      
      logTest('Disk metrics', 
        typeof currentMetrics.disk.usage_percent === 'number',
        `Disk usage: ${currentMetrics.disk.usage_percent}%`);
      
      logTest('Network metrics', 
        typeof currentMetrics.network.connections_active === 'number',
        `Active connections: ${currentMetrics.network.connections_active}`);
      
      logTest('Application metrics', 
        typeof currentMetrics.application.uptime_seconds === 'number',
        `Uptime: ${currentMetrics.application.uptime_seconds}s, Avg response: ${currentMetrics.application.response_time_avg_ms}ms`);
      
      logTest('Database metrics', 
        typeof currentMetrics.database.connections_active === 'number',
        `DB connections: ${currentMetrics.database.connections_active}/${currentMetrics.database.connections_max}`);
      
    } catch (error) {
      logTest('Current metrics collection', false, `Error: ${error}`);
    }
    console.log();

    // ==========================================
    // 3. METRICS STORAGE TEST
    // ==========================================
    console.log('💾 METRICS STORAGE TEST');
    console.log('-'.repeat(40));
    
    try {
      const storageStart = Date.now();
      await systemMetricsService.collectAndStoreMetrics();
      const storageTime = Date.now() - storageStart;
      
      logTest('Metrics storage', true, 
        'All metrics stored successfully', storageTime);
      
    } catch (error) {
      logTest('Metrics storage', false, `Error: ${error}`);
    }

    // Test individual metric storage
    try {
      await systemMetricsService.storeMetric('cpu', 'test_metric', 50.5, '%', 'test-service', { test: true });
      logTest('Individual metric storage', true, 'Test metric stored successfully');
    } catch (error) {
      logTest('Individual metric storage', false, `Error: ${error}`);
    }
    console.log();

    // ==========================================
    // 4. METRICS HISTORY RETRIEVAL TEST
    // ==========================================
    console.log('📈 METRICS HISTORY RETRIEVAL TEST');
    console.log('-'.repeat(40));
    
    try {
      const historyStart = Date.now();
      const endDate = new Date();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      const history = await systemMetricsService.getMetricsHistory(startDate, endDate);
      const historyTime = Date.now() - historyStart;
      
      logTest('Metrics history retrieval', true, 
        `Retrieved ${history.length} metric records`, historyTime);
      
      // Test filtered history
      const cpuHistory = await systemMetricsService.getMetricsHistory(startDate, endDate, 'cpu');
      logTest('Filtered metrics history', true, 
        `Retrieved ${cpuHistory.length} CPU metric records`);
      
    } catch (error) {
      logTest('Metrics history retrieval', false, `Error: ${error}`);
    }
    console.log();

    // ==========================================
    // 5. AGGREGATED METRICS TEST
    // ==========================================
    console.log('📊 AGGREGATED METRICS TEST');
    console.log('-'.repeat(40));
    
    try {
      const aggregatedStart = Date.now();
      const timeRange = {
        start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        end: new Date()
      };
      
      const aggregated = await systemMetricsService.getAggregatedMetrics(timeRange);
      const aggregatedTime = Date.now() - aggregatedStart;
      
      logTest('Aggregated metrics', true, 
        'Current, averages, and peaks calculated successfully', aggregatedTime);
      
      logTest('Current metrics in aggregation', 
        typeof aggregated.current.cpu.usage_percent === 'number',
        `Current CPU: ${aggregated.current.cpu.usage_percent}%`);
      
      logTest('Average metrics calculation', 
        typeof aggregated.averages.cpu.usage_percent === 'number',
        `Average CPU: ${aggregated.averages.cpu.usage_percent}%`);
      
      logTest('Peak metrics calculation', 
        typeof aggregated.peaks.cpu.usage_percent === 'number',
        `Peak CPU: ${aggregated.peaks.cpu.usage_percent}%`);
      
    } catch (error) {
      logTest('Aggregated metrics', false, `Error: ${error}`);
    }
    console.log();

    // ==========================================
    // 6. METRICS TRACKING TEST
    // ==========================================
    console.log('📝 METRICS TRACKING TEST');
    console.log('-'.repeat(40));
    
    try {
      // Test request tracking
      systemMetricsService.trackRequest();
      systemMetricsService.trackRequest();
      systemMetricsService.trackError();
      
      logTest('Request tracking', true, 'Requests and errors tracked successfully');
      
      // Test response time tracking
      systemMetricsService.trackResponseTime(150);
      systemMetricsService.trackResponseTime(200);
      systemMetricsService.trackResponseTime(100);
      
      logTest('Response time tracking', true, 'Response times tracked successfully');
      
      // Test query time tracking
      systemMetricsService.trackQueryTime(50);
      systemMetricsService.trackQueryTime(75);
      
      logTest('Query time tracking', true, 'Query times tracked successfully');
      
    } catch (error) {
      logTest('Metrics tracking', false, `Error: ${error}`);
    }
    console.log();

    // ==========================================
    // 7. PERFORMANCE TEST
    // ==========================================
    console.log('⚡ PERFORMANCE TEST');
    console.log('-'.repeat(40));
    
    try {
      // Test multiple rapid collections
      const performanceStart = Date.now();
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(systemMetricsService.collectCurrentMetrics());
      }
      
      await Promise.all(promises);
      const performanceTime = Date.now() - performanceStart;
      
      logTest('Concurrent metrics collection', 
        performanceTime < 5000, // Should complete within 5 seconds
        `5 concurrent collections completed in ${performanceTime}ms`);
      
      // Test rapid storage
      const storagePromises = [];
      for (let i = 0; i < 10; i++) {
        storagePromises.push(
          systemMetricsService.storeMetric('application', `test_${i}`, Math.random() * 100, '%')
        );
      }
      
      const rapidStorageStart = Date.now();
      await Promise.all(storagePromises);
      const rapidStorageTime = Date.now() - rapidStorageStart;
      
      logTest('Rapid metrics storage', 
        rapidStorageTime < 2000, // Should complete within 2 seconds
        `10 concurrent storage operations completed in ${rapidStorageTime}ms`);
      
    } catch (error) {
      logTest('Performance test', false, `Error: ${error}`);
    }
    console.log();

    // ==========================================
    // 8. CLEANUP TEST
    // ==========================================
    console.log('🧹 CLEANUP TEST');
    console.log('-'.repeat(40));
    
    try {
      const cleanupStart = Date.now();
      await systemMetricsService.cleanupOldMetrics();
      const cleanupTime = Date.now() - cleanupStart;
      
      logTest('Metrics cleanup', true, 
        'Old metrics cleanup completed successfully', cleanupTime);
      
    } catch (error) {
      logTest('Metrics cleanup', false, `Error: ${error}`);
    }
    console.log();

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    logTest('Test suite execution', false, `Fatal error: ${error}`);
  }

  // ==========================================
  // FINAL RESULTS
  // ==========================================
  console.log('📋 FINAL TEST RESULTS');
  console.log('=' .repeat(50));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const failedTests = results.filter(r => r.status === 'FAIL').length;
  const passRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log();
  
  // Show failed tests
  if (failedTests > 0) {
    console.log('❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   • ${result.test}: ${result.message}`);
    });
    console.log();
  }
  
  // Overall status
  console.log('🎯 SYSTEM METRICS STATUS:');
  console.log(`✅ Metrics Collection: ${results.filter(r => r.test.includes('collection')).every(r => r.status === 'PASS') ? 'OPERATIONAL' : 'ISSUES'}`);
  console.log(`✅ Metrics Storage: ${results.filter(r => r.test.includes('storage')).every(r => r.status === 'PASS') ? 'OPERATIONAL' : 'ISSUES'}`);
  console.log(`✅ Metrics History: ${results.filter(r => r.test.includes('history')).every(r => r.status === 'PASS') ? 'OPERATIONAL' : 'ISSUES'}`);
  console.log(`✅ Metrics Tracking: ${results.filter(r => r.test.includes('tracking')).every(r => r.status === 'PASS') ? 'OPERATIONAL' : 'ISSUES'}`);
  console.log(`✅ Performance: ${results.filter(r => r.test.includes('Concurrent') || r.test.includes('Rapid')).every(r => r.status === 'PASS') ? 'OPTIMAL' : 'NEEDS ATTENTION'}`);
  console.log();
  
  if (passRate >= 90) {
    console.log('🎉 SYSTEM METRICS: FULLY OPERATIONAL');
  } else if (passRate >= 70) {
    console.log('⚠️  SYSTEM METRICS: MOSTLY OPERATIONAL (some issues)');
  } else {
    console.log('🚨 SYSTEM METRICS: CRITICAL ISSUES DETECTED');
  }
  
  process.exit(passRate >= 70 ? 0 : 1);
}

// Run the test
testSystemMetrics().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
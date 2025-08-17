#!/usr/bin/env node

/**
 * Smoke tests for F1 API endpoints
 * Tests critical endpoints to ensure Jolpica integration is working
 */

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

class SmokeTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testEndpoint(name, endpoint, validator) {
    try {
      this.log(`Testing ${name}...`, colors.blue);
      
      const url = `${BASE_URL}${endpoint}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Basic structure validation
      if (!data.MRData) {
        throw new Error('Missing MRData in response');
      }

      // Run custom validator if provided
      if (validator) {
        validator(data.MRData);
      }

      this.log(`✓ ${name} - PASSED`, colors.green);
      this.passed++;
      this.results.push({ name, status: 'PASSED', url });
      
      // Rate limiting: wait 200ms between requests
      await this.sleep(200);
      
    } catch (error) {
      this.log(`✗ ${name} - FAILED: ${error.message}`, colors.red);
      this.failed++;
      this.results.push({ name, status: 'FAILED', error: error.message, url: `${BASE_URL}${endpoint}` });
    }
  }

  async runTests() {
    this.log(`${colors.bold}🧪 F1 API Smoke Tests${colors.reset}`);
    this.log(`Testing against: ${BASE_URL}\n`);

    // Test 1: Current season driver standings
    await this.testEndpoint(
      'Current Driver Standings',
      '/current/driverStandings.json',
      (data) => {
        if (!data.StandingsTable || !data.StandingsTable.StandingsLists) {
          throw new Error('Missing StandingsTable in response');
        }
        const standings = data.StandingsTable.StandingsLists[0]?.DriverStandings;
        if (!standings || standings.length === 0) {
          throw new Error('No driver standings found');
        }
        if (!standings[0].Driver || !standings[0].position) {
          throw new Error('Invalid driver standing structure');
        }
      }
    );

    // Test 2: Current season constructor standings  
    await this.testEndpoint(
      'Current Constructor Standings',
      '/current/constructorStandings.json',
      (data) => {
        if (!data.StandingsTable || !data.StandingsTable.StandingsLists) {
          throw new Error('Missing StandingsTable in response');
        }
        const standings = data.StandingsTable.StandingsLists[0]?.ConstructorStandings;
        if (!standings || standings.length === 0) {
          throw new Error('No constructor standings found');
        }
      }
    );

    // Test 3: Last race results
    await this.testEndpoint(
      'Last Race Results',
      '/current/last/results.json',
      (data) => {
        if (!data.RaceTable || !data.RaceTable.Races) {
          throw new Error('Missing RaceTable in response');
        }
        const race = data.RaceTable.Races[0];
        if (!race || !race.Results) {
          throw new Error('No race results found');
        }
        if (!race.raceName || !race.Circuit) {
          throw new Error('Invalid race structure');
        }
      }
    );

    // Test 4: Available seasons
    await this.testEndpoint(
      'Available Seasons',
      '/seasons.json?limit=100',
      (data) => {
        if (!data.SeasonTable || !data.SeasonTable.Seasons) {
          throw new Error('Missing SeasonTable in response');
        }
        const seasons = data.SeasonTable.Seasons;
        if (!seasons || seasons.length === 0) {
          throw new Error('No seasons found');
        }
        // Check that we have recent seasons
        const currentYear = new Date().getFullYear();
        const hasRecent = seasons.some(s => parseInt(s.season) >= currentYear - 1);
        if (!hasRecent) {
          throw new Error('No recent seasons found');
        }
      }
    );

    // Test 5: Current season rounds
    await this.testEndpoint(
      'Current Season Rounds',
      '/current.json',
      (data) => {
        if (!data.RaceTable || !data.RaceTable.Races) {
          throw new Error('Missing RaceTable in response');
        }
        const races = data.RaceTable.Races;
        if (!races || races.length === 0) {
          throw new Error('No races found for current season');
        }
      }
    );

    // Test 6: Circuits information
    await this.testEndpoint(
      'Current Season Circuits',
      '/current/circuits.json',
      (data) => {
        if (!data.CircuitTable || !data.CircuitTable.Circuits) {
          throw new Error('Missing CircuitTable in response');
        }
        const circuits = data.CircuitTable.Circuits;
        if (!circuits || circuits.length === 0) {
          throw new Error('No circuits found');
        }
      }
    );

    this.printResults();
  }

  printResults() {
    this.log(`\n${colors.bold}📊 Test Results Summary${colors.reset}`);
    this.log(`${'='.repeat(50)}`);
    
    this.results.forEach(result => {
      const status = result.status === 'PASSED' ? 
        `${colors.green}✓ PASSED${colors.reset}` : 
        `${colors.red}✗ FAILED${colors.reset}`;
      
      this.log(`${result.name.padEnd(30)} ${status}`);
      
      if (result.status === 'FAILED') {
        this.log(`  Error: ${result.error}`, colors.red);
        this.log(`  URL: ${result.url}`, colors.yellow);
      }
    });

    this.log(`${'='.repeat(50)}`);
    this.log(`Total: ${this.passed + this.failed} | Passed: ${colors.green}${this.passed}${colors.reset} | Failed: ${colors.red}${this.failed}${colors.reset}`);
    
    if (this.failed > 0) {
      this.log(`\n${colors.red}${colors.bold}⚠️  Some tests failed. Check the API endpoints and try again.${colors.reset}`);
      process.exit(1);
    } else {
      this.log(`\n${colors.green}${colors.bold}🎉 All tests passed! Jolpica API is working correctly.${colors.reset}`);
      process.exit(0);
    }
  }
}

// Run the tests
const runner = new SmokeTestRunner();
runner.runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests: ${error.message}${colors.reset}`);
  process.exit(1);
});

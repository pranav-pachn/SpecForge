export const PatternDetectionConfig = {
  // General Data Minimums
  MIN_EXECUTIONS: 10,
  MIN_PROMPT_EXECUTIONS: 20,

  // Severity Thresholds for Stage Failure
  STAGE_FAILURE: {
    // If deviation from baseline is >= these percentages (e.g. 0.15 = 15 percentage points)
    CRITICAL_DEVIATION: 0.25,
    HIGH_DEVIATION: 0.15,
    MEDIUM_DEVIATION: 0.05,
    LOW_DEVIATION: 0.01,
  },

  // Severity Thresholds for Stage Latency (multiplier of baseline)
  STAGE_LATENCY: {
    CRITICAL_MULTIPLIER: 2.0,
    HIGH_MULTIPLIER: 1.5,
    MEDIUM_MULTIPLIER: 1.25,
    LOW_MULTIPLIER: 1.1,
  },

  // Severity Thresholds for Prompt Degradation
  PROMPT_DEGRADATION: {
    CRITICAL_DEVIATION: 0.20,
    HIGH_DEVIATION: 0.10,
    MEDIUM_DEVIATION: 0.05,
    LOW_DEVIATION: 0.02,
  },

  // Severity Thresholds for Repair Loops
  REPAIR_LOOP: {
    CRITICAL_AVG_LOOPS: 3.0,
    HIGH_AVG_LOOPS: 2.0,
    MEDIUM_AVG_LOOPS: 1.0,
    LOW_AVG_LOOPS: 0.5,
  }
};

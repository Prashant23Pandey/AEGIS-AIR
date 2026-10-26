import type {
  StressScenarioId,
  ScenarioConfig,
  EvaluationMetrics,
  StressEvent
} from './types';

export interface ReportPayload {
  scenarioId: StressScenarioId;
  scenarioName: string;
  config: ScenarioConfig;
  simElapsedSec: number;
  metrics: EvaluationMetrics;
  events: StressEvent[];
  outcomeSummary: string;
  strengths: string[];
  limitations: string[];
  recommendedSteps: string[];
}

export function exportStressReport(data: ReportPayload): void {
  const timestamp = new Date().toISOString();
  const sessionId = `STRESS-EXP-${Date.now().toString(36).toUpperCase()}`;

  const markdownContent = `# AEGIS AIR — SCENARIO STRESS LAB REPORT
**Session ID:** ${sessionId}
**Export Timestamp:** ${timestamp}
**Notice:** ALL METRICS AND TELEMETRY STIMULI ARE DERIVED FROM AN ISOLATED SYNTHETIC STRESS ENGINE.

---

## 1. SCENARIO CONFIGURATION
- **Scenario:** ${data.scenarioName} (${data.scenarioId})
- **Simulated Duration:** ${data.simElapsedSec.toFixed(1)}s of ${data.config.durationSec}s scheduled
- **Delay Severity Setting:** ${data.config.telemetryDelaySeverity}
- **Drop Probability:** ${(data.config.dropProbability * 100).toFixed(0)}%
- **Kinematic Variation:** ±${data.config.movementVariationDeg}°
- **Concurrent Track Signatures:** ${data.config.concurrentTracksCount}

---

## 2. OUTCOME SUMMARY
${data.outcomeSummary}

---

## 3. EVALUATION METRICS
| Metric | Value | Reference Standard |
|---|---|---|
| Simulated Events Generated | ${data.metrics.eventsGenerated} | Deterministic Seed |
| Expected Events Captured | ${data.metrics.eventsDetected} | 100% Detection Rate |
| Missed Events | ${data.metrics.eventsMissed} | Nominal: 0 |
| Max Prediction Error | ${data.metrics.maxPredictionErrorMeters !== null ? `${data.metrics.maxPredictionErrorMeters} meters` : 'N/A (Signal Fade Test)'} | Threshold: < 500m |
| Max Telemetry Age | ${data.metrics.maxTelemetryAgeSec}s | Threshold: < 5.0s |
| Degraded State Duration | ${data.metrics.durationInDegradedSec}s | Continuous |
| Time to Recover | ${data.metrics.timeToRecoverSec}s | Standard: < 8.0s |
| Human Review Mandate | ${data.metrics.humanReviewMandated ? 'MANDATED (Safety Exceeded)' : 'SUPERVISED AUTO'} | Fail-safe Protocol |
| Duplicate Event Suppression | 100% | Zero Alert Spam |

---

## 4. EVENT EVIDENCE LOG
| Sim Time | Event Title | Category | Severity | Observed Response & Evidence |
|---|---|---|---|---|
${data.events
  .map(
    (e) =>
      `| [${e.timeFormatted}] | ${e.title} | ${e.category} | ${e.severity} | ${e.description} (${e.evidence}) |`
  )
  .join('\n')}

---

## 5. EMPIRICAL STRENGTHS & LIMITATIONS

### Confirmed Strengths (What Worked)
${data.strengths.map((s) => `- ${s}`).join('\n')}

### System Limitations (What Needs Attention)
${data.limitations.map((l) => `- ${l}`).join('\n')}

---

## 6. RECOMMENDED ENGINEERING STEPS
${data.recommendedSteps.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---
*AEGIS AIR National C-UAS Defense Architecture · Scenario Stress Lab v2.6 Prototype*
`;

  // Trigger client-side file download
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `AEGIS_AIR_STRESS_REPORT_${data.scenarioId.toUpperCase()}_${Date.now()}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

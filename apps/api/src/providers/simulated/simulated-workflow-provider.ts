import { Injectable } from '@nestjs/common';
import { WorkflowRunStatus } from '../../common/enums/workflow-run-status.enum';
import { WorkflowEntity } from '../../workflows/workflow.entity';
import {
  WorkflowExecutionProvider,
  type ProviderExecuteParams,
} from '../interfaces/workflow-execution-provider';
import { ProviderExecutionResult } from '../types/provider-execution.types';
import { ProviderType } from '../types/provider-type';

@Injectable()
export class SimulatedWorkflowProvider implements WorkflowExecutionProvider {
  getProviderType(): ProviderType {
    return ProviderType.Simulated;
  }

  getProviderName(): string {
    return 'SimulatedWorkflowProvider';
  }

  validatePayload(): void {
    // Workflow-level schema validation is handled by the orchestrator.
  }

  execute(params: ProviderExecuteParams): Promise<ProviderExecutionResult> {
    const started = Date.now();
    const logs: ProviderExecutionResult['logs'] = [];

    try {
      logs.push({
        stepName: 'simulated_processing',
        message: 'Simulating processing (deterministic, no external calls).',
      });

      const outputPayload = this.buildSimulatedOutput(
        params.workflow,
        params.inputPayload,
      );
      logs.push({
        stepName: 'formatting',
        message: 'Formatting simulated output payload.',
      });

      const executionTimeMs = Date.now() - started;
      return Promise.resolve({
        status: WorkflowRunStatus.Completed,
        outputPayload,
        errorMessage: null,
        executionTimeMs,
        metadata: this.buildMetadata(
          executionTimeMs,
          WorkflowRunStatus.Completed,
        ),
        logs,
      });
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Provider execution failed (simulated).';
      logs.push({ stepName: 'provider_simulated_error', message });
      const executionTimeMs = Date.now() - started;
      return Promise.resolve({
        status: WorkflowRunStatus.Failed,
        outputPayload: null,
        errorMessage: message,
        executionTimeMs,
        metadata: this.buildMetadata(executionTimeMs, WorkflowRunStatus.Failed),
        logs,
      });
    }
  }

  private buildSimulatedOutput(
    workflow: WorkflowEntity,
    inputPayload: Record<string, unknown>,
  ): Record<string, unknown> {
    const workflowSlug = workflow.slug;

    const topic =
      typeof inputPayload.topic === 'string' ? inputPayload.topic.trim() : null;
    const keyword =
      typeof inputPayload.keyword === 'string'
        ? inputPayload.keyword.trim()
        : null;
    const audience =
      typeof inputPayload.audience === 'string'
        ? inputPayload.audience.trim()
        : null;
    const tone =
      typeof inputPayload.tone === 'string' ? inputPayload.tone.trim() : null;
    const content =
      typeof inputPayload.content === 'string'
        ? inputPayload.content.trim()
        : null;
    const reportText =
      typeof inputPayload.reportText === 'string'
        ? inputPayload.reportText.trim()
        : null;
    const notes =
      typeof inputPayload.notes === 'string' ? inputPayload.notes.trim() : null;
    const followUpStyle =
      typeof inputPayload.followUpStyle === 'string'
        ? inputPayload.followUpStyle.trim()
        : null;
    const leadDetails =
      typeof inputPayload.leadDetails === 'string'
        ? inputPayload.leadDetails.trim()
        : null;
    const businessType =
      typeof inputPayload.businessType === 'string'
        ? inputPayload.businessType.trim()
        : null;
    const customerMessage =
      typeof inputPayload.customerMessage === 'string'
        ? inputPayload.customerMessage.trim()
        : null;

    const safeSnippet = (text: string, maxLen: number) =>
      text.length <= maxLen ? text : `${text.slice(0, maxLen).trim()}...`;

    const normalizeLines = (text: string) =>
      text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 12);

    switch (workflowSlug) {
      case 'content-summary': {
        const base = content ?? reportText ?? 'Content not provided';
        const snippet = safeSnippet(base, 220);
        return {
          summary: `Simulated ${tone ?? 'Concise'} summary for ${audience ?? 'a general audience'}: ${snippet}`,
          keyPoints: [
            'Main idea captured from the provided source material.',
            'Important context rewritten for the intended audience.',
            'Recommended next step identified for follow-up.',
          ],
          actionItems: [
            'Review the summary for domain-specific nuance.',
            'Share the concise version with the intended audience.',
          ],
        };
      }
      case 'meeting-notes': {
        const lines = notes ? normalizeLines(notes) : [];
        const bullets = lines.map((l) => l.replace(/^[-*]\s*/, ''));
        return {
          summary:
            bullets.length > 0
              ? `Simulated meeting recap based on ${bullets.length} note item${bullets.length === 1 ? '' : 's'}.`
              : 'Simulated meeting recap based on the provided notes.',
          followUpStyle: followUpStyle ?? 'Action items',
          decisions: bullets.slice(0, 2),
          nextSteps: [
            'Confirm owners for open action items.',
            'Share the recap with meeting participants.',
            'Schedule the next checkpoint if needed.',
          ],
        };
      }
      case 'lead-qualification': {
        const text = `${leadDetails ?? ''} ${businessType ?? ''}`.toLowerCase();
        const hasUrgency = /urgent|soon|this month|asap|immediately/.test(text);
        const hasBudget = /budget|approved|funded|paid|contract/.test(text);
        const hasFit = /automation|workflow|reporting|operations|support/.test(
          text,
        );
        const score = [hasUrgency, hasBudget, hasFit].filter(Boolean).length;
        return {
          qualification: score >= 2 ? 'Qualified' : 'Needs Nurture',
          score,
          businessType: businessType ?? 'General business',
          rationale:
            'Simulated qualification using deterministic fit, urgency, and budget signals.',
          nextStep:
            score >= 2
              ? 'Schedule a discovery call with a concise agenda.'
              : 'Send a short follow-up asking about timeline and goals.',
        };
      }
      case 'blog-outline': {
        const titleBase = topic ?? 'Sample topic';
        const audienceText = audience ?? 'a general technical audience';
        const keywordText = keyword ?? 'workflow automation';
        return {
          title: `${titleBase}: Practical Guide`,
          meta: {
            audience: audienceText,
            keyword: keywordText,
          },
          outline: [
            `Why ${titleBase} matters for ${audienceText}`,
            `Core concepts behind ${keywordText}`,
            'Common pitfalls to avoid',
            'Implementation checklist',
            'Conclusion and next steps',
          ],
          suggestedIntro: `This simulated outline frames ${titleBase} for ${audienceText} with a focus on ${keywordText}.`,
        };
      }
      case 'customer-support-response': {
        const snippet = safeSnippet(
          customerMessage ?? 'Customer message not provided',
          180,
        );
        return {
          tone: tone ?? 'Helpful',
          response:
            `Thanks for reaching out. I understand the request as: "${snippet}" ` +
            'I will review the details, confirm the current status, and follow up with the next available step.',
          checklist: [
            'Acknowledge the customer concern.',
            'Confirm what will be checked.',
            'Set a clear next step without overpromising.',
          ],
        };
      }
      case 'blog-draft':
      case 'report-summary':
      case 'intake-classification':
      case 'meeting-summary':
      case 'ai-business-summary': {
        // Legacy seed slugs are retained only for older local databases.
        const notesItems = notes ? normalizeLines(notes) : [];
        return {
          headline: 'Legacy Demo Workflow Output',
          audience: audience ?? 'Business stakeholders',
          tone: tone ?? 'Professional',
          executiveSummary:
            notesItems.length > 0
              ? `Simulated summary based on ${notesItems.length} structured note item${notesItems.length === 1 ? '' : 's'}.`
              : `Simulated output generated for legacy workflow slug: ${workflowSlug}.`,
          highlights: notesItems.slice(0, 3),
          recommendedActions: [
            'Use the updated demo workflow templates for new portfolio runs.',
            'Keep existing historical runs available for traceability.',
          ],
        };
      }
      default:
        return {
          summary: 'Simulated output generated for this workflow.',
          workflowSlug,
        };
    }
  }

  private buildMetadata(
    executionTimeMs: number,
    status: WorkflowRunStatus.Completed | WorkflowRunStatus.Failed,
  ): Record<string, unknown> {
    return {
      provider: this.getProviderType(),
      executionTimeMs,
      status,
      timestamp: new Date().toISOString(),
      simulated: true,
    };
  }
}

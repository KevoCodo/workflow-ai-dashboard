import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FailureCategory } from '../common/enums/failure-category.enum';
import { WorkflowEventType } from '../common/enums/workflow-event-type.enum';
import { WorkflowRunStatus } from '../common/enums/workflow-run-status.enum';
import { ProviderType } from '../providers/types/provider-type';
import { WorkflowEventEntity } from '../workflow-events/workflow-event.entity';
import { WorkflowEntity } from '../workflows/workflow.entity';
import { WorkflowLogEntity } from '../workflow-logs/workflow-log.entity';
import { WorkflowRunEntity } from './workflow-run.entity';

@Injectable()
export class WorkflowRunsSeed implements OnModuleInit {
  private readonly logger = new Logger(WorkflowRunsSeed.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(WorkflowRunEntity)
    private readonly runsRepo: Repository<WorkflowRunEntity>,
    @InjectRepository(WorkflowLogEntity)
    private readonly logsRepo: Repository<WorkflowLogEntity>,
    @InjectRepository(WorkflowEventEntity)
    private readonly eventsRepo: Repository<WorkflowEventEntity>,
    @InjectRepository(WorkflowEntity)
    private readonly workflowsRepo: Repository<WorkflowEntity>,
  ) {}

  async onModuleInit() {
    const raw = this.configService.get<string>('SEED_SAMPLE_RUNS');
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
    const seedEnabled = raw != null ? raw === 'true' : nodeEnv !== 'production';
    if (!seedEnabled) return;

    const existingCount = await this.runsRepo.count();
    if (existingCount > 0) {
      this.logger.log('Sample runs seed skipped (runs already exist).');
      return;
    }

    const workflows = await this.workflowsRepo.find();
    const bySlug = new Map(workflows.map((w) => [w.slug, w]));

    const now = Date.now();
    const mkDate = (minsAgo: number) => new Date(now - minsAgo * 60_000);

    const samples: Array<{
      slug: string;
      status: WorkflowRunStatus;
      inputPayload: Record<string, unknown>;
      outputPayload: Record<string, unknown> | null;
      errorMessage: string | null;
      failureReason?: string | null;
      failureCategory?: FailureCategory | null;
      retryEligible?: boolean;
      lastErrorAt?: Date | null;
      startedAt: Date | null;
      completedAt: Date | null;
      logs: Array<{ stepName: string; message: string }>;
    }> = [
      {
        slug: 'content-summary',
        status: WorkflowRunStatus.Completed,
        inputPayload: {
          content:
            'The operations team launched a workflow dashboard to track requests, run status, provider routing, and follow-up actions.',
          audience: 'Operations leaders',
          tone: 'Concise',
        },
        outputPayload: {
          summary:
            'Simulated Concise summary for Operations leaders: The operations team launched a workflow dashboard to track requests, run status, provider routing, and follow-up actions.',
          keyPoints: [
            'Main idea captured from the provided source material.',
            'Important context rewritten for the intended audience.',
            'Recommended next step identified for follow-up.',
          ],
          actionItems: [
            'Review the summary for domain-specific nuance.',
            'Share the concise version with the intended audience.',
          ],
        },
        errorMessage: null,
        startedAt: mkDate(55),
        completedAt: mkDate(54),
        logs: [
          {
            stepName: 'queued',
            message: 'Workflow run created and queued for simulated execution.',
          },
          {
            stepName: 'validation',
            message: 'Validating input payload against workflow input schema.',
          },
          {
            stepName: 'routing',
            message: 'Routing to workflow runner: content-summary',
          },
          {
            stepName: 'simulated_processing',
            message:
              'Simulating processing (deterministic, no external calls).',
          },
          {
            stepName: 'formatting',
            message: 'Formatting simulated output payload.',
          },
          {
            stepName: 'completed',
            message: 'Workflow run completed successfully (simulated).',
          },
        ],
      },
      {
        slug: 'lead-qualification',
        status: WorkflowRunStatus.Failed,
        inputPayload: {
          leadDetails:
            'A regional services team asked about automating weekly reporting but has not confirmed budget.',
          businessType: 'B2B services',
        },
        outputPayload: null,
        errorMessage:
          'Simulated failure: output formatting step encountered an unexpected edge case.',
        failureReason:
          'Simulated failure: output formatting step encountered an unexpected edge case.',
        failureCategory: FailureCategory.SYSTEM,
        retryEligible: false,
        lastErrorAt: mkDate(31),
        startedAt: mkDate(32),
        completedAt: mkDate(31),
        logs: [
          {
            stepName: 'queued',
            message: 'Workflow run created and queued for simulated execution.',
          },
          {
            stepName: 'validation',
            message: 'Validating input payload against workflow input schema.',
          },
          {
            stepName: 'routing',
            message: 'Routing to workflow runner: lead-qualification',
          },
          {
            stepName: 'simulated_processing',
            message:
              'Simulating processing (deterministic, no external calls).',
          },
          {
            stepName: 'failed',
            message:
              'Simulated failure: output formatting step encountered an unexpected edge case.',
          },
        ],
      },
      {
        slug: 'blog-outline',
        status: WorkflowRunStatus.Running,
        inputPayload: {
          topic: 'AI workflow dashboards',
          audience: 'Engineering managers',
          keyword: 'workflow automation',
        },
        outputPayload: null,
        errorMessage: null,
        startedAt: mkDate(7),
        completedAt: null,
        logs: [
          {
            stepName: 'queued',
            message: 'Workflow run created and queued for simulated execution.',
          },
          {
            stepName: 'routing',
            message: 'Routing to workflow runner: blog-outline',
          },
          {
            stepName: 'simulated_processing',
            message:
              'Simulating processing (deterministic, no external calls).',
          },
        ],
      },
      {
        slug: 'meeting-notes',
        status: WorkflowRunStatus.Queued,
        inputPayload: {
          notes:
            '- Discussed milestones\n- Identified risks\n- Next steps agreed',
          followUpStyle: 'Action items',
        },
        outputPayload: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        logs: [
          {
            stepName: 'queued',
            message: 'Workflow run created and queued for simulated execution.',
          },
        ],
      },
      {
        slug: 'customer-support-response',
        status: WorkflowRunStatus.Completed,
        inputPayload: {
          customerMessage:
            'I need help understanding when my request will be reviewed.',
          tone: 'Helpful',
        },
        outputPayload: {
          tone: 'Helpful',
          response:
            'Thanks for reaching out. I understand the request as: "I need help understanding when my request will be reviewed." I will review the details, confirm the current status, and follow up with the next available step.',
          checklist: [
            'Acknowledge the customer concern.',
            'Confirm what will be checked.',
            'Set a clear next step without overpromising.',
          ],
        },
        errorMessage: null,
        startedAt: mkDate(18),
        completedAt: mkDate(17),
        logs: [
          {
            stepName: 'queued',
            message: 'Workflow run created and queued for simulated execution.',
          },
          {
            stepName: 'validation',
            message: 'Validating input payload against workflow input schema.',
          },
          {
            stepName: 'routing',
            message: 'Routing to workflow runner: customer-support-response',
          },
          {
            stepName: 'simulated_processing',
            message:
              'Simulating processing (deterministic, no external calls).',
          },
          {
            stepName: 'formatting',
            message: 'Formatting simulated output payload.',
          },
          {
            stepName: 'completed',
            message: 'Workflow run completed successfully (simulated).',
          },
        ],
      },
    ];

    for (const sample of samples) {
      const workflow = bySlug.get(sample.slug);
      if (!workflow) continue;

      const run = await this.runsRepo.save(
        this.runsRepo.create({
          workflowId: workflow.id,
          workflow,
          retriedFromRunId: null,
          retryCount: 0,
          maxRetries: 3,
          inputPayload: sample.inputPayload,
          outputPayload: sample.outputPayload,
          status: sample.status,
          errorMessage: sample.errorMessage,
          failureReason: sample.failureReason ?? null,
          failureCategory: sample.failureCategory ?? null,
          retryEligible: sample.retryEligible ?? false,
          lastErrorAt: sample.lastErrorAt ?? null,
          startedAt: sample.startedAt,
          completedAt: sample.completedAt,
        }),
      );

      await this.logsRepo.save(
        sample.logs.map((l) =>
          this.logsRepo.create({
            workflowRunId: run.id,
            stepName: l.stepName,
            message: l.message,
          }),
        ),
      );

      await this.eventsRepo.save(
        this.buildSeedEvents(run.id, workflow.providerType, sample).map(
          (event) => this.eventsRepo.create(event),
        ),
      );
    }

    this.logger.log(`Seeded sample runs: ${samples.length}`);
  }

  private buildSeedEvents(
    runId: string,
    providerType: ProviderType | null | undefined,
    sample: {
      status: WorkflowRunStatus;
      startedAt: Date | null;
      errorMessage: string | null;
      failureCategory?: FailureCategory | null;
    },
  ): Array<{
    runId: string;
    type: WorkflowEventType;
    message: string;
  }> {
    const provider = providerType ?? ProviderType.Simulated;
    const events: Array<{
      runId: string;
      type: WorkflowEventType;
      message: string;
    }> = [
      {
        runId,
        type: WorkflowEventType.RUN_CREATED,
        message: 'Run created and queued for execution.',
      },
    ];

    if (sample.startedAt) {
      events.push(
        {
          runId,
          type: WorkflowEventType.VALIDATION_STARTED,
          message: 'Validation started for workflow input payload.',
        },
        {
          runId,
          type: WorkflowEventType.RUN_STARTED,
          message: 'Run started.',
        },
        {
          runId,
          type: WorkflowEventType.PROVIDER_SELECTED,
          message: `Provider selected: ${provider}.`,
        },
        {
          runId,
          type: WorkflowEventType.PROVIDER_REQUEST_SENT,
          message: `Provider request sent: ${provider}.`,
        },
      );
    }

    if (
      sample.status === WorkflowRunStatus.Completed ||
      sample.status === WorkflowRunStatus.Failed
    ) {
      events.push({
        runId,
        type: WorkflowEventType.PROVIDER_RESPONSE_RECEIVED,
        message: `Provider response received with status: ${sample.status}.`,
      });
    }

    if (sample.status === WorkflowRunStatus.Completed) {
      events.push({
        runId,
        type: WorkflowEventType.RUN_COMPLETED,
        message: 'Run completed successfully.',
      });
    }

    if (sample.status === WorkflowRunStatus.Failed) {
      events.push({
        runId,
        type: WorkflowEventType.RUN_FAILED,
        message: `Run failed: ${sample.failureCategory ?? FailureCategory.UNKNOWN}.`,
      });
    }

    return events;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowRunStatus } from '../common/enums/workflow-run-status.enum';
import { WorkflowStatus } from '../common/enums/workflow-status.enum';
import { WorkflowRunEntity } from '../workflow-runs/workflow-run.entity';
import { WorkflowEntity } from '../workflows/workflow.entity';

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

type OverviewMostUsedWorkflow = {
  workflowId: string;
  workflowName: string;
  workflowSlug: string;
  totalRuns: number;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(WorkflowEntity)
    private readonly workflowsRepo: Repository<WorkflowEntity>,
    @InjectRepository(WorkflowRunEntity)
    private readonly runsRepo: Repository<WorkflowRunEntity>,
  ) {}

  async getOverview(): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    inactiveWorkflows: number;
    totalRuns: number;
    successfulRuns: number;
    completedRuns: number;
    failedRuns: number;
    queuedRuns: number;
    runningRuns: number;
    retriedRuns: number;
    successRate: number;
    averageRuntimeMs: number;
    averageExecutionTimeMs: number;
    mostUsedWorkflow: OverviewMostUsedWorkflow | null;
  }> {
    const [totalWorkflows, activeWorkflows, inactiveWorkflows] =
      await Promise.all([
        this.workflowsRepo.count(),
        this.workflowsRepo.count({ where: { status: WorkflowStatus.Active } }),
        this.workflowsRepo.count({
          where: { status: WorkflowStatus.Inactive },
        }),
      ]);

    const statusRows = await this.runsRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('r.status')
      .getRawMany<{ status: WorkflowRunStatus; count: number }>();

    const counts: Record<WorkflowRunStatus, number> = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };
    for (const row of statusRows) {
      if (row?.status && row.status in counts)
        counts[row.status] = Number(row.count) || 0;
    }

    const totalRuns =
      counts.queued + counts.running + counts.completed + counts.failed;
    const successRate =
      totalRuns > 0 ? round1((counts.completed / totalRuns) * 100) : 0;

    const retriedRuns = await this.runsRepo
      .createQueryBuilder('r')
      .where('r.retried_from_run_id IS NOT NULL')
      .orWhere('r.retry_count > 0')
      .getCount();

    const avgRow = await this.runsRepo
      .createQueryBuilder('r')
      .select(
        `AVG(EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) * 1000)`,
        'avgMs',
      )
      .where('r.started_at IS NOT NULL')
      .andWhere('r.completed_at IS NOT NULL')
      .andWhere('r.status = :status', { status: WorkflowRunStatus.Completed })
      .getRawOne<{ avgMs: string | null }>();
    const averageRuntimeMs = avgRow?.avgMs
      ? Math.round(Number(avgRow.avgMs))
      : 0;

    const mostUsed = await this.runsRepo
      .createQueryBuilder('r')
      .innerJoin(WorkflowEntity, 'w', 'w.id = r.workflow_id')
      .select('w.id', 'workflowId')
      .addSelect('w.name', 'workflowName')
      .addSelect('w.slug', 'workflowSlug')
      .addSelect('COUNT(*)::int', 'totalRuns')
      .groupBy('w.id')
      .addGroupBy('w.name')
      .addGroupBy('w.slug')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne<OverviewMostUsedWorkflow>();

    return {
      totalWorkflows,
      activeWorkflows,
      inactiveWorkflows,
      totalRuns,
      successfulRuns: counts.completed,
      completedRuns: counts.completed,
      failedRuns: counts.failed,
      queuedRuns: counts.queued,
      runningRuns: counts.running,
      retriedRuns,
      successRate,
      averageRuntimeMs,
      averageExecutionTimeMs: averageRuntimeMs,
      mostUsedWorkflow: mostUsed ?? null,
    };
  }

  async getStatusBreakdown(): Promise<{
    queued: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    const rows = await this.runsRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('r.status')
      .getRawMany<{ status: WorkflowRunStatus; count: number }>();

    const counts: Record<WorkflowRunStatus, number> = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };
    for (const row of rows) {
      if (row?.status && row.status in counts)
        counts[row.status] = Number(row.count) || 0;
    }
    return counts;
  }

  async getRecentActivity(): Promise<
    Array<{
      runId: string;
      workflowName: string;
      workflowSlug: string;
      status: WorkflowRunStatus;
      createdAt: Date;
      completedAt: Date | null;
    }>
  > {
    const rows = await this.runsRepo
      .createQueryBuilder('r')
      .innerJoin(WorkflowEntity, 'w', 'w.id = r.workflow_id')
      .select('r.id', 'runId')
      .addSelect('w.name', 'workflowName')
      .addSelect('w.slug', 'workflowSlug')
      .addSelect('r.status', 'status')
      .addSelect('r.created_at', 'createdAt')
      .addSelect('r.completed_at', 'completedAt')
      .orderBy('r.created_at', 'DESC')
      .limit(15)
      .getRawMany<{
        runId: string;
        workflowName: string;
        workflowSlug: string;
        status: WorkflowRunStatus;
        createdAt: Date;
        completedAt: Date | null;
      }>();

    return rows ?? [];
  }

  async getWorkflowUsage(): Promise<
    Array<{
      workflowId: string;
      workflowName: string;
      workflowSlug: string;
      totalRuns: number;
      completedRuns: number;
      failedRuns: number;
      successRate: number;
      averageExecutionTimeMs: number;
    }>
  > {
    const rows = await this.workflowsRepo
      .createQueryBuilder('w')
      .leftJoin(WorkflowRunEntity, 'r', 'r.workflow_id = w.id')
      .select('w.id', 'workflowId')
      .addSelect('w.name', 'workflowName')
      .addSelect('w.slug', 'workflowSlug')
      .addSelect('COUNT(r.id)::int', 'totalRuns')
      .addSelect(
        `SUM(CASE WHEN r.status = '${WorkflowRunStatus.Completed}' THEN 1 ELSE 0 END)::int`,
        'completedRuns',
      )
      .addSelect(
        `SUM(CASE WHEN r.status = '${WorkflowRunStatus.Failed}' THEN 1 ELSE 0 END)::int`,
        'failedRuns',
      )
      .addSelect(
        `AVG(CASE WHEN r.started_at IS NOT NULL AND r.completed_at IS NOT NULL THEN EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) * 1000 ELSE NULL END)`,
        'avgMs',
      )
      .groupBy('w.id')
      .addGroupBy('w.name')
      .addGroupBy('w.slug')
      .orderBy('COUNT(r.id)', 'DESC')
      .addOrderBy('w.name', 'ASC')
      .getRawMany<{
        workflowId: string;
        workflowName: string;
        workflowSlug: string;
        totalRuns: number;
        completedRuns: number;
        failedRuns: number;
        avgMs: string | null;
      }>();

    return (rows ?? []).map((row) => {
      const totalRuns = Number(row.totalRuns) || 0;
      const completedRuns = Number(row.completedRuns) || 0;
      const failedRuns = Number(row.failedRuns) || 0;
      const finished = completedRuns + failedRuns;
      const successRate =
        finished > 0 ? round1((completedRuns / finished) * 100) : 0;
      const averageExecutionTimeMs = row.avgMs
        ? Math.round(Number(row.avgMs))
        : 0;
      return {
        workflowId: row.workflowId,
        workflowName: row.workflowName,
        workflowSlug: row.workflowSlug,
        totalRuns,
        completedRuns,
        failedRuns,
        successRate,
        averageExecutionTimeMs,
      };
    });
  }
}

import { Repository } from 'typeorm';
import { WorkflowRunStatus } from '../common/enums/workflow-run-status.enum';
import { WorkflowRunEntity } from '../workflow-runs/workflow-run.entity';
import { WorkflowEntity } from '../workflows/workflow.entity';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  function createQueryBuilderMock(result: Record<string, unknown>) {
    return {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(result.rawMany ?? []),
      getRawOne: jest.fn().mockResolvedValue(result.rawOne ?? null),
      getCount: jest.fn().mockResolvedValue(result.count ?? 0),
    };
  }

  function setup({
    statusRows,
    retriedRuns,
    averageRuntimeMs,
  }: {
    statusRows: Array<{ status: WorkflowRunStatus; count: number }>;
    retriedRuns: number;
    averageRuntimeMs: number | null;
  }) {
    const workflowsRepo = {
      count: jest
        .fn()
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1),
      createQueryBuilder: jest.fn(),
    };

    const runsRepo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(createQueryBuilderMock({ rawMany: statusRows }))
        .mockReturnValueOnce(createQueryBuilderMock({ count: retriedRuns }))
        .mockReturnValueOnce(
          createQueryBuilderMock({
            rawOne: {
              avgMs: averageRuntimeMs == null ? null : String(averageRuntimeMs),
            },
          }),
        )
        .mockReturnValueOnce(
          createQueryBuilderMock({
            rawOne: {
              workflowId: 'workflow-id',
              workflowName: 'Demo workflow',
              workflowSlug: 'demo-workflow',
              totalRuns: 3,
            },
          }),
        ),
    };

    const service = new AnalyticsService(
      workflowsRepo as unknown as Repository<WorkflowEntity>,
      runsRepo as unknown as Repository<WorkflowRunEntity>,
    );

    return { service, runsRepo };
  }

  it('calculates the overview metric cards from run history', async () => {
    const { service, runsRepo } = setup({
      statusRows: [
        { status: WorkflowRunStatus.Completed, count: 2 },
        { status: WorkflowRunStatus.Failed, count: 1 },
        { status: WorkflowRunStatus.Running, count: 1 },
      ],
      retriedRuns: 1,
      averageRuntimeMs: 1234,
    });

    const overview = await service.getOverview();

    expect(overview.totalRuns).toBe(4);
    expect(overview.successfulRuns).toBe(2);
    expect(overview.completedRuns).toBe(2);
    expect(overview.failedRuns).toBe(1);
    expect(overview.retriedRuns).toBe(1);
    expect(overview.successRate).toBe(50);
    expect(overview.averageRuntimeMs).toBe(1234);
    expect(overview.averageExecutionTimeMs).toBe(1234);
    expect(runsRepo.createQueryBuilder).toHaveBeenCalledTimes(4);
  });

  it('handles an empty run history safely', async () => {
    const { service } = setup({
      statusRows: [],
      retriedRuns: 0,
      averageRuntimeMs: null,
    });

    const overview = await service.getOverview();

    expect(overview.totalRuns).toBe(0);
    expect(overview.successfulRuns).toBe(0);
    expect(overview.failedRuns).toBe(0);
    expect(overview.retriedRuns).toBe(0);
    expect(overview.successRate).toBe(0);
    expect(overview.averageRuntimeMs).toBe(0);
  });
});

import { WorkflowRunStatus } from '../../common/enums/workflow-run-status.enum';
import { WorkflowEntity } from '../../workflows/workflow.entity';
import { SimulatedWorkflowProvider } from './simulated-workflow-provider';

describe('SimulatedWorkflowProvider', () => {
  it('continues to return deterministic completed output and simulation logs', async () => {
    const provider = new SimulatedWorkflowProvider();
    const workflow = {
      slug: 'lead-qualification',
    } as WorkflowEntity;

    const result = await provider.execute({
      workflow,
      inputPayload: {
        leadDetails:
          'Urgent operations team request with approved budget for reporting automation.',
        businessType: 'B2B services',
      },
    });

    expect(result.status).toBe(WorkflowRunStatus.Completed);
    expect(result.errorMessage).toBeNull();
    expect(result.outputPayload).toMatchObject({
      qualification: 'Qualified',
      score: 3,
    });
    expect(result.metadata).toMatchObject({
      provider: 'simulated',
      status: WorkflowRunStatus.Completed,
    });
    expect(result.logs.map((log) => log.stepName)).toEqual([
      'simulated_processing',
      'formatting',
    ]);
  });

  it('produces structured output for the demo workflow templates', async () => {
    const provider = new SimulatedWorkflowProvider();

    await expect(
      provider.execute({
        workflow: { slug: 'content-summary' } as WorkflowEntity,
        inputPayload: {
          content: 'Milestone approved. Two risks remain open.',
          audience: 'Leadership team',
          tone: 'Concise',
        },
      }),
    ).resolves.toMatchObject({
      status: WorkflowRunStatus.Completed,
      outputPayload: {
        keyPoints: expect.any(Array),
      },
    });

    await expect(
      provider.execute({
        workflow: { slug: 'meeting-notes' } as WorkflowEntity,
        inputPayload: {
          notes: '- Confirmed milestone\n- Assigned follow-up owner',
          followUpStyle: 'Action items',
        },
      }),
    ).resolves.toMatchObject({
      status: WorkflowRunStatus.Completed,
      outputPayload: {
        followUpStyle: 'Action items',
        nextSteps: expect.any(Array),
      },
    });

    await expect(
      provider.execute({
        workflow: { slug: 'blog-outline' } as WorkflowEntity,
        inputPayload: {
          topic: 'Workflow dashboards',
          audience: 'Engineering managers',
          keyword: 'workflow automation',
        },
      }),
    ).resolves.toMatchObject({
      status: WorkflowRunStatus.Completed,
      outputPayload: {
        outline: expect.any(Array),
      },
    });

    await expect(
      provider.execute({
        workflow: { slug: 'customer-support-response' } as WorkflowEntity,
        inputPayload: {
          customerMessage: 'When will my request be reviewed?',
          tone: 'Helpful',
        },
      }),
    ).resolves.toMatchObject({
      status: WorkflowRunStatus.Completed,
      outputPayload: {
        tone: 'Helpful',
        checklist: expect.any(Array),
      },
    });
  });
});

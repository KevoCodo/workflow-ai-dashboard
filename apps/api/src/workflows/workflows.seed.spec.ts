import { Repository } from 'typeorm';
import { ProviderType } from '../providers/types/provider-type';
import { WorkflowEntity } from './workflow.entity';
import { WorkflowsSeed } from './workflows.seed';

describe('WorkflowsSeed', () => {
  it('seeds the Phase 18A demo workflow templates as simulated by default', async () => {
    const insert = jest.fn(() => Promise.resolve({} as never));
    const save = jest.fn(() => Promise.resolve([] as never));
    const workflowsRepo = {
      find: jest.fn(() => Promise.resolve([])),
      insert,
      save,
    } as unknown as Repository<WorkflowEntity>;
    const seed = new WorkflowsSeed(workflowsRepo);

    await seed.onModuleInit();

    const expectedSlugs = [
      'content-summary',
      'meeting-notes',
      'lead-qualification',
      'blog-outline',
      'customer-support-response',
    ];

    expect(insert).toHaveBeenCalledWith(
      expect.arrayContaining(
        expectedSlugs.map((slug) =>
          expect.objectContaining({
            slug,
            providerType: ProviderType.Simulated,
          }),
        ),
      ),
    );
  });
});

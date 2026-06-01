import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowStatus } from '../common/enums/workflow-status.enum';
import { WorkflowEntity } from './workflow.entity';
import { ProviderType } from '../providers/types/provider-type';

@Injectable()
export class WorkflowsSeed implements OnModuleInit {
  private readonly logger = new Logger(WorkflowsSeed.name);

  constructor(
    @InjectRepository(WorkflowEntity)
    private readonly workflowsRepo: Repository<WorkflowEntity>,
  ) {}

  async onModuleInit() {
    const seeds: Array<
      Pick<
        WorkflowEntity,
        | 'name'
        | 'slug'
        | 'description'
        | 'category'
        | 'status'
        | 'providerType'
        | 'inputSchema'
      >
    > = [
      {
        name: 'Content Summary',
        slug: 'content-summary',
        description:
          'Summarize public-safe content for a specific audience and tone.',
        category: 'Content Operations',
        status: WorkflowStatus.Active,
        providerType: ProviderType.Simulated,
        inputSchema: {
          fields: [
            {
              name: 'content',
              label: 'Content',
              type: 'textarea',
              required: true,
              placeholder:
                'Paste sanitized content, notes, or source material for the demo.',
            },
            {
              name: 'audience',
              label: 'Audience',
              type: 'text',
              required: true,
              placeholder: 'Example: operations team',
            },
            {
              name: 'tone',
              label: 'Tone',
              type: 'select',
              required: false,
              options: [
                { label: 'Concise', value: 'Concise' },
                { label: 'Professional', value: 'Professional' },
                { label: 'Executive', value: 'Executive' },
              ],
            },
          ],
        },
      },
      {
        name: 'Meeting Notes',
        slug: 'meeting-notes',
        description:
          'Turn sanitized meeting notes into a concise recap and follow-up list.',
        category: 'Internal Operations',
        status: WorkflowStatus.Active,
        providerType: ProviderType.Simulated,
        inputSchema: {
          fields: [
            {
              name: 'notes',
              label: 'Meeting Notes',
              type: 'textarea',
              required: true,
              placeholder:
                '- Reviewed project status\n- Confirmed next milestone\n- Assigned follow-up owners',
            },
            {
              name: 'followUpStyle',
              label: 'Follow-up Style',
              type: 'select',
              required: false,
              options: [
                { label: 'Action items', value: 'Action items' },
                { label: 'Executive recap', value: 'Executive recap' },
                { label: 'Team update', value: 'Team update' },
              ],
            },
          ],
        },
      },
      {
        name: 'Lead Qualification',
        slug: 'lead-qualification',
        description:
          'Score a generic inbound lead and suggest a practical next step.',
        category: 'Sales Operations',
        status: WorkflowStatus.Active,
        providerType: ProviderType.Simulated,
        inputSchema: {
          fields: [
            {
              name: 'leadDetails',
              label: 'Lead Details',
              type: 'textarea',
              required: true,
              placeholder:
                'Example: Small business owner asked about automating weekly reporting.',
            },
            {
              name: 'businessType',
              label: 'Business Type',
              type: 'text',
              required: true,
              placeholder: 'Example: B2B services',
            },
          ],
        },
      },
      {
        name: 'Blog Outline',
        slug: 'blog-outline',
        description:
          'Create a structured blog outline from a topic, audience, and keyword.',
        category: 'Content Operations',
        status: WorkflowStatus.Active,
        providerType: ProviderType.Simulated,
        inputSchema: {
          fields: [
            {
              name: 'topic',
              label: 'Topic',
              type: 'text',
              required: true,
            },
            {
              name: 'audience',
              label: 'Audience',
              type: 'text',
              required: true,
            },
            {
              name: 'keyword',
              label: 'Keyword',
              type: 'text',
              required: false,
              placeholder: 'Example: workflow automation',
            },
          ],
        },
      },
      {
        name: 'Customer Support Response',
        slug: 'customer-support-response',
        description:
          'Draft a generic, public-safe support response from a customer message.',
        category: 'Customer Operations',
        status: WorkflowStatus.Active,
        providerType: ProviderType.Simulated,
        inputSchema: {
          fields: [
            {
              name: 'customerMessage',
              label: 'Customer Message',
              type: 'textarea',
              required: true,
              placeholder:
                'Example: I need help understanding the status of my request.',
            },
            {
              name: 'tone',
              label: 'Tone',
              type: 'select',
              required: false,
              options: [
                { label: 'Helpful', value: 'Helpful' },
                { label: 'Professional', value: 'Professional' },
                { label: 'Apologetic', value: 'Apologetic' },
              ],
            },
          ],
        },
      },
    ];

    const slugs = seeds.map((s) => s.slug);
    const existing = await this.workflowsRepo.find({
      where: slugs.map((slug) => ({ slug })),
    });
    const existingBySlug = new Map(existing.map((w) => [w.slug, w]));

    const toInsert = seeds.filter((s) => !existingBySlug.has(s.slug));
    const toUpdate = seeds
      .map((seed) => {
        const workflow = existingBySlug.get(seed.slug);
        if (!workflow) return null;
        return this.workflowsRepo.create({
          ...workflow,
          ...seed,
          id: workflow.id,
        });
      })
      .filter((workflow): workflow is WorkflowEntity => workflow != null);

    if (toInsert.length > 0) {
      await this.workflowsRepo.insert(toInsert);
      this.logger.log(
        `Seeded workflows: ${toInsert.map((s) => s.slug).join(', ')}`,
      );
    }

    if (toUpdate.length > 0) {
      await this.workflowsRepo.save(toUpdate);
      this.logger.log(
        `Updated seeded workflows: ${toUpdate.map((s) => s.slug).join(', ')}`,
      );
    }

    if (toInsert.length === 0 && toUpdate.length === 0) {
      this.logger.log('Seeded workflows skipped (already current).');
      return;
    }
  }
}

import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowStatus } from '../../common/enums/workflow-status.enum';
import { ProviderType } from '../../providers/types/provider-type';
import { WorkflowInputSchemaDto } from './workflow-schema.dto';

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must be lowercase and use hyphens only (example: content-summary).',
  })
  slug!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: ProviderType;

  @IsDefined()
  @ValidateNested()
  @Type(() => WorkflowInputSchemaDto)
  inputSchema!: WorkflowInputSchemaDto;
}

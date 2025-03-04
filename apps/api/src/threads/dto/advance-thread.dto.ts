import { AvailableComponentDto } from '../../components/dto/generate-component.dto';
import { MessageRequest } from './message.dto';

export class AdvanceThreadDto {
  messagesToAppend?: MessageRequest[];
  contextKey?: string;
  availableComponents?: AvailableComponentDto[];
  stream?: boolean;
}

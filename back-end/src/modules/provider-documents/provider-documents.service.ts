import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ProviderDocumentsService {
  addResume() {
    throw new BadRequestException('Resume uploading has been removed.');
  }

  addCertificate() {
    throw new BadRequestException('Certificate uploading has been removed.');
  }
}

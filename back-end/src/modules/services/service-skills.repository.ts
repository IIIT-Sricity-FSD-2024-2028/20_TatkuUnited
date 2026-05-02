import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseService, ServiceSkill } from '../../common/database/database.service';

@Injectable()
export class ServiceSkillsRepository {
  constructor(private readonly db: DatabaseService) {}

  findByService(serviceId: string): ServiceSkill[] {
    return this.db.serviceSkills.filter(
      (row) => row.service_id === serviceId,
    );
  }

  findBySkill(skillId: string): ServiceSkill[] {
    return this.db.serviceSkills.filter(
      (row) => row.skill_id === skillId,
    );
  }

  link(serviceId: string, skillId: string): ServiceSkill {
    // Check for duplicate
    const exists = this.db.serviceSkills.find(
      (row) => row.service_id === serviceId && row.skill_id === skillId,
    );
    if (exists) {
      throw new ConflictException(
        `Skill "${skillId}" is already linked to service "${serviceId}"`,
      );
    }

    const record: ServiceSkill = { service_id: serviceId, skill_id: skillId };
    this.db.serviceSkills.push(record);
    return record;
  }

  unlink(serviceId: string, skillId: string): ServiceSkill {
    const index = this.db.serviceSkills.findIndex(
      (row) => row.service_id === serviceId && row.skill_id === skillId,
    );
    if (index < 0) {
      throw new NotFoundException(
        `Link between service "${serviceId}" and skill "${skillId}" not found`,
      );
    }
    const [removed] = this.db.serviceSkills.splice(index, 1);
    return removed;
  }
}

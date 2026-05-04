import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PlatformSettingsRepository } from './platform-settings.repository';
import { CreatePlatformSettingDto } from './dto/create-platform-setting.dto';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';
import { PlatformSetting } from '../../common/database/database.service';
import { Role } from '../../common/enums/role.enum';

/** Keys that non-SUPER_USER roles are allowed to read. */
const PUBLIC_KEYS = ['maintenance_mode', 'max_booking_window_days'];

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly repo: PlatformSettingsRepository) {}

  // ───────────────────────────── Standard CRUD ─────────────────────────────

  /** Create a new setting. Throws ConflictException if the key already exists. */
  create(dto: CreatePlatformSettingDto): PlatformSetting {
    const existing = this.repo.findByKey(dto.key);
    if (existing) {
      throw new ConflictException(
        `Platform setting with key "${dto.key}" already exists`,
      );
    }
    return this.repo.upsert(dto.key, dto.value, dto.description, dto.updated_by);
  }

  /** Return all settings. */
  findAll(): PlatformSetting[] {
    return this.repo.findAll();
  }

  /** Find a single setting by UUID. Throws NotFoundException if not found. */
  findOne(id: string): PlatformSetting {
    const row = this.repo.findById(id);
    if (!row) {
      throw new NotFoundException(
        `Platform setting with id "${id}" not found`,
      );
    }
    return row;
  }

  /** Find a single setting by key. Throws NotFoundException if not found. */
  findByKey(key: string): PlatformSetting {
    const row = this.repo.findByKey(key);
    if (!row) {
      throw new NotFoundException(
        `Platform setting with key "${key}" not found`,
      );
    }
    return row;
  }

  /**
   * Update a setting by its UUID.
   * Finds the existing row, then uses repo.upsert on the update path.
   */
  update(id: string, dto: UpdatePlatformSettingDto): PlatformSetting {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(
        `Platform setting with id "${id}" not found`,
      );
    }
    return this.repo.upsert(
      dto.key ?? existing.key,
      dto.value ?? existing.value,
      dto.description ?? existing.description,
      dto.updated_by ?? existing.updated_by,
    );
  }

  /** Delete a setting by UUID. Throws NotFoundException if not found. */
  remove(id: string): PlatformSetting {
    const removed = this.repo.delete(id);
    if (!removed) {
      throw new NotFoundException(
        `Platform setting with id "${id}" not found`,
      );
    }
    return removed;
  }

  // ──────────────── Special methods consumed by other modules ──────────────

  /**
   * Read a setting by key, enforcing a whitelist for non-SUPER_USER callers.
   * Throws ForbiddenException if the caller's role is not allowed to read the key.
   */
  getPublicSetting(key: string, callerRole: Role): PlatformSetting {
    if (callerRole !== Role.SUPER_USER && !PUBLIC_KEYS.includes(key)) {
      throw new ForbiddenException(
        `Role "${callerRole}" is not allowed to read setting "${key}"`,
      );
    }
    return this.findByKey(key);
  }

  /**
   * Retrieve a numeric setting value with a fallback.
   * Used by RevenueLedgerService — must never crash; returns fallback on miss.
   */
  getNumericSetting(key: string, fallback: number): number {
    const row = this.repo.findByKey(key);
    if (!row) return fallback;
    const parsed = parseFloat(row.value);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Retrieve a boolean setting value with a fallback.
   * Stored as "true" or "false" strings.
   */
  getBooleanSetting(key: string, fallback: boolean): boolean {
    const row = this.repo.findByKey(key);
    if (!row) return fallback;
    return row.value === 'true';
  }

  /**
   * Retrieve a string setting value with a fallback.
   */
  getStringSetting(key: string, fallback: string): string {
    const row = this.repo.findByKey(key);
    if (!row) return fallback;
    return row.value;
  }
}

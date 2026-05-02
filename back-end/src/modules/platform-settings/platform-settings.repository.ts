import { Injectable } from '@nestjs/common';
import {
  DatabaseService,
  PlatformSetting,
} from '../../common/database/database.service';

@Injectable()
export class PlatformSettingsRepository {
  constructor(private readonly db: DatabaseService) {}

  /** Return every platform setting. */
  findAll(): PlatformSetting[] {
    return this.db.platformSettings;
  }

  /** Find a single setting by its UUID. Returns the row or null. */
  findById(id: string): PlatformSetting | null {
    return (
      this.db.platformSettings.find((row) => row.setting_id === id) ?? null
    );
  }

  /** Find a single setting by its unique key. Most-called method. */
  findByKey(key: string): PlatformSetting | null {
    return this.db.platformSettings.find((row) => row.key === key) ?? null;
  }

  /**
   * Upsert a setting.
   * - If the key already exists: update value, description, updated_at, updated_by.
   * - Otherwise: push a brand-new row with db.genId() and db.now().
   */
  upsert(
    key: string,
    value: string,
    description: string | undefined,
    updatedBy: string,
  ): PlatformSetting {
    const existing = this.findByKey(key);

    if (existing) {
      existing.value = value;
      if (description !== undefined) {
        existing.description = description;
      }
      existing.updated_at = this.db.now();
      existing.updated_by = updatedBy;
      return existing;
    }

    const newSetting: PlatformSetting = {
      setting_id: this.db.genId(),
      key,
      value,
      description: description ?? '',
      updated_at: this.db.now(),
      updated_by: updatedBy,
    };
    this.db.platformSettings.push(newSetting);
    return newSetting;
  }

  /** Hard-delete by setting_id. Returns the deleted row, or null if not found. */
  delete(id: string): PlatformSetting | null {
    const index = this.db.platformSettings.findIndex(
      (row) => row.setting_id === id,
    );
    if (index < 0) return null;
    const [removed] = this.db.platformSettings.splice(index, 1);
    return removed;
  }
}

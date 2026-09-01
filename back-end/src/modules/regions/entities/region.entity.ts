import { Region } from '../../../common/database/database.service';

export class RegionEntity implements Region {
  region_id: string;
  region_name: string;
  is_active: boolean;
  created_at: string;
}

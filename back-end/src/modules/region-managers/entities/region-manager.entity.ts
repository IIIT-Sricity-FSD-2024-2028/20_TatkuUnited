import { RegionManager } from '../../../common/database/database.service';

export class RegionManagerEntity implements RegionManager {
  rm_id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  region_id: string;
}

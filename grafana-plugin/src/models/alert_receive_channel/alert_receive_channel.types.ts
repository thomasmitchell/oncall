import { Heartbeat } from 'models/heartbeat/heartbeat.types';
import { UserDTO as User } from 'models/user';

export enum MaintenanceMode {
  Debug,
  Maintenance,
}

export interface AlertReceiveChannel {
  id: string;
  integration: number;
  smile_code: string;
  verbal_name: string;
  description: string;
  author: User['pk'];
  team: number;
  created_at: string;
  integration_url: string;
  allow_source_based_resolving: boolean;
  is_able_to_autoresolve: boolean;
  default_channel_filter: number;
  instructions: string;
  demo_alert_enabled: boolean;
  maintenance_mode?: MaintenanceMode;
  heartbeat: Heartbeat | null;
  is_available_for_integration_heartbeat: boolean;
  allow_delete: boolean;
  deleted?: boolean;
}

export interface AlertReceiveChannelChoice {
  display_name: string;
  value: number;
}

export interface AlertReceiveChannelOption {
  display_name: string;
  value: number;
  featured: boolean;
  short_description: string;
}

export interface AlertReceiveChannelCounters {
  alerts_count: number;
  alert_groups_count: number;
  alerts_count_last_week: number;
}

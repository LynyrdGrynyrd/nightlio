/**
 * Group types
 */

export interface GroupOption {
  id: number;
  group_id: number;
  name: string;
  icon?: string;
  emoji?: string;
  color?: string;
  order_index: number;
}

export interface Group {
  id: number;
  user_id: number;
  name: string;
  emoji?: string;
  options: GroupOption[];
}

export interface CreateGroupData {
  name: string;
  emoji?: string;
}

export interface CreateGroupOptionData {
  name: string;
  icon?: string;
  emoji?: string;
  color?: string;
}

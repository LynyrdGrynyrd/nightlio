/**
 * Important days / countdown types
 */

export interface ImportantDay {
  id: number;
  user_id: number;
  title: string;
  date: string;
  type: 'countdown' | 'anniversary' | 'reminder';
  emoji?: string;
  created_at: string;
}

export interface CreateImportantDayData {
  title: string;
  date: string;
  type: 'countdown' | 'anniversary' | 'reminder';
  emoji?: string;
}

export interface UpdateImportantDayData {
  title?: string;
  date?: string;
  type?: 'countdown' | 'anniversary' | 'reminder';
  emoji?: string;
}

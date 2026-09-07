export interface AnnouncementBarConfig {
  id: string;
  isEnabled: boolean;
  speed: number; // Seconds for a full marquee scroll cycle (default: 25)
  messages: string[];
  updatedAt?: string | Date;
  createdAt?: string | Date;
}

export interface UpdateAnnouncementBarInput {
  isEnabled?: boolean;
  speed?: number;
  messages?: string[];
}

export interface WAMessage {
  id: string;
  lead_id: string | null;
  direction: 'out' | 'in';
  status: string;
  message_type: string;
  body: string | null;
  image_url: string | null;
  template_name: string | null;
  cadence_step: number | null;
  error_message: string | null;
  created_at: string;
}

export interface WALeadInfo {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  origin: string | null;
  cadence_step: number;
  cadence_state: string;
  cadence_next_at: string | null;
  cadence_exhausted: boolean;
  whatsapp_opt_out: boolean;
  last_contact_at: string | null;
}

export interface WAConversation {
  lead: WALeadInfo;
  lastMessage: WAMessage | null;
  unreadCount: number;
}

export interface WATemplate {
  id: string;
  name: string;
  meta_name: string;
  body_preview: string;
  step_order: number | null;
  delay_hours: number | null;
  is_active: boolean;
}

export interface WAConfig {
  is_configured: boolean;
  updated_at: string;
}

export type WAFilter = 'all' | 'unread' | 'in_cadence' | 'paused' | 'no_reply';

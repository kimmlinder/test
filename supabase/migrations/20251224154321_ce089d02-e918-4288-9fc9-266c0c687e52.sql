-- Add new order status values for custom order workflow
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'accepted' AFTER 'pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'accepted';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preview_sent' AFTER 'in_progress';
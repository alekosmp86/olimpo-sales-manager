export const MessageType = {
  DANGER: "danger",
  WARNING: "warning",
  INFO: "info",
  SUCCESS: "success",
} as const;

export type MessageTypeValue = typeof MessageType[keyof typeof MessageType];
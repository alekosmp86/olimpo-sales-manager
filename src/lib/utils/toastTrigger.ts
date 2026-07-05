import { MessageType, MessageTypeValue } from "@/lib/constants/messageType";

export type ToastTrigger = {
  success: (msg: string, duration?: number) => void;
  error: (msg: string, duration?: number) => void;
  info: (msg: string, duration?: number) => void;
  warn: (msg: string, duration?: number) => void;
};

let globalToast: ToastTrigger | null = null;

export const setGlobalToast = (trigger: ToastTrigger | null) => {
  globalToast = trigger;
};

export const triggerGlobalToast = (message: string, type: MessageTypeValue, duration?: number) => {
  if (globalToast) {
    if (type === MessageType.SUCCESS) globalToast.success(message, duration);
    else if (type === MessageType.DANGER) globalToast.error(message, duration);
    else if (type === MessageType.WARNING) globalToast.warn(message, duration);
    else globalToast.info(message, duration);
  }
};

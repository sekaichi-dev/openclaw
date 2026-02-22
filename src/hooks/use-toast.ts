import { useState } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

let toastIdCounter = 0;

function genId() {
  toastIdCounter = (toastIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return toastIdCounter.toString();
}

function addToast(toast: Omit<Toast, "id">) {
  const id = genId();
  const newToast = { ...toast, id };
  toasts.push(newToast);
  
  listeners.forEach((listener) => listener([...toasts]));
  
  // Auto-remove toast after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);
  
  return id;
}

function removeToast(id: string) {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach((listener) => listener([...toasts]));
  }
}

export function useToast() {
  const [, setToasts] = useState<Toast[]>([]);
  
  const toast = ({ ...props }: Omit<Toast, "id">) => {
    return addToast(props);
  };
  
  return {
    toast,
    dismiss: removeToast,
  };
}
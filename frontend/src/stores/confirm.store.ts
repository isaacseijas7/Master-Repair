import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,
  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve });
    }),
  handleConfirm: () => {
    get().resolve?.(true);
    set({ isOpen: false, options: null, resolve: null });
  },
  handleCancel: () => {
    get().resolve?.(false);
    set({ isOpen: false, options: null, resolve: null });
  },
}));

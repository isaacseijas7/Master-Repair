import { useConfirmStore } from '@/stores/confirm.store';

export function useConfirm() {
  return useConfirmStore((s) => s.confirm);
}

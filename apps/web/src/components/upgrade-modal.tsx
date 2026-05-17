'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useCheckout } from '@/hooks/use-subscription';

const PRO_FEATURES = [
  'Unlimited daily exercises',
  'Unlimited flashcards',
  'Vocabulary import with AI enrichment',
  'Verb conjugation import',
  'AI correction for translations',
  'AI correction for free writing',
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { mutate, isPending } = useCheckout();

  return (
    <Modal open={open} onClose={onClose} title="Upgrade to Pro">
      <p className="text-sm text-gray-600 mb-4">
        Unlock all features for just <span className="font-semibold text-gray-900">€7/month</span>.
      </p>

      <ul className="space-y-2 mb-6">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-green-500 font-bold">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Maybe later
        </Button>
        <Button onClick={() => mutate()} loading={isPending}>
          Upgrade for €7/month
        </Button>
      </div>
    </Modal>
  );
}

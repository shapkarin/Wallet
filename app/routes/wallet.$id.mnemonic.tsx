import type { Route } from "./+types/wallet.$id.mnemonic";
import MnemonicReveal from '../components/MnemonicReveal';

export default function MnemonicRevealPage({ params }: Route.ComponentProps) {
  return (
    <div>
      <MnemonicReveal walletId={params.id} />
    </div>
  );
}

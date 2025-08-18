import type { Route } from "./+types/wallet.$id.private-key";
import PrivateKeyReveal from '../components/PrivateKeyReveal';

export default function PrivateKeyRevealPage({ params }: Route.ComponentProps) {
  return (
    <div>
      <PrivateKeyReveal walletId={params.id} />
    </div>
  );
}

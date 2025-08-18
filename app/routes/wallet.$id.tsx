import type { Route } from "./+types/wallet.$id";

export default function WalletDetails({ params }: Route.ComponentProps) {
  return (
    <div>
      <h1>Wallet Details</h1>
      <p>Details for wallet: {params.id}</p>
    </div>
  );
}

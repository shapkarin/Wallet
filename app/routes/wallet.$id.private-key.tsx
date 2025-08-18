import type { Route } from "./+types/wallet.$id.private-key";

export default function PrivateKeyReveal({ params }: Route.ComponentProps) {
  return (
    <div>
      <h1>Private Key Reveal</h1>
      <p>Reveal private key for wallet: {params.id}</p>
    </div>
  );
}

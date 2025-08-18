import type { Route } from "./+types/wallet.$id.mnemonic";

export default function MnemonicReveal({ params }: Route.ComponentProps) {
  return (
    <div>
      <h1>Mnemonic Phrase Reveal</h1>
      <p>Reveal mnemonic phrase for wallet: {params.id}</p>
    </div>
  );
}

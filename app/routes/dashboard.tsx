import WalletList from '../components/WalletList';
import BalanceDashboard from '../components/BalanceDashboard';

export default function Dashboard() {
  return (
    <div>
      <h1>Wallet Dashboard</h1>
      <BalanceDashboard />
      <WalletList />
    </div>
  );
}

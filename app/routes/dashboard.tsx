import Layout from '../components/Layout';
import WalletList from '../components/WalletList';
import BalanceDashboard from '../components/BalanceDashboard';

export default function Dashboard() {
  return (
    <Layout>
      <div>
        <h1>Wallet Dashboard</h1>
        <BalanceDashboard />
        <WalletList />
      </div>
    </Layout>
  );
}

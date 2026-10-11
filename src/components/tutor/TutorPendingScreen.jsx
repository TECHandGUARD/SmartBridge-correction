import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
export default function TutorPendingScreen({ onRefresh }) {
  const { signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const refresh = async () => { setChecking(true); try { await onRefresh(); } finally { setChecking(false); } };
  return <main className="max-w-lg mx-auto p-8 text-center space-y-4">
    <h1 className="text-2xl font-semibold">Tutor verification pending</h1>
    <p>Your application must be reviewed before you can access tutor tools. Contact support if you need to correct your details.</p>
    <Button onClick={refresh} disabled={checking}>{checking ? 'Checking…' : 'Check verification'}</Button>
    <Button variant="outline" onClick={signOut}>Sign out</Button>
  </main>;
}

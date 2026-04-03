'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const defaultAdmins = ['admin@example.com'];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => setUser(nextUser));
  }, []);

  const admins = useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    return fromEnv ? fromEnv.split(',').map((item) => item.trim().toLowerCase()) : defaultAdmins;
  }, []);

  const isAdmin = Boolean(user?.email && admins.includes(user.email.toLowerCase()));

  return (
    <main className="shell">
      <section className="card">
        <h1>Admin page</h1>
        <p className="sub">Allow only trusted operators to edit content and monitor user questions.</p>
        <p>Current user: {user?.email ?? 'Not logged in'}</p>
        <p>Role: {isAdmin ? 'Admin' : 'Viewer'}</p>
        {!isAdmin && <p className="status">Access limited. Add your email to NEXT_PUBLIC_ADMIN_EMAILS.</p>}
        <Link href="/">← Back to learning app</Link>
      </section>
    </main>
  );
}

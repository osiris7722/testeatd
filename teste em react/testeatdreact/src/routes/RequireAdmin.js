import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { isAdminEmailAllowed } from '../adminAccess';

export default function RequireAdmin({ children }) {
  const [state, setState] = useState({ loading: true, user: null });
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, user: null });
        return;
      }

      const allowed = isAdminEmailAllowed(user.email);
      if (!allowed) {
        await signOut(auth);
        setState({ loading: false, user: null });
        return;
      }

      setState({ loading: false, user });
    });
    return () => unsub();
  }, []);

  if (state.loading) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        A carregar…
      </div>
    );
  }

  if (!state.user) {
    return (
      <Navigate
        to={`/admin_rocha?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
}

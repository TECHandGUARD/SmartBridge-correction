import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileHeader from './MobileHeader';
import MobileBottomTabs from './MobileBottomTabs';
import { useAuth } from '@/lib/AuthContext';
import { withTimeout } from '@/lib/auth-utils';
// ✅ FIXED: Correct import path
import TutorPendingScreen from '@/components/tutor/TutorPendingScreen';

const TUTOR_ROLES = ['sace_tutor', 'student_tutor', 'tutor_pending', 'tutor'];

// ✅ Hardcoded admin emails for bypass


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};
const pageTransition = { duration: 0.22, ease: 'easeInOut' };

export default function AppLayout() {
  const { user, isLoadingAuth: loading, checkUser: fetchUser, isAdmin, signOut } = useAuth();
  const [tutorVerified, setTutorVerified] = useState(null);
  const [tutorError, setTutorError] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  useEffect(() => {
    let cancelled = false;
    setTutorVerified(null); setTutorError(false);
    if (!user || isAdmin || !TUTOR_ROLES.includes(user.role)) return;
    withTimeout(supabase.from('tutor_profiles').select('is_verified').eq('user_id', user.id).maybeSingle()).then(({ data, error }) => {
      if (cancelled) return;
      if (error) setTutorError(true);
      else setTutorVerified(data?.is_verified === true && user.role !== 'tutor_pending');
    }).catch(() => { if (!cancelled) setTutorError(true); });
    return () => { cancelled = true; };
  }, [user, isAdmin]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    return isMobile ? (
      <div className="min-h-screen bg-background flex flex-col">
        <MobileHeader />
        <main className="flex-1 pt-14 pb-16">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
              <Outlet context={{ user }} />
            </motion.div>
          </AnimatePresence>
        </main>
        <MobileBottomTabs user={user} />
      </div>
    ) : (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar user={user} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
              <Outlet context={{ user }} />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    );
  }

  // ✅ Admin bypass – skip onboarding and pending screens

  if (isAdmin) {
    return isMobile ? (
      <div className="min-h-screen bg-background flex flex-col">
        <MobileHeader />
        <main className="flex-1 pt-14 pb-16">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
              <Outlet context={{ user }} />
            </motion.div>
          </AnimatePresence>
        </main>
        <MobileBottomTabs user={user} />
      </div>
    ) : (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar user={user} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
              <Outlet context={{ user }} />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    );
  }

  if (TUTOR_ROLES.includes(user.role)) {
    if (tutorError) return <div className="p-8 text-center" role="alert"><p>Could not check tutor verification. Please retry.</p><button onClick={fetchUser}>Retry</button><button onClick={signOut}>Sign out</button></div>;
    if (tutorVerified === null) return <div className="p-8 text-center">Checking tutor verification…</div>;
    if (!tutorVerified) return <TutorPendingScreen user={user} onRefresh={fetchUser} />;
  }

  // Normal layout for authenticated, onboarded users
  return isMobile ? (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader />
      <main className="flex-1 pt-14 pb-16">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
            <Outlet context={{ user }} />
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileBottomTabs user={user} />
    </div>
  ) : (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
            <Outlet context={{ user }} />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

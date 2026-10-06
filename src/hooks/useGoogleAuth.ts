import { useEffect, useCallback, useState } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useBookingStore, type AuthUser } from '../store/bookingStore';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = makeRedirectUri({
  path: 'auth/callback',
});

console.info(
  `[Auth] Redirect URI — ADD VÀO Supabase → Authentication → URL Configuration → Redirect URLs:\n` +
    `  → ${REDIRECT_URI}\n` +
    Platform.select({
      ios: `  → studyroombooking://auth/callback  (standalone iOS build)\n`,
      android: `  → studyroombooking://auth/callback  (standalone Android build)\n`,
      default: '',
    }) +
    `[Auth] Lưu ý: Dùng Expo Go thì chỉ cần URI exp://... đầu tiên.`,
);

export const mapSupabaseUser = (u: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): AuthUser => ({
  id: u.id,
  email: u.email ?? '',
  name: ((u.user_metadata?.full_name as string | undefined) ?? u.email ?? 'User'),
  avatarUrl: (u.user_metadata?.avatar_url as string | undefined) ?? '',
});

const tryExchangeFromUrl = async (urlString: string) => {
  const qp = Linking.parse(urlString).queryParams;
  const code = (qp?.code as string | undefined) ?? '';
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
};

const consumeSessionAndSetUser = async (step: string) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error(`[Auth:${step}] getSession error:`, error);
    return;
  }
  console.info(
    `[Auth:${step}] getSession — session=${session ? 'OK' : 'NULL'}`,
    session?.user ? `uid=${session.user.id} email=${session.user.email}` : '',
  );
  if (session?.user) {
    const mapped = mapSupabaseUser(session.user);
    console.info(`[Auth:${step}] setUser() called with`, mapped);
    useBookingStore.getState().setUser(mapped);
    console.info(`[Auth:${step}] Zustand store after setUser:`, useBookingStore.getState().user);
  }
};

export const useAuthInit = () => {
  const setUser = useBookingStore((s) => s.setUser);
  const hydrate = useBookingStore((s) => s.hydrate);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      console.info(
        `[Auth:init] Existing session on mount: ${session ? 'YES' : 'NO'}`,
        session?.user ? `uid=${session.user.id}` : '',
      );
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      hydrate();
    })();

    void supabase.auth.startAutoRefresh();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.info(
        `[Auth:onAuthStateChange] event=${_event} session=${session ? 'YES' : 'NO'}`,
        session?.user ? `uid=${session.user.id}` : '',
      );
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else if (_event === 'SIGNED_OUT') {
        useBookingStore.getState().logout();
      }
    });

    const handleUrl = ({ url }: { url: string }) => {
      if (!url) return;
      console.info(`[Auth:linking] incoming URL: ${url}`);
      void (async () => {
        try {
          await tryExchangeFromUrl(url);
          // FALLBACK: dù openAuthSession có trả success hay không
          // chỉ cần URL về app + có code → vào đây rồi consume session luôn
          await consumeSessionAndSetUser('linking-fallback');
        } catch (e) {
          console.error(`[Auth:linking] exchange error:`, e);
        }
      })();
    };
    const linkingSub = Linking.addEventListener('url', handleUrl);

    void (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) {
        console.info(`[Auth:init-URL] initial URL: ${initial}`);
        try {
          await tryExchangeFromUrl(initial);
          await consumeSessionAndSetUser('init-URL');
        } catch (e) {
          console.error(`[Auth:init-URL] exchange error:`, e);
        }
      }
    })();

    // Log Zustand state changes (debug)
    const unsubStore = useBookingStore.subscribe((state, prev) => {
      if (state.user !== prev.user) {
        console.info(
          `[Auth:zustand] user changed:`,
          prev.user ? `${prev.user.id} → ` : 'null → ',
          state.user ? state.user.id : 'null',
        );
      }
      if (state.hydrated !== prev.hydrated) {
        console.info(`[Auth:zustand] hydrated: ${prev.hydrated} → ${state.hydrated}`);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      linkingSub.remove();
      unsubStore();
      void supabase.auth.stopAutoRefresh();
    };
  }, [setUser, hydrate]);
};

export const useGoogleAuth = () => {
  const setUser = useBookingStore((s) => s.setUser);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = useCallback(async (): Promise<void> => {
    setIsSigningIn(true);
    console.info(`[Auth:signIn] Step 1: calling signInWithOAuth redirectTo=${REDIRECT_URI}`);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URI,
          scopes: 'openid profile email',
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        console.error(`[Auth:signIn] Step 1 ERROR signInWithOAuth:`, error);
        throw error;
      }
      if (!data?.url) throw new Error('OAuth URL unavailable');
      console.info(`[Auth:signIn] Step 2: OAuth URL OK, opening browser…`);

      const res = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI, {
        showInRecents: true,
        dismissButtonStyle: 'cancel',
        preferEphemeralSession: true,
      });
      console.info(`[Auth:signIn] Step 3: openAuthSession result type=${res.type}` + ('url' in res ? ` url=${(res as {url?: string}).url ?? ''}` : ''));

      if (res.type === 'success') {
        const qp = Linking.parse(res.url).queryParams;
        const code = (qp?.code as string | undefined) ?? '';
        console.info(`[Auth:signIn] Step 4: exchange — code=${code ? 'PRESENT' : 'MISSING'}`);
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error(`[Auth:signIn] Step 4 ERROR exchangeCodeForSession:`, exchangeErr);
            throw exchangeErr;
          }
          console.info(`[Auth:signIn] Step 4: exchangeCodeForSession OK`);
        } else {
          await tryExchangeFromUrl(res.url);
        }
        await consumeSessionAndSetUser('signIn-success');
      } else if (res.type === 'cancel' || res.type === 'dismiss') {
        // user cancelled, do nothing — linking listener sẽ handle nếu URL về app sau đó
        console.info(`[Auth:signIn] User dismissed browser — chờ linking listener fallback nếu redirect về app sau`);
      } else {
        throw new Error('Sign-in was cancelled or failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể đăng nhập, hãy thử lại.';
      console.error(`[Auth:signIn] FINAL ERROR:`, err);
      throw new Error(msg);
    } finally {
      setIsSigningIn(false);
    }
  }, [setUser]);

  return { signIn, isSigningIn, redirectUri: REDIRECT_URI };
};

export const signOutGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

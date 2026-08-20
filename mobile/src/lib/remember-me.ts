import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'gm.silver.rememberMe';

export type RememberedSession = {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'ADMIN' | 'OWNER' | 'CUSTOMER';
    hasMpin?: boolean;
  };
  accessToken: string;
  refreshToken: string;
};

export type RememberMeState = {
  enabled: boolean;
  identifier: string;
  session: RememberedSession | null;
};

const empty: RememberMeState = {
  enabled: false,
  identifier: '',
  session: null,
};

export async function loadRememberMe(): Promise<RememberMeState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as RememberMeState;
    return {
      enabled: !!parsed.enabled,
      identifier: typeof parsed.identifier === 'string' ? parsed.identifier : '',
      session: parsed.session ?? null,
    };
  } catch {
    return empty;
  }
}

export async function saveRememberMe(state: RememberMeState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function persistLogin(opts: {
  remember: boolean;
  identifier: string;
  session: RememberedSession;
}): Promise<void> {
  if (!opts.remember) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await saveRememberMe({
    enabled: true,
    identifier: opts.identifier.trim(),
    session: opts.session,
  });
}

/** Clears tokens on sign-out, keeps the saved identifier if Remember me is on. */
export async function clearRememberedSession(): Promise<void> {
  const current = await loadRememberMe();
  if (!current.enabled) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await saveRememberMe({
    enabled: true,
    identifier: current.identifier,
    session: null,
  });
}

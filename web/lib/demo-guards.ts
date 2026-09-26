import 'server-only';

export interface LiveDemoAvailability {
  readonly liveEnabled: boolean;
  readonly status: 'available' | 'disabled' | 'missing-key' | 'production';
  readonly message: string;
}

type DemoEnvironment = Readonly<Record<string, string | undefined>>;

export function getLiveDemoAvailability(
  env: DemoEnvironment = process.env,
): LiveDemoAvailability {
  if (env.NODE_ENV === 'production') {
    return {
      liveEnabled: false,
      status: 'production',
      message: 'Live Jev is restricted to explicit local development.',
    };
  }
  if (env.JEVFLOW_LIVE_DEMO_ENABLED?.trim() !== 'true') {
    return {
      liveEnabled: false,
      status: 'disabled',
      message: 'Live Jev is disabled. Offline synthetic preview is ready.',
    };
  }
  if (!env.TYPESAFE_API_KEY?.trim()) {
    return {
      liveEnabled: false,
      status: 'missing-key',
      message: 'Live opt-in is set, but the server credential is missing.',
    };
  }
  return {
    liveEnabled: true,
    status: 'available',
    message: 'Live Jev is available for deliberate local requests.',
  };
}

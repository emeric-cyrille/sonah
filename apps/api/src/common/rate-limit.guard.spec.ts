import { SlidingWindowLimiter } from './rate-limit.guard';

describe('SlidingWindowLimiter', () => {
  const policy = { bucket: 'chat', limit: 3, windowMs: 60_000 };

  it('autorise jusqu’à la limite puis refuse avec un délai d’attente', () => {
    let now = 1_000_000;
    const limiter = new SlidingWindowLimiter(() => now);
    expect(limiter.consume('chat:1.2.3.4', policy)).toMatchObject({ allowed: true, remaining: 2 });
    now += 10_000;
    limiter.consume('chat:1.2.3.4', policy);
    now += 10_000;
    limiter.consume('chat:1.2.3.4', policy);
    now += 5_000;
    expect(limiter.consume('chat:1.2.3.4', policy)).toEqual({
      allowed: false,
      retryAfterMs: 35_000,
      remaining: 0,
    });
  });

  it('la fenêtre glisse : une requête redevient possible quand la plus ancienne expire', () => {
    let now = 0;
    const limiter = new SlidingWindowLimiter(() => now);
    for (let i = 0; i < 3; i += 1) limiter.consume('k', policy);
    now = 60_001;
    expect(limiter.consume('k', policy).allowed).toBe(true);
  });

  it('compte séparément chaque IP et chaque groupe', () => {
    const limiter = new SlidingWindowLimiter(() => 0);
    for (let i = 0; i < 3; i += 1) limiter.consume('chat:a', policy);
    expect(limiter.consume('chat:a', policy).allowed).toBe(false);
    expect(limiter.consume('chat:b', policy).allowed).toBe(true);
    expect(limiter.consume('search:a', { ...policy, bucket: 'search' }).allowed).toBe(true);
  });
});

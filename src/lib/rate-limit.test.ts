import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetRateLimitStoreForTests,
  clearLoginFailures,
  getLoginRateLimitStatus,
  recordLoginFailure,
} from "./rate-limit";

describe("login rate limit (échecs seulement)", () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests();
  });

  it("bloque après 5 échecs", () => {
    const key = "login:ip:a@test.com";
    for (let i = 0; i < 5; i++) {
      const s = recordLoginFailure(key, 5);
      expect(s.blocked).toBe(i >= 4);
    }
    expect(getLoginRateLimitStatus(key, 5).blocked).toBe(true);
    expect(getLoginRateLimitStatus(key, 5).minutesRemaining).toBeGreaterThanOrEqual(1);
  });

  it("une réussite remet le compteur à zéro", () => {
    const key = "login:ip:b@test.com";
    recordLoginFailure(key, 5);
    recordLoginFailure(key, 5);
    recordLoginFailure(key, 5);
    clearLoginFailures(key);
    expect(getLoginRateLimitStatus(key, 5)).toMatchObject({
      blocked: false,
      count: 0,
      remaining: 5,
    });
  });

  it("ne bloque pas sans recordLoginFailure", () => {
    expect(getLoginRateLimitStatus("login:ip:c@test.com", 5).blocked).toBe(false);
  });
});

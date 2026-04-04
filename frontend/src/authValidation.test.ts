import { describe, expect, it } from "vitest";
import { emailValidationMessage, isValidEmail, passwordValidationMessage } from "./authValidation";

describe("authValidation", () => {
  it("isValidEmail accepts common forms", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("user.name+tag@example.com")).toBe(true);
  });

  it("isValidEmail rejects invalid", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at")).toBe(false);
    expect(isValidEmail("@nodomain")).toBe(false);
  });

  it("emailValidationMessage", () => {
    expect(emailValidationMessage("")).toBe("Укажите email");
    expect(emailValidationMessage("bad")).toContain("Некорректный");
  });

  it("passwordValidationMessage", () => {
    expect(passwordValidationMessage("", "login")).toBe("Введите пароль");
    expect(passwordValidationMessage("short", "login")).toContain("8");
    expect(passwordValidationMessage("12345678", "login")).toBe(null);
  });
});

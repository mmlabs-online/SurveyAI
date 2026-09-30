import { describe, expect, it } from "vitest";
import { checkSurveyAbuse, containsSensitiveRequest, normalizeText } from "./abuse";

describe("abuse check: hardening and false positives", () => {
  it.each([
    "số thế nào",
    "Bạn thấy số thế nào về dịch vụ?",
    "so the staff were helpful",
    "số thẻ thành viên",
    "Bạn có mã thẻ thành viên không?",
    "Sản phẩm còn hạn sử dụng bao lâu?",
    "What is the product expiry date on the box?",
  ])("does not flag legitimate wording: %s", (text) => {
    expect(containsSensitiveRequest(text)).toBe(false);
  });

  it.each([
    "m.a.t k.h.a.u",
    "mật-khẩu của bạn",
    "mật_khẩu",
    "pass​word",
    "pass‍word please",
    "ｐａｓｓｗｏｒｄ",
    "PASS-WORD",
    "Nhập mật mã",
    "Cho biết mã thẻ",
    "Vui lòng nhập mã số thẻ",
    "Nhập số thẻ",
    "Hãy cung cấp số thẻ của bạn",
    "Số thẻ ngân hàng",
    "Số thẻ ATM",
    "Thẻ tín dụng số bao nhiêu?",
    "Mã CCV",
    "CVC2 code",
    "Ngày hết hạn thẻ",
    "Card expiry date",
    "Expiry date of your card",
    "What are your passwords?",
    "List your card numbers",
    "Your PINs",
    "Enter your credit card",
  ])("flags obfuscated or extended terms: %s", (text) => {
    expect(containsSensitiveRequest(text)).toBe(true);
  });

  it("conservatively blocks any mention of a password, even a reset-flow question", () => {
    // Judgement call: a regex cannot tell "reset your password" from "tell me your password",
    // so we block and let the owner reword. The publish error names the question.
    expect(containsSensitiveRequest("How easy was it to reset your password?")).toBe(true);
  });

  it("also scans objective and segment", () => {
    const base = {
      id: "q1",
      type: "open_text" as const,
      text: "Bạn thấy sao?",
      required: false,
      options: [],
      objective: "Ổn",
      analyze: true,
    };
    const survey = (q: typeof base & { segment?: string }) => ({
      title: "t",
      intro: "",
      thankYou: "",
      questions: [q],
    });
    const inObjective = checkSurveyAbuse(survey({ ...base, objective: "Thu thập mật khẩu" }));
    expect(inObjective[0]).toMatchObject({ location: "objective", questionText: "Bạn thấy sao?" });
    const inSegment = checkSurveyAbuse(survey({ ...base, segment: "card number" }));
    expect(inSegment[0]?.location).toBe("segment");
  });

  it("normalizes compatibility forms and invisible characters", () => {
    expect(normalizeText("Ｍật​ Ｋhẩu")).toBe("mat khau");
  });
});

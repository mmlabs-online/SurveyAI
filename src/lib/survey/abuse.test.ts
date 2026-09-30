import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/schema/survey";
import { checkSurveyAbuse, containsSensitiveRequest, normalizeText } from "./abuse";

function q(text: string, optionLabels: string[] = []): Question {
  return {
    id: `q-${text}`,
    type: optionLabels.length ? "single_choice" : "open_text",
    text,
    required: false,
    options: optionLabels.map((label, i) => ({ id: `o${i}`, label })),
    objective: "test",
    analyze: optionLabels.length === 0,
  };
}

function survey(questions: Question[], title = "Khảo sát") {
  return { title, intro: "", thankYou: "Cảm ơn", questions };
}

describe("abuse check (GEN-07)", () => {
  it.each([
    "Vui lòng cho biết mật khẩu của bạn",
    "Nhập mat khau tài khoản",
    "MẬT KHẨU ngân hàng?",
    "Bạn hãy gửi mã OTP vừa nhận",
    "Cho chúng tôi mã xác thực",
    "Số thẻ của bạn là gì?",
    "Ghi số thẻ tín dụng",
    "Mã CVV ở mặt sau thẻ",
    "Mã PIN ngân hàng của bạn",
    "What is your password?",
    "Please enter your card number",
    "Enter the one-time password",
    "Your CVV please",
    "Your bank PIN",
  ])("flags: %s", (text) => {
    expect(containsSensitiveRequest(text)).toBe(true);
  });

  it.each([
    "Bạn hài lòng với dịch vụ ở mức nào?",
    "Bạn có khả năng giới thiệu quán cho bạn bè?",
    "Bạn thích món nào nhất?",
    "How likely are you to recommend us?",
    "Tôi thích pin điện thoại bền",
    "Số lần bạn ghé quán mỗi tháng",
  ])("does not flag: %s", (text) => {
    expect(containsSensitiveRequest(text)).toBe(false);
  });

  it("names the offending question in the violation", () => {
    const bad = q("Vui lòng nhập mật khẩu email của bạn");
    const violations = checkSurveyAbuse(survey([q("Bạn thích món nào?"), bad]));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      location: "question",
      questionId: bad.id,
      questionText: bad.text,
    });
  });

  it("checks option labels, title, intro and thank-you text", () => {
    const withOption = checkSurveyAbuse(survey([q("Bạn chọn gì?", ["Số thẻ tín dụng", "Khác"])]));
    expect(withOption[0]?.location).toBe("option");
    const inTitle = checkSurveyAbuse(survey([q("Ổn không?")], "Nhập OTP để tham gia"));
    expect(inTitle[0]?.location).toBe("title");
    const inIntro = checkSurveyAbuse({ ...survey([q("Ổn không?")]), intro: "Cho biết password" });
    expect(inIntro[0]?.location).toBe("intro");
    const inThanks = checkSurveyAbuse({ ...survey([q("Ổn không?")]), thankYou: "Gửi CVV" });
    expect(inThanks[0]?.location).toBe("thankYou");
  });

  it("returns nothing for a clean survey", () => {
    expect(checkSurveyAbuse(survey([q("Bạn thấy sao?")]))).toEqual([]);
  });

  it("normalizes diacritics and đ", () => {
    expect(normalizeText("Đường Mật Khẩu")).toBe("duong mat khau");
  });
});

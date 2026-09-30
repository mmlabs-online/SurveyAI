import type { Industry, SurveyGoal } from "@/lib/schema/survey";

/** Vietnamese templates used by the mock survey generator (survey content is user-facing). */
export const gen = {
  business: {
    fnb: "quán",
    spa: "spa",
    retail: "cửa hàng",
    clinic: "phòng khám",
    other: "dịch vụ",
  } satisfies Record<Industry, string>,
  goalTitle: {
    satisfaction: "Khảo sát mức độ hài lòng",
    root_cause: "Tìm nguyên nhân từ khách hàng",
    new_product: "Thăm dò ý tưởng mới",
    other: "Khảo sát ý kiến khách hàng",
  } satisfies Record<SurveyGoal, string>,
  intro: {
    satisfaction: (b: string): string =>
      `Cảm ơn bạn đã dành ít phút chia sẻ cảm nhận về ${b}. Câu trả lời của bạn giúp chúng tôi phục vụ tốt hơn.`,
    root_cause: (b: string): string =>
      `Chúng tôi muốn hiểu rõ điều gì chưa ổn ở ${b}. Mọi chia sẻ thẳng thắn của bạn đều rất quý giá.`,
    new_product: (b: string): string =>
      `Chúng tôi đang cân nhắc một ý tưởng mới cho ${b} và muốn nghe ý kiến của bạn trước khi triển khai.`,
    other: (b: string): string =>
      `Vui lòng dành ít phút chia sẻ ý kiến của bạn về ${b}.`,
  } satisfies Record<SurveyGoal, (business: string) => string>,
  thankYou: "Cảm ơn bạn đã tham gia khảo sát. Ý kiến của bạn rất có giá trị với chúng tôi!",
  priorityOptions: {
    fnb: ["Chất lượng món", "Giá cả", "Tốc độ phục vụ", "Không gian"],
    spa: ["Chất lượng dịch vụ", "Giá cả", "Kỹ thuật viên", "Không gian thư giãn"],
    retail: ["Chất lượng sản phẩm", "Giá cả", "Đa dạng mẫu mã", "Thái độ nhân viên"],
    clinic: ["Chuyên môn bác sĩ", "Thời gian chờ", "Chi phí", "Cơ sở vật chất"],
    other: ["Chất lượng", "Giá cả", "Tốc độ", "Thái độ phục vụ"],
  } satisfies Record<Industry, string[]>,
  csat: {
    text: (b: string): string =>
      `Nhìn chung, bạn hài lòng với ${b} ở mức nào? (1 = rất không hài lòng, 5 = rất hài lòng)`,
    objective: "Đo mức độ hài lòng tổng thể theo thang CSAT chuẩn",
  },
  nps: {
    text: (b: string): string =>
      `Bạn có khả năng giới thiệu ${b} cho bạn bè hoặc đồng nghiệp ở mức nào? (0 = hoàn toàn không, 10 = chắc chắn)`,
    objective: "Đo mức độ sẵn lòng giới thiệu theo thang NPS chuẩn",
  },
  priority: {
    text: (b: string): string => `Điều gì quan trọng nhất với bạn khi chọn ${b}?`,
    objective: "Xác định yếu tố ưu tiên của khách hàng",
  },
  likes: {
    text: "Bạn hài lòng nhất ở điểm nào? (chọn tối đa 2)",
    objective: "Tìm điểm mạnh cần giữ gìn",
  },
  feedback: {
    text: (b: string): string => `Bạn có góp ý nào để ${b} tốt hơn?`,
    objective: "Thu thập góp ý tự do để phân tích chủ đề",
  },
  frequency: {
    text: (b: string): string => `Bạn sử dụng ${b} với tần suất nào?`,
    objective: "Phân nhóm khách hàng theo tần suất sử dụng",
    options: [
      "Lần đầu tiên",
      "Thỉnh thoảng (vài lần một năm)",
      "Hằng tháng",
      "Hằng tuần trở lên",
    ],
  },
  age: {
    text: "Bạn thuộc nhóm tuổi nào?",
    objective: "Phân nhóm khách hàng theo độ tuổi",
    options: ["Dưới 18", "18–24", "25–34", "35–44", "45 trở lên"],
  },
  rootCause: {
    issues: {
      text: "Điều gì khiến bạn chưa hài lòng? (chọn tối đa 3)",
      objective: "Xác định các nhóm vấn đề khách hàng gặp phải",
      options: [
        "Chất lượng",
        "Giá cả",
        "Thời gian chờ đợi",
        "Thái độ phục vụ",
        "Thông tin chưa rõ ràng",
      ],
    },
    cause: {
      text: "Theo bạn, nguyên nhân chính khiến bạn chưa hài lòng là gì? Hãy kể cụ thể.",
      objective: "Tìm nguyên nhân gốc rễ bằng câu trả lời tự do",
    },
    recurrence: {
      text: "Vấn đề này xảy ra thường xuyên đến mức nào?",
      objective: "Đánh giá mức độ lặp lại của vấn đề",
      options: ["Chỉ một lần", "Thỉnh thoảng", "Thường xuyên"],
    },
    change: {
      text: "Chúng tôi nên thay đổi điều gì đầu tiên?",
      objective: "Xác định hành động cải thiện ưu tiên",
    },
  },
  newProduct: {
    interest: {
      text: "Bạn quan tâm đến ý tưởng mới này ở mức nào? (1 = không quan tâm, 5 = rất quan tâm)",
      objective: "Đo mức độ quan tâm đến ý tưởng",
    },
    motive: {
      text: "Điều gì khiến bạn muốn thử? (chọn tối đa 2)",
      objective: "Hiểu động lực dùng thử",
      options: ["Giá hợp lý", "Tiện lợi", "Chất lượng tốt", "Mới lạ", "Bạn bè giới thiệu"],
    },
    price: {
      text: "Bạn sẵn sàng chi trả ở mức giá nào so với hiện tại?",
      objective: "Thăm dò mức giá chấp nhận được",
      options: [
        "Thấp hơn hiện tại",
        "Tương đương",
        "Cao hơn một chút",
        "Cao hơn nhiều nếu chất lượng tốt",
      ],
    },
    expectation: {
      text: "Bạn mong đợi điều gì nhất ở ý tưởng này?",
      objective: "Thu thập kỳ vọng tự do để phân tích chủ đề",
    },
  },
} as const;

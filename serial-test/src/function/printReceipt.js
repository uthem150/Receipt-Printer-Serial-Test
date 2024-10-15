export const createReceiptTemplate = (info) => {
  const {
    hotelName,
    businessNumber,
    businessName,
    address,
    phoneNumber,
    receiptNumber,
    dateTime,
    items,
    totalAmount,
    taxableAmount,
    tax,
    cardType,
    cardNumber,
    installmentMonths,
    saleAmount,
    approvalAmount,
    approvalNumber,
    approvalDateTime,
    merchantNumber,
  } = info;

  const itemsString = items
    .map(
      (item) =>
        `${item.name.padEnd(20)} ${item.price
          .toString()
          .padStart(10)} ${item.quantity.toString().padStart(10)} ${(
          item.price * item.quantity
        )
          .toString()
          .padStart(10)}`
    )
    .join("\n");

  return `
[ 영수증 ]

${hotelName} / ${businessNumber} / ${businessName}
${address}
${phoneNumber} / ${receiptNumber}
${dateTime}
----------------------------------------------
상 품 명               단 가       수량        금  액
----------------------------------------------
${itemsString}
----------------------------------------------
합 계  금 액:                             ${totalAmount}
----------------------------------------------
부가세 과세물품가액:  ${taxableAmount}
부가세:               ${tax}
----------------------------------------------
*** 신용승인정보(고객용) ***
카드종류 : ${cardType}
카드번호 : ${cardNumber}
할부개월 : ${installmentMonths}
판매금액 : ${saleAmount}
부가세 : ${tax}
승인금액 : ${approvalAmount}
승인번호: ${approvalNumber}
승인일시 : ${approvalDateTime}
가맹점 번호 : ${merchantNumber}
----------------------------------------------
`
    .replace(/\t/g, "") // 각 줄의 앞 공백 제거
    .trim();
};

// Example usage:
// const receiptInfo = {
//   hotelName: "그랜드 호텔",
//   businessNumber: "123-45-67890",
//   businessName: "그랜드 호텔 주식회사",
//   address: "서울특별시 강남구 테헤란로 123",
//   phoneNumber: "02-1234-5678",
//   receiptNumber: "R-20231015-001",
//   dateTime: "2023-10-15 14:30:00",
//   items: [
//     { name: "디럭스 룸", price: 200000, quantity: 1 },
//     { name: "조식 뷔페", price: 30000, quantity: 2 },
//   ],
//   totalAmount: 260000,
//   taxableAmount: 236364,
//   tax: 23636,
//   cardType: "신한카드",
//   cardNumber: "1234-5678-****-9012",
//   installmentMonths: "일시불",
//   saleAmount: 260000,
//   approvalAmount: 260000,
//   approvalNumber: "12345678",
//   approvalDateTime: "2023-10-15 14:35:23",
//   merchantNumber: "9876543210",
// };

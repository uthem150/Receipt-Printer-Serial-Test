import iconv from "iconv-lite";

// ms 밀리초가 지나면 Promise가 해결(resolve)됨
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getKorCount(str) {
  let length = 0; // 총 길이를 저장할 변수 초기화
  for (let char of str) {
    // 문자열의 각 문자에 대해 반복
    length += char.charCodeAt(0) > 127 ? 1 : 0; // 유니코드 값이 127보다 크면, 해당 문자는 2바이트(한글)로 간주하고, 그렇지 않으면 (영어, 숫자 등)
  }
  return length; // 총 길이 반환
}

export const createReceiptTemplate = async (info) => {
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

  // 사용 가능한 포트 목록 가져오기
  const ports = await navigator.serial.getPorts();

  if (ports.length === 0) {
    throw new Error("사용 가능한 포트가 없습니다.");
  }
  // 첫 번째 사용 가능한 포트 선택
  const selectedPort = ports[0];

  let writer; // writer 변수 선언

  try {
    writer = selectedPort.writable.getWriter();

    // 통신 속도 조절을 위한 함수 생성
    const writeAndWait = async (data) => {
      await writer.write(data);
      await sleep(50); // 50ms 대기
      console.log("데이터 전송 완료:", data);
    };

    // 초기화 및 중앙정렬 설정
    await writeAndWait(new Uint8Array([0x1b, 0x40])); // 초기화 (ESC @)
    await writeAndWait(new Uint8Array([0x1b, 0x61, 0x01])); // 중앙정렬 (ESC a 1)

    // 제목 출력
    await writeAndWait(iconv.encode("[ 영수증 ]\n\n", "cp949"));

    // 왼쪽 정렬 설정 (ESC a 0)
    await writeAndWait(new Uint8Array([0x1b, 0x61, 0x00]));

    // 호텔 정보 출력
    const hotelInfo = `${hotelName} / ${businessNumber} / ${businessName}
    ${address}
    ${phoneNumber} / ${receiptNumber}
    ${dateTime}\n`.replace(/^\s+/gm, ""); // 각 줄의 앞 공백 제거
    await writeAndWait(iconv.encode(hotelInfo, "cp949"));

    // 구분선 출력
    const divider = "-------------------------------------------------\n";
    await writeAndWait(iconv.encode(divider, "cp949"));

    // 표 헤더 출력
    await writeAndWait(
      iconv.encode(
        "       상 품 명          단 가    수량     금 액 \n", // 7,8,10,5,3,4,5,5,2
        "cp949"
      )
    );
    // 구분선 출력
    await writeAndWait(iconv.encode(divider, "cp949"));

    const itemsText = items
      .map((item) => {
        const itemNameLength = 22; // 원하는 총 길이
        const itemName = item.name.padEnd(
          itemNameLength - getKorCount(item.name)
        ); // 상품 이름 정렬

        const itemPrice = item.price.toLocaleString().padStart(8); // 가격 정렬
        const itemQuantity = item.quantity.toLocaleString().padStart(7); // 수량 정렬
        const itemTotal = (item.price * item.quantity)
          .toLocaleString()
          .padStart(12); // 총액 정렬

        // 포맷팅된 상품 정보
        return `${itemName}${itemPrice}${itemQuantity}${itemTotal}`;
      })
      .join("\n");
    await writeAndWait(iconv.encode(itemsText, "cp949"));

    // 구분선 출력
    await writeAndWait(iconv.encode(divider, "cp949"));

    // 합계 정보 출력
    await writeAndWait(
      iconv.encode(
        ` 합 계  금 액${totalAmount.toLocaleString().padStart(36)}\n`,
        "cp949"
      )
    );

    // 구분선 출력
    await writeAndWait(iconv.encode(divider, "cp949"));

    // 세금 정보 출력
    const taxText1 = `            부가세 과세물품가액${taxableAmount
      .toLocaleString()
      .padStart(18)}`;
    const taxText2 = `            부       가      세${tax
      .toLocaleString()
      .padStart(18)}`;

    // 전체 텍스트 구성
    const finalText = `${taxText1}\n${taxText2}\n`; // 줄 앞 공백 제거
    await writeAndWait(iconv.encode(finalText, "cp949"));

    // 가운데 정렬 설정 (ESC a 1)
    await writeAndWait(new Uint8Array([0x1b, 0x61, 0x01])); // Center align

    // 구분선 출력
    await writeAndWait(iconv.encode(divider, "cp949"));

    // 신용 승인 정보 title 출력
    await writeAndWait(
      iconv.encode("*** 신용승인정보(고객용) ***\n\n", "cp949")
    );

    // 왼쪽 정렬
    await writeAndWait(new Uint8Array([0x1b, 0x61, 0x00])); // Left align
    // 세부 신용 승인 정보 출력
    const approvalInfo = `[카드종류] : ${cardType}
                          [카드번호] : ${cardNumber}
                          [할부개월] : ${installmentMonths}
                          [판매금액] : ${saleAmount.toLocaleString()}
                          [부가세] : ${tax.toLocaleString()}
                          [승인금액] : ${approvalAmount.toLocaleString()}
                          [승인번호] : ${approvalNumber}
                          [승인일시] : ${approvalDateTime}
                          [가맹점 번호] : ${merchantNumber}
                          `.replace(/^\s+/gm, ""); //문자열의 앞 공백 제거
    await writeAndWait(iconv.encode(approvalInfo, "cp949"));

    // 구분선 출력
    await writeAndWait(iconv.encode(divider, "cp949"));

    // 용지 피드 및 절단
    await writeAndWait(new Uint8Array([0x1b, 0x64, 0x03])); // Feed (ESC d 3: 3라인 피드)
    await writeAndWait(new Uint8Array([0x1d, 0x56, 0x01])); // Cut (GS V 1: 부분 절단)

    console.log("모든 데이터 전송 완료");
  } catch (error) {
    console.error("프린터 오류:", error);
  } finally {
    if (writer) {
      // writer 닫기
      writer.releaseLock();
    }
  }
};

import iconv from "iconv-lite";

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
    writer = selectedPort.writable.getWriter(); // writer 변수에 값을 할당

    // 한글 모드 설정 (ESC @)
    const setKoreanMode = new Uint8Array([0x1b, 0x40]);
    await writer.write(setKoreanMode);

    // 가운데 정렬 설정 (ESC a 1)
    const centerAlign = new Uint8Array([0x1b, 0x61, 0x01]);
    await writer.write(centerAlign);

    // 텍스트 출력 (가운데 정렬)
    const titleText = iconv.encode("[ 영수증 ]\n\n", "cp949");
    await writer.write(titleText);

    // 왼쪽 정렬 설정 (ESC a 0)
    const leftAlign = new Uint8Array([0x1b, 0x61, 0x00]);
    await writer.write(leftAlign);

    // 호텔 정보 출력 (왼쪽 정렬)
    const hotelInfoText = iconv.encode(
      `${hotelName} / ${businessNumber} / ${businessName}
      ${address}
      ${phoneNumber} / ${receiptNumber}
      ${dateTime}\n`.replace(/^\s+/gm, ""), // 각 줄의 앞 공백 제거
      "cp949"
    );
    await writer.write(hotelInfoText);

    // 구분선 출력
    const dividerText = iconv.encode(
      "-------------------------------------------------\n",
      "cp949"
    );
    await writer.write(dividerText);

    // 상품명 헤더 출력
    const headerText = iconv.encode(
      "상 품 명               단 가       수량        금  액\n",
      "cp949"
    );
    await writer.write(headerText);

    // 구분선 출력
    await writer.write(dividerText);

    // 상품 리스트 출력
    const itemsString = items
      .map((item) => {
        return `${item.name.padEnd(20)}${item.price
          .toLocaleString()
          .padStart(10)}${item.quantity.toLocaleString().padStart(10)}${(
          item.price * item.quantity
        )
          .toLocaleString()
          .padStart(10)}`;
      })
      .join("\n");

    const itemsText = iconv.encode(`${itemsString}\n`, "cp949");
    await writer.write(itemsText);

    // 구분선 출력
    await writer.write(dividerText);

    // 합계 정보 출력
    const totalText = iconv.encode(
      `합 계  금 액:                             ${totalAmount.toLocaleString()}\n`,
      "cp949"
    );
    await writer.write(totalText);

    // 구분선 출력
    await writer.write(dividerText);

    // 가운데 정렬 설정 (ESC a 1)
    await writer.write(centerAlign);

    // 세금 정보 출력
    const taxText = iconv.encode(
      `부가세 과세물품가액:  ${taxableAmount.toLocaleString()}\n부가세:               ${tax.toLocaleString()}\n`,
      "cp949"
    );
    await writer.write(taxText);

    // 구분선 출력
    await writer.write(dividerText);

    // 신용 승인 정보 title 출력
    const approvalTitleText = iconv.encode(
      `*** 신용승인정보(고객용) ***\n\n`,
      "cp949"
    );
    await writer.write(approvalTitleText);

    // 왼쪽 정렬
    await writer.write(leftAlign);

    // 세부 신용 승인 정보 출력
    const approvalText = iconv.encode(
      `[카드종류] : ${cardType}
      [카드번호] : ${cardNumber}
      [할부개월] : ${installmentMonths}
      [판매금액] : ${saleAmount.toLocaleString()}
      [부가세] : ${tax.toLocaleString()}
      [승인금액] : ${approvalAmount.toLocaleString()}
      [승인번호] : ${approvalNumber}
      [승인일시] : ${approvalDateTime}
      [가맹점 번호] : ${merchantNumber}`.replace(/^\s+/gm, ""), // 각 줄의 앞 공백 제거
      "cp949"
    );
    await writer.write(approvalText);

    // 구분선 출력
    await writer.write(dividerText);

    // 용지 피드 및 절단
    const feedCommand = new Uint8Array([0x1b, 0x64, 0x03]);
    await writer.write(feedCommand);

    const cutCommand = new Uint8Array([0x1d, 0x56, 0x01]);
    await writer.write(cutCommand);
  } catch (error) {
    console.error("포트 오류:", error);
  } finally {
    if (writer) {
      // writer 닫기
      writer.releaseLock();
    }
    await selectedPort.close(); // 포트 닫기
  }
};

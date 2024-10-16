import iconv from "iconv-lite";

// ms 밀리초가 지나면 Promise가 해결(resolve)됨
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        "상 품 명               단 가     수량     금  액\n",
        "cp949"
      )
    );
    // 구분선 출력
    await writeAndWait(iconv.encode(divider, "cp949"));

    const itemsText = items
      .map((item) => {
        const itemName = item.name.padEnd(20); // 상품 이름 정렬
        const itemPrice = item.price.toLocaleString().padStart(10); // 가격 정렬
        const itemQuantity = item.quantity.toLocaleString().padStart(10); // 수량 정렬
        const itemTotal = (item.price * item.quantity).toLocaleString().padStart(10); // 총액 정렬

        // 포맷팅된 상품 정보
        return `${itemName} ${itemPrice} ${itemQuantity} ${itemTotal}\n`;
      })
      .join("\n");
    await writeAndWait(iconv.encode(itemsText, "cp949"));

    // // 상품 리스트 출력
    // for (const item of items) {
    //   const itemLine = `
    //   ${item.name.padEnd(20)}
    //   ${item.price.toLocaleString().padStart(10)}
    //   ${item.quantity.toLocaleString().padStart(10)}
    //   ${(item.price * item.quantity).toLocaleString().padStart(10)}
    //   `.replace(/\n/g, ""); // 줄 바꿈 제거;
    //   await writeAndWait(iconv.encode(itemLine, "cp949"));
    // }

    // 구분선 출력
    await writeAndWait(iconv.encode(divider, "cp949"));

    // 합계 정보 출력
    await writeAndWait(
      iconv.encode(
        `합 계  금 액:                             ${totalAmount.toLocaleString()}\n`,
        "cp949"
      )
    );

    // 구분선 출력
    await writeAndWait(iconv.encode(divider, "cp949"));

    // 가운데 정렬 설정 (ESC a 1)
    await writeAndWait(new Uint8Array([0x1b, 0x61, 0x01])); // Center align
    // 세금 정보 출력
    await writeAndWait(
      iconv.encode(
        `부가세 과세물품가액:  ${taxableAmount.toLocaleString()}
        부가세:               ${tax.toLocaleString()}
        `.replace(/^\s+/gm, ""), // 줄 앞 공백 제거
        "cp949"
      )
    );
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
    await selectedPort.close(); // 포트 닫기
  }
};

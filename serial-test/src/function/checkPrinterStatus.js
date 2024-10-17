// 프린터 상태 확인 함수
export const checkPrinterStatus = async (port, setPrinterStatus) => {
  if (!port) {
    alert("프린터가 연결되지 않았습니다.");
    return;
  }

  try {
    const writer = port.writable.getWriter(); // 쓰기 위한 writer 객체 생성
    const reader = port.readable.getReader(); // 읽기 위한 reader 객체 생성

    // 프린터 상태 요청 명령어 (DLE EOT 2)
    const statusCommand = new Uint8Array([0x10, 0x04, 0x02]);
    await writer.write(statusCommand);

    // 잠시 대기 후 응답 읽기
    await new Promise((resolve) => setTimeout(resolve, 100));
    const { value, done } = await reader.read();

    if (!done && value instanceof Uint8Array) {
      const status = value[0]; // 첫 번째 바이트를 상태로 사용

      // 각 비트 확인
      const outOfPaper = (status & 0b00000001) !== 0; // 0번 비트
      const printerHeadUp = (status & 0b00000010) !== 0; // 1번 비트
      const paperJam = (status & 0b00000100) !== 0; // 2번 비트
      const paperNearEnd = (status & 0b00001000) !== 0; // 3번 비트
      const printingOrFeeding = (status & 0b00010000) !== 0; // 4번 비트
      const cutterError = (status & 0b00100000) !== 0; // 5번 비트
      const paperInAuxSensor = (status & 0b10000000) !== 0; // 7번 비트

      let statusMessage = [];

      // 각 상태에 따라 메시지 추가
      if (outOfPaper) {
        statusMessage.push("용지 없음");
      }
      if (printerHeadUp) {
        statusMessage.push("프린터 헤드 업");
      }
      if (paperJam) {
        statusMessage.push("용지 잼 있음");
      }
      if (paperNearEnd) {
        statusMessage.push("용지 Near End");
      }
      if (printingOrFeeding) {
        statusMessage.push("프린트 또는 feeding 중");
      }
      if (cutterError) {
        statusMessage.push("컷터 에러(잼) 있음");
      }
      if (paperInAuxSensor) {
        statusMessage.push("보조 센서에 용지 있음");
      }

      // 상태에 따라 프린터 상태 업데이트
      if (status === 0x00) {
        // setPrinterStatus("Printer Ready");
        statusMessage.push("Printer Ready");
      }

      setPrinterStatus(statusMessage.join(`\n`)); // 메시지를 문자열로 변환하여 설정
    } else {
      setPrinterStatus("No Response"); // 응답이 없을 경우
    }

    writer.releaseLock(); // writer의 잠금을 해제
    reader.releaseLock(); // reader의 잠금을 해제
  } catch (error) {
    console.error("프린터 상태 체크 실패:", error);
    setPrinterStatus("Status Check Failed: " + error.message); // 상태 체크 실패
  }
};

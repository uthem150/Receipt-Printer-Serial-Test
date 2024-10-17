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

      // 상태에 따라 프린터 상태 업데이트
      if (status === 0x00) {
        setPrinterStatus("Printer Ready");
      } else if (status === 0x01) {
        setPrinterStatus("Out of Paper");
      } else if (status === 0x02) {
        setPrinterStatus("Cover Open");
      } else {
        setPrinterStatus("Unknown Error");
      }
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

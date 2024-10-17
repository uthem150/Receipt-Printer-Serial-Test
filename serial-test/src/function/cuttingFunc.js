// 커팅 함수
export const cuttingFunc = async (port, setPrinterStatus) => {
  if (!port) {
    alert("프린터가 연결되지 않았습니다.");
    return;
  }

  try {
    const writer = port.writable.getWriter(); // 쓰기 위한 writer 객체 생성

    // 용지 피드 명령 (ESC d 3: 3라인 피드)
    const feedCommand = new Uint8Array([0x1b, 0x64, 0x03]);
    await writer.write(feedCommand);

    // 용지 절단 명령 (GS V 1: 부분 절단)
    const cutCommand = new Uint8Array([0x1d, 0x56, 0x01]);
    await writer.write(cutCommand);

    setPrinterStatus("Printing..."); // 인쇄 중 상태 업데이트
    console.log("프린터 명령어 전송 완료 (시리얼)");

    setPrinterStatus("Connected"); // 인쇄 후 상태를 다시 연결된 상태로 설정
    writer.releaseLock(); // writer의 잠금을 해제
  } catch (error) {
    console.error("프린터 명령어 전송 실패:", error);
    setPrinterStatus("Print Failed"); // 인쇄 실패 상태로 설정
  }
};

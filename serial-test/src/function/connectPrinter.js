// 프린터 연결 함수
export const connectPrinter = async (setPort, setPrinterStatus) => {
  try {
    // 사용 가능한 포트 목록 가져오기
    const ports = await navigator.serial.getPorts();

    if (ports.length === 0) {
      throw new Error("사용 가능한 포트가 없습니다.");
    }

    // 첫 번째 사용 가능한 포트 선택
    const selectedPort = ports[0];

    // 직렬 포트 열기
    await selectedPort.open({
      baudRate: 19200, // 보드레이트 설정
      dataBits: 8, // 데이터 비트 설정
      stopBits: 1, // 스톱 비트 설정
      parity: "none", // 패리티 비트 설정
      flowControl: "none", // 하드웨어 플로우 제어 설정
    });

    // 선택한 포트를 상태에 저장하고 프린터 상태 업데이트
    setPort(selectedPort);
    setPrinterStatus("Connected");
    console.log("프린터 연결 완료 (시리얼 통신)");
  } catch (error) {
    console.error("프린터 연결 실패:", error);
    setPrinterStatus("Connection Failed");
  }
};

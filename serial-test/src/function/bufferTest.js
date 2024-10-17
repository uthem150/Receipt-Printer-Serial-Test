// 버퍼 테스트 함수
export const bufferTest = async (port, setPrinterStatus) => {
  if (!port) {
    alert("프린터가 연결되지 않았습니다.");
    return;
  }

  try {
    const writer = port.writable.getWriter();

    // 프린터 초기화
    const resetCommand = new Uint8Array([0x1b, 0x40]);
    await writer.write(resetCommand);

    // 버퍼 크기를 초과하는 데이터 생성 (4KB = 4096 bytes)
    const testData = new Uint8Array(5000); // 5000 bytes of data
    for (let i = 0; i < testData.length; i++) {
      testData[i] = 65 + (i % 26); // 'A' to 'Z' repeatedly
    }

    // 데이터 전송
    console.log("Sending large data...");
    await writer.write(testData);

    // 잠시 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 프린터 상태 확인
    const statusCommand = new Uint8Array([0x10, 0x04, 0x02]);
    await writer.write(statusCommand);

    // 용지 피드 및 절단
    const feedAndCutCommand = new Uint8Array([
      0x1b, 0x64, 0x03, 0x1d, 0x56, 0x01,
    ]);
    await writer.write(feedAndCutCommand);

    console.log("Buffer test completed");
    setPrinterStatus("Buffer Test Completed");
    writer.releaseLock();
  } catch (error) {
    console.error("버퍼 테스트 실패:", error);
    setPrinterStatus("Buffer Test Failed");
  }
};

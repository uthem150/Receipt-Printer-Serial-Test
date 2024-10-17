let printerStatus = "Disconnected";
let port = null;

const statusElement = document.getElementById("printerStatus");
const printButton = document.getElementById("printButton");
const statusButton = document.getElementById("statusButton");

document.getElementById("connectButton").addEventListener("click", async () => {
  if (port && port.readable) {
    alert("프린터가 이미 연결되어 있습니다.");
    return;
  }

  try {
    // Serial API를 사용하려면 웹 페이지가 HTTPS로 제공되어야 함. 로컬 환경에서는 localhost에서도 사용가능
    port = await navigator.serial.requestPort(); // 웹 브라우저의 Serial API에 포함된, 사용자가 연결할 직렬 포트를 선택하도록 요청하는 메서드
    await port.open({
      baudRate: 19200, // Baud Rate 설정
      dataBits: 8, // 8비트 데이터 전송
      stopBits: 1, // 1비트 스톱 비트
      parity: "none", // 패리티 비트 설정
      flowControl: "none", // 하드웨어 플로우 제어
    });

    printerStatus = "Connected";
    updateUI();
    console.log("프린터 연결 완료 (시리얼 통신)");
  } catch (error) {
    console.error("프린터 연결 실패:", error);
    printerStatus = "Connection Failed";
    updateUI();
  }
});

document.getElementById("printButton").addEventListener("click", async () => {
  if (!port) {
    alert("프린터가 연결되지 않았습니다.");
    return;
  }

  try {
    const writer = port.writable.getWriter(); // writer 객체를 생성
    const encoder = new TextEncoder(); // 문자열을 바이트 배열로 인코딩할 수 있도록 함

    // 프린터로 텍스트 명령어 전송 ("Hello, World!" 출력)
    const printCommand = encoder.encode("Hello, World!\n"); // 문자열을 바이트 배열로 변환
    await writer.write(printCommand);

    // 명령어를 Uint8Array로 생성해서 전달
    // 용지 피드 명령 (ESC d 3: 3라인 피드)
    const feedCommand = new Uint8Array([0x1b, 0x64, 0x03]);
    await writer.write(feedCommand);

    // 용지 절단 명령 (GS V 1: 부분 절단)
    const cutCommand = new Uint8Array([0x1d, 0x56, 0x01]);
    await writer.write(cutCommand);

    printerStatus = "Printing...";
    updateUI();
    console.log("프린터 명령어 전송 완료 (시리얼)");

    // 프린트 작업 완료 후 상태를 다시 Connected로 변경
    printerStatus = "Connected";
    updateUI();

    writer.releaseLock(); // 다른 작업이 이 writer 객체를 사용할 수 있도록, writer의 잠금을 해제
  } catch (error) {
    console.error("프린터 명령어 전송 실패:", error);
    printerStatus = "Print Failed";
    updateUI();
  }
});

document.getElementById("statusButton").addEventListener("click", async () => {
  if (!port) {
    alert("프린터가 연결되지 않았습니다.");
    return;
  }

  // 상태 확인 중 중복 요청 방지
  statusButton.disabled = true;

  try {
    const writer = port.writable.getWriter(); // 직렬 포트에 데이터를 쓰기 위해
    const reader = port.readable.getReader(); // 직렬 포트에서 데이터를 읽기 위해

    // 프린터 상태 요청 명령어 (DLE EOT 2)
    const statusCommand = new Uint8Array([0x10, 0x04, 0x02]); // n = 2
    console.log("프린터 상태 요청 전송:", statusCommand);
    await writer.write(statusCommand); // 프린터에 상태 요청 명령어를 전송

    // 약간의 대기 후 응답 수신
    await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms 대기
    const { value, done } = await reader.read(); // 프린터로부터 응답을 읽음 (응답 값은 value에 저장되고, done은 스트림이 종료되었는지 여부)

    // JavaScript에서 Uint8Array의 값을 출력할 때 기본적으로 10진수(Decimal) 형식
    if (!done && value instanceof Uint8Array) {
      console.log("프린터 상태 응답 수신:", value);
      const status = value[0]; // 응답의 첫 번째 바이트를 읽기 - 0은 8비트의 상태 비트

      // 프린터 상태에 따른 처리
      if (status === 0x00) {
        printerStatus = "Printer Ready";
      } else if (status === 0x01) {
        printerStatus = "Out of Paper";
      } else if (status === 0x02) {
        printerStatus = "Cover Open";
      } else {
        printerStatus = "Unknown Error";
      }

      console.log("프린터 상태:", status);
    } else {
      console.log("응답이 없습니다.");
      printerStatus = "No Response";
    }

    // 스트림 잠금 해제
    writer.releaseLock();
    reader.releaseLock();
  } catch (error) {
    console.error("프린터 상태 체크 실패:", error);
    printerStatus = "Status Check Failed: " + error.message;
  } finally {
    // 상태 확인 후 버튼 활성화
    statusButton.disabled = false; // 버튼을 다시 활성화
    updateUI(); // UI 업데이트
  }
});

// 포트 닫기 함수 추가 (필요 시 호출)
async function closePort() {
  if (port && port.readable) {
    await port.close();
    port = null;
    printerStatus = "Disconnected";
    updateUI();
    console.log("포트가 닫혔습니다.");
  }
}

function updateUI() {
  statusElement.textContent = `프린터 상태: ${printerStatus}`;
  printButton.disabled = printerStatus !== "Connected";
  statusButton.disabled = printerStatus !== "Connected";
}

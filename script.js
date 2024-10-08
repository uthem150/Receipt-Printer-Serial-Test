let printerStatus = "Disconnected";
let port = null;

const statusElement = document.getElementById('printerStatus');
const printButton = document.getElementById('printButton');
const statusButton = document.getElementById('statusButton');

document.getElementById('connectButton').addEventListener('click', async () => {
    if (port && port.readable) {
        alert("프린터가 이미 연결되어 있습니다.");
        return;
    }

    try {
        port = await navigator.serial.requestPort();
        await port.open({
            baudRate: 19200, // Baud Rate 설정
            dataBits: 8, // 8비트 데이터 전송
            stopBits: 1, // 1비트 스톱 비트
            parity: "none", // 패리티 비트 설정
            flowControl: "none" // 하드웨어 플로우 제어
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

// 포트 닫기 함수 추가 (필요 시 호출 가능)
async function closePort() {
    if (port && port.readable) {
        await port.close();
        port = null;
        printerStatus = "Disconnected";
        updateUI();
        console.log("포트가 닫혔습니다.");
    }
}


document.getElementById('printButton').addEventListener('click', async () => {
    if (!port) {
        alert("프린터가 연결되지 않았습니다.");
        return;
    }

    try {
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();

        // 프린터로 텍스트 명령어 전송 ("Hello, World!" 출력)
        const printCommand = encoder.encode("Hello, World!\n");
        await writer.write(printCommand);

        // 용지 피드 명령 (ESC d 3: 3라인 피드)
        const feedCommand = new Uint8Array([0x1B, 0x64, 0x03]);
        await writer.write(feedCommand);

        // 용지 절단 명령 (GS V 1: 부분 절단)
        const cutCommand = new Uint8Array([0x1D, 0x56, 0x01]);
        await writer.write(cutCommand);

        printerStatus = "Printing...";
        updateUI();
        console.log("프린터 명령어 전송 완료 (시리얼)");

        // 프린트 작업 완료 후 상태를 다시 Connected로 변경
        printerStatus = "Connected";
        updateUI();
        
        writer.releaseLock();
    } catch (error) {
        console.error("프린터 명령어 전송 실패:", error);
        printerStatus = "Print Failed";
        updateUI();
    }
});


document.getElementById('statusButton').addEventListener('click', async () => {
    if (!port) {
        alert("프린터가 연결되지 않았습니다.");
        return;
    }

    try {
        const writer = port.writable.getWriter();
        const reader = port.readable.getReader();

        // 프린터 상태 요청 명령어 (DLE EOT 1)
        const statusCommand = new Uint8Array([0x10, 0x04, 0x01]);
        await writer.write(statusCommand);

        // 프린터로부터 상태 정보 수신
        const { value } = await reader.read();
        const status = value.getUint8(0);

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
        writer.releaseLock();
        reader.releaseLock();
        updateUI();
    } catch (error) {
        console.error("프린터 상태 체크 실패:", error);
        printerStatus = "Status Check Failed";
        updateUI();
    }
});

function updateUI() {
    statusElement.textContent = `프린터 상태: ${printerStatus}`;
    printButton.disabled = printerStatus !== "Connected";
    statusButton.disabled = printerStatus !== "Connected";
}

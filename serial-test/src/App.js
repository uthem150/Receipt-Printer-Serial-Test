import React, { useState } from "react";
import iconv from "iconv-lite";
import "./App.css";

function App() {
  // 프린터 상태와 포트를 상태로 관리
  const [printerStatus, setPrinterStatus] = useState("Disconnected");
  const [port, setPort] = useState(null);
  const [isPrinterReady, setIsPrinterReady] = useState(false); // 프린터 준비 상태 관리

  // 프린터 연결 함수
  const connectPrinter = async () => {
    if (port && port.readable) {
      alert("프린터가 이미 연결되어 있습니다.");
      return;
    }

    try {
      // 사용자에게 직렬 포트를 선택하도록 요청
      const selectedPort = await navigator.serial.requestPort();
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

  // 인쇄 테스트 함수
  const printTest = async () => {
    if (!port) {
      alert("프린터가 연결되지 않았습니다.");
      return;
    }

    try {
      const writer = port.writable.getWriter(); // 쓰기 위한 writer 객체 생성

      // 한글 모드 설정 (ESC @)
      const setKoreanMode = new Uint8Array([0x1b, 0x40]);
      await writer.write(setKoreanMode);

      // "안녕하세요!"를 KSC5601 인코딩
      const koreanText = iconv.encode("안녕하세요!\n", "ksc5601");
      await writer.write(koreanText);

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

  // 프린터 상태 확인 함수
  const checkPrinterStatus = async () => {
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

  return (
    <div className="App">
      <h1>시리얼 통신 프린터 테스트</h1>
      <button id="connectButton" onClick={connectPrinter}>
        프린터 연결
      </button>
      <button
        id="printButton"
        onClick={printTest}
        disabled={
          printerStatus !== "Connected" && printerStatus !== "Printer Ready"
        }
        // 프린터가 연결되지 않았으면 비활성화
      >
        인쇄 테스트
      </button>
      <button
        id="statusButton"
        onClick={checkPrinterStatus}
        disabled={
          printerStatus !== "Connected" && printerStatus !== "Printer Ready"
        }
        // 프린터가 연결되지 않았으면 비활성화
      >
        프린터 상태 확인
      </button>
      {/* 프린터 상태 표시 */}
      <div id="printerStatus">프린터 상태: {printerStatus}</div>
    </div>
  );
}

export default App;

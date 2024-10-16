import React, { useState } from "react";
import iconv from "iconv-lite";
import "./App.css";
import template from "./template.json";
import { createReceiptTemplate } from "./function/printReceipt";

function App() {
  // 프린터 상태와 포트를 상태로 관리
  const [printerStatus, setPrinterStatus] = useState("Disconnected");
  const [port, setPort] = useState(null);

  // 프린터 연결 함수
  const connectPrinter = async () => {
    if (port && port.readable) {
      alert("프린터가 이미 연결되어 있습니다.");
      return;
    }

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

  // 템플릿 출력
  const printTemplate = async () => {
    // if (!port) {
    //   alert("프린터가 연결되지 않았습니다.");
    //   return;
    // }

    try {
      // const writer = port.writable.getWriter();

      // // 한글 모드 설정 (ESC @)
      // const setKoreanMode = new Uint8Array([0x1b, 0x40]);
      // await writer.write(setKoreanMode);

      const receiptInfo = {
        hotelName: "그랜드 호텔",
        businessNumber: "123-45-67890",
        businessName: "그랜드 호텔 주식회사",
        address: "서울특별시 강남구 테헤란로 123",
        phoneNumber: "02-1234-5678",
        receiptNumber: "R-20231015-001",
        dateTime: "2023-10-15 14:30:00",
        items: [
          { name: "디럭스 룸", price: 200000, quantity: 1 },
          { name: "조식 뷔페", price: 30000, quantity: 2 },
        ],
        totalAmount: 260000,
        taxableAmount: 236364,
        tax: 23636,
        cardType: "신한카드",
        cardNumber: "1234-5678-****-9012",
        installmentMonths: "일시불",
        saleAmount: 260000,
        approvalAmount: 260000,
        approvalNumber: "12345678",
        approvalDateTime: "2023-10-15 14:35:23",
        merchantNumber: "9876543210",
      };

      // createReceiptTemplate(receiptInfo);

      // // 용지 피드 및 절단
      // const feedCommand = new Uint8Array([0x1b, 0x64, 0x03]);
      // await writer.write(feedCommand);

      // const cutCommand = new Uint8Array([0x1d, 0x56, 0x01]);
      // await writer.write(cutCommand);

      // setPrinterStatus("Connected");
      // writer.releaseLock();

      createReceiptTemplate(receiptInfo);
    } catch (error) {
      console.error("프린터 명령어 전송 실패:", error);
      setPrinterStatus("Print Failed");
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

      // 버퍼를 클리어하고 모든 파라메터를 초기화 (ESC @)
      const resetCommand = new Uint8Array([0x1b, 0x40]);
      await writer.write(resetCommand);

      // "안녕하세요!" cp949 인코딩
      // const koreanText = iconv.encode("안녕하세요!\n", "ksc5601");
      const koreanText = iconv.encode("안녕하세요!\n", "cp949");
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

  // 커팅 함수
  const cuttingFunc = async () => {
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

  // 버퍼 테스트 함수
  const bufferTest = async () => {
    if (!port) {
      alert("프린터가 연결되지 않았습니다.");
      return;
    }

    try {
      const writer = port.writable.getWriter(); // 쓰기 위한 writer 객체 생성

      // 버퍼를 클리어하고 모든 파라메터를 초기화 (ESC @)
      const resetCommand = new Uint8Array([0x1b, 0x40]);
      await writer.write(resetCommand);

      for (let i = 0; i < 10; i++) {
        // 가운데 정렬 설정 (ESC a 1)
        const centerAlign = new Uint8Array([0x1b, 0x61, 0x01]);
        await writer.write(centerAlign);

        // 텍스트 출력 (가운데 정렬)
        const centerText = iconv.encode("가운데\n", "cp949");
        await writer.write(centerText);

        // 왼쪽 정렬 설정 (ESC a 0)
        const leftAlign = new Uint8Array([0x1b, 0x61, 0x00]);
        await writer.write(leftAlign);

        // 텍스트 출력 (왼쪽 정렬)
        const leftText = iconv.encode("가운데\n", "cp949");
        await writer.write(leftText);

        // 오른쪽 정렬 설정 (ESC a 0)
        const rightAlign = new Uint8Array([0x1b, 0x61, 0x02]);
        await writer.write(rightAlign);

        // 텍스트 출력 (왼쪽 정렬)
        const rightText = iconv.encode("오른쪽\n", "cp949");
        await writer.write(rightText);
      }

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
      <button
        id="cuttingButton"
        onClick={cuttingFunc}
        disabled={
          printerStatus !== "Connected" && printerStatus !== "Printer Ready"
        }
      >
        커팅
      </button>
      <button
        id="bufferTestButton"
        onClick={bufferTest}
        disabled={
          printerStatus !== "Connected" && printerStatus !== "Printer Ready"
        }
      >
        버퍼 테스트
      </button>
      <button
        id="printTemplateButton"
        onClick={printTemplate}
        disabled={
          printerStatus !== "Connected" && printerStatus !== "Printer Ready"
        }
      >
        인쇄 템플릿
      </button>
      {/* 프린터 상태 표시 */}
      <div id="printerStatus">프린터 상태: {printerStatus}</div>
    </div>
  );
}

export default App;

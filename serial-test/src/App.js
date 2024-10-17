import React, { useState } from "react";
import "./App.css";
import { createReceiptTemplate } from "./function/printReceipt";
import { connectPrinter } from "./function/connectPrinter";
import { printTest } from "./function/printerTest";

function App() {
  // 프린터 상태와 포트를 상태로 관리
  const [printerStatus, setPrinterStatus] = useState("Disconnected");
  const [port, setPort] = useState(null);

  // 템플릿 출력
  const printTemplate = async () => {
    try {
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

      createReceiptTemplate(receiptInfo);
    } catch (error) {
      console.error("프린터 명령어 전송 실패:", error);
      setPrinterStatus("Print Failed");
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
      <button
        id="connectButton"
        onClick={() => connectPrinter(setPort, setPrinterStatus)}
        disabled={port && port.readable}
      >
        프린터 연결
      </button>
      <button
        id="printButton"
        onClick={() => printTest(port, setPrinterStatus)}
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

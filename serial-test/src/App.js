import React, { useState, useEffect } from "react";
import "./App.css";
import { createReceiptTemplate } from "./function/printReceipt";
import { connectPrinter } from "./function/connectPrinter";
import { printTest } from "./function/printerTest";
import { cuttingFunc } from "./function/cuttingFunc";
import { bufferTest } from "./function/bufferTest";
import { checkPrinterStatus } from "./function/checkPrinterStatus"; // 기존 상태 확인 함수

function App() {
  const [printerStatus, setPrinterStatus] = useState("Disconnected");
  const [autoPrinterStatus, setAutoPrinterStatus] = useState("Disconnected");

  const [port, setPort] = useState(null);

  // 프린터 상태 자동 확인 설정
  useEffect(() => {
    let interval;

    // 상태 자동 응답을 활성화하고 상태 체크를 주기적으로 실행
    const startStatusCheck = async () => {
      if (port) {
        try {
          // 일정 시간 간격으로 상태 체크 (1초 간격)
          interval = setInterval(() => {
            checkPrinterStatus(port, setAutoPrinterStatus);
          }, 1000);
        } catch (error) {
          console.error("상태 체크 자동 응답 설정 실패:", error);
        }
      }
    };

    // 프린터 상태를 자동으로 가져오기 시작
    startStatusCheck();

    // 컴포넌트 언마운트 시 상태 체크를 중지
    return () => clearInterval(interval);
  }, [port]); // port가 변경될 때마다 상태 체크 시작

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
      >
        인쇄 테스트
      </button>
      <button
        id="statusButton"
        onClick={() => checkPrinterStatus(port, setPrinterStatus)}
        disabled={
          printerStatus !== "Connected" && printerStatus !== "Printer Ready"
        }
      >
        프린터 상태 확인
      </button>
      <button
        id="cuttingButton"
        onClick={() => cuttingFunc(port, setPrinterStatus)}
        disabled={
          printerStatus !== "Connected" && printerStatus !== "Printer Ready"
        }
      >
        커팅
      </button>
      <button
        id="bufferTestButton"
        onClick={() => bufferTest(port, setPrinterStatus)}
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
      <div id="autoPrinterStatus">
        자동 프린터 상태확인: {autoPrinterStatus}
      </div>
    </div>
  );
}

export default App;

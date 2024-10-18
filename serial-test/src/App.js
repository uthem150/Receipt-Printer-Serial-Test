import React, { useState, useEffect } from "react";
import "./App.css";
import { createReceiptTemplate } from "./function/printReceipt";
import { connectPrinter } from "./function/connectPrinter";
import { printTest } from "./function/printerTest";
import { cuttingFunc } from "./function/cuttingFunc";
import { bufferTest } from "./function/bufferTest";
import { checkPrinterStatus } from "./function/checkPrinterStatus";
import { printerLock } from "./Mutex/printerLock";
import PrinterStatusDisplay from "./component/PrinterStatusDisplay";

function App() {
  const [printerStatus, setPrinterStatus] = useState("Disconnected");
  const [autoPrinterStatus, setAutoPrinterStatus] = useState("Disconnected");
  const [port, setPort] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // 안전한 프린터 상태 체크 함수
  const safeCheckStatus = async (port, setStatus) => {
    try {
      await printerLock.acquire();
      await checkPrinterStatus(port, setStatus);
    } catch (error) {
      console.error("프린터 상태 체크 실패:", error);
    } finally {
      printerLock.release();
    }
  };

  // 프린터 상태 자동 확인 설정
  useEffect(() => {
    let interval;
    let isChecking = false; // 상태 체크 중복 방지 플래그

    const startStatusCheck = async () => {
      if (port) {
        interval = setInterval(async () => {
          if (!isChecking) {
            isChecking = true;
            await safeCheckStatus(port, setAutoPrinterStatus);
            isChecking = false;
          }
        }, 1000);
      }
    };

    startStatusCheck();
    // 컴포넌트 언마운트 시 상태 체크를 중지
    return () => clearInterval(interval);
  }, [port]); // port가 변경될 때마다 상태 체크 시작

  // 안전한 프린터 템플릿 출력 함수
  const printTemplate = async () => {
    try {
      await printerLock.acquire();
      setIsPrinting(true);

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

      await createReceiptTemplate(receiptInfo);
    } catch (error) {
      console.error("프린터 명령어 전송 실패:", error);
      setPrinterStatus("Print Failed");
    } finally {
      setIsPrinting(false);
      printerLock.release();
    }
  };

  // 안전한 프린트 테스트 함수
  const handlePrintTest = async () => {
    try {
      await printerLock.acquire();
      setIsPrinting(true);
      await printTest(port, setPrinterStatus);
    } finally {
      setIsPrinting(false);
      printerLock.release();
    }
  };

  // 안전한 커팅 함수
  const handleCutting = async () => {
    try {
      await printerLock.acquire();
      setIsPrinting(true);
      await cuttingFunc(port, setPrinterStatus);
    } finally {
      setIsPrinting(false);
      printerLock.release();
    }
  };

  // 안전한 버퍼 테스트 함수
  const handleBufferTest = async () => {
    try {
      await printerLock.acquire();
      setIsPrinting(true);
      await bufferTest(port, setPrinterStatus);
    } finally {
      setIsPrinting(false);
      printerLock.release();
    }
  };

  // 안전한 상태 체크 핸들러
  const handleStatusCheck = () => {
    safeCheckStatus(port, setPrinterStatus);
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
        onClick={handlePrintTest}
        disabled={
          (printerStatus !== "Connected" &&
            printerStatus !== "Printer Ready") ||
          isPrinting
        }
      >
        인쇄 테스트
      </button>
      <button
        id="statusButton"
        onClick={handleStatusCheck}
        disabled={
          (printerStatus !== "Connected" &&
            printerStatus !== "Printer Ready") ||
          isPrinting
        }
      >
        프린터 상태 확인
      </button>
      <button
        id="cuttingButton"
        onClick={handleCutting}
        disabled={
          (printerStatus !== "Connected" &&
            printerStatus !== "Printer Ready") ||
          isPrinting
        }
      >
        커팅
      </button>
      <button
        id="bufferTestButton"
        onClick={handleBufferTest}
        disabled={
          (printerStatus !== "Connected" &&
            printerStatus !== "Printer Ready") ||
          isPrinting
        }
      >
        버퍼 테스트
      </button>
      <button
        id="printTemplateButton"
        onClick={printTemplate}
        disabled={
          (printerStatus !== "Connected" &&
            printerStatus !== "Printer Ready") ||
          isPrinting
        }
      >
        인쇄 템플릿
      </button>
      {/* 프린터 상태 표시 */}
      <div id="printerStatus">프린터 상태: {printerStatus}</div>
      <div id="autoPrinterStatus">
        자동 프린터 상태확인: {autoPrinterStatus}
      </div>
      {isPrinting && <div>인쇄 중...</div>}
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "3rem  " }}
      >
        <PrinterStatusDisplay port={port} />
      </div>
    </div>
  );
}

export default App;

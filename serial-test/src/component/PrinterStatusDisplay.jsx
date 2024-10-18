import React, { useState, useEffect } from "react";
import { checkPrinterStatus } from "../function/checkPrinterStatus";
import { printerLock } from "../Mutex/printerLock";

const PrinterStatusDisplay = ({ port }) => {
  const [status, setStatus] = useState("");
  const [statusColor, setStatusColor] = useState("#e2e8f0");
  const [isChecking, setIsChecking] = useState(false);

  // 프린터 상태 체크 함수
  const checkStatus = async () => {
    try {
      if (isChecking) return;
      setIsChecking(true);

      await printerLock.acquire();

      try {
        await checkPrinterStatus(port, handleStatusUpdate);
      } finally {
        printerLock.release();
      }
    } catch (error) {
      console.error("프린터 상태 체크 오류:", error);
      setStatus("상태 체크 실패: " + error.message);
      setStatusColor("#ef4444"); // 빨간색
    } finally {
      setIsChecking(false);
    }
  };

  const handleStatusUpdate = (statusMessage) => {
    setStatus(statusMessage);

    // 상태에 따른 색상 결정
    if (statusMessage.includes("Printer Ready")) {
      setStatusColor("#3b82f6"); // 파란색
    } else if (statusMessage.includes("프린트 또는 feeding 중")) {
      setStatusColor("#22c55e"); // 초록색
    } else if (
      statusMessage.includes("용지 Near End") ||
      statusMessage.includes("보조 센서에 용지 있음")
    ) {
      setStatusColor("#f97316"); // 주황색
    } else if (
      statusMessage.includes("프린터 헤드 업") ||
      statusMessage.includes("용지 잼 있음") ||
      statusMessage.includes("용지 없음") ||
      statusMessage.includes("컷터 에러(잼) 있음")
    ) {
      setStatusColor("#ef4444"); // 빨간색
    }
  };

  useEffect(() => {
    let intervalId;

    const startStatusCheck = async () => {
      await checkStatus();
      intervalId = setInterval(async () => {
        await checkStatus();
      }, 500);
    };

    if (port) {
      startStatusCheck();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [port]);

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "16px",
        width: "100%",
        maxWidth: "320px",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: statusColor,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "4px",
            }}
          >
            프린터 상태
          </div>
          <div
            style={{
              fontSize: "14px",
              whiteSpace: "pre-line",
            }}
          >
            {status || "상태 확인 중..."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterStatusDisplay;

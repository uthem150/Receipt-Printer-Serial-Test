// 프린터 잠금기능 처리하는 클래스

class PrinterLock {
  // 프린터가 사용 중인지 아닌지와 대기 중인 작업들을 관리
  constructor() {
    this.isLocked = false; // 프린터가 사용 중인지 아닌지 나타내는 변수
    this.queue = []; // 대기 중인 작업들 저장하는 리스트
  }

  // 프린터 잠금 (프린터를 사용할 때, 호출) - 비동기 함수라서 항상 Promise를 반환
  async acquire() {
    // 프린터가 사용 중이 아닐 때만
    if (!this.isLocked) {
      this.isLocked = true; // 프린터를 잠금 (문을 잠근 것처럼)
      return Promise.resolve(); // 즉시 작업을 실행
    }

    // 만약 프린터가 이미 사용 중이라면
    // 새로운 프로미스 만들고, 나중에 프린트 사용가능해지면 완료됨
    return new Promise((resolve) => {
      this.queue.push(resolve); // 대기 목록에 추가
    });
  }

  // 프린터 잠금 해제 (일 마치면, 호출)
  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift(); // 대기 중인 작업 하나 꺼내기
      next(); // 꺼낸 작업 실행
    } else {
      this.isLocked = false; // 더 이상 대기 중인 작업이 없으면 잠금 해제 (문을 다시 열어줌)
    }
  }
}

export const printerLock = new PrinterLock();

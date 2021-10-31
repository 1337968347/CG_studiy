const createClock = (webXRSession?: XRSession) => {
  let isRunning: boolean = false;
  let nowT: number;
  let timeId: number | null = null;
  let onTick: (t: number, frame: any) => void = undefined;

  const start = async (webXRSession?: XRSession) => {
    if (isRunning) return;
    isRunning = true;
    nowT = new Date().getTime();
    let loopFunc: Function;

    const f = (time: number, frame: XRFrame) => {
      if (isRunning) {
        tick(time, frame);
        loopFunc(f);
      }
    };

    // 定时器
    const intervalRequest = (func: Function) => {
      timeId = setTimeout(func, 16);
    };

    loopFunc = webXRSession
      ? webXRSession.requestAnimationFrame.bind(webXRSession)
      : window.requestAnimationFrame || intervalRequest;

    loopFunc(f);
  };

  const stop = () => {
    isRunning = false;
    if (timeId) {
      clearInterval(timeId);
      timeId = null;
    }
    if (webXRSession) {
      webXRSession.end();
      webXRSession = undefined;
    }
  };

  const tick = (now: number, frame: XRFrame) => {
    const t = nowT;

    onTick && onTick((now - t) / 1000, frame);
  };

  const setOnTick = (_onTick: (time: number, frame?: XRFrame) => {}) => {
    onTick = _onTick;
  };
  return {
    start,
    stop,
    setOnTick,
  };
};

export default createClock;

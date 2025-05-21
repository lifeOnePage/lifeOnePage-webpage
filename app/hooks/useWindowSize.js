import { useState, useEffect } from 'react';

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function onResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', onResize);
    // 초기 한번 실행
    onResize();

    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}

export default useWindowSize;

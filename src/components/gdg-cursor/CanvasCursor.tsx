import { useRef } from 'react';
import { createPortal } from 'react-dom';
import useCanvasCursor from '../../hooks/useCanvasCursor';

const CanvasCursor = () => {
  const canvasRef = useRef(null);
  useCanvasCursor(canvasRef);

  return createPortal(
    <canvas 
      ref={canvasRef}
      style={{ 
        zIndex: 99999999, 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        pointerEvents: 'none',
        background: 'transparent'
      }} 
    />,
    document.body
  );
};

export default CanvasCursor;

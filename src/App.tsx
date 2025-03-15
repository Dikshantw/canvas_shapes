import { useCallback, useEffect, useRef, useState } from "react";
import Toolbar from "./components/Toolbar";
import { DrawingTools } from "./types/drawings";
import { Minus, Plus } from "lucide-react";

type Point = {
	x: number,
	y: number
};
type Shapes = {
  type: DrawingTools;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: Point[];
  endX?: number;
  endY?: number;
};

type ZoomState = {
  scale: number;
  originX: number;
  originY: number;
  zoomFactor: number;
  minScale: number;
  maxScale: number;
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<Shapes[]>([]);
  const [currentShape, setCurrentShape] = useState<Shapes | null>(null);
  const [selectedShape, setSelectedShape] = useState<DrawingTools>("Rectangle");
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    originX: 0,
    originY: 0,
    zoomFactor: 1.1,
    minScale: 0.1,
    maxScale: 30,
  });
  const [points,setPoints] = useState<Point[]>([])
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [originAtPanStart, setOriginAtPanStart] = useState({ x: 0, y: 0 });

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(18,18,18,255)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(
      zoomState.scale,
      0,
      0,
      zoomState.scale,
      zoomState.originX,
      zoomState.originY
    );
    ctx.strokeStyle = "white";

    const drawShape = (shape: Shapes) => {
      switch (shape.type) {
        case "Rectangle":
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          break;
        case "Ellipse":
          ctx.beginPath();
          ctx.ellipse(
            shape.x + shape.width / 2,
            shape.y + shape.height / 2,
            Math.abs(shape.width) / 2,
            Math.abs(shape.height) / 2,
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          break;
        case "Line":
          ctx.beginPath();
          ctx.moveTo(shape.x, shape.y);
          ctx.lineTo(shape.endX!, shape.endY!);
          ctx.stroke();
          break;
        case "Arrow": {
          ctx.beginPath();
          ctx.moveTo(shape.x, shape.y);
          ctx.lineTo(shape.endX!, shape.endY!);
          ctx.stroke();

          const angleTheta = Math.atan2(
            shape.endY! - shape.y,
            shape.endX! - shape.x
          );
          const arrowSize = 10;
          const x1 =
            shape.endX! - arrowSize * Math.cos(angleTheta - Math.PI / 6);
          const y1 =
            shape.endY! - arrowSize * Math.sin(angleTheta - Math.PI / 6);
          const x2 =
            shape.endX! - arrowSize * Math.cos(angleTheta + Math.PI / 6);
          const y2 =
            shape.endY! - arrowSize * Math.sin(angleTheta + Math.PI / 6);

          ctx.beginPath();
          ctx.moveTo(shape.endX!, shape.endY!);
          ctx.lineTo(x1, y1);
          ctx.moveTo(shape.endX!, shape.endY!);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          break;
        }
        case "Pencil":
			if (shape.points && shape.points.length > 1) {
				ctx.beginPath();
				ctx.moveTo(shape.points[0].x, shape.points[0].y);
				for (let i = 1; i < shape.points.length; i++) {
				  ctx.lineTo(shape.points[i].x, shape.points[i].y);
				}
				ctx.stroke();
			  }
          break;
      }
    };

    shapes.forEach(drawShape);
    if (currentShape) {
      drawShape(currentShape);
    }
  }, [shapes, currentShape, zoomState]);

  useEffect(() => {
    redrawCanvas();
  }, [zoomState, redrawCanvas]);

  useEffect(() => {
    const storedShapes = localStorage.getItem("shapes");
    if (storedShapes) {
      setShapes(JSON.parse(storedShapes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("shapes", JSON.stringify(shapes));
    redrawCanvas();
  }, [shapes, redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas();
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [redrawCanvas]);

  const getCursorPosition = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - zoomState.originX) / zoomState.scale,
        y: (e.clientY - rect.top - zoomState.originY) / zoomState.scale,
      };
    },
    [zoomState]
  );

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoomState((prev) => {
      const canvas = canvasRef.current;
      if (!canvas) return prev;
      const rect = canvas.getBoundingClientRect();
      const pointerX = (e.clientX - rect.left - prev.originX) / prev.scale;
      const pointerY = (e.clientY - rect.top - prev.originY) / prev.scale;
      const zoomSensitivity = 0.001; // adjust sensitivity as needed
      const factor = Math.exp(-e.deltaY * zoomSensitivity);
      const newScale = Math.max(
        Math.min(prev.scale * factor, prev.maxScale),
        prev.minScale
      );
      const scaleRatio = newScale / prev.scale;
      return {
        ...prev,
        scale: newScale,
        originX: pointerX - (pointerX - prev.originX) * scaleRatio,
        originY: pointerY - (pointerY - prev.originY) * scaleRatio,
      };
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (selectedShape === "Pan") {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setOriginAtPanStart({ x: zoomState.originX, y: zoomState.originY });
      }
      setIsDrawing(true);
      setStartPos(getCursorPosition(e));

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (selectedShape === "Pencil") {
        setPoints([getCursorPosition(e)]);
      }
    },
    [getCursorPosition, selectedShape, zoomState.originX, zoomState.originY]
  );

  const handleMouseUp = useCallback(() => {
    if (selectedShape === "Pan") {
      setIsPanning(false);
      return;
    }
    if (selectedShape === "Pencil" && points.length > 1) {
		const newShape: Shapes = {
		  type: "Pencil",
		  x: startPos.x,
		  y: startPos.y,
		  width: 0,
		  height: 0,
		  points: [...points]
		};
		setShapes(prevShapes => [...prevShapes, newShape]);
		setPoints([]);
	  } else if (currentShape && selectedShape !== "Pencil") {
		setShapes(prevShapes => [...prevShapes, currentShape]);
	  }
    setIsDrawing(false);
    setCurrentShape(null);
  }, [currentShape, points, selectedShape, startPos.x, startPos.y]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (selectedShape === "Pan" && isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setZoomState((prev) => ({
          ...prev,
          originX: originAtPanStart.x + dx,
          originY: originAtPanStart.y + dy,
        }));
        redrawCanvas();
        return;
      }
      if (!isDrawing) return;
      const { x, y } = getCursorPosition(e);

      let newShape: Shapes;
	  if (selectedShape === "Pencil") {
        setPoints(prev => [...prev, {x,y}]);
        newShape = {
          type: selectedShape,
          x: startPos.x,
          y: startPos.y,
          width: 0,
          height: 0,
          points: [...points],
          endX: x,
          endY: y
        }
        setCurrentShape(newShape)
        redrawCanvas();
        return;
      }


      if (selectedShape === "Line" || selectedShape === "Arrow") {
        newShape = {
          type: selectedShape,
          x: startPos.x,
          y: startPos.y,
          width: 0,
          height: 0,
          endX: x,
          endY: y,
        };
      } else {
        newShape = {
          type: selectedShape,
          x: startPos.x,
          y: startPos.y,
          width: x - startPos.x,
          height: y - startPos.y,
        };
      }
      setCurrentShape(newShape);
      redrawCanvas();
    },
    [selectedShape, isPanning, isDrawing, getCursorPosition, redrawCanvas, panStart, originAtPanStart, startPos, points]
  );

  // Zoom buttons use the center of the canvas as the target.
  const handleZoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    setZoomState((prev) => {
      const newScale = Math.min(prev.scale * prev.zoomFactor, prev.maxScale);
      const scaleRatio = newScale / prev.scale;
      return {
        ...prev,
        scale: newScale,
        originX: centerX - (centerX - prev.originX) * scaleRatio,
        originY: centerY - (centerY - prev.originY) * scaleRatio,
      };
    });
  };

  const handleZoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    setZoomState((prev) => {
      const newScale = Math.max(prev.scale / prev.zoomFactor, prev.minScale);
      const scaleRatio = newScale / prev.scale;
      return {
        ...prev,
        scale: newScale,
        originX: centerX - (centerX - prev.originX) * scaleRatio,
        originY: centerY - (centerY - prev.originY) * scaleRatio,
      };
    });
  };

  const handleResetZoom = () => {
    setZoomState((prev) => ({
      ...prev,
      scale: 1,
      originX: 0,
      originY: 0,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove, handleWheel]);

  return (
    <div className="overflow-hidden">
      {/* <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 bg-white rounded-lg shadow-lg p-1 animate-fade-in">
				<div className="flex items-center space-x-1 px-1">
					<label
						className={`${selectedShape === "panning" ? "bg-[#403e6a]" : ""
							} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="panning"
							checked={selectedShape === "panning"}
							onChange={() => setSelectedShape("panning")}
						/>
						<Hand size={24} />
					</label>
					<label
						className={`${selectedShape === "rectangle" ? "bg-[#403e6a]" : ""
							} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="rectangle"
							checked={selectedShape === "rectangle"}
							onChange={() => setSelectedShape("rectangle")}
						/>
						<RectangleHorizontal />
					</label>
					<label
						className={`${selectedShape === "ellipse" ? "bg-[#403e6a]" : ""
							} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="ellipse"
							checked={selectedShape === "ellipse"}
							onChange={() => setSelectedShape("ellipse")}
						/>
						<Circle />
					</label>
					<label
						className={`${selectedShape === "line" ? "bg-[#403e6a]" : ""
							} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="line"
							checked={selectedShape === "line"}
							onChange={() => setSelectedShape("line")}
						/>
						<Minus />
					</label>
					<label
						className={`${selectedShape === "arrow" ? "bg-[#403e6a]" : ""
							} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="arrow"
							checked={selectedShape === "arrow"}
							onChange={() => setSelectedShape("arrow")}
						/>
						<MoveRight />
					</label>
				</div>
			</div> */}
      <div className="absolute bottom-2.5 left-2.5 z-10 flex gap-2 bg-[#232329] text-[#e3e3e8] p-1 rounded">
        <button
          onClick={handleZoomOut}
          className="cursor-pointer flex justify-center items-center"
        >
          <Minus size={16} />
        </button>
        <button onClick={handleResetZoom} className="w-14">
          {Math.round(zoomState.scale * 100)}
        </button>
        <button
          onClick={handleZoomIn}
          className="cursor-pointer flex justify-center items-center"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-6 left-1/2 bg-[#232329] transform -translate-x-1/2 flex space-x-4 rounded-lg shadow-lg p-1 animate-fade-in">
        <Toolbar
          selectedShape={selectedShape}
          setSelectedShape={setSelectedShape}
        />
      </div>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

export default App;

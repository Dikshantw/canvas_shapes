import { useCallback, useEffect, useRef, useState } from "react";

type ShapeType = "rectangle" | "ellipse" | "line" | "arrow";

type Shapes = {
	type: ShapeType;
	x: number;
	y: number;
	width: number;
	height: number;
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
}
function App() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [startPos, setStartPos] = useState({ x: 0, y: 0 });
	const [shapes, setShapes] = useState<Shapes[]>([]);
	const [currentShape, setCurrentShape] = useState<Shapes | null>(null);
	const [selectedShape, setSelectedShape] = useState<ShapeType>("rectangle");
	const [zoomState, setZoomState] = useState<ZoomState>({
		scale: 1,
		originX: 0,
		originY: 0,
		zoomFactor: 1.1,
		minScale: 0.1,
		maxScale: 5
	});
	const mouseRef = useRef({ x: 0, y: 0, wheel: 0 });

	const updateZoom = useCallback(()=>{
		setZoomState((prev) => {
			let newScale = prev.scale
			if(mouseRef.current.wheel !== 0){
				const {x,y,wheel} = mouseRef.current;
				const newTargetX = x
				const newTargetY = y;

				if(wheel < 0){
					newScale = Math.min(prev.scale * prev.zoomFactor,prev.maxScale);
				}else {
					newScale = Math.max(prev.scale / prev.zoomFactor, prev.minScale)
				}
				const scaleRatio = newScale/prev.scale
				return {
					...prev,
					scale: newScale,
					originX: newTargetX - (newTargetX - prev.originX) * scaleRatio,
					originY: newTargetY - (newTargetY - prev.originY) * scaleRatio
				}
			}
			return prev;
		})
	},[])
	const redrawCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(1,0,0,1,0,1)
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "rgba(18,18,18,255)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.setTransform(zoomState.scale, 0,0,zoomState.scale,zoomState.originX,zoomState.originY)
		ctx.strokeStyle = "white";

		const drawShape = (shape: Shapes) => {
			switch (shape.type) {
				case "rectangle":
					ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
					break;
				case "ellipse":
					ctx.beginPath();
					ctx.ellipse(
						shape.x + shape.width / 2,
						shape.y + shape.height / 2,
						Math.abs(shape.width) / 2,
						Math.abs(shape.height) / 2,
						0,
						0,
						Math.PI * 2,
					);
					ctx.stroke();
					break;
				case "line":
					ctx.beginPath();
					ctx.moveTo(shape.x, shape.y);
					ctx.lineTo(shape.endX!, shape.endY!);
					ctx.stroke();
					break;
				case "arrow": {
					ctx.beginPath();
					ctx.moveTo(shape.x, shape.y);
					ctx.lineTo(shape.endX!, shape.endY!);
					ctx.stroke();

					const angleTheta = Math.atan2(
						shape.endY! - shape.y,
						shape.endX! - shape.x,
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
					//ctx.lineTo(shape.endX!, shape.endY!);
					// ctx.fillStyle = "white";
					// ctx.fill();
					ctx.stroke();
					break;
				}
			}
		};

		shapes.forEach(drawShape);

		if (currentShape) {
			drawShape(currentShape);
		}
		
	}, [shapes, currentShape,zoomState]);

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

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const getCursorPostion = (e: MouseEvent) => {
		const canvas = canvasRef.current;
		if(!canvas) return {x:0,y:0}
    	const rect = canvas.getBoundingClientRect();
    	return {
      		x: (e.clientX - rect.left - zoomState.originX) / zoomState.scale,
      		y: (e.clientY - rect.top - zoomState.originY) / zoomState.scale,
    	};
	};
	const handleWheel = useCallback((e: WheelEvent) => {
		e.preventDefault();
		const position = getCursorPostion(e)
		mouseRef.current.x = position.x
		mouseRef.current.y = position.y
		mouseRef.current.wheel = e.deltaY;
		updateZoom()
	},[getCursorPostion, updateZoom]);

	const handleMouseDown = useCallback((e: MouseEvent) => {
		console.log("mouse down at", e.clientX, e.clientY);
		setIsDrawing(true);
		setStartPos(getCursorPostion(e));
	}, [getCursorPostion]);

	const handleMouseUp = useCallback(
		(e: MouseEvent) => {
			console.log("mouse up at", e.clientX, e.clientY);
			if (currentShape) {
				setShapes((prevShapes) => [...prevShapes, currentShape]);
			}
			setIsDrawing(false);
			setCurrentShape(null);
		},
		[currentShape],
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDrawing) return;

			const { x, y } = getCursorPostion(e);

			let newShape: Shapes;
			if (selectedShape === "line" || selectedShape === "arrow") {
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
		[isDrawing, startPos, redrawCanvas, selectedShape,getCursorPostion],
	);
	
	
	
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.addEventListener("mousedown", handleMouseDown);
		canvas.addEventListener("mouseup", handleMouseUp);
		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("wheel", handleWheel);

		return () => {
			canvas.removeEventListener("mousedown", handleMouseDown);
			canvas.removeEventListener("mouseup", handleMouseUp);
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("wheel", handleWheel);
		};
	}, [handleMouseDown, handleMouseUp, handleMouseMove, handleWheel]);
	console.log(selectedShape);
	return (
		<div>
			<div className="absolute top-2.5 left-2.5 z-10">
				<div className="flex gap-1 bg-[#232329]">
					<label
						className={`${selectedShape === "rectangle" ? "bg-[#403e6a]" : ""} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="rectangle"
							checked={selectedShape === "rectangle"}
							onChange={() => setSelectedShape("rectangle")}
						/>
						<span className="text-white">rectangle</span>
					</label>
					<label
						className={`${selectedShape === "ellipse" ? "bg-[#403e6a]" : ""} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="ellipse"
							checked={selectedShape === "ellipse"}
							onChange={() => setSelectedShape("ellipse")}
						/>
						<span className="text-white">ellipse</span>
					</label>
					<label
						className={`${selectedShape === "line" ? "bg-[#403e6a]" : ""} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="line"
							checked={selectedShape === "line"}
							onChange={() => setSelectedShape("line")}
						/>
						<span className="text-white">line</span>
					</label>
					<label
						className={`${selectedShape === "arrow" ? "bg-[#403e6a]" : ""} cursor-pointer`}
					>
						<input
							className="opacity-0"
							type="radio"
							name="select_shape"
							id="arrow"
							checked={selectedShape === "arrow"}
							onChange={() => setSelectedShape("arrow")}
						/>
						<span className="text-white">arrow</span>
					</label>
				</div>
			</div>
			<canvas ref={canvasRef}></canvas>
		</div>
	);
}

export default App;

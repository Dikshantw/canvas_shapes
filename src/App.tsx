import { useCallback, useEffect, useRef, useState } from "react";

type ShapeType = "rectangle" | "ellipse" | "line" | "arrow" | "panning";

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
};

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
		maxScale: 30,
	});

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
			zoomState.originY,
		);
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
					ctx.stroke();
					break;
				}
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
		[zoomState],
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
				prev.minScale,
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
			console.log(selectedShape);
			if (selectedShape === "panning") {
				setIsPanning(true);
				setPanStart({ x: e.clientX, y: e.clientY });
				setOriginAtPanStart({ x: zoomState.originX, y: zoomState.originY });
				console.log(
					"panning",
					setIsPanning,
					" ",
					"panStatrt",
					setPanStart,
					" ",
					"originpan",
					setOriginAtPanStart,
				);
			} else {
				setIsDrawing(true);
				setStartPos(getCursorPosition(e));
			}
		},
		[getCursorPosition, selectedShape, zoomState.originX, zoomState.originY],
	);

	const handleMouseUp = useCallback(() => {
		if (selectedShape === "panning") {
			setIsPanning(false);
			return;
		}
		if (currentShape) {
			setShapes((prevShapes) => [...prevShapes, currentShape]);
		}
		setIsDrawing(false);
		setCurrentShape(null);
	}, [currentShape, selectedShape]);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (selectedShape === "panning" && isPanning) {
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
		[
			isDrawing,
			isPanning,
			panStart,
			originAtPanStart,
			startPos,
			redrawCanvas,
			selectedShape,
			getCursorPosition,
		],
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
		<div>
			<div className="absolute top-2.5 left-2.5 z-10">
				<div className="flex gap-1 bg-[#232329]">
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
						<span className="text-white">Panning</span>
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
						<span className="text-white">rectangle</span>
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
						<span className="text-white">ellipse</span>
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
						<span className="text-white">line</span>
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
						<span className="text-white">arrow</span>
					</label>
				</div>
			</div>
			<div className="absolute bottom-2.5 left-2.5 z-10 flex gap-2 bg-[#232329] p-1 rounded">
				<button onClick={handleZoomOut}>-</button>
				<button onClick={handleResetZoom}>
					{Math.round(zoomState.scale * 100)}
				</button>
				<button onClick={handleZoomIn}>+</button>
			</div>
			<canvas ref={canvasRef}></canvas>
		</div>
	);
}

export default App;

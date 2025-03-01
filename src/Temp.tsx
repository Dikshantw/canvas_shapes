import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [try, setTry] = useState(true)

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		let clicked = false;
		let start = 0;
		let end = 0;

		canvas.addEventListener("mousedown", (e) => {
			clicked = true;
			start = e.clientX;
			end = e.clientY;
		});
		canvas.addEventListener("mouseup", () => {
			clicked = false;
		});
		canvas.addEventListener('mousemove', (e) => {
			if (clicked) {
				const width = e.clientX - start;
				const height = e.clientY - end;
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.strokeStyle = "rgb(255,255,255)";
				ctx.strokeRect(start, end, width, height);
			}
		});
		function handle() {
			return true;
		}
	}, [canvasRef]);

	return (
		<>
			<div>what is this ?</div>
			<canvas ref={canvasRef} height={1000} width={1080}></canvas>
		</>)
}

export default App;

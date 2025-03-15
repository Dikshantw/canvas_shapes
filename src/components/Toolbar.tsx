import { Circle, Hand, Minus, MoveRight, Pencil, RectangleHorizontal } from "lucide-react";
import { DrawingTools } from "../types/drawings";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

interface ToolbarProps {
    selectedShape: DrawingTools,
    setSelectedShape: (tool: DrawingTools) => void;
}

export default function Toolbar({selectedShape,setSelectedShape}: ToolbarProps) {
    const tools = [
        {
            name: "Pan" as DrawingTools,
            icon: <Hand size={18} color="#e3e3e8"/>,
            label: "Panning"
        },
        {
            name: "Rectangle" as DrawingTools,
            icon: <RectangleHorizontal size={18} color="#e3e3e8"/>,
            label: "Rectangle"
        },
        {
            name: "Ellipse" as DrawingTools,
            icon: <Circle size={18} color="#e3e3e8"/>,
            label: "Circle"
        },
        {
            name: "Arrow" as DrawingTools,
            icon: <MoveRight size={18} color="#e3e3e8"/>,
            label: "Arrow"
        },
        {
            name: "Line" as DrawingTools,
            icon: <Minus size={18} color="#e3e3e8"/>,
            label: "Line"
        },
        {
            name: "Pencil" as DrawingTools,
            icon: <Pencil size={18} color="#e3e3e8"/>,
            label: "Pencil"
        },
    ];
    
    return (
        <div className="flex items-center space-x-2 px-2">
            <RadioGroup 
                value={selectedShape} 
                onValueChange={(value)=> setSelectedShape(value as DrawingTools)} 
                className="flex items-center space-x-1">
                {tools.map((tool)=>(
                    <div key={tool.name} className="flex items-center space-x-1">
                        <div className={`relative flex items-center justify-center w-10 h-10 rounded-md transition-colors group ${selectedShape === tool.name ? 'bg-[#403e6a]' : 'hover:bg-[#363541]'}`}>
                            <RadioGroupItem 
                                value={tool.name} 
                                id={tool.name} 
                                className="sr-only" />
                            <Label 
                                htmlFor={tool.name}
                                className={`cursor-pointer flex items-center justify-center w-full h-full ${selectedShape === tool.name ? 'text-primary' : ''}`}
                            >{tool.icon}
                            </Label>
                            <span className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">{tool.label}</span>
                        </div>
                    </div>
                ))}
            </RadioGroup>
        </div>
    )
}
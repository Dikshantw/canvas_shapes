import { Circle, Hand, Minus, MoveRight, RectangleHorizontal } from "lucide-react";
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
            icon: <Hand size={18} />,
            label: "Panning"
        },
        {
            name: "Rectangle" as DrawingTools,
            icon: <RectangleHorizontal size={18} />,
            label: "Rectangle"
        },
        {
            name: "Ellipse" as DrawingTools,
            icon: <Circle size={18} />,
            label: "Circle"
        },
        {
            name: "Line" as DrawingTools,
            icon: <Minus size={18} />,
            label: "Line"
        },
        {
            name: "Arrow" as DrawingTools,
            icon: <MoveRight size={18} />,
            label: "Arrow"
        }
    ];
    
    return (
        <div className="flex items-center">
            <RadioGroup value={selectedShape} onValueChange={(value)=> setSelectedShape(value as DrawingTools)} className="flex items-center">
                {tools.map((tool)=>(
                    <div key={tool.name} className="flex items-center">
                        <div>
                            <RadioGroupItem value={tool.name} id={tool.name} className="sr-only" />
                            <Label 
                                htmlFor={tool.name}
                                className={"cursor-pointer flex items-center"}
                            >{tool.icon}
                            </Label>
                            <span className="absolute bottom-full hidden group-hover:block bg-black text-white text-xs ">{tool.label}</span>
                        </div>
                    </div>
                ))}
            </RadioGroup>
        </div>
    )
}
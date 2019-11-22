import { vec3, mat4 } from "gl-matrix";
import { RayTraceSolver } from "./RayTraceSolver";
import { Scenegraph } from "./Scenegraph";
import { VertexPNT } from "./VertexPNT";
import { Stack } from "%COMMON/Stack";

export class RTView {
    private canvas: HTMLCanvasElement;
    constructor() {
        this.canvas = <HTMLCanvasElement>document.querySelector("#raytraceCanvas");
        if (!this.canvas) {
            console.log("Failed to retrieve the <canvas> element");
            return;
        }
        //button clicks
        let button: HTMLButtonElement = <HTMLButtonElement>document.querySelector("#savebutton");
        button.addEventListener("click", ev => this.saveCanvas());
    }

    private saveCanvas(): void {
        let link = document.createElement('a');
        link.href = this.canvas.toDataURL('image/png');
        link.download = "result.png";
        link.click();
    }

    public fillCanvas(scenegraph: Scenegraph<VertexPNT>): void {
        console.log(scenegraph);
        let width: number = Number(this.canvas.getAttribute("width"));
        let height: number = Number(this.canvas.getAttribute("height"));
        let imageData: ImageData = this.canvas.getContext('2d').createImageData(width, height);
        let rayTraceSolver: RayTraceSolver = new RayTraceSolver(scenegraph);
        let stack: Stack<mat4> = new Stack();
        stack.push(mat4.create());
        let pixels: vec3[][] = rayTraceSolver.rayTrace(width, height, stack);

        for (let i: number = 0; i < height; i++) {
            for (let j: number = 0; j < width; j++) {
                // if (pixels[i][j][0] === 0 && pixels[i][j][1] === 1 && pixels[i][j][2] === 0) {
                //     console.log("green");
                // }

                imageData.data[4 * (i * width + j)] = 255 * pixels[i][j][0];
                imageData.data[4 * (i * width + j) + 1] = 255 * pixels[i][j][1];
                imageData.data[4 * (i * width + j) + 2] = 255 * pixels[i][j][2];
                imageData.data[4 * (i * width + j) + 3] = 255;
            }
        }
        this.canvas.getContext('2d').putImageData(imageData, 0, 0);

        let context: CanvasRenderingContext2D = this.canvas.getContext('2d')
        context.fillStyle = 'red';
        context.fillRect(100, 100, 200, 100);
    }
}
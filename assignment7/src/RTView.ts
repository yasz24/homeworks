import { vec3 } from "gl-matrix";
import { RayTraceSolver } from "RayTraceSolver";

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

    public fillCanvas(pixels: vec3[][]): void {
        let width: number = Number(this.canvas.getAttribute("width"));
        let height: number = Number(this.canvas.getAttribute("height"));
        let imageData: ImageData = this.canvas.getContext('2d').createImageData(width, height);

        for (let i: number = 0; i < height; i++) {
            for (let j: number = 0; j < width; j++) {
                imageData.data[4 * (i * width + j)] = pixels[i][j][0];
                imageData.data[4 * (i * width + j) + 1] = pixels[i][j][1];
                imageData.data[4 * (i * width + j) + 2] = pixels[i][j][2];
                imageData.data[4 * (i * width + j) + 3] = 255;
            }
        }
        this.canvas.getContext('2d').putImageData(imageData, 0, 0);

        let context: CanvasRenderingContext2D = this.canvas.getContext('2d')
        context.fillStyle = 'red';
        context.fillRect(100, 100, 200, 100);
    }
}
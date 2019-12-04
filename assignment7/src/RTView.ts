import { vec3, mat4 } from "gl-matrix";
import { RayTraceSolver } from "./RayTraceSolver";
import { Scenegraph } from "./Scenegraph";
import { VertexPNT } from "./VertexPNT";
import { Stack } from "%COMMON/Stack";

export class RTView {
    private canvas: HTMLCanvasElement;
    private readonly gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext) {
        this.canvas = <HTMLCanvasElement>document.querySelector("#raytraceCanvas");
        if (!this.canvas) {
            console.log("Failed to retrieve the <canvas> element");
            return;
        }
        //button clicks
        let button: HTMLButtonElement = <HTMLButtonElement>document.querySelector("#savebutton");
        button.addEventListener("click", ev => this.saveCanvas());
        this.gl = gl;
    }

    private saveCanvas(): void {
        let link = document.createElement('a');
        link.href = this.canvas.toDataURL('image/png');
        link.download = "result.png";
        link.click();
    }

    public fillCanvas(scenegraph: Scenegraph<VertexPNT>): void {
        let width: number = Number(this.canvas.getAttribute("width"));
        let height: number = Number(this.canvas.getAttribute("height"));
        let imageData: ImageData = this.canvas.getContext('2d').createImageData(width, height);
        let stack: Stack<mat4> = new Stack();
        stack.push(mat4.create()); //-20, -20, 20
        mat4.lookAt(stack.peek(), vec3.fromValues(-20, -20, 20), vec3.fromValues(0,5,0), vec3.fromValues(0, 1, 0));
        let rayTraceSolver: RayTraceSolver = new RayTraceSolver(scenegraph, stack);
        rayTraceSolver.initTextures(this.gl, scenegraph).then(() => {
            let pixels: vec3[][] = rayTraceSolver.rayTrace(width, height, stack);

            for (let i: number = 0; i < height; i++) {
                for (let j: number = 0; j < width; j++) {

                    imageData.data[4 * (i * width + j)] = 255 * pixels[i][j][0];
                    imageData.data[4 * (i * width + j) + 1] = 255 * pixels[i][j][1];
                    imageData.data[4 * (i * width + j) + 2] = 255 * pixels[i][j][2];
                    imageData.data[4 * (i * width + j) + 3] = 255;
                }
            }
            this.canvas.getContext('2d').putImageData(imageData, 0, 0);
        });
    }
}
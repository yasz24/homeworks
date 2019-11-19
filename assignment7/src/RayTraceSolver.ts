import { vec3, mat4, vec4 } from "gl-matrix";
import { Material } from "%COMMON/Material";
import { Stack } from "%COMMON/Stack"
import { Scenegraph } from "Scenegraph";
import { VertexPNT } from "./VertexPNT";

export interface HitRecord {
    time: number,
    intersectionPoint: vec3,
    normal: vec3,
    material: Material
}


export interface Ray {
    startPoint: vec4,
    direction: vec4
}


export class RayTraceSolver {
    private scenegraph:  Scenegraph<VertexPNT>;
    private readonly fov: number = Math.PI / 2;
    
    public constructor(scenegraph: Scenegraph<VertexPNT>) {

    }
    public rayTrace(width: number, height: number, modelview: Stack<mat4>): vec3[][] {
        let pixel: vec3[][] = []
        for (let y: number = 0; y < height; y++) {
            let row: vec3[] = new Array(width);
            pixel.push(row);
        }
        let distToProjPlane: number = 0.5 * height / Math.tan(this.fov/2);

        for (let y: number = 0; y < height; y++) {
            for(let x: number = 0; x < width; x++) {
                let ray: Ray = {
                    startPoint: vec4.fromValues(0, 0, 0, 1),
                    direction: vec4.fromValues(x - (width / 2), y - (height / 2), -distToProjPlane, 0);
                }
                pixel[y][x] = this.rayCast(ray, modelview);
            }
        }

    }

    private rayCast(ray: Ray, modelview: Stack<mat4>): vec3 {
        let hitRecord: HitRecord | undefined = this.scenegraph.rayIntersect(ray, modelview)
        if (hitRecord) {
            let color: vec3 = this.shade(hitRecord);
        }
        return color;
    }
}


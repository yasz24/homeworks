import { vec3, mat4, vec4 } from "gl-matrix";
import { Material } from "%COMMON/Material";
import { Stack } from "%COMMON/Stack"
import { Scenegraph } from "Scenegraph";
import { VertexPNT } from "./VertexPNT";
import { Light } from "%COMMON/Light";

export interface HitRecord {
    time: number,
    intersectionPoint: vec4,
    normal: vec4,
    material: Material
}


export interface Ray {
    startPoint: vec4,
    direction: vec4
}


export class RayTraceSolver {
    private scenegraph:  Scenegraph<VertexPNT>;
    private lights: Light[];
    private readonly fov: number = Math.PI / 2;
    private readonly background: vec3 = vec3.fromValues(0, 0, 0);
    
    public constructor(scenegraph: Scenegraph<VertexPNT>, modelView: Stack<mat4>) {
        this.scenegraph = scenegraph;
        this.lights = this.scenegraph.findLights(modelView);
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
                    direction: vec4.fromValues(x - (width / 2), y - (height / 2), -distToProjPlane, 0)
                }
                pixel[y][x] = this.rayCast(ray, modelview);
            }
        }
        pixel.reverse();
        return pixel;
    }

    private rayCast(ray: Ray, modelview: Stack<mat4>): vec3 {
        let hitRecord: HitRecord | undefined = this.scenegraph.rayIntersect(ray, modelview);
        if (hitRecord) {
            let color: vec3 = this.shade(hitRecord);
            return color;
        }
        return this.background;
    }

    private shade(hitRecord: HitRecord): vec3 {
        let result: vec4 = vec4.fromValues(0, 0, 0, 1);
        let lightVec: vec3;
        let intersectionXYZ: vec3 = vec3.fromValues(hitRecord.intersectionPoint[0], hitRecord.intersectionPoint[1], hitRecord.intersectionPoint[2]);
        for (const light of this.lights) {
            let lightPosnXYZ: vec3= vec3.fromValues(light.getPosition()[0], light.getPosition()[1], light.getPosition()[2]);
            if (light.getPosition()[3] !== 0) {
                lightVec = vec3.normalize(vec3.create(), 
                    vec3.subtract(vec3.create(), lightPosnXYZ, intersectionXYZ));
            } else {
                lightVec = vec3.normalize(vec3.create(),
                                            vec3.negate(vec3.create(), lightPosnXYZ));
            }
            let normalView: vec3 = vec3.normalize(vec3.create(), vec3.fromValues(hitRecord.normal[0], hitRecord.normal[1], hitRecord.normal[2]))
            let nDotL: number = vec3.dot(normalView, lightVec);

            let viewVec: vec3 = vec3.normalize(vec3.create(), vec3.negate(vec3.create(), intersectionXYZ));

            let toReflect: vec3 = vec3.negate(vec3.create(), lightVec);
            let reflectVec: vec3 = vec3.subtract(vec3.create(),toReflect, 
                                            vec3.scale(vec3.create(),
                                                            normalView,
                                                            vec3.dot(normalView, toReflect) * 2.0));
            let rDotV: number = Math.max(vec3.dot(reflectVec, viewVec), 0);
            let ambient: vec3 =  vec3.multiply(vec3.create(), hitRecord.material.getAmbient(), light.getAmbient());
            let diffuse:vec3 = vec3.scale(vec3.create(), vec3.multiply(vec3.create(), hitRecord.material.getDiffuse(), light.getDiffuse()), Math.max(nDotL, 0));
            let specular: vec3;
            if (nDotL > 0) {
                specular = vec3.scale(vec3.create(), vec3.multiply(vec3.create(), hitRecord.material.getSpecular(), light.getSpecular()), Math.pow(rDotV, hitRecord.material.getShininess()));
            } else {
                specular = vec3.fromValues(0, 0, 0);
            }
            let phi: number = vec3.dot(vec3.fromValues(light.getSpotDirection()[0], light.getSpotDirection()[1], light.getSpotDirection()[2]),
                                    toReflect);

            if (phi > Math.cos(light.getSpotCutoff())) {
                let ads: vec3 = vec3.add(vec3.create(), vec3.add(vec3.create(), ambient, diffuse), specular);
                result = vec4.add(result, result, vec4.fromValues(ads[0], ads[1], ads[2], 1));
            }
        }
        return vec3.fromValues(result[0], result[1], result[2]);
    }
}


import { vec3, mat4, vec4, vec2 } from "gl-matrix";
import { Material } from "%COMMON/Material";
import { Stack } from "%COMMON/Stack"
import { Scenegraph } from "Scenegraph";
import { VertexPNT } from "./VertexPNT";
import { Light } from "%COMMON/Light";
import { TextureObject } from "%COMMON/TextureObject";

export interface HitRecord {
    time: number,
    intersectionPoint: vec4,
    normal: vec4,
    material: Material,
    texture: string,
    normTextureCoordinates: vec2
    incoming: boolean
}


export interface Ray {
    startPoint: vec4,
    direction: vec4
}


export class RayTraceSolver {
    private scenegraph:  Scenegraph<VertexPNT>;
    private modelView: Stack<mat4>;
    private lights: Light[];
    private readonly fov: number = Math.PI / 2;
    private readonly background: vec3 = vec3.fromValues(0, 0, 0);
    private readonly FUDGE: number = 0.001;
    private textureMap: Map<String, TextureObject>;
    
    public constructor(scenegraph: Scenegraph<VertexPNT>, modelView: Stack<mat4>) {
        this.scenegraph = scenegraph;
        this.modelView = modelView;
        this.lights = this.scenegraph.findLights(modelView);
    }

    public initTextures(gl: WebGLRenderingContext, scenegraph: Scenegraph<VertexPNT>): Promise<void> {
        return new Promise<void>((resolve) => {
            let scenegraphTextureMap = scenegraph.getTextureMap();
            this.textureMap = new Map<string, TextureObject>();
            let promises: Promise<HTMLImageElement>[] = [];
            for (let keyValue of scenegraphTextureMap) {
                let name: string = keyValue[0];
                let url: string = keyValue[1];
                let textureObject: TextureObject = new TextureObject(gl, name, url);
                promises.push(textureObject.loadImage(url));
                this.textureMap.set(name, textureObject);
            }
            Promise.all(promises).then((images: HTMLImageElement[]) => {
                resolve(undefined);
            });
        });
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
                pixel[y][x] = this.rayCast(ray, modelview, 5);
            }
        }
        pixel.reverse();
        return pixel;
    }

    private rayCast(ray: Ray, modelview: Stack<mat4>, bounce: number): vec3 {
        let hitRecord: HitRecord | undefined = this.scenegraph.rayIntersect(ray, modelview);
        if (hitRecord) {
            let color: vec3 = this.shade(ray, hitRecord, bounce);
            return color;
        }
        return this.background;
    }

    private shade(inRay: Ray, hitRecord: HitRecord, bounce: number): vec3 {
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
            let normalView: vec3 = vec3.normalize(vec3.create(), vec3.fromValues(hitRecord.normal[0], hitRecord.normal[1], hitRecord.normal[2]));
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

            let textureCoord: vec2 = hitRecord.normTextureCoordinates;
            let textureObject: TextureObject = this.textureMap.get(hitRecord.texture);
            let texColor:vec4 = textureObject.getColor(textureCoord[0], textureCoord[1]);
            vec4.scale(texColor, texColor, 1/255);

            let absorb: number = hitRecord.material.getAbsorption();
            let reflect: number = hitRecord.material.getReflection();
            let refract: number = hitRecord.material.getTransparency();
            let absorbComp: vec4 = vec4.fromValues(0, 0, 0, 0);
            let reflectComp: vec4 = vec4.fromValues(0, 0, 0, 0);
            let refractComp: vec4 = vec4.fromValues(0, 0, 0, 0);
            // finding absorb component
            if (hitRecord.material.getAbsorption() > 0) {
                if (phi > Math.cos(light.getSpotCutoff())) {
                    let ads: vec3 = vec3.add(vec3.create(), vec3.add(vec3.create(), ambient, diffuse), specular);
                    //shadows
                    let shadowRayStart: vec4 = hitRecord.intersectionPoint;
                    let shadowVec: vec4 = vec4.subtract(vec4.create(), light.getPosition(), shadowRayStart);
                    shadowRayStart = vec4.add(vec4.create(), shadowRayStart, vec4.scale(vec4.create(), 
                    vec4.normalize(vec4.create(), shadowVec), this.FUDGE));
                    let shadowRay: Ray = {
                        startPoint: shadowRayStart,
                        direction: shadowVec
                    } 
                    let shadowHit: HitRecord | undefined = this.scenegraph.rayIntersect(shadowRay, this.modelView);

                    if (shadowHit && !(shadowHit.time < 1 && shadowHit.time > 0) || !shadowHit) {
                        absorbComp = vec4.fromValues(ads[0], ads[1], ads[2], 1);
                        absorbComp = vec4.multiply(absorbComp, absorbComp, texColor);
                    }
                }
            }
            if (hitRecord.material.getReflection() > 0) {
                if (bounce === 0) {
                    reflectComp = absorbComp;
                } else {
                    let rayStart: vec4 = hitRecord.intersectionPoint;
                    let incomingRay: vec4 = vec4.normalize(vec4.create(), inRay.direction);
                    let normalRay: vec4 = vec4.normalize(vec4.create(), hitRecord.normal);
                    let ndoti: number = vec4.dot(normalRay, incomingRay);
                    let rayDir: vec4 = vec4.subtract(vec4.create(), incomingRay, 
                    vec4.scale(vec4.create(), normalRay, 2 * ndoti));

                    let rayStartFudge: vec4 = vec4.add(vec4.create(), rayStart, vec4.scale(vec4.create(), rayDir, this.FUDGE));
                    
                    let newRay: Ray = {
                        startPoint: rayStartFudge,
                        direction: rayDir
                    }
                    let reflectColor: vec3 = this.rayCast(newRay, this.modelView, bounce - 1);
                    reflectComp = vec4.fromValues(reflectColor[0], reflectColor[1], reflectColor[2], 1);
                }
            }
            // for now does not support objects within objects for transparencies
            // Assume we are always coming from air for now
            if (hitRecord.material.getTransparency() > 0) {

                let rayThroughMaterial: Ray = this.getRefractRay(inRay, hitRecord);
                // assuming that the next hitrecord will be when the ray exits the object
                let leavingHit: HitRecord = this.scenegraph.getRoot().rayIntersect(rayThroughMaterial, this.modelView);                if (leavingHit) {
                    let leavingRay: Ray = this.getRefractRay(rayThroughMaterial, leavingHit);
                    let refractColor: vec3 = this.rayCast(leavingRay, this.modelView, bounce);
                    refractComp = vec4.fromValues(refractColor[0], refractColor[1], refractColor[2], 1);
                }
            }
            result = vec4.add(result, result, vec4.scale(vec4.create(), absorbComp, absorb));
            result = vec4.add(result, result, vec4.scale(vec4.create(), reflectComp, reflect));
            result = vec4.add(result, result, vec4.scale(vec4.create(), refractComp, refract));
            result[3] = 0;
            
        }
        return vec3.fromValues(result[0], result[1], result[2]);
    }

    getRefractRay(inRay: Ray, hit: HitRecord): Ray {
        let incomingRay: vec4 = vec4.normalize(vec4.create(), inRay.direction);
        let normalRay: vec4 = vec4.normalize(vec4.create(), hit.normal);
        
        let nint:number;
        if (hit.incoming) {
            nint = 1/hit.material.getRefractiveIndex();
        } else {
            nint = hit.material.getRefractiveIndex()/1;
            normalRay = vec4.scale(vec4.create(), normalRay, -1);
        }
        let sinThetaI: number = Math.sqrt(1 - Math.pow(vec4.dot(normalRay, vec4.scale(vec4.create(), incomingRay, -1)), 2));
        let cosThetaT: number = Math.sqrt(1 -  Math.pow(nint * sinThetaI,2));
        let inRayDir: vec4 = vec4.subtract(vec4.create(), vec4.scale(vec4.create(), incomingRay, nint), vec4.scale(vec4.create(), normalRay, (nint * (vec4.dot(normalRay, incomingRay)) + cosThetaT)));
        let rayStartPoint: vec4 = vec4.add(vec4.create(), hit.intersectionPoint, vec4.scale(vec4.create(), inRayDir, this.FUDGE));
        let refractRay: Ray = {
            startPoint: rayStartPoint,
            direction: inRayDir
        }
        return refractRay;
    }
}


import { SGNode } from "./SGNode"
import { Scenegraph } from "./Scenegraph";
import { Material } from "%COMMON/Material";
import { Stack } from "%COMMON/Stack";
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { mat4, vec4, vec3, vec2 } from "gl-matrix";
import { IVertexData } from "%COMMON/IVertexData";
import { Light } from "%COMMON/Light";
import { HitRecord, Ray } from "RayTraceSolver";

/**
 * This node represents the leaf of a scene graph. It is the only type of node that has
 * actual geometry to render.
 * @author Amit Shesh
 */

export class LeafNode extends SGNode {

    /**
      * The name of the object instance that this leaf contains. All object instances are stored
      * in the scene graph itself, so that an instance can be reused in several leaves
      */
    protected meshName: string;
    /**
     * The material associated with the object instance at this leaf
     */
    protected material: Material;

    protected textureName: string;

    public constructor(instanceOf: string, graph: Scenegraph<IVertexData>, name: string) {
        super(graph, name);
        this.meshName = instanceOf;
    }



    /*
	 *Set the material of each vertex in this object
	 */
    public setMaterial(mat: Material): void {
        this.material = mat;
    }

    /**
     * Set texture ID of the texture to be used for this leaf
     * @param name
     */
    public setTextureName(name: string): void {
        this.textureName = name;
    }

    /*
     * gets the material
     */
    public getMaterial(): Material {
        return this.material;
    }

    public clone(): SGNode {
        let newclone: SGNode = new LeafNode(this.meshName, this.scenegraph, this.name);
        newclone.setMaterial(this.getMaterial());
        return newclone;
    }


    /**
     * Delegates to the scene graph for rendering. This has two advantages:
     * <ul>
     *     <li>It keeps the leaf light.</li>
     *     <li>It abstracts the actual drawing to the specific implementation of the scene graph renderer</li>
     * </ul>
     * @param context the generic renderer context {@link sgraph.IScenegraphRenderer}
     * @param modelView the stack of modelview matrices
     * @throws IllegalArgumentException
     */
    public draw(context: ScenegraphRenderer, modelView: Stack<mat4>): void {
        if (this.meshName.length > 0) {
            context.drawMesh(this.meshName, this.material, this.textureName, modelView.peek());
        }
    }

    public findLights(modelView: Stack<mat4>): Light[] {
        return this.getTransformedLights(modelView.peek());
    }

    public rayIntersect(ray: Ray, modelView: Stack<mat4>): HitRecord | undefined {
        let rayPos: vec4 = vec4.create();
        vec4.transformMat4(rayPos, ray.startPoint, mat4.invert(mat4.create(), modelView.peek()));
        let rayDir: vec4 = vec4.create();
        vec4.transformMat4(rayDir, ray.direction, mat4.invert(mat4.create(), modelView.peek()));
        let objectRay: Ray = {
            startPoint: rayPos,
            direction: rayDir
        }
        if (objectRay.direction[0] == 0 && objectRay.direction[1] == 0 && objectRay.direction[2] == 0) {
            console.log("zero ray");
        }
        switch (this.meshName) {
            case "box":
                let hitrecord: HitRecord | undefined = this.boxIntersect(objectRay);
                if (hitrecord) {
                    this.transformHitRecord(hitrecord, modelView);
                }
                return hitrecord;
            case "sphere":
                let hitrecord2: HitRecord | undefined = this.sphereIntersect(objectRay);
                if (hitrecord2) {
                    this.transformHitRecord(hitrecord2, modelView);
                }
                return hitrecord2;
            case "cylinder":
                let hitrecord3: HitRecord | undefined = this.cylinderIntersect(objectRay);
                if (hitrecord3) {
                    this.transformHitRecord(hitrecord3, modelView);
                }
                return hitrecord3;
            case "cone":
                let hitrecord4: HitRecord | undefined = this.coneIntersect(objectRay);
                if (hitrecord4) {
                    this.transformHitRecord(hitrecord4, modelView);
                }
                return hitrecord4;
            default:
                return undefined
        }
    }
    
    private transformHitRecord(hitrecord: HitRecord, modelView: Stack<mat4>) {
        hitrecord.intersectionPoint = vec4.transformMat4(hitrecord.intersectionPoint,
            hitrecord.intersectionPoint, modelView.peek());
        hitrecord.normal = vec4.transformMat4(hitrecord.normal,
            hitrecord.normal, mat4.invert(mat4.create(), mat4.transpose(mat4.create(), modelView.peek())));
        hitrecord.normal[3] = 0; //making sure that the homogenous coordinate remains 0
    }


    private boxIntersect(ray: Ray): HitRecord | undefined {
        let startPoint: vec4 = ray.startPoint;
        let direction: vec4 = ray.direction;

        if ((direction[0] == 0 && (startPoint[0] < -0.5 || startPoint[0] > 0.5)) 
        || (direction[1] == 0 && (startPoint[1] < -0.5 || startPoint[1] > 0.5)) 
        || (direction[2] == 0 && (startPoint[2] < -0.5 || startPoint[2] > 0.5))) {
            return undefined;
        }

        let x1: number = direction[0] == 0 ? Number.NEGATIVE_INFINITY : (-0.5 - startPoint[0]) / direction[0];
        let x2: number = direction[0] == 0 ? Number.POSITIVE_INFINITY : (0.5 - startPoint[0]) / direction[0];

        let y1: number = direction[1] == 0 ? Number.NEGATIVE_INFINITY : (-0.5 - startPoint[1]) / direction[1];
        let y2: number = direction[1] == 0 ? Number.POSITIVE_INFINITY : (0.5 - startPoint[1]) / direction[1];

        let z1: number = direction[2] == 0 ? Number.NEGATIVE_INFINITY : (-0.5 - startPoint[2]) / direction[2];
        let z2: number = direction[2] == 0 ? Number.POSITIVE_INFINITY : (0.5 - startPoint[2]) / direction[2];

        let t1: number = Math.max(Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2))
        let t2: number = Math.min(Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2))

        if (t1 < 0 && t2 < 0) {
            return undefined;
        }

        if (t1 <= t2) {
            let intersectionPoint: vec4 = this.rayPosAtTime(ray, t1);
            //vec4.add(vec4.create(), startPoint, vec4.scale(vec4.create(), direction, t1));
            let nx: number = intersectionPoint[0] == 0.5 ? 1 : intersectionPoint[0] == -0.5 ? -1 : 0;
            let ny: number = intersectionPoint[1] == 0.5 ? 1 : intersectionPoint[1] == -0.5 ? -1 : 0;
            let nz: number = intersectionPoint[2] == 0.5 ? 1 : intersectionPoint[2] == -0.5 ? -1 : 0;
            let normal: vec4 = vec4.fromValues(nx, ny, nz, 0);
            let time: number = t1 > 0 ? t1 : t2;
            let incoming: boolean = t1 > 0 ? true : false;
            let hitrecord: HitRecord = {
                time: time,
                intersectionPoint: intersectionPoint,
                material: this.material,
                normal: normal,
                texture: this.textureName,
                normTextureCoordinates: this.getNormalizedBoxTextureCoord(intersectionPoint),
                incoming: incoming
            }
            return hitrecord;
        } else {
            return undefined
        }
    }

    private sphereIntersect(ray: Ray): HitRecord | undefined {
        let startPoint: vec4 = ray.startPoint;
        let direction: vec4 = ray.direction;
        let radius: number = 0.5;
        let A: number = Math.pow(direction[0], 2) + Math.pow(direction[1], 2) +  Math.pow(direction[2], 2);
        let B: number = 2 * direction[0] * startPoint[0] + 2 * direction[1] * startPoint[1] + 2 * direction[2] * startPoint[2];
        let C: number = Math.pow(startPoint[0], 2) + Math.pow(startPoint[1], 2) + Math.pow(startPoint[2], 2) - Math.pow(radius, 2);

        let discriminant: number = Math.pow(B, 2) - (4 * A * C);

        if (discriminant < 0) {
            return undefined;
        }
        else {
            let t1: number = (-B - Math.sqrt(discriminant)) / (2 * A);
            let t2: number = (-B + Math.sqrt(discriminant)) / (2 * A);
            if (t1 < 0 && t2 < 0) {
               return undefined;
            }
            let time: number = t1 > 0 ? t1 : t2;
            let incoming: boolean = t1 > 0 ? true : false;
            let intersectionPoint: vec4 = this.rayPosAtTime(ray, time);
            //vec4.add(vec4.create(), startPoint, vec4.scale(vec4.create(), direction, time));
            let normal: vec4 = vec4.fromValues(intersectionPoint[0], intersectionPoint[1], intersectionPoint[2], 0);

            let hitrecord: HitRecord = {
                time: time,
                intersectionPoint: intersectionPoint,
                material: this.material,
                normal: normal,
                texture: this.textureName,
                normTextureCoordinates: this.getNormalizedSphereTextureCoord(intersectionPoint),
                incoming: incoming
            }
            return hitrecord;
        }
    }

    private cylinderIntersect(ray: Ray): HitRecord | undefined {
        let radius: number = 0.5;
        let height: number = 0.5;

        let topIntersectT: number;
        let bottomIntersectT: number;
        if (ray.direction[1] == 0) {
            if (ray.startPoint[1] > height || ray.startPoint[1] < 0) {
                return undefined;
            }
            topIntersectT = Number.POSITIVE_INFINITY;
            bottomIntersectT = Number.NEGATIVE_INFINITY;
        } else {
            topIntersectT = (height - ray.startPoint[1]) / ray.direction[1];
            bottomIntersectT = (0 - ray.startPoint[1]) / ray.direction[1];
        }

        let A: number = Math.pow(ray.direction[0], 2) + Math.pow(ray.direction[2], 2);
        let B: number = 2 * ray.direction[0] * ray.startPoint[0] + 2 * ray.direction[2] * ray.startPoint[2];
        let C: number =  Math.pow(ray.startPoint[0], 2) + Math.pow(ray.startPoint[2], 2) - Math.pow(radius, 2);

        let discriminant: number = Math.pow(B, 2) - (4 * A * C);

        let ct1: number;
        let ct2: number;
        if (discriminant < 0) {
            return undefined;
        }
        if (A == 0) {
            ct1 = Number.POSITIVE_INFINITY;
            ct2 = Number.NEGATIVE_INFINITY;
        } else {
            ct1 = (-B - Math.sqrt(discriminant)) / (2 * A);
            ct2 = (-B + Math.sqrt(discriminant)) / (2 * A);
        }
        

        let circleT1: number = Math.min(ct1, ct2);
        let circleT2: number = Math.max(ct1, ct2);
        let topBottomT1: number = Math.min(topIntersectT, bottomIntersectT);
        let topBottomT2: number = Math.max(topIntersectT, bottomIntersectT);

        let t1: number = Math.max(circleT1, topBottomT1);
        let t2: number = Math.min(circleT2, topBottomT2);
        if (t1 > t2 || (t1 < 0 && t2 < 0)) {
            return undefined;
        }
        let time: number;
        let incoming: boolean;
        if (t1 >= 0) {
            time = t1;
            incoming = true;
        } else {
            time = t2;
            incoming = false;
        }
        let intersectionPoint: vec4 = this.rayPosAtTime(ray, time);
        //vec4.add(vec4.create(), ray.startPoint, vec4.scale(vec4.create(), ray.direction, time));
        
        let normal: vec4;
        if (intersectionPoint[1] == 0) {
            normal = vec4.fromValues(0, -1, 0, 0);
        } else if (intersectionPoint[1] == height) {
            normal = vec4.fromValues(0, 1, 0, 0);
        } else {
            normal = vec4.fromValues(intersectionPoint[0], 0, intersectionPoint[2], 0);
        }
        let hit: HitRecord = {
            time: time,
            intersectionPoint: intersectionPoint,
            normal: normal,
            material: this.material,
            texture: this.textureName,
            normTextureCoordinates: this.getNormalizedCylinderAndConeTextureCoord(intersectionPoint),
            incoming: incoming
        }
        return hit;
    }

    private coneIntersect(ray: Ray): HitRecord | undefined {
        let bottomRadius: number = 0.5;
        let height: number = 0.5;

        let topIntersectT: number;
        let bottomIntersectT: number;
        if (ray.direction[1] == 0) {
            if (ray.startPoint[1] > height || ray.startPoint[1] < 0) {
                return undefined;
            }
            topIntersectT = Number.POSITIVE_INFINITY;
            bottomIntersectT = Number.NEGATIVE_INFINITY;
        } else {
            topIntersectT = (height - ray.startPoint[1]) / ray.direction[1];
            bottomIntersectT = (0 - ray.startPoint[1]) / ray.direction[1];
        }

        let bottomRadiusOverHeightSquared: number = Math.pow( bottomRadius / height, 2);
        let A: number = Math.pow(ray.direction[0], 2) + Math.pow(ray.direction[2], 2) 
                        - bottomRadiusOverHeightSquared * Math.pow(ray.direction[1], 2);
        let B: number = 2 * ray.direction[0] * ray.startPoint[0] + 2 * ray.direction[2] * ray.startPoint[2] 
                        + 2 * height * bottomRadiusOverHeightSquared * ray.direction[1] - 2 * bottomRadiusOverHeightSquared * ray.direction[1] * ray.startPoint[1];
        let C: number =  Math.pow(ray.startPoint[0], 2) + Math.pow(ray.startPoint[2], 2) 
                        - Math.pow(bottomRadius, 2) + 2 * height * bottomRadiusOverHeightSquared * ray.startPoint[1] 
                        - bottomRadiusOverHeightSquared * Math.pow(ray.startPoint[1], 2);

        let discriminant: number = Math.pow(B, 2) - (4 * A * C);

        let ct1: number;
        let ct2: number;
        if (discriminant < 0) {
            return undefined;
        }
        if (A == 0) {
            ct1 = Number.POSITIVE_INFINITY;
            ct2 = Number.NEGATIVE_INFINITY;
        } else {
            ct1 = (-B - Math.sqrt(discriminant)) / (2 * A);
            ct2 = (-B + Math.sqrt(discriminant)) / (2 * A);
        }
        

        let circleT1: number = Math.min(ct1, ct2);
        let circleT2: number = Math.max(ct1, ct2);
        // check if they are on the top inverse cone
        let circleT1YPos: number = this.rayPosAtTime(ray, circleT1)[1];
        let circleT2YPos: number = this.rayPosAtTime(ray, circleT2)[1];
        if (circleT1YPos > height && circleT2YPos <= height) {
            circleT1 = circleT2;
            circleT2 = Number.MAX_VALUE;
        } else if (circleT1YPos <= height && circleT2YPos > height) {
            circleT2 = circleT1;
            circleT1 = Number.MIN_VALUE;
        } else if (circleT1 == circleT2) {
            // only have to worry about this if the intersection is actually valid
            if (circleT1YPos < height) {
                if (ray.direction[1] > 0) {
                    circleT1 = Number.MIN_VALUE;
                } else if (ray.direction[1] < 0) {
                    circleT2 = Number.MIN_VALUE;
                }
            }
        }
        let topBottomT1: number = Math.min(topIntersectT, bottomIntersectT);
        let topBottomT2: number = Math.max(topIntersectT, bottomIntersectT);

        let t1: number = Math.max(circleT1, topBottomT1);
        let t2: number = Math.min(circleT2, topBottomT2);
        if (t1 > t2 || (t1 < 0 && t2 < 0)) {
            return undefined;
        }
        let time: number;
        let incoming: boolean;
        if (t1 >= 0) {
            time = t1;
            incoming = true;
        } else {
            time = t2;
            incoming = false;
        }
        let intersectionPoint: vec4 = this.rayPosAtTime(ray, time);
        let normal: vec4;
        if (intersectionPoint[1] == 0) {
            normal = vec4.fromValues(0, -1, 0, 0);
        } else if (intersectionPoint[1] == height) {
            normal = vec4.fromValues(0, 1, 0, 0);
        } else {
            let y = Math.pow(bottomRadius, 2) / height;
            normal = vec4.fromValues(intersectionPoint[0], y, intersectionPoint[2], 0);
        }
        let hit: HitRecord = {
            time: time,
            intersectionPoint: intersectionPoint,
            normal: normal,
            material: this.material,
            texture: this.textureName,
            normTextureCoordinates: this.getNormalizedCylinderAndConeTextureCoord(intersectionPoint),
            incoming: incoming
        }
        return hit;
    }//TODO: look at if you're above the thing, maybe it's catching the remnant cone and above max y stuff when the slope of y isn't 0

    private rayPosAtTime(ray: Ray, time: number): vec4 {
        return vec4.add(vec4.create(), ray.startPoint, vec4.scale(vec4.create(), ray.direction, time));
    }
    private getNormalizedCylinderAndConeTextureCoord(intersectionPoint: vec4): vec2 {
        let height: number = 0.5;
        let theta: number = Math.atan2(-intersectionPoint[2], intersectionPoint[0]);
        let textureX: number = (theta + Math.PI) / (2 * Math.PI);
        let textureY: number = intersectionPoint[1] / height;
        return vec2.fromValues(textureX, textureY);
    }
    
    // returns the texture coordinates assuming the texture is 1 x 1
    private getNormalizedBoxTextureCoord(intersectionPoint: vec4): vec2 {
        let xRatio: number = intersectionPoint[0] + 0.5;
        let yRatio: number = intersectionPoint[1] + 0.5;
        let zRatio: number = intersectionPoint[2] + 0.5;
        let squareSideLen: number = 1/4;
        // assuming camera is on positive z axis
        if (intersectionPoint[0] === 0.5) { // right side of cube
            let textureX = 2 * squareSideLen + (1 - yRatio) * squareSideLen;
            let textureY =  squareSideLen + zRatio * squareSideLen;
            return vec2.fromValues(textureX, textureY);
        }
        if (intersectionPoint[0] === -0.5) { // left side of cube
            let textureX = yRatio * squareSideLen;
            let textureY = squareSideLen + zRatio * squareSideLen;
            return vec2.fromValues(textureX, textureY);
        }
        if (intersectionPoint[1] === 0.5) { //top side of cube
            let textureX = squareSideLen + xRatio * squareSideLen;
            let textureY = squareSideLen + zRatio * squareSideLen;
            return vec2.fromValues(textureX, textureY);
        }
        if (intersectionPoint[1] === -0.5) { // bottom side of cube
            let textureX = 3 * squareSideLen + (1 - xRatio) * squareSideLen;
            let textureY = squareSideLen + zRatio * squareSideLen;
            return vec2.fromValues(textureX, textureY);
        }
        if (intersectionPoint[2] === 0.5) { // front face of cube
            let textureX = squareSideLen + xRatio * squareSideLen;
            let textureY = 2 * squareSideLen + (1 - yRatio) * squareSideLen;
            return vec2.fromValues(textureX, textureY);
        }
        if (intersectionPoint[2] === -0.5) {
            let textureX = squareSideLen + xRatio * squareSideLen;
            let textureY = yRatio * squareSideLen;
            return vec2.fromValues(textureX, textureY);
        }
        console.warn("improper box");
    }

    private getNormalizedSphereTextureCoord(intersectionPoint: vec4): vec2 {
        let phi: number = Math.asin(intersectionPoint[1]);
        let theta: number = Math.atan2(-intersectionPoint[2], intersectionPoint[0]);
        let textureX = (theta + Math.PI) / (2 * Math.PI);
        let textureY = (phi + Math.PI / 2) / Math.PI;
        return vec2.fromValues(textureX, textureY);
    }
}
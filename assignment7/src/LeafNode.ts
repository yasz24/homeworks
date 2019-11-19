import { SGNode } from "./SGNode"
import { Scenegraph } from "./Scenegraph";
import { Material } from "%COMMON/Material";
import { Stack } from "%COMMON/Stack";
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { mat4, vec4 } from "gl-matrix";
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
        // // if (acc.length >= 1) {
        // //     console.log(acc);
        // // }
        // // if (this.getTransformedLights(modelView.peek()).length >= 1) {
        // //     console.log(this.getTransformedLights(modelView.peek()));
        // // }
        // let accInLen = acc.length;
        // acc = acc.concat(this.getTransformedLights(modelView.peek()));
        // if (!(acc.length >= accInLen)) {
        //     console.log("problem");
        // }
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
        switch (this.meshName) {
            case "box":
                return this.boxIntersect(objectRay);
            case "sphere":
                return this.sphereIntersect(objectRay);
            default:
                return undefined
        }
    }


    private boxIntersect(ray: Ray): HitRecord | undefined {
        
    }
}
import { mat4, vec3, vec4 } from "gl-matrix"
import { Scenegraph } from "Scenegraph"
import { Stack } from "%COMMON/Stack";
import { ScenegraphRenderer } from "ScenegraphRenderer";
import { Material } from "%COMMON/Material";
import { IVertexData } from "%COMMON/IVertexData";
import { Light } from "%COMMON/Light";
/**
 * This class represents a basic node of a scene graph.
 */
export abstract class SGNode {
    /**
      * The name given to this node
    */
    protected name: string;
    /**
     * The parent of this node. Each node except the root has a parent. The root's parent is null
     */
    protected parent: SGNode;
    /**
     * A reference to the {@link sgraph.IScenegraph} object that this is part of
     */
    protected scenegraph: Scenegraph<IVertexData>;

    protected lights: Light[];

    constructor(graph: Scenegraph<IVertexData>, name: string) {
        this.parent = null;
        this.scenegraph = graph;
        this.setName(name);
        this.lights = [];
    }

    /**
     * By default, this method checks only itself. Nodes that have children should override this
     * method and navigate to children to find the one with the correct name
     * @param name name of node to be searched
     * @return the node whose name this is, null otherwise
     */
    public getNode(name: string): SGNode {
        if (this.name == name) {
            return this;
        }
        return null;
    }

    /**
     * Sets the parent of this node
     * @param parent the node that is to be the parent of this node
     */

    public setParent(parent: SGNode): void {
        this.parent = parent;
    }

    /**
     * Sets the scene graph object whose part this node is and then adds itself
     * to the scenegraph (in case the scene graph ever needs to directly access this node)
     * @param graph a reference to the scenegraph object of which this tree is a part
     */
    public setScenegraph(graph: Scenegraph<IVertexData>): void {
        this.scenegraph = graph;
        graph.addNode(this.name, this);
    }

    /**
     * Sets the name of this node
     * @param name the name of this node
     */
    public setName(name: string): void {
        this.name = name;
    }

    /**
     * Gets the name of this node
     * @return the name of this node
     */
    public getName(): string {
        return this.name;
    }

    public abstract draw(context: ScenegraphRenderer, modelView: Stack<mat4>): void;
    public abstract findLights(modelView: Stack<mat4>): Light[];
    public abstract clone(): SGNode;
    public setTransform(transform: mat4): void {
        throw new Error("Not supported");
    }
    public setAnimationTransform(transform: mat4): void {
        throw new Error("Not supported");
    };

    public setMaterial(mat: Material): void {
        throw new Error("Not supported");
    }

    public getMaterial(): Material {
        throw new Error("Not supported");
    }

    public addLight(light: Light): void {
        this.lights.push(light);
    }

    public getLights(): Light[] {
        return this.lights
    }

    public copyLight(light: Light): Light {
        let newLight: Light = new Light();
        //console.log(light);
        newLight.setAmbient(light.getAmbient());
        newLight.setSpecular(light.getSpecular());
        newLight.setDiffuse(light.getDiffuse());
        newLight.setPosition(vec3.fromValues(light.getPosition()[0], light.getPosition()[1], light.getPosition()[2]));
        newLight.setSpotDirection(vec3.fromValues(light.getSpotDirection()[0], light.getSpotDirection()[1], light.getSpotDirection()[2]));
        newLight.setSpotAngle(light.getSpotCutoff());
        return newLight
    }

    public copyLights() {
        let res: Light[] = [];
        this.lights.forEach((light) => {
            res.push(this.copyLight(light));
        });
        // if (res.length >= 1) {
        //     console.log(res);
        // }
        return res;
    }

    public getTransformedLights(modelView: mat4): Light[] {
        let res: Light[] = this.copyLights();
        res.forEach((light) => {
            let lightPos: vec4 = vec4.create()
            vec4.transformMat4(lightPos, light.getPosition(), modelView)
            light.setPosition(vec3.fromValues(lightPos[0], lightPos[1], lightPos[2]));
        });
        // if (res.length >= 1) {
        //     console.log(res);
        // }
        return res;
    }
}
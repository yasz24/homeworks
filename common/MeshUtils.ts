import * as OBJ from "webgl-obj-loader"
import { vec3 } from "gl-matrix"

/**
 * These classes are used in conjunction with the webgl-obj-loader package, imported above. These classes add extra functionality to the mesh from that package
 */

/**
 * This class represents a decorator for meshes. Classes that extend this one can add additional functionality to meshes
 */
export class DecoratedMesh {
    protected mesh: OBJ.Mesh;

    constructor(m: OBJ.Mesh) {
        this.mesh = m;
    }

    public getMesh(): OBJ.Mesh {
        return this.mesh;
    }
}

/**
 * This decorater class resizes a mesh so that it occupies a cube of side 1 centered at the origin. 
 * This is useful because the scales and positions of different meshes loaded from OBJ files are not standardized, so transforming them is tricky. This class will make them of a "canonical" size.
 */

export class CanonicalMesh extends DecoratedMesh {
    constructor(m: OBJ.Mesh) {
        super(m);
        this.resizeAndCenter();
    }

    private resizeAndCenter(): void {
        if (this.mesh.vertices.length < 3) {
            return;
        }
        //find the center and dimensions of the mesh
        let center: vec3 = vec3.fromValues(this.mesh.vertices[0], this.mesh.vertices[1], this.mesh.vertices[2]);
        let min: vec3 = vec3.fromValues(this.mesh.vertices[0], this.mesh.vertices[1], this.mesh.vertices[2]);
        let max: vec3 = vec3.fromValues(this.mesh.vertices[0], this.mesh.vertices[1], this.mesh.vertices[2]);
        let i: number;
        for (i = 3; i < this.mesh.vertices.length; i += 3) {
            center[0] += this.mesh.vertices[i];
            center[1] += this.mesh.vertices
            [i + 1];
            center[2] += this.mesh.vertices[i + 2];

            let j: number;
            for (j = 0; j < 3; j++) {
                if (this.mesh.vertices[i + j] < min[j]) {
                    min[j] = this.mesh.vertices[i + j];
                }
                if (this.mesh.vertices[i + j] > max[j]) {
                    max[j] = this.mesh.vertices[i + j];
                }
            }
        }

        center[0] /= (this.mesh.vertices.length / 3);
        center[1] /= (this.mesh.vertices.length / 3);
        center[2] /= (this.mesh.vertices.length / 3);
        console.log("Center: " + center[0] + "," + center[1] + "," + center[2]);
        console.log("Min: " + min[0] + "," + min[1] + "," + min[2]);

        console.log("Max: " + max[0] + "," + max[1] + "," + max[2]);
        //move to the center, and scale to bring it within a box of [-1,1] in all three dimensions
        for (i = 0; i < this.mesh.vertices.length; i++) {
            this.mesh.vertices[i] = (this.mesh.vertices[i] - min[i % 3]) / (max[i % 3] - min[i % 3]) - 0.5;
        }
    }
}

import { IVertexData } from "./IVertexData";
import { vec4, vec3, mat4 } from "gl-matrix"

export namespace Mesh {
    export enum FaceType { Triangle, TriangleFan, TriangleStrip, Lines, LineStrip, LineLoop };

    /**
     * This class represents a triangle mesh. It stores vertex positions, normals and texture 
     * coordinates. It also stores the indices of the vertex that make triangles, three at a time.
     */

    export class PolygonMesh<VertexType extends IVertexData> {
        protected vertexData: VertexType[];
        protected indices: number[];
        protected faceType: FaceType; //triangle, triangle fan, etc.


        protected minBounds: vec4;
        protected maxBounds: vec4; //bounding box

        public constructor() {
            this.vertexData = [];
            this.indices = [];
            this.faceType = FaceType.Triangle;
            this.minBounds = vec4.create();
            this.maxBounds = vec4.create();
        }



        public getFaceType(): number {
            return this.faceType;
        }

        public getNumIndices(): number {
            return this.indices.length;
        }

        public getVertexCount(): number {
            return this.vertexData.length;
        }


        public getMinimumBounds(): vec4 {
            return vec4.clone(this.minBounds);
        }

        public getMaximumBounds(): vec4 {
            return vec4.clone(this.maxBounds);
        }


        public getVertexAttributes(): VertexType[] {
            return this.vertexData;
        }

        public getIndices(): number[] {
            return this.indices;
        }


        public setVertexData(vp: VertexType[]): void {
            this.vertexData = vp;
            this.computeBoundingBox();
        }


        public setPrimitives(t: number[], faceType: FaceType): void {
            this.indices = t;
            this.faceType = faceType;
        }

        /**
         * Compute the bounding box of this polygon mesh, if there is position data
         */

        protected computeBoundingBox(): void {
            let j: number;

            if (this.vertexData.length <= 0)
                return;

            if (!this.vertexData[0].hasData("position")) {
                return;
            }

            let positions: vec4[] = [];

            for (let v of this.vertexData) {
                let data: number[] = v.getData("position");
                let pos: vec4 = vec4.fromValues(0, 0, 0, 1);
                for (let i = 0; i < data.length; i++) {
                    pos[i] = data[i];
                }
                positions.push(pos);
            }

            this.minBounds = vec4.clone(positions[0]);
            this.maxBounds = vec4.clone(positions[0]);

            for (j = 0; j < positions.length; j++) {
                let p: vec4 = positions[j];

                for (let i = 0; i < 3; i++) {
                    if (p[i] < this.minBounds[i]) {
                        this.minBounds[i] = p[i];
                    }

                    if (p[i] > this.maxBounds[i]) {
                        this.maxBounds[i] = p[i];
                    }

                }
            }
        }

        /**
         * Compute vertex normals in this polygon mesh using Newell's method, if
         * position data exists
         */

        public computeNormals(): void {
            let i, j, k: number;

            if (this.vertexData.length <= 0)
                return;

            if (!this.vertexData[0].hasData("position")) {
                return;
            }

            if (!this.vertexData[0].hasData("normal"))
                return;

            let positions: vec4[] = [];

            this.vertexData.forEach(v => {
                let data: number[] = v.getData("position");
                let pos: vec4 = vec4.fromValues(0, 0, 0, 1);
                for (let i = 0; i < data.length; i++) {
                    pos[i] = data[i];
                }
                positions.push(pos);
            });

            let normals: vec4[] = [];

            for (let i = 0; i < positions.length; i++) {
                normals.push(vec4.fromValues(0, 0, 0, 0));
            }

            for (let i = 0; i < this.indices.length; i += 3) {
                let norm: vec3 = vec3.fromValues(0, 0, 0);

                //compute the normal of this triangle
                let v: number[] = [0, 0, 0];

                for (let k = 0; k < 3; k++) {
                    v[k] = this.indices[i + k];
                }

                //the newell's method to calculate normal

                for (let k = 0; k < 3; k++) {
                    for (let l = 0; l < 3; l++) {
                        norm[l] +=
                            (positions[v[k]][(l + 1) % 3] - positions[v[(k + 1) % 3]][(l + 1) % 3])
                            * (positions[v[k]][(l + 2) % 3] + positions[v[(k + 1) % 3]][(l + 2) % 3]);
                    }
                }
                vec3.normalize(norm, norm);


                for (k = 0; k < 3; k++) {
                    normals[v[k]] = vec4.add(normals[v[k]], normals[v[k]], vec4.fromValues(norm[0], norm[1], norm[2], 0));
                }
            }

            for (i = 0; i < normals.length; i++) {
                let n: vec3 = vec3.fromValues(normals[i][0], normals[i][1], normals[i][2]);
                vec3.normalize(n, n);
                normals[i] = vec4.fromValues(n[0], n[1], n[2], 0);
            }
            for (i = 0; i < this.vertexData.length; i++) {
                this.vertexData[i].setData("normal", [normals[i][0], normals[i][1], normals[i][2]]);
            }
        }

        /**
         * Convert this mesh to wireframe
         */
        public convertToWireframe(): PolygonMesh<VertexType> {
            let result: PolygonMesh<VertexType> = new PolygonMesh<VertexType>();
            let i: number;
            result.setVertexData(this.vertexData);
            let newIndices: number[] = [];

            switch (this.faceType) {
                case FaceType.Triangle:
                    for (i = 0; i < this.indices.length; i += 3) {
                        newIndices.push(this.indices[i]);
                        newIndices.push(this.indices[i + 1]);

                        newIndices.push(this.indices[i + 1]);
                        newIndices.push(this.indices[i + 2]);

                        newIndices.push(this.indices[i + 2]);
                        newIndices.push(this.indices[i]);
                    }
                    break;
                case FaceType.TriangleFan:
                    for (i = 1; i < this.indices.length - 1; i += 1) {
                        newIndices.push(this.indices[0]);
                        newIndices.push(this.indices[i]);

                        newIndices.push(this.indices[i]);
                        newIndices.push(this.indices[i + 1]);

                        newIndices.push(this.indices[0]);
                        newIndices.push(this.indices[i + 1]);
                    }
                    break;
                case FaceType.TriangleStrip:
                    for (i = 0; i < this.indices.length - 2; i++) {
                        newIndices.push(this.indices[i]);
                        newIndices.push(this.indices[i + 1]);

                        newIndices.push(this.indices[i + 1]);
                        newIndices.push(this.indices[i + 2]);

                        newIndices.push(this.indices[i + 2]);
                        newIndices.push(this.indices[i]);
                    }
                    break;
            }

            result.setPrimitives(newIndices, FaceType.Lines);
            return result;
        }
    }

    /**
     * These classes are used in conjunction with the webgl-obj-loader package, imported above. These classes add extra functionality to the mesh from that package
     */

    /**
     * This class represents a decorator for meshes. Classes that extend this one can add additional functionality to meshes
     */
    export class DecoratedMesh<VertexType extends IVertexData> {
        protected mesh: Mesh.PolygonMesh<VertexType>;

        constructor(m: Mesh.PolygonMesh<VertexType>) {
            this.mesh = m;
        }

        public getMesh(): Mesh.PolygonMesh<VertexType> {
            return this.mesh;
        }
    }

    /**
     * This decorater class resizes a mesh so that it occupies a cube of side 1 centered at the origin. 
     * This is useful because the scales and positions of different meshes loaded from OBJ files are not standardized, so transforming them is tricky. This class will make them of a "canonical" size.
     */

    export class CanonicalMesh<VertexType extends IVertexData> extends DecoratedMesh<VertexType> {
        constructor(m: Mesh.PolygonMesh<VertexType>) {
            super(m);
            this.resizeAndCenter();
        }

        private resizeAndCenter(): void {
            let vertexData: VertexType[] = this.mesh.getVertexAttributes();
            if (this.mesh.getVertexCount() < 3) {
                return;
            }

            //find the center and dimensions of the mesh
            let center: vec3 = vec3.fromValues(0, 0, 0);
            let minimum: vec3 = vec3.fromValues(vertexData[0].getData("position")[0], vertexData[0].getData("position")[1], vertexData[0].getData("position")[2]);
            let maximum: vec3 = vec3.fromValues(minimum[0], minimum[1], minimum[2]);
            let i, j: number;
            let dimension: number = vertexData[0].getData("position").length;

            vertexData.forEach(vertex => {
                let data: number[] = vertex.getData("position");
                for (i = 0; i < data.length; i++) {
                    if (data[i] < minimum[i]) {
                        minimum[i] = data[i];
                    }
                    if (data[i] > maximum[i]) {
                        maximum[i] = data[i];
                    }
                }
            });
            vec3.add(center, minimum, maximum);
            vec3.scale(center, center, 0.5);
            //move to the center, and scale to bring it within a box of [-1,1] in all three dimensions
            let longest: number = Math.max(maximum[0] - minimum[0], maximum[1] - minimum[1], maximum[2] - minimum[2]);
            let transform: mat4 = mat4.create();
            mat4.scale(transform, transform, vec3.fromValues(1 / longest, 1 / longest, 1 / longest));
            mat4.translate(transform, transform, vec3.negate(center, center));
            for (i = 0; i < vertexData.length; i++) {
                let data: number[] = vertexData[i].getData("position");
                let p: vec4 = vec4.fromValues(data[0], data[1], data[2], 1);
                vec4.transformMat4(p, p, transform);
                vertexData[i].setData("position", [p[0], p[1], p[2], p[3]]);
            }
        }
    }
}

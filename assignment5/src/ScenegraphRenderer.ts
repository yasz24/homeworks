import { ShaderLocationsVault } from "%COMMON/ShaderLocationsVault"
import { RenderableMesh } from "%COMMON/RenderableMesh"
import { IVertexData } from "%COMMON/IVertexData";
import { Mesh } from "%COMMON/PolygonMesh"
import * as WebGLUtils from "%COMMON/WebGLUtils"
import { SGNode } from "SGNode";
import { Stack } from "%COMMON/Stack";
import { mat4, vec4 } from "gl-matrix";
import { Material } from "%COMMON/Material";

/**
 * This is a scene graph renderer implementation that works specifically with WebGL.
 * @author Amit Shesh
 */
export class ScenegraphRenderer {
    protected gl: WebGLRenderingContext;
    /**
     * A table of shader locations and variable names
     */
    protected shaderLocations: ShaderLocationsVault;
    /**
     * A table of shader variables -> vertex attribute names in each mesh
     */
    protected shaderVarsToVertexAttribs: Map<string, string>;

    /**
     * 
     * A map to store all the textures
     */
    protected textures: Map<string, WebGLTexture>;
    /**
     * A table of renderers for individual meshes
     */
    protected meshRenderers: Map<String, RenderableMesh<IVertexData>>;


    public constructor(gl: WebGLRenderingContext, shaderLocations: ShaderLocationsVault, shaderVarsToAttribs: Map<string, string>) {
        this.gl = gl;
        this.shaderVarsToVertexAttribs = shaderVarsToAttribs;
        this.meshRenderers = new Map<String, RenderableMesh<IVertexData>>();
        this.shaderLocations = shaderLocations;
    }


    /**
     * Add a mesh to be drawn later.
     * The rendering context should be set before calling this function, as this function needs it
     * This function creates a new
     * {@link RenderableMesh} object for this mesh
     * @param name the name by which this mesh is referred to by the scene graph
     * @param mesh the {@link PolygonMesh} object that represents this mesh
     * @throws Exception
     */
    public addMesh<K extends IVertexData>(meshName: string, mesh: Mesh.PolygonMesh<K>): void {
        if (meshName in this.meshRenderers)
            return;

        //verify that the mesh has all the vertex attributes as specified in the map
        if (mesh.getVertexCount() <= 0)
            return;
        let vertexData: K = mesh.getVertexAttributes()[0];
        for (let [s, a] of this.shaderVarsToVertexAttribs) {
            if (!vertexData.hasData(a))
                throw new Error("Mesh does not have vertex attribute " + a);
        }
        let renderableMesh: RenderableMesh<K> = new RenderableMesh<K>(this.gl, name);

        renderableMesh.initMeshForRendering(this.shaderVarsToVertexAttribs, mesh);

        this.meshRenderers.set(meshName, renderableMesh);
    }

    public addTexture(name: string, path: string): void {
        let image: WebGLTexture;
        let imageFormat: string = path.substring(path.indexOf('.') + 1);
        image = WebGLUtils.loadTexture(this.gl, path);

        this.textures.set(name, image);
    }

    /**
     * Begin rendering of the scene graph from the root
     * @param root
     * @param modelView
     */
    public draw(root: SGNode, modelView: Stack<mat4>): void {
        root.draw(this, modelView);
    }

    public dispose(): void {
        for (let mesh of this.meshRenderers.values()) {
            mesh.cleanup();
        }
    }

    /**
     * Draws a specific mesh.
     * If the mesh has been added to this renderer, it delegates to its correspond mesh renderer
     * This function first passes the material to the shader. Currently it uses the shader variable
     * "vColor" and passes it the ambient part of the material. When lighting is enabled, this 
     * method must be overriden to set the ambient, diffuse, specular, shininess etc. values to the 
     * shader
     * @param name
     * @param material
     * @param transformation
     */
    public drawMesh(meshName: string, material: Material, textureName: string, transformation: mat4) {
        //console.log("Mesh name: " + meshName);
        if (this.meshRenderers.has(meshName)) {
            //get the color

            let loc: WebGLUniformLocation = this.shaderLocations.getUniformLocation("vColor");
            //set the color for all vertices to be drawn for this object
            let color: vec4 = vec4.fromValues(material.getAmbient()[0], material.getAmbient()[1], material.getAmbient()[2], 1);
            this.gl.uniform4fv(loc, color);

            loc = this.shaderLocations.getUniformLocation("modelview");
            this.gl.uniformMatrix4fv(loc, false, transformation);

            this.meshRenderers.get(meshName).draw(this.shaderLocations);
        }
    }
}
import { ShaderLocationsVault } from "%COMMON/ShaderLocationsVault"
import { RenderableMesh } from "%COMMON/RenderableMesh"
import { IVertexData } from "%COMMON/IVertexData";
import { Mesh } from "%COMMON/PolygonMesh"
import * as WebGLUtils from "%COMMON/WebGLUtils"
import { SGNode } from "SGNode";
import { Stack } from "%COMMON/Stack";
import { mat4, vec4 } from "gl-matrix";
import { Material } from "%COMMON/Material";
import { TextureObject } from "%COMMON/TextureObject" 

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
    protected textures: Map<string, TextureObject>;
    /**
     * A table of renderers for individual meshes
     */
    protected meshRenderers: Map<String, RenderableMesh<IVertexData>>;


    public constructor(gl: WebGLRenderingContext, shaderLocations: ShaderLocationsVault, shaderVarsToAttribs: Map<string, string>) {
        this.gl = gl;
        this.shaderVarsToVertexAttribs = shaderVarsToAttribs;
        this.meshRenderers = new Map<String, RenderableMesh<IVertexData>>();
        this.shaderLocations = shaderLocations;
        this.textures = new Map<string, TextureObject>();
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

    public addTexture(name: string, path: string): Promise<HTMLImageElement> {
        let texObj: TextureObject = new TextureObject(this.gl, name, path);
        this.textures[name] = texObj;
        return texObj.loadImage(path);
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
        if (this.meshRenderers.has(meshName)) {
            // this.gl.enable(this.gl.TEXTURE_2D);
            //deal with texture 0
            this.gl.activeTexture(this.gl.TEXTURE0);
            //that is what we pass to the shader
            this.gl.uniform1i(this.shaderLocations.getUniformLocation("image"), 0);

            this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("texturematrix"), false, mat4.create());


            //send material to the shader
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation("material.ambient"), material.getAmbient());
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation("material.diffuse"), material.getDiffuse());
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation("material.specular"), material.getSpecular());
            this.gl.uniform1f(this.shaderLocations.getUniformLocation("material.shininess"), material.getShininess());

            let loc: WebGLUniformLocation = this.shaderLocations.getUniformLocation("modelview");
            this.gl.uniformMatrix4fv(loc, false, transformation);

            //the normal matrix = inverse transpose of modelview
            let normalMatrix: mat4 = mat4.clone(transformation);
            mat4.transpose(normalMatrix, normalMatrix);
            mat4.invert(normalMatrix, normalMatrix);

            this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("normalmatrix"), false, normalMatrix);
            
            //bind the appropriate texture
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[textureName].getTextureID());

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

            // Prevents s-coordinate wrapping (repeating).
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            // Prevents t-coordinate wrapping (repeating).
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

            //send the texture matrix
            this.meshRenderers.get(meshName).draw(this.shaderLocations);
        }
    }
}
/**
 * This class stores all the shader variables that are used by a shader program. This makes it 
 * possible to look up shader locations without having to repeatedly use webgl functions
 */
export class ShaderLocationsVault {
    private attribs: Map<string, number>;
    private uniforms: Map<string, WebGLUniformLocation>;

    public constructor(gl: WebGLRenderingContext, program: WebGLProgram) {
        this.attribs = new Map<string, number>();
        this.uniforms = new Map<string, WebGLUniformLocation>();
        this.getAllShaderVariables(gl, program);
    }

    private getAllShaderVariables(gl: WebGLRenderingContext, program: WebGLProgram): void {
        let numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i: number = 0; i < numUniforms; i++) {
            let uniformInfo: WebGLActiveInfo = gl.getActiveUniform(program, i);
            let location: WebGLUniformLocation = gl.getUniformLocation(program, uniformInfo.name);
            this.addUniformLocation(uniformInfo.name, location);
        }

        let numAttribs: number = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i: number = 0; i < numAttribs; i++) {
            let activeInfo: WebGLActiveInfo = gl.getActiveAttrib(program, i);
            let location: number = gl.getAttribLocation(program, activeInfo.name);
            this.addAttribLocation(activeInfo.name, location);
        }
    }

    /**
     * Add a new shader variable and location
     */
    private addAttribLocation(varName: string, location: number) {
        this.attribs.set(varName, location);
    }

    private addUniformLocation(varName: string, location: WebGLUniformLocation) {
        this.uniforms.set(varName, location);
    }

    /**
     * Return the location of an attrib, else return -1
     *
     * @param varName the shader variable name whose location is being sought
     * @return the location if found, else -1
     */
    public getAttribLocation(varName: string): number {
        if (this.attribs.has(varName)) {
            return this.attribs.get(varName);
        }
        return -1;
    }

    /**
     * Return the location of an attrib, else return -1
     *
     * @param varName the shader variable name whose location is being sought
     * @return the location if found, else -1
     */
    public getUniformLocation(varName: string): WebGLUniformLocation {
        if (this.uniforms.has(varName)) {
            return this.uniforms.get(varName);
        }
        return -1;
    }


}

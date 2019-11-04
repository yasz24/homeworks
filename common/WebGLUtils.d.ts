/**
 * Utilities useful to set up WebGL context. This code has been heavily borrowed from the code that accompanies "WebGL Programming Guide: Interactive 3D Graphics Programming with WebGL" by Matsuda and Lea
 */
/**
 * This function imports in an image using HTML's Image class, so that it can be loaded and used as an WebGL texture
 * @param gl the rendering context used to create the texture
 * @param textureURL the URL of the image
 * @return the texture ID of the resulting texture that can be used for texture mapping
 */
export declare function loadTexture(gl: WebGLRenderingContext, textureURL: string): WebGLTexture;
/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @return {WebGLRenderingContext} The created context.
 */
export declare function setupWebGL(canvas: HTMLCanvasElement, attribs: WebGLContextAttributes): WebGLRenderingContext;
/**
   * A helper function to create the shader program, given the shader sources.
   * @param gl the WebGLRenderingContext that can be used to call WebGL functions
   * @param vShaderSource the source of the vertex shader, as a string
   * @param fShaderSource the source of the fragment shader, as a string
   * @return the shader program object, as a WebGLProgram object
   */
export declare function createShaderProgram(gl: WebGLRenderingContext, vShaderSource: string, fShaderSource: string): WebGLProgram;
/**
 * A helper function to create a new shader program, given its source.
 * @param gl the WebGLRenderingContext that can be used to call WebGL functions
 * @param source the source of the shader, as a string
 * @param shaderType the type of the shader (ehter VERTEX_SHADER or FRAGMENT_SHADER)
 * @return the shader object, as a WebGLShader
 */
export declare function createShader(gl: WebGLRenderingContext, source: string, shaderType: number): WebGLShader;
/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {WebGLRenderingContext} The created context.
 */
export declare function create3DContext(canvas: HTMLCanvasElement, attribs: WebGLContextAttributes): WebGLRenderingContext;
/**
 * Creates the HTML for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
export declare function createErrorHTML(msg: string): string;
//# sourceMappingURL=WebGLUtils.d.ts.map
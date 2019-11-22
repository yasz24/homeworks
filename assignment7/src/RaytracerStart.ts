import { View } from "./View"
import * as WebGLUtils from "%COMMON/WebGLUtils"
import { RTView } from "./RTView";

/**
 * This is the main function of our web application. This function is called at the end of this file. In the HTML file, this script is loaded in the head so that this function is run.
 */
function main(): void {
    console.log("Here");
    //retrieve <canvas> element
    var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("#glCanvas");
    if (!canvas) {
        console.log("Failed to retrieve the <canvas> element");
        return;
    }

    //get the rendering context for webgl
    let gl: WebGLRenderingContext = WebGLUtils.setupWebGL(canvas, { 'antialias': false, 'alpha': false, 'depth': false, 'stencil': false });

    // Only continue if WebGL is available and working
    if (gl == null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }



    //create the View. The View will encapsulate all our meaningful webgl code
    let view: View = new View(gl);

    let vShaderSource: string;
    let fShaderSource: string;

    //get the vertex and fragment shader code as a string
    vShaderSource = getVShader();
    fShaderSource = getFShader();


    //initialize the view, and pass the shader sources to the view
    view.initShaders(getPhongVShaderV2(), getPhongFShaderV2(5));
    view.initScenegraph();
    view.initPlaneAttribs();
    console.log("about to call draw")
    //draw the view. You must call draw *each time* you would like to draw the screen (i.e. there is no auto refresh)
    view.draw();

   

}

function init(gl: WebGLRenderingContext) {

}

function draw(gl: WebGLRenderingContext) {

}

function getVShader(): string {

    return `attribute vec4 vPosition;
    uniform vec4 vColor;
    uniform mat4 proj;
    varying vec4 outColor;
    
    void main()
    {
        gl_Position = proj * vPosition;
        outColor = vColor;
    }
    `;
}

function getFShader(): string {
    return `precision mediump float;
    varying vec4 outColor;

    void main()
    {
        gl_FragColor = outColor;
    }
    `;
}

function getPhongVShaderV2(): string {
    return `
    attribute vec4 vPosition;
    attribute vec4 vNormal;
    attribute vec2 vTexCoord;
    
    uniform mat4 projection;
    uniform mat4 modelview;
    uniform mat4 normalmatrix;
    uniform mat4 texturematrix;
    varying vec3 fNormal;
    varying vec4 fPosition;
    varying vec4 fTexCoord;
    
    void main()
    {
        vec3 lightVec,viewVec,reflectVec;
        vec3 normalView;
        vec3 ambient,diffuse,specular;
    
        fPosition = modelview * vPosition;
        gl_Position = projection * fPosition;
    
    
        vec4 tNormal = normalmatrix * vNormal;
        fNormal = normalize(tNormal.xyz);
    
        fTexCoord = texturematrix * vec4(vTexCoord.s,vTexCoord.t,0,1);
    
    }
    
`;
}

function getPhongFShaderV2(numLights: number): string {
    return `precision mediump float;

    struct MaterialProperties
    {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        float shininess;
    };
    
    struct LightProperties
    {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        vec4 position;
        vec4 spotDirection;
        float spotCutoff;
    };
    
    
    varying vec3 fNormal;
    varying vec4 fPosition;
    varying vec4 fTexCoord;
    
    
    uniform MaterialProperties material;
    uniform LightProperties light[`+ numLights + `];
    
    /* texture */
    uniform sampler2D image;
    
    void main()
    {
        vec3 lightVec,viewVec,reflectVec;
        vec3 normalView;
        vec3 ambient,diffuse,specular;
        float nDotL,rDotV;
        vec4 result;
    
    
        result = vec4(0,0,0,1);
    `
        + `for (int i=0;i<` + numLights + `;i++)
        {
            if (light[i].position.w!=0.0)
                lightVec = normalize(light[i].position.xyz - fPosition.xyz);
            else
                lightVec = normalize(-light[i].position.xyz);
    
            vec3 tNormal = fNormal;
            normalView = normalize(tNormal.xyz);
            nDotL = dot(normalView,lightVec);
    
            viewVec = -fPosition.xyz;
            viewVec = normalize(viewVec);
    
            reflectVec = reflect(-lightVec,normalView);
            reflectVec = normalize(reflectVec);
    
            rDotV = max(dot(reflectVec,viewVec),0.0);
    
            ambient = material.ambient * light[i].ambient;
            diffuse = material.diffuse * light[i].diffuse * max(nDotL,0.0);
            if (nDotL>0.0)
                specular = material.specular * light[i].specular * pow(rDotV,material.shininess);
            else
                specular = vec3(0,0,0);
            
            float phi = dot(light[i].spotDirection.xyz, -lightVec);
            if (phi > cos(light[i].spotCutoff)) 
                result = result + vec4(ambient+diffuse+specular,1.0);    
        }
        result = result * texture2D(image,fTexCoord.st);
       // result = vec4(0.5*(fTexCoord.st+vec2(1,1)),0.0,1.0);
        gl_FragColor = result;
    }
    
`;
}


main();
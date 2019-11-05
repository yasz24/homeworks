import { vec4, mat4, vec3, glMatrix } from "gl-matrix";
import * as WebGLUtils from "%COMMON/WebGLUtils";
import { Features } from "./Controller";
import { Stack } from "%COMMON/Stack"
import { Scenegraph } from "./Scenegraph";
import { VertexPNT, VertexPNTProducer } from "./VertexPNT";
import { ShaderLocationsVault } from "%COMMON/ShaderLocationsVault";
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { Mesh } from "%COMMON/PolygonMesh";
import { ObjImporter } from "%COMMON/ObjImporter"
import { ScenegraphJSONImporter } from "./ScenegraphJSONImporter"
import { LeafNode } from "./LeafNode";
import { TransformNode } from "./TransformNode";
import { SGNode } from "SGNode";
import { Material } from "%COMMON/Material";
import { GroupNode } from "./GroupNode";
import { PlaneAttributesImporter, PlaneAttributes } from "./planeAttribsParse";


enum ViewType {
    Front,
    BirdsEye,
    TurnTable,
    CockPit
}


/**
 * This class encapsulates the "view", where all of our WebGL code resides. This class, for now, also stores all the relevant data that is used to draw. This can be replaced with a more formal Model-View-Controller architecture with a bigger application.
 */


export class View {
    //the webgl rendering context. All WebGL functions will be called on this object
    private gl: WebGLRenderingContext;
    //an object that represents a WebGL shader
    private shaderProgram: WebGLProgram;

    //a projection matrix, that encapsulates how what we draw corresponds to what is seen
    private proj: mat4;

    //a modelview matrix, that encapsulates all the transformations applied to our object
    private modelview: Stack<mat4>;

    private scenegraph: Scenegraph<VertexPNT>;
    private shaderLocations: ShaderLocationsVault;

    private time: number;

    private radius: number;

    private viewType: ViewType;
    private planeAttribs: PlaneAttributes; 
    private numPlanePositions: number;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.time = 0;
        this.modelview = new Stack<mat4>();
        this.scenegraph = null;
        //set the clear color
        this.gl.clearColor(0.9, 0.9, 0.7, 1);


        //Our quad is in the range (-100,100) in X and Y, in the "virtual world" that we are drawing. We must specify what part of this virtual world must be drawn. We do this via a projection matrix, set up as below. In this case, we are going to render the part of the virtual world that is inside a square from (-200,-200) to (200,200). Since we are drawing only 2D, the last two arguments are not useful. The default Z-value chosen is 0, which means we only specify the last two numbers such that 0 is within their range (in this case we have specified them as (-100,100))
        //this.proj = mat4.ortho(mat4.create(), -100, 100, -100, 100, 0.1, 10000);
        this.proj = mat4.perspective(mat4.create(), Math.PI / 2, 1, 0.1, 1000);

        //We must also specify "where" the above part of the virtual world will be shown on the actual canvas on screen. This part of the screen where the above drawing gets pasted is called the "viewport", which we set here. The origin of the viewport is left,bottom. In this case we want it to span the entire canvas, so we start at (0,0) with a width and height of 400 each (matching the dimensions of the canvas specified in HTML)
        this.gl.viewport(0, 0, 400, 400);
        this.radius = 100;
        this.viewType = ViewType.Front;
        let self = this;
        document.addEventListener("keydown", function(event){
            switch (event.key) {
                case 't':
                    self.viewType =  ViewType.TurnTable
                    break;
                case 'f':
                    self.viewType =  ViewType.Front
                    break;
                case 'o':
                    self.viewType =  ViewType.BirdsEye
                    break;
                case 'a':
                    self.viewType =  ViewType.CockPit
                    break;
                default:
                    break;
                
            }
        } );
    }



    public initShaders(vShaderSource: string, fShaderSource: string) {
        //create and set up the shader
        this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);
        //enable the current program
        this.gl.useProgram(this.shaderProgram);

        this.shaderLocations = new ShaderLocationsVault(this.gl, this.shaderProgram);

    }

    public initScenegraph(): void {

        //make scene graph programmatically
        /*  let meshURLs: Map<string, string> = new Map<string, string>();
          meshURLs.set("box", "models/box.obj");
          meshURLs.set("aeroplane", "models/aeroplane.obj");
          ObjImporter.batchDownloadMesh(meshURLs, new VertexPNTProducer(), (meshMap: Map<string, Mesh.PolygonMesh<VertexPNT>>) => {
                  this.scenegraph = new Scenegraph<VertexPNT>();
                  this.scenegraph.addPolygonMesh("box", meshMap.get("box"));
                  this.scenegraph.addPolygonMesh("aeroplane", meshMap.get("aeroplane"));
                  let groupNode: GroupNode = new GroupNode(this.scenegraph, "root");
                  let transformNode: TransformNode = new TransformNode(this.scenegraph, "box-transform");
                  let transform: mat4 = mat4.create();
                  mat4.scale(transform, transform, vec3.fromValues(50, 50, 50));
                  transformNode.setTransform(transform);
                  let child: SGNode = new LeafNode("box", this.scenegraph, "boxnode");
                  let mat: Material = new Material();
                  mat.setAmbient(vec3.fromValues(1, 0, 0));
                  child.setMaterial(mat);
                  transformNode.addChild(child);
                  groupNode.addChild(transformNode);
      
                  transformNode = new TransformNode(this.scenegraph, "aeroplane-transform");
                  transform = mat4.create();
                  mat4.scale(transform, transform, vec3.fromValues(30, 30, 30));
                  mat4.rotate(transform, transform, glMatrix.toRadian(90), vec3.fromValues(1, 0, 0));
                  mat4.rotate(transform, transform, glMatrix.toRadian(180), vec3.fromValues(0, 1, 0));
                  transformNode.setTransform(transform);
                  child = new LeafNode("aeroplane", this.scenegraph, "aeroplane-node");
                  mat = new Material();
                  mat.setAmbient(vec3.fromValues(1, 1, 0));
                  child.setMaterial(mat);
                  transformNode.addChild(child);
                  groupNode.addChild(transformNode);
      
      
      
                  this.scenegraph.makeScenegraph(groupNode);
                  
  
              this.scenegraph = ScenegraphJSONImporter.importJSON()
              //set it up
  
              let shaderVarsToVertexAttribs: Map<string, string> = new Map<string, string>();
              shaderVarsToVertexAttribs.set("vPosition", "position");
              let renderer: ScenegraphRenderer = new ScenegraphRenderer(this.gl, this.shaderLocations, shaderVarsToVertexAttribs);
  
              this.scenegraph.setRenderer(renderer);
          }); */

        ScenegraphJSONImporter.importJSON(new VertexPNTProducer(), this.json2())
            .then((s: Scenegraph<VertexPNT>) => {
                let shaderVarsToVertexAttribs: Map<string, string> = new Map<string, string>();
                shaderVarsToVertexAttribs.set("vPosition", "position");
                let renderer: ScenegraphRenderer = new ScenegraphRenderer(this.gl, this.shaderLocations, shaderVarsToVertexAttribs);
                this.scenegraph = s;
                this.scenegraph.setRenderer(renderer);
            });
        //set it up

    }

    public initPlaneAttribs (): void {
        PlaneAttributesImporter.downloadPlaneAttributes('models/camerapath.txt').then((attribs: PlaneAttributes) => {
            this.planeAttribs = attribs
            //console.log(this.planeAttribs);
            this.numPlanePositions = attribs.getNumPositions();
        });
    }

    //a JSON representation of a jack-in-the-box
    private json2(): string {
        return `
        {
            "instances": [
                {
                    "name":"sphere",
                    "path":"models/sphere.obj"
                },
                {
                    "name":"box",
                    "path":"models/box.obj"
                },
                {
                    "name":"cylinder",
                    "path":"models/cylinder.obj"
                },
                {
                    "name":"cone",
                    "path":"models/cone.obj"
                },
                {
                    "name":"plane",
                    "path":"models/aeroplane.obj"
                }
            ],
            "root":
            {
                "type":"group",
                "lights": [
                    {
                      "ambient": [
                        0.4,
                        0.4,
                        0.4
                      ],
                      "diffuse": [
                        0.4,
                        0.4,
                        0.4
                      ],
                      "specular": [
                        0.4,
                        0.4,
                        0.4
                      ],
                      "position": [
                        0.0,
                        100.0,
                        100.0,
                        1.0
                      ],
                      "spotdirection": [
                        0.0,
                        0.0,
                        0.0,
                        0.0
                      ],
                      "spotcutoff": 180.0
                    }
                  ],
                "children":[${this.drawObject1()}, ${this.drawObject2()}, ${this.drawObject3()}, 
                    ${this.drawObject4()}, ${this.drawObject5()}, ${this.drawObject6()}, 
                    ${this.drawObject7()}, 
                    ${this.drawObject8()},
                    ${this.drawObject9()},
                    ${this.drawObject10()},
                    ${this.drawObject11()},
                    ${this.drawObject12()},
                    ${this.drawObject13()},
                    ${this.drawObject14()},
                    ${this.drawObject15()},
                    ${this.drawObject16()},
                    ${this.drawObject17()},
                    ${this.drawObject18()},
                    ${this.drawObject19()},
                    ${this.drawObject20()},
                    ${this.drawObject21()},
                    ${this.drawObject22()},
                    ${this.drawObject23()},
                    ${this.drawObject24()},
                    ${this.drawPlane()}]

            }
        }
        `;
        

    }

    private drawPlane(): string {
        let scale: number[] = [3, 3, 3]
        let color: number[] = [0, 1, 0]
        return `
            {
                "type":"transform",
                "name":"aeroplane",
                "transform":[
                    {"translate":[0,100,-27.5]},
                    {"rotate":[90,1,0,0]}
                ],
                "child": ${this.objectJson("plane",scale, color, 4)}
            }
        `
    }

    private drawObject1(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj1",
                "transform":[
                    {"translate":[5,0,-5]}
                ],
                "child": ${this.drawObject1Type(1)}
            }
        `
    }

    private drawObject2(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj2",
                "transform":[
                    {"translate":[20,0,-5]}
                ],
                "child": ${this.drawObject1Type(2)}
            }
        `
    }

    private drawObject3(): string {
        let scale: number[] = [15, 20, -35]
        let color: number[] = [153 / 255, 217 / 255, 234 / 255]
        return `
            {
                "type":"transform",
                "name":"place-obj3",
                "transform":[
                    {"translate":[12.5,0,-27.5]}
                ],
                "child": ${this.objectJson("box",scale, color, 3)}
            }
        ` 
    }

    private drawObject4(): string {
        let scale: number[] = [20, 20, -35]
        let color: number[] = [0.5, 0, 0.5]
        return `
            {
                "type":"transform",
                "name":"place-obj4",
                "transform":[
                    {"translate":[30,0,-27.5]}
                ],
                "child": ${this.objectJson("box",scale, color, 4)}
            }
        ` 
    }

    private drawObject5(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj5",
                "transform":[
                    {"translate":[12.5, 0, -57.5]}
                ],
                "child": ${this.object5()}
            }
        ` 
    }

    private drawObject6(): string {
        let scale: number[] = [50, 20, -10]
        let color: number[] = [1, 1, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj6",
                "transform":[
                    {"translate":[50,0,-50]}
                ],
                "child": ${this.objectJson("box",scale, color, 6)}
            }
        ` 
    }

    private drawObject7(): string {
        let scale: number[] = [15, 20, -20]
        let color: number[] = [1, 0, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj7",
                "transform":[
                    {"translate":[47.5,0,-35]}
                ],
                "child": ${this.objectJson("box",scale, color, 7)}
            }
        ` 
    }

    private drawObject8(): string {
        let boxScale: number[] = [15,50, -15]
        let boxColor: number[] = [0.5, 0.5, 0.5]
        let cylinderScale: number[] = [15, 10, -15]
        let cylinderColor: number[] = [1, 1, 1]
        let coneScale: number[] = [15, 10, -15]
        let coneColor: number[] = [170 / 255, 130 / 255, 51 / 255]
        return `
            {
                "type":"transform",
                "name":"place-obj8",
                "transform":[
                    {"translate":[47.5,0,-17.5]}
                ],
                "child": ${this.boxPlusMinaret(boxScale, boxColor, cylinderScale, cylinderColor, coneScale, coneColor, 8)}
            }
        `
    }

    private drawObject9(): string {
        let scale: number[] = [15, 20, -10]
        let color: number[] = [1, 1, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj9",
                "transform":[
                    {"translate":[32.5,0,-5]}
                ],
                "child": ${this.objectJson("box",scale, color, 9)}
            }
        ` 
    }

    private drawObject10(): string {
        let scale: number[] = [10, 20, -35]
        let color: number[] = [153 / 255, 217 / 255, 234 / 255]
        return `
            {
                "type":"transform",
                "name":"place-obj10",
                "transform":[
                    {"translate":[60,0,-27.5]}
                ],
                "child": ${this.objectJson("box",scale, color, 10)}
            }
        ` 
    }
    
    private drawObject11(): string {
        let scale: number[] = [10, 20, -15]
        let color: number[] = [1, 0, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj11",
                "transform":[
                    {"translate":[70,0,-27.5]}
                ],
                "child": ${this.objectJson("box",scale, color, 11)}
            }
        ` 
    }

    private drawObject12(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj12",
                "transform":[
                    {"translate":[70,0,-40]}
                ],
                "child": ${this.drawObject1Type(12)}
            }
        `
    }

    private drawObject13(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj13",
                "transform":[
                    {"translate":[70,0,-15]}
                ],
                "child": ${this.drawObject1Type(13)}
            }
        `
    }

    private drawObject14(): string {
        let scale: number[] = [10, 20, -35]
        let color: number[] = [153 / 255, 217 / 255, 234 / 255]
        return `
            {
                "type":"transform",
                "name":"place-obj14",
                "transform":[
                    {"translate":[80,0,-27.5]}
                ],
                "child": ${this.objectJson("box",scale, color, 14)}
            }
        ` 
    }

    private drawObject15(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj15",
                "transform":[
                    {"translate":[80,0,-50]}
                ],
                "child": ${this.drawObject1Type(15)}
            }
        `
    }

    private drawObject16(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj16",
                "transform":[
                    {"translate":[80,0,-5]}
                ],
                "child": ${this.drawObject1Type(16)}
            }
        `
    }

    private drawObject17(): string {
        let scale: number[] = [36, 20, -10]
        let color: number[] = [1, 0, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj17",
                "transform":[
                    {"translate":[103,0,-27]}
                ],
                "child": ${this.objectJson("box",scale, color, 17)}
            }
        ` 
    }

    private drawObject18(): string {
        let scale: number[] = [20, 20, -10]
        let color: number[] = [1, 0, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj18",
                "transform":[
                    {"translate":[95,0,-50]}
                ],
                "child": ${this.objectJson("box",scale, color, 18)}
            }
        ` 
    }

    private drawObject19(): string {
        let cylinderScale: number[] = [25, 40, -25]
        let cylinderColor: number[] = [1, 1, 1]
        let coneScale: number[] = [25, 50, -25]
        let coneColor: number[] = [170 / 255, 130 / 255, 51 / 255]
        return `
            {
                "type":"transform",
                "name":"place-obj19",
                "transform":[
                    {"translate":[113,0,-50]}
                ],
                "child": ${this.drawMinaret(cylinderScale, cylinderColor, coneScale, coneColor, 19)}
            }
        ` 
    }

    private drawObject20(): string {
        let scale: number[] = [20, 20, -10]
        let color: number[] = [1, 0, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj20",
                "transform":[
                    {"translate":[131,0,-50]}
                ],
                "child": ${this.objectJson("box",scale, color, 20)}
            }
        ` 
    }

    private drawObject21(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj21",
                "transform":[
                    {"translate":[136,0,-42]}
                ],
                "child": ${this.drawObject1Type(21)}
            }
        `
    }

    private drawObject22(): string {
        return `
            {
                "type":"transform",
                "name":"place-obj21",
                "transform":[
                    {"translate":[126,0,-27]}
                ],
                "child": ${this.drawObject1Type(22)}
            }
        `
    }
    
    private drawObject23(): string {
        let scale: number[] = [10, 20, -15]
        let color: number[] = [1, 0, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj20",
                "transform":[
                    {"translate":[136,0,-29.5]}
                ],
                "child": ${this.objectJson("box",scale, color, 23)}
            }
        ` 
    }

    private drawObject24(): string {
        let scale: number[] = [5, 20, -10]
        let color: number[] = [1, 0, 0]
        return `
            {
                "type":"transform",
                "name":"place-obj20",
                "transform":[
                    {"translate":[12.5,0,-5]}
                ],
                "child": ${this.objectJson("box",scale, color, 24)}
            }
        ` 
    }
    




    private drawObject1Type(objNum: number): string {
        let boxScale: number[] = [10,50, -10]
        let boxColor: number[] = [0.5, 0.5, 0.5]
        let cylinderScale: number[] = [10, 5, -10]
        let cylinderColor: number[] = [1, 1, 1]
        let coneScale: number[] = [10, 10, -10]
        let coneColor: number[] = [170 / 255, 130 / 255, 51 / 255]
        return this.boxPlusMinaret(boxScale, boxColor, cylinderScale, cylinderColor, coneScale, coneColor, objNum);
    }

    private boxPlusMinaret (boxScale: number[], boxColor: number[], cylinderScale: number[], cylinderColor: number[], 
        coneScale: number[], coneColor: number[], objNum: number): string {
        return `
        {
            "type":"group",
            "children":[${this.objectJson("box", boxScale, boxColor, objNum)},
                {
                    "type":"transform",
                    "name":"cylinder-obj${objNum}",
                    "transform":[
                        {"translate":[0,50,0]}
                    ],
                    "child": ${this.drawMinaret(cylinderScale, cylinderColor, coneScale, coneColor, objNum)}
                }
            ]
        }`
    }

    private object5(): string {
        let baseScale: number[] = [25, 20, -25]
        let baseColor: number[] = [0.5, 0.5, 0.5]
        let towerScale: number[] = [22, 25, -22]
        let towerColor: number[] = [1, 0, 0]
        let bigMinCylScale: number[] = [20, 40, -20]
        let bigMinCylColor: number[] = [1, 1, 1]
        let bigMinConeScale: number[] = [20, 20, -20]
        let bigMinConeColor: number[] = [1, 0, 1]
        let smallMinCylScale: number[] = [8, 30, -8]
        let smallMinCylColor: number[] = [0.5, 0.5, 0.5]
        let smallMinConeScale: number[] = [8, 10, -8]
        let smallMinConeColor: number[] = [1, 0, 1]
        return `
        {
            "type":"group",
            "children":[${this.objectJson("box", baseScale, baseColor, 5)},
                {
                    "type":"transform",
                    "name":"cylinder-obj5",
                    "transform":[
                        {"translate":[0,20,0]}
                    ],
                    "child": 
                    {
                        "type":"group",
                        "children":[${this.objectJson("cylinder", towerScale, towerColor, 5)},
                        {
                            "type":"transform",
                            "name":"mainMinaret-obj5",
                            "transform":[
                                {"translate":[0,12.5,0]}
                            ],
                            "child": ${this.drawMinaret(bigMinCylScale, bigMinCylColor, bigMinConeScale, bigMinConeColor, 5)}
                        },
                        {
                            "type":"transform",
                            "name":"mini-Minaret1-obj5",
                            "transform":[
                                {"translate":[${bigMinCylScale[0] / 2}, 10, 0]}
                            ],
                            "child": ${this.drawMinaret(smallMinCylScale, smallMinCylColor, smallMinConeScale, smallMinConeColor, 5)}
                        },
                        {
                            "type":"transform",
                            "name":"mini-Minaret2-obj5",
                            "transform":[
                                {"translate":[0,10,${-bigMinCylScale[0] / 2}]}
                            ],
                            "child": ${this.drawMinaret(smallMinCylScale, smallMinCylColor, smallMinConeScale, smallMinConeColor, 5)}
                        },
                        {
                            "type":"transform",
                            "name":"mini-Minaret1-obj5",
                            "transform":[
                                {"translate":[${-bigMinCylScale[0] / 2},10,0]}
                            ],
                            "child": ${this.drawMinaret(smallMinCylScale, smallMinCylColor, smallMinConeScale, smallMinConeColor, 5)}
                        },
                        {
                            "type":"transform",
                            "name":"mini-Minaret1-obj5",
                            "transform":[
                                {"translate":[0,10,${bigMinCylScale[0] / 2}]}
                            ],
                            "child": ${this.drawMinaret(smallMinCylScale, smallMinCylColor, smallMinConeScale, smallMinConeColor, 5)}
                        }
                        ]
                    }
                }
            ]
        }`
    }


    private drawMinaret(cylinderScale: number[], cylinderColor: number[], coneScale: number[], coneColor: number[], objNum: number): string {
        return `{
            "type":"group",
            "children":[${this.objectJson("cylinder", cylinderScale, cylinderColor, objNum)},
                {
                    "type":"transform",
                    "name":"cone-obj${objNum}",
                    "transform":[
                        {"translate":[0,${cylinderScale[1]},0]}
                    ],
                    "child": ${this.objectJson("cone", coneScale, coneColor, objNum)}
                }
            ]
        }`
    }

    private objectJson (type: string, scale: number[], color: number[], objNum: number): string {
        let normalizeCenter = 0.25;
        let normalizeYscale = 2
        if (type === "box") {
            normalizeCenter = 0.5
            normalizeYscale = 1
        }
        return `{
            "type":"transform",
            "name":"${type}-obj${objNum}",
            "transform":[
                {"scale":[${scale[0]}, ${normalizeYscale * scale[1]}, ${scale[2]}]},
                {"translate":[0,${normalizeCenter},0]}
            ],
            "child": {
                    "type":"object",
                    "instanceof":"${type}",
                    "material": {
                        "color":[${color[0]}, ${color[1]}, ${color[2]}]
                    }
            }
            
        }`
    } 

    

    //a JSON representation of a simple scene graph
    private json(): string {
        return `
        {
            "instances": [
                {
                    "name":"sphere",
                    "path":"models/sphere.obj"
                },
                {
                    "name":"box",
                    "path":"models/box.obj"
                },
                {
                    "name":"cylinder",
                    "path":"models/cylinder.obj"
                },
                {
                    "name":"cone",
                    "path":"models/cone.obj"
                }
            ],
            "root": {
                "type":"group",
                "children":[
                {
                    "type":"transform",
                    "transform":[
                        {"scale":[50,5,50]}
                    ],
                    "child": {
                        "type":"object",
                        "instanceof":"box",
                        "material": {
                            "color":[0.5,0.5,0.5]
                        }
                    }
                },
                {
                    "type":"transform",
                    "name":"face",
                    "transform":[
                        {"translate":[0,25,0]}
                    ],        
                    "child": {
                        "type":"group",
                        "children": [
                            {
                                "type":"transform",
                                "name":"actualface",
                                "transform":[
                                    {"scale":[20,25,20]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[1,1,0.8]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"lefteye",
                                "transform":[
                                    {"translate":[7,15,12]},
                                    {"scale":[3,4,3]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[0,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"righteye",
                                "transform":[
                                    {"translate":[-7,15,12]},
                                    {"scale":[3,4,3]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[0,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"nose",
                                "transform":[
                                    {"translate":[0,10,10]},
                                    {"rotate":[90,1,0,0]},
                                    {"scale":[5,20,5]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"cylinder",
                                    "material": {
                                        "color":[1,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"hat",
                                "transform":[
                                    {"translate":[0,20,0]},
                                    {"scale":[10,25,10]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"cone",
                                    "material": {
                                        "color":[1,0,1]
                                    }
                                }
                            }
                        ]
                    }
                }]
            }
        }
        `;
        return `
        {
            "instances": [
            {
                "name": "box",
                "path": "models/box.obj"
            },
            {
                "name": "aeroplane",
                "path": "models/aeroplane.obj"
            }
            ],
            "root": {
                "type": "group",
                "name": "root",
                "children": [
                    {
                        "type":"transform",
                        "name": "box-transform",
                        "transform": [
                            {"scale": [50,50,50]}
                        ],
                        "child": {
                            "type": "object",
                            "name": "boxnode",
                            "instanceof": "box",
                            "material": {
                                "color": [1,0,0]
                            }
                        }
                    },
                    {
                        "type":"transform",
                        "name": "aeroplane-transform",
                        "transform": [
                        {"rotate": [180,0,1,0]},
                        {"rotate": [90,1,0,0]},
                        {"scale": [30,30,30]}
                        ],
                        "child": {
                            "type": "object",
                            "name": "aeroplane-node",
                            "instanceof": "aeroplane",
                            "material": {
                                "color": [1,1,0]
                            }
                        }
                    }
                ]
            }
        }
        `;
    }


   

    public animate(): void {
        this.time += 1;
        if (this.scenegraph != null) {
            this.scenegraph.animate(this.time, this.planeAttribs, this.numPlanePositions, this.generateLookAtMatrix(false));
        }
        this.draw();
    }

    public draw(): void {

        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);

        if (this.scenegraph == null) {
            return;
        }

        this.gl.useProgram(this.shaderProgram)

        while (!this.modelview.isEmpty())
            this.modelview.pop();

        /*
         *In order to change the shape of this triangle, we can either move the vertex positions above, or "transform" them
         * We use a modelview matrix to store the transformations to be applied to our triangle.
         * Right now this matrix is identity, which means "no transformations"
         */
        this.modelview.push(mat4.create());
        this.modelview.push(mat4.clone(this.modelview.peek()));
        switch (this.viewType) {
            case ViewType.TurnTable:
                    mat4.lookAt(this.modelview.peek(), vec3.fromValues(80 + (this.radius * Math.sin(this.time * 0.01)), 140, -27.5 + this.radius * Math.cos(this.time * 0.01)),
                    vec3.fromValues(80, 20, -27.5), vec3.fromValues(0, 1, 0));
                    break;
            case ViewType.BirdsEye:
                    mat4.lookAt(this.modelview.peek(), vec3.fromValues(80, 175, -27.5), vec3.fromValues(80, 0, -27.5), vec3.fromValues(0, 0, -1));
                    break;
            case ViewType.Front:
                    mat4.lookAt(this.modelview.peek(), vec3.fromValues(80, 90, 60), vec3.fromValues(60, 20, -27.5), vec3.fromValues(0, 1, 0));
                    break;
            case ViewType.CockPit:
                    mat4.multiply(this.modelview.peek(), this.generateLookAtMatrix(true), this.modelview.peek());
                    break
            default:
                    mat4.lookAt(this.modelview.peek(), vec3.fromValues(100, 150, 160), vec3.fromValues(80, 20, -27.5), vec3.fromValues(0, 1, 0));
                    break;
        }

        let lights = this.scenegraph.findLights(this.modelview);

        //send all the light colors
        for (let i: number = 0; i < lights.length; i++) {
            let ambientLocation: string = "light[" + i + "].ambient";
            let diffuseLocation: string = "light[" + i + "].diffuse";
            let specularLocation: string = "light[" + i + "].specular";
            let lightPositionLocation: string = "light[" + i + "].position";
            this.gl.uniform4fv(this.shaderLocations.getUniformLocation(lightPositionLocation), lights[i].getPosition());
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation(ambientLocation), lights[i].getAmbient());
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation(diffuseLocation), lights[i].getDiffuse());
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation(specularLocation), lights[i].getSpecular());
        }
        

        this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("proj"), false, this.proj);



        this.scenegraph.draw(this.modelview);
    }

    public freeMeshes(): void {
        this.scenegraph.dispose();
    }

    public setFeatures(features: Features): void {
    }

    public generateLookAtMatrix(placeCamera: boolean): mat4 {
        let index = this.time % this.numPlanePositions;
        let next = (index + 1) % this.numPlanePositions;
        let cameraPos: vec3 = this.planeAttribs.getPositionByIndex(index);
        let lookAt: vec3 = this.planeAttribs.getPositionByIndex(next);
        let newCameraPos: vec3 = vec3.create();
        if (placeCamera) {
            let planeDirection: vec3 = vec3.create();
            planeDirection = vec3.subtract(planeDirection, cameraPos, lookAt);
            planeDirection = vec3.normalize(planeDirection, planeDirection);
            planeDirection = vec3.scale(planeDirection, planeDirection, 4.5);
            vec3.subtract(newCameraPos, cameraPos, planeDirection);  
        } else {
            newCameraPos = cameraPos;
        }    
        let w: vec3 = vec3.create();
        vec3.normalize(w, vec3.subtract(w, cameraPos, lookAt))
        let v: vec3 = vec3.create();
        vec3.normalize(v, this.planeAttribs.getUpVecByIndex(index));
        let u: vec3 = vec3.create();
        vec3.normalize(u, vec3.cross(u, v, w));
        let lookAtMatrix : mat4 = mat4.fromValues(
            u[0], u[1], u[2], -(vec3.dot(newCameraPos, u)),
            v[0], v[1], v[2], -(vec3.dot(newCameraPos, v)),
            w[0], w[1], w[2], -(vec3.dot(newCameraPos, w)),
            0, 0, 0, 1);
        return mat4.transpose(lookAtMatrix, lookAtMatrix);
    }

}
import { View } from "View"
import * as OBJ from "webgl-obj-loader"
import { mat4 } from "gl-matrix"
import { Material } from "%COMMON/Material"

export interface Features {
}
export class Controller implements Features {
    private view: View;

    constructor(view: View) {
        this.view = view;
        this.view.setFeatures(this);
    }

    public go(): void {
        this.view.initShaders(this.getVShader(), this.getFShader());
        this.view.initScenegraph();
        this.view.initPlaneAttribs();
        this.view.draw();
    }

    private getVShader(): string {
        return `attribute vec4 vPosition;
        uniform vec4 vColor;
        uniform mat4 proj;
        uniform mat4 modelview;
        varying vec4 outColor;
        
        void main()
        {
            gl_Position = proj * modelview * vPosition;
            outColor = vColor;
        }
        `;
    }

    private getFShader(): string {
        return `precision mediump float;
        varying vec4 outColor;
    
        void main()
        {
            gl_FragColor = outColor;
        }
        `;
    }

}
import { vec3 } from "gl-matrix";

export namespace PlaneAttributesImporter {
    /**
     * 
     * @param name the name of the mesh
     * @param producer a producer for vertices to store data
     * @return promise that can be waited on
     */
    export function downloadPlaneAttributes(name: string): Promise<PlaneAttributes> {
        return new Promise((resolve) => {
            fetch(name) 
            .then(response => response.text()) 
            .then(data => resolve(new PlaneAttributes(data)));
        });
    }
}

export class PlaneAttributes {
    readonly numTokens: number = 6;
    private numPositions: number; 
    private listPositions: vec3[] = [];
    private listUpVecs: vec3[] = [];

    public constructor(text: string) {
        this.parseString(text);
    }

    private parseString(text: string): void {
        text = text.trim();
        let lines: string[] = text.split(/\r?\n/);
        
        lines.forEach((line, index) => {
            line = line.trim();
            if (index === 0) {
                this.numPositions = parseInt(line);
            } else {
                //console.log(line);
                let splitArray: string[] = line.split(/\s+/);
                let splitFloatArray: number[] = splitArray.map(x => parseFloat(x))
                // console.log(splitFloatArray);
                if (splitArray.length === this.numTokens) {
                    // console.log(vec3.fromValues(splitFloatArray[0], splitFloatArray[1], splitFloatArray[2]));
                    this.listPositions.push(vec3.fromValues(splitFloatArray[0], splitFloatArray[1], splitFloatArray[2]))
                    this.listUpVecs.push(vec3.fromValues(splitFloatArray[3], splitFloatArray[4], splitFloatArray[5]))
                    //console.log(this.listPositions);
                } 
            }
        });
    }

    public getNumPositions() {
        return this.numPositions;
    }

    public getPositionByIndex(index: number) {
        return this.listPositions[index];
    }

    public getUpVecByIndex(index: number) {
        return this.listUpVecs[index];
    }
}


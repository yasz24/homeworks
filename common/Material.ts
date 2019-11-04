import { vec3 } from "gl-matrix"

/**
 * This class represents material. Material is represented using (a) ambient (b)
 * diffuse (c) specular (d) emission (for materials that emit light themselves)
 * It also has coefficients for shininess, absorption, reflection (for
 * reflective material), transparency (for transparent material) and refractive
 * index (for transparent material). For the latter ones, the user must make
 * sure that absorption + reflection + transparency = 1
 */
export class Material {
    private emission: vec3;
    private ambient: vec3;
    private diffuse: vec3;
    private specular: vec3;
    private shininess: number;
    private absorption: number;
    private reflection: number;
    private transparency: number;
    private refractive_index: number;

    constructor() {
        this.emission = vec3.create();
        this.ambient = vec3.create();
        this.diffuse = vec3.create();
        this.specular = vec3.create();
        this.init();
    }

    public Material(mat: Material) {
        this.emission = new vec3(mat.getEmission());
        this.ambient = new vec3(mat.getAmbient());
        this.diffuse = new vec3(mat.getDiffuse());
        this.specular = new vec3(mat.getSpecular());
        this.setShininess(mat.getShininess());
        this.setAbsorption(mat.getAbsorption());
        this.setReflection(mat.getReflection());
        this.setTransparency(mat.getTransparency());
        this.setRefractiveIndex(mat.getRefractiveIndex());
    }


    public init(): void {
        this.setEmission([0.0, 0.0, 0.0]);
        this.setAmbient([0.0, 0.0, 0.0]);
        this.setDiffuse([0.0, 0.0, 0.0]);
        this.setSpecular([0.0, 0.0, 0.0]);
        this.setShininess(0.0);
        this.setAbsorption(1);
        this.setReflection(0);
        this.setTransparency(0);
    }

    public setEmission(emission: vec3 | number[]): void {
        this.emission = vec3.fromValues(emission[0], emission[1], emission[2]);
    }


    public setAmbient(ambient: vec3 | number[]): void {
        this.ambient = vec3.fromValues(ambient[0], ambient[1], ambient[2]);
    }


    public setDiffuse(diffuse: vec3 | number[]): void {
        this.diffuse = vec3.fromValues(diffuse[0], diffuse[1], diffuse[2]);
    }

    public setSpecular(specular: vec3 | number[]): void {
        this.specular = vec3.fromValues(specular[0], specular[1], specular[2]);
    }

    public setShininess(r: number): void {
        this.shininess = r;
    }

    public setAbsorption(a: number): void {
        this.absorption = a;
    }

    public setReflection(r: number): void {
        this.reflection = r;
    }

    public setTransparency(t: number): void {
        this.transparency = t;
        this.ambient[3] = this.diffuse[3] = this.specular[3] = this.emission[3] = 1 - t;
    }

    public setRefractiveIndex(r: number): void {
        this.refractive_index = r;
    }

    public getEmission(): vec3 {
        return vec3.fromValues(this.emission[0], this.emission[1], this.emission[2]);
    }

    public getAmbient(): vec3 {
        return vec3.fromValues(this.ambient[0], this.ambient[1], this.ambient[2]);
    }

    public getDiffuse(): vec3 {
        return vec3.fromValues(this.diffuse[0], this.diffuse[1], this.diffuse[2]);
    }

    public getSpecular(): vec3 {
        return vec3.fromValues(this.specular[0], this.specular[1], this.specular[2]);
    }

    public getShininess(): number {
        return this.shininess;
    }

    public getAbsorption(): number {
        return this.absorption;
    }

    public getReflection(): number {
        return this.reflection;
    }

    public getTransparency(): number {
        return this.transparency;
    }

    public getRefractiveIndex(): number {
        return this.refractive_index;
    }
}
